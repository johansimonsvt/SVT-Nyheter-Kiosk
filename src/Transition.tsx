import React from "react";
import {
  AbsoluteFill,
  Freeze,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Push: card N exits left, card N+1 enters right simultaneously
export const PushTransition: React.FC<{
  outgoing: React.ReactNode;
  incoming: React.ReactNode;
}> = ({ outgoing, incoming }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const push = spring({
    frame,
    fps,
    config: { damping: 28, stiffness: 38, mass: 1.4 },
  });

  const offset = interpolate(push, [0, 1], [0, width]);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateX(${-offset}px)` }}>
        {outgoing}
      </AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateX(${width - offset}px)` }}>
        {incoming}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Outro: red plate sweeps in from left and STAYS, shows "Läs mer" text
export const RedWipe: React.FC<{ stationSlug?: string }> = ({ stationSlug = "riks" }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const sweepProgress = spring({
    frame,
    config: { damping: 20, stiffness: 80 },
    fps: 25,
  });

  const barX = interpolate(sweepProgress, [0, 1], [-width, 0]);

  const textOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textY = interpolate(frame, [20, 35], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const url = stationSlug === "riks" ? "svt.se" : `svt.se/${stationSlug}`;

  const F = "Publik, Arial, sans-serif";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#E02E3D",
        transform: `translateX(${barX}px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          textAlign: "center",
          color: "white",
          fontFamily: F,
        }}
      >
        <p
          style={{
            fontSize: 52,
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
          }}
        >
          Läs mer på {url}
        </p>
        <p
          style={{
            fontSize: 52,
            fontWeight: 400,
            margin: "16px 0 0 0",
            lineHeight: 1.3,
            opacity: 0.85,
          }}
        >
          Eller i Nyhetsappen.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// Freeze helper — re-exported for use in SVTNews
export { Freeze };
