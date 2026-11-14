# KALLOWAY & THAYER SYSTEMS LLC
**Stateless Edge Ingress & ERP Synchronization Specification (v2026.11)**

- **Infrastructure:** US-Domiciled Bare-Metal V8 Edge Runtimes (Santa Fe, NM)
- **Direct Engineering Channel:** weston@kallowaythayer.com 
- **Live Sandbox:** [https://kallowaythayer.com](https://kallowaythayer.com)

---

### 1. ARCHITECTURAL SCOPE & PROBLEM STATEMENT

Multi-branch trade fleets and post-merger PE roll-ups silently lose **6% to 9%** of paid inbound leads (Google LSA, Meta Lead Ads, Thumbtack/Angi, web schedulers) and ERP sync payloads when fragile iPaaS workflows (Zapier/Make) or legacy webhook listeners encounter burst concurrency, unformatted strings, or HTTP 429 API lockouts.

Kalloway & Thayer provisions **zero-dependency Node.js V8 edge runtimes** directly ahead of ServiceTitan v2 (CRM Bookings, Leads, Dispatch, Inventory/POs) and enterprise financial ledgers (Sage Intacct, NetSuite, custom warehouse ERPs).

- **Compute Latency:** `0.011ms` per payload transformation (`11.0ms` per 1,000-request concurrent burst; `0` socket drops).
- **Memory Footprint:** `5.1 MB` isolated V8 runtime per tenant.
- **Zero Persistent PII at Rest:** All NANP/E.164 telephony parsing (including extension extraction to CRM memo fields), address structuring, and schema compilation execute strictly in volatile RAM. Buffers release to V8 garbage collection immediately upon downstream HTTP 2xx acceptance.

---

### 2. CORE CAPABILITIES AT THE INGRESS BOUNDARY

- **Atomic In-RAM Idempotency (DJB2 / FNV-1a):** Sliding-window dual-hash ledger operating strictly within the isolated V8 instance volatile RAM (configurable TTL, default `3600s`) blocks duplicate customer creation and double-dispatched trucks without cross-region cluster lock contention.
- **Per-Tenant Leaky-Bucket Rate Pacing:** Absorbs Monday-morning ad spikes at the edge and paces outbound injection into ServiceTitan v2 and ERP endpoints with automated OAuth 2.0 token rotation—eliminating HTTP 429 throttling.
- **Deterministic TCPA & FCC Revocation Gate:** Verifies presence and syntax of TrustedForm certificates, Jornaya LeadiD tokens, and cross-channel opt-out flags under Nov 2026 FCC rules prior to CRM injection. Unconsented or quiet-hour payloads are quarantined at the edge.
- **Dead-Letter Quarantine (Zero Silent Drops):** If an upstream aggregator pushes unannounced schema drift or a downstream CRM experiences an outage, failed payloads shunt immediately in-flight to a client-owned encrypted Dead-Letter Queue (S3/Webhook) with PII-redacted telemetry alerts—maintaining zero persistent PII on Kalloway & Thayer nodes.
- **Active-Standby Multi-Provider Ingress Topology:** Every tenant endpoint is backed by redundant, infrastructurally separate U.S.-domiciled edge ingress nodes with automated external health-check failover. Volatile DJB2/FNV-1a idempotency fingerprints and TTL timestamps replicate to the standby node’s RAM in real time, preventing duplicate truck dispatches or dropped leads during an unannounced host failover.

---

### 3. SECURITY, PRIVACY & COMPLIANCE BOUNDARY

- **Statutory Data Processor & Zero-AI Mandate:** Kalloway & Thayer operates strictly as a B2B Data Processor. Client payloads are never sold, brokered, or used to train, fine-tune, or index any AI/LLM model.
- **KMS Credential Isolation:** Production ServiceTitan v2 Tenant/App keys and ERP secrets are never accepted over email. Secrets are injected exclusively via KMS-encrypted environment vaults into isolated per-tenant V8 memory spaces.
- **Transport Security:** Enforces TLS 1.2/1.3 encryption and constant-time `HMAC-SHA256` webhook signature verification.

---

### 4. 72-HOUR SANDBOX-TO-CUTOVER PROTOCOL

We operate 100% asynchronously via documented engineering channels—zero discovery calls, zero disruption to live dispatch boards.

- **Phase 1 (Hour 0–24) Sandbox Provisioning:** Client/Partner submits sample raw inbound JSON payloads (or target webhook sources) and destination schema requirements to `weston@kallowaythayer.com`. We deploy an isolated staging endpoint to verify transformation accuracy before touching production.
- **Phase 2 (Hour 24–48) KMS Vault & Multi-Node Wiring:** Production API credentials are vaulted via KMS link. Primary and hot-standby ingress nodes are provisioned across separate host backbones, and Dead-Letter Queue (S3/Webhook) targets are verified against a simulated 1,000-request burst.
- **Phase 3 (Hour 48–72) Zero-Downtime Webhook Cutover:** Upstream webhook URLs point to the dedicated Kalloway & Thayer edge endpoint. Standard single-tenant CRM ingress adapters deploy with **$0 onboarding fees**, backed by a **99.9% Monthly Uptime SLA** and **72-hour clean cutover/cancellation terms** (zero vendor lock-in).

---

### 5. ENGAGEMENT MODELS (DIRECT & CHANNEL PARTNERS)

- **Direct Fleet Deployment:** Flat-rate managed infrastructure at **$1,500/month per production CRM/ERP tenant** ($0 setup fees; deploy on an isolated sandbox first).
- **MSP / Consultant White-Label Pass-Through:** ServiceTitan implementation consultants, PE data integrators, and lead-gen agencies can provision isolated Kalloway & Thayer edge pipelines under clean white-label channel partner terms, retaining full client relationship ownership while offloading custom API/ERP middleware maintenance.
