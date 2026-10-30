# Kalloway & Thayer Systems — KT-Pipeline-Core

> **Sub-5ms Enterprise Ingestion & Payload Normalization Middleware for ServiceTitan & Jobber**

Production-grade, stateless edge ingestion middleware engineered for multi-branch home service platforms, PE trade roll-ups, and high-volume trade contractors. Intercepts raw webhooks from Google LSA, Meta Lead Ads, aggregators, and web forms to guarantee clean, deduplicated downstream CRM injection with zero PII stored at rest.

---

## Core Specifications

- **Execution Latency:** Sub-5ms transient in-memory normalization and schema compilation.
- **Deterministic Idempotency:** Dual non-cryptographic fingerprinting (`DJB2` + `FNV-1a`) backed by sliding-window TTL ledgers (`86,400s` event lock / `3,600s` content lock).
- **Telephony & Address Hygiene:** Strict NANP / E.164 normalization, extension isolation, and commercial/residential unit splitting.
- **Regulatory & Compliance Capture:** Native TCPA opt-in isolation, TrustedForm certificate URL extraction, and Jornaya LeadID verification.
- **Zero-PII Quarantine (DLQ):** Automated PII masking prior to Dead-Letter Queue persistence alongside spam/profanity boundary filtering.

---

## Ingress-to-Egress Contract Example

### 1. Raw Inbound Webhook

Send an unformatted webhook from any upstream ad platform, aggregator, or form builder:

    POST /v1/ingest HTTP/1.1
    Host: edge.kallowaythayer.com
    Content-Type: application/json
    X-Tenant-Signature: sha256=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
    X-KT-Target-Adapter: servicetitan_v2

    {
      "first_name": "JOHN",
      "last_name": "DOE",
      "phone": "(555) 123-4567 ext. 42",
      "email": "john.doe@EXAMPLE.COM",
      "address": "123 Main Street, Suite 400, Austin, TX 78701",
      "service": "emergency AC repair not cooling",
      "tcpa_consent": "true"
    }

### 2. Normalized Middleware Output

The engine validates headers, strips noise, computes dual-hash idempotency in ephemeral memory, and compiles a strict target-ready envelope:

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
          "jornaya_lead_id": null,
          "client_ip": null
        }
      }
    }

---

## Architecture & Supported Adapters

See [docs/architecture.md](./docs/architecture.md) for the full data-flow topology, sliding-window TTL ledger specifications, Dead-Letter Quarantine (DLQ) redaction rules, and target adapter schemas (`servicetitan_v2`, `jobber_graphql`, `housecall_pro`, `hubspot_v3`, `salesforce_lead`, `gohighlevel_v2`).

For managed private endpoint deployment and custom schema mapping, visit [kallowaythayer.com](https://kallowaythayer.com).

*Operated strictly as an asynchronous engineering consultancy. Zero synchronous sales calls.*
