import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { AppSettings, ReadingRecord, SpreadMethod } from "../types";

interface OraculumSchema extends DBSchema {
  readings: {
    key: string;
    value: ReadingRecord;
    indexes: { "by-date": string; "by-favorite": number };
  };
  methods: {
    key: string;
    value: SpreadMethod;
  };
  settings: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = "oraculum-ai";
const DB_VERSION = 1;
let databasePromise: Promise<IDBPDatabase<OraculumSchema>> | null = null;

const defaultSettings: AppSettings = {
  theme: "night",
  fontScale: 1,
  reduceMotion: false,
  highContrast: false,
  reversals: true,
  objectivity: 65,
};

function hasIndexedDB(): boolean {
  return typeof indexedDB !== "undefined";
}

function getDatabase(): Promise<IDBPDatabase<OraculumSchema>> {
  if (!databasePromise) {
    databasePromise = openDB<OraculumSchema>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        const readingStore = database.createObjectStore("readings", {
          keyPath: "id",
        });
        readingStore.createIndex("by-date", "createdAt");
        readingStore.createIndex("by-favorite", "favorite");
        database.createObjectStore("methods", { keyPath: "id" });
        database.createObjectStore("settings");
      },
    });
  }
  return databasePromise;
}

function localRead<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(`oraculum:${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function localWrite(key: string, value: unknown): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(`oraculum:${key}`, JSON.stringify(value));
}

export async function saveReading(reading: ReadingRecord): Promise<void> {
  if (hasIndexedDB()) {
    const database = await getDatabase();
    await database.put("readings", reading);
    return;
  }
  const readings = localRead<ReadingRecord[]>("readings", []);
  const next = readings.filter((item) => item.id !== reading.id);
  localWrite("readings", [reading, ...next]);
}

export async function listReadings(): Promise<ReadingRecord[]> {
  if (hasIndexedDB()) {
    const database = await getDatabase();
    return (await database.getAll("readings")).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }
  return localRead<ReadingRecord[]>("readings", []).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export async function deleteReading(id: string): Promise<void> {
  if (hasIndexedDB()) {
    const database = await getDatabase();
    await database.delete("readings", id);
    return;
  }
  localWrite(
    "readings",
    localRead<ReadingRecord[]>("readings", []).filter(
      (reading) => reading.id !== id,
    ),
  );
}

export async function saveMethod(method: SpreadMethod): Promise<void> {
  if (hasIndexedDB()) {
    const database = await getDatabase();
    await database.put("methods", method);
    return;
  }
  const methods = localRead<SpreadMethod[]>("methods", []);
  localWrite("methods", [
    method,
    ...methods.filter((item) => item.id !== method.id),
  ]);
}

export async function listMethods(): Promise<SpreadMethod[]> {
  if (hasIndexedDB()) {
    const database = await getDatabase();
    return database.getAll("methods");
  }
  return localRead<SpreadMethod[]>("methods", []);
}

export async function deleteMethod(id: string): Promise<void> {
  if (hasIndexedDB()) {
    const database = await getDatabase();
    await database.delete("methods", id);
    return;
  }
  localWrite(
    "methods",
    localRead<SpreadMethod[]>("methods", []).filter(
      (method) => method.id !== id,
    ),
  );
}

export async function loadSettings(): Promise<AppSettings> {
  if (hasIndexedDB()) {
    const database = await getDatabase();
    const settings = await database.get("settings", "app");
    return { ...defaultSettings, ...(settings as Partial<AppSettings>) };
  }
  return { ...defaultSettings, ...localRead("settings", {}) };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  if (hasIndexedDB()) {
    const database = await getDatabase();
    await database.put("settings", settings, "app");
    return;
  }
  localWrite("settings", settings);
}

export async function loadFavoriteCards(): Promise<string[]> {
  if (hasIndexedDB()) {
    const database = await getDatabase();
    return (
      (await database.get("settings", "favoriteCards")) as string[] | undefined
    ) ?? [];
  }
  return localRead<string[]>("favoriteCards", []);
}

export async function saveFavoriteCards(ids: string[]): Promise<void> {
  const uniqueIds = [...new Set(ids)];
  if (hasIndexedDB()) {
    const database = await getDatabase();
    await database.put("settings", uniqueIds, "favoriteCards");
    return;
  }
  localWrite("favoriteCards", uniqueIds);
}

export async function clearAllData(): Promise<void> {
  if (hasIndexedDB()) {
    const database = await getDatabase();
    const transaction = database.transaction(
      ["readings", "methods", "settings"],
      "readwrite",
    );
    await Promise.all([
      transaction.objectStore("readings").clear(),
      transaction.objectStore("methods").clear(),
      transaction.objectStore("settings").clear(),
      transaction.done,
    ]);
  }
  if (typeof localStorage !== "undefined") {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("oraculum:"))
      .forEach((key) => localStorage.removeItem(key));
  }
}

export async function exportBackup(): Promise<string> {
  const [readings, methods, settings] = await Promise.all([
    listReadings(),
    listMethods(),
    loadSettings(),
  ]);
  return JSON.stringify(
    {
      format: "oraculum-ai-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      readings,
      methods,
      settings,
    },
    null,
    2,
  );
}

export async function importBackup(payload: string): Promise<void> {
  const parsed = JSON.parse(payload) as {
    format?: string;
    readings?: ReadingRecord[];
    methods?: SpreadMethod[];
    settings?: AppSettings;
  };
  if (parsed.format !== "oraculum-ai-backup") {
    throw new Error("O arquivo não é um backup válido do ORACULUM AI.");
  }
  await Promise.all([
    ...(parsed.readings ?? []).map(saveReading),
    ...(parsed.methods ?? []).map(saveMethod),
  ]);
  if (parsed.settings) await saveSettings(parsed.settings);
}

export { defaultSettings };
