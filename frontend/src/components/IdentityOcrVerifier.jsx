import React, { useEffect, useMemo, useState } from "react";

const normalizeName = (value) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’]/g, "'")
    .replace(/[^A-Za-z0-9' -]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

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

const cleanLine = (line) =>
  String(line || "")
    .replace(/[|]/g, "I")
    .replace(/[“”"]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const extractLabeledValue = (lines, labels) => {
  const normalizedLabels = labels.map((label) => normalizeName(label));

  for (let index = 0; index < lines.length; index += 1) {
    const line = cleanLine(lines[index]);
    const normalizedLine = normalizeName(line);
    const label = normalizedLabels.find((candidate) => normalizedLine.startsWith(candidate));
    if (!label) continue;

    const rawLabel = labels[normalizedLabels.indexOf(label)];
    const inlineValue = cleanLine(line.replace(new RegExp(rawLabel, "i"), "").replace(/^[:\\-\\s]+/, ""));
    if (inlineValue) {
      return inlineValue;
    }

    const nextLine = cleanLine(lines[index + 1]);
    if (nextLine) {
      return nextLine;
    }
  }

  return "";
};

const extractBirthDate = (text) => {
  const cleaned = String(text || "").replace(/[Oo]/g, "0");
  const match = cleaned.match(/(\d{2})[\/.\-](\d{2})[\/.\-](\d{4})/);
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
};

const parseCinText = (text) => {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  const firstName =
    extractLabeledValue(lines, ["PRENOM", "PRÉNOM", "GIVEN NAME", "FIRST NAME"]) ||
    extractLabeledValue(lines, ["PREN0M"]);
  const lastName =
    extractLabeledValue(lines, ["NOM", "NAME", "SURNAME"]) ||
    extractLabeledValue(lines, ["N0M"]);
  const dateOfBirth = extractBirthDate(text);

  return {
    firstName: firstName.replace(/^[:\-\s]+/, ""),
    lastName: lastName.replace(/^[:\-\s]+/, ""),
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

const IdentityOcrVerifier = ({ firstName, lastName, dateOfBirth, onVerificationChange }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [ocr, setOcr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const comparison = useMemo(() => {
    const extractedFirstName = ocr?.firstName || "";
    const extractedLastName = ocr?.lastName || "";
    const extractedDateOfBirth = ocr?.dateOfBirth || "";
    const firstNameMatches =
      normalizeName(firstName) !== "" &&
      normalizeName(extractedFirstName) !== "" &&
      normalizeName(firstName) === normalizeName(extractedFirstName);
    const lastNameMatches =
      normalizeName(lastName) !== "" &&
      normalizeName(extractedLastName) !== "" &&
      normalizeName(lastName) === normalizeName(extractedLastName);
    const dateMatches =
      normalizeDate(dateOfBirth) !== "" &&
      normalizeDate(extractedDateOfBirth) !== "" &&
      normalizeDate(dateOfBirth) === normalizeDate(extractedDateOfBirth);

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
      setError("Ajoutez d'abord une photo nette de la CIN.");
      return;
    }

    setLoading(true);
    setProgress(8);
    setError(null);

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (message) => {
          if (message.status === "recognizing text" && typeof message.progress === "number") {
            setProgress(Math.max(8, Math.round(message.progress * 100)));
          }
        }
      });

      await worker.setParameters({
        preserve_interword_spaces: "1"
      });

      const { data } = await worker.recognize(selectedFile);
      await worker.terminate();

      const parsed = parseCinText(data?.text || "");
      if (!parsed.firstName || !parsed.lastName || !parsed.dateOfBirth) {
        setOcr(null);
        setError("Lecture OCR incomplete. Utilisez une image plus nette de la face de la CIN.");
        return;
      }

      setOcr({
        ...parsed,
        confidence: data?.confidence ? Math.round(data.confidence) : null
      });
      setProgress(100);
    } catch (ocrError) {
      setOcr(null);
      setError("Impossible de lire la CIN pour le moment. Verifiez la photo ou reessayez.");
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
            Ajoutez la face de la carte nationale. L'OCR lit le nom, le prenom et la date de naissance, puis les compare
            aux champs saisis avant la creation du compte.
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
              accept="image/*"
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] || null);
                setOcr(null);
                setError(null);
                setProgress(0);
              }}
            />
            {previewUrl ? <img src={previewUrl} alt="Apercu CIN" className="identity-ocr-preview" /> : <div className="identity-ocr-placeholder">
              <i className="bi bi-card-image" />
              <span>Ajouter une photo nette de la CIN</span>
              <small>Nom, prenom et date de naissance doivent etre bien visibles.</small>
            </div>}
          </label>

          <div className="identity-ocr-actions">
            <button type="button" className="btn btn-success" onClick={runOcr} disabled={loading}>
              {loading ? "Lecture OCR..." : "Lire la CIN"}
            </button>
            {selectedFile && <span className="identity-ocr-file">{selectedFile.name}</span>}
          </div>

          {(loading || progress > 0) && (
            <div className="identity-ocr-progress">
              <div className="identity-ocr-progress-bar">
                <span style={{ width: `${progress}%` }} />
              </div>
              <strong>{progress}%</strong>
            </div>
          )}

          {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
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
