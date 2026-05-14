"""
Tests unitarios para el módulo de MercadoPago.
Mockea el SDK de MercadoPago para probar la lógica del wrapper.
"""
from unittest.mock import patch, MagicMock
import pytest

from app.modules.payments.mercadopago.client import MercadoPagoClient


class TestMercadoPagoClient:
    """Tests unitarios para MercadoPagoClient"""

    def test_init_sin_access_token_raise_error(self):
        """3.1: Sin access_token configurado debe lanzar error."""
        with patch("app.modules.payments.mercadopago.client.settings") as mock_settings:
            mock_settings.MERCADOPAGO_ACCESS_TOKEN = ""
            with pytest.raises(ValueError, match="MERCADOPAGO_ACCESS_TOKEN no está configurado"):
                MercadoPagoClient()

    @patch("app.modules.payments.mercadopago.client.settings")
    @patch("app.modules.payments.mercadopago.client.mercadopago")
    def test_create_preference_exitoso(self, mock_mp, mock_settings):
        """3.2: Crear preferencia debe llamar al SDK y retornar la respuesta."""
        # Configurar mocks
        mock_settings.MERCADOPAGO_ACCESS_TOKEN = "TEST-123"
        mock_settings.MERCADOPAGO_PUBLIC_KEY = "TEST-PUB-123"
        mock_settings.MERCADOPAGO_WEBHOOK_URL = "https://ejemplo.com/webhook"

        mock_sdk_instance = MagicMock()
        mock_mp.SDK.return_value = mock_sdk_instance

        mock_preference = MagicMock()
        mock_sdk_instance.preference.return_value = mock_preference
        mock_preference.create.return_value = {
            "status": 201,
            "response": {
                "id": "123456789",
                "init_point": "https://www.mercadopago.com.ar/checkout/123",
            }
        }

        # Ejecutar
        client = MercadoPagoClient()
        items = [{"title": "Producto 1", "quantity": 2, "unit_price": 50.0, "currency_id": "ARS"}]
        result = client.create_preference(
            external_reference="42",
            items=items,
        )

        # Verificar
        assert result["status"] == 201
        assert result["response"]["id"] == "123456789"
        assert "init_point" in result["response"]

        # Verificar que se llamó al SDK con los datos correctos
        mock_preference.create.assert_called_once()
        call_kwargs = mock_preference.create.call_args[0][0]
        assert call_kwargs["external_reference"] == "42"
        assert call_kwargs["items"] == items
        assert "notification_url" in call_kwargs
        assert call_kwargs["statement_descriptor"] == "FOOD STORE"

    @patch("app.modules.payments.mercadopago.client.settings")
    @patch("app.modules.payments.mercadopago.client.mercadopago")
    def test_get_payment_exitoso(self, mock_mp, mock_settings):
        """3.3: Obtener detalle de pago debe retornar los datos."""
        mock_settings.MERCADOPAGO_ACCESS_TOKEN = "TEST-123"
        mock_settings.MERCADOPAGO_PUBLIC_KEY = "TEST-PUB-123"
        mock_settings.MERCADOPAGO_WEBHOOK_URL = "https://ejemplo.com/webhook"

        mock_sdk_instance = MagicMock()
        mock_mp.SDK.return_value = mock_sdk_instance

        mock_payment = MagicMock()
        mock_sdk_instance.payment.return_value = mock_payment
        mock_payment.get.return_value = {
            "status": 200,
            "response": {
                "id": 789,
                "status": "approved",
                "external_reference": "42",
            }
        }

        client = MercadoPagoClient()
        result = client.get_payment(789)

        assert result is not None
        assert result["response"]["status"] == "approved"
        mock_payment.get.assert_called_once_with(789)

    @patch("app.modules.payments.mercadopago.client.settings")
    @patch("app.modules.payments.mercadopago.client.mercadopago")
    def test_get_payment_error_retorna_none(self, mock_mp, mock_settings):
        """3.3: Error al obtener pago debe retornar None sin lanzar excepción."""
        mock_settings.MERCADOPAGO_ACCESS_TOKEN = "TEST-123"
        mock_settings.MERCADOPAGO_PUBLIC_KEY = "TEST-PUB-123"
        mock_settings.MERCADOPAGO_WEBHOOK_URL = "https://ejemplo.com/webhook"

        mock_sdk_instance = MagicMock()
        mock_mp.SDK.return_value = mock_sdk_instance

        mock_payment = MagicMock()
        mock_sdk_instance.payment.return_value = mock_payment
        mock_payment.get.side_effect = Exception("Network error")

        client = MercadoPagoClient()
        result = client.get_payment(789)

        assert result is None
