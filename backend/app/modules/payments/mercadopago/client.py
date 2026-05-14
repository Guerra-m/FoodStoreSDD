"""
Cliente wrapper para la SDK de MercadoPago.
Abstrae la complejidad del SDK y provee métodos específicos del dominio.
"""
from typing import Optional
import logging

import mercadopago
from app.core.config import settings

logger = logging.getLogger(__name__)


class MercadoPagoClient:
    """
    Wrapper alrededor del SDK oficial de MercadoPago.
    
    Proporciona métodos específicos para el dominio de FoodStore,
    ocultando la complejidad del SDK y centralizando la configuración.
    """

    def __init__(self):
        """Inicializa el cliente de MercadoPago con el access token."""
        if not settings.MERCADOPAGO_ACCESS_TOKEN:
            raise ValueError(
                "MERCADOPAGO_ACCESS_TOKEN no está configurado. "
                "Verifica las variables de entorno."
            )
        self.sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)
        self.public_key = settings.MERCADOPAGO_PUBLIC_KEY
        self.webhook_url = settings.MERCADOPAGO_WEBHOOK_URL

    def create_preference(
        self,
        external_reference: str,
        items: list[dict],
        back_urls: Optional[dict] = None,
        notification_url: Optional[str] = None,
    ) -> dict:
        """
        Crea una preferencia de pago en MercadoPago.

        Args:
            external_reference: ID del pedido como string (para tracking).
            items: Lista de items con title, quantity, unit_price, etc.
            back_urls: URLs de retorno (success, failure, pending).
            notification_url: URL del webhook para notificaciones IPN.

        Returns:
            Dict con la respuesta de la API de MercadoPago.
        """
        preference_data = {
            "external_reference": external_reference,
            "items": items,
            "auto_return": "approved",
            "back_urls": back_urls or {
                "success": "http://localhost:5173/pedidos/{external_reference}",
                "failure": "http://localhost:5173/pedidos/{external_reference}",
                "pending": "http://localhost:5173/pedidos/{external_reference}",
            },
            "notification_url": notification_url or self.webhook_url,
            "statement_descriptor": "FOOD STORE",
        }

        result = self.sdk.preference().create(preference_data)
        return result

    def get_payment(self, payment_id: int) -> Optional[dict]:
        """
        Obtiene el detalle de un pago por su ID de MercadoPago.

        Args:
            payment_id: ID del pago en MercadoPago.

        Returns:
            Dict con los datos del pago, o None si no existe.
        """
        try:
            result = self.sdk.payment().get(payment_id)
            return result
        except Exception as e:
            logger.error(f"Error al obtener payment {payment_id}: {e}")
            return None
