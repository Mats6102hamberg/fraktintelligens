import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM analyses WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20`;
    return NextResponse.json(rows);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Fel" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  try {
    const { routes, analysis, total_cost } = await req.json();
    const sql = getDb();
    const result = await sql`
      INSERT INTO analyses (user_id, routes, analysis, total_cost)
      VALUES (${userId}, ${JSON.stringify(routes)}, ${analysis}, ${total_cost})
      RETURNING *
    `;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json((result as any)[0], { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Fel" }, { status: 500 });
  }
}
