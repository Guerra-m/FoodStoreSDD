## Context

La aplicación FoodStore actualmente tiene toda su funcionalidad implementada (catálogo, carrito, pedidos, pagos, admin), pero la experiencia de usuario es básica:

- **Loading states**: Textos planos como "Cargando..." en todas las páginas. Sin skeletons ni indicadores visuales.
- **Feedback**: No hay sistema de notificaciones. El usuario no recibe feedback cuando agrega un producto al carrito, crea un pedido, o ocurre un error.
- **Confirmación de pedido**: Después de crear un pedido, la UX es abrupta — no hay una pantalla de confirmación visual.
- **Retorno de pago**: El componente PaymentForm tiene estados visuales básicos, pero no hay integración con el flujo de retorno de MercadoPago ni pantalla de resultado pulida.

Todo el UI usa inline styles. No hay un sistema de diseño formal, pero eso está fuera del alcance de este change.

## Goals / Non-Goals

**Goals:**
- Implementar un sistema de skeletons reutilizables para reemplazar todos los textos "Cargando..."
- Integrar `react-toastify` (ya instalado) para toasts en operaciones clave
- Crear una pantalla de confirmación de pedido post-creación
- Mejorar el feedback visual de retorno de MercadoPago
- Ampliar el `uiStore` para manejar estado global de toasts y UI state

**Non-Goals:**
- NO rediseñar el sistema de estilos (sigue siendo inline styles + Tailwind utility classes)
- NO cambiar la arquitectura de componentes existente
- NO tocar el backend ni las APIs
- NO agregar un design system completo ni storybook
- NO cambiar la lógica de negocio existente

## Decisions

### 1. Skeletons: Tailwind `animate-pulse` + componentes dedicados
- **Decisión**: Crear componentes Skeleton reutilizables usando clases Tailwind `animate-pulse` con `bg-gray-200` y shapes específicos (rect, circle, text).
- **Razón**: No requiere instalar librerías extra. Tailwind ya está presente y `animate-pulse` da el efecto deseado. Los componentes son simples y tipables.
- **Alternativa descartada**: `react-loading-skeleton` — es una dependencia más para algo que podemos hacer con 3 líneas de Tailwind.

### 2. Toasts: react-toastify (ya instalado)
- **Decisión**: Usar `react-toastify` directamente. Ya está en `package.json`. Configurar un `ToastContainer` global en `App.tsx` y crear un hook `useToast` que envuelva las funciones de react-toastify.
- **Razón**: Cero instalaciones nuevas. La librería es madura, accesible y soporta tipos de notificación (success, error, warning, info).
- **Integración**: Las operaciones de carrito (agregar item), creación de pedido, y errores de API gatillarán toasts.

### 3. Ampliación de uiStore
- **Decisión**: Agregar al `uiStore` un estado para controlar la visibilidad de toasts programáticos y métricas de UI compartidas.
- **Razón**: El store ya existe y usa Zustand. Es el lugar natural para estado UI transversal.
- **Qué se agrega**: Manejo básico de toast queue para casos donde necesitemos control programático (ej. mostrar toast después de una redirección).

### 4. Pantalla de confirmación de pedido
- **Decisión**: Nueva ruta `/order-confirmation/:orderId` que muestra un resumen visual del pedido creado.
- **Razón**: La creación de pedido actualmente no tiene una pantalla de "éxito" clara. Separar la confirmación en su propia ruta permite:
  - Mostrar toda la información del pedido (items, total, dirección, estado de pago)
  - Ser bookmarkeable (el usuario puede volver a verla)
  - Integrar el retorno de MercadoPago redirigiendo a esta ruta
- **Componentes**: `OrderConfirmationPage` + `OrderSummaryCard` reutilizable

### 5. Feedback de MercadoPago
- **Decisión**: Mejorar el `PaymentForm` para que maneje correctamente los estados de retorno (success, failure, pending) con una pantalla visual clara y acciones según el resultado.
- **Razón**: Actualmente los estados existen en el `paymentStore` pero la UI es básica. Un diseño más cuidado mejora la confianza del usuario.
- **Flujo**: El webhook de MP actualiza el estado del pago → el frontend polling o redirect muestra la pantalla correspondiente → botones de acción (volver al catálogo, ver pedido, reintentar).

## Risks / Trade-offs

- **[UX] Tiempo de skeletons muy corto**: Si los datos cargan muy rápido (<300ms), el skeleton titila y se ve peor que un loading text. → Mitigación: Usar `min-loading-time` de 300ms para evitar flicker.
- **[Dependencias] react-toastify v11**: Puede tener cambios de API respecto a versiones anteriores. → Mitigación: Ya está instalada y funcionando, verificar docs si hay breaking changes.
- **[Rendimiento] Múltiples skeletons en grid**: En el catálogo con 20+ productos, si renderizamos 20 skeletons simultáneamente puede haber repaint. → Mitigación: Usar `aspect-ratio` en los skeletons para evitar layout shift y limitar skeleton count a 6-8 con "show more".
- **[Accesibilidad] Skeletons sin ARIA**: Los usuarios de screen readers no deben escuchar "Cargando..." repetido. → Mitigación: Usar `aria-busy="true"` en el contenedor y `aria-label` descriptivo en los skeletons.
- **[Flujo] Retorno de MP sin orderId**: Si el usuario llega desde MP sin un orderId en la URL. → Mitigación: Usar `mpPaymentId` del paymentStore para buscar la orden asociada, o mostrar pantalla genérica de resultado.
