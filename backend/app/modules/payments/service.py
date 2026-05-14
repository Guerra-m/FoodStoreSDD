"""
Service para el módulo de Pagos (MercadoPago).
Maneja creación de preferencias, procesamiento de webhooks,
idempotencia e integración con Order FSM.
"""
import hashlib
import hmac
import json
import logging
from datetime import datetime
from typing import Optional, Tuple

from sqlmodel import Session

from app.core.config import settings
from app.modules.payments.model import PagoTransaccion, EstadoPago
from app.modules.payments.schema import (
    PreferenciaPagoResponse,
    PagoEstadoResponse,
)
from app.modules.payments.repository import PagoRepository
from app.modules.payments.mercadopago.client import MercadoPagoClient
from app.modules.pedidos.service import PedidoService
from app.modules.pedidos.fsm import OrderFSM

logger = logging.getLogger(__name__)


class MercadoPagoService:
    """
    Servicio que orquesta la integración con MercadoPago.
    
    Responsabilidades:
    - Crear preferencias de pago para pedidos pendientes
    - Procesar notificaciones IPN (webhooks)
    - Garantizar idempotencia en el procesamiento de webhooks
    - Integrar con la FSM de pedidos para transicionar a "pagado"
    """

    def __init__(self, session: Session):
        self.session = session
        self.repo = PagoRepository(session)
        self.mp_client = MercadoPagoClient()
        self.pedido_service = PedidoService(session)

    def crear_preferencia(
        self, pedido_id: int, cliente_id: int
    ) -> Tuple[Optional[PreferenciaPagoResponse], Optional[str]]:
        """
        Crea una preferencia de pago para un pedido pendiente.

        Args:
            pedido_id: ID del pedido a pagar.
            cliente_id: ID del cliente que solicita el pago.

        Returns:
            (PreferenciaPagoResponse, None) si exitoso.
            (None, mensaje_error) si falla.
        """
        # 1. Validar que el pedido existe y pertenece al cliente
        pedido, error = self.pedido_service.obtener_por_id(pedido_id, cliente_id)
        if error:
            return None, error

        # 2. Validar que el pedido está en estado pendiente
        if pedido.estado != "pendiente":
            return None, (
                f"El pedido debe estar en estado pendiente para generar un pago. "
                f"Estado actual: '{pedido.estado}'"
            )

        # 3. Verificar si ya existe una preferencia activa para este pedido
        ultima_transaccion = self.repo.get_ultima_by_pedido(pedido_id)
        if ultima_transaccion and ultima_transaccion.estado == EstadoPago.PENDIENTE.value:
            # Devolver la preferencia existente
            return PreferenciaPagoResponse(
                preference_id=ultima_transaccion.mercadopago_preference_id or "",
                init_point=ultima_transaccion.metadata.get("init_point", ""),
            ), None

        # 4. Construir items para MercadoPago desde el pedido
        items_mp = []
        for item in pedido.items:
            items_mp.append({
                "title": item.producto_snapshot.get("nombre", f"Producto #{item.producto_id}"),
                "quantity": item.cantidad,
                "unit_price": item.precio_unitario / 100,  # MP trabaja en decimales
                "currency_id": "ARS",
            })

        # 5. Crear preferencia en MercadoPago
        try:
            result = self.mp_client.create_preference(
                external_reference=str(pedido_id),
                items=items_mp,
            )
        except Exception as e:
            logger.error(f"Error al crear preferencia en MercadoPago: {e}")
            return None, "El servicio de pago no está disponible. Intente nuevamente."

        # 6. Verificar respuesta de MercadoPago
        if result.get("status") not in (200, 201):
            logger.error(f"Error en respuesta de MercadoPago: {result}")
            return None, "Error al comunicarse con el servicio de pago."

        response_data = result.get("response", {})

        # 7. Persistir la transacción
        transaccion = PagoTransaccion(
            pedido_id=pedido_id,
            mercadopago_preference_id=response_data.get("id"),
            estado=EstadoPago.PENDIENTE.value,
            metadata={
                "init_point": response_data.get("init_point", ""),
                "preference_data": response_data,
            },
        )
        self.repo.create(transaccion)

        return PreferenciaPagoResponse(
            preference_id=response_data.get("id", ""),
            init_point=response_data.get("init_point", ""),
        ), None

    def procesar_webhook(
        self, body: dict, headers: dict
    ) -> Tuple[bool, Optional[str]]:
        """
        Procesa una notificación IPN entrante de MercadoPago.

        Args:
            body: Cuerpo de la notificación (JSON).
            headers: Headers HTTP de la notificación.

        Returns:
            (True, None) si se procesó correctamente.
            (False, mensaje_error) si hubo un error.
        """
        # 1. Validar firma del webhook
        if not self._validar_firma(headers, body):
            logger.warning("Firma de webhook inválida")
            # Retornamos True para no alertar a MP, pero no procesamos
            return True, None

        # 2. Extraer datos de la notificación
        topic = body.get("topic") or body.get("type")
        action = body.get("action")
        data = body.get("data") or {}
        payment_id = data.get("id") or body.get("id")

        logger.info(f"Webhook recibido: topic={topic}, action={action}, payment_id={payment_id}")

        # 3. Solo procesamos notificaciones de tipo "payment"
        if topic not in ("payment", "merchant_order") and not payment_id:
            logger.debug(f"Webhook ignorado (topic={topic})")
            return True, None

        # 4. Obtener detalle del pago desde MercadoPago
        payment_data = self.mp_client.get_payment(payment_id)
        if not payment_data:
            logger.error(f"No se pudo obtener detalle del payment {payment_id}")
            # Retornar 200 para evitar reintentos de MP
            return True, None

        payment_info = payment_data.get("response", {})
        mp_payment_id = payment_info.get("id")
        mp_status = payment_info.get("status")
        external_reference = payment_info.get("external_reference", "")

        if not mp_payment_id or not external_reference:
            logger.error(f"Payment {payment_id}: faltan datos críticos")
            return True, None

        # 5. Construir idempotency_key
        tipo_evento = f"payment.{mp_status}"
        idempotency_key = f"{mp_payment_id}_{tipo_evento}"

        # 6. Verificar idempotencia
        transaccion_existente = self.repo.get_by_idempotency_key(idempotency_key)
        if transaccion_existente:
            logger.info(f"Webhook duplicado ignorado: {idempotency_key}")
            return True, None

        # 7. Obtener pedido_id desde external_reference
        try:
            pedido_id = int(external_reference)
        except (ValueError, TypeError):
            logger.error(f"external_reference inválida: {external_reference}")
            return True, None

        # 8. Crear transacción
        transaccion = PagoTransaccion(
            pedido_id=pedido_id,
            mercadopago_payment_id=mp_payment_id,
            mercadopago_preference_id=payment_info.get("preference_id"),
            estado=self._map_mp_status(mp_status),
            tipo_evento=tipo_evento,
            metadata={
                "mp_payment_info": payment_info,
                "raw_body": body,
            },
            idempotency_key=idempotency_key,
        )

        try:
            # 9. Persistir transacción (con idempotencia)
            _, creada = self.repo.crear_si_no_existe(transaccion)
            if not creada:
                logger.info(f"Transacción duplicada ignorada: {idempotency_key}")
                return True, None

            # 10. Si el pago fue aprobado, transicionar el pedido a "pagado"
            if mp_status == "approved":
                self._transicionar_a_pagado(pedido_id)

            return True, None

        except Exception as e:
            logger.error(f"Error al procesar webhook para payment {mp_payment_id}: {e}")
            self.session.rollback()
            # Retornar True para que MP no reintente
            return True, None

    def _transicionar_a_pagado(self, pedido_id: int) -> None:
        """
        Transiciona un pedido a "pagado" usando la FSM.

        Se ejecuta como "Sistema" para la autorización de la FSM.
        """
        resultado, error, status_code = self.pedido_service.transicionar_estado(
            pedido_id=pedido_id,
            accion="pagar",
            usuario_id=0,  # Sistema
            usuario_rol="Sistema",
        )

        if error:
            # Si ya está pagado o en estado terminal, no es un error crítico
            logger.warning(
                f"No se pudo transicionar pedido {pedido_id} a pagado: {error}"
            )
        else:
            logger.info(f"Pedido {pedido_id} transicionado a pagado vía webhook")

    def consultar_estado_pago(
        self, pedido_id: int, cliente_id: int
    ) -> Tuple[Optional[PagoEstadoResponse], Optional[str]]:
        """
        Consulta el estado de pago de un pedido.

        Args:
            pedido_id: ID del pedido.
            cliente_id: ID del cliente (para verificar propiedad).

        Returns:
            (PagoEstadoResponse, None) si existe.
            (None, mensaje_error) si no existe o hay error.
        """
        # Verificar que el pedido existe y pertenece al cliente
        _, error = self.pedido_service.obtener_por_id(pedido_id, cliente_id)
        if error:
            return None, error

        ultima_transaccion = self.repo.get_ultima_by_pedido(pedido_id)
        if not ultima_transaccion:
            return PagoEstadoResponse(
                estado_pago="no_iniciado",
            ), None

        return PagoEstadoResponse(
            estado_pago=ultima_transaccion.estado,
            preferencia_pago_url=ultima_transaccion.metadata.get("init_point"),
            mercadopago_preference_id=ultima_transaccion.mercadopago_preference_id,
        ), None

    @staticmethod
    def _validar_firma(headers: dict, body: dict) -> bool:
        """
        Valida la firma HMAC de un webhook de MercadoPago.

        MP envía la firma en el header 'x-signature' con formato:
        ts=<timestamp>,v1=<hash>

        Args:
            headers: Headers HTTP de la solicitud.
            body: Cuerpo de la solicitud.

        Returns:
            True si la firma es válida, False en caso contrario.
        """
        webhook_secret = settings.MERCADOPAGO_WEBHOOK_SECRET
        if not webhook_secret:
            logger.warning("MERCADOPAGO_WEBHOOK_SECRET no configurado - saltando validación")
            return True

        x_signature = headers.get("x-signature") or headers.get("X-Signature")
        if not x_signature:
            logger.warning("Header x-signature no presente")
            return False

        try:
            # Parsear: ts=1234567890,v1=abcdef123...
            params = {}
            for part in x_signature.split(","):
                if "=" in part:
                    key, value = part.split("=", 1)
                    params[key.strip()] = value.strip()

            ts = params.get("ts")
            received_hash = params.get("v1")

            if not ts or not received_hash:
                return False

            # Construir el string a firmar: "id:<id>;topic:<topic>;ts:<ts>"
            data_id = body.get("data", {}).get("id", "") or body.get("id", "")
            topic = body.get("topic", "") or body.get("type", "")
            message = f"id:{data_id};topic:{topic};ts:{ts}"

            # Calcular HMAC
            expected_hash = hmac.new(
                webhook_secret.encode(),
                message.encode(),
                hashlib.sha256,
            ).hexdigest()

            return hmac.compare_digest(expected_hash, received_hash)

        except Exception as e:
            logger.error(f"Error al validar firma de webhook: {e}")
            return False

    @staticmethod
    def _map_mp_status(mp_status: str) -> str:
        """
        Mapea el status de MercadoPago a nuestro EstadoPago.

        Mapeo:
            approved → aprobado
            rejected → rechazado
            pending → pendiente
            in_process → en_proceso
            cancelled → cancelado
            refunded → cancelado
            charged_back → rechazado
        """
        status_map = {
            "approved": EstadoPago.APROBADO.value,
            "rejected": EstadoPago.RECHAZADO.value,
            "pending": EstadoPago.PENDIENTE.value,
            "in_process": EstadoPago.EN_PROCESO.value,
            "cancelled": EstadoPago.CANCELADO.value,
            "refunded": EstadoPago.CANCELADO.value,
            "charged_back": EstadoPago.RECHAZADO.value,
        }
        return status_map.get(mp_status, EstadoPago.PENDIENTE.value)
