import React, { useCallback, useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { Intro } from "./Intro";
import { SVTNews, calculateTotalDuration } from "./SVTNews";
import { fontFaces } from "./fonts";
import type { NewsItem, SVTNewsProps } from "./types";

const FPS = 25;
// Tom sträng = samma origin. I dev proxas /api → localhost:3200 via vite.config.ts
const API = "";
const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const RETRY_INTERVAL_MS = 60 * 1000; // 1 minute after a failed fetch
const FETCH_TIMEOUT_MS = 30 * 1000;
const KIOSK_DURATION_FRAMES = 30 * FPS; // exakt 30s loop för alla stationer
const INTRO_FRAMES = 3 * FPS;

interface KioskData {
  news: NewsItem[];
  stationName: string;
  stationSlug: string;
}

function getStationFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("station") || "riks";
}

function isPortraitFromUrl(): boolean {
  return new URLSearchParams(window.location.search).get("format") === "9x16";
}

function loadSavedData(station: string): KioskData | null {
  try {
    const saved = JSON.parse(localStorage.getItem(`kiosk-news:${station}`) || "null");
    return saved?.news?.length > 0 ? saved : null;
  } catch {
    return null;
  }
}

function saveData(station: string, data: KioskData) {
  try {
    localStorage.setItem(`kiosk-news:${station}`, JSON.stringify(data));
  } catch {
    // Storage can be blocked or full — the kiosk still works without it
  }
}

// Utan nyheter visas bara den röda plattan med logotyp och dagens datum
const KioskScreen: React.FC<SVTNewsProps> = (props) =>
  props.news.length > 0 ? <SVTNews {...props} /> : <Intro stationName={props.stationName} />;

export const Kiosk: React.FC = () => {
  const station = getStationFromUrl();
  const portrait = isPortraitFromUrl();
  const [{ news, stationName, stationSlug }, setData] = useState<KioskData>(
    () => loadSavedData(station) ?? { news: [], stationName: "", stationSlug: station }
  );
  const playerRef = useRef<PlayerRef>(null);
  const hasNews = news.length > 0;

  // Inject fonts
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = fontFaces;
    document.head.appendChild(style);
  }, []);

  // Returns true only when the API delivered fresh news
  const fetchNews = useCallback(async (): Promise<boolean> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(`${API}/api/news/${station}`, { signal: controller.signal });
      const data = await res.json();
      if (data.news && data.news.length > 0) {
        const next: KioskData = {
          news: data.news.slice(0, 3),
          stationName: data.station,
          stationSlug: data.urlSlug || data.slug || station,
        };
        setData(next);
        saveData(station, next);
        return !data.stale;
      }
      return false;
    } catch {
      // API unreachable — keep current news
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }, [station]);

  // Fetch immediately, then every 15 min — or sooner after a failure
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const run = async () => {
      const fresh = await fetchNews();
      if (!cancelled) timer = setTimeout(run, fresh ? REFRESH_INTERVAL_MS : RETRY_INTERVAL_MS);
    };
    run();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fetchNews]);

  // När första nyheterna kommer efter att plattan visats länge: börja om från början
  useEffect(() => {
    const player = playerRef.current;
    if (hasNews && player && player.getCurrentFrame() > INTRO_FRAMES) {
      player.seekTo(0);
    }
  }, [hasNews]);

  const totalDuration = calculateTotalDuration(news, KIOSK_DURATION_FRAMES);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          aspectRatio: portrait ? "9/16" : "16/9",
          maxWidth: "100vw",
          maxHeight: "100vh",
        }}
      >
        <Player
          ref={playerRef}
          component={KioskScreen}
          inputProps={{ news, stationName, stationSlug, targetDurationInFrames: KIOSK_DURATION_FRAMES }}
          durationInFrames={totalDuration}
          compositionWidth={portrait ? 1080 : 1920}
          compositionHeight={portrait ? 1920 : 1080}
          fps={FPS}
          style={{ width: "100%", height: "100%" }}
          autoPlay
          loop
          controls={false}
          muted
          acknowledgeRemotionLicense
        />
      </div>
    </div>
  );
};
