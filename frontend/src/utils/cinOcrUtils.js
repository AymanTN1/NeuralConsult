/**
 * Shared OCR parsing utilities for Moroccan CIN
 * Used by both IdentityOcrVerifier (file upload) and CINLiveScannerModal (camera)
 */

export const NOISE_WORDS = new Set([
  "ROYAUME", "MAROC", "ROYAUMEDUMAROC", "KINGDOM", "MOROCCO",
  "CARTE", "NATIONALE", "IDENTITE", "NATIONAL", "IDENTITY",
  "DIDENTITE", "DDENTITE", "NIDENTITE", "CARTENA", "CARTENATIONALE",
  "SIGNATURE", "SEXE", "SEX", "DATE", "NAISSANCE", "BIRTH",
  "VALIDITE", "EXPIRY", "EXPIRATION",
  "NOM", "PRENOM", "PRÉNOM", "SURNAME", "NAME", "FIRST", "GIVEN",
  // Cities
  "RABAT", "CASABLANCA", "FES", "MARRAKECH", "TANGIER", "AGADIR",
  "OUJDA", "KENITRA", "NADOR", "HASSAN", "OUARZAZATE", "ESSAOUIRA",
  "LAAYOUNE", "DAKHLA", "SAFI", "SETTAT", "TIZNIT", "RICH", "KHOURIBGA",
  "LOUKOS", "BENI", "MELLAL",
  // OCR noise / artefacts
  "VAS", "LIT", "LIS", "LUS", "LES", "SEEN", "LITE", "SOC", "TEE",
  "INVIN", "WTAN", "ALAM", "ALAMI", "NADO",
  "NE", "NEE", "A", "LE", "D", "DU", "ET", "AU", "DELA", "BIR",
  "M", "F", "MASCULIN", "FEMININ", "DN", "NA",
  "NOLO", "NOLE", "NELC", "NEL", "BIT", "NELE",
]);

const HEADER_MARKERS =
  /ROYAUME|MAROC|CARTE|NATIONALE|IDENTIT|DIDENTIT|DDENTIT|KINGDOM/i;

const cleanLine = (line) =>
  String(line || "")
    .replace(/[|]/g, "I")
    .replace(/[""'"]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Extract Prénom + Nom from OCR lines by skipping the card header.
 */
export const extractFallbackNames = (lines) => {
  // Detect where the card header ends (ROYAUME, CARTE NATIONALE, etc.)
  let headerEndIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    if (HEADER_MARKERS.test(lines[i])) headerEndIdx = i;
  }
  const postHeader = headerEndIdx >= 0 ? lines.slice(headerEndIdx + 1) : lines;

  const candidates = [];
  for (const line of postHeader) {
    const cleaned = cleanLine(line);
    if (!cleaned) continue;
    // Skip date lines
    if (/\d{2}[\s./\-]\d{2}[\s./\-]\d{4}/.test(cleaned)) continue;
    if (/\d{5,}/.test(cleaned)) continue;
    // Skip label lines
    if (/^(nom|prenom|prénom|naissance|birth|date|validite|sexe|expiry|nolo|nel|bale)/i.test(cleaned)) continue;
    // Extract uppercase words ≥ 3 chars
    const words = cleaned.match(/[A-Z]{3,}/g);
    if (words) {
      for (const w of words) {
        if (!NOISE_WORDS.has(w)) candidates.push(w);
      }
    }
  }

  const seen = new Set();
  const unique = [];
  for (const w of candidates) {
    if (!seen.has(w)) { seen.add(w); unique.push(w); }
  }
  return { firstName: unique[0] || "", lastName: unique[1] || "" };
};

/**
 * Extract birth date from raw OCR text.
 * Supports: "27.07.2005", "27/07/2005", "27 07 2005", "27072005"
 */
export const extractBirthDate = (text) => {
  const lines = String(text || "").split(/\r?\n/).map(cleanLine).filter(Boolean);
  const nowYear = new Date().getFullYear();
  const candidates = [];

  for (const line of lines) {
    const san = line.replace(/[Oo]/g, "0").replace(/[Il|]/g, "1");
    const matches = san.match(/\d{2}[\s./\-]?\d{2}[\s./\-]?\d{4}/g) || [];
    for (const match of matches) {
      const digits = match.replace(/\D/g, "");
      if (digits.length !== 8) continue;
      const dd = digits.slice(0, 2);
      const mm = digits.slice(2, 4);
      const yyyy = digits.slice(4, 8);
      const y = parseInt(yyyy, 10);
      const m = parseInt(mm, 10);
      const d = parseInt(dd, 10);
      if (y < 1930 || y > nowYear - 10 || m < 1 || m > 12 || d < 1 || d > 31) continue;
      // Boost score if line contains birth label
      const score = /naissance|né|nee|birth|dob|nolo|nele/i.test(line) ? 10 : 1;
      candidates.push({ iso: `${yyyy}-${mm}-${dd}`, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.iso || "";
};

/**
 * Full CIN text parser: names + date.
 */
export const parseCinText = (text) => {
  const lines = String(text || "").split(/\r?\n/).map(cleanLine).filter(Boolean);
  const names = extractFallbackNames(lines);
  const dateOfBirth = extractBirthDate(text);
  return {
    firstName: names.firstName,
    lastName: names.lastName,
    dateOfBirth,
    rawText: lines.join("\n"),
  };
};
