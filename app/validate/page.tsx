"use client";

import { useState } from "react";
import Link from "next/link";

interface FormState {
  fromLocation: string;
  toLocation: string;
  weightKg: string;
  goodsType: string;
  carrier: string;
  price: string;
  deliveryDays: string;
}

interface ValidationResult {
  status: "rimligt" | "lite_hogt" | "avvikande";
  label: string;
  color: "green" | "yellow" | "red";
  percentAbove: number;
  benchmarkPrice: number;
  benchmarkSource: "historisk" | "marknad";
  sampleSize: number;
  warnings: string[];
  recommendation: string;
  explanation: string;
}

const CARRIERS = ["DHL", "PostNord", "Schenker", "TNT/FedEx", "UPS", "Bring", "DSV", "Annat"];
const GOODS_TYPES = ["Pallar", "Paket", "Kylvaror", "Farligt gods", "Styckegods", "Containers", "Annat"];

const STATUS_CONFIG = {
  rimligt: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    badge: "bg-green-100 text-green-700",
    icon: "✓",
    dot: "bg-green-500",
  },
  lite_hogt: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
    badge: "bg-yellow-100 text-yellow-700",
    icon: "△",
    dot: "bg-yellow-500",
  },
  avvikande: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-100 text-red-700",
    icon: "⚠",
    dot: "bg-red-500",
  },
};

const emptyForm = (): FormState => ({
  fromLocation: "",
  toLocation: "",
  weightKg: "",
  goodsType: "",
  carrier: "",
  price: "",
  deliveryDays: "",
});

export default function ValidatePage() {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fromLocation || !form.toLocation || !form.price) {
      setError("Från, till och pris är obligatoriska.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromLocation: form.fromLocation,
          toLocation: form.toLocation,
          price: parseFloat(form.price),
          weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
          goodsType: form.goodsType || undefined,
          carrier: form.carrier || undefined,
          deliveryDays: form.deliveryDays ? parseInt(form.deliveryDays) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Något gick fel");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setForm(emptyForm());
    setResult(null);
    setError(null);
  }

  const cfg = result ? STATUS_CONFIG[result.status] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-sky-600 transition-colors">
            <span className="text-xl">🚢</span>
            <span className="font-bold">FraktIntelligens</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/app" className="text-xs text-gray-400 hover:text-sky-600 transition-colors">
              Ruttsoptimering
            </Link>
            <span className="text-xs bg-sky-100 text-sky-600 px-2 py-1 rounded-full font-medium">
              Prisvalidering
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Prisvalidering</h1>
          <p className="text-gray-500">Mata in en frakt och få direkt svar — är priset rimligt, lite högt eller avvikande?</p>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Frakt</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Från *</label>
                  <input
                    value={form.fromLocation}
                    onChange={e => update("fromLocation", e.target.value)}
                    placeholder="T.ex. Göteborg"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Till *</label>
                  <input
                    value={form.toLocation}
                    onChange={e => update("toLocation", e.target.value)}
                    placeholder="T.ex. Stockholm"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Pris (kr) *</label>
                  <input
                    type="number"
                    min="1"
                    value={form.price}
                    onChange={e => update("price", e.target.value)}
                    placeholder="T.ex. 1 400"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Vikt (kg)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.weightKg}
                    onChange={e => update("weightKg", e.target.value)}
                    placeholder="T.ex. 500"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Varutyp</label>
                  <select
                    value={form.goodsType}
                    onChange={e => update("goodsType", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    <option value="">Välj varutyp...</option>
                    {GOODS_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Speditör</label>
                  <select
                    value={form.carrier}
                    onChange={e => update("carrier", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    <option value="">Välj speditör...</option>
                    {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="w-1/2 pr-1.5">
                <label className="text-xs font-medium text-gray-500 block mb-1">Leveranstid (dagar)</label>
                <input
                  type="number"
                  min="1"
                  value={form.deliveryDays}
                  onChange={e => update("deliveryDays", e.target.value)}
                  placeholder="T.ex. 2"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white py-3.5 rounded-xl text-base font-semibold transition-colors shadow-lg shadow-sky-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Validerar...
                </span>
              ) : (
                "Validera priset →"
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Status-kort */}
            <div className={`rounded-2xl border p-6 ${cfg!.bg} ${cfg!.border}`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-full ${cfg!.badge}`}>
                  <span>{cfg!.icon}</span>
                  {result.label}
                </span>
                <span className={`text-xs font-medium ${cfg!.text}`}>
                  {result.percentAbove > 0 ? `+${result.percentAbove}%` : `${result.percentAbove}%`} mot riktpris
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Ditt pris</p>
                  <p className="text-xl font-extrabold text-gray-900">{form.price ? parseInt(form.price).toLocaleString("sv-SE") : "–"} kr</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Riktpris</p>
                  <p className="text-xl font-extrabold text-gray-700">{result.benchmarkPrice.toLocaleString("sv-SE")} kr</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Avvikelse</p>
                  <p className={`text-xl font-extrabold ${cfg!.text}`}>
                    {result.percentAbove > 0 ? `+${result.percentAbove}` : result.percentAbove}%
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-3 text-center">
                Riktpris baserat på{" "}
                {result.benchmarkSource === "historisk"
                  ? `${result.sampleSize} liknande frakter i databasen`
                  : "marknadsriktpriser (inga historiska data ännu)"}
              </p>
            </div>

            {/* AI-förklaring */}
            {result.explanation && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🤖</span>
                  <h2 className="text-sm font-semibold text-gray-700">Förklaring</h2>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{result.explanation}</p>
              </div>
            )}

            {/* Varningar */}
            {result.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-amber-700 mb-2">⚠ Varningar</h2>
                <ul className="space-y-1">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="text-sm text-amber-700">• {w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rekommendation */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Rekommendation</h2>
              <p className="text-sm text-gray-600">{result.recommendation}</p>
            </div>

            {/* Frakt-detaljer */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Analyserad frakt</h2>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-gray-500">Korridor</span>
                <span className="text-gray-900 font-medium">{form.fromLocation} → {form.toLocation}</span>
                {form.goodsType && <><span className="text-gray-500">Varutyp</span><span className="text-gray-900">{form.goodsType}</span></>}
                {form.carrier && <><span className="text-gray-500">Speditör</span><span className="text-gray-900">{form.carrier}</span></>}
                {form.weightKg && <><span className="text-gray-500">Vikt</span><span className="text-gray-900">{form.weightKg} kg</span></>}
                {form.deliveryDays && <><span className="text-gray-500">Leveranstid</span><span className="text-gray-900">{form.deliveryDays} dagar</span></>}
              </div>
            </div>

            <button
              onClick={reset}
              className="w-full border border-gray-200 hover:border-gray-300 text-gray-600 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              ← Validera en annan frakt
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
