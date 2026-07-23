import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { SPREAD_METHODS } from "../src/data/spreads";
import { interpretReading } from "../src/lib/engine";
import { drawCards } from "../src/lib/random";
import {
  clearAllData,
  deleteReading,
  exportBackup,
  importBackup,
  listReadings,
  saveReading,
} from "../src/lib/storage";
import type { ReadingConfig, ReadingRecord } from "../src/types";

async function createReading(): Promise<ReadingRecord> {
  const method = SPREAD_METHODS[0];
  const config: ReadingConfig = {
    question: "Qual energia merece atenção hoje?",
    theme: "geral",
    methodId: method.id,
    reversals: true,
    deck: "Rider-Waite-Smith",
    depth: "completo",
    style: "tradicional",
    objectivity: 70,
    useLocalAI: false,
  };
  const { cards, audit } = await drawCards({ method, reversals: true });
  const createdAt = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: config.question,
    createdAt,
    updatedAt: createdAt,
    config,
    method,
    cards,
    audit,
    interpretation: interpretReading(cards, method, config),
    favorite: false,
  };
}

describe("persistência local", () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it("salva, lista e exclui uma leitura", async () => {
    const reading = await createReading();
    await saveReading(reading);
    expect(await listReadings()).toHaveLength(1);
    await deleteReading(reading.id);
    expect(await listReadings()).toHaveLength(0);
  });

  it("exporta e importa backup validado", async () => {
    await saveReading(await createReading());
    const backup = await exportBackup();
    expect(backup).toContain("oraculum-ai-backup");
    await clearAllData();
    await importBackup(backup);
    expect(await listReadings()).toHaveLength(1);
  });

  it("rejeita arquivos de backup desconhecidos", async () => {
    await expect(importBackup('{"format":"outro"}')).rejects.toThrow(
      "backup válido",
    );
  });
});
