/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

const userDataSchema = `
CREATE TABLE IF NOT EXISTS user_data (
  user_email TEXT PRIMARY KEY NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;

const userDataUpdatedIndex = `
CREATE INDEX IF NOT EXISTS user_data_updated_at_idx
ON user_data(updated_at)`;

function apiJson(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function ensureUserDataSchema(database: D1Database) {
  await database.batch([
    database.prepare(userDataSchema),
    database.prepare(userDataUpdatedIndex),
  ]);
}

function authenticatedUser(request: Request) {
  const email = request.headers.get("oai-authenticated-user-email");
  if (!email) return null;
  const encodedName = request.headers.get("oai-authenticated-user-full-name");
  const encoding = request.headers.get(
    "oai-authenticated-user-full-name-encoding",
  );
  let fullName: string | null = null;
  if (encodedName && encoding === "percent-encoded-utf-8") {
    try {
      fullName = decodeURIComponent(encodedName);
    } catch {
      fullName = null;
    }
  }
  return { displayName: fullName ?? email, email, fullName };
}

async function handleSync(request: Request, env: Env) {
  const user = authenticatedUser(request);
  if (!user) return apiJson({ error: "authentication_required" }, 401);

  await ensureUserDataSchema(env.DB);

  if (request.method === "GET") {
    const row = await env.DB.prepare(
      "SELECT payload, updated_at FROM user_data WHERE user_email = ? LIMIT 1",
    )
      .bind(user.email)
      .first<{ payload: string; updated_at: string }>();
    return apiJson({
      user,
      data: row ? JSON.parse(row.payload) : null,
      updatedAt: row?.updated_at ?? null,
    });
  }

  if (request.method === "PUT") {
    const raw = await request.text();
    if (raw.length > 1_500_000) {
      return apiJson({ error: "payload_too_large" }, 413);
    }
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      return apiJson({ error: "invalid_json" }, 400);
    }
    if (!data || typeof data !== "object") {
      return apiJson({ error: "invalid_payload" }, 400);
    }
    const updatedAt = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO user_data (user_email, payload, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(user_email) DO UPDATE SET
         payload = excluded.payload,
         updated_at = excluded.updated_at`,
    )
      .bind(user.email, JSON.stringify(data), updatedAt)
      .run();
    return apiJson({ ok: true, updatedAt });
  }

  return apiJson({ error: "method_not_allowed" }, 405);
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/sync") {
      return handleSync(request, env);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
