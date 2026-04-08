"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { UserButton } from "@clerk/nextjs";
const RouteMap = dynamic(() => import("@/components/RouteMap"), { ssr: false, loading: () => <div className="bg-white rounded-2xl border border-gray-200 h-40 flex items-center justify-center text-sm text-gray-400">Laddar karta...</div> });

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

const DEMO_ROUTES: Route[] = [
  { id: "demo1", from: "Göteborg", to: "Stockholm", weight: "800", frequency: "12", cost: "1400", carrier: "DHL", goodsType: "Pallar" },
  { id: "demo2", from: "Malmö", to: "Stockholm", weight: "300", frequency: "8", cost: "950", carrier: "PostNord", goodsType: "Paket" },
  { id: "demo3", from: "Stockholm", to: "Sundsvall", weight: "500", frequency: "6", cost: "1100", carrier: "Schenker", goodsType: "Styckegods" },
];

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
  const [routes, setRoutes] = useState<Route[]>(() => {
    if (typeof window === "undefined") return [emptyRoute()];
    try {
      const saved = localStorage.getItem("fi-routes");
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [emptyRoute()];
    } catch { return [emptyRoute()]; }
  });
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<{ date: string; routes: Route[]; analysis: string; totalCost: number }[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("fi-history") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("fi-routes", JSON.stringify(routes));
  }, [routes]);

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
      const entry = { date: new Date().toLocaleString("sv-SE"), routes: valid, analysis: data.analysis, totalCost: data.totalMonthlyCost };
      setHistory(prev => {
        const updated = [entry, ...prev].slice(0, 10);
        localStorage.setItem("fi-history", JSON.stringify(updated));
        return updated;
      });
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
          <div className="flex items-center gap-2">
            <button onClick={() => { setRoutes(DEMO_ROUTES); setAnalysis(null); setError(null); setShowHistory(false); }}
              className="text-xs text-gray-400 hover:text-sky-600 border border-gray-200 hover:border-sky-300 px-3 py-1 rounded-full transition-colors">
              Exempeldata
            </button>
            {history.length > 0 && (
              <button onClick={() => setShowHistory(h => !h)}
                className={`text-xs border px-3 py-1 rounded-full transition-colors ${showHistory ? "bg-sky-100 text-sky-700 border-sky-200" : "text-gray-400 hover:text-sky-600 border-gray-200 hover:border-sky-300"}`}>
                Historik ({history.length})
              </button>
            )}
            <span className="text-xs bg-sky-50 text-sky-600 px-2 py-1 rounded-full font-medium">Gratis</span>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Optimera dina fraktrutter</h1>
          <p className="text-gray-500">Lägg in dina rutter nedan så analyserar AI:n var du kan spara pengar.</p>
        </div>

        {showHistory && (
          <div className="mb-8 bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Tidigare analyser</h2>
              <button onClick={() => { setHistory([]); localStorage.removeItem("fi-history"); setShowHistory(false); }}
                className="text-xs text-gray-400 hover:text-red-500">Rensa historik</button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {history.map((h, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-3 hover:border-sky-200 cursor-pointer transition-colors"
                  onClick={() => { setAnalysis(h.analysis); setTotalCost(h.totalCost); setRoutes(h.routes); setShowHistory(false); }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">{h.date}</span>
                    <span className="text-xs font-medium text-sky-600">{h.totalCost.toLocaleString("sv-SE")} kr/mån</span>
                  </div>
                  <p className="text-sm text-gray-700">{h.routes.length} rutter: {h.routes.map(r => `${r.from}→${r.to}`).join(", ")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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

            {/* Map */}
            <RouteMap routes={routes.filter(r => r.from && r.to)} />

            {/* Analysis */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xl">🤖</span>
                <h2 className="font-bold text-gray-900">AI-analys & Optimeringsförslag</h2>
              </div>
              <MarkdownText text={analysis} />
            </div>

            {/* Speditörsjämförelse */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4">📦 Speditörsjämförelse (estimat)</h2>
              <p className="text-xs text-gray-400 mb-4">Indikativa priser per sändning baserade på marknadsdata. Kontakta speditörerna för exakta offerter.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-100">
                      <th className="text-left pb-2 font-medium">Speditör</th>
                      <th className="text-right pb-2 font-medium">Inrikes pall</th>
                      <th className="text-right pb-2 font-medium">Inrikes paket</th>
                      <th className="text-right pb-2 font-medium">Leveranstid</th>
                      <th className="text-right pb-2 font-medium">Styrka</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      { name: "DHL", pall: "1 100–1 600", paket: "89–250", days: "1–2", strength: "Express, internationellt" },
                      { name: "PostNord", pall: "900–1 400", paket: "69–190", days: "1–3", strength: "Privatpersoner, e-handel" },
                      { name: "Schenker", pall: "850–1 300", paket: "95–270", days: "1–2", strength: "Industri, volym" },
                      { name: "Bring", pall: "950–1 450", paket: "79–220", days: "1–3", strength: "Norden, returlogistik" },
                      { name: "DSV", pall: "800–1 250", paket: "110–300", days: "1–2", strength: "Storvolym, Europa" },
                    ].map(c => (
                      <tr key={c.name} className={`${routes.some(r => r.carrier === c.name) ? "bg-sky-50" : ""}`}>
                        <td className="py-2.5 font-medium text-gray-900">
                          {c.name}
                          {routes.some(r => r.carrier === c.name) && <span className="ml-1 text-xs text-sky-500">● din</span>}
                        </td>
                        <td className="py-2.5 text-right text-gray-600">{c.pall} kr</td>
                        <td className="py-2.5 text-right text-gray-600">{c.paket} kr</td>
                        <td className="py-2.5 text-right text-gray-600">{c.days} dagar</td>
                        <td className="py-2.5 text-right text-gray-400 text-xs">{c.strength}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                  const routeRows = routes.filter(r => r.from && r.to).map((r, i) =>
                    `<tr><td>${i+1}</td><td>${r.from} → ${r.to}</td><td>${r.weight||"-"} kg</td><td>${r.frequency||"-"}/mån</td><td>${r.cost||"-"} kr</td><td>${r.carrier||"-"}</td></tr>`
                  ).join("");
                  const html = `<!DOCTYPE html><html lang="sv"><head><meta charset="utf-8">
<title>FraktIntelligens – Optimeringsrapport</title>
<style>
body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;color:#1a1a1a;line-height:1.6}
h1{font-size:1.6rem;color:#0284c7}h2{font-size:1rem;color:#555;margin-top:28px;border-bottom:1px solid #eee;padding-bottom:4px}
table{width:100%;border-collapse:collapse;font-size:.85rem;margin-top:8px}
th{text-align:left;padding:6px 8px;border-bottom:2px solid #eee;color:#666;font-weight:600}
td{padding:6px 8px;border-bottom:1px solid #f5f5f5}
.meta{color:#888;font-size:.85rem}.badge{background:#e0f2fe;color:#0284c7;padding:2px 8px;border-radius:99px;font-size:.8rem}
.savings{background:#f0fdf4;border:1px solid #bbf7d0;padding:12px 16px;border-radius:8px;margin:12px 0}
@media print{body{margin:20px}}
</style></head><body>
<p class="meta">🚢 FraktIntelligens · Exporterad ${new Date().toLocaleDateString("sv-SE")}</p>
<h1>Optimeringsrapport</h1>
<div class="savings">
  <strong>Nuvarande månadskostnad:</strong> ${totalCost.toLocaleString("sv-SE")} kr &nbsp;|&nbsp;
  <strong>Möjlig besparing:</strong> ~${Math.round(totalCost*0.225).toLocaleString("sv-SE")} kr/mån (15–30%)
</div>
<h2>Analyserade rutter</h2>
<table><tr><th>#</th><th>Rutt</th><th>Vikt</th><th>Frekvens</th><th>Kostnad</th><th>Speditör</th></tr>${routeRows}</table>
<h2>AI-analys & Optimeringsförslag</h2>
<div style="white-space:pre-wrap;font-size:.9rem">${(analysis||"").replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/^## (.*)/gm,"<h3 style='color:#0284c7'>$1</h3>").replace(/^- /gm,"• ")}</div>
<script>window.onload=()=>window.print()</script>
</body></html>`;
                  const w = window.open("","_blank");
                  w?.document.write(html); w?.document.close();
                }}
                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
              >
                ↓ Exportera PDF
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
