import { describe, expect, it } from "vitest";
import { SPREAD_METHODS } from "../src/data/spreads";
import { interpretReading } from "../src/lib/engine";
import { readingAsMarkdown, readingAsText } from "../src/lib/export";
import { drawCards } from "../src/lib/random";
import type { ReadingConfig, ReadingRecord } from "../src/types";

describe("exportação", () => {
  it("gera Markdown e texto com auditoria", async () => {
    const method = SPREAD_METHODS[1];
    const config: ReadingConfig = {
      question: "O que preciso compreender?",
      theme: "autoconhecimento",
      methodId: method.id,
      reversals: true,
      deck: "Marselha",
      depth: "completo",
      style: "psicológico",
      objectivity: 60,
      useLocalAI: false,
    };
    const { cards, audit } = await drawCards({ method, reversals: true });
    const reading: ReadingRecord = {
      id: "test",
      title: "Leitura teste",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config,
      method,
      cards,
      audit,
      interpretation: interpretReading(cards, method, config),
      favorite: false,
    };
    const markdown = readingAsMarkdown(reading);
    const text = readingAsText(reading);
    expect(markdown).toContain("# Leitura teste");
    expect(markdown).toContain("Hash SHA-256");
    expect(text).not.toContain("**");
    expect(text).toContain(reading.cards[0].card.name);
  });
});
