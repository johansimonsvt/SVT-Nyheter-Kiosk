const LINE_MAX = 34; // ~tecken per rad vid 78px Publik Bold, 85% av ~1820px
const WINDOW = 8; // sök-fönster: [LINE_MAX - WINDOW, LINE_MAX + 4]

export function formatHeadline(text: string, lineMax = LINE_MAX): string {
  if (text.length <= lineMax + 4) return text; // ryms på en rad, lämna orörd

  const searchFrom = lineMax - WINDOW;
  const searchTo = Math.min(lineMax + 4, text.length - 8); // sluta inte för nära slutet

  // 1. Bryt EFTER : om det finns inom fönstret
  for (let i = searchTo; i >= searchFrom; i--) {
    if (text[i] === ":") {
      const rest = text.substring(i + 1).trimStart();
      if (rest.split(" ").length >= 2) {
        // undvik horunge
        return text.substring(0, i + 1) + "\n" + formatHeadline(rest, lineMax);
      }
    }
  }

  // 2. Bryt INNAN – eller - om det finns inom fönstret
  for (let i = searchTo; i >= searchFrom; i--) {
    if (text[i] === "–" || text[i] === "-") {
      const before = text.substring(0, i).trimEnd();
      const rest = text.substring(i);
      if (rest.split(" ").length >= 2) {
        // undvik horunge
        return before + "\n" + formatHeadline(rest, lineMax);
      }
    }
  }

  // 3. Fallback: sista ordgräns innan lineMax
  const spaceIdx = text.lastIndexOf(" ", lineMax);
  if (spaceIdx > lineMax * 0.5) {
    const before = text.substring(0, spaceIdx);
    const rest = text.substring(spaceIdx + 1);
    // Horunge-kontroll: om rest är ett enda ord, backa ett steg till
    if (rest.trim().split(" ").length === 1) {
      const prevSpace = text.lastIndexOf(" ", spaceIdx - 1);
      if (prevSpace > 0) {
        return (
          text.substring(0, prevSpace) +
          "\n" +
          formatHeadline(text.substring(prevSpace + 1), lineMax)
        );
      }
    }
    return before + "\n" + formatHeadline(rest, lineMax);
  }

  return text;
}
