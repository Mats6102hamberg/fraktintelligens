# 🚢 FraktIntelligens

AI-driven fraktoptimering för svenska logistikchefer. Analysera dina fraktrutter och få konkreta förslag på hur du sänker kostnaderna med 15–30%.

## Live

- **Landningssida:** https://fraktintelligens.vercel.app
- **App:** https://fraktintelligens.vercel.app/app
- **GitHub:** https://github.com/Mats6102hamberg/fraktintelligens

## Stack

| Lager | Teknik |
|-------|--------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| AI | Anthropic Claude Haiku (claude-haiku-4-5-20251001) |
| Auth | Clerk |
| Databas | Neon PostgreSQL |
| Karta | Leaflet + OpenStreetMap |
| E-post | Resend (valfritt) |
| Deploy | Vercel |

## Funktioner

**Landningssida (`/`)**
- Hero, hur-det-fungerar, features, prissättning
- Kontaktformulär för Enterprise-kunder

**App (`/app`)** — kräver inloggning
- Lägg in fraktrutter (avsändare, mottagare, vikt, frekvens, kostnad, speditör, varutyp)
- Demo-data med ett klick
- AI-analys via Claude — besparingsförslag med %, kronor och implementeringssvårighet
- Speditörsjämförelse (DHL, PostNord, Schenker, Bring, DSV)
- Leaflet-karta med ruttvisualisering
- Historik — 10 senaste analyserna sparas lokalt
- PDF-export — utskrivbar rapport med styling
- Sparade rutter i localStorage
- Analyser sparas i databas per användare

## Komma igång lokalt

```bash
git clone https://github.com/Mats6102hamberg/fraktintelligens.git
cd fraktintelligens
npm install
cp .env.local.example .env.local   # fyll i nycklar
npm run dev
```

## Env-variabler

```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app
RESEND_API_KEY=re_...          # valfritt, för kontaktformulär
CONTACT_EMAIL=din@email.se     # valfritt, mottagare för kontaktformulär
```

## Databas

Kör `schema.sql` i Neon-konsolen för att skapa tabellerna:

```sql
-- saved_routes: sparar rutter per användare
-- analyses: sparar AI-analyser per användare
```

## API-routes

| Route | Metod | Funktion |
|-------|-------|----------|
| `/api/analyze` | POST | AI-analys av fraktrutter |
| `/api/routes` | GET, POST, DELETE | Sparade rutter (kräver auth) |
| `/api/analyses` | GET, POST | Analyshistorik (kräver auth) |
| `/api/contact` | POST | Kontaktformulär (Enterprise) |
