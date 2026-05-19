/**
 * types/ — barrel export for all shared type definitions
 */

export type { CartItemId, CartItem, AddToCartParams, CartActions, CartState, CartSelectors, CartPersistedState } from "./shopping-cart";
export { CART_STORAGE_KEY, CART_STORAGE_VERSION } from "./shopping-cart";

export type {
  User,
  AuthToken,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  AuthContextType,
  TokenPayload,
  UserResponse,
} from "./auth";

export type {
  DashboardStats,
  OrdersByStatus,
  RevenuePoint,
  RevenueResponse,
  TopProduct,
  TopProductsResponse,
  OrdersByStatusResponse,
  UserAdmin,
  UserAdminListResponse,
  UpdateRolesRequest,
  AdminOrderSummary,
  AdminOrderListResponse,
  AdminOrderItem,
  AdminOrderHistory,
  AdminPaymentInfo,
  AdminOrderDetail,
  UpdateOrderStatusRequest,
} from "./admin";
