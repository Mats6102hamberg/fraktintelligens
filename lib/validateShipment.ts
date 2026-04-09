// lib/validateShipment.ts
// Regelmotor för frakt-prisvalidering.
// AI fattar INGA beslut här — den används bara för att formulera förklaringen.

export type ValidationStatus = "rimligt" | "lite_hogt" | "avvikande";

export interface ShipmentInput {
  fromLocation: string;
  toLocation: string;
  weightKg?: number;
  goodsType?: string;
  carrier?: string;
  price: number;
  deliveryDays?: number;
}

export interface ValidationResult {
  status: ValidationStatus;
  label: string;           // "Rimligt" | "Lite högt" | "Avvikande"
  color: "green" | "yellow" | "red";
  percentAbove: number;    // negativt = under snitt
  benchmarkPrice: number;
  benchmarkSource: "historisk" | "marknad";
  sampleSize: number;      // antal historiska frakter, 0 = hårdkodat
  warnings: string[];
  recommendation: string;
}

// ---------------------------------------------------------------------------
// Hårdkodade marknadsriktpriser (kr/sändning, inrikes Sverige)
// Källa: speditörsjämförelsetabell i appen
// ---------------------------------------------------------------------------
const MARKET_BASE: Record<string, number> = {
  Pallar:        1050,
  Paket:          130,
  Styckegods:     900,
  Kylvaror:      1500,
  "Farligt gods": 1800,
  Containers:    3500,
  Annat:         1100,
};

// Extra kr/kg ovanpå bassatsen (för vikttillägg)
const MARKET_PER_KG: Record<string, number> = {
  Pallar:          1.5,
  Paket:           5.0,
  Styckegods:      2.0,
  Kylvaror:        3.0,
  "Farligt gods":  4.0,
  Containers:      0.5,
  Annat:           2.0,
};

// Utrikes-multiplikator (enkelt estimat)
const INTERNATIONAL_MULTIPLIER = 2.8;

const SWEDISH_CITIES = new Set([
  "stockholm", "göteborg", "malmö", "uppsala", "västerås", "örebro",
  "linköping", "helsingborg", "jönköping", "norrköping", "lund",
  "umeå", "gävle", "borås", "södertälje", "eskilstuna", "halmstad",
  "växjö", "karlstad", "sundsvall", "östersund", "trollhättan",
  "luleå", "borlänge", "falun", "kalmar", "skövde", "kristianstad",
]);

function isInrikes(from: string, to: string): boolean {
  return (
    SWEDISH_CITIES.has(from.toLowerCase().trim()) &&
    SWEDISH_CITIES.has(to.toLowerCase().trim())
  );
}

// ---------------------------------------------------------------------------
// Beräkna marknadsriktpris
// ---------------------------------------------------------------------------
function marketBenchmark(input: ShipmentInput): number {
  const goods = input.goodsType ?? "Annat";
  const base = MARKET_BASE[goods] ?? MARKET_BASE["Annat"];
  const perKg = MARKET_PER_KG[goods] ?? MARKET_PER_KG["Annat"];
  const weightExtra = input.weightKg ? Math.max(0, input.weightKg - 100) * perKg : 0;
  const price = base + weightExtra;
  return isInrikes(input.fromLocation, input.toLocation)
    ? price
    : Math.round(price * INTERNATIONAL_MULTIPLIER);
}

// ---------------------------------------------------------------------------
// Bestäm status från avvikelseprocent
// ---------------------------------------------------------------------------
function statusFromPercent(pct: number): ValidationStatus {
  if (pct > 25) return "avvikande";
  if (pct > 10) return "lite_hogt";
  return "rimligt";
}

const STATUS_LABELS: Record<ValidationStatus, string> = {
  rimligt:   "Rimligt",
  lite_hogt: "Lite högt",
  avvikande: "Avvikande",
};

const STATUS_COLORS: Record<ValidationStatus, "green" | "yellow" | "red"> = {
  rimligt:   "green",
  lite_hogt: "yellow",
  avvikande: "red",
};

// ---------------------------------------------------------------------------
// Bygg varningar
// ---------------------------------------------------------------------------
function buildWarnings(input: ShipmentInput, status: ValidationStatus): string[] {
  const warnings: string[] = [];
  if (input.deliveryDays && input.deliveryDays > 5 && status !== "rimligt") {
    warnings.push(`Lång leveranstid (${input.deliveryDays} dagar) i kombination med högt pris.`);
  }
  if (input.weightKg && input.weightKg > 1000 && status === "avvikande") {
    warnings.push("Hög vikt — kontrollera om volymbaserad prissättning ger ett bättre utfall.");
  }
  return warnings;
}

// ---------------------------------------------------------------------------
// Bygg rekommendation
// ---------------------------------------------------------------------------
function buildRecommendation(status: ValidationStatus, input: ShipmentInput): string {
  if (status === "rimligt") {
    return "Priset är i linje med marknaden. Ingen omedelbar åtgärd krävs.";
  }
  if (status === "lite_hogt") {
    const carrier = input.carrier ? `Begär en ny offert från ${input.carrier}` : "Begär offert från fler speditörer";
    return `${carrier} och jämför med alternativa aktörer.`;
  }
  return "Granska fakturan noggrant. Begär specifikation av tilläggsavgifter och jämför med minst två alternativa speditörer.";
}

// ---------------------------------------------------------------------------
// Huvud-funktion — kallas från API-routen med historisk data från DB
// ---------------------------------------------------------------------------
export function validateShipment(
  input: ShipmentInput,
  historicalPrices: number[]   // priser från DB för samma korridor+varutyp
): ValidationResult {
  let benchmarkPrice: number;
  let benchmarkSource: "historisk" | "marknad";
  let sampleSize: number;

  if (historicalPrices.length >= 3) {
    const avg = historicalPrices.reduce((a, b) => a + b, 0) / historicalPrices.length;
    benchmarkPrice = Math.round(avg);
    benchmarkSource = "historisk";
    sampleSize = historicalPrices.length;
  } else {
    benchmarkPrice = marketBenchmark(input);
    benchmarkSource = "marknad";
    sampleSize = 0;
  }

  const percentAbove = Math.round(((input.price - benchmarkPrice) / benchmarkPrice) * 100);
  const status = statusFromPercent(percentAbove);
  const warnings = buildWarnings(input, status);
  const recommendation = buildRecommendation(status, input);

  return {
    status,
    label: STATUS_LABELS[status],
    color: STATUS_COLORS[status],
    percentAbove,
    benchmarkPrice,
    benchmarkSource,
    sampleSize,
    warnings,
    recommendation,
  };
}
