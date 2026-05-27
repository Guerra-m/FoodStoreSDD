## Context

El CardPayment brick de MercadoPago se renderiza dentro de un **iframe** cross-origin, lo que significa que el CSS externo NO puede controlar el layout interno de los campos (card number, expiry, CVV, cardholder name, etc.). Intentos previos de fix acumularon ~30 líneas de CSS global con `!important`, `overflow: hidden`, y `min-height` forzados que probablemente interferían con el cálculo de dimensiones del iframe.

## Goals / Non-Goals

**Goals:**
- Eliminar todo el CSS legacy de MP que pueda interferir con el renderizado del iframe
- Proveer solo el contorno mínimo necesario (contenedor con altura mínima para evitar flash de layout)
- Pasar CSS custom variables al brick via `customization.visual.style.customVariables` para que los colores coincidan con el design system del proyecto

**Non-Goals:**
- NO modificar el layout interno del iframe (imposible desde CSS externo)
- NO cambiar la versión del SDK (`@mercadopago/sdk-react@1.0.7`)
- NO migrar a otro método de integración (Checkout Pro, etc.)

## Decisions

| Decisión | Alternativa | Por qué |
|----------|-------------|---------|
| Eliminar TODO el CSS legacy en vez de modificarlo | Mantenerlo y ajustar valores | El CSS legacy tenía `!important` y `overflow:hidden` en contenedores del brick, lo que podía interferir con cálculos internos del iframe. Partir de cero es más limpio y permite aislar el problema. |
| Usar `customization.visual.style.customVariables` | No pasar customization | Las variables CSS permiten que el brick use colores del design system (textPrimaryColor, baseColor, etc.) sin depender de CSS externo que el iframe ignora. |
| Agregar `hideFormTitle: true` | Dejar el título visible | El título del formulario de MP ocupa espacio vertical innecesario y puede contribuir a problemas de layout en contenedores angostos. |

## Risks / Trade-offs

- **[Riesgo] El fix del brick podría no funcionar** si el problema de layout está dentro del iframe y no es causado por el CSS legacy. → Mitigación: al eliminar todo el CSS legacy, podemos aislar la causa raíz. Si el brick sigue roto incluso con el contenedor limpio, el problema está del lado de MP y no podemos resolverlo desde el frontend.
- **[Trade-off] Perdemos control visual**: al sacar los estilos `!important`, el brick queda con su apariencia default de MP. → Aceptable porque el `customVariables` recupera los colores clave del design system.
