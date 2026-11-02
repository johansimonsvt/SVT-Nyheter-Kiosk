import type { NewsItem } from "./types";
import { DEFAULT_NEWS } from "./fetch-news";

// Server-side fetcher for Remotion's calculateMetadata
export async function fetchNewsFromSVT(): Promise<NewsItem[]> {
  try {
    const res = await fetch("https://www.svt.se/nyheter/lokalt/stockholm/");
    const html = await res.text();

    const news: NewsItem[] = [];

    // Extract image URLs - SVT uses srcset or src on img tags
    const imgRegex =
      /image-news\/[^\s"')]+/g;
    const images: string[] = [];
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const url = `https://www.svtstatic.se/${imgMatch[0]}`;
      if (!images.includes(url)) {
        images.push(url);
      }
    }

    // Extract headlines and ingresses from article links
    // SVT uses patterns like <a ...> with headline text
    const headlineRegex =
      /<h[23][^>]*class="[^"]*"[^>]*>([\s\S]*?)<\/h[23]>/gi;
    const headlines: string[] = [];
    let hMatch;
    while ((hMatch = headlineRegex.exec(html)) !== null) {
      const text = hMatch[1].replace(/<[^>]*>/g, "").trim();
      if (text.length > 10 && text.length < 200) {
        headlines.push(text);
      }
    }

    // Build news items from what we found
    for (let i = 0; i < Math.min(3, headlines.length, images.length); i++) {
      news.push({
        headline: headlines[i],
        ingress: "",
        imageUrl: images[i],
        category: "Lokalt Stockholm",
      });
    }

    return news.length >= 3 ? news : DEFAULT_NEWS;
  } catch {
    return DEFAULT_NEWS;
  }
}
