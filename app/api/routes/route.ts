import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM saved_routes WHERE user_id = ${userId} ORDER BY created_at DESC`;
    return NextResponse.json(rows);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Fel" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  try {
    const { name, routes } = await req.json();
    const sql = getDb();
    const result = await sql`
      INSERT INTO saved_routes (user_id, name, routes)
      VALUES (${userId}, ${name || "Mina rutter"}, ${JSON.stringify(routes)})
      RETURNING *
    `;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json((result as any)[0], { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Fel" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id krävs" }, { status: 400 });
  try {
    const sql = getDb();
    await sql`DELETE FROM saved_routes WHERE id = ${parseInt(id)} AND user_id = ${userId}`;
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Fel" }, { status: 500 });
  }
}
