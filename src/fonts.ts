import { staticFile } from "remotion";

const FONT_BASE =
  "https://www.svtstatic.se/frontend/svtlib-font/svtlib-font-2.0.0/fonts";

export const fontFaces = `
@font-face {
  font-family: 'Publik';
  src: url('${FONT_BASE}/PublikWeb-Light.woff2') format('woff2'),
       url('${FONT_BASE}/PublikWeb-Light.woff') format('woff');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Publik';
  src: url('${FONT_BASE}/PublikWeb-Regular.woff2') format('woff2'),
       url('${FONT_BASE}/PublikWeb-Regular.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Publik';
  src: url('${FONT_BASE}/PublikWeb-SemiBold.woff2') format('woff2'),
       url('${FONT_BASE}/PublikWeb-SemiBold.woff') format('woff');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Publik';
  src: url('${FONT_BASE}/PublikWeb-Bold.woff2') format('woff2'),
       url('${FONT_BASE}/PublikWeb-Bold.woff') format('woff');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Publik';
  src: url('${FONT_BASE}/PublikWeb-Black.woff2') format('woff2'),
       url('${FONT_BASE}/PublikWeb-Black.woff') format('woff');
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}
`;
