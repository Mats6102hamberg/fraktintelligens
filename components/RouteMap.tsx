"use client";

import { useEffect, useRef } from "react";

interface Route {
  from: string;
  to: string;
  cost: string;
  carrier: string;
}

interface RouteMapProps {
  routes: Route[];
}

// Swedish city coordinates
const CITY_COORDS: Record<string, [number, number]> = {
  "stockholm": [59.33, 18.07],
  "göteborg": [57.71, 11.97],
  "malmö": [55.60, 13.00],
  "uppsala": [59.86, 17.64],
  "västerås": [59.61, 16.55],
  "örebro": [59.27, 15.21],
  "linköping": [58.41, 15.62],
  "helsingborg": [56.05, 12.69],
  "jönköping": [57.78, 14.16],
  "norrköping": [58.59, 16.19],
  "lund": [55.70, 13.19],
  "umeå": [63.82, 20.26],
  "gävle": [60.67, 17.14],
  "borås": [57.72, 12.94],
  "sundsvall": [62.39, 17.31],
  "eskilstuna": [59.37, 16.51],
  "halmstad": [56.67, 12.86],
  "växjö": [56.88, 14.81],
  "karlstad": [59.38, 13.50],
  "lulea": [65.58, 22.15],
  "luleå": [65.58, 22.15],
};

function getCoords(city: string): [number, number] | null {
  const key = city.toLowerCase().trim();
  return CITY_COORDS[key] || null;
}

export default function RouteMap({ routes }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    import("leaflet").then(L => {
      // Fix default icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!).setView([62, 16], 5);
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const drawn = new Set<string>();

      routes.forEach((route, idx) => {
        const fromCoords = getCoords(route.from);
        const toCoords = getCoords(route.to);
        if (!fromCoords || !toCoords) return;

        const color = ["#0ea5e9", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"][idx % 5];

        // Markers
        if (!drawn.has(route.from)) {
          L.marker(fromCoords).addTo(map).bindPopup(`<b>${route.from}</b>`);
          drawn.add(route.from);
        }
        if (!drawn.has(route.to)) {
          L.marker(toCoords).addTo(map).bindPopup(`<b>${route.to}</b>`);
          drawn.add(route.to);
        }

        // Line
        L.polyline([fromCoords, toCoords], { color, weight: 2.5, opacity: 0.8 })
          .addTo(map)
          .bindPopup(`<b>${route.from} → ${route.to}</b><br>${route.carrier || "Okänd speditör"}<br>${route.cost ? route.cost + " kr/sändning" : ""}`);
      });

      // Fit bounds if we have coords
      const allCoords = routes.flatMap(r => {
        const f = getCoords(r.from);
        const t = getCoords(r.to);
        return [f, t].filter(Boolean) as [number, number][];
      });
      if (allCoords.length > 0) map.fitBounds(allCoords, { padding: [40, 40] });
    });

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-900">🗺️ Ruttkarta</h2>
        <p className="text-xs text-gray-400 mt-0.5">Städer som inte finns på kartan syns inte — kontrollera stavning</p>
      </div>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <div ref={mapRef} style={{ height: 360 }} />
    </div>
  );
}
