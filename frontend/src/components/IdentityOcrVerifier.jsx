import React, { useEffect, useMemo, useState } from "react";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

const OCR_LANGS = ["fra", "eng"];
const MIN_CANVAS_WIDTH = 1800;

// ============= VALIDATION CONSTRAINTS =============
const IMAGE_CONSTRAINTS = {
  MIN_WIDTH: 500,
  MAX_WIDTH: 3000,
  MIN_HEIGHT: 320,
  MAX_HEIGHT: 2000,
  MIN_ASPECT_RATIO: 1.3,
  MAX_ASPECT_RATIO: 1.8,
  MAX_FILE_SIZE_IMAGE: 3 * 1024 * 1024, // 3MB
  MAX_FILE_SIZE_PDF: 5 * 1024 * 1024,   // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png"],
  BLUR_THRESHOLD: 100 // Laplacian variance threshold for blur detection
};
const BIRTH_LABEL_PATTERN =
  /(date\s+de\s+naissance|naissance|ne[eé]\s+le|date\s+of\s+birth|birth|dob)/i;
const NOISE_WORDS = [
  "ROYAUME",
  "MAROC",
  "KINGDOM",
  "CARTE",
  "NATIONALE",
  "IDENTITE",
  "NATIONAL",
  "IDENTITY",
  "SIGNATURE",
  "SEXE",
  "SEX",
  "DATE",
  "NAISSANCE",
  "BIRTH",
  "VALIDITE",
  "EXPIRY",
  "EXPIRATION",
  "NOM",
  "PRENOM",
  "PRÉNOM",
  "SURNAME",
  "NAME",
  "FIRST",
  "GIVEN",
  // Moroccan cities - exclude these from name extraction
  "RABAT",
  "CASABLANCA",
"FES",
  "MARRAKECH",
  "TANGIER",
  "AGADIR",
  "OUJDA",
  "KENITRA",
  "EL JADIDA",
  "TEFUAL",
  "ERRACHIDIA",
  "BENI MELLAL",
  "KHOURIBGA",
  "SETTAT",
  "SAFI",
  "EL AIOUN",
  "LOUKOS",
  "NADOR",
  "AL HOCEIMA",
  "KSAR EL KBIR",
  "LARACHE",
  "TIZNIT",
  "RICH",
  "OUARZAZATE",
  "ESSAOUIRA",
  "CHICHAOUA",
  "TARFAYA",
  "LAAYOUNE",
  "DAKHLA",
  "FIGUIG",
  "SMARA",
  "BIR GANDOUZ",
  // Common OCR misreads for cities
  "NE",
  "NE",
  "A",
  "LE",
  "D",
  "DU",
  "ET",
  "AU",
  "DELA",
  // Common words to exclude
  "CARTE",
  "NATIONALE",
  "SEXE",
  "M",
  "F",
  "MASCULIN",
  "FEMININ",
  "DN",
  "NA"
];

// ============= IMAGE VALIDATION FUNCTIONS =============
const validateFileSize = (file) => {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
  const maxSize = isPdf ? IMAGE_CONSTRAINTS.MAX_FILE_SIZE_PDF : IMAGE_CONSTRAINTS.MAX_FILE_SIZE_IMAGE;
  
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Fichier trop volumineux. Maximum ${maxSizeMB}MB. Votre fichier: ${(file.size / (1024 * 1024)).toFixed(1)}MB`
    };
  }
  return { valid: true };
};

const validateFileFormat = (file) => {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
  
  if (isPdf) {
    return { valid: true };
  }
  
  if (!IMAGE_CONSTRAINTS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Format non autorisé. Acceptez: JPEG ou PNG. Format détecté: ${file.type || "inconnu"}`
    };
  }
  
  return { valid: true };
};

const validateImageDimensions = (image) => {
  const width = image.width || image.naturalWidth;
  const height = image.height || image.naturalHeight;
  
  if (width < IMAGE_CONSTRAINTS.MIN_WIDTH || height < IMAGE_CONSTRAINTS.MIN_HEIGHT) {
    return {
      valid: false,
      error: `Image trop petite. Minimum ${IMAGE_CONSTRAINTS.MIN_WIDTH}x${IMAGE_CONSTRAINTS.MIN_HEIGHT}px. Votre image: ${width}x${height}px`
    };
  }
  
  if (width > IMAGE_CONSTRAINTS.MAX_WIDTH || height > IMAGE_CONSTRAINTS.MAX_HEIGHT) {
    return {
      valid: false,
      error: `Image trop grande. Maximum ${IMAGE_CONSTRAINTS.MAX_WIDTH}x${IMAGE_CONSTRAINTS.MAX_HEIGHT}px. Votre image: ${width}x${height}px`
    };
  }
  
  return { valid: true };
};

const validateAspectRatio = (image) => {
  const width = image.width || image.naturalWidth;
  const height = image.height || image.naturalHeight;
  const aspectRatio = width / height;
  
  // ID cards should be landscape (1.3:1 to 1.8:1 aspect ratio)
  // If portrait, it's likely wrong orientation
  if (height > width) {
    return {
      valid: false,
      error: "Image détectée en mode portrait. Les cartes d'identité doivent être en mode paysage (horizontal). Veuillez les tourner.",
      rotation: 90
    };
  }
  
  if (aspectRatio < IMAGE_CONSTRAINTS.MIN_ASPECT_RATIO || aspectRatio > IMAGE_CONSTRAINTS.MAX_ASPECT_RATIO) {
    return {
      valid: false,
      error: `Rapport d'aspect incorrect. Attendu: 1.3:1 à 1.8:1. Détecté: ${aspectRatio.toFixed(2)}:1. Assurez-vous que toute la carte est visible.`
    };
  }
  
  return { valid: true };
};

// Detect blur using Laplacian variance method
const detectBlur = (canvas) => {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const { width, height } = canvas;
  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;
  
  // Convert to grayscale and apply Laplacian filter
  const gray = [];
  for (let i = 0; i < data.length; i += 4) {
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray.push(luminance);
  }
  
  // Apply Laplacian kernel
  const kernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
  const laplacian = [];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky += 1) {
        for (let kx = -1; kx <= 1; kx += 1) {
          const idx = (y + ky) * width + (x + kx);
          sum += gray[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
        }
      }
      laplacian.push(sum);
    }
  }
  
  // Calculate variance
  const mean = laplacian.reduce((a, b) => a + b, 0) / laplacian.length;
  const variance = laplacian.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / laplacian.length;
  
  return {
    blurry: variance < IMAGE_CONSTRAINTS.BLUR_THRESHOLD,
    variance: Math.sqrt(variance)
  };
};

const validateImageQuality = async (image) => {
  const canvas = document.createElement("canvas");
  canvas.width = image.width || image.naturalWidth;
  canvas.height = image.height || image.naturalHeight;
  
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  
  const blur = detectBlur(canvas);
  
  if (blur.blurry) {
    return {
      valid: false,
      error: "Image flou ou de mauvaise qualité détectée. Utilisez une photo nette et bien éclairée."
    };
  }
  
  return { valid: true };
};

const validateImage = async (file) => {
  // Check file size
  const sizeCheck = validateFileSize(file);
  if (!sizeCheck.valid) return sizeCheck;
  
  // Check file format
  const formatCheck = validateFileFormat(file);
  if (!formatCheck.valid) return formatCheck;
  
  // Load image to check dimensions
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Impossible de lire le fichier."));
    reader.readAsDataURL(file);
  });
  
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Impossible de charger l'image."));
    img.src = dataUrl;
  });
  
  // Check dimensions
  const dimensionCheck = validateImageDimensions(image);
  if (!dimensionCheck.valid) return dimensionCheck;
  
  // Check aspect ratio
  const ratioCheck = validateAspectRatio(image);
  if (!ratioCheck.valid) return ratioCheck;
  
  // Check quality (blur detection)
  const qualityCheck = await validateImageQuality(image);
  if (!qualityCheck.valid) return qualityCheck;
  
  return { valid: true };
};

const normalizeName = (value) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’]/g, "'")
    .replace(/[^A-Za-z0-9' -]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const levenshteinDistance = (left, right) => {
  const a = left || "";
  const b = right || "";
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: b.length + 1 }, (_, row) =>
    Array.from({ length: a.length + 1 }, (_, col) => (row === 0 ? col : col === 0 ? row : 0))
  );

  for (let row = 1; row <= b.length; row += 1) {
    for (let col = 1; col <= a.length; col += 1) {
      const cost = a[col - 1] === b[row - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
};

const normalizeDate = (value) => {
  if (!value) return "";
  const clean = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }
  const match = clean.match(/(\d{2})[\/.\-](\d{2})[\/.\-](\d{4})/);
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
};

const tokenizeNormalizedText = (value) =>
  normalizeName(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);

const fuzzyTokenMatch = (expected, rawText) => {
  const normalizedExpected = normalizeName(expected);
  if (!normalizedExpected) return false;

  const tokens = tokenizeNormalizedText(rawText);
  return tokens.some((token) => {
    if (token === normalizedExpected) return true;
    const distance = levenshteinDistance(token, normalizedExpected);
    return token.length >= 4 && normalizedExpected.length >= 4 && distance <= 1;
  });
};

const rawDateMatches = (expectedDate, rawText) => {
  const normalizedExpected = normalizeDate(expectedDate);
  if (!normalizedExpected) return false;

  const yyyy = normalizedExpected.slice(0, 4);
  const mm = normalizedExpected.slice(5, 7);
  const dd = normalizedExpected.slice(8, 10);
  const flat = String(rawText || "").replace(/\s+/g, " ").trim();
  const patterns = [
    `${dd}/${mm}/${yyyy}`,
    `${dd}.${mm}.${yyyy}`,
    `${dd}-${mm}-${yyyy}`,
    `${dd} ${mm} ${yyyy}`,
    `${yyyy}-${mm}-${dd}`
  ];

  if (patterns.some((pattern) => flat.includes(pattern))) {
    return true;
  }

  return extractBirthDate(flat) === normalizedExpected || parseMoroccanCinMrz(flat).dateOfBirth === normalizedExpected;
};

const cleanLine = (line) =>
  String(line || "")
    .replace(/[|]/g, "I")
    .replace(/[“”"]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const stripNoise = (value) =>
  cleanLine(value)
    .replace(/^[^A-Za-z0-9]+/, "")
    .replace(/\b(?:nom|prenom|prénom|surname|name|first name|given name)\b[:\s-]*/gi, "")
    .trim();

const extractLabeledValue = (lines, labels) => {
  const normalizedLabels = labels.map((label) => normalizeName(label));

  for (let index = 0; index < lines.length; index += 1) {
    const line = cleanLine(lines[index]);
    const normalizedLine = normalizeName(line);
    const labelIndex = normalizedLabels.findIndex((candidate) => normalizedLine.includes(candidate));
    if (labelIndex < 0) continue;

    const label = labels[labelIndex];
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const inlineValue = stripNoise(line.replace(new RegExp(escapedLabel, "i"), ""));
    if (inlineValue) {
      return inlineValue;
    }

    const nextLine = stripNoise(lines[index + 1]);
    if (nextLine) {
      return nextLine;
    }
  }

  return "";
};

const extractFallbackNames = (lines) => {
  // Skip lines that start with common field indicators - they're labels not values
  const candidates = lines
    .map((line) => {
      const cleaned = stripNoise(line);
      // Skip if line starts with field labels (likely a label, not a value)
      if (/^(nom|prenom|prénom|nom|surname|given|first|last|sexe|sexe|date|naissance|birth|validite|expiry)/i.test(cleaned)) {
        return "";
      }
      return cleaned;
    })
    .filter((line) => line && line.length >= 2)
    .filter((line) => /^[A-Za-z' -]+$/.test(line))
.filter((line) => !NOISE_WORDS.some((word) => normalizeName(line).includes(word)))
    .filter((line) => {
      const upperOnly = normalizeName(line).replace(/[^A-Z]/g, "");
      // Must have at least 2 letters (minimum for a valid name)
      return upperOnly.length >= 2;
    })
    // Filter out single-letter entries (likely OCR noise)
    .filter((line) => {
      const words = line.trim().split(/\s+/);
      // All words should be at least 2 letters
      return words.every((w) => w.length >= 2);
    });

  // Deduplicate while preserving order
  const seen = new Set();
  const unique = [];
  for (const line of candidates) {
    const normalized = normalizeName(line);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(normalized);
    }
  }

  // First element is typically PRENOM (first name), second is NOM (last name) on Moroccan CIN
  const firstCandidate = unique[0] || "";
  const secondCandidate = unique[1] || "";

  // If we have only one candidate, return it as firstName (most common case)
  if (unique.length === 1) {
    return {
      firstName: firstCandidate,
      lastName: ""
    };
  }

  return {
    firstName: firstCandidate || "",
    lastName: secondCandidate || ""
  };
};

const scoreBirthDateCandidate = (line, isoDate) => {
  const year = Number(isoDate.slice(0, 4));
  const nowYear = new Date().getFullYear();
  let score = 0;

  if (BIRTH_LABEL_PATTERN.test(line)) {
    score += 10;
  }
  if (year >= 1930 && year <= nowYear - 10) {
    score += 4;
  }
  if (year > nowYear) {
    score -= 6;
  }

  return score;
};

const extractBirthDate = (text) => {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  const candidates = [];
  lines.forEach((line) => {
    const sanitized = line.replace(/[Oo]/g, "0").replace(/[Il|]/g, "1");
    const matches = sanitized.match(/\d{2}[\/.\-]\d{2}[\/.\-]\d{4}/g) || [];
    matches.forEach((match) => {
      const isoDate = normalizeDate(match);
      if (isoDate) {
        candidates.push({ isoDate, score: scoreBirthDateCandidate(line, isoDate) });
      }
    });
  });

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.isoDate || "";
};

const parseCinText = (text) => {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  const labeledFirstName = extractLabeledValue(lines, ["PRENOM", "PRÉNOM", "GIVEN NAME", "FIRST NAME", "PREN0M"]);
  const labeledLastName = extractLabeledValue(lines, ["NOM", "SURNAME", "NAME", "N0M"]);
  const fallback = extractFallbackNames(lines);
  const firstName = labeledFirstName || fallback.firstName;
  const lastName = labeledLastName || fallback.lastName;
  const dateOfBirth = extractBirthDate(text);

  return {
    firstName: stripNoise(firstName),
    lastName: stripNoise(lastName),
    dateOfBirth,
    rawText: lines.join("\n")
  };
};

const StatusChip = ({ label, ok }) => (
  <span className={`identity-ocr-status ${ok ? "is-ok" : "is-miss"}`}>
    <i className={`bi ${ok ? "bi-check-circle-fill" : "bi-exclamation-circle-fill"}`} />
    {label}
  </span>
);

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Impossible de lire le fichier."));
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Impossible de charger l'image."));
    image.src = src;
  });

const renderPdfPages = async (file) => {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const pages = [];
  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const viewport = page.getViewport({ scale: 4 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);

    await page.render({ canvasContext: context, viewport }).promise;
    pages.push(canvas);
  }

  return {
    canvases: pages,
    previewUrl: pages[0]?.toDataURL("image/jpeg", 0.92) || "",
    sourceLabel: `PDF converti (${pages.length} page${pages.length > 1 ? "s" : ""})`
  };
};

const preprocessCanvas = (source) => {
  const sourceWidth = source.width || source.naturalWidth;
  const sourceHeight = source.height || source.naturalHeight;
  const scale = sourceWidth < MIN_CANVAS_WIDTH ? MIN_CANVAS_WIDTH / sourceWidth : 1;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sourceWidth * scale);
  canvas.height = Math.round(sourceHeight * scale);

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.filter = "grayscale(100%) contrast(135%) brightness(108%)";
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  context.filter = "none";

  return canvas;
};

const buildOcrSource = async (file) => {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");

  if (isPdf) {
    const pdfRender = await renderPdfPages(file);
    return {
      previewUrl: pdfRender.previewUrl,
      canvases: pdfRender.canvases.map((canvas) => preprocessCanvas(canvas)),
      sourceLabel: pdfRender.sourceLabel
    };
  }

  const dataUrl = await fileToDataUrl(file);
  const image = await loadImage(dataUrl);
  return {
    previewUrl: dataUrl,
    canvases: [preprocessCanvas(image)],
    sourceLabel: "Image optimisee avant OCR"
  };
};

const cloneCanvas = (sourceCanvas) => {
  const canvas = document.createElement("canvas");
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(sourceCanvas, 0, 0);
  return canvas;
};

const rotateCanvasClockwise = (sourceCanvas) => {
  const canvas = document.createElement("canvas");
  canvas.width = sourceCanvas.height;
  canvas.height = sourceCanvas.width;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.translate(canvas.width, 0);
  context.rotate(Math.PI / 2);
  context.drawImage(sourceCanvas, 0, 0);
  return canvas;
};

// Generate all 4 rotations (0°, 90°, 180°, 270°) for auto-rotation detection
const generateRotations = (sourceCanvas) => {
  const rotations = [
    { angle: 0, canvas: cloneCanvas(sourceCanvas) }
  ];
  
  let rotated = cloneCanvas(sourceCanvas);
  for (let i = 90; i <= 270; i += 90) {
    rotated = rotateCanvasClockwise(rotated);
    rotations.push({ angle: i, canvas: cloneCanvas(rotated) });
  }
  
  return rotations;
};

const normalizeLandscapeCanvas = (sourceCanvas) =>
  sourceCanvas.height > sourceCanvas.width ? rotateCanvasClockwise(sourceCanvas) : cloneCanvas(sourceCanvas);

const cropCanvas = (sourceCanvas, leftRatio, topRatio, widthRatio, heightRatio) => {
  const left = Math.max(0, Math.floor(sourceCanvas.width * leftRatio));
  const top = Math.max(0, Math.floor(sourceCanvas.height * topRatio));
  const width = Math.max(1, Math.floor(sourceCanvas.width * widthRatio));
  const height = Math.max(1, Math.floor(sourceCanvas.height * heightRatio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(sourceCanvas, left, top, width, height, 0, 0, width, height);

  return canvas;
};

const isNonWhitePixel = (value) => value < 242;

const extractDocumentRegions = (sourceCanvas) => {
  const context = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const { width, height } = sourceCanvas;
  const { data } = context.getImageData(0, 0, width, height);
  const xStep = Math.max(1, Math.floor(width / 450));
  const yStep = Math.max(1, Math.floor(height / 450));
  const rowThreshold = Math.max(10, Math.floor(width / xStep) * 0.08);

  const bands = [];
  let activeBand = null;

  for (let y = 0; y < height; y += yStep) {
    let rowHits = 0;
    for (let x = 0; x < width; x += xStep) {
      const offset = (y * width + x) * 4;
      if (isNonWhitePixel(data[offset])) {
        rowHits += 1;
      }
    }

    if (rowHits >= rowThreshold) {
      if (!activeBand) {
        activeBand = { top: y, bottom: y };
      } else {
        activeBand.bottom = y;
      }
    } else if (activeBand) {
      bands.push(activeBand);
      activeBand = null;
    }
  }

  if (activeBand) {
    bands.push(activeBand);
  }

  const regions = bands
    .map((band) => {
      const bandHeight = Math.max(yStep, band.bottom - band.top + yStep);
      const colThreshold = Math.max(6, Math.floor(bandHeight / yStep) * 0.1);
      let left = null;
      let right = null;

      for (let x = 0; x < width; x += xStep) {
        let columnHits = 0;
        for (let y = band.top; y <= Math.min(height - 1, band.bottom + yStep); y += yStep) {
          const offset = (y * width + x) * 4;
          if (isNonWhitePixel(data[offset])) {
            columnHits += 1;
          }
        }

        if (columnHits >= colThreshold) {
          if (left === null) {
            left = x;
          }
          right = x;
        }
      }

      if (left === null || right === null) {
        return null;
      }

      const paddingX = Math.round(width * 0.015);
      const paddingY = Math.round(height * 0.015);
      const cropLeft = Math.max(0, left - paddingX);
      const cropTop = Math.max(0, band.top - paddingY);
      const cropRight = Math.min(width, right + paddingX);
      const cropBottom = Math.min(height, band.bottom + paddingY);
      const cropWidth = cropRight - cropLeft;
      const cropHeight = cropBottom - cropTop;

      if (cropWidth < width * 0.18 || cropHeight < height * 0.07) {
        return null;
      }

      const canvas = document.createElement("canvas");
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const cropContext = canvas.getContext("2d", { willReadFrequently: true });
      cropContext.fillStyle = "#ffffff";
      cropContext.fillRect(0, 0, cropWidth, cropHeight);
      cropContext.drawImage(sourceCanvas, cropLeft, cropTop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      return {
        top: cropTop,
        left: cropLeft,
        width: cropWidth,
        height: cropHeight,
        canvas: normalizeLandscapeCanvas(canvas)
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.top - b.top);

  return regions.length > 0 ? regions : [{ top: 0, left: 0, width, height, canvas: normalizeLandscapeCanvas(sourceCanvas) }];
};

const extractNamesFromRegionText = (text) => {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map(stripNoise)
    .filter(Boolean)
    .filter((line) => /^[A-Za-z' -]+$/.test(line))
    .filter((line) => !NOISE_WORDS.some((word) => normalizeName(line).includes(word)))
    .filter((line) => normalizeName(line).length >= 3);

  const unique = [...new Set(lines.map((line) => normalizeName(line)))];
  return {
    firstName: unique[0] || "",
    lastName: unique[1] || ""
  };
};

const parseMrzBirthDate = (yyMMdd) => {
  if (!/^\d{6}$/.test(yyMMdd)) {
    return "";
  }

  const yy = Number(yyMMdd.slice(0, 2));
  const mm = Number(yyMMdd.slice(2, 4));
  const dd = Number(yyMMdd.slice(4, 6));
  const today = new Date();
  const candidateYears = [1900 + yy, 2000 + yy];

  const validDates = candidateYears
    .map((year) => new Date(Date.UTC(year, mm - 1, dd)))
    .filter((date) => date.getUTCFullYear() && date.getUTCMonth() === mm - 1 && date.getUTCDate() === dd)
    .filter((date) => date <= today)
    .map((date) => {
      const age = today.getUTCFullYear() - date.getUTCFullYear();
      return { date, age };
    })
    .sort((a, b) => {
      const aPenalty = a.age >= 10 && a.age <= 100 ? 0 : 50;
      const bPenalty = b.age >= 10 && b.age <= 100 ? 0 : 50;
      return aPenalty - bPenalty || Math.abs(a.age - 35) - Math.abs(b.age - 35);
    });

  const best = validDates[0];
  if (!best) {
    return "";
  }

  const year = best.date.getUTCFullYear();
  return `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
};

const normalizeMrzLine = (line) =>
  String(line || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/«/g, "<")
    .replace(/[|]/g, "I")
    .replace(/[^A-Z0-9<]/g, "");

const parseMoroccanCinMrz = (text) => {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map(normalizeMrzLine)
    .filter(Boolean);

  const mrzLines = lines.filter((line) => line.includes("<") || /^\d{6}/.test(line));
  const nameLine = mrzLines.find((line) => /<<[A-Z]/.test(line));
  const birthLine = mrzLines.find((line) => /^\d{6}\d?[MFX<]/.test(line) || /\d{6}\d?[MFX<]/.test(line));

  let lastName = "";
  let firstName = "";
  if (nameLine) {
    const parts = nameLine.split("<<");
    lastName = parts[0]?.replace(/<+/g, " ").trim() || "";
    firstName = parts[1]?.replace(/<+/g, " ").trim() || "";
  }

  let dateOfBirth = "";
  if (birthLine) {
    const birthMatch = birthLine.match(/(\d{6})\d?[MFX<]/);
    if (birthMatch) {
      dateOfBirth = parseMrzBirthDate(birthMatch[1]);
    }
  }

  return {
    firstName,
    lastName,
    dateOfBirth,
    rawText: mrzLines.join("\n"),
    score: (firstName ? 12 : 0) + (lastName ? 12 : 0) + (dateOfBirth ? 14 : 0)
  };
};

const extractMoroccanFrontNames = (text) => {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map(stripNoise)
    .filter(Boolean)
    .filter((line) => !/\d/.test(line))
    .filter((line) => /^[A-Za-z' -]+$/.test(line))
    .filter((line) => !NOISE_WORDS.some((word) => normalizeName(line).includes(word)))
    .map((line) => normalizeName(line))
    .filter((line) => line.length >= 3)
    .filter((line) => line.split(" ").length <= 3);

  const unique = [...new Set(lines)];
  return {
    firstName: unique[0] || "",
    lastName: unique[1] || ""
  };
};

const alignNamesWithForm = (candidate, expectedFirstName, expectedLastName) => {
  if (!candidate) return candidate;

  const expectedFirst = normalizeName(expectedFirstName);
  const expectedLast = normalizeName(expectedLastName);
  const candidateFirst = normalizeName(candidate.firstName);
  const candidateLast = normalizeName(candidate.lastName);

  if (expectedFirst && expectedLast && candidateFirst && candidateLast) {
    const direct = candidateFirst === expectedFirst && candidateLast === expectedLast;
    const swapped = candidateFirst === expectedLast && candidateLast === expectedFirst;
    if (swapped && !direct) {
      return {
        ...candidate,
        firstName: candidate.lastName,
        lastName: candidate.firstName
      };
    }
  }

  return candidate;
};

const mergeCandidate = (base, incoming) => ({
  firstName: base.firstName || incoming.firstName || "",
  lastName: base.lastName || incoming.lastName || "",
  dateOfBirth: base.dateOfBirth || incoming.dateOfBirth || "",
  rawText: [base.rawText, incoming.rawText].filter(Boolean).join("\n---\n"),
  score: (base.score || 0) + (incoming.score || 0)
});

const runRecognize = async (worker, canvas, parameters = {}, recognizeOptions = {}, output = { text: true }) => {
  await worker.setParameters(parameters);
  const { data } = await worker.recognize(canvas, recognizeOptions, output);
  return data;
};

// Try OCR on multiple rotations and pick the best result
const runRecognizeWithAutoRotation = async (worker, canvas, parameters = {}, output = { text: true }) => {
  const rotations = generateRotations(canvas);
  const results = [];
  
  for (const rotation of rotations) {
    const result = await runRecognize(worker, rotation.canvas, parameters, { rotateAuto: true }, output);
    const confidence = result?.text ? (result.text.trim().length / 100) : 0; // Simple confidence based on text length
    results.push({
      angle: rotation.angle,
      result,
      confidence
    });
  }
  
  // Pick the rotation with the most text (best confidence)
  results.sort((a, b) => (b.result?.text?.length || 0) - (a.result?.text?.length || 0));
  return results[0];
};

const analyzeFrontRegion = async (worker, regionCanvas) => {
  const infoCanvas = cropCanvas(regionCanvas, 0.40, 0.08, 0.38, 0.42);
  const namesCanvas = cropCanvas(regionCanvas, 0.41, 0.10, 0.28, 0.22);
  const birthCanvas = cropCanvas(regionCanvas, 0.50, 0.20, 0.28, 0.16);

  const baseParams = {
    preserve_interword_spaces: "1",
    user_defined_dpi: "300",
    tessedit_pageseg_mode: "6"
  };

  // Use auto-rotation for better OCR results
  const infoResult = await runRecognizeWithAutoRotation(worker, infoCanvas, baseParams);
  const infoData = infoResult?.result;
  
  const namesResult = await runRecognizeWithAutoRotation(worker, namesCanvas, {
    ...baseParams,
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz '-"
  });
  const namesData = namesResult?.result;
  
  const birthResult = await runRecognizeWithAutoRotation(worker, birthCanvas, {
    preserve_interword_spaces: "1",
    user_defined_dpi: "300",
    tessedit_pageseg_mode: "7",
    tessedit_char_whitelist: "0123456789./- "
  });
  const birthData = birthResult?.result;

  const infoParsed = parseCinText(infoData?.text || "");
  const nameParsed = extractMoroccanFrontNames([infoData?.text || "", namesData?.text || ""].join("\n"));
  const birthDate = extractBirthDate([birthData?.text || "", infoData?.text || ""].join("\n"));

  return {
    firstName: infoParsed.firstName || nameParsed.firstName || "",
    lastName: infoParsed.lastName || nameParsed.lastName || "",
    dateOfBirth: infoParsed.dateOfBirth || birthDate || "",
    rawText: [infoData?.text || "", namesData?.text || "", birthData?.text || ""].filter(Boolean).join("\n---\n"),
    score:
      (infoParsed.firstName || nameParsed.firstName ? 10 : 0) +
      (infoParsed.lastName || nameParsed.lastName ? 10 : 0) +
      (infoParsed.dateOfBirth || birthDate ? 12 : 0)
  };
};

const analyzeBackRegion = async (worker, regionCanvas) => {
  const mrzCanvas = cropCanvas(regionCanvas, 0.08, 0.58, 0.84, 0.28);
  
  // Use auto-rotation for MRZ zone
  const mrzResult = await runRecognizeWithAutoRotation(
    worker,
    mrzCanvas,
    {
      preserve_interword_spaces: "1",
      user_defined_dpi: "300",
      tessedit_pageseg_mode: "6",
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789< "
    }
  );
  const mrzData = mrzResult?.result;

  return parseMoroccanCinMrz(mrzData?.text || "");
};

const mergeOcrResult = (primary, fallback) => ({
  firstName: primary.firstName || fallback.firstName || "",
  lastName: primary.lastName || fallback.lastName || "",
  dateOfBirth: primary.dateOfBirth || fallback.dateOfBirth || "",
  rawText: [primary.rawText, fallback.rawText].filter(Boolean).join("\n---\n")
});

const IdentityOcrVerifier = ({ firstName, lastName, dateOfBirth, onVerificationChange }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLabel, setPreviewLabel] = useState("");
  const [ocr, setOcr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      setPreviewLabel("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    setPreviewLabel(selectedFile.type === "application/pdf" ? "PDF selectionne" : "Image selectionnee");

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setOcr(null);
    setError(null);
    setValidationError(null);
    setProgress(0);
    
    if (!file) return;
    
    // Validate file if it's an image
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
    if (!isPdf) {
      try {
        const validation = await validateImage(file);
        if (!validation.valid) {
          setValidationError(validation.error);
          setSelectedFile(null);
        }
      } catch (err) {
        setValidationError("Erreur lors de la validation de l'image. Réessayez.");
        setSelectedFile(null);
      }
    } else {
      // Validate PDF file size
      const sizeCheck = validateFileSize(file);
      if (!sizeCheck.valid) {
        setValidationError(sizeCheck.error);
        setSelectedFile(null);
      }
    }
  };

  const comparison = useMemo(() => {
    const extractedFirstName = ocr?.firstName || "";
    const extractedLastName = ocr?.lastName || "";
    const extractedDateOfBirth = ocr?.dateOfBirth || "";
    const firstNameMatches =
      (normalizeName(firstName) !== "" &&
        normalizeName(extractedFirstName) !== "" &&
        normalizeName(firstName) === normalizeName(extractedFirstName)) ||
      fuzzyTokenMatch(firstName, ocr?.rawText || "");
    const lastNameMatches =
      (normalizeName(lastName) !== "" &&
        normalizeName(extractedLastName) !== "" &&
        normalizeName(lastName) === normalizeName(extractedLastName)) ||
      fuzzyTokenMatch(lastName, ocr?.rawText || "");
    const dateMatches =
      ((normalizeDate(dateOfBirth) !== "" &&
        normalizeDate(extractedDateOfBirth) !== "" &&
        normalizeDate(dateOfBirth) === normalizeDate(extractedDateOfBirth)) ||
        rawDateMatches(dateOfBirth, ocr?.rawText || ""));

    return {
      firstNameMatches,
      lastNameMatches,
      dateMatches,
      verified: firstNameMatches && lastNameMatches && dateMatches
    };
  }, [dateOfBirth, firstName, lastName, ocr]);

  useEffect(() => {
    if (!onVerificationChange) return;
    onVerificationChange({
      verified: comparison.verified,
      extractedFirstName: ocr?.firstName || "",
      extractedLastName: ocr?.lastName || "",
      extractedDateOfBirth: ocr?.dateOfBirth || "",
      rawText: ocr?.rawText || "",
      confidence: ocr?.confidence ?? null,
      documentType: "CIN"
    });
  }, [comparison.verified, ocr, onVerificationChange]);

  const runOcr = async () => {
    if (!selectedFile) {
      setError("Ajoutez d'abord une photo nette ou un PDF de la face de la CIN.");
      return;
    }

    setLoading(true);
    setProgress(6);
    setError(null);

    try {
      const prepared = await buildOcrSource(selectedFile);
      setPreviewUrl(prepared.previewUrl);
      setPreviewLabel(prepared.sourceLabel);
      const pages = prepared.canvases || [];

      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker(OCR_LANGS, 1, {
        logger: (message) => {
          if (message.status === "recognizing text" && typeof message.progress === "number") {
            setProgress(Math.max(12, Math.round(message.progress * 100)));
          }
        }
      });

      let bestFront = { firstName: "", lastName: "", dateOfBirth: "", rawText: "", score: 0 };
      let bestBack = { firstName: "", lastName: "", dateOfBirth: "", rawText: "", score: 0 };
      let processedRegionCount = 0;
      const totalRegions = pages.reduce((count, pageCanvas) => count + extractDocumentRegions(pageCanvas).length, 0) || 1;

      for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
        const pageCanvas = pages[pageIndex];
        const regions = extractDocumentRegions(pageCanvas);

        for (let index = 0; index < regions.length; index += 1) {
          const region = regions[index];
          processedRegionCount += 1;
          setProgress(Math.min(78, 18 + Math.round((processedRegionCount / totalRegions) * 42)));

          const backCandidate = alignNamesWithForm(
            await analyzeBackRegion(worker, region.canvas),
            firstName,
            lastName
          );
          if ((backCandidate.score || 0) > (bestBack.score || 0)) {
            bestBack = backCandidate;
          }

          if ((backCandidate.score || 0) < 30) {
            const frontCandidate = alignNamesWithForm(
              await analyzeFrontRegion(worker, region.canvas),
              firstName,
              lastName
            );
            if ((frontCandidate.score || 0) > (bestFront.score || 0)) {
              bestFront = frontCandidate;
            }
          }
        }
      }

      await worker.terminate();
      setProgress(92);

      const merged = mergeCandidate(bestBack, bestFront);
      const result = alignNamesWithForm(
        {
          ...merged,
          confidence: merged.score > 0 ? Math.min(99, 55 + Math.round(merged.score)) : null
        },
        firstName,
        lastName
      );

      setOcr(result);
      setProgress(100);

      if (!result.firstName || !result.lastName || !result.dateOfBirth) {
        const missing = [
          !result.firstName && "Prénom",
          !result.lastName && "Nom",
          !result.dateOfBirth && "Date de naissance"
        ].filter(Boolean).join(", ");
        
        setError(
          `Lecture OCR partielle (manque: ${missing}). Suggestions: assurez-vous que la photo est droite, bien éclairée, et en haute résolution. Vous pouvez aussi essayer un PDF du document.`
        );
      }
    } catch (ocrError) {
      setOcr(null);
      setError("Impossible de lire la CIN pour le moment. Vérifiez que l'image est claire, nette et bien éclairée. Réessayez.");
      console.error("OCR Error:", ocrError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="identity-ocr-card">
      <div className="identity-ocr-head">
        <div>
          <div className="hero-kicker">Verification identite</div>
          <h3>Controle OCR de la CIN</h3>
          <p className="muted-text mb-0">
            Ajoutez la face de la carte nationale en photo ou en PDF. L&apos;OCR lit le nom, le prenom et la date de
            naissance, puis les compare aux champs saisis avant la creation du compte.
          </p>
        </div>
        <div className={`identity-ocr-badge ${comparison.verified ? "is-verified" : ""}`}>
          <i className={`bi ${comparison.verified ? "bi-patch-check-fill" : "bi-shield-exclamation"}`} />
          {comparison.verified ? "Identite coherente" : "Verification requise"}
        </div>
      </div>

      <div className="identity-ocr-grid">
        <div className="identity-ocr-upload">
          <label className="identity-ocr-dropzone">
            <input
              type="file"
              accept="image/jpeg,image/png,.pdf,application/pdf"
              onChange={handleFileChange}
            />
            {previewUrl ? (
              <img src={previewUrl} alt="Apercu CIN" className="identity-ocr-preview" />
            ) : (
              <div className="identity-ocr-placeholder">
                <i className="bi bi-card-image" />
                <span>Ajouter une photo nette ou un PDF de la CIN</span>
                <small>Formats acceptés: JPEG, PNG (min 500×320px) ou PDF (max 5MB). Image doit être horizontale, nette et bien éclairée.</small>
              </div>
            )}
          </label>

          <div className="identity-ocr-actions">
            <button type="button" className="btn btn-success" onClick={runOcr} disabled={loading}>
              {loading ? "Lecture OCR..." : "Lire la CIN"}
            </button>
            {selectedFile && <span className="identity-ocr-file">{selectedFile.name}</span>}
            {previewLabel && <span className="identity-ocr-file">{previewLabel}</span>}
          </div>

          {(loading || progress > 0) && (
            <div className="identity-ocr-progress">
              <div className="identity-ocr-progress-bar">
                <span style={{ width: `${progress}%` }} />
              </div>
              <strong>{progress}%</strong>
            </div>
          )}

          {validationError && <div className="alert alert-warning mt-3 mb-0"><strong>Fichier rejeté:</strong> {validationError}</div>}
          {error && <div className="alert alert-danger mt-3 mb-0"><strong>Erreur OCR:</strong> {error}</div>}
        </div>

        <div className="identity-ocr-result">
          <div className="identity-ocr-section">
            <span className="profile-data-label">Champs compares</span>
            <div className="identity-ocr-status-row">
              <StatusChip label="Nom" ok={comparison.lastNameMatches} />
              <StatusChip label="Prenom" ok={comparison.firstNameMatches} />
              <StatusChip label="Naissance" ok={comparison.dateMatches} />
            </div>
          </div>

          <div className="identity-ocr-section">
            <span className="profile-data-label">Lecture OCR</span>
            <div className="identity-ocr-facts">
              <div><span>Nom lu</span><strong>{ocr?.lastName || "-"}</strong></div>
              <div><span>Prenom lu</span><strong>{ocr?.firstName || "-"}</strong></div>
              <div><span>Date lue</span><strong>{ocr?.dateOfBirth || "-"}</strong></div>
              <div><span>Confiance</span><strong>{ocr?.confidence ? `${ocr.confidence}%` : "-"}</strong></div>
            </div>
          </div>

          <div className="identity-ocr-section">
            <span className="profile-data-label">Texte reconnu</span>
            <pre className="identity-ocr-raw">{ocr?.rawText || "Le texte OCR apparaitra ici apres lecture du document."}</pre>
          </div>

          <div className="identity-ocr-section">
            <span className="profile-data-label">Decision</span>
            <p className="mb-0">
              {comparison.verified
                ? "La CIN et les donnees saisies sont coherentes. Vous pouvez continuer l'inscription."
                : "Le compte ne sera cree qu'apres correspondance complete entre la CIN et les donnees saisies."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IdentityOcrVerifier;
