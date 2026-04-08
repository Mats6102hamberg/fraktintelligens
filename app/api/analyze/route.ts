import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { routes } = await req.json();
    if (!routes || !Array.isArray(routes) || routes.length === 0) {
      return NextResponse.json({ error: "Inga rutter att analysera" }, { status: 400 });
    }

    const routeText = routes.map((r: {
      from: string; to: string; weight: string; frequency: string;
      cost: string; carrier: string; goodsType: string;
    }, i: number) =>
      `Rutt ${i + 1}: ${r.from} → ${r.to} | Vikt: ${r.weight} kg | Frekvens: ${r.frequency}/mån | Kostnad: ${r.cost} kr/sändning | Speditör: ${r.carrier || "okänd"} | Varutyp: ${r.goodsType || "okänd"}`
    ).join("\n");

    const totalMonthlyCost = routes.reduce((sum: number, r: { cost: string; frequency: string }) => {
      return sum + (parseFloat(r.cost) || 0) * (parseFloat(r.frequency) || 0);
    }, 0);

    const prompt = `Du är en expert på fraktlogistik och transportoptimering i Sverige. Analysera följande fraktrutter och ge konkreta optimeringsförslag.

FRAKTRUTTER:
${routeText}

Total månadskostnad (estimat): ${totalMonthlyCost.toLocaleString("sv-SE")} kr/mån

Ge en strukturerad analys med:
1. **Sammanfattning** — kort bedömning av nuläget (2-3 meningar)
2. **Optimeringsförslag** — 3-5 konkreta åtgärder, varje förslag ska ha:
   - Vad som ska göras
   - Beräknad besparing i % och kronor/mån
   - Hur svårt det är att implementera (Enkelt/Medel/Komplext)
3. **Prioriteringsordning** — vilket förslag ger störst effekt snabbast?
4. **Total potential** — uppskattad total månadsbesparing om alla förslag implementeras

Var specifik och handlingsorienterad. Skriv på svenska. Använd markdown-formatering.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Save to DB if user is logged in
    try {
      const { userId } = await auth();
      if (userId && process.env.DATABASE_URL) {
        const sql = getDb();
        await sql`INSERT INTO analyses (user_id, routes, analysis, total_cost) VALUES (${userId}, ${JSON.stringify(routes)}, ${text}, ${Math.round(totalMonthlyCost)})`;
      }
    } catch { /* DB is optional */ }

    return NextResponse.json({ analysis: text, totalMonthlyCost });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Okänt fel";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
