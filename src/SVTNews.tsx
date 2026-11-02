import React from "react";
import {
  AbsoluteFill,
  Freeze,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Intro } from "./Intro";
import { NewsCard } from "./NewsCard";
import { PushTransition, RedWipe } from "./Transition";
import type { SVTNewsProps } from "./types";

const FPS = 25;
const INTRO_DURATION = 3 * FPS;   // 3s intro
const EXIT_FRAMES = 22;           // Intro slides left over these frames
const PUSH_FRAMES = 45;           // Card N+1 pushes card N off (slower)
const OUTRO_FRAMES = 90;          // Red outro plate: sweep in (20f) + hold (70f) = 3.6s

// Intro that slides left after INTRO_DURATION frames to reveal card 1 behind
const IntroWithExit: React.FC<{ stationName: string }> = ({ stationName }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const exitProgress = spring({
    frame: Math.max(0, frame - INTRO_DURATION),
    fps,
    config: { damping: 18, stiffness: 70 },
  });
  const translateX = interpolate(exitProgress, [0, 1], [0, -width]);

  return (
    <AbsoluteFill style={{ transform: `translateX(${translateX}px)` }}>
      <Intro stationName={stationName} />
    </AbsoluteFill>
  );
};

function getNewsDuration(headline: string, ingress: string): number {
  const totalChars = headline.length + ingress.length;
  const seconds = 3.5 + totalChars * 0.02;
  return Math.round(Math.max(4, Math.min(7, seconds)) * FPS);
}

// Fasta delar av tidslinjen som inte är kortens visningstid
function fixedFrames(n: number): number {
  return INTRO_DURATION + Math.max(0, n - 1) * PUSH_FRAMES + OUTRO_FRAMES;
}

// Per-kort visningstid. Om targetDurationInFrames är satt fördelas tiden jämnt
// så att totalen blir exakt target; annars beräknas den från textlängd.
function getCardDurations(
  news: { headline: string; ingress: string }[],
  targetDurationInFrames?: number
): number[] {
  const n = news.length;
  if (targetDurationInFrames && n > 0) {
    const available = Math.max(0, targetDurationInFrames - fixedFrames(n));
    const base = Math.floor(available / n);
    const durations = new Array(n).fill(base);
    // Lägg eventuell rest på sista kortet så totalen blir exakt
    durations[n - 1] += available - base * n;
    return durations;
  }
  return news.map((item) => getNewsDuration(item.headline, item.ingress));
}

export function calculateTotalDuration(
  news: { headline: string; ingress: string }[],
  targetDurationInFrames?: number
): number {
  if (targetDurationInFrames) return targetDurationInFrames;
  return (
    fixedFrames(news.length) +
    getCardDurations(news).reduce((sum, d) => sum + d, 0)
  );
}

export const SVTNews: React.FC<SVTNewsProps> = ({
  news,
  stationName = "Stockholm",
  stationSlug = "riks",
  targetDurationInFrames,
}) => {
  const cardDurations = getCardDurations(news, targetDurationInFrames);

  // Build timeline offsets
  let offset = INTRO_DURATION; // cards start after intro

  const cardData = news.map((item, i) => {
    const cardStart = offset;
    const cardDuration = cardDurations[i];

    offset += cardDuration;

    const pushStart = i < news.length - 1 ? offset : null;
    if (pushStart !== null) offset += PUSH_FRAMES;

    return { item, i, cardStart, cardDuration, pushStart };
  });

  const outroStart = offset;

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a1a" }}>
      {/* News cards + push transitions (rendered below intro) */}
      {cardData.map(({ item, i, cardStart, cardDuration, pushStart }) => (
        <React.Fragment key={i}>
          {/* Card — last card extended by OUTRO_FRAMES so red wipe overlays it */}
          <Sequence
            from={cardStart}
            durationInFrames={cardDuration + (i === news.length - 1 ? OUTRO_FRAMES : 0)}
          >
            <NewsCard item={item} index={i} stationName={stationName} settled={i > 0} />
          </Sequence>

          {/* Push transition to next card */}
          {pushStart !== null && cardData[i + 1] && (
            <Sequence from={pushStart} durationInFrames={PUSH_FRAMES}>
              <PushTransition
                outgoing={
                  <Freeze frame={cardDuration - 1}>
                    <NewsCard item={item} index={i} stationName={stationName} settled />
                  </Freeze>
                }
                incoming={
                  <Freeze frame={200}>
                    <NewsCard item={cardData[i + 1].item} index={i + 1} stationName={stationName} settled />
                  </Freeze>
                }
              />
            </Sequence>
          )}
        </React.Fragment>
      ))}

      {/* Outro red plate */}
      <Sequence from={outroStart} durationInFrames={OUTRO_FRAMES}>
        <RedWipe stationSlug={stationSlug} />
      </Sequence>

      {/* Intro with exit — rendered last (on top) so it slides off revealing card 1 */}
      <Sequence from={0} durationInFrames={INTRO_DURATION + EXIT_FRAMES}>
        <IntroWithExit stationName={stationName} />
      </Sequence>
    </AbsoluteFill>
  );
};
