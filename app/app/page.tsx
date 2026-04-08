"use client";

import { useState } from "react";
import Link from "next/link";

interface Route {
  id: string;
  from: string;
  to: string;
  weight: string;
  frequency: string;
  cost: string;
  carrier: string;
  goodsType: string;
}

const emptyRoute = (): Route => ({
  id: Math.random().toString(36).slice(2),
  from: "",
  to: "",
  weight: "",
  frequency: "",
  cost: "",
  carrier: "",
  goodsType: "",
});

const CARRIERS = ["DHL", "PostNord", "Schenker", "TNT/FedEx", "UPS", "Bring", "DSV", "Annat"];
const GOODS_TYPES = ["Pallar", "Paket", "Kylvaror", "Farligt gods", "Styckegods", "Containers", "Annat"];

function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) return <h2 key={i} className="text-base font-bold text-gray-900 mt-4 first:mt-0">{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} className="text-sm font-bold text-gray-800 mt-3">{line.slice(4)}</h3>;
        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold text-gray-900">{line.slice(2, -2)}</p>;
        if (line.match(/^\d+\.\s\*\*/)) {
          const parts = line.replace(/^\d+\.\s/, "").split("**");
          return (
            <p key={i} className="pl-2 border-l-2 border-sky-200">
              {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
            </p>
          );
        }
        if (line.startsWith("- ")) return <li key={i} className="ml-4 list-disc text-gray-600">{line.slice(2)}</li>;
        if (line.trim() === "") return <div key={i} className="h-1" />;
        // Inline bold
        const parts = line.split(/\*\*(.*?)\*\*/g);
        if (parts.length > 1) return <p key={i}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-gray-900">{p}</strong> : p)}</p>;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

export default function AppPage() {
  const [routes, setRoutes] = useState<Route[]>([emptyRoute()]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRoute(id: string, field: keyof Route, value: string) {
    setRoutes(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

  function addRoute() {
    setRoutes(prev => [...prev, emptyRoute()]);
  }

  function removeRoute(id: string) {
    if (routes.length === 1) return;
    setRoutes(prev => prev.filter(r => r.id !== id));
  }

  async function analyze() {
    const valid = routes.filter(r => r.from.trim() && r.to.trim() && r.cost.trim());
    if (valid.length === 0) {
      setError("Fyll i minst en rutt med avsändare, mottagare och kostnad.");
      return;
    }
    setError(null);
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routes: valid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data.analysis);
      setTotalCost(data.totalMonthlyCost);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Något gick fel");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setRoutes([emptyRoute()]);
    setAnalysis(null);
    setError(null);
    setTotalCost(0);
  }

  const estimatedMonthly = routes.reduce((sum, r) => {
    return sum + (parseFloat(r.cost) || 0) * (parseFloat(r.frequency) || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-sky-600 transition-colors">
            <span className="text-xl">🚢</span>
            <span className="font-bold">FraktIntelligens</span>
          </Link>
          <span className="text-xs text-gray-400 bg-sky-50 text-sky-600 px-2 py-1 rounded-full font-medium">Gratis</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Optimera dina fraktrutter</h1>
          <p className="text-gray-500">Lägg in dina rutter nedan så analyserar AI:n var du kan spara pengar.</p>
        </div>

        {!analysis ? (
          <div className="space-y-4">
            {/* Route forms */}
            {routes.map((route, idx) => (
              <div key={route.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700">Rutt {idx + 1}</h3>
                  {routes.length > 1 && (
                    <button onClick={() => removeRoute(route.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                      Ta bort
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Avsändare *</label>
                    <input
                      value={route.from}
                      onChange={e => updateRoute(route.id, "from", e.target.value)}
                      placeholder="T.ex. Göteborg"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Mottagare *</label>
                    <input
                      value={route.to}
                      onChange={e => updateRoute(route.id, "to", e.target.value)}
                      placeholder="T.ex. Stockholm"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Vikt per sändning (kg)</label>
                    <input
                      type="number"
                      value={route.weight}
                      onChange={e => updateRoute(route.id, "weight", e.target.value)}
                      placeholder="T.ex. 500"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Frekvens (sändningar/mån)</label>
                    <input
                      type="number"
                      value={route.frequency}
                      onChange={e => updateRoute(route.id, "frequency", e.target.value)}
                      placeholder="T.ex. 8"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Kostnad per sändning (kr) *</label>
                    <input
                      type="number"
                      value={route.cost}
                      onChange={e => updateRoute(route.id, "cost", e.target.value)}
                      placeholder="T.ex. 1200"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Nuvarande speditör</label>
                    <select
                      value={route.carrier}
                      onChange={e => updateRoute(route.id, "carrier", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    >
                      <option value="">Välj speditör...</option>
                      {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Varutyp</label>
                    <select
                      value={route.goodsType}
                      onChange={e => updateRoute(route.id, "goodsType", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    >
                      <option value="">Välj varutyp...</option>
                      {GOODS_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {/* Add route */}
            <button
              onClick={addRoute}
              className="w-full border-2 border-dashed border-gray-200 hover:border-sky-300 text-gray-400 hover:text-sky-500 rounded-2xl py-4 text-sm font-medium transition-colors"
            >
              + Lägg till rutt
            </button>

            {/* Summary bar */}
            {estimatedMonthly > 0 && (
              <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-sky-700">Estimerad månadskostnad</span>
                <span className="font-bold text-sky-700">{estimatedMonthly.toLocaleString("sv-SE")} kr/mån</span>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              onClick={analyze}
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white py-3.5 rounded-xl text-base font-semibold transition-colors shadow-lg shadow-sky-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyserar med AI...
                </span>
              ) : (
                "🤖 Analysera och optimera"
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cost overview */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                <p className="text-xs text-gray-500 mb-1">Nuvarande kostnad</p>
                <p className="text-2xl font-extrabold text-gray-900">{totalCost.toLocaleString("sv-SE")} kr</p>
                <p className="text-xs text-gray-400">per månad</p>
              </div>
              <div className="bg-green-50 rounded-2xl border border-green-100 p-5 text-center">
                <p className="text-xs text-green-600 mb-1">Möjlig besparing</p>
                <p className="text-2xl font-extrabold text-green-600">{Math.round(totalCost * 0.225).toLocaleString("sv-SE")} kr</p>
                <p className="text-xs text-green-500">~15–30% per månad</p>
              </div>
              <div className="bg-sky-50 rounded-2xl border border-sky-100 p-5 text-center">
                <p className="text-xs text-sky-600 mb-1">Rutter analyserade</p>
                <p className="text-2xl font-extrabold text-sky-600">{routes.filter(r => r.from && r.to && r.cost).length}</p>
                <p className="text-xs text-sky-400">stycken</p>
              </div>
            </div>

            {/* Analysis */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xl">🤖</span>
                <h2 className="font-bold text-gray-900">AI-analys & Optimeringsförslag</h2>
              </div>
              <MarkdownText text={analysis} />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 border border-gray-200 hover:border-gray-300 text-gray-600 py-3 rounded-xl text-sm font-medium transition-colors"
              >
                ← Ny analys
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([`FRAKTINTELLIGENS – OPTIMERINGSRAPPORT\n${"=".repeat(40)}\n\nDatum: ${new Date().toLocaleDateString("sv-SE")}\nMånadskostnad: ${totalCost.toLocaleString("sv-SE")} kr\n\nRUTTER:\n${routes.filter(r => r.from && r.to).map((r, i) => `${i + 1}. ${r.from} → ${r.to} | ${r.weight || "?"} kg | ${r.frequency || "?"}/mån | ${r.cost || "?"} kr`).join("\n")}\n\nANALYS:\n${analysis}`], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "fraktintelligens-rapport.txt"; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
              >
                ↓ Ladda ner rapport
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
