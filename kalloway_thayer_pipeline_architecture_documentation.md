# Kalloway \& Thayer Pipeline Core

> \*\*Sub-Second Enterprise Ingestion \& Telemetry Middleware for ServiceTitan \& Jobber\*\*



## Overview



The `Kalloway \& Thayer Pipeline Core` is a high-throughput, fault-tolerant ingestion proxy engineered to normalize, sanitize, and validate inbound webhooks and lead payloads before they hit downstream field service CRMs (ServiceTitan, Jobber, GoHighLevel, Housecall Pro, HubSpot, and Salesforce).

Designed to operate in zero-trust, high-latency production environments, the engine handles payload multi-tenant routing, in-memory telephony sanitization, and cryptographic idempotency hashing in **under 5 milliseconds** of transient compute.



\---

## Architecture \& Data Flow

```text
\[Inbound Webhooks / Meta / LSA / Custom APIs]
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│             Ingress Boundary \& Header Parse            │
└────────────────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│     Multi-Source Flattening \& Universal Extraction     │
└────────────────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│    In-Memory Sanitization \& Schema Normalization       │
│    • E.164 Telephony Validation                        │
│    • RFC-Compliant Email Parsing \& Domain Heuristics   │
│    • DJB2 \& FNV-1a Combined Hashing (Idempotency)      │
└────────────────────────────────────────────────────────┘
                   │
                   ├───────────────────────┐ (Valid)
                   ▼ (Invalid / Duplicate) ▼
        ┌───────────────────────┐ ┌───────────────────────┐
        │ Encrypted DLQ /       │ │ Multi-CRM Adapter     │
        │ Quarantine Bucket     │ │ Payload Structuring   │
        └───────────────────────┘ └───────────────────────┘
```

\---

## Core Engineering Features



### 1\. Unified Ingress Flattening

Inbound payloads arrive across fragmented schemas (Meta Lead Ads, Google Lead Forms, Typeform, HubSpot webhooks, custom POSTs). The ingestion proxy automatically unwraps nested wrappers (`body`, `payload`, `properties`, `custom\_data`) and extracts structured data from array-based subcomponents (`user\_column\_data`, `field\_data`, `interview`, `form\_response`), creating a normalized key-value state map.



### 2\. Cryptographic Idempotency \& Deduplication

To prevent race conditions, duplicate triggers, and mobile double-tap submissions, the engine generates a dual-algorithm fingerprint using **DJB2** and **FNV-1a**:

* **Event-Level Lock:** Leverages external idempotency headers (`X-Idempotency-Key`, `Svix-ID`) with an 86,400ms TTL ledger.
* **Content-Level Lock:** Falls back to a deterministic contact hash (`phone`, `email`, `tradeCategory`, `service`, `notes`) with a 3,600ms TTL sliding window to suppress rapid-fire duplicate dispatches within batches.
* 

### 3\. Strict Telephony \& Entity Sanitization

* **E.164 Normalization:** Strips extensions, handles NANP and international routing prefixes, and validates mobile/landline digit structures against strict regex bounds.
* **Entity \& Name Parsing:** Automatically detects corporate entities versus residential names, strips honorifics and suffixes, and formats titles into proper case variants.
* **Taxonomy Classification:** Scans notes and requested services against regex taxonomies covering 12 major verticals (HVAC, Plumbing, Roofing, Electrical, Solar, Restoration, Garage Door, Pest Control, Septic, Landscaping, Foundation, Remodeling).
* 

### 4\. Dead-Letter Queue (DLQ) \& Quarantine Isolation

Payloads that fail validation (malformed phone numbers, syntax-invalid emails, spam/junk flags, idempotency collisions, or unhandled runtime exceptions) are isolated into a DLQ replay envelope. Optional PII redaction ensures compliance without losing the raw forensic audit trail.



\---

## Supported CRM Adapters

The engine dynamically formats payload structures for the following target adapters (controllable via query parameters or custom headers):

|Target Key|Primary CRM / System|Output Format Specification|
|-|-|-|
|`servicetitan\_v2`|ServiceTitan|Structured client object with nested address and typed contact arrays|
|`jobber\_graphql`|Jobber|GraphQL-compliant customer entity with billing address map|
|`gohighlevel\_v2`|GoHighLevel|Standardized lead payload with automated tagging (`kt-sanitized`)|
|`housecall\_pro`|Housecall Pro|Flat property record with mobile number and multi-line notes|
|`hubspot\_v3`|HubSpot|CRM Property object mapping for native lifecycle integration|
|`salesforce\_lead`|Salesforce|Standard Lead object mapping (`FirstName`, `LastName`, `Company`)|



