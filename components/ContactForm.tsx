"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, email, message }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
      setName(""); setCompany(""); setEmail(""); setMessage("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="kontakt" className="py-24 px-6 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2">Kontakta oss</h2>
        <p className="text-gray-500 text-center mb-10">Intresserad av Enterprise? Hör av dig så berättar vi mer.</p>

        {status === "done" ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-semibold text-green-800">Tack för ditt meddelande!</p>
            <p className="text-green-600 text-sm mt-1">Vi återkommer inom 24 timmar.</p>
            <button onClick={() => setStatus("idle")} className="mt-4 text-sm text-green-600 underline">Skicka ett till</button>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Namn *</label>
                <input value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Anna Svensson"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Företag</label>
                <input value={company} onChange={e => setCompany(e.target.value)}
                  placeholder="AB Logistik"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">E-post *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="anna@ablogistik.se"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Meddelande *</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4}
                placeholder="Berätta om er nuvarande fraktvolym och vad ni vill uppnå..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none" />
            </div>
            {status === "error" && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">Något gick fel. Försök igen.</p>
            )}
            <button type="submit" disabled={status === "sending"}
              className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
              {status === "sending" ? "Skickar..." : "Skicka meddelande"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
