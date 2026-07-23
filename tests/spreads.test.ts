import { describe, expect, it } from "vitest";
import { SPREAD_METHODS } from "../src/data/spreads";

describe("métodos de tiragem", () => {
  it("oferece pelo menos vinte métodos", () => {
    expect(SPREAD_METHODS.length).toBeGreaterThanOrEqual(20);
  });

  it("possui identificadores únicos e posições válidas", () => {
    expect(new Set(SPREAD_METHODS.map((method) => method.id)).size).toBe(
      SPREAD_METHODS.length,
    );
    for (const method of SPREAD_METHODS) {
      expect(method.name.length).toBeGreaterThan(2);
      expect(method.positions.length).toBeGreaterThan(0);
      expect(method.positions.length).toBeLessThanOrEqual(78);
    }
  });

  it("inclui todos os métodos avançados obrigatórios", () => {
    const ids = SPREAD_METHODS.map((method) => method.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "daily",
        "single",
        "yes-no",
        "astrological-mandala",
        "horseshoe",
        "celtic-cross",
      ]),
    );
  });
});
