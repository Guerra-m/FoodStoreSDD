import { toast } from 'react-toastify';

/**
 * Hook que expone funciones de toast tipadas para uso consistente en la app.
 * Mensajes optimizados para experiencia de usuario moderna.
 */
export function useToast() {
  return {
    success: (message: string) =>
      toast.success(message, {
        position: 'top-right',
        autoClose: 3000,
        theme: 'light',
      }),

    error: (message: string) =>
      toast.error(message, {
        position: 'top-right',
        autoClose: 4000,
        theme: 'light',
      }),

    warning: (message: string) =>
      toast.warning(message, {
        position: 'top-right',
        autoClose: 3500,
        theme: 'light',
      }),

    info: (message: string) =>
      toast.info(message, {
        position: 'top-right',
        autoClose: 3000,
        theme: 'light',
      }),
  };
}

// Funciones helper con mensajes predefinidos y más amigables
export const ToastMessages = {
  // Éxitos
  createSuccess: (entity: string) => `${entity} creado exitosamente`,
  updateSuccess: (entity: string) => `${entity} actualizado correctamente`,
  deleteSuccess: (entity: string) => `${entity} eliminado correctamente`,
  saveSuccess: (entity: string) => `${entity} guardado correctamente`,
  restoreSuccess: (entity: string) => `${entity} restaurado correctamente`,

  // Errores
  createError: (entity: string) => `Error al crear ${entity.toLowerCase()}`,
  updateError: (entity: string) => `Error al actualizar ${entity.toLowerCase()}`,
  deleteError: (entity: string) => `Error al eliminar ${entity.toLowerCase()}`,
  saveError: (entity: string) => `Error al guardar ${entity.toLowerCase()}`,
  loadError: (entity: string) => `Error al cargar ${entity.toLowerCase()}`,

  // Validaciones
  invalidPrice: 'El precio debe ser mayor a 0',
  invalidField: (field: string) => `El campo ${field} es requerido`,
  selectAddress: 'Por favor, selecciona una dirección de entrega',
  loginRequired: 'Debes iniciar sesión para continuar',

  // Confirmaciones
  loggedOut: 'Sesión cerrada correctamente',
  sessionExpired: 'Tu sesión ha expirado. Por favor, iniciá sesión nuevamente.',

  // Carrito
  addedToCart: (qty: number, name: string) => `${qty}x ${name} agregado al carrito`,
  orderCreated: (orderId: number) => `¡Pedido #${orderId} creado con éxito!`,

  // Usuarios
  rolesUpdated: 'Roles actualizados correctamente',
  userDeleted: 'Usuario eliminado correctamente',
  userRestored: 'Usuario restaurado correctamente',
};