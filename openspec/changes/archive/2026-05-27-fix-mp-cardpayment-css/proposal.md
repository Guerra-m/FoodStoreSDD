## Why

El CardPayment brick de MercadoPago se renderiza con problemas de layout: placeholders y labels superpuestos, campos fuera de posición. El CSS legacy acumulado de intentos de fix anteriores (overflow:hidden, min-height con !important) interfería con el renderizado interno del iframe del brick.

## What Changes

- Limpiar TODO el CSS custom legacy de MP en `index.css` (`.mp-payment-form`, `.payment-form-wrapper`, `[id^="cardPaymentBrick_container"] > div { overflow: hidden }`, etc.)
- Reemplazar `payment-form-wrapper` por un contenedor limpio `card-payment-container` con solo `min-height` básico
- Agregar `customization.visual` al `<CardPayment>` con:
  - `hideFormTitle: true` — ocultar título del formulario
  - `style.customVariables` — colores coordinados con el design system del proyecto

## Capabilities

### New Capabilities
- _(none — no new capabilities, only implementation fixes)_

### Modified Capabilities
- _(none — no spec-level requirement changes, only CSS/rendering fixes)_

## Impact

- `frontend/src/index.css` — eliminados ~30 líneas de CSS legacy de MP
- `frontend/src/components/PaymentForm.tsx` — wrapper simplificado + customization visual
