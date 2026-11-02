export interface NewsItem {
  headline: string;
  ingress: string;
  imageUrl: string;
  imageUrlPortrait?: string;
  category: string;
  url?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

export interface SVTNewsProps {
  news: NewsItem[];
  stationName?: string;
  stationSlug?: string;
  /**
   * Om satt: tvinga hela animationen till exakt detta antal frames genom att
   * fördela kortens visningstid jämnt. Används i kiosk-läge (30s = 750 frames).
   * Om utelämnad: korttiden beräknas från textlängd.
   */
  targetDurationInFrames?: number;
}
