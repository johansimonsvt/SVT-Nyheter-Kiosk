import React from "react";
import { Composition } from "remotion";
import { DEFAULT_NEWS } from "./fetch-news";
import { SVTNews, calculateTotalDuration } from "./SVTNews";

const FPS = 25;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="SVTNyheter"
      component={SVTNews}
      durationInFrames={calculateTotalDuration(DEFAULT_NEWS)}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{
        news: DEFAULT_NEWS,
        stationName: "Stockholm",
      }}
      calculateMetadata={async ({ props }) => {
        return {
          durationInFrames: calculateTotalDuration(props.news),
        };
      }}
    />
  );
};
