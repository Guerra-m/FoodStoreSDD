"""
Service para el módulo de Pagos (MercadoPago)

Integración con MercadoPago SDK para:
- Creación de pagos con tarjeta tokenizada (crear_pago)
- Procesamiento de webhooks IPN con validación HMAC (procesar_webhook)
"""
import hashlib
import hmac
import json
import uuid
from typing import Any, Dict, Optional, Tuple

import mercadopago
from sqlmodel import Session, select

from app.core.config import settings
from app.modules.pagos.model import Pago
from app.modules.pagos.repository import PagoRepository
from app.modules.pagos.schema import PagoResponse
from app.modules.pedidos.model import Pedido
from app.modules.pedidos.service import PedidoService


class PagoService:
    """
    Servicio de pagos con integración MercadoPago SDK.

    Gestiona el ciclo de vida de un pago:
    1. crear_pago: llama al SDK, persiste el Pago con mp_payment_id
    2. procesar_webhook: valida firma, consulta estado en MP, llama a la FSM
    """

    def __init__(self, session: Session):
        self.session = session
        self.repo = PagoRepository(session)
        self.sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)

    # ────────────────────────
    #  crear_preferencia (Checkout Pro)
    # ────────────────────────

    def crear_preferencia(
        self, pedido_id: int, user_id: int
    ) -> Tuple[Optional[Dict[str, str]], Optional[str]]:
        """
        Crea una preferencia de MercadoPago Checkout Pro con back_urls.

        Flujo:
        1. Valida que el pedido existe y pertenece al usuario
        2. Obtiene los items del pedido con sus snapshots
        3. Crea la preferencia vía ``sdk.preference().create()``
        4. Retorna ``preference_id`` e ``init_point`` para redirigir al usuario

        Args:
            pedido_id: ID del pedido.
            user_id: ID del usuario para validación de propiedad.

        Returns:
            (dict con preference_id e init_point, None) si exitoso.
            (None, mensaje_error) si falla.
        """
        # 1. Validar pedido existe y pertenece al usuario
        pedido_service = PedidoService(self.session)
        pedido, error = pedido_service.obtener_por_id(pedido_id, user_id)
        if error:
            return None, error

        frontend_url = settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:5173"

        # 2. Armar items de la preferencia
        items = []
        for item in pedido.items:
            nombre = item.producto_snapshot.get("nombre", f"Producto #{item.producto_id}")
            items.append({
                "title": nombre,
                "quantity": item.cantidad,
                "unit_price": float(item.precio_unitario / 100),  # centavos → decimal
                "currency_id": "ARS",
            })

        # Si no hay items (por algún motivo), poner un item genérico
        if not items:
            items.append({
                "title": f"Pedido #{pedido.id}",
                "quantity": 1,
                "unit_price": float(pedido.total / 100),
                "currency_id": "ARS",
            })

        preference_data: Dict[str, Any] = {
            "items": items,
            "external_reference": str(pedido.id),
            "auto_return": "approved",
            "back_urls": {
                "success": f"{frontend_url}/payment-result?status=approved&external_reference=order_{pedido.id}",
                "failure": f"{frontend_url}/payment-result?status=rejected&external_reference=order_{pedido.id}",
                "pending": f"{frontend_url}/payment-result?status=pending&external_reference=order_{pedido.id}",
            },
            "statement_descriptor": "FOODSTORE",
            "notification_url": f"{frontend_url}/api/v1/pagos/webhook",
        }

        try:
            # 4. Llamar MP SDK para crear la preferencia
            mp_response = self.sdk.preference().create(preference_data)

            # 5. Validar respuesta del SDK
            if mp_response.get("status") not in (200, 201):
                return None, (
                    f"Error de MercadoPago al crear preferencia: "
                    f"{mp_response.get('status', 'unknown')} — "
                    f"{mp_response.get('response', {})}"
                )

            mp_response_data = mp_response.get("response", {})
            preference_id = mp_response_data.get("id")
            init_point = mp_response_data.get("init_point") or mp_response_data.get("sandbox_init_point")

            if not preference_id or not init_point:
                return None, "MercadoPago no devolvió ID de preferencia o init_point"

            return {"preference_id": preference_id, "init_point": init_point}, None

        except Exception as exc:
            return None, f"Error al crear preferencia en MercadoPago: {str(exc)}"

    # ────────────────────────
    #  crear_pago
    # ────────────────────────

    def crear_pago(
        self, pedido_id: int, card_token: str, user_email: str, user_id: int
    ) -> Tuple[Optional[PagoResponse], Optional[str]]:
        """
        Crea un pago vía MercadoPago SDK.

        Flujo:
        1. Valida que el pedido existe y pertenece al usuario
        2. Genera UUID idempotency_key
        3. Llama a ``sdk.payment().create()`` con token de tarjeta
        4. Inserta Pago en BD con mp_payment_id devuelto por MP

        Args:
            pedido_id: ID del pedido a pagar.
            card_token: Token de tarjeta generado por el frontend SDK.
            user_email: Email del pagador (requerido por MP).
            user_id: ID del usuario para validación de propiedad.

        Returns:
            (PagoResponse, None) si exitoso.
            (None, mensaje_error) si falla.
        """
        # 1. Validar pedido existe y pertenece al usuario
        pedido_service = PedidoService(self.session)
        pedido, error = pedido_service.obtener_por_id(pedido_id, user_id)
        if error:
            return None, error

        # 2. Generar idempotency_key
        idempotency_key = str(uuid.uuid4())

        # 3. Preparar datos de pago para MP
        payment_data: Dict[str, Any] = {
            "transaction_amount": float(pedido.total / 100),  # centavos → decimal
            "token": card_token,
            "description": f"Pedido #{pedido.id}",
            "installments": 1,
            "payment_method_id": "visa",
            "payer": {"email": user_email},
            "idempotency_key": idempotency_key,
            "external_reference": str(pedido.id),
        }

        try:
            # 4. Llamar MP SDK
            mp_response = self.sdk.payment().create(payment_data)

            # 5. Validar respuesta del SDK
            if mp_response.get("status") not in (200, 201):
                return None, (
                    f"Error de MercadoPago: {mp_response.get('status', 'unknown')} — "
                    f"{mp_response.get('response', {})}"
                )

            mp_response_data = mp_response.get("response", {})
            mp_payment_id = mp_response_data.get("id")
            mp_status = mp_response_data.get("status", "pending")
            status_detail = mp_response_data.get("status_detail")

            # 6. Crear Pago en BD
            pago = Pago(
                pedido_id=pedido_id,
                mp_payment_id=mp_payment_id,
                mp_status=mp_status,
                status_detail=status_detail,
                idempotency_key=idempotency_key,
                external_reference=str(pedido.id),
            )
            pago_creado = self.repo.create(pago)

            return self._to_response(pago_creado), None

        except Exception as exc:
            self.session.rollback()
            return None, f"Error al procesar el pago: {str(exc)}"

    # ────────────────────────
    #  procesar_webhook
    # ────────────────────────

    def procesar_webhook(
        self, body: bytes, headers: Dict[str, str]
    ) -> Tuple[int, Dict[str, Any]]:
        """
        Procesa un webhook IPN de MercadoPago.

        Flujo:
        1. Valida HMAC-SHA256 del body contra ``X-Signature``
        2. Extrae ``data.id`` (mp_payment_id) y ``type`` / ``topic``
        3. Si el topic no es ``"payment"`` → 200 (ack)
        4. Consulta ``sdk.payment().get(mp_payment_id)`` para estado actual
        5. Deduplica: si Pago ya existe con ese mp_payment_id → 200
        6. Obtiene ``external_reference`` → pedido_id
        7. Si el pedido no existe → 202 (race condition, MP reintentará)
        8. Si mp_status es ``"approved"`` → llama a la FSM
        9. Inserta Pago y retorna 200

        Args:
            body: Raw body de la petición (bytes).
            headers: Diccionario de headers HTTP.

        Returns:
            (status_code, body_dict) para construir la respuesta HTTP.
        """
        # ── 1. Validar HMAC ──────────────────────────────────────────────
        x_signature = (
            headers.get("X-Signature")
            or headers.get("x-signature")
            or ""
        )

        if x_signature:
            expected = self._compute_hmac(body, settings.MP_WEBHOOK_SECRET)
            received = self._extract_hmac_from_header(x_signature)

            if not hmac.compare_digest(expected, received):
                return 401, {"error": "Firma HMAC inválida"}

        # ── 2. Parsear body JSON ────────────────────────────────────────
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            return 400, {"error": "JSON inválido en el body"}

        # ── 3. Extraer topic y mp_payment_id ────────────────────────────
        topic = payload.get("type") or payload.get("topic", "")
        data = payload.get("data", {})
        mp_payment_id = data.get("id") if isinstance(data, dict) else None

        if topic != "payment":
            return 200, {"message": "Ignored", "topic": topic}

        if not mp_payment_id:
            return 400, {"error": "Campo data.id ausente en el payload"}

        # ── 4. Consultar payment details en MP API ──────────────────────
        try:
            mp_payment = self.sdk.payment().get(mp_payment_id)
            if mp_payment.get("status") != 200:
                return 202, {
                    "error": "No se pudo obtener el payment de MP",
                    "mp_status": mp_payment.get("status"),
                }
            mp_data = mp_payment.get("response", {})
        except Exception:
            return 202, {"error": "Error al consultar payment en MP"}

        mp_status = mp_data.get("status", "pending")
        status_detail = mp_data.get("status_detail")
        external_reference = mp_data.get("external_reference")

        # ── 5. Dedup por mp_payment_id ──────────────────────────────────
        pago_existente = self.repo.get_by_mp_payment_id(mp_payment_id)
        if pago_existente:
            # Actualizar estado si cambió (ej: pending → approved)
            if pago_existente.mp_status != mp_status:
                pago_existente.mp_status = mp_status
                pago_existente.status_detail = status_detail
                self.session.add(pago_existente)
                self.session.commit()

                # Si recién se aprobó, transicionar FSM
                if mp_status == "approved":
                    self._transicionar_si_corresponde(
                        pago_existente.pedido_id, mp_status
                    )

            return 200, {
                "message": "Already processed",
                "mp_payment_id": mp_payment_id,
            }

        # ── 6. Obtener pedido_id desde external_reference ───────────────
        if not external_reference:
            return 400, {"error": "external_reference ausente en el payment de MP"}

        try:
            pedido_id = int(external_reference)
        except (ValueError, TypeError):
            return 400, {"error": "external_reference no es un entero válido"}

        # ── 7. Verificar que el pedido existe ───────────────────────────
        statement = select(Pedido).where(Pedido.id == pedido_id)
        pedido = self.session.exec(statement).first()
        if not pedido:
            return 202, {
                "message": "Pedido no encontrado — posible race condition, MP reintentará",
                "pedido_id": pedido_id,
            }

        # ── 8. Crear Pago PRIMERO (en sesión, sin commit aún) ──────────
        pago = Pago(
            pedido_id=pedido_id,
            mp_payment_id=mp_payment_id,
            mp_status=mp_status,
            status_detail=status_detail,
            idempotency_key=str(uuid.uuid4()),
            external_reference=external_reference,
        )
        self.session.add(pago)

        # ── 9. Transicionar FSM si approved ─────────────────────────────
        # El FSM commit dentro de transicionar_estado() también persiste
        # el Pago que ya está en la sesión. Si el FSM falla y hace rollback,
        # el Pago también se revierte.
        if mp_status == "approved":
            self._transicionar_si_corresponde(pedido_id, mp_status)
        else:
            try:
                self.session.commit()
            except Exception:
                self.session.rollback()
                return 500, {"error": "Error al persistir el pago"}

        return 200, {
            "message": "Processed",
            "mp_payment_id": mp_payment_id,
            "mp_status": mp_status,
        }

    # ────────────────────────
    #  helpers privados
    # ────────────────────────

    def _transicionar_si_corresponde(self, pedido_id: int, mp_status: str) -> None:
        """
        Si MP reporta ``approved``, intenta transicionar el pedido a ``pagado``
        vía la FSM. Es **idempotente**: si el pedido ya está en ``pagado``
        la FSM retorna error y se ignora silenciosamente.
        """
        if mp_status != "approved":
            return

        try:
            pedido_service = PedidoService(self.session)
            pedido_service.transicionar_estado(
                pedido_id=pedido_id,
                accion="pagar",
                usuario_id=None,
                usuario_rol="Sistema",
            )
        except Exception:
            # Si falla (ej: pedido ya pagado, estado terminal, etc.)
            # el Pago ya fue persistido, no hay que romper el webhook
            self.session.rollback()

    @staticmethod
    def _compute_hmac(body: bytes, secret: str) -> str:
        """Computa HMAC-SHA256 del body en bytes."""
        h = hmac.new(secret.encode("utf-8"), body, hashlib.sha256)
        return h.hexdigest()

    @staticmethod
    def _extract_hmac_from_header(x_signature: str) -> str:
        """
        Extrae el valor HMAC del header ``X-Signature``.

        Soporta dos formatos:
        - ``ts=...,v1=<hex>`` → extrae ``v1``
        - ``<hex>`` directo    → usa el valor completo
        """
        for part in x_signature.split(","):
            part = part.strip()
            if part.startswith("v1="):
                return part[3:]
        return x_signature.strip()

    @staticmethod
    def _to_response(pago: Pago) -> PagoResponse:
        """Convierte un modelo ``Pago`` a ``PagoResponse``."""
        return PagoResponse(
            id=pago.id,
            pedido_id=pago.pedido_id,
            mp_payment_id=pago.mp_payment_id,
            mp_status=pago.mp_status,
            status_detail=pago.status_detail,
            external_reference=pago.external_reference,
            created_at=pago.created_at,
        )
