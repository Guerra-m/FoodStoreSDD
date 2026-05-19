import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initMercadoPago } from '@mercadopago/sdk-react'

// Inicializar MercadoPago con la Public Key del entorno
initMercadoPago(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)