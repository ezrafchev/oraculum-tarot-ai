import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { userDataSchema, userDataUpdatedIndex } from "../../../db/schema";

export const dynamic = "force-dynamic";

type D1Result<T> = { results?: T[] };
type D1Statement = {
  bind: (...values: unknown[]) => D1Statement;
  first: <T>() => Promise<T | null>;
  run: () => Promise<unknown>;
};
type D1Database = {
  prepare: (query: string) => D1Statement;
  batch: (statements: D1Statement[]) => Promise<D1Result<unknown>[]>;
};

function database(): D1Database {
  return (env as unknown as { DB: D1Database }).DB;
}

async function ensureSchema(db: D1Database) {
  await db.batch([
    db.prepare(userDataSchema),
    db.prepare(userDataUpdatedIndex),
  ]);
}

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "authentication_required" }, 401);

  const db = database();
  await ensureSchema(db);
  const row = await db
    .prepare(
      "SELECT payload, updated_at FROM user_data WHERE user_email = ? LIMIT 1",
    )
    .bind(user.email)
    .first<{ payload: string; updated_at: string }>();

  return json({
    user,
    data: row ? JSON.parse(row.payload) : null,
    updatedAt: row?.updated_at ?? null,
  });
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "authentication_required" }, 401);

  const raw = await request.text();
  if (raw.length > 1_500_000) return json({ error: "payload_too_large" }, 413);

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (!data || typeof data !== "object") {
    return json({ error: "invalid_payload" }, 400);
  }

  const db = database();
  await ensureSchema(db);
  const updatedAt = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO user_data (user_email, payload, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(user_email) DO UPDATE SET
         payload = excluded.payload,
         updated_at = excluded.updated_at`,
    )
    .bind(user.email, JSON.stringify(data), updatedAt)
    .run();

  return json({ ok: true, updatedAt });
}
