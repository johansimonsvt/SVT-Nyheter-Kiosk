import React from "react";
import { formatHeadline } from "./formatHeadline";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFaces } from "./fonts";
import type { NewsItem } from "./types";

function formatSwedishDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildDateLine(item: NewsItem): string | null {
  if (!item.publishedAt && !item.updatedAt) return null;
  const parts: string[] = [];
  if (item.updatedAt) {
    parts.push(`Uppdaterad ${formatSwedishDate(item.updatedAt)}`);
  }
  if (item.publishedAt) {
    parts.push(`Publicerad ${formatSwedishDate(item.publishedAt)}`);
  }
  return parts.join(", ");
}

const LANDSCAPE = {
  margin: 50,
  top: 40,
  bottom: 80,
  number: 70,
  numberFont: 36,
  logo: 44,
  small: 18,
  headline: 78,
  headlineWidth: "85%",
  headlineLineMax: undefined,
  ingress: 28,
  ingressWidth: "75%",
};

const PORTRAIT = {
  margin: 56,
  top: 56,
  bottom: 160,
  number: 84,
  numberFont: 44,
  logo: 64,
  small: 26,
  headline: 76,
  headlineWidth: "100%",
  headlineLineMax: 24,
  ingress: 38,
  ingressWidth: "100%",
};

export const NewsCard: React.FC<{
  item: NewsItem;
  index: number;
  stationName?: string;
  settled?: boolean; // skip entry animations, show fully settled
}> = ({ item, index, stationName = "Stockholm", settled = false }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const portrait = height > width;
  const size = portrait ? PORTRAIT : LANDSCAPE;

  const imageX = settled ? 1 : spring({ frame, fps, config: { damping: 14, stiffness: 60 }, delay: 0 });
  const imageTranslateX = interpolate(imageX, [0, 1], [-width, 0]);

  const badgeScale = settled ? 1 : spring({ frame, fps, config: { damping: 12, stiffness: 100 }, delay: 10 });

  const headlineProgress = settled ? 1 : spring({ frame, fps, config: { damping: 14, stiffness: 50 }, delay: 15 });
  const headlineY = interpolate(headlineProgress, [0, 1], [60, 0]);
  const headlineOpacity = interpolate(headlineProgress, [0, 1], [0, 1]);

  const ingressProgress = settled ? 1 : spring({ frame, fps, config: { damping: 14, stiffness: 50 }, delay: 25 });
  const ingressY = interpolate(ingressProgress, [0, 1], [40, 0]);
  const ingressOpacity = interpolate(ingressProgress, [0, 1], [0, 1]);

  const dateProgress = settled ? 1 : spring({ frame, fps, config: { damping: 14, stiffness: 50 }, delay: 32 });
  const dateOpacity = interpolate(dateProgress, [0, 1], [0, 1]);
  const dateY = interpolate(dateProgress, [0, 1], [20, 0]);

  const barWidth = settled ? 100 : interpolate(frame, [8, 35], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const numberScale = settled ? 1 : spring({ frame, fps, config: { damping: 10, stiffness: 120 }, delay: 5 });

  const F = "Publik, Arial, sans-serif";

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a1a" }}>
      <style>{fontFaces}</style>

      {/* Background image */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          transform: `translateX(${imageTranslateX}px)`,
        }}
      >
        <Img
          src={(portrait && item.imageUrlPortrait) || item.imageUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.1) 70%)",
          }}
        />
      </div>

      {/* Number indicator */}
      <div
        style={{
          position: "absolute",
          top: size.top,
          right: size.margin,
          transform: `scale(${numberScale})`,
          backgroundColor: "#E02E3D",
          width: size.number,
          height: size.number,
          borderRadius: size.number / 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: "white", fontSize: size.numberFont, fontWeight: 800, fontFamily: F }}>
          {index + 1}
        </span>
      </div>

      {/* SVT branding top-left */}
      <div
        style={{
          position: "absolute",
          top: size.top,
          left: size.margin,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Img
          src={staticFile("SVT_nyheter.png")}
          style={{
            width: size.logo,
            height: size.logo,
            borderRadius: 6,
          }}
        />
        {stationName !== "Riksnyheter" && (
          <span style={{ color: "rgba(255,255,255,0.56)", fontSize: size.small, fontFamily: F, fontWeight: 600 }}>
            {stationName}
          </span>
        )}
      </div>

      {/* Content area */}
      <div
        style={{
          position: "absolute",
          bottom: size.bottom,
          left: size.margin,
          right: size.margin,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ transform: `scale(${badgeScale})`, transformOrigin: "left" }}>
          <span
            style={{
              backgroundColor: "#E02E3D",
              color: "white",
              fontSize: size.small,
              fontWeight: 700,
              fontFamily: F,
              padding: "6px 16px",
              borderRadius: 4,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {item.category}
          </span>
        </div>

        <div style={{ overflow: "hidden" }}>
          <h1
            style={{
              color: "white",
              fontSize: size.headline,
              fontWeight: 700,
              fontFamily: F,
              margin: 0,
              lineHeight: 1.15,
              whiteSpace: "pre-line",
              transform: `translateY(${headlineY}px)`,
              opacity: headlineOpacity,
              maxWidth: size.headlineWidth,
            }}
          >
            {formatHeadline(item.headline, size.headlineLineMax)}
          </h1>
        </div>

        {item.ingress && (
          <div style={{ overflow: "hidden" }}>
            <p
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: size.ingress,
                fontWeight: 400,
                fontFamily: F,
                margin: 0,
                lineHeight: 1.4,
                transform: `translateY(${ingressY}px)`,
                opacity: ingressOpacity,
                maxWidth: size.ingressWidth,
              }}
            >
              {item.ingress}
            </p>
          </div>
        )}

        {buildDateLine(item) && (
          <div style={{ overflow: "hidden" }}>
            <p
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: size.small,
                fontWeight: 400,
                fontFamily: F,
                margin: 0,
                transform: `translateY(${dateY}px)`,
                opacity: dateOpacity,
              }}
            >
              {buildDateLine(item)}
            </p>
          </div>
        )}

        <div
          style={{
            width: `${barWidth}%`,
            height: 4,
            backgroundColor: "#E02E3D",
            borderRadius: 2,
            marginTop: 8,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
