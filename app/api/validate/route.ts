import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "@/lib/db";
import { validateShipment, ShipmentInput } from "@/lib/validateShipment";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input: ShipmentInput = {
      fromLocation: String(body.fromLocation ?? "").trim(),
      toLocation:   String(body.toLocation ?? "").trim(),
      price:        Number(body.price),
      weightKg:     body.weightKg ? Number(body.weightKg) : undefined,
      goodsType:    body.goodsType ?? undefined,
      carrier:      body.carrier ?? undefined,
      deliveryDays: body.deliveryDays ? Number(body.deliveryDays) : undefined,
    };

    if (!input.fromLocation || !input.toLocation || !input.price || input.price <= 0) {
      return NextResponse.json({ error: "Från, till och pris är obligatoriska." }, { status: 400 });
    }

    // Hämta historiska priser från DB för samma korridor + varutyp
    let historicalPrices: number[] = [];
    try {
      if (process.env.DATABASE_URL) {
        const sql = getDb();
        const rows = await sql`
          SELECT price FROM shipments
          WHERE LOWER(from_location) = LOWER(${input.fromLocation})
            AND LOWER(to_location)   = LOWER(${input.toLocation})
            AND (goods_type = ${input.goodsType ?? null} OR ${input.goodsType ?? null} IS NULL)
          ORDER BY created_at DESC
          LIMIT 50
        `;
        historicalPrices = rows.map((r: { price: number }) => r.price);
      }
    } catch { /* DB optional */ }

    // Kör regelmotor
    const result = validateShipment(input, historicalPrices);

    // AI formulerar förklaringen (fattar INGET beslut)
    let explanation = "";
    try {
      const corridorDesc = `${input.fromLocation} → ${input.toLocation}`;
      const benchmarkDesc = result.benchmarkSource === "historisk"
        ? `genomsnittet av ${result.sampleSize} liknande frakter i denna korridor (${result.benchmarkPrice.toLocaleString("sv-SE")} kr)`
        : `marknadsriktpriset för ${input.goodsType ?? "gods"} på inrikesrutter (${result.benchmarkPrice.toLocaleString("sv-SE")} kr)`;

      const prompt = `Du är en expert på fraktlogistik i Sverige. Din uppgift är ENBART att förklara ett redan fattat beslut för användaren — du ska INTE omvärdera priset.

FAKTA:
- Frakt: ${corridorDesc}
- Varutyp: ${input.goodsType ?? "okänd"}
- Speditör: ${input.carrier ?? "okänd"}
- Vikt: ${input.weightKg ? `${input.weightKg} kg` : "okänd"}
- Pris: ${input.price.toLocaleString("sv-SE")} kr
- Beslut: ${result.label} (${result.percentAbove > 0 ? `+${result.percentAbove}%` : `${result.percentAbove}%`} mot ${benchmarkDesc})
- Varningar: ${result.warnings.length > 0 ? result.warnings.join("; ") : "inga"}

Skriv 2–3 meningar på svenska som förklarar beslutet på ett begripligt sätt för en logistikchef. Var konkret och faktabaserad. Ingen rubrik, inga punktlistor.`;

      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      });
      explanation = msg.content[0].type === "text" ? msg.content[0].text : "";
    } catch { /* AI optional */ }

    // Spara frakt i DB för framtida jämförelser
    try {
      if (process.env.DATABASE_URL) {
        const sql = getDb();
        await sql`
          INSERT INTO shipments
            (from_location, to_location, weight_kg, goods_type, carrier, price, delivery_days, status)
          VALUES
            (${input.fromLocation}, ${input.toLocation}, ${input.weightKg ?? null},
             ${input.goodsType ?? null}, ${input.carrier ?? null}, ${input.price},
             ${input.deliveryDays ?? null}, ${result.status})
        `;
      }
    } catch { /* DB optional */ }

    return NextResponse.json({ ...result, explanation });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Okänt fel";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
