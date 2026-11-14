# Kalloway & Thayer Systems LLC — Security Policy & Disclosure Protocol

## 1. Zero-Data-at-Rest Architectural Boundary
`KT-pipeline-core` and all managed Kalloway & Thayer Systems LLC edge ingress nodes are engineered under a strict **Zero Persistent PII at Rest** mandate:
- **Volatile RAM Execution:** All webhook sanitization, E.164 telephony normalization, and DJB2/FNV-1a idempotency checks execute strictly in isolated V8 volatile memory (`~5.1 MB` footprint).
- **Immediate Heap Release:** Payload buffers are released to V8 garbage collection immediately upon downstream HTTP `2xx` acceptance or Dead-Letter Queue (`S3`/`Webhook`) shunting. No SQLite, Redis, or disk-backed databases exist on ingress nodes.
- **Socket-Layer Auth:** Constant-time `HMAC-SHA256` signature verification (`crypto.subtle.verify`) executes on raw byte streams prior to JSON heap allocation, neutralizing malformed payload floods at the socket layer.
- **KMS Credential Isolation:** Downstream ServiceTitan v2 OAuth 2.0 secrets and ERP credentials are isolated within KMS-encrypted environment vaults and never transmitted via email or written to unencrypted disk.

## 2. Supported Versions
Security patches and upstream schema adjustments are actively maintained on the latest release branch:

| Version | Supported | Runtime Target |
| :--- | :--- | :--- |
| `v1.0.x` | Yes | Native V8 / Node.js `>=20.x` (Zero External Dependencies) |

## 3. Vulnerability Disclosure Protocol
If you identify a cryptographic, memory-isolation, or ReDoS vulnerability within the `KT-pipeline-core` primitives, **do not open a public GitHub issue.**

Submit findings directly to our engineering security channel:
- **Disclosure Channel:** `weston@kallowaythayer.com`
- **Response SLA:** Initial cryptographic and architectural triage within **24 hours**.
- **Scope:** Please include a reproducible payload, memory/CPU telemetry (if applicable), and the target module (`idempotency.ts`, `tenant-router.ts`, etc.).
