import api from './axios';

// Tipos para el carrito (del cartStore)
export interface CartItem {
  productoId: number;
  nombre: string;
  priceInCents: number;
  cantidad: number;
  ingredientesExcluidos?: number[];
}

// Tipos para crear un pedido
export interface OrderCreate {
  items: {
    producto_id: number;
    cantidad: number;
    ingredientes_excluidos: number[];
  }[];
  direccion_id: number;
}

// Tipo para item del pedido (respuesta)
export interface OrderItemResponse {
  id: number;
  producto_id: number;
  producto_snapshot: {
    nombre: string;
    price_in_cents: number;
  };
  cantidad: number;
  precio_unitario: number;
  ingredientes_excluidos: number[];
}

// Tipo para historial del pedido
export interface OrderHistorialResponse {
  id: number;
  estado: string;
  timestamp: string;
  usuario_id: number | null;
  descripcion: string;
}

// Tipo para pedido completo (respuesta)
export interface OrderResponse {
  id: number;
  cliente_id: number;
  direccion_id: number;
  direccion_snapshot: {
    calle: string;
    numero: string;
    ciudad: string;
    provincia: string;
    codigo_postal: string;
    piso?: string;
    departamento?: string;
    observaciones?: string;
  };
  total: number;
  estado: string;
  payment_status?: string | null;
  creado_en: string;
  actualizado_en: string;
  items: OrderItemResponse[];
  historial: OrderHistorialResponse[];
}

// Tipo para lista de pedidos
export interface OrderListResponse {
  pedidos: OrderResponse[];
  total: number;
  page: number;
  per_page: number;
}

// API
export const orderApi = {
  // Crear un nuevo pedido desde el carrito
  create: async (carrito: CartItem[], direccionId: number): Promise<OrderResponse> => {
    const orderData: OrderCreate = {
      items: carrito.map((item) => ({
        producto_id: item.productoId,
        cantidad: item.cantidad,
        ingredientes_excluidos: item.ingredientesExcluidos || [],
      })),
      direccion_id: direccionId,
    };
    const response = await api.post('/pedidos', orderData);
    return response.data;
  },

  // Listar pedidos del cliente
  list: async (page = 1, perPage = 20): Promise<OrderListResponse> => {
    const response = await api.get('/pedidos', {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  // Obtener detalle de un pedido
  getById: async (orderId: number): Promise<OrderResponse> => {
    const response = await api.get(`/pedidos/${orderId}`);
    return response.data;
  },

  // Obtener historial de un pedido
  getHistorial: async (orderId: number): Promise<OrderHistorialResponse[]> => {
    const response = await api.get(`/pedidos/${orderId}/historial`);
    return response.data;
  },
};

// Utilidad para formatear precio
export const formatPrice = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

// Utilidad para formatear fecha
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Utilidad para traducir estado
export const getEstadoLabel = (estado: string): string => {
  const labels: Record<string, string> = {
    pendiente: 'Pendiente',
    pagado: 'Pagado',
    preparando: 'Preparando',
    enviado: 'Enviado',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  };
  return labels[estado] || estado;
};

// Utilidad para color de estado
export const getEstadoColor = (estado: string): string => {
  const colors: Record<string, string> = {
    pendiente: '#f59e0b', // amber
    pagado: '#10b981', // green
    preparando: '#3b82f6', // blue
    enviado: '#8b5cf6', // purple
    entregado: '#059669', // emerald
    cancelado: '#ef4444', // red
  };
  return colors[estado] || '#6b7280';
};

// ─── Payment status helpers ───────────────────────────────────────────────────

/** Traduce el payment_status de MercadoPago a un label legible */
export const getPaymentStatusLabel = (status?: string | null): string => {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    in_process: 'En proceso',
    in_mediation: 'En mediación',
    cancelled: 'Cancelado',
    refunded: 'Reintegrado',
    charged_back: 'Contracargo',
  };
  return status ? labels[status] || status : '—';
};

/** Retorna un color en hex para el badge de payment_status */
export const getPaymentStatusColor = (status?: string | null): string => {
  const colors: Record<string, string> = {
    pending: '#f59e0b',     // amber
    approved: '#10b981',    // green
    rejected: '#ef4444',    // red
    in_process: '#3b82f6',  // blue
    in_mediation: '#f59e0b', // amber
    cancelled: '#6b7280',   // gray
    refunded: '#8b5cf6',    // purple
    charged_back: '#dc2626', // dark red
  };
  return status ? colors[status] || '#6b7280' : '#6b7280';
};