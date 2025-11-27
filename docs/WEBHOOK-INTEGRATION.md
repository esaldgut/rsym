# MIT Payment Gateway - Webhook Integration

**Status**: ✅ FASE 1 Completada (2025-10-31)

Sistema completo de webhooks para manejo de notificaciones de pago desde MIT Payment Gateway.

---

## 📋 Resumen Ejecutivo

**Objetivo**: Recibir notificaciones automáticas de cambios en el estado de pagos desde MIT y actualizar las reservaciones correspondientes.

**Eventos Soportados**:
- `payment.completed` → Marca reservación como PROCESSED
- `payment.failed` → Mantiene MIT_PAYMENT_PENDING
- `payment.cancelled` → Marca como AWAITING_MANUAL_PAYMENT

**Seguridad**: Verificación HMAC SHA-256 de todas las solicitudes entrantes.

---

## 🏗️ Arquitectura

### Flujo Completo

```
MIT Payment Gateway
    ↓ POST /api/webhooks/mit
    ↓ Header: x-mit-signature (HMAC SHA-256)
    ↓
Webhook API Route
    ↓ Verify signature
    ↓ Parse event type
    ↓
confirmPaymentWebhookAction
    ↓ Query payment plan
    ↓ Update installment status
    ↓ Update reservation status
    ↓
Success/Failure Pages
    ↓ /marketplace/booking/success
    ↓ /marketplace/booking/failure
```

### Componentes Implementados

#### 1. API Route (`/api/webhooks/mit/route.ts`)
- **POST**: Recibe webhook de MIT
  - Verifica firma HMAC SHA-256
  - Parse payload JSON
  - Delega a server action según evento
- **GET**: Health check del endpoint
  - Verifica si webhook está configurado
  - Retorna estado activo

#### 2. Server Action (`webhook-actions.ts`)
- `confirmPaymentWebhookAction()`:
  - Determina nuevo estado de reservación
  - Actualiza installment si corresponde
  - Actualiza reservation status
  - Maneja lógica de CONTADO vs PLAZOS

#### 3. Success Page (`/marketplace/booking/success`)
- Confirmación visual con animación
- Resumen de reservación
- Estado de plan de pagos
- Próximos pasos para el usuario
- Botón de descarga de voucher (TODO: FASE 6)

#### 4. Failure Page (`/marketplace/booking/failure`)
- Mensaje de error amigable
- Razón del fallo traducida
- Soluciones sugeridas
- Botón de reintentar pago
- Contacto de soporte

#### 5. PaymentStatusBadge Component
- Badge visual con colores semánticos
- 6 estados soportados
- 3 tamaños (sm, md, lg)
- Iconos opcionales

---

## 🔐 Seguridad

### Verificación de Firma HMAC

Todas las solicitudes deben incluir header `x-mit-signature` con HMAC SHA-256 del payload:

```typescript
const signature = crypto
  .createHmac('sha256', MIT_WEBHOOK_SECRET)
  .update(rawPayload)
  .digest('hex');
```

### Comparison Timing-Safe

Se usa `crypto.timingSafeEqual()` para prevenir timing attacks:

```typescript
return crypto.timingSafeEqual(
  Buffer.from(signature),
  Buffer.from(expectedSignature)
);
```

### Variables de Entorno Requeridas

```bash
# .env.local
MIT_WEBHOOK_SECRET=your-secret-from-mit-dashboard
MIT_API_KEY=your-api-key-from-mit
MIT_ENVIRONMENT=sandbox  # or production
```

---

## 📡 Estructura de Eventos

### Event: payment.completed

```json
{
  "event": "payment.completed",
  "data": {
    "payment_id": "pay_abc123",
    "reservation_id": "res_xyz789",
    "installment_number": 1,
    "amount": 5000.00,
    "currency": "MXN",
    "status": "completed",
    "paid_at": "2025-10-31T12:00:00Z",
    "metadata": {
      "user_id": "user_123",
      "product_id": "prod_456"
    }
  },
  "timestamp": "2025-10-31T12:00:05Z"
}
```

**Acción**:
- Actualiza installment a `status: 'paid'`
- Si es primer pago o CONTADO → Reservation `status: 'PROCESSED'`
- Si es PLAZOS y faltan cuotas → Mantiene `status: 'MIT_PAYMENT_PENDING'`

### Event: payment.failed

```json
{
  "event": "payment.failed",
  "data": {
    "payment_id": "pay_abc123",
    "reservation_id": "res_xyz789",
    "installment_number": 1,
    "amount": 5000.00,
    "currency": "MXN",
    "status": "failed",
    "failed_reason": "insufficient_funds",
    "metadata": {}
  },
  "timestamp": "2025-10-31T12:00:05Z"
}
```

**Acción**:
- Mantiene installment en `status: 'pending'`
- Mantiene Reservation en `status: 'MIT_PAYMENT_PENDING'`
- Redirige usuario a `/marketplace/booking/failure?reason=insufficient_funds`

### Event: payment.cancelled

```json
{
  "event": "payment.cancelled",
  "data": {
    "payment_id": "pay_abc123",
    "reservation_id": "res_xyz789",
    "installment_number": 1,
    "amount": 5000.00,
    "currency": "MXN",
    "status": "cancelled",
    "metadata": {}
  },
  "timestamp": "2025-10-31T12:00:05Z"
}
```

**Acción**:
- Marca Reservation como `status: 'AWAITING_MANUAL_PAYMENT'`
- Usuario debe contactar soporte o reintentar

---

## 🧪 Testing

### 1. Verificar Endpoint Está Activo

```bash
curl http://localhost:3000/api/webhooks/mit
```

**Respuesta esperada**:
```json
{
  "success": true,
  "message": "MIT Webhook endpoint is active",
  "configured": true
}
```

### 2. Simular Webhook de MIT (Sandbox)

**Script de test** (`test-webhook.sh`):

```bash
#!/bin/bash

WEBHOOK_URL="http://localhost:3000/api/webhooks/mit"
SECRET="your-mit-webhook-secret-here"

# Payload de prueba
PAYLOAD='{
  "event": "payment.completed",
  "data": {
    "payment_id": "pay_test_123",
    "reservation_id": "res_test_789",
    "installment_number": 1,
    "amount": 5000.00,
    "currency": "MXN",
    "status": "completed",
    "paid_at": "2025-10-31T12:00:00Z"
  },
  "timestamp": "2025-10-31T12:00:05Z"
}'

# Calcular HMAC SHA-256
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

# Enviar webhook
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-mit-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Ejecutar**:
```bash
chmod +x test-webhook.sh
./test-webhook.sh
```

### 3. Verificar Logs del Servidor

**Logs esperados (éxito)**:
```
[Webhook MIT] 📨 Webhook recibido
[Webhook MIT] ✅ Signature verified
[Webhook MIT] 📦 Event: payment.completed Reservation: res_test_789
[Webhook MIT] ✅ Payment completed, confirming reservation...
[confirmPaymentWebhookAction] 🔔 Processing webhook event: { event: 'payment.completed', reservationId: 'res_test_789', installmentNumber: 1 }
[confirmPaymentWebhookAction] ✅ First payment completed, marking as PROCESSED
[confirmPaymentWebhookAction] 📝 Updating installment status...
[confirmPaymentWebhookAction] ✅ Installment updated successfully
[confirmPaymentWebhookAction] 📝 Updating reservation status to: PROCESSED
[confirmPaymentWebhookAction] ✅ Reservation updated successfully: { reservationId: 'res_test_789', status: 'PROCESSED' }
[Webhook MIT] ✅ Payment confirmed successfully
```

**Logs esperados (firma inválida)**:
```
[Webhook MIT] 📨 Webhook recibido
[Webhook MIT] ❌ Invalid signature
```

### 4. Verificar en Base de Datos

Después de webhook exitoso, verificar:

**GraphQL Query**:
```graphql
query GetReservation($id: ID!) {
  getReservation(id: $id) {
    id
    status  # Debe ser "PROCESSED"
    updated_at
  }
}

query GetPaymentPlan($reservation_id: ID!) {
  getPaymentPlanByReservation(reservation_id: $reservation_id) {
    id
    installments {
      installment_number
      status  # Debe ser "paid" para el installment procesado
      paid_date
      amount
    }
  }
}
```

### 5. Pruebas E2E (Flujo Completo)

1. **Crear reservación** en `/marketplace` → Status: `MIT_PAYMENT_PENDING`
2. **Simular pago exitoso** con webhook → Status: `PROCESSED`
3. **Verificar redirección** a `/marketplace/booking/success?reservation_id=xxx`
4. **Ver página de éxito** con animación y detalles
5. **Navegar a** `/traveler/reservations/[id]` → Ver estado actualizado

### 6. Pruebas de Seguridad

**Test 1: Sin firma**
```bash
curl -X POST http://localhost:3000/api/webhooks/mit \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.completed"}'
```
**Esperado**: `401 Unauthorized`

**Test 2: Firma incorrecta**
```bash
curl -X POST http://localhost:3000/api/webhooks/mit \
  -H "Content-Type: application/json" \
  -H "x-mit-signature: invalid-signature" \
  -d '{"event":"payment.completed"}'
```
**Esperado**: `401 Unauthorized`

**Test 3: Evento desconocido**
```bash
# Con firma válida pero evento inexistente
curl -X POST http://localhost:3000/api/webhooks/mit \
  -H "Content-Type: application/json" \
  -H "x-mit-signature: [valid-signature]" \
  -d '{"event":"payment.unknown"}'
```
**Esperado**: `400 Bad Request`

---

## 🚀 Deployment

### Configurar en MIT Dashboard

1. Ir a MIT Dashboard → Webhooks
2. Agregar nuevo endpoint:
   - **URL**: `https://yaan.com.mx/api/webhooks/mit`
   - **Events**:
     - `payment.completed`
     - `payment.failed`
     - `payment.cancelled`
3. Copiar **Webhook Secret** generado
4. Agregar a `.env.local` y variables de producción

### Verificar en Producción

```bash
# Health check
curl https://yaan.com.mx/api/webhooks/mit

# Ver logs en CloudWatch
aws logs tail /copilot/yaan-dev-dev-nextjs-dev --follow --region us-west-2 --filter-pattern "[Webhook MIT]"
```

---

## 📊 Estados de Reservación

| Estado Actual | Evento | Nuevo Estado | Acción |
|--------------|--------|--------------|--------|
| MIT_PAYMENT_PENDING | payment.completed (1er pago) | PROCESSED | Reservation confirmada |
| MIT_PAYMENT_PENDING | payment.completed (pago intermedio) | MIT_PAYMENT_PENDING | Continuar esperando pagos |
| MIT_PAYMENT_PENDING | payment.completed (último pago) | PROCESSED | Todos pagos completados |
| MIT_PAYMENT_PENDING | payment.failed | MIT_PAYMENT_PENDING | Reintentar pago |
| MIT_PAYMENT_PENDING | payment.cancelled | AWAITING_MANUAL_PAYMENT | Contactar soporte |

---

## 🔄 Próximos Pasos (FASE 2+)

### FASE 2: Edit Companions (Próxima)
- Habilitar edición de companions desde reservation detail
- Wizard de 3 pasos con validación completa
- Server action: `updateCompanionsAction()`

### FASE 5: Email Notifications
- Enviar email de confirmación al recibir `payment.completed`
- Email de recordatorio antes de vencimiento de installments
- Email de fallo con link de reintentar

### FASE 6: PDF Generation
- Generar voucher PDF al completar pago
- Incluir QR code con reservation ID
- Permitir descarga desde success page

---

## 🐛 Troubleshooting

### Problema: Webhook no llega a servidor

**Verificar**:
1. MIT Dashboard muestra URL correcta
2. Servidor está accesible públicamente (no localhost)
3. Firewall permite tráfico POST
4. Logs de MIT muestran intentos de entrega

**Solución**:
- Usar ngrok para desarrollo local: `ngrok http 3000`
- Actualizar URL en MIT Dashboard con URL de ngrok

### Problema: Signature inválida

**Verificar**:
1. `MIT_WEBHOOK_SECRET` coincide con MIT Dashboard
2. Payload no ha sido modificado (content-type, encoding)
3. No hay middleware que modifique body antes de signature check

**Solución**:
- Copiar secret exacto desde MIT Dashboard
- Asegurar que API route lee raw body (no parsed JSON)

### Problema: Reservation no se actualiza

**Verificar**:
1. Reservation ID existe en base de datos
2. User tiene permisos para actualizar reservation
3. GraphQL mutation tiene campos correctos

**Logs a revisar**:
```bash
# Buscar errores en confirmPaymentWebhookAction
grep "confirmPaymentWebhookAction" logs.txt
```

---

## 📚 Referencias

- **MIT Payment Gateway Docs**: https://docs.mit.com.mx/webhooks
- **HMAC SHA-256 Verification**: https://en.wikipedia.org/wiki/HMAC
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **AWS Amplify GraphQL**: https://docs.amplify.aws/gen2/build-a-backend/data/

---

**Fecha**: 2025-10-31
**Developer**: Claude Code
**Status**: ✅ FASE 1 COMPLETADA
