import api from './axios';
import type {
  DashboardStats,
  RevenueResponse,
  TopProductsResponse,
  OrdersByStatusResponse,
  UserAdminListResponse,
  UserAdmin,
  UpdateRolesRequest,
  AdminOrderListResponse,
  AdminOrderDetail,
  UpdateOrderStatusRequest,
} from '../types/admin';

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const getDashboardStats = () =>
  api.get<DashboardStats>('/admin/dashboard/stats').then((r) => r.data);

export const getDashboardRevenue = (period: 'daily' | 'monthly' = 'daily') =>
  api.get<RevenueResponse>('/admin/dashboard/revenue', { params: { period } }).then((r) => r.data);

export const getDashboardTopProducts = () =>
  api.get<TopProductsResponse>('/admin/dashboard/top-products').then((r) => r.data);

export const getDashboardOrdersByStatus = () =>
  api.get<OrdersByStatusResponse>('/admin/dashboard/orders-by-status').then((r) => r.data);

// ─── Users ───────────────────────────────────────────────────────────────────

export interface ListUsersParams {
  page?: number;
  per_page?: number;
  search?: string;
  role?: string;
  include_deleted?: boolean;
}

export const listUsers = (params: ListUsersParams = {}) =>
  api.get<UserAdminListResponse>('/admin/users', { params }).then((r) => r.data);

export const getUserById = (id: number) =>
  api.get<UserAdmin>(`/admin/users/${id}`).then((r) => r.data);

export const updateUserRoles = (id: number, data: UpdateRolesRequest) =>
  api.put<UserAdmin>(`/admin/users/${id}/roles`, data).then((r) => r.data);

export const deleteUser = (id: number) =>
  api.delete<UserAdmin>(`/admin/users/${id}`).then((r) => r.data);

export const restoreUser = (id: number) =>
  api.post<UserAdmin>(`/admin/users/${id}/restore`).then((r) => r.data);

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface ListOrdersParams {
  page?: number;
  per_page?: number;
  estado?: string;
  date_from?: string;
  date_to?: string;
  cliente_id?: number;
}

export const listAdminOrders = (params: ListOrdersParams = {}) =>
  api.get<AdminOrderListResponse>('/admin/orders', { params }).then((r) => r.data);

export const getAdminOrderDetail = (id: number) =>
  api.get<AdminOrderDetail>(`/admin/orders/${id}`).then((r) => r.data);

export const updateOrderStatus = (id: number, data: UpdateOrderStatusRequest) =>
  api.put<AdminOrderDetail>(`/admin/orders/${id}/status`, data).then((r) => r.data);
