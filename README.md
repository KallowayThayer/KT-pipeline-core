# Kalloway & Thayer Systems - `KT-pipeline-core`

**Sub-5ms Enterprise Ingestion & Payload Normalization Primitives for ServiceTitan & Jobber**

Stateless edge ingestion interfaces engineered for multi-branch home service platforms, PE trade roll-ups, and high-volume trade contractors. Intercepts raw webhooks from Google LSA, Meta Lead Ads, aggregators, and regional web forms to guarantee clean, deduplicated downstream CRM injection with zero PII stored at rest.

---

## Core Specifications

- **Execution Latency:** Sub-5ms transient in-memory normalization and schema compilation.
- **Cryptographic Ingress Auth:** Raw-byte constant-time SHA-256 HMAC verification (`crypto.subtle.verify`) executed prior to JSON heap allocation.
- **Deterministic Idempotency:** Dual non-cryptographic fingerprinting (`DJB2` + `FNV-1a`) backed by sliding-window ephemeral TTL ledgers (`src/core/idempotency.ts`).
- **Multi-Tenant Fault Isolation:** O(1) path-scoped tenant routing (`/v1/ingest/:tenant_slug`) with isolated `202 Accepted` Dead-Letter Quarantine shunting (`src/edge/tenant-router.ts`) to prevent upstream Meta/LSA webhook subscription lockouts.
- **Telephony & Address Hygiene:** Strict NANP / E.164 normalization, extension isolation, and commercial/residential unit splitting.

---

## Repository Scope (Open-Core Boundary)

This repository contains the **public open-core ingress primitives, cryptographic verification shell, and TypeScript interfaces** (`@kallowaythayer/kt-pipeline-core`).

Downstream production adapters—including **ServiceTitan v2** (OAuth 2.0 M2M token pooling, Business Unit alignment, Inventory/PO WAC circuit breakers), **Jobber GraphQL**, automated PII-redacted DLQ replay workers, and regional TCPA quiet-hour state ledgers—are maintained in our private enterprise deployment repository and provisioned on isolated client edge gateways.

---

## Ingress-to-Egress Contract Example

### 1. Raw Inbound Webhook (Path-Scoped Multi-Tenant Ingress)

```http
POST /v1/ingest/ridgeway_southwest_hvac HTTP/1.1
Host: edge.kallowaythayer.com
Content-Type: application/json
X-Hub-Signature-256: sha256=7b4e91c08a2d4f6b91e3a5c7d8f0123456789abcdef0123456789abcdef01234

{
  "first_name": "JOHN",
  "last_name": "DOE",
  "phone": "(555) 123-4567 ext. 42",
  "email": "john.doe@EXAMPLE.COM",
  "address": "123 Main Street, Suite 400, Austin, TX 78701",
  "service": "emergency AC repair not cooling",
  "tcpa_consent": "true"
}

2. Normalized Middleware Output Envelope
JSON

{
  "status": "READY_FOR_DISPATCH",
  "adapter": "servicetitan_v2",
  "latency_ms": 1.84,
  "idempotency": {
    "fingerprint": "djb2:7f9a2c1b|fnv1a:4e81b90d",
    "duplicate": false,
    "ttl_seconds": 3600
  },
  "payload": {
    "first_name": "John",
    "last_name": "Doe",
    "phone_e164": "+15551234567",
    "phone_extension": "42",
    "phone_valid": true,
    "email": "john.doe@example.com",
    "trade_category": "HVAC",
    "address": {
      "street": "123 Main Street",
      "unit": "Suite 400",
      "city": "Austin",
      "state": "TX",
      "postal_code": "78701",
      "country": "US",
      "parse_status": "PARSED_STRUCTURED"
    },
    "compliance": {
      "tcpa_opt_in": true,
      "trusted_form_url": null,
      "jornaya_lead_id": null
    }
  }
}
```

## Architecture Documentation

See [`docs/architecture.md`](./docs/architecture.md) for data-flow topology, sliding-window TTL ledger specifications, Dead-Letter Quarantine (DLQ) redaction rules, and supported downstream adapter contracts (`servicetitan_v2`, `jobber_graphql`, `housecall_pro`, `hubspot_v3`).

For managed private endpoint deployment and asynchronous architecture reviews, visit **[kallowaythayer.com](https://kallowaythayer.com)**.

*Operated strictly as an asynchronous engineering consultancy. Zero sales calls.*
