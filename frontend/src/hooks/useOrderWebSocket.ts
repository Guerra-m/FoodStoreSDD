import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getOrderWebSocketUrl } from '../api/orders';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface WsEstadoEvent {
  type: 'estado_actualizado';
  pedido_id: number;
  estado_anterior: string;
  estado_nuevo: string;
  descripcion: string;
  timestamp: string;
  historial: Array<{
    estado: string;
    descripcion: string;
    timestamp: string;
    usuario_id: number | null;
  }>;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'fallback';

interface UseOrderWebSocketOptions {
  /** Intervalo de polling de fallback en ms (default: 30000) */
  fallbackInterval?: number;
  /** Máximo de reintentos de conexión (default: 5) */
  maxRetries?: number;
}

interface UseOrderWebSocketResult {
  /** Estado actual de la conexión */
  connectionStatus: ConnectionStatus;
  /** Último evento recibido (null si aún no llegó ninguno) */
  lastEvent: WsEstadoEvent | null;
  /** Error de conexión si ocurrió */
  connectionError: string | null;
  /** Forzar reconexión manual */
  reconnect: () => void;
}

/**
 * Hook para conectarse al WebSocket de tracking de pedidos.
 *
 * - Se conecta automáticamente cuando `pedidoId` no es null.
 * - Reconexión automática con exponential backoff.
 * - Fallback a polling de React Query si se agotan los reintentos.
 * - Invalida la query cache al recibir un evento.
 */
export function useOrderWebSocket(
  pedidoId: number | null,
  options: UseOrderWebSocketOptions = {},
): UseOrderWebSocketResult {
  const {
    fallbackInterval = 30000,
    maxRetries = 5,
  } = options;

  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastEvent, setLastEvent] = useState<WsEstadoEvent | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Limpiar timers
  const clearTimers = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  // Activar polling de fallback
  const enableFallback = useCallback(() => {
    if (fallbackTimerRef.current) return;
    setConnectionStatus('fallback');
    // Invalidar la query periódicamente para forzar refetch
    fallbackTimerRef.current = setInterval(() => {
      if (pedidoId !== null) {
        queryClient.invalidateQueries({ queryKey: ['orders', 'detail', pedidoId] });
      }
    }, fallbackInterval);
  }, [fallbackInterval, pedidoId, queryClient]);

  // Desactivar polling de fallback
  const disableFallback = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  // Conectar WebSocket
  const connect = useCallback(() => {
    if (!pedidoId) return;

    // Cerrar conexión anterior si existe
    if (wsRef.current) {
      wsRef.current.onclose = null; // evitar que dispare el cleanup
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionStatus('connecting');
    setConnectionError(null);

    const url = getOrderWebSocketUrl(pedidoId);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) {
        ws.close();
        return;
      }
      setConnectionStatus('connected');
      retryCountRef.current = 0;
      disableFallback();
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(event.data) as WsEstadoEvent;
        if (data.type === 'estado_actualizado') {
          setLastEvent(data);
          // Invalidar cache de React Query para refrescar el detalle
          queryClient.invalidateQueries({ queryKey: ['orders', 'detail', pedidoId] });
          queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
        }
      } catch {
        // Mensaje no JSON, ignorar (ej: "pong")
      }
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setConnectionError('Error de conexión WebSocket');
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      wsRef.current = null;

      if (retryCountRef.current < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 16000);
        retryCountRef.current += 1;
        setConnectionStatus('connecting');
        setConnectionError(`Reconectando en ${delay / 1000}s... (intento ${retryCountRef.current}/${maxRetries})`);

        retryTimerRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connect();
          }
        }, delay);
      } else {
        // Agotados los reintentos → fallback a polling
        setConnectionStatus('fallback');
        setConnectionError('Conexión en tiempo real no disponible. Actualizando cada 30s.');
        enableFallback();
      }
    };
  }, [pedidoId, maxRetries, queryClient, disableFallback, enableFallback]);

  // Reconexión manual
  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    clearTimers();
    disableFallback();
    connect();
  }, [clearTimers, disableFallback, connect]);

  // Efecto principal: conectar cuando cambia pedidoId
  useEffect(() => {
    mountedRef.current = true;

    if (pedidoId !== null) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      clearTimers();
      disableFallback();

      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [pedidoId, connect, clearTimers, disableFallback]);

  return {
    connectionStatus,
    lastEvent,
    connectionError,
    reconnect,
  };
}
