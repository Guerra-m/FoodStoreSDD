## 1. Cleanup CSS Legacy de MP

- [x] 1.1 Eliminar bloque `.mp-payment-form` de `index.css`
- [x] 1.2 Eliminar bloque `.payment-form-wrapper` de `index.css`
- [x] 1.3 Eliminar bloque `[id^="cardPaymentBrick_container"]` de `index.css`
- [x] 1.4 Agregar `.card-payment-container` con solo `min-height` básico

## 2. Simplificar PaymentForm

- [x] 2.1 Reemplazar `payment-form-wrapper` por `card-payment-container` en `PaymentForm.tsx`
- [x] 2.2 Agregar `customization.visual` al `<CardPayment>` con `hideFormTitle: true`
- [x] 2.3 Agregar `customization.visual.style.customVariables` con colores del design system

## 3. Verificar

- [x] 3.1 Probar que el brick de CardPayment cargue sin errores en el modal de MisPedidos
- [x] 3.2 Verificar que el layout del brick se vea correcto
