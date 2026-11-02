# SVT-lokala (kiosk) — Projektöversikt

Ljudlös produktionsversion av SVT-lokala. Remotion-baserad motion graphics-app som genererar animerade nyhetsvinjetter från SVT:s lokala nyheter. Inget ljud — varken voiceover eller bakgrundsmusik. Tänkt för Playipp digital signage.

> Denna version är en fork av huvudprojektet `SVT-lokala` med all ElevenLabs-/ljudkod borttagen.

## Arkitektur

```
SVT-lokala-kiosk/
├── src/
│   ├── Intro.tsx          # Röd intro-platta med SVT-logotyp och stationsnamn
│   ├── NewsCard.tsx        # Enskilt nyhetskort (bild, rubrik, ingress, datum)
│   ├── Transition.tsx      # PushTransition + RedWipe (röd slutplatta)
│   ├── SVTNews.tsx         # Huvudkomposition — orkestrerar Intro + NewsCards (ljudlös)
│   ├── Root.tsx            # Remotion-kompositionsregistrering
│   ├── Preview.tsx         # Demo-UI (localhost:3100)
│   ├── Kiosk.tsx           # Kiosk-läge för Playipp-skärmar (/kiosk.html)
│   ├── formatHeadline.ts   # Smart radbrytning av rubriker
│   ├── fonts.ts            # SVT Publik-font via CDN
│   ├── types.ts            # TypeScript-interfaces (NewsItem, SVTNewsProps)
│   └── fetch-news.ts       # DEFAULT_NEWS fallback-data
├── server.js              # Express API-server (port 3200)
├── public/
│   └── SVT_nyheter.png    # SVT Nyheter-logotyp
└── out/                   # Renderade MP4-filer
```

## Två separata gränssnitt

### Demo-UI — `localhost:3100`
Redaktörsverktyg:
- Dropdown med alla SVT-lokalstationer + Riksnyheter
- Visar 6 senaste nyheter med checkboxar (topp 3 förvalda)
- Förhandsvisning med Remotion Player
- Rendera till MP4

### Kiosk-läge — `localhost:3100/kiosk.html?station=stockholm`
Självgående skärm för Playipp digital signage:
- Hämtar nyheter automatiskt vid start
- Loopar animationen utan stopp
- Uppdaterar nyheter var 15 min sömlöst
- Inget ljud, inga UI-element
- En URL per station
- Liggande 16:9 som standard, stående 9:16 med `&format=9x16`

## Design

**Alla visuella komponenter är samlade i:**
- `src/NewsCard.tsx` — nyhetskortens layout, typografi, animationer
- `src/Intro.tsx` — intro-plattan
- `src/Transition.tsx` — övergångar och röd slutplatta
- `src/SVTNews.tsx` — timing

En designändring i dessa filer uppdaterar **automatiskt** både Demo-UI och alla Kiosk-URLs.

**Typsnitt:** SVT Publik (weights 300–900) via `svtstatic.se` CDN i `src/fonts.ts`
**Färger:** SVT-röd `#E02E3D`, vit text, mörk gradient-overlay på bilder

## API-server (server.js, port 3200)

| Endpoint | Beskrivning |
|----------|-------------|
| `GET /api/stations` | Lista alla stationer + Riksnyheter |
| `GET /api/news/:station` | Hämta 6 senaste nyheter (inkl. datum) |

I produktion servar samma Express-server även den byggda frontend (`dist/`) — demo på `/`, kiosk på `/kiosk.html`. Inget MP4-render (borttaget för lättviktig deploy).

### Nyhetshämtning
SVT bäddar in nyhetsdata i `window.__reactRouterContext` (turbo-stream). Parsern prioriterar `mainTopFeed` → `mainFeed` och extraherar `FeedTeaser`-objekt. Artikeldatum hämtas separat från varje artikels meta-taggar.

### Reservlägen
- **SVT går inte att läsa:** servern svarar med stationens senast lyckade svar och `stale: true`. Svaren sparas i minnet och försvinner vid omstart. Finns inget sparat svar blir det `500` och `{ error }`.
- **API:et går inte att nå:** kiosken behåller det som visas och försöker igen varje minut. Vid omladdning läser den senast hämtade nyheter från `localStorage`. Finns inga sparade nyheter visas röd platta med logotyp och dagens datum, aldrig `DEFAULT_NEWS`.
- **Gräns:** frontend och API körs på samma server. Är servern nere går sidan inte att ladda om, så reservläget gäller bara en sida som redan är laddad eller finns i spelarens cache.

### Riksnyheter
Slug: `riks` → hämtar från `https://www.svt.se/nyheter/`
Lokala stationer → `https://www.svt.se/nyheter/lokalt/{slug}/`

## Lokal utveckling

```bash
cd /Users/jolo08/Videos/SVT-lokala-kiosk
npm install
npm run dev      # startar API (3200) + Vite (3100) med /api-proxy
```

- Demo: http://localhost:3100
- Kiosk (exempel): http://localhost:3100/kiosk.html?station=stockholm

Frontend anropar `/api/...` relativt. I dev proxar Vite det till `localhost:3200` (se `vite.config.ts`); i produktion servar Express både frontend och API på samma port.

## Produktion / Railway

Railway (Nixpacks) kör automatiskt:
1. `npm install`
2. `npm run build` → bygger frontend till `dist/`
3. `npm start` → `node server.js`, lyssnar på `process.env.PORT`

Konfiguration finns i `railway.json`. Servern serverar `dist/` + API på en enda port. Inga systemberoenden (Chromium/ffmpeg) behövs eftersom render är borttaget — ryms bekvämt i Railways Hobby-plan.

**Playipp-URLs** (byt `<domän>` mot Railway-domänen):
- `https://<domän>/kiosk.html?station=stockholm`
- `https://<domän>/kiosk.html?station=goteborg` osv.
- Stående skärmar: `https://<domän>/kiosk.html?station=stockholm&format=9x16`

## Timing i animationen

- FPS: **25**
- Intro: 75 frames (3s) + glider ut åt vänster
- NewsCard: baserat på textlängd (4–7s). I kiosk-läge är hela loopen exakt 30s (750 frames) och korten delar lika på tiden som blir över
- Push-övergång mellan kort: 45 frames
- Röd slutplatta (RedWipe): 90 frames med "Läs mer på svt.se/[slug]"

## Playipp-distribution

Kiosk-sidan hostas på Railway (eller annan extern host). Playipp konfigureras med en webbwidget per station, refresh var 15 min. Ingen API-integration mot Playipp behövs — sidan sköter sina egna uppdateringar.
