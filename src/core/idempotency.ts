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

export class EphemeralIdempotencyLedger {
  private readonly store = new Map<string, number>();
  private readonly maxEntries: number;
  private evaluationsSinceSweep = 0;

  constructor(maxEntries = 50_000) {
    this.maxEntries = maxEntries;
  }

  public evaluate(canonicalInput: string, ttlSeconds = 3600): IdempotencyRecord {
    const now = Date.now();
    
    if (++this.evaluationsSinceSweep >= 1000) {
      this.evaluationsSinceSweep = 0;
      this.sweepExpired(now);
    }

    const fingerprint = `djb2:${computeDjb2(canonicalInput)}|fnv1a:${computeFnv1a(canonicalInput)}`;
    const expiresAt = this.store.get(fingerprint);

    if (expiresAt !== undefined) {
      if (expiresAt > now) {
        this.store.delete(fingerprint);
        this.store.set(fingerprint, expiresAt);
        return { fingerprint, duplicate: true, ttlSeconds };
      }
      this.store.delete(fingerprint);
    }

    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    const newExpiresAt = now + ttlSeconds * 1000;
    this.store.set(fingerprint, newExpiresAt);
    return { fingerprint, duplicate: false, ttlSeconds };
  }

  private sweepExpired(now: number): void {
    let swept = 0;
    for (const [key, expiresAt] of this.store.entries()) {
      if (expiresAt <= now) {
        this.store.delete(key);
        if (++swept >= 500) break;
      }
    }
  }
}
