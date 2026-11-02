import React from "react";
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

export const Intro: React.FC<{ stationName?: string }> = ({
  stationName = "Stockholm",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const portrait = height > width;

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
    delay: 5,
  });

  const stationOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const stationY = interpolate(frame, [20, 35], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lineWidth = interpolate(frame, [30, 50], [0, portrait ? 560 : 400], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dateOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#E02E3D",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <style>{fontFaces}</style>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        {/* SVT Nyheter logo */}
        <div
          style={{
            transform: `scale(${logoScale})`,
          }}
        >
          <Img
            src={staticFile("SVT_nyheter.png")}
            style={{
              width: portrait ? 380 : 280,
              height: portrait ? 380 : 280,
              borderRadius: 24,
            }}
          />
        </div>

        {/* Station name — not shown for Riksnyheter, which moves the date up */}
        {stationName && stationName !== "Riksnyheter" && (
          <div
            style={{
              opacity: stationOpacity,
              transform: `translateY(${stationY}px)`,
            }}
          >
            <h2
              style={{
                color: "rgba(255,255,255,0.95)",
                fontSize: portrait ? 64 : 48,
                fontWeight: 400,
                fontFamily: "Publik, Arial, sans-serif",
                margin: 0,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              {stationName}
            </h2>
          </div>
        )}

        {/* Divider line */}
        <div
          style={{
            width: lineWidth,
            height: 3,
            backgroundColor: "rgba(255,255,255,0.5)",
            borderRadius: 2,
          }}
        />

        {/* Date */}
        <div
          style={{
            opacity: dateOpacity,
            color: "rgba(255,255,255,0.8)",
            fontSize: portrait ? 34 : 22,
            fontFamily: "Publik, Arial, sans-serif",
            fontWeight: 400,
          }}
        >
          {new Date().toLocaleDateString("sv-SE", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
