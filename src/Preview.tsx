import React, { useCallback, useEffect, useState } from "react";
import { Player } from "@remotion/player";
import { SVTNews, calculateTotalDuration } from "./SVTNews";
import { DEFAULT_NEWS } from "./fetch-news";
import { fontFaces } from "./fonts";
import type { NewsItem } from "./types";

const FPS = 25;
// Tom sträng = samma origin. I dev proxas /api → localhost:3200 via vite.config.ts
const API = "";

interface Station {
  slug: string;
  name: string;
}

const F = "Publik, Arial, sans-serif";

export const Preview: React.FC = () => {
  const [allNews, setAllNews] = useState<NewsItem[]>(DEFAULT_NEWS);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set([0, 1, 2]));
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState("riks");
  const [stationName, setStationName] = useState("Riksnyheter");
  const [stationSlug, setStationSlug] = useState("riks");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Använder sparade nyheter");

  const news = allNews.filter((_, i) => selectedIndices.has(i));

  useEffect(() => {
    fetch(`${API}/api/stations`)
      .then((r) => r.json())
      .then((data: Station[]) => setStations(data))
      .catch(() => {
        setStations([
          { slug: "blekinge", name: "Blekinge" },
          { slug: "dalarna", name: "Dalarna" },
          { slug: "gavleborg", name: "Gävleborg" },
          { slug: "halland", name: "Halland" },
          { slug: "helsingborg", name: "Helsingborg" },
          { slug: "jamtland", name: "Jämtland" },
          { slug: "jonkoping", name: "Jönköping" },
          { slug: "norrbotten", name: "Norrbotten" },
          { slug: "skane", name: "Skåne" },
          { slug: "smaland", name: "Småland" },
          { slug: "stockholm", name: "Stockholm" },
          { slug: "sodertalje", name: "Södertälje" },
          { slug: "sormland", name: "Sörmland" },
          { slug: "uppsala", name: "Uppsala" },
          { slug: "varmland", name: "Värmland" },
          { slug: "vast", name: "Väst" },
          { slug: "vasterbotten", name: "Västerbotten" },
          { slug: "vasternorrland", name: "Västernorrland" },
          { slug: "vastmanland", name: "Västmanland" },
          { slug: "orebro", name: "Örebro" },
          { slug: "ost", name: "Öst" },
        ]);
      });
  }, []);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setStatus(`Hämtar nyheter från SVT ${stationName}...`);
    try {
      const res = await fetch(`${API}/api/news/${selectedStation}`);
      const data = await res.json();
      if (data.news && data.news.length > 0) {
        setAllNews(data.news);
        setSelectedIndices(new Set([0, 1, 2].filter(i => i < data.news.length)));
        setStationName(data.station);
        setStationSlug(data.urlSlug || data.slug || selectedStation);
        setStatus(data.stale
          ? `SVT gick inte att läsa, visar senast hämtade nyheter för ${data.station}`
          : `Hämtat ${data.news.length} nyheter från SVT ${data.station}`);
      } else {
        setStatus(data.error ? `Hämtning misslyckades: ${data.error}` : "Inga nyheter hittades, behåller nuvarande");
      }
    } catch {
      setStatus("Kunde inte nå API-servern. Kör: node server.js");
    }
    setLoading(false);
  }, [selectedStation, stationName]);

  const handleStationChange = (slug: string) => {
    setSelectedStation(slug);
    const station = stations.find((s) => s.slug === slug);
    if (station) setStationName(station.name);
  };

  const toggleNewsItem = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const totalDuration = calculateTotalDuration(news);

  const btnStyle = (
    color: string,
    disabled: boolean
  ): React.CSSProperties => ({
    backgroundColor: disabled ? "#666" : color,
    color: "white",
    border: "none",
    padding: "10px 24px",
    fontSize: 16,
    fontWeight: 700,
    borderRadius: 8,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: F,
    whiteSpace: "nowrap",
  });

  return (
    <div
      style={{
        fontFamily: F,
        backgroundColor: "#111",
        color: "white",
        minHeight: "100vh",
        padding: 32,
      }}
    >
      <style>{fontFaces}</style>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 28, fontFamily: F }}>
            <span style={{ color: "#E02E3D" }}>SVT</span> Nyheter — Preview
          </h1>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <select
              value={selectedStation}
              onChange={(e) => handleStationChange(e.target.value)}
              style={{
                backgroundColor: "#333",
                color: "white",
                border: "1px solid #555",
                padding: "10px 16px",
                fontSize: 16,
                borderRadius: 8,
                fontFamily: F,
                cursor: "pointer",
                minWidth: 180,
              }}
            >
              {stations.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              onClick={fetchNews}
              disabled={loading}
              style={btnStyle("#E02E3D", loading)}
            >
              {loading ? "Hämtar..." : "Hämta nyheter"}
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div
          style={{
            backgroundColor: "#222",
            padding: "10px 16px",
            borderRadius: 6,
            marginBottom: 20,
            fontSize: 14,
            color: "#aaa",
            fontFamily: F,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{status}</span>
          <span style={{ color: "#666" }}>
            {totalDuration} frames @ {FPS}fps (
            {(totalDuration / FPS).toFixed(1)}s)
          </span>
        </div>

        {/* Player */}
        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          }}
        >
          <Player
            key={JSON.stringify(news) + stationName}
            component={SVTNews}
            inputProps={{ news, stationName, stationSlug }}
            durationInFrames={totalDuration}
            fps={FPS}
            compositionWidth={1920}
            compositionHeight={1080}
            style={{ width: "100%" }}
            controls
            autoPlay
            loop
          />
        </div>

        {/* News list */}
        <div style={{ marginTop: 24 }}>
          <h3
            style={{
              color: "#888",
              fontSize: 14,
              textTransform: "uppercase",
              fontFamily: F,
            }}
          >
            Nyheter ({selectedIndices.size} av {allNews.length} valda):
          </h3>
          {allNews.map((item, i) => {
            const isSelected = selectedIndices.has(i);
            return (
              <div
                key={i}
                onClick={() => toggleNewsItem(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "12px 16px",
                  borderBottom: "1px solid #333",
                  cursor: "pointer",
                  opacity: isSelected ? 1 : 0.4,
                  backgroundColor: isSelected ? "transparent" : "#1a1a1a",
                  borderRadius: 4,
                  transition: "opacity 0.2s, background-color 0.2s",
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleNewsItem(i)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: 20,
                    height: 20,
                    accentColor: "#E02E3D",
                    flexShrink: 0,
                    cursor: "pointer",
                  }}
                />
                <span
                  style={{
                    backgroundColor: isSelected ? "#E02E3D" : "#555",
                    color: "white",
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 16,
                    flexShrink: 0,
                    fontFamily: F,
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontFamily: F }}>
                    {item.headline}
                  </div>
                  {item.ingress && (
                    <div style={{ color: "#888", fontSize: 14, fontFamily: F }}>
                      {item.ingress}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
