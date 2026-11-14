![KT-Pipeline CI](https://github.com/KallowayThayer/KT-pipeline-core/actions/workflows/ci.yml/badge.svg)

# Kalloway & Thayer Systems LLC - KT-pipeline-core

**Sub-Millisecond Enterprise Ingestion & Payload Normalization Primitives for ServiceTitan & Enterprise ERPs**

Stateless edge ingestion interfaces engineered for multi-branch home service platforms, PE trade roll-ups, and high-volume trade contractors. Intercepts raw webhooks from Google LSA, Meta Lead Ads, aggregators, and regional web forms to guarantee clean, deduplicated downstream CRM injection with zero PII stored at rest. Stops dropped ServiceTitan leads caused by morning concurrency spikes and Zapier timeout failures.

---

## Core Specifications

- **High-Concurrency Stress Test:** 1,000 concurrent webhooks processed in 11.0 ms (0.011 ms average per payload) with 0 socket drops and a 5.1 MB RAM memory footprint on native V8.

- **Execution Latency:** Sub-millisecond transient in-memory normalization and schema compilation (0.011 ms average per-payload compute latency).

- **Cryptographic Ingress Auth:** Raw-byte constant-time SHA-256 HMAC verification (`crypto.subtle.verify`) executed prior to JSON heap allocation.

- **Deterministic Idempotency:** Dual non-cryptographic fingerprinting (DJB2 + FNV-1a) backed by sliding-window ephemeral TTL ledgers (`src/core/idempotency.ts`).

- **Multi-Tenant Fault Isolation:** O(1) path-scoped tenant routing (`/v1/ingest/:tenant_slug`) with isolated 202 Accepted Dead-Letter Quarantine shunting (`src/edge/tenant-router.ts`) to prevent upstream Meta/LSA webhook subscription lockouts.

- **Active-Standby Redundancy:** Multi-provider ingress node topology with automated health-checked failover, volatile state-synchronized RAM ledgers, and a 99.9% availability SLA.

- **Telephony & Address Hygiene:** Strict NANP / E.164 normalization, extension isolation, and commercial/residential unit splitting.

---

## Repository Scope (Open-Core Boundary)

This repository contains the **public open-core ingress primitives, cryptographic verification shell, and TypeScript interfaces** (`@kallowaythayer/kt-pipeline-core`).

Downstream production adapters, including **ServiceTitan v2** (OAuth 2.0 M2M token pooling, Business Unit alignment, Inventory/PO WAC circuit breakers), **Enterprise ERPs**, automated PII-redacted DLQ replay workers, and regional TCPA quiet-hour state ledgers, are maintained in our private enterprise deployment repository and provisioned on isolated client edge gateways.

---

## Ingress-to-Egress Contract Example

### 1. Raw Inbound Webhook (Path-Scoped Multi-Tenant Ingress)

```http
POST /v1/ingest/ridgeway_southwest_hvac HTTP/1.1
Host: api.kallowaythayer.com
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
```

### 2. Normalized Middleware Output Envelope
```json
{
  "status": "READY_FOR_DISPATCH",
  "adapter": "servicetitan_v2",
  "latency_ms": 0.011,
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
      "risk_mitigation": "VERIFIED_CONSENT_TOKEN"
    }
  }
}
```
### 3. Live Edge Validation & Interactive Telemetry

To audit real-world schema sanitization, multi-CRM routing, and sliding-window idempotency against messy, unformatted payloads (including phone extensions, single-line unparsed addresses, and simulated schema drift), access the live interactive pipeline sandbox at **[kallowaythayer.com](https://kallowaythayer.com)**.

For ongoing production write-ups, failure-mode analyses, and performance audits on native V8 edge ingestion, explore the engineering log at **[dev.to/kallowaythayer](https://dev.to/kallowaythayer)**.

---

### 4. Technical & Partner Documentation

- **[Pipeline Core Architecture (`docs/architecture.md`)](./docs/architecture.md):** Data-flow topology, dual-hash sliding-window TTL ledger specifications, Dead-Letter Quarantine (DLQ) redaction rules, and downstream CRM adapter contracts.
- **[Partner & Enterprise Architecture Spec (`PARTNER_ARCHITECTURE_SPEC.md`)](./PARTNER_ARCHITECTURE_SPEC.md):** Detailed breakdown of our 72-hour sandbox-to-cutover protocol, KMS credential isolation, memory footprints (`5.1 MB`), and B2B data processing terms for ServiceTitan v2 and ERP integrations.
- **Engagement Terms & Pricing:** Flat-rate managed infrastructure at **$1,500/month per production tenant** ($0 setup fees; deploy on an isolated sandbox first).

Test the live edge engine or submit custom target schemas for asynchronous integration review at **[kallowaythayer.com](https://kallowaythayer.com)**.

*Engineered and operated by Kalloway & Thayer Systems LLC (US-Domiciled Managed Infrastructure, Santa Fe, NM). All architecture scoping and sandbox deployments are executed asynchronously via direct engineering channels.*
