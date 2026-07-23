import { TAROT_DECK, TAROT_ENGINE_VERSION } from "../data/tarot";
import type {
  AuditRecord,
  DrawnCard,
  Orientation,
  SpreadMethod,
  TarotCardData,
} from "../types";

export const SHUFFLE_ALGORITHM =
  "Fisher–Yates com Web Crypto API e rejection sampling de 32 bits";

export function secureRandomInt(
  maxExclusive: number,
  cryptoSource: Crypto = globalThis.crypto,
): number {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError("O limite precisa ser um inteiro positivo.");
  }
  if (maxExclusive > 0x100000000) {
    throw new RangeError("O limite excede o intervalo seguro de 32 bits.");
  }

  const range = 0x100000000;
  const rejectionLimit = Math.floor(range / maxExclusive) * maxExclusive;
  const buffer = new Uint32Array(1);
  let value: number;

  do {
    cryptoSource.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= rejectionLimit);

  return value % maxExclusive;
}

export function secureShuffle<T>(
  values: readonly T[],
  cryptoSource: Crypto = globalThis.crypto,
): T[] {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomInt(index + 1, cryptoSource);
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

export function secureUuid(
  cryptoSource: Crypto = globalThis.crypto,
): string {
  if (typeof cryptoSource.randomUUID === "function") {
    return cryptoSource.randomUUID();
  }

  const bytes = new Uint8Array(16);
  cryptoSource.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

function orientationFor(
  reversals: boolean,
  cryptoSource: Crypto,
): Orientation {
  if (!reversals) return "upright";
  return secureRandomInt(2, cryptoSource) === 0 ? "upright" : "reversed";
}

const SHA256_ROUND_CONSTANTS = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b,
  0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
  0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7,
  0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152,
  0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
  0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
  0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
  0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
  0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
] as const;

function rotateRight(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256Fallback(bytes: Uint8Array): string {
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const bitLength = bytes.length * 8;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);

  const hash = new Uint32Array([
    0x6a09e667,
    0xbb67ae85,
    0x3c6ef372,
    0xa54ff53a,
    0x510e527f,
    0x9b05688c,
    0x1f83d9ab,
    0x5be0cd19,
  ]);
  const words = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(offset + index * 4);
    }
    for (let index = 16; index < 64; index += 1) {
      const previous15 = words[index - 15];
      const previous2 = words[index - 2];
      const sigma0 =
        rotateRight(previous15, 7) ^
        rotateRight(previous15, 18) ^
        (previous15 >>> 3);
      const sigma1 =
        rotateRight(previous2, 17) ^
        rotateRight(previous2, 19) ^
        (previous2 >>> 10);
      words[index] =
        (words[index - 16] + sigma0 + words[index - 7] + sigma1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const sum1 =
        rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temporary1 =
        (h +
          sum1 +
          choice +
          SHA256_ROUND_CONSTANTS[index] +
          words[index]) >>>
        0;
      const sum0 =
        rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temporary2 = (sum0 + majority) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temporary1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temporary1 + temporary2) >>> 0;
    }

    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }

  return [...hash]
    .map((word) => word.toString(16).padStart(8, "0"))
    .join("");
}

export async function sha256Hex(
  value: string,
  cryptoSource: Crypto = globalThis.crypto,
): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  if (cryptoSource.subtle?.digest) {
    const digest = await cryptoSource.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return sha256Fallback(bytes);
}

export async function drawCards({
  method,
  reversals,
  deck = TAROT_DECK,
  cryptoSource = globalThis.crypto,
  timestamp = new Date().toISOString(),
}: {
  method: SpreadMethod;
  reversals: boolean;
  deck?: readonly TarotCardData[];
  cryptoSource?: Crypto;
  timestamp?: string;
}): Promise<{ cards: DrawnCard[]; audit: AuditRecord }> {
  if (method.positions.length > deck.length) {
    throw new RangeError("A tiragem possui mais posições do que cartas.");
  }

  const shuffled = secureShuffle(deck, cryptoSource);
  const cards: DrawnCard[] = method.positions.map((position, index) => ({
    card: shuffled[index],
    orientation: orientationFor(reversals, cryptoSource),
    order: index + 1,
    position,
  }));

  const proofPayload = {
    algorithm: SHUFFLE_ALGORITHM,
    engineVersion: TAROT_ENGINE_VERSION,
    timestamp,
    deckSize: deck.length,
    draws: cards.map(({ card, orientation, order, position }) => ({
      order,
      cardId: card.id,
      cardName: card.name,
      orientation,
      position,
    })),
  };

  const audit: AuditRecord = {
    ...proofPayload,
    count: cards.length,
    hash: await sha256Hex(JSON.stringify(proofPayload), cryptoSource),
  };

  return { cards, audit };
}
