import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'fallback';

interface AdminWsOrderUpdate {
  type: 'order_updated';
  order: {
    id: number;
    estado: string;
    estado_anterior: string;
    cliente_nombre: string;
    total: number;
    items_count: number;
    creado_en: string;
  };
}

interface UseAdminOrdersWebSocketResult {
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
  reconnect: () => void;
}

/**
 * Hook para conectarse al WebSocket global de administradores.
 *
 * Recibe broadcasts de TODOS los cambios de estado de pedidos
 * e invalida la cache de React Query automáticamente.
 */
export function useAdminOrdersWebSocket(): UseAdminOrdersWebSocketResult {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const MAX_RETRIES = 5;
  const FALLBACK_INTERVAL = 30000;

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

  const enableFallback = useCallback(() => {
    if (fallbackTimerRef.current) return;
    setConnectionStatus('fallback');
    fallbackTimerRef.current = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    }, FALLBACK_INTERVAL);
  }, [queryClient]);

  const disableFallback = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    // Obtener token JWT desde la fuente canónica (lib/auth)
    const token = localStorage.getItem('auth_access_token');
    if (!token) {
      setConnectionStatus('disconnected');
      setConnectionError('No hay sesión activa');
      return;
    }

    // Cerrar conexión anterior
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8006/api/v1';
    const wsBase = baseUrl.replace(/^http/, 'ws');
    const url = `${wsBase}/pedidos/admin/ws?token=${encodeURIComponent(token)}`;

    setConnectionStatus('connecting');
    setConnectionError(null);

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
        const data = JSON.parse(event.data) as AdminWsOrderUpdate;
        if (data.type === 'order_updated') {
          // Invalidar queries de admin para refrescar el Kanban
          queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'order', data.order.id] });
        }
      } catch {
        // Ignorar mensajes no JSON (ej: "pong")
      }
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setConnectionError('Error de conexión WebSocket');
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      wsRef.current = null;

      if (retryCountRef.current < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 16000);
        retryCountRef.current += 1;
        setConnectionStatus('connecting');
        setConnectionError(`Reconectando en ${delay / 1000}s... (intento ${retryCountRef.current}/${MAX_RETRIES})`);

        retryTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, delay);
      } else {
        setConnectionStatus('fallback');
        setConnectionError('Conexión en tiempo real no disponible. Actualizando cada 30s.');
        enableFallback();
      }
    };
  }, [queryClient, disableFallback, enableFallback]);

  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    clearTimers();
    disableFallback();
    connect();
  }, [clearTimers, disableFallback, connect]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

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
  }, [connect, clearTimers, disableFallback]);

  return { connectionStatus, connectionError, reconnect };
}
