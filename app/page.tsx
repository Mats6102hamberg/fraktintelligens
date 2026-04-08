import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚢</span>
            <span className="font-bold text-xl">FraktIntelligens</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#hur" className="hover:text-gray-900 transition-colors">Hur det fungerar</a>
            <a href="#features" className="hover:text-gray-900 transition-colors">Funktioner</a>
            <a href="#pris" className="hover:text-gray-900 transition-colors">Pris</a>
          </div>
          <Link href="/app" className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Prova gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 bg-gradient-to-b from-sky-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            🤖 AI-driven fraktoptimering
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Sänk dina fraktkostnader<br className="hidden md:block" />
            <span className="text-sky-500"> med 15–30%</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            FraktIntelligens analyserar dina fraktrutter med AI och ger dig konkreta förslag på hur du optimerar leveranser,
            konsoliderar sändningar och väljer rätt speditör — automatiskt.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/app" className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-colors shadow-lg shadow-sky-100">
              Börja optimera gratis →
            </Link>
            <a href="#hur" className="border border-gray-200 hover:border-gray-300 text-gray-600 px-8 py-3.5 rounded-xl text-base font-medium transition-colors">
              Se hur det fungerar
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-4">Inget kreditkort krävs · Kom igång på 2 minuter</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { value: "15–30%", label: "Lägre fraktkostnader" },
            { value: "< 2 min", label: "För att få en analys" },
            { value: "AI", label: "Claude Sonnet — bäst i klassen" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-sky-500">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hur det fungerar */}
      <section id="hur" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Hur det fungerar</h2>
          <p className="text-gray-500 text-center mb-16 max-w-xl mx-auto">Tre enkla steg från data till besparing.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", icon: "📋", title: "Lägg in dina rutter", desc: "Fyll i dina fraktrutter — avsändare, mottagare, vikt, frekvens och nuvarande kostnad." },
              { step: "2", icon: "🧠", title: "AI analyserar", desc: "Vår AI identifierar mönster, konsolideringsmöjligheter och bättre ruttval baserat på din data." },
              { step: "3", icon: "💰", title: "Få konkreta förslag", desc: "Detaljerade rekommendationer med beräknad besparing — direkt implementerbara." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-sky-500 uppercase tracking-widest mb-2">Steg {item.step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Allt du behöver för smartare frakt</h2>
          <p className="text-gray-500 text-center mb-16 max-w-xl mx-auto">Byggt för logistikchefer på medelstora svenska företag.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "🗺️", title: "Rutt-analys", desc: "Visualisera och analysera alla dina fraktrutter på ett ställe." },
              { icon: "🤖", title: "AI-optimering", desc: "Automatiska förslag på konsolidering, timing och speditörsbyte." },
              { icon: "💸", title: "Kostnadsberäkning", desc: "Se exakt hur mycket du sparar per förslag innan du implementerar." },
              { icon: "📦", title: "Konsolidering", desc: "Identifiera sändningar som kan slås ihop för lägre styckekostnad." },
              { icon: "⏱️", title: "Tidsoptimering", desc: "Hitta bättre leveransfönster som sänker kostnaden utan att påverka leveranstid." },
              { icon: "📊", title: "Sparrapport", desc: "Exportera en rapport med alla rekommendationer och beräknad total besparing." },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pris */}
      <section id="pris" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Enkel prissättning</h2>
          <p className="text-gray-500 text-center mb-16">Betala bara om du sparar.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Gratis", price: "0 kr", period: "", features: ["5 rutter", "3 AI-analyser/mån", "Grundläggande rapport"], cta: "Kom igång", highlight: false },
              { name: "Pro", price: "999 kr", period: "/mån", features: ["Obegränsade rutter", "Obegränsade analyser", "Full sparrapport", "Export (PDF/Excel)", "E-postsupport"], cta: "Prova Pro gratis 14 dagar", highlight: true },
              { name: "Enterprise", price: "Kontakta oss", period: "", features: ["Allt i Pro", "API-integration mot TMS", "Dedikerad account manager", "SLA 99.9%"], cta: "Kontakta oss", highlight: false },
            ].map((p) => (
              <div key={p.name} className={`rounded-2xl p-6 border ${p.highlight ? "border-sky-500 bg-sky-50 shadow-lg shadow-sky-100" : "border-gray-200"}`}>
                {p.highlight && <div className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-2">Populärast</div>}
                <h3 className="font-bold text-xl mb-1">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-extrabold">{p.price}</span>
                  <span className="text-gray-400 text-sm">{p.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-sky-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/app" className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${p.highlight ? "bg-sky-500 hover:bg-sky-600 text-white" : "border border-gray-200 hover:border-sky-300 text-gray-700"}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-sky-500">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-white mb-4">Redo att sänka dina fraktkostnader?</h2>
          <p className="text-sky-100 text-lg mb-8">Kom igång gratis på 2 minuter. Inget kreditkort krävs.</p>
          <Link href="/app" className="inline-block bg-white text-sky-600 font-bold px-8 py-4 rounded-xl text-lg hover:bg-sky-50 transition-colors shadow-xl">
            Börja optimera gratis →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100 text-center text-sm text-gray-400">
        <p>© 2026 FraktIntelligens · AI-driven fraktoptimering för svenska logistikchefer</p>
      </footer>
    </div>
  );
}
