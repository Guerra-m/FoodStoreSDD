// ─── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_users: number;
  total_orders: number;
  total_revenue: number;
  orders_by_status: OrdersByStatus[];
}

export interface OrdersByStatus {
  estado: string;
  cantidad: number;
}

export interface RevenuePoint {
  fecha: string;
  ingreso_total: number;
}

export interface RevenueResponse {
  period: 'daily' | 'monthly';
  data: RevenuePoint[];
}

export interface TopProduct {
  id: number;
  nombre: string;
  cantidad_vendida: number;
  ingreso_total: number;
}

export interface TopProductsResponse {
  data: TopProduct[];
}

export interface OrdersByStatusResponse {
  data: OrdersByStatus[];
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface UserAdmin {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  roles: string[];
  creado_en: string;
  eliminado_en: string | null;
}

export interface UserAdminListResponse {
  users: UserAdmin[];
  total: number;
  page: number;
  per_page: number;
}

export interface UpdateRolesRequest {
  roles: string[];
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface AdminOrderSummary {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  total: number;
  estado: string;
  items_count: number;
  creado_en: string;
}

export interface AdminOrderListResponse {
  orders: AdminOrderSummary[];
  total: number;
  page: number;
  per_page: number;
}

export interface AdminOrderItem {
  id: number;
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface AdminOrderHistory {
  id: number;
  estado: string;
  timestamp: string;
  usuario_id: number | null;
  descripcion: string;
}

export interface AdminPaymentInfo {
  mp_payment_id: number | null;
  mp_status: string;
  status_detail: string | null;
  created_at: string;
}

export interface AdminOrderDetail {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  cliente_email: string;
  total: number;
  estado: string;
  direccion_snapshot: Record<string, unknown>;
  creado_en: string;
  actualizado_en: string;
  items: AdminOrderItem[];
  historial: AdminOrderHistory[];
  pago: AdminPaymentInfo | null;
}

export interface UpdateOrderStatusRequest {
  accion: string;
}
