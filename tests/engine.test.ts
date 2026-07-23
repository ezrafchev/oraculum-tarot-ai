import { describe, expect, it } from "vitest";
import { SPREAD_METHODS } from "../src/data/spreads";
import { interpretReading } from "../src/lib/engine";
import { drawCards } from "../src/lib/random";
import type { ReadingConfig } from "../src/types";

const config: ReadingConfig = {
  question: "O que merece atenção nesta decisão?",
  theme: "geral",
  methodId: "situation-obstacle-advice",
  reversals: true,
  deck: "Rider-Waite-Smith",
  depth: "completo",
  style: "profundo",
  objectivity: 65,
  useLocalAI: false,
};

describe("motor especialista", () => {
  it("produz as dez seções e interpreta cada posição", async () => {
    const method = SPREAD_METHODS.find(
      (item) => item.id === config.methodId,
    )!;
    const { cards } = await drawCards({ method, reversals: true });
    const result = interpretReading(cards, method, config);

    expect(result.directAnswer).toBeTruthy();
    expect(result.overview).toContain(config.question);
    expect(result.positions).toHaveLength(method.positions.length);
    expect(result.combinations.length).toBeGreaterThan(0);
    expect(result.favorable.length).toBeGreaterThan(0);
    expect(result.blocks.length).toBeGreaterThan(0);
    expect(result.advice).toBeTruthy();
    expect(result.symbolicTrend).toContain("tendência");
    expect(result.confidence).toBeGreaterThanOrEqual(42);
    expect(result.synthesis).toBeTruthy();
  });

  it("classifica Sim ou Não em escala graduada", async () => {
    const method = SPREAD_METHODS.find((item) => item.id === "yes-no")!;
    const { cards } = await drawCards({ method, reversals: true });
    const result = interpretReading(cards, method, {
      ...config,
      methodId: "yes-no",
    });

    expect(result.yesNo).toBeDefined();
    expect([
      "Sim",
      "Provavelmente sim",
      "Tendência favorável",
      "Indefinido",
      "Tendência desfavorável",
      "Provavelmente não",
      "Não",
    ]).toContain(result.yesNo?.verdict);
    expect(result.yesNo?.recommendation).toBeTruthy();
  });
});
