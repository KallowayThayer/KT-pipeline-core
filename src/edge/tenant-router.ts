// src/edge/tenant-router.ts
export interface TenantProfile {
  id: string;
  active: boolean;
  webhookSecret: string;
  crmAdapter: "servicetitan_v2" | "jobber_graphql";
  crmEndpoint: string;
  businessUnitId: number;
  schemaRules: Record<string, unknown>;
}

const encoder = new TextEncoder();

async function verifyHmacSha256(
  rawBody: ArrayBuffer,
  secret: string,
  signatureHeader: string | null
): Promise<boolean> {
  if (!signatureHeader) return false;
  const cleanHex = signatureHeader.replace(/^sha256=/i, "").trim();
  if (cleanHex.length !== 64 || !/^[0-9a-f]+$/i.test(cleanHex)) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const sigBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    sigBytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }

  // Constant-time verification via Web Crypto API (zero timing leak)
  return crypto.subtle.verify("HMAC", key, sigBytes, rawBody);
}

export async function handleMultiTenantWebhook(
  request: Request,
  tenantLookup: (slug: string) => TenantProfile | undefined,
  normalizeAndSanitize: (payload: unknown, rules: Record<string, unknown>) => unknown,
  forwardToCRM: (payload: unknown, profile: TenantProfile) => Promise<Response>,
  pushToTenantDLQ: (tenantId: string, rawBody: string, reason: string) => Promise<void>
): Promise<Response> {
  const startTime = performance.now();

  // 1. Resolve tenant slug from isolated ingress path (/v1/ingest/:tenant_slug)
  const url = new URL(request.url);
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const tenantSlug = pathSegments[pathSegments.length - 1];

  if (!tenantSlug) {
    return new Response("Missing Tenant Ingress Route", { status: 404 });
  }

  // 2. O(1) ephemeral memory lookup (zero DB I/O)
  const tenant = tenantLookup(tenantSlug);
  if (!tenant || !tenant.active) {
    return new Response("Tenant Quarantined or Unregistered", { status: 403 });
  }

  // 3. Read raw bytes once & verify platform HMAC before JSON allocation
  const rawBuffer = await request.arrayBuffer();
  const sigHeader =
    request.headers.get("X-Hub-Signature-256") ||
    request.headers.get("X-Webhook-Signature");

  const isAuthentic = await verifyHmacSha256(rawBuffer, tenant.webhookSecret, sigHeader);
  if (!isAuthentic) {
    return new Response("Invalid Cryptographic Signature", { status: 401 });
  }

  const rawText = new TextDecoder().decode(rawBuffer);

  try {
    const rawPayload = JSON.parse(rawText);
    const sanitizedEnvelope = normalizeAndSanitize(rawPayload, tenant.schemaRules);
    const crmResponse = await forwardToCRM(sanitizedEnvelope, tenant);

    if (!crmResponse.ok) {
      // Isolate downstream failure to tenant-scoped DLQ; return 202 to prevent upstream retry storms
      await pushToTenantDLQ(tenant.id, rawText, `DOWNSTREAM_${crmResponse.status}`);
      return new Response(
        JSON.stringify({ status: "QUARANTINED_DLQ", tenant: tenant.id }),
        { status: 202, headers: { "Content-Type": "application/json" } }
      );
    }

    const latencyMs = Number((performance.now() - startTime).toFixed(2));
    return new Response(
      JSON.stringify({ status: "DISPATCHED", tenant: tenant.id, latency_ms: latencyMs }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch {
    // Quarantine unexpected schema drift without disabling upstream Meta/LSA subscriptions
    await pushToTenantDLQ(tenant.id, rawText, "SCHEMA_PARSE_EXCEPTION");
    return new Response(
      JSON.stringify({ status: "QUARANTINED_MALFORMED", tenant: tenant.id }),
      { status: 202, headers: { "Content-Type": "application/json" } }
    );
  }
}
