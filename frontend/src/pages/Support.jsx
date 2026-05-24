import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { isDoctor } from "../utils/roles";

const riskCopy = {
  LOW: "Faible",
  MODERATE: "Modere",
  HIGH: "Eleve",
  CRITICAL: "Critique"
};

const supportLanguageOptions = [
  { value: "fr", label: "Francais", hint: "Clinique" },
  { value: "darija", label: "Darija", hint: "Marocain" },
  { value: "en", label: "English", hint: "Patient" }
];

const sosPrompts = {
  fr: "SOS envie: l'envie de fumer est tres forte maintenant. Guide-moi tout de suite avec respiration et sophrologie pendant 3 a 5 minutes.",
  darija: "SOS envie: bghit nkmmi daba bzaf. Hder m3aya b Darija w 3awenni b tanaffos w sophrologie f 3 ta 5 dqayeq.",
  en: "SOS craving: the urge to smoke is very strong right now. Guide me immediately with breathing and grounding for 3 to 5 minutes."
};

const VOICE_MAX_DURATION_MS = 90_000;
const VOICE_MAX_BYTES = 10 * 1024 * 1024;
const voiceMimeTypeCandidates = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg"
];

const normalizeSupportLanguage = (value) => (
  supportLanguageOptions.some((item) => item.value === value) ? value : "fr"
);

const readStoredSupportLanguage = () => {
  try {
    return normalizeSupportLanguage(window.localStorage.getItem("neuralconsult.supportLanguage"));
  } catch (error) {
    return "fr";
  }
};

const getSosPrompt = (language) => sosPrompts[normalizeSupportLanguage(language)] || sosPrompts.fr;

const getSupportedVoiceMimeType = () => {
  if (typeof window === "undefined" || !window.MediaRecorder) {
    return "";
  }
  return voiceMimeTypeCandidates.find((mimeType) => window.MediaRecorder.isTypeSupported(mimeType)) || "";
};

const getVoiceFileName = (mimeType) => {
  if (mimeType?.includes("mp4")) return "support-voice.mp4";
  if (mimeType?.includes("ogg")) return "support-voice.ogg";
  return "support-voice.webm";
};

const formatVoiceDuration = (value) => {
  const totalSeconds = Math.max(0, Math.round((value || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const Support = () => {
  const { user } = useAuth();
  const doctorMode = isDoctor(user);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversation, setConversation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sosActive, setSosActive] = useState(false);
  const [sendingSos, setSendingSos] = useState(false);
  const [supportLanguage, setSupportLanguage] = useState(readStoredSupportLanguage);
  const [voiceState, setVoiceState] = useState("idle");
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [voiceDurationMs, setVoiceDurationMs] = useState(0);
  const [voicePreviewUrl, setVoicePreviewUrl] = useState("");
  const [voiceError, setVoiceError] = useState(null);
  const sosHandledRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const voiceChunksRef = useRef([]);
  const voiceStreamRef = useRef(null);
  const voiceStartTimeRef = useRef(0);
  const voiceTimerRef = useRef(null);
  const voiceMaxTimerRef = useRef(null);
  const voiceCancelRef = useRef(false);
  const selectedSosPrompt = getSosPrompt(supportLanguage);

  const updateSupportLanguage = (value) => {
    const nextLanguage = normalizeSupportLanguage(value);
    setSupportLanguage(nextLanguage);
    try {
      window.localStorage.setItem("neuralconsult.supportLanguage", nextLanguage);
    } catch (error) {
      // localStorage can be unavailable in private or restricted browser modes
    }
  };

  const clearVoiceTimers = () => {
    if (voiceTimerRef.current) {
      window.clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    if (voiceMaxTimerRef.current) {
      window.clearTimeout(voiceMaxTimerRef.current);
      voiceMaxTimerRef.current = null;
    }
  };

  const stopVoiceTracks = () => {
    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach((track) => track.stop());
      voiceStreamRef.current = null;
    }
  };

  const resetVoiceDraft = () => {
    clearVoiceTimers();
    stopVoiceTracks();
    voiceChunksRef.current = [];
    voiceCancelRef.current = false;
    mediaRecorderRef.current = null;
    setVoiceBlob(null);
    setVoiceDurationMs(0);
    setVoiceState("idle");
  };

  const startVoiceRecording = async () => {
    setVoiceError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder === "undefined") {
      setVoiceError("L'enregistrement vocal n'est pas disponible dans ce navigateur.");
      return;
    }

    try {
      resetVoiceDraft();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedVoiceMimeType();
      const recorder = new window.MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      voiceStreamRef.current = stream;
      voiceChunksRef.current = [];
      voiceCancelRef.current = false;
      voiceStartTimeRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          voiceChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const elapsed = Math.min(Date.now() - voiceStartTimeRef.current, VOICE_MAX_DURATION_MS);
        clearVoiceTimers();
        stopVoiceTracks();

        if (voiceCancelRef.current) {
          resetVoiceDraft();
          return;
        }

        const blob = new Blob(voiceChunksRef.current, { type: recorder.mimeType || mimeType || "audio/webm" });
        voiceChunksRef.current = [];
        mediaRecorderRef.current = null;

        if (!blob.size) {
          setVoiceError("Aucun son n'a ete capture.");
          setVoiceState("idle");
          return;
        }
        if (blob.size > VOICE_MAX_BYTES) {
          setVoiceError("Le message vocal depasse 10 Mo.");
          setVoiceState("idle");
          return;
        }

        setVoiceBlob(blob);
        setVoiceDurationMs(elapsed);
        setVoiceState("ready");
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setVoiceState("recording");
      voiceTimerRef.current = window.setInterval(() => {
        setVoiceDurationMs(Math.min(Date.now() - voiceStartTimeRef.current, VOICE_MAX_DURATION_MS));
      }, 250);
      voiceMaxTimerRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, VOICE_MAX_DURATION_MS);
    } catch (error) {
      stopVoiceTracks();
      setVoiceState("idle");
      setVoiceError("Micro inaccessible. Verifiez l'autorisation du navigateur.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelVoiceRecording = () => {
    setVoiceError(null);
    voiceCancelRef.current = true;
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      return;
    }
    resetVoiceDraft();
  };

  const loadPatientSupport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/support/current");
      setConversation(data);
    } catch (error) {
      setConversation(null);
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorSupport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/support/doctor/alerts");
      setAlerts(data || []);
      const fallbackPatientId = selectedPatientId || data?.[0]?.patientProfileId || null;
      setSelectedPatientId(fallbackPatientId);
      if (fallbackPatientId) {
        const conversationResp = await api.get(`/api/support/doctor/patients/${fallbackPatientId}`);
        setConversation(conversationResp.data);
      } else {
        setConversation(null);
      }
    } catch (error) {
      setAlerts([]);
      setConversation(null);
    } finally {
      setLoading(false);
    }
  };

  const reload = async () => {
    if (doctorMode) {
      await loadDoctorSupport();
    } else {
      await loadPatientSupport();
    }
  };

  useEffect(() => {
    reload();
  }, [doctorMode]);

  useEffect(() => {
    if (!voiceBlob) {
      setVoicePreviewUrl("");
      return undefined;
    }
    const url = window.URL.createObjectURL(voiceBlob);
    setVoicePreviewUrl(url);
    return () => window.URL.revokeObjectURL(url);
  }, [voiceBlob]);

  useEffect(() => () => {
    clearVoiceTimers();
    stopVoiceTracks();
  }, []);

  useEffect(() => {
    if (doctorMode) {
      return;
    }
    if (searchParams.get("sos") !== "1") {
      sosHandledRef.current = false;
      return;
    }
    if (sosHandledRef.current) {
      return;
    }

    sosHandledRef.current = true;
    setSosActive(true);
    setDraft(selectedSosPrompt);

    const startSos = async () => {
      setSendingSos(true);
      setMessage(null);
      try {
        const { data } = await api.post("/api/support/current/messages", {
          message: selectedSosPrompt,
          emergencyMode: true,
          preferredLanguage: supportLanguage
        });
        setConversation(data);
        setDraft("");
        setMessage({ type: "success", text: "Mode SOS active. L'IA te guide maintenant en respiration et sophrologie." });
      } catch (error) {
        const apiError = error?.response?.data?.message || error?.response?.data?.error;
        setMessage({ type: "error", text: apiError || "Impossible de lancer le SOS envie. Reessayez depuis le bouton rouge." });
      } finally {
        setSendingSos(false);
        const next = new URLSearchParams(searchParams);
        next.delete("sos");
        setSearchParams(next, { replace: true });
      }
    };

    startSos();
  }, [doctorMode, searchParams, selectedSosPrompt, setSearchParams, supportLanguage]);

  useEffect(() => {
    if (!doctorMode) {
      return;
    }
    const patientId = searchParams.get("patient");
    if (!patientId) {
      return;
    }

    const openFromQuery = async () => {
      try {
        setSelectedPatientId(patientId);
        const { data } = await api.get(`/api/support/doctor/patients/${patientId}`);
        setConversation(data);
      } catch (error) {
        // ignore query-navigation failure, normal screen keeps working
      } finally {
        const next = new URLSearchParams(searchParams);
        next.delete("patient");
        setSearchParams(next, { replace: true });
      }
    };

    openFromQuery();
  }, [doctorMode, searchParams, setSearchParams]);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setMessage(null);
    try {
      const { data } = await api.post("/api/support/current/messages", {
        message: draft.trim(),
        emergencyMode: sosActive,
        preferredLanguage: supportLanguage
      });
      setConversation(data);
      setDraft("");
      setSosActive(false);
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Impossible d'envoyer le message a l'IA." });
    }
  };

  const sendVoiceMessage = async () => {
    if (!voiceBlob || voiceState === "processing") return;
    setMessage(null);
    setVoiceError(null);

    if (voiceBlob.size > VOICE_MAX_BYTES) {
      setVoiceError("Le message vocal depasse 10 Mo.");
      return;
    }

    const formData = new FormData();
    formData.append("audio", voiceBlob, getVoiceFileName(voiceBlob.type));
    formData.append("emergencyMode", String(sosActive));
    formData.append("preferredLanguage", supportLanguage);
    formData.append("audioDurationMs", String(Math.min(voiceDurationMs, VOICE_MAX_DURATION_MS)));

    setVoiceState("processing");
    try {
      const { data } = await api.post("/api/support/current/voice-message", formData);
      setConversation(data);
      resetVoiceDraft();
      setSosActive(false);
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.detail || error?.response?.data?.error;
      setVoiceState("ready");
      setVoiceError(apiError || "Impossible d'analyser le message vocal.");
    }
  };

  const acknowledgeAlert = async (alertId) => {
    setMessage(null);
    try {
      await api.post(`/api/support/doctor/alerts/${alertId}/acknowledge`);
      await loadDoctorSupport();
      setMessage({ type: "success", text: "Alerte medecin accusee. Le dossier peut maintenant etre traite." });
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Impossible d'accuser l'alerte." });
    }
  };

  return (
      <div className="container py-4 app-shell" data-guide-id="support-main">
        <div className="profile-page-header" data-guide-id="support-header">
        <div>
          <div className="hero-kicker">Soutien 24/7</div>
          <h2 className="fw-bold mb-1">{doctorMode ? "Alertes et conversations IA" : "Psychologue IA disponible a tout moment"}</h2>
          <p className="muted-text mb-0">
            {doctorMode
              ? "Le medecin consulte les echanges IA, comprend le contexte psychologique et peut prioriser les alertes critiques."
              : "Le patient peut parler avec l'assistant a tout moment. Les signaux a risque sont traces pour le medecin si la situation l'exige."}
          </p>
        </div>
        {!doctorMode && (
          <div className="support-patient-tools">
            <div className="support-language-switch" aria-label="Langue de reponse de l'IA">
              {supportLanguageOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`support-language-option ${supportLanguage === option.value ? "is-active" : ""}`}
                  onClick={() => updateSupportLanguage(option.value)}
                  title={`IA patient: ${option.label}`}
                >
                  <span>{option.label}</span>
                  <small>{option.hint}</small>
                </button>
              ))}
            </div>
            <button type="button" className="btn support-sos-header-button" onClick={() => {
              setSosActive(true);
              setDraft(selectedSosPrompt);
              navigate("/support?sos=1", { replace: true });
            }}>
              <i className="bi bi-broadcast-pin me-2" />
              SOS Envie
            </button>
          </div>
        )}
      </div>

      {message && <div className={`alert mt-3 ${message.type === "error" ? "alert-danger" : "alert-success"}`}>{message.text}</div>}

      <div className="doctor-workspace-grid mt-4">
        <div className="doctor-workspace-main">
          <section className="card form-card">
            <div className="section-title-sm">Vue synthese</div>
            {loading ? (
              <p className="muted-text mb-0 mt-3">Chargement du soutien IA...</p>
            ) : (
              <div className="doctor-summary-strip mt-3">
                <div className="doctor-summary-card"><span className="profile-data-label">Risque courant</span><strong>{riskCopy[conversation?.latestRiskLevel] || "Faible"}</strong></div>
                <div className="doctor-summary-card"><span className="profile-data-label">Alertes</span><strong>{doctorMode ? alerts.length : conversation?.alerts?.length || 0}</strong></div>
                <div className="doctor-summary-card"><span className="profile-data-label">Medecin lie</span><strong>{conversation?.doctorName || "Aucun pour l'instant"}</strong></div>
                <div className="doctor-summary-card"><span className="profile-data-label">Resume</span><strong>{conversation?.latestSummary || "Echange non demarre"}</strong></div>
              </div>
            )}
          </section>

          {doctorMode && (
            <section className="card form-card mt-4">
              <div className="section-title-sm">Alertes medecin</div>
              {alerts.length === 0 ? (
                <p className="muted-text mb-0 mt-3">Aucune alerte ouverte pour le moment.</p>
              ) : (
                <div className="doctor-request-stack mt-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="doctor-request-card">
                      <div className="doctor-request-card-head">
                        <div>
                          <strong>{alert.patientName}</strong>
                          <p className="mb-0 muted-text">{alert.title} · niveau {riskCopy[alert.level] || alert.level}</p>
                        </div>
                        <span className={`doctor-status-chip status-${String(alert.status || "OPEN").toLowerCase()}`}>{alert.status}</span>
                      </div>
                      <p className="muted-text">{alert.summary}</p>
                      <div className="doctor-card-actions">
                        <button type="button" className="btn btn-outline-dark" onClick={async () => {
                          setSelectedPatientId(alert.patientProfileId);
                          const { data } = await api.get(`/api/support/doctor/patients/${alert.patientProfileId}`);
                          setConversation(data);
                        }}>
                          Ouvrir la conversation
                        </button>
                        <button
                          type="button"
                          className="btn btn-success"
                          onClick={() => navigate(`/appointments?urgentPatient=${alert.patientProfileId}`)}
                        >
                          Consultation urgente
                        </button>
                        {alert.status === "OPEN" && (
                          <button type="button" className="btn btn-dark" onClick={() => acknowledgeAlert(alert.id)}>
                            Accuser l'alerte
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="doctor-dossier-panel">
          <section className="card form-card">
            <div className="section-title-sm">Conversation</div>
            {!conversation ? (
              <p className="muted-text mb-0 mt-3">Aucune conversation disponible pour le moment.</p>
            ) : (
              <>
                {!doctorMode && sosActive && (
                  <div className="support-sos-banner mt-3">
                    <i className="bi bi-heart-pulse-fill" />
                    <div>
                      <strong>Urgences Respiration & Sophrologie</strong>
                      <p className="mb-0">Restez sur cet ecran. L'IA vous accompagne sur la vague de 3 a 5 minutes et alerte le medecin si le risque devient critique.</p>
                    </div>
                  </div>
                )}
                <div className="doctor-dossier-section mt-3">
                  <strong>{doctorMode ? "Lecture conversationnelle cote medecin" : "Espace de parole continu"}</strong>
                  <p className="muted-text mb-0">{conversation.latestSummary || "L'IA garde un fil conducteur clinique a chaque echange."}</p>
                </div>
                <div className="support-thread mt-3">
                  {(conversation.messages || []).map((item) => (
                    <div key={item.id} className={`support-bubble ${item.senderType === "PATIENT" ? "is-patient" : item.senderType === "AI" ? "is-ai" : "is-system"}`}>
                      <div className="support-bubble-head">
                        <span className="profile-data-label">
                          {item.senderType === "PATIENT" && item.inputMode === "VOICE" ? "PATIENT · VOIX" : item.senderType}
                        </span>
                        {item.inputMode === "VOICE" && (
                          <span className={`support-stress-chip level-${String(item.voiceStressLevel || "LOW").toLowerCase()}`}>
                            Stress {riskCopy[item.voiceStressLevel] || "Faible"} · {item.voiceStressScore ?? 0}/100
                          </span>
                        )}
                      </div>
                      <p className="mb-0">{item.content}</p>
                      {item.inputMode === "VOICE" && item.voiceStressSummary && (
                        <small className="support-voice-summary">{item.voiceStressSummary}</small>
                      )}
                      <small>{formatDateTime(item.createdAt)}</small>
                    </div>
                  ))}
                </div>

                {!doctorMode && (
                  <form className="mt-3" onSubmit={sendMessage}>
                    <label className="form-label">Parle librement avec l'IA</label>
                    <textarea className="form-control" rows="4" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Explique ce qui te pese maintenant: craving, stress, peur de rechuter, sommeil, anxiete..." />
                    <div className={`support-voice-panel is-${voiceState}`}>
                      {voiceState === "idle" && (
                        <button type="button" className="btn btn-outline-dark support-voice-button" onClick={startVoiceRecording}>
                          <i className="bi bi-mic-fill me-2" />
                          Message vocal
                        </button>
                      )}

                      {voiceState === "recording" && (
                        <div className="support-voice-row">
                          <div className="support-recording-indicator">
                            <span />
                            <strong>{formatVoiceDuration(voiceDurationMs)}</strong>
                          </div>
                          <div className="support-voice-actions">
                            <button type="button" className="btn btn-dark" onClick={stopVoiceRecording}>
                              Terminer
                            </button>
                            <button type="button" className="btn btn-outline-dark" onClick={cancelVoiceRecording}>
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}

                      {voiceState === "ready" && (
                        <div className="support-voice-ready">
                          <div>
                            <strong>Vocal pret · {formatVoiceDuration(voiceDurationMs)}</strong>
                          </div>
                          {voicePreviewUrl && <audio className="support-voice-player" controls src={voicePreviewUrl} />}
                          <div className="support-voice-actions">
                            <button type="button" className="btn btn-dark" onClick={sendVoiceMessage}>
                              Envoyer
                            </button>
                            <button type="button" className="btn btn-outline-dark" onClick={cancelVoiceRecording}>
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}

                      {voiceState === "processing" && (
                        <div className="support-voice-row">
                          <div className="support-recording-indicator is-processing">
                            <span />
                            <strong>Analyse vocale...</strong>
                          </div>
                        </div>
                      )}
                    </div>
                    {voiceError && <div className="alert alert-warning mt-3 mb-0">{voiceError}</div>}
                    <div className="doctor-card-actions mt-3">
                      <button type="submit" className="btn btn-dark" disabled={sendingSos || voiceState !== "idle"}>{sendingSos ? "SOS en cours..." : sosActive ? "Continuer le SOS" : "Envoyer"}</button>
                      {sosActive && (
                        <button type="button" className="btn btn-outline-dark" onClick={() => setSosActive(false)}>
                          Revenir au chat normal
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default Support;
