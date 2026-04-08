import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, company, email, message } = await req.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Namn, e-post och meddelande krävs" }, { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      // No email configured — just log and return ok (for demo purposes)
      console.log("Kontaktformulär:", { name, company, email, message });
      return NextResponse.json({ ok: true });
    }

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL ?? "noreply@fraktintelligens.se",
        to: process.env.CONTACT_EMAIL ?? "mats@fraktintelligens.se",
        subject: `Enterprise-förfrågan från ${name} (${company || "okänt företag"})`,
        text: `Namn: ${name}\nFöretag: ${company || "-"}\nE-post: ${email}\n\nMeddelande:\n${message}`,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Fel" }, { status: 500 });
  }
}
