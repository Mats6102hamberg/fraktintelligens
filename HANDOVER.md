# HANDOVER – FraktIntelligens

## Projektöversikt
AI-driven fraktoptimering för svenska logistikchefer. Användaren matar in fraktrutter och får konkreta AI-förslag på hur kostnaderna kan sänkas 15–30%.

## Tech Stack

| Lager | Teknik |
|-------|--------|
| Frontend | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| AI | Anthropic Claude Haiku (claude-haiku-4-5-20251001) |
| Auth | Clerk |
| Databas | Neon PostgreSQL via @neondatabase/serverless |
| Karta | Leaflet + OpenStreetMap (dynamic import) |
| E-post | Resend (valfritt) |
| Deploy | Vercel |

## Arkitektur

```
/                  → Landningssida (statisk)
/app               → Huvud-app (kräver Clerk-auth)
/api/analyze       → AI-analys (Claude Haiku)
/api/routes        → CRUD sparade rutter (Neon + Clerk)
/api/analyses      → Analyshistorik (Neon + Clerk)
/api/contact       → Enterprise-kontaktformulär (Resend)
```

## Viktiga filer

| Fil | Funktion |
|-----|----------|
| `app/app/page.tsx` | Huvud-app — ruttformulär, AI-analys, karta, historik, speditörsjämförelse |
| `app/page.tsx` | Landningssida med kontaktformulär |
| `app/api/analyze/route.ts` | AI-prompt mot Anthropic, sparar analys i DB om inloggad |
| `components/RouteMap.tsx` | Leaflet-karta, dynamic import (SSR-safe), svenska städers koordinater |
| `components/ContactForm.tsx` | Enterprise-kontaktformulär |
| `lib/db.ts` | Neon-databasanslutning (singleton) |
| `middleware.ts` | Clerk-middleware — skyddar /app |
| `schema.sql` | Databasschema — kör i Neon-konsolen |

## Databasschema

```sql
saved_routes  — id, user_id, name, routes (JSONB), created_at
analyses      — id, user_id, routes (JSONB), analysis, total_cost, created_at
```

## Env-variabler

```env
ANTHROPIC_API_KEY=sk-ant-...              ✅ Satt i Vercel
DATABASE_URL=postgresql://...             ⏳ Neon — behövs
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...  ⏳ clerk.com — behövs
CLERK_SECRET_KEY=sk_...                   ⏳ clerk.com — behövs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app
RESEND_API_KEY=re_...                     (valfritt — kontaktformulär)
CONTACT_EMAIL=din@email.se               (valfritt — mottagare)
```

## Lokalt dev

```bash
git clone https://github.com/Mats6102hamberg/fraktintelligens.git
cd fraktintelligens
npm install
# Fyll i .env.local med nycklarna ovan
npm run dev
```

## Speditörer i jämförelsetabell

Hårdkodade estimat i `app/app/page.tsx`. Uppdatera vid behov:
- DHL, PostNord, Schenker, Bring, DSV
- Priser: inrikes pall + paket, leveranstid, styrka

## Städer på kartan

Koordinater för svenska städer finns i `components/RouteMap.tsx` i `CITY_COORDS`-objektet.
Lägg till fler städer vid behov (lowercase nyckel → `[lat, lng]`).

## AI-prompt

Finns i `app/api/analyze/route.ts`. Prompten ber Claude om:
1. Sammanfattning av nuläget
2. 3–5 konkreta optimeringsförslag med besparing i % och kr
3. Prioriteringsordning
4. Total potential

## Prisvalidering (/validate)

Fristående sida utan Clerk-auth. Tillgänglig direkt utan databas (faller tillbaka på marknadsriktpriser).

| Fil | Funktion |
|-----|----------|
| `app/validate/page.tsx` | UI: formulär + result-kort (grön/gul/röd) |
| `app/api/validate/route.ts` | POST: regelmotor → AI-förklaring → spara |
| `lib/validateShipment.ts` | Regelmotor — AI fattar INGA beslut här |
| `migration-validate.sql` | shipments-tabell, kör i Neon |

**Regelmotor:**
- ≥3 historiska frakter i DB för korridoren → använder deras genomsnitt
- <3 historiska → hårdkodade marknadsriktpriser per varutyp (kr/kg)
- >25% över riktpris → Avvikande (röd)
- 10–25% → Lite högt (gul)
- ≤10% → Rimligt (grön)

**AI-roll:** Formulerar ENBART en 2–3 meningars förklaring av beslutet. Fattar inget beslut.

**Migration att köra:** `migration-validate.sql` i Neon-konsolen.

## Nästa steg (förslag)

- Koppla upp Clerk + Neon för full auth + persistent historik
- Lägg till riktiga speditörspriser via API (Bring/DHL har öppna API:er)
- Prenumerationsmodell med Stripe (Gratis/Pro 999 kr/Enterprise)
- Onboarding-flöde för nya användare
- E-postaviseringar för sparade analyser

## Senast uppdaterat
2026-04-09 — Prisvalidering (/validate) tillagd
