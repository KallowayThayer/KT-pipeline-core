# Kalloway & Thayer Systems - `KT-pipeline-core`

**Sub-Millisecond Enterprise Ingestion & Payload Normalization Primitives for ServiceTitan & Enterprise ERPs**

Stateless edge ingestion interfaces engineered for multi-branch home service platforms, PE trade roll-ups, and high-volume trade contractors. Intercepts raw webhooks from Google LSA, Meta Lead Ads, aggregators, and regional web forms to guarantee clean, deduplicated downstream CRM injection with zero PII stored at rest.

---

## Core Specifications

- **High-Concurrency Stress Test:** 1,000 concurrent webhooks processed in 329.74 ms with 0 socket drops and a 5.1 MB RAM memory footprint on native V8.

- **Execution Latency:** Sub-millisecond transient in-memory normalization and schema compilation (~0.42ms average latency).

- **Cryptographic Ingress Auth:** Raw-byte constant-time SHA-256 HMAC verification (`crypto.subtle.verify`) executed prior to JSON heap allocation.

- **Deterministic Idempotency:** Dual non-cryptographic fingerprinting (`DJB2` + `FNV-1a`) backed by sliding-window ephemeral TTL ledgers (`src/core/idempotency.ts`).

- **Multi-Tenant Fault Isolation:** O(1) path-scoped tenant routing (`/v1/ingest/:tenant_slug`) with isolated `202 Accepted` Dead-Letter Quarantine shunting (`src/edge/tenant-router.ts`) to prevent upstream Meta/LSA webhook subscription lockouts.

- **Telephony & Address Hygiene:** Strict NANP / E.164 normalization, extension isolation, and commercial/residential unit splitting.

---

## Repository Scope (Open-Core Boundary)

This repository contains the **public open-core ingress primitives, cryptographic verification shell, and TypeScript interfaces** (`@kallowaythayer/kt-pipeline-core`).

Downstream production adapters—including **ServiceTitan v2** (OAuth 2.0 M2M token pooling, Business Unit alignment, Inventory/PO WAC circuit breakers), **Enterprise ERPs**, automated PII-redacted DLQ replay workers, and regional TCPA quiet-hour state ledgers—are maintained in our private enterprise deployment repository and provisioned on isolated client edge gateways.

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
  "latency_ms": 0.42,
  "memory_footprint_mb": 5.1,
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
      "jornaya_lead_id": null,
      "risk_mitigation": "VERIFIED_ARCHIVAL"
    }
  }
}
```
Live Edge Validation & Interactive Telemetry

To audit real-world schema sanitization, multi-CRM routing, and sliding-window idempotency against messy, unformatted payloads (including phone extensions, single-line unparsed addresses, and simulated schema drift), access the live interactive pipeline audit directly on our site.


## Architectural Deep Dives

For ongoing production write-ups, failure-mode analyses, and performance audits on native V8 edge ingestion, explore the engineering log at **[dev.to/kallowaythayer](https://dev.to/kallowaythayer)**.

Test the live edge engine or submit custom target schemas for asynchronous integration review at kallowaythayer.com

Operated strictly as an asynchronous engineering consultancy. Zero sales calls.
