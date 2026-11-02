const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const STATIONS = {
  riks: "Riksnyheter",
  blekinge: "Blekinge",
  dalarna: "Dalarna",
  gavleborg: "Gävleborg",
  goteborg: "Göteborg",
  halland: "Halland",
  helsingborg: "Helsingborg",
  jamtland: "Jämtland",
  jonkoping: "Jönköping",
  norrbotten: "Norrbotten",
  skane: "Skåne",
  smaland: "Småland",
  stockholm: "Stockholm",
  sodertalje: "Södertälje",
  sormland: "Sörmland",
  uppsala: "Uppsala",
  varmland: "Värmland",
  vast: "Väst",
  vasterbotten: "Västerbotten",
  vasternorrland: "Västernorrland",
  vastmanland: "Västmanland",
  orebro: "Örebro",
  ost: "Öst",
};

// Slugs that differ from SVT's URL path segment
const STATION_URL_SLUG = {
  goteborg: "vast",
};

const SVT_TIMEOUT_MS = 10 * 1000;

// Last successful response per station, served when SVT can't be read
const lastGoodResponse = new Map();

// Proxy endpoint to fetch SVT news (avoids CORS)
app.get("/api/news/:station", async (req, res) => {
  const station = req.params.station;
  if (!STATIONS[station]) {
    return res.status(400).json({ error: "Ogiltig station" });
  }

  try {
    const urlSlug = STATION_URL_SLUG[station] || station;
    const url = station === "riks"
      ? "https://www.svt.se/nyheter/"
      : `https://www.svt.se/nyheter/lokalt/${urlSlug}/`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(SVT_TIMEOUT_MS),
    });
    const html = await response.text();

    const category = station === "riks" ? "Nyheter" : null;
    const news = await parseNews(html, station, category);
    const payload = { station: STATIONS[station], slug: station, urlSlug, news };
    lastGoodResponse.set(station, payload);
    res.json(payload);
  } catch (err) {
    const cached = lastGoodResponse.get(station);
    if (cached) {
      console.error(`SVT-hämtning misslyckades för ${station}, svarar med sparade nyheter: ${err.message}`);
      return res.json({ ...cached, stale: true });
    }
    res.status(500).json({ error: err.message });
  }
});

// List all stations
app.get("/api/stations", (req, res) => {
  const list = Object.entries(STATIONS).map(([slug, name]) => ({
    slug,
    name,
  }));
  list.sort((a, b) => a.name.localeCompare(b.name, "sv"));
  res.json(list);
});

async function parseNews(html, station, categoryOverride) {
  const stationName = STATIONS[station] || station;

  // Extract from SVT's embedded React Router data, prioritizing mainTopFeed
  const news = parseFromRouterStream(html, stationName, categoryOverride);

  // Fetch published/updated dates from each article page
  await Promise.all(
    news.map(async (item) => {
      if (!item.url) return;
      try {
        const articleUrl = `https://www.svt.se${item.url}`;
        const res = await fetch(articleUrl, {
          signal: AbortSignal.timeout(SVT_TIMEOUT_MS),
        });
        const articleHtml = await res.text();

        const publishedMatch = articleHtml.match(
          /<meta\s+property="article:published_time"\s+content="([^"]+)"/
        );
        const modifiedMatch = articleHtml.match(
          /<meta\s+property="article:modified_time"\s+content="([^"]+)"/
        );

        if (publishedMatch) item.publishedAt = publishedMatch[1];
        if (modifiedMatch) item.updatedAt = modifiedMatch[1];
        // If no modified_time, check embedded page data on article page
        if (!modifiedMatch) {
          const updMatch = articleHtml.match(/"modified":"([^"]+)"/);
          if (updMatch) item.updatedAt = updMatch[1];
        }
      } catch {
        // Ignore fetch errors for individual articles
      }
    })
  );

  return news;
}

function parseFromRouterStream(html, stationName, categoryOverride) {
  const MAX_NEWS = 6;
  const news = [];
  const pageData = findFeedPage(decodeRouterStream(html));
  if (!pageData) {
    throw new Error("Okänt sidformat från SVT: hittade inget nyhetsflöde");
  }

  const category = categoryOverride || `Lokalt ${stationName}`;

  // 1. First: mainTopFeed (latest news)
  const topFeed = pageData.mainTopFeed;
  if (topFeed?.items) {
    collectTeasers(topFeed.items, news, category, MAX_NEWS);
  }

  // 2. Then: mainFeed (more news) if we still need more
  if (news.length < MAX_NEWS && pageData.mainFeed?.items) {
    collectTeasers(pageData.mainFeed.items, news, category, MAX_NEWS);
  }

  if (news.length === 0) {
    throw new Error("Okänt sidformat från SVT: nyhetsflödet gav inga artiklar");
  }
  return news.slice(0, MAX_NEWS);
}

// Decodes the turbo-stream payload in window.__reactRouterContext: a flat table
// where values are table indices, object keys are "_<index>" and negative
// numbers are reserved constants.
function decodeRouterStream(html) {
  const chunks = [
    ...html.matchAll(/streamController\.enqueue\(("(?:[^"\\]|\\.)*")\)/g),
  ].map((m) => JSON.parse(m[1]));
  if (chunks.length === 0) {
    throw new Error("Okänt sidformat från SVT: hittade ingen dataström");
  }

  const table = JSON.parse(chunks.join("").split("\n")[0]);
  const constants = {
    "-1": undefined,
    "-2": NaN,
    "-3": -Infinity,
    "-4": -0,
    "-5": null,
    "-6": Infinity,
    "-7": undefined,
  };
  const memo = new Map();

  const hydrate = (index) => {
    if (index < 0) return constants[index];
    if (memo.has(index)) return memo.get(index);
    const value = table[index];

    if (Array.isArray(value)) {
      // Arrays starting with a string are tagged values (Date, Promise, ...)
      if (typeof value[0] === "string") {
        memo.set(index, null);
        return null;
      }
      const out = [];
      memo.set(index, out);
      for (const item of value) out.push(hydrate(item));
      return out;
    }
    if (value && typeof value === "object") {
      const out = {};
      memo.set(index, out);
      for (const [key, item] of Object.entries(value)) {
        out[table[Number(key.slice(1))]] = hydrate(item);
      }
      return out;
    }
    memo.set(index, value);
    return value;
  };

  return hydrate(0);
}

function findFeedPage(node, seen = new Set()) {
  if (!node || typeof node !== "object" || seen.has(node)) return null;
  seen.add(node);
  if (node.mainTopFeed) return node;
  for (const value of Object.values(node)) {
    const page = findFeedPage(value, seen);
    if (page) return page;
  }
  return null;
}

function collectTeasers(items, results, category, max) {
  for (const item of items) {
    if (results.length >= max) return;

    // Item might be a TeaserPackage with nested teasers, or a direct FeedTeaser
    if (item.__typename === "TeaserPackage" && item.teasers) {
      for (const teaser of item.teasers) {
        if (results.length >= max) return;
        addTeaser(teaser, results, category);
      }
    } else if (item.__typename === "FeedTeaser") {
      addTeaser(item, results, category);
    }
  }
}

function addTeaser(teaser, results, category) {
  if (!teaser.headline || !teaser.image?.urlTemplate) return;
  if (results.find((r) => r.headline === teaser.headline)) return;

  const imageUrl = teaser.image.urlTemplate
    .replace("{{width}}", "1000")
    .replace("{{ratio}}", "cinema");
  const imageUrlPortrait = teaser.image.urlTemplate
    .replace("{{width}}", "1500")
    .replace("{{ratio}}", "portrait");

  results.push({
    headline: teaser.headline,
    ingress: teaser.text || "",
    imageUrl,
    imageUrlPortrait,
    url: teaser.url || null,
    category,
    publishedAt: null,
    updatedAt: null,
  });
}

// Serve built frontend (Vite output) in production — index.html + kiosk.html
const distDir = path.join(__dirname, "dist");
app.use(express.static(distDir));

const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
  console.log(`SVT News API running on port ${PORT}`);
  console.log(`Stations: GET /api/stations`);
  console.log(`News:     GET /api/news/:station`);
});
