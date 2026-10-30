// src/core/idempotency.ts

export interface IdempotencyRecord {
  fingerprint: string;
  duplicate: boolean;
  ttlSeconds: number;
}

export function computeDjb2(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function computeFnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Ephemeral in-memory sliding-window TTL ledger.
 * Zero disk I/O; zero PII persisted at rest.
 */
export class EphemeralIdempotencyLedger {
  private readonly store = new Map<string, number>();
  private readonly maxEntries: number;

  constructor(maxEntries = 50_000) {
    this.maxEntries = maxEntries;
  }

  public evaluate(canonicalInput: string, ttlSeconds = 3600): IdempotencyRecord {
    const now = Date.now();
    const fingerprint = `djb2:${computeDjb2(canonicalInput)}|fnv1a:${computeFnv1a(canonicalInput)}`;

    const expiresAt = this.store.get(fingerprint);
    if (expiresAt !== undefined && expiresAt > now) {
      return { fingerprint, duplicate: true, ttlSeconds };
    }

    if (this.store.size >= this.maxEntries) {
      this.evictExpired(now);
    }

    this.store.set(fingerprint, now + ttlSeconds * 1000);
    return { fingerprint, duplicate: false, ttlSeconds };
  }

  private evictExpired(now: number): void {
    for (const [key, expiry] of this.store.entries()) {
      if (expiry <= now) {
        this.store.delete(key);
      }
    }
  }
}
