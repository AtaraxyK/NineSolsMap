import { env } from "cloudflare:workers";

const createProgressTable = `
  CREATE TABLE IF NOT EXISTS progress (
    marker_id TEXT PRIMARY KEY,
    completed INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
  )
`;

async function ensureProgressTable() {
  await env.DB.prepare(createProgressTable).run();
}

export async function GET() {
  await ensureProgressTable();
  const result = await env.DB.prepare(
    "SELECT marker_id FROM progress WHERE completed = 1 ORDER BY updated_at DESC"
  ).all<{ marker_id: string }>();

  return Response.json({ completedIds: result.results.map((row) => row.marker_id) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { markerId?: unknown; completed?: unknown };
  if (typeof body.markerId !== "string" || typeof body.completed !== "boolean") {
    return Response.json({ error: "잘못된 체크 요청입니다." }, { status: 400 });
  }

  await ensureProgressTable();

  if (body.completed) {
    await env.DB.prepare(
      `INSERT INTO progress (marker_id, completed, updated_at)
       VALUES (?, 1, ?)
       ON CONFLICT(marker_id) DO UPDATE SET completed = 1, updated_at = excluded.updated_at`
    )
      .bind(body.markerId, new Date().toISOString())
      .run();
  } else {
    await env.DB.prepare("DELETE FROM progress WHERE marker_id = ?")
      .bind(body.markerId)
      .run();
  }

  return Response.json({ ok: true });
}
