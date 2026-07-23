import { describe, expect, it } from "vitest";
import { TAROT_DECK } from "../src/data/tarot";

describe("baralho completo", () => {
  it("contém exatamente 78 cartas sem duplicidades", () => {
    expect(TAROT_DECK).toHaveLength(78);
    expect(new Set(TAROT_DECK.map((card) => card.id)).size).toBe(78);
    expect(new Set(TAROT_DECK.map((card) => card.name)).size).toBe(78);
  });

  it("contém 22 Arcanos Maiores e 56 Arcanos Menores", () => {
    expect(TAROT_DECK.filter((card) => card.arcana === "major")).toHaveLength(
      22,
    );
    expect(TAROT_DECK.filter((card) => card.arcana === "minor")).toHaveLength(
      56,
    );
  });

  it.each(["Paus", "Copas", "Espadas", "Ouros"])(
    "contém 14 cartas de %s",
    (suit) => {
      expect(TAROT_DECK.filter((card) => card.suit === suit)).toHaveLength(14);
    },
  );

  it("preenche todos os campos especialistas", () => {
    for (const card of TAROT_DECK) {
      expect(card.id).toBeTruthy();
      expect(card.name).toBeTruthy();
      expect(card.element).toBeTruthy();
      expect(card.astrology).toBeTruthy();
      expect(card.keywordsUpright.length).toBeGreaterThanOrEqual(3);
      expect(card.keywordsReversed.length).toBeGreaterThanOrEqual(3);
      expect(Object.values(card.meanings).every(Boolean)).toBe(true);
      expect(card.advice).toBeTruthy();
      expect(card.warning).toBeTruthy();
      expect(card.light).toBeTruthy();
      expect(card.shadow).toBeTruthy();
      expect(card.visualDescription).toBeTruthy();
      expect(card.relations.length).toBeGreaterThanOrEqual(2);
    }
  });
});
