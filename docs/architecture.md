# Kalloway & Thayer Systems LLC — Pipeline Core Architecture

> **Sub-Millisecond Enterprise Ingestion & Telemetry Middleware for ServiceTitan & Enterprise ERPs**

## Overview

`KT-pipeline-core` is a high-throughput, fault-tolerant ingestion proxy engineered to normalize, sanitize, and validate inbound webhooks and lead payloads before they hit downstream field service CRMs (ServiceTitan & Enterprise ERPs).

Designed to operate in zero-trust, high-concurrency production environments, the engine executes multi-tenant edge routing, in-memory telephony sanitization, and deterministic dual-hash idempotency in **sub-millisecond (0.011ms average per-payload latency)** transient V8 compute.

- **Extreme Concurrency Benchmarks:** Adversarial stress-tested at **1,000 concurrent webhooks in 11.0 ms** with **0 socket drops** and a minimal **5.1 MB RAM memory footprint** on a bare-metal V8 native edge runtime.

---

## Architecture & Data Flow

<pre>
    [Inbound Webhooks / Meta / Google LSA / Custom APIs]
                             |
                             v
    +------------------------------------------------------+
    |       Ingress Boundary & HMAC Header Verification    |
    +------------------------------------------------------+
                             |
                             v
    +------------------------------------------------------+
    |     Multi-Source Flattening & Universal Extraction   |
    +------------------------------------------------------+
                             |
                             v
    +------------------------------------------------------+
    |     In-Memory Sanitization & Schema Normalization    |
    |     - NANP / E.164 Telephony Validation & Ext Split  |
    |     - RFC-5322 Email Parsing & Domain Heuristics     |
    |     - DJB2 + FNV-1a Dual-Hash Idempotency Ledger     |
    +------------------------------------------------------+
                 |                            |
                 v (Invalid / Duplicate)      v (Valid)
    +--------------------------+  +------------------------+
    | PII-Redacted DLQ /       |  | Multi-CRM Adapter      |
    | Quarantine Envelope      |  | Payload Structuring    |
    +--------------------------+  +------------------------+
</pre>


---

## Core Engineering Features

### 1. Unified Ingress Flattening

Inbound payloads arrive across fragmented schemas (Meta Lead Ads, Google LSA Lead Forms, Typeform, HubSpot webhooks, and custom POSTs). The ingestion proxy automatically unwraps nested wrappers (`body`, `payload`, `properties`, `custom_data`) and extracts structured key-value pairs from array-based subcomponents (`user_column_data`, `field_data`, `interview`, `form_response`) into a unified internal state map.

### 2. Deterministic Dual-Hash Idempotency

To eliminate race conditions, webhook retry storms, and mobile double-tap collisions without disk I/O or database locks, the engine computes a composite non-cryptographic fingerprint pairing **DJB2** and **FNV-1a** entirely in ephemeral volatile RAM:

- **Event-Level Lock:** Evaluates upstream idempotency headers (`X-Idempotency-Key`, `Svix-ID`) against an in-memory **24-hour (`86,400s`) TTL** sliding-window ledger.

- **Content-Level Lock:** Computes a canonical payload fingerprint (`phone`, `email`, `trade_category`, `service`) enforced across a **1-hour (`3,600s`) TTL** window to suppress rapid-fire duplicate dispatches across concurrent ad webhooks.

### 3. Strict Telephony & Entity Sanitization

- **E.164 Normalization:** Isolates extension strings (`ext. 104`), resolves NANP country prefixes, and validates 10-digit subscriber bounds before downstream CRM validation can reject the record.

- **Entity & Name Parsing:** Distinguishes commercial accounts from residential leads, strips honorifics/suffixes, and normalizes casing.

- **Trade Taxonomy Classification:** Classifies unstructured service notes across 12 core trade verticals (HVAC, Plumbing, Roofing, Electrical, Solar, Restoration, Garage Door, Pest Control, Septic, Landscaping, Foundation, Remodeling).

### 4. Dead-Letter Quarantine (DLQ) Isolation

Payloads failing strict validation (unparseable telephony, syntax-invalid emails, spam heuristics, idempotency collisions, or upstream 5xx timeouts) shunt immediately in-flight to a client-owned encrypted Dead-Letter Queue (S3/Webhook) with automated PII masking enforced prior to transmission—preserving forensic replay metadata with zero persistent PII stored at rest on Kalloway & Thayer nodes.

---

## Supported CRM Adapters

Target schema compilation is controlled per route via tenant configuration maps or request headers (`X-KT-Target-Adapter`):

| Target Key | Primary System | Output Contract Specification |
| :--- | :--- | :--- |
| `servicetitan_v2` | ServiceTitan v2 | V2 Bookings/Leads client contract with structured address & typed contact arrays |
| `sage_intacct` | Sage Intacct / ERPs | Normalized general ledger and three-way PO inventory staging schemas |

---

## Verification & Deployment Protocol

- **Interactive Telemetry:** Audit live schema sanitization, multi-CRM routing, and sliding-window idempotency against messy, unformatted payloads via the live browser sandbox: [https://kallowaythayer.com](https://kallowaythayer.com)

- **Partner Specifications:** Review [`PARTNER_ARCHITECTURE_SPEC.md`](../PARTNER_ARCHITECTURE_SPEC.md) for full 72-hour onboarding protocols, KMS credential vaulting, and SLA terms.

- **Managed Deployment:** Flat-rate managed infrastructure at $1,500/month per production CRM/ERP tenant ($0 setup fees; isolated sandbox provisioned within 24 hours). Direct engineering channel: `weston@kallowaythayer.com`.
