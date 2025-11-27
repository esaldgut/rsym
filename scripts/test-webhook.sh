#!/bin/bash

# ==============================================================================
# MIT Payment Gateway - Webhook Testing Script
# ==============================================================================
# Simula webhooks de MIT Payment Gateway para testing local
#
# Usage:
#   ./scripts/test-webhook.sh <event> <reservation_id> [installment_number]
#
# Examples:
#   ./scripts/test-webhook.sh payment.completed res_123 1
#   ./scripts/test-webhook.sh payment.failed res_123 1
#   ./scripts/test-webhook.sh payment.cancelled res_123
# ==============================================================================

set -e  # Exit on error

# Colors para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==============================================================================
# Configuration
# ==============================================================================

# Default values
WEBHOOK_URL="${WEBHOOK_URL:-http://localhost:3000/api/webhooks/mit}"
SECRET="${MIT_WEBHOOK_SECRET:-test-secret-key-for-local-development}"

# ==============================================================================
# Arguments
# ==============================================================================

EVENT_TYPE="$1"
RESERVATION_ID="$2"
INSTALLMENT_NUMBER="${3:-1}"

if [ -z "$EVENT_TYPE" ] || [ -z "$RESERVATION_ID" ]; then
  echo -e "${RED}❌ Error: Missing required arguments${NC}"
  echo ""
  echo "Usage: $0 <event> <reservation_id> [installment_number]"
  echo ""
  echo "Events:"
  echo "  payment.completed  - Payment successfully processed"
  echo "  payment.failed     - Payment failed"
  echo "  payment.cancelled  - Payment cancelled by user"
  echo ""
  echo "Examples:"
  echo "  $0 payment.completed res_abc123 1"
  echo "  $0 payment.failed res_abc123 1"
  echo "  $0 payment.cancelled res_abc123"
  exit 1
fi

# ==============================================================================
# Validate event type
# ==============================================================================

case "$EVENT_TYPE" in
  payment.completed|payment.failed|payment.cancelled)
    ;;
  *)
    echo -e "${RED}❌ Error: Invalid event type '$EVENT_TYPE'${NC}"
    echo "Valid events: payment.completed, payment.failed, payment.cancelled"
    exit 1
    ;;
esac

# ==============================================================================
# Generate payload
# ==============================================================================

echo -e "${BLUE}📦 Generating webhook payload...${NC}"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PAYMENT_ID="pay_test_$(date +%s)"

# Base payload
PAYLOAD=$(cat <<EOF
{
  "event": "$EVENT_TYPE",
  "data": {
    "payment_id": "$PAYMENT_ID",
    "reservation_id": "$RESERVATION_ID",
    "installment_number": $INSTALLMENT_NUMBER,
    "amount": 5000.00,
    "currency": "MXN",
    "status": "$(echo "$EVENT_TYPE" | cut -d'.' -f2)",
    "metadata": {
      "test": true,
      "script_version": "1.0"
    }
  },
  "timestamp": "$TIMESTAMP"
}
EOF
)

# Add event-specific fields
case "$EVENT_TYPE" in
  payment.completed)
    PAYLOAD=$(echo "$PAYLOAD" | jq --arg paid_at "$TIMESTAMP" '.data.paid_at = $paid_at')
    ;;
  payment.failed)
    PAYLOAD=$(echo "$PAYLOAD" | jq '.data.failed_reason = "insufficient_funds"')
    ;;
  payment.cancelled)
    # No additional fields needed
    ;;
esac

echo -e "${GREEN}✅ Payload generated${NC}"
echo "$PAYLOAD" | jq .

# ==============================================================================
# Calculate HMAC SHA-256 signature
# ==============================================================================

echo ""
echo -e "${BLUE}🔐 Calculating HMAC SHA-256 signature...${NC}"

# Use OpenSSL to calculate HMAC
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

echo -e "${GREEN}✅ Signature: $SIGNATURE${NC}"

# ==============================================================================
# Send webhook
# ==============================================================================

echo ""
echo -e "${BLUE}📨 Sending webhook to $WEBHOOK_URL...${NC}"
echo ""

# Send POST request
HTTP_CODE=$(curl -s -o /tmp/webhook-response.json -w "%{http_code}" \
  -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-mit-signature: $SIGNATURE" \
  -d "$PAYLOAD")

# Check response
echo -e "${BLUE}📋 Response (HTTP $HTTP_CODE):${NC}"
cat /tmp/webhook-response.json | jq .
echo ""

# Interpret result
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Webhook processed successfully!${NC}"
  exit 0
elif [ "$HTTP_CODE" = "401" ]; then
  echo -e "${RED}❌ Unauthorized: Invalid signature${NC}"
  echo -e "${YELLOW}💡 Check MIT_WEBHOOK_SECRET environment variable${NC}"
  exit 1
elif [ "$HTTP_CODE" = "400" ]; then
  echo -e "${RED}❌ Bad Request: Invalid payload${NC}"
  exit 1
elif [ "$HTTP_CODE" = "500" ]; then
  echo -e "${RED}❌ Internal Server Error${NC}"
  echo -e "${YELLOW}💡 Check server logs for details${NC}"
  exit 1
else
  echo -e "${YELLOW}⚠️  Unexpected HTTP code: $HTTP_CODE${NC}"
  exit 1
fi

# ==============================================================================
# Cleanup
# ==============================================================================

rm -f /tmp/webhook-response.json
