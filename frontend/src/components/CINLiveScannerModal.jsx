import React, { useEffect, useRef, useState } from "react";

const CIN_RATIO = 85.6 / 54;
const FRAME_MARGIN = 0.06;

// ── Quality thresholds ────────────────────────────────────────────────────────
const BLUR_THRESHOLD  = 180;   // Laplacian variance on card zone only
const MIN_BRIGHTNESS  = 50;
const MAX_BRIGHTNESS  = 220;
const REQUIRED_STABLE = 5;     // 5 × 500ms = 2.5s stable before snap

// ── AI Service OCR endpoint ───────────────────────────────────────────────────
const OCR_ENDPOINT = "http://localhost:8000/api/ocr/cin";

// ── Helpers ───────────────────────────────────────────────────────────────────
const getFrameRect = (W, H) => {
  const maxW = W * (1 - 2 * FRAME_MARGIN);
  const maxH = H * (1 - 2 * FRAME_MARGIN);
  let fw, fh;
  if (maxW / CIN_RATIO <= maxH) { fw = maxW; fh = fw / CIN_RATIO; }
  else                           { fh = maxH; fw = fh * CIN_RATIO; }
  return { x: (W - fw) / 2, y: (H - fh) / 2, w: fw, h: fh };
};

const cardBlurScore = (snapCanvas, fr) => {
  const step = 2;
  const cx = document.createElement("canvas");
  cx.width  = Math.round(fr.w / step);
  cx.height = Math.round(fr.h / step);
  const ctx = cx.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(snapCanvas, fr.x, fr.y, fr.w, fr.h, 0, 0, cx.width, cx.height);
  const { width: w, height: h } = cx;
  const d = ctx.getImageData(0, 0, w, h).data;
  const g = new Float32Array(w * h);
  for (let i = 0; i < d.length; i += 4) g[i >> 2] = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
  let v = 0;
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const l = -g[(y-1)*w+x] - g[y*w+(x-1)] + 4*g[y*w+x] - g[y*w+(x+1)] - g[(y+1)*w+x];
      v += l * l;
    }
  return v / (w * h);
};

const cardBrightness = (snapCanvas, fr) => {
  const cx = document.createElement("canvas");
  cx.width = Math.round(fr.w / 4); cx.height = Math.round(fr.h / 4);
  const ctx = cx.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(snapCanvas, fr.x, fr.y, fr.w, fr.h, 0, 0, cx.width, cx.height);
  const d = ctx.getImageData(0, 0, cx.width, cx.height).data;
  let s = 0;
  for (let i = 0; i < d.length; i += 4) s += 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
  return s / (cx.width * cx.height);
};

/** Crop card zone, upscale × 3, boost contrast → return as Blob (JPEG) */
const cropCardBlob = (snapCanvas, fr) => {
  const UPSCALE = 3;
  const c = document.createElement("canvas");
  c.width  = Math.round(fr.w * UPSCALE);
  c.height = Math.round(fr.h * UPSCALE);
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(snapCanvas, fr.x, fr.y, fr.w, fr.h, 0, 0, c.width, c.height);
  // Contrast boost
  const img = ctx.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < img.data.length; i += 4) {
    const lum = Math.min(255, Math.max(0,
      (0.299 * img.data[i] + 0.587 * img.data[i+1] + 0.114 * img.data[i+2] - 128) * 1.5 + 128
    ));
    img.data[i] = img.data[i+1] = img.data[i+2] = lum;
  }
  ctx.putImageData(img, 0, 0);
  return new Promise(resolve => c.toBlob(resolve, "image/jpeg", 0.95));
};

const drawFrame = (canvas, fr, color, anim, stableCount) => {
  const ctx = canvas.getContext("2d");
  const { x, y, w, h } = fr;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.clearRect(x, y, w, h);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x, y, w, h);

  const cs = Math.min(w, h) * 0.11;
  const pulse = stableCount > 0 ? 1 : 0.75 + 0.25 * Math.sin(anim);
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  [[x, y, 1, 1], [x+w, y, -1, 1], [x, y+h, 1, -1], [x+w, y+h, -1, -1]].forEach(([cx2, cy2, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx2 + dx * cs, cy2);
    ctx.lineTo(cx2, cy2);
    ctx.lineTo(cx2, cy2 + dy * cs);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  // Countdown ring
  if (stableCount > 0 && stableCount < REQUIRED_STABLE) {
    const cx2 = x + w / 2;
    const cy2 = y + h / 2;
    const radius = Math.min(w, h) * 0.08;
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx2, cy2, radius, 0, 2 * Math.PI); ctx.stroke();
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(cx2, cy2, radius, -Math.PI / 2, -Math.PI / 2 + (stableCount / REQUIRED_STABLE) * 2 * Math.PI);
    ctx.stroke();
    const remaining = Math.ceil((REQUIRED_STABLE - stableCount) * 0.5);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.round(radius * 1.2)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(remaining), cx2, cy2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
  ctx.globalAlpha = 1;
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────
const CINLiveScannerModal = ({ onClose, onResult }) => {
  const videoRef    = useRef(null);
  const overlayRef  = useRef(null);
  const snapshotRef = useRef(null);
  const streamRef   = useRef(null);
  const rafRef      = useRef(null);
  const scanningRef = useRef(false);
  const stableRef   = useRef(0);
  const sharpFrames = useRef([]);

  const [phase,    setPhase]    = useState("init");
  const [message,  setMessage]  = useState("Initialisation de la caméra…");
  const [progress, setProgress] = useState(0);
  const [result,   setResult]   = useState(null);
  const [color,    setColor]    = useState("#ffffff88");
  const [stable,   setStable]   = useState(0);

  // ── Start camera ───────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false
        });
        if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) { v.srcObject = stream; await v.play(); }
        setPhase("active");
        setMessage("Placez votre CIN dans le cadre");
      } catch (e) {
        setPhase("error");
        setMessage("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      }
    })();
    return () => { alive = false; streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  // ── Quality + overlay loop ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "active") return;
    let anim = 0, lastCheck = 0, alive = true;

    const loop = (ts) => {
      if (!alive) return;
      rafRef.current = requestAnimationFrame(loop);
      anim += 0.065;

      const video   = videoRef.current;
      const overlay = overlayRef.current;
      if (!video || !overlay || video.readyState < 2) return;

      if (overlay.width !== video.videoWidth || overlay.height !== video.videoHeight) {
        overlay.width  = video.videoWidth  || overlay.clientWidth;
        overlay.height = video.videoHeight || overlay.clientHeight;
      }

      const fr = getFrameRect(overlay.width, overlay.height);
      drawFrame(overlay, fr, color, anim, stableRef.current);

      if (ts - lastCheck < 500) return;
      lastCheck = ts;

      const snap = document.createElement("canvas");
      snap.width = video.videoWidth; snap.height = video.videoHeight;
      snap.getContext("2d", { willReadFrequently: true }).drawImage(video, 0, 0);

      const blur   = cardBlurScore(snap, fr);
      const bright = cardBrightness(snap, fr);

      let ok = true, msg = "", col = "#22c55e";
      if (bright < MIN_BRIGHTNESS) {
        ok = false; msg = "⚡ Trop sombre — améliorez l'éclairage"; col = "#ef4444";
      } else if (bright > MAX_BRIGHTNESS) {
        ok = false; msg = "☀ Trop lumineux — évitez les reflets"; col = "#f59e0b";
      } else if (blur < BLUR_THRESHOLD) {
        const pct = Math.min(99, Math.round((blur / BLUR_THRESHOLD) * 100));
        ok = false; msg = `📷 Flou (${pct}%) — Attendez l'autofocus…`; col = "#ef4444";
      }

      setColor(col);

      if (ok) {
        stableRef.current++;
        setStable(stableRef.current);
        sharpFrames.current.push({ snap, blur });
        if (sharpFrames.current.length > 3) sharpFrames.current.shift();

        if (stableRef.current >= REQUIRED_STABLE && !scanningRef.current) {
          sharpFrames.current.sort((a, b) => b.blur - a.blur);
          const bestSnap = sharpFrames.current[0].snap;
          snapshotRef.current = bestSnap;
          stableRef.current = 0; sharpFrames.current = [];
          setStable(0); setPhase("scanning"); setMessage("Envoi au serveur OCR…");
          performOcr(bestSnap);
        } else {
          const rem = Math.ceil((REQUIRED_STABLE - stableRef.current) * 0.5);
          setMessage(rem > 0 ? `✓ Net ! Stabilisez encore ${rem}s…` : "✓ Scan en cours…");
        }
      } else {
        stableRef.current = 0; sharpFrames.current = [];
        setStable(0); setMessage(msg);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, color]);

  // ── Send to Python backend OCR ─────────────────────────────────────────────
  const performOcr = async (snap) => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setProgress(10);

    try {
      const fr = getFrameRect(snap.width, snap.height);
      const blob = await cropCardBlob(snap, fr);
      setProgress(30);

      const formData = new FormData();
      formData.append("file", blob, "cin.jpg");

      setMessage("Reconnaissance OCR en cours…");
      const response = await fetch(OCR_ENDPOINT, { method: "POST", body: formData });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${response.status}`);
      }

      setProgress(90);
      const data = await response.json();

      if (!data.firstName && !data.lastName && !data.dateOfBirth) {
        scanningRef.current = false;
        setPhase("active");
        setMessage("Carte non lisible — Repositionnez la CIN");
        return;
      }

      setResult(data);
      setProgress(100);
      setPhase("success");
      setMessage("Lecture réussie !");
    } catch (err) {
      console.error("OCR error:", err);
      scanningRef.current = false;
      setPhase("active");
      setMessage(`Erreur : ${err.message} — Réessai…`);
    }
  };

  const handleConfirm = () => { onResult(result); handleClose(); };

  const handleRetry = () => {
    setResult(null); setProgress(0);
    scanningRef.current = false; snapshotRef.current = null;
    sharpFrames.current = []; stableRef.current = 0; setStable(0);
    setPhase("active"); setMessage("Placez votre CIN dans le cadre");
  };

  const handleClose = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    onClose();
  };

  return (
    <div className="cin-scanner-modal" role="dialog" aria-label="Scanner CIN">
      <div className="cin-scanner-backdrop" onClick={handleClose} />
      <div className="cin-scanner-container">

        <div className="cin-scanner-header">
          <div>
            <h3>Scanner la Carte d'Identité</h3>
            <p>Cadrez le recto de votre CIN — restez immobile jusqu'au scan</p>
          </div>
          <button className="cin-scanner-close" onClick={handleClose} aria-label="Fermer">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="cin-scanner-viewport">
          {phase !== "success" && <video ref={videoRef} className="cin-scanner-video" autoPlay playsInline muted />}
          {phase !== "success" && <canvas ref={overlayRef} className="cin-scanner-overlay" />}

          {phase === "success" && snapshotRef.current && (
            <div className="cin-scanner-frozen">
              <canvas
                className="cin-scanner-snapshot"
                ref={c => { if (c && snapshotRef.current) c.getContext("2d").drawImage(snapshotRef.current, 0, 0, c.width, c.height); }}
                width={600} height={Math.round(600 / CIN_RATIO)}
              />
            </div>
          )}

          {phase !== "success" && (
            <div className={`cin-scanner-status-badge${phase === "scanning" ? " is-scanning" : phase === "error" ? " is-error" : stable > 0 ? " is-ok-counting" : ""}`}>
              {phase === "scanning" && <span className="cin-scanner-spinner" />}
              {phase === "error"    && <i className="bi bi-exclamation-circle-fill" />}
              {phase === "active" && stable > 0 && <i className="bi bi-check-circle" />}
              <span>{message}</span>
            </div>
          )}

          {phase === "scanning" && (
            <div className="cin-scanner-progress">
              <div className="cin-scanner-progress-inner" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {phase === "success" && result && (
          <div className="cin-scanner-result-panel">
            <div className="cin-scanner-result-grid">
              <div className="cin-scanner-result-field">
                <span>Prénom détecté</span>
                <strong>{result.firstName || "—"}</strong>
              </div>
              <div className="cin-scanner-result-field">
                <span>Nom détecté</span>
                <strong>{result.lastName || "—"}</strong>
              </div>
              <div className="cin-scanner-result-field">
                <span>Date de naissance</span>
                <strong>{result.dateOfBirth || "—"}</strong>
              </div>
            </div>
            <div className="cin-scanner-result-actions">
              <button className="btn btn-outline-secondary" onClick={handleRetry}>
                <i className="bi bi-arrow-counterclockwise" /> Rescanner
              </button>
              <button className="btn btn-success" onClick={handleConfirm}>
                <i className="bi bi-check-lg" /> Confirmer
              </button>
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="cin-scanner-error-panel">
            <i className="bi bi-camera-video-off" />
            <p>{message}</p>
            <button className="btn btn-outline-light" onClick={handleClose}>Fermer</button>
          </div>
        )}

        {phase === "active" && (
          <div className="cin-scanner-guide">
            <i className="bi bi-lightbulb" />
            <span>
              {stable > 0 ? "✓ Image nette — restez immobile !" : "Remplissez le cadre avec la carte, bonne lumière, restez immobile"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CINLiveScannerModal;
