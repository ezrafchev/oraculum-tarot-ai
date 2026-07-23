import { describe, expect, it } from "vitest";
import { SPREAD_METHODS } from "../src/data/spreads";
import { TAROT_DECK } from "../src/data/tarot";
import {
  drawCards,
  secureRandomInt,
  secureShuffle,
  secureUuid,
  sha256Hex,
} from "../src/lib/random";

describe("sorteio criptográfico", () => {
  it("usa limites válidos", () => {
    expect(() => secureRandomInt(0)).toThrow(RangeError);
    expect(() => secureRandomInt(-1)).toThrow(RangeError);
    expect(secureRandomInt(1)).toBe(0);
  });

  it("embaralha sem alterar ou duplicar o baralho", () => {
    const shuffled = secureShuffle(TAROT_DECK);
    expect(shuffled).toHaveLength(78);
    expect(new Set(shuffled.map((card) => card.id)).size).toBe(78);
    expect(TAROT_DECK).toHaveLength(78);
  });

  it("sorteia sem reposição, registra inversões e gera SHA-256", async () => {
    const method = SPREAD_METHODS.find(
      (item) => item.id === "celtic-cross",
    )!;
    const result = await drawCards({ method, reversals: true });

    expect(result.cards).toHaveLength(10);
    expect(new Set(result.cards.map((item) => item.card.id)).size).toBe(10);
    expect(
      result.cards.every(
        (item) =>
          item.orientation === "upright" || item.orientation === "reversed",
      ),
    ).toBe(true);
    expect(result.audit.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.audit.draws).toHaveLength(10);
    expect(result.audit.algorithm).toContain("Fisher");
  });

  it("desativa inversões quando configurado", async () => {
    const result = await drawCards({
      method: SPREAD_METHODS[5],
      reversals: false,
    });
    expect(result.cards.every((item) => item.orientation === "upright")).toBe(
      true,
    );
  });

  it("mantém o SHA-256 verificável quando SubtleCrypto não está disponível", async () => {
    const cryptoWithoutSubtle = { subtle: undefined } as unknown as Crypto;
    await expect(sha256Hex("abc", cryptoWithoutSubtle)).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("gera UUID v4 com getRandomValues quando randomUUID não existe", () => {
    const fallbackCrypto = {
      getRandomValues: (bytes: Uint8Array) => bytes.fill(0x2a),
    } as unknown as Crypto;
    expect(secureUuid(fallbackCrypto)).toBe(
      "2a2a2a2a-2a2a-4a2a-aa2a-2a2a2a2a2a2a",
    );
  });
});
