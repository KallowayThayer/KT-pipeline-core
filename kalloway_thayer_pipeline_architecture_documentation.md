# Kalloway & Thayer Pipeline Core

> **Sub-5ms Enterprise Ingestion & Telemetry Middleware for ServiceTitan & Jobber**

## Overview

`KT-pipeline-core` is a high-throughput, fault-tolerant ingestion proxy engineered to normalize, sanitize, and validate inbound webhooks and lead payloads before they hit downstream field service CRMs (ServiceTitan, Jobber, Housecall Pro, HubSpot, Salesforce, and GoHighLevel).

Designed to operate in zero-trust, high-concurrency production environments, the engine executes multi-tenant edge routing, in-memory telephony sanitization, and deterministic dual-hash idempotency in **under 5 milliseconds** of transient compute.

---

## Architecture & Data Flow

    [Inbound Webhooks / Meta / Google LSA / Custom APIs]
                             |
                             v
    +--------------------------------------------------------+
    |        Ingress Boundary & HMAC Header Verification     |
    +--------------------------------------------------------+
                             |
                             v
    +--------------------------------------------------------+
    |      Multi-Source Flattening & Universal Extraction    |
    +--------------------------------------------------------+
                             |
                             v
    +--------------------------------------------------------+
    |     In-Memory Sanitization & Schema Normalization      |
    |     - NANP / E.164 Telephony Validation & Ext Split    |
    |     - RFC-5322 Email Parsing & Domain Heuristics       |
    |     - DJB2 + FNV-1a Dual-Hash Idempotency Ledger       |
    +--------------------------------------------------------+
                             |
                             +-----------------------+ (Valid)
                             v (Invalid / Duplicate) v
             +-----------------------+ +-----------------------+
             | PII-Redacted DLQ /    | | Multi-CRM Adapter     |
             | Quarantine Envelope   | | Payload Structuring   |
             +-----------------------+ +-----------------------+

---

## Core Engineering Features

### 1. Unified Ingress Flattening

Inbound payloads arrive across fragmented schemas (Meta Lead Ads, Google LSA Lead Forms, Typeform, HubSpot webhooks, and custom POSTs). The ingestion proxy automatically unwraps nested wrappers (`body`, `payload`, `properties`, `custom_data`) and extracts structured key-value pairs from array-based subcomponents (`user_column_data`, `field_data`, `interview`, `form_response`) into a unified internal state map.

### 2. Deterministic Dual-Hash Idempotency

To eliminate race conditions, webhook retry storms, and mobile double-tap collisions without disk I/O, the engine computes a composite 64-bit non-cryptographic fingerprint pairing **DJB2** and **FNV-1a**:

- **Event-Level Lock:** Evaluates upstream idempotency headers (`X-Idempotency-Key`, `Svix-ID`) against an in-memory **24-hour (`86,400s`) TTL** sliding-window ledger.
- **Content-Level Lock:** Computes a canonical payload fingerprint (`phone`, `email`, `trade_category`, `service`) enforced across a **1-hour (`3,600s`) TTL** window to suppress rapid-fire duplicate dispatches across concurrent ad webhooks.

### 3. Strict Telephony & Entity Sanitization

- **E.164 Normalization:** Isolates extension strings (`ext. 104`), resolves NANP country prefixes, and validates 10-digit subscriber bounds before downstream CRM validation can reject the record.
- **Entity & Name Parsing:** Distinguishes commercial accounts from residential leads, strips honorifics/suffixes, and normalizes casing.
- **Trade Taxonomy Classification:** Classifies unstructured service notes across 12 core trade verticals (HVAC, Plumbing, Roofing, Electrical, Solar, Restoration, Garage Door, Pest Control, Septic, Landscaping, Foundation, Remodeling).

### 4. Dead-Letter Quarantine (DLQ) Isolation

Payloads failing strict validation (unparseable telephony, syntax-invalid emails, spam heuristics, idempotency collisions, or upstream 5xx timeouts) are shunted into a tenant-isolated DLQ replay envelope with automated PII masking enforced prior to persistence—preserving forensic replay metadata with zero raw PII stored at rest.

---

## Supported CRM Adapters

Target schema compilation is controlled per route via tenant configuration maps or request headers (`X-KT-Target-Adapter`):

| Target Key | Primary System | Output Contract Specification |
| :--- | :--- | :--- |
| `servicetitan_v2` | ServiceTitan | V2 Leads/Bookings client contract with structured address & typed contact arrays |
| `jobber_graphql` | Jobber | GraphQL `clientCreate` input payload with billing/property address mapping |
| `housecall_pro` | Housecall Pro | Customer + addressable property payload with E.164 mobile & structured notes |
| `hubspot_v3` | HubSpot | v3 Contacts `properties` object map for lifecycle synchronization |
| `salesforce_lead` | Salesforce | Standard `Lead` SObject payload (`FirstName`, `LastName`, `Company`, `Phone`) |
| `gohighlevel_v2` | GoHighLevel | v2 Contact inbound schema with automated pipeline tagging (`kt-sanitized`) |
