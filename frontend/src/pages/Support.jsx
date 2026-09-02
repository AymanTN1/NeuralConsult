import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { isDoctor } from "../utils/roles";

const riskCopy = {
  LOW: "Faible",
  MODERATE: "Modéré",
  HIGH: "Élevé",
  CRITICAL: "Critique"
};

const riskColor = {
  LOW: "#10b981",
  MODERATE: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#ef4444"
};

const supportLanguageOptions = [
  { value: "fr", label: "Français", hint: "Clinique" },
  { value: "darija", label: "Darija", hint: "Marocain" },
  { value: "en", label: "English", hint: "Patient" }
];

const sosPrompts = {
  fr: "SOS envie: l'envie de fumer est très forte maintenant. Guide-moi tout de suite avec respiration et sophrologie pendant 3 à 5 minutes.",
  darija: "SOS envie: bghit nkmmi daba bzaf. Hder m3aya b Darija w 3awenni b tanaffos w sophrologie f 3 ta 5 dqayeq.",
  en: "SOS craving: the urge to smoke is very strong right now. Guide me immediately with breathing and grounding for 3 to 5 minutes."
};

const quickSuggestions = [
  { label: "🚨 Envie soudaine de fumer", text: "J'ai une envie soudaine et intense de fumer maintenant. Que puis-je faire pour calmer le pic d'envie ?" },
  { label: "🧘 Exercice de respiration 4-7-8", text: "Guide-moi pas à pas à travers une séance de cohérence cardiaque et de respiration 4-7-8 pour me détendre." },
  { label: "😰 Stress au travail", text: "Je ressens beaucoup de stress et mon premier réflexe est de vouloir allumer une cigarette. Aide-moi à surmonter ce moment." },
  { label: "💊 Question substituts TSN", text: "Comment bien gérer mes pastilles ou patchs en cas de tentation imprévue ?" },
  { label: "🏆 Rappelle-moi mes victoires", text: "Rappelle-moi les bénéfices déjà acquis pour mes poumons et ma santé depuis le début de mon sevrage." }
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

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("fr-FR", {
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
  const [doctorPatients, setDoctorPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [supportLanguage, setSupportLanguage] = useState(readStoredSupportLanguage);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const sosHandledRef = useRef(false);

  const selectedSosPrompt = getSosPrompt(supportLanguage);

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [conversation?.messages?.length, sending]);

  const updateSupportLanguage = (value) => {
    const nextLanguage = normalizeSupportLanguage(value);
    setSupportLanguage(nextLanguage);
    try {
      window.localStorage.setItem("neuralconsult.supportLanguage", nextLanguage);
    } catch (error) {
      // ignore restricted storage
    }
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
      const [alertsResp, patientsResp] = await Promise.allSettled([
        api.get("/api/support/doctor/alerts"),
        api.get("/api/doctors/patients")
      ]);
      const nextAlerts = alertsResp.status === "fulfilled" ? alertsResp.value.data || [] : [];
      const nextPatients = patientsResp.status === "fulfilled" ? patientsResp.value.data || [] : [];
      setAlerts(nextAlerts);
      setDoctorPatients(nextPatients);

      const fallbackPatientId = selectedPatientId || nextAlerts[0]?.patientProfileId || nextPatients[0]?.patientProfileId || "p0c70000-0000-0000-0000-000000000001";
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
    if (doctorMode) return;
    if (searchParams.get("sos") !== "1") {
      sosHandledRef.current = false;
      return;
    }
    if (sosHandledRef.current) return;

    sosHandledRef.current = true;
    setSosActive(true);

    const startSos = async () => {
      setSending(true);
      setMessage(null);
      try {
        const { data } = await api.post("/api/support/current/messages", {
          message: selectedSosPrompt,
          emergencyMode: true,
          preferredLanguage: supportLanguage
        });
        setConversation(data);
        setMessage({ type: "success", text: "🚨 Mode SOS activé : L'IA vous accompagne sur la vague de craving." });
      } catch (error) {
        const apiError = error?.response?.data?.message || error?.response?.data?.error;
        setMessage({ type: "error", text: apiError || "Impossible de lancer le SOS envie." });
      } finally {
        setSending(false);
        const next = new URLSearchParams(searchParams);
        next.delete("sos");
        setSearchParams(next, { replace: true });
      }
    };

    startSos();
  }, [doctorMode, searchParams, selectedSosPrompt, setSearchParams, supportLanguage]);

  useEffect(() => {
    if (!doctorMode) return;
    const patientId = searchParams.get("patient");
    if (!patientId) return;

    const openFromQuery = async () => {
      try {
        setSelectedPatientId(patientId);
        const { data } = await api.get(`/api/support/doctor/patients/${patientId}`);
        setConversation(data);
      } catch (error) {
        // ignore
      } finally {
        const next = new URLSearchParams(searchParams);
        next.delete("patient");
        setSearchParams(next, { replace: true });
      }
    };

    openFromQuery();
  }, [doctorMode, searchParams, setSearchParams]);

  const handleSendMessage = async (textToSend) => {
    const content = (textToSend || draft).trim();
    if (!content || sending) return;

    setDraft("");
    setSending(true);
    setMessage(null);

    // Optimistic bubble
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      senderType: doctorMode ? "DOCTOR" : "PATIENT",
      content,
      createdAt: new Date().toISOString()
    };

    setConversation((prev) => ({
      ...prev,
      messages: [...(prev?.messages || []), optimisticMsg]
    }));

    try {
      const endpoint = doctorMode && selectedPatientId
        ? `/api/support/doctor/patients/${selectedPatientId}`
        : "/api/support/current/messages";

      const { data } = await api.post(endpoint, {
        message: content,
        emergencyMode: sosActive,
        preferredLanguage: supportLanguage,
        patientProfileId: selectedPatientId
      });
      if (data && data.messages) {
        setConversation(data);
      } else {
        setConversation((prev) => ({
          ...prev,
          messages: [...(prev?.messages || []), {
            id: `ai-${Date.now()}`,
            senderType: "AI",
            content: doctorMode
              ? `Directive clinique enregistrée : « ${content} ». L'assistant IA intègre cette recommandation au plan de suivi du patient.`
              : `Je vous accompagne bien volontiers. Respirez profondément, vous êtes sur la bonne voie.`,
            createdAt: new Date().toISOString()
          }]
        }));
      }
      setSosActive(false);
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Erreur lors de la communication avec l'assistant IA." });
    } finally {
      setSending(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const triggerSosQuick = () => {
    setSosActive(true);
    handleSendMessage(selectedSosPrompt);
  };

  const acknowledgeAlert = async (alertId) => {
    setMessage(null);
    try {
      await api.post(`/api/support/doctor/alerts/${alertId}/acknowledge`);
      await loadDoctorSupport();
      setMessage({ type: "success", text: "Alerte médecin accusée avec succès." });
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Impossible d'accuser l'alerte." });
    }
  };

  const currentRisk = conversation?.latestRiskLevel || "LOW";

  return (
    <div className="support-page-container container-fluid py-4" data-guide-id="support-main">
      {/* Header Banner */}
      <div className="support-header-card mb-4" data-guide-id="support-header">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="support-bot-avatar-glow">
              <i className="bi bi-robot" />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h3 className="fw-bold mb-0 text-gradient-primary">
                  {doctorMode ? "Surveillance & Conversations IA" : "Psychologue & Compagnon IA 24/7"}
                </h3>
                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 small">
                  <span className="pulse-dot me-1" /> En ligne 24/7
                </span>
              </div>
              <p className="text-muted small mb-0 mt-1">
                {doctorMode
                  ? "Consultez l'historique psychologique des patients, analysez les signaux de risque et traitez les alertes critiques."
                  : "Votre espace bienveillant d'écoute, de sophrologie et de soutien immédiat face aux envies de fumer."}
              </p>
            </div>
          </div>

          {!doctorMode && (
            <div className="d-flex align-items-center gap-2">
              <div className="support-lang-pills">
                {supportLanguageOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`support-lang-pill ${supportLanguage === opt.value ? "active" : ""}`}
                    onClick={() => updateSupportLanguage(opt.value)}
                  >
                    <span>{opt.label}</span>
                    <small>{opt.hint}</small>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={`btn support-sos-action-btn ${sosActive ? "active-pulse" : ""}`}
                onClick={triggerSosQuick}
                disabled={sending}
              >
                <i className="bi bi-broadcast-pin me-1.5" />
                SOS Envie
              </button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`alert ${message.type === "error" ? "alert-danger" : "alert-success"} alert-dismissible fade show rounded-4 shadow-sm mb-4`} role="alert">
          <div className="d-flex align-items-center gap-2">
            <i className={`bi ${message.type === "error" ? "bi-exclamation-triangle-fill" : "bi-check-circle-fill"} fs-5`} />
            <div>{message.text}</div>
          </div>
          <button type="button" className="btn-close" onClick={() => setMessage(null)} />
        </div>
      )}

      {/* Main Support Grid */}
      <div className="row g-4 support-layout-row">
        {/* Left Sidebar: Clinical Status & Quick Relief Tools */}
        <div className="col-12 col-lg-4 col-xl-3">
          <div className="support-sidebar-stack d-flex flex-column gap-3">
            {/* Risk & Connection Card */}
            <div className="card support-card-glass p-3.5 rounded-4 shadow-sm">
              <h6 className="fw-bold mb-3 d-flex align-items-center justify-content-between">
                <span>Indicateurs Cliniques</span>
                <i className="bi bi-shield-check text-primary" />
              </h6>

              <div className="support-vitals-list d-flex flex-column gap-2.5">
                <div className="support-vital-item d-flex justify-content-between align-items-center p-2.5 rounded-3">
                  <span className="text-muted small">Niveau de risque :</span>
                  <span
                    className="badge rounded-pill fw-semibold px-2.5 py-1.5"
                    style={{
                      backgroundColor: `${riskColor[currentRisk]}22`,
                      color: riskColor[currentRisk],
                      border: `1px solid ${riskColor[currentRisk]}44`
                    }}
                  >
                    ● {riskCopy[currentRisk] || currentRisk}
                  </span>
                </div>

                <div className="support-vital-item d-flex justify-content-between align-items-center p-2.5 rounded-3">
                  <span className="text-muted small">Médecin traitant :</span>
                  <strong className="small text-truncate" style={{ maxWidth: "140px" }}>
                    {conversation?.doctorName || "Dr. Non assigné"}
                  </strong>
                </div>

                <div className="support-vital-item d-flex justify-content-between align-items-center p-2.5 rounded-3">
                  <span className="text-muted small">Alertes ouvertes :</span>
                  <span className="badge bg-secondary-subtle text-body rounded-pill px-2">
                    {doctorMode ? alerts.length : conversation?.alerts?.length || 0}
                  </span>
                </div>
              </div>

              {conversation?.latestSummary && (
                <div className="support-summary-quote mt-3 p-3 rounded-3">
                  <div className="text-muted text-uppercase x-small fw-bold mb-1">
                    <i className="bi bi-chat-quote me-1" /> Synthèse active
                  </div>
                  <p className="mb-0 small text-body-secondary fst-italic">
                    "{conversation.latestSummary}"
                  </p>
                </div>
              )}
            </div>

            {/* Quick-Relief Tools (Patient Only) */}
            {!doctorMode && (
              <div className="card support-card-glass p-3.5 rounded-4 shadow-sm">
                <h6 className="fw-bold mb-3 d-flex align-items-center justify-content-between">
                  <span>Outils d'Urgence Rapides</span>
                  <i className="bi bi-lightning-charge-fill text-warning" />
                </h6>

                <div className="d-flex flex-column gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-info text-start d-flex align-items-center gap-2.5 p-2.5 rounded-3 support-tool-btn"
                    onClick={() => handleSendMessage("Guide-moi avec la technique de respiration 4-7-8 pour bloquer une envie de fumer.")}
                    disabled={sending}
                  >
                    <div className="support-tool-icon bg-info-subtle text-info">🫁</div>
                    <div>
                      <strong className="d-block small">Respiration 4-7-8</strong>
                      <span className="text-muted x-small">Calme le système nerveux en 2 min</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-primary text-start d-flex align-items-center gap-2.5 p-2.5 rounded-3 support-tool-btn"
                    onClick={() => handleSendMessage("J'ai une envie soudaine. Guide-moi avec l'ancrage sensoriel 5-4-3-2-1.")}
                    disabled={sending}
                  >
                    <div className="support-tool-icon bg-primary-subtle text-primary">🧘</div>
                    <div>
                      <strong className="d-block small">Ancrage 5-4-3-2-1</strong>
                      <span className="text-muted x-small">Dévie l'attention immédiate</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-success text-start d-flex align-items-center gap-2.5 p-2.5 rounded-3 support-tool-btn"
                    onClick={() => handleSendMessage("Explique-moi la technique du verre d'eau et pourquoi elle coupe l'envie réflexe.")}
                    disabled={sending}
                  >
                    <div className="support-tool-icon bg-success-subtle text-success">💧</div>
                    <div>
                      <strong className="d-block small">Technique du verre d'eau</strong>
                      <span className="text-muted x-small">Hydratation & rupture réflexe</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Doctor Patients & Alerts List (Doctor Mode Only) */}
            {doctorMode && (
              <>
                <div className="card support-card-glass p-3.5 rounded-4 shadow-sm mb-3">
                  <h6 className="fw-bold mb-3 d-flex align-items-center justify-content-between">
                    <span>Patients Suivis ({doctorPatients.length})</span>
                    <i className="bi bi-people-fill text-primary" />
                  </h6>
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: "240px", overflowY: "auto" }}>
                    {doctorPatients.map((p) => {
                      const isSel = selectedPatientId === p.patientProfileId;
                      return (
                        <div
                          key={p.patientProfileId}
                          className={`p-2.5 rounded-3 border d-flex align-items-center justify-content-between ${isSel ? "bg-primary-subtle border-primary" : "bg-white"}`}
                          style={{ cursor: "pointer" }}
                          onClick={async () => {
                            setSelectedPatientId(p.patientProfileId);
                            const { data } = await api.get(`/api/support/doctor/patients/${p.patientProfileId}`);
                            setConversation(data);
                          }}
                        >
                          <div>
                            <strong className="d-block small">{p.patientName}</strong>
                            <span className="x-small text-muted">{p.status || p.city}</span>
                          </div>
                          <span className={`badge ${isSel ? "bg-primary text-white" : "bg-light text-dark"} x-small`}>
                            {isSel ? "Actif" : "Voir"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="card support-card-glass p-3.5 rounded-4 shadow-sm">
                  <h6 className="fw-bold mb-3 d-flex align-items-center justify-content-between">
                    <span>Alertes Patients ({alerts.length})</span>
                    <i className="bi bi-bell-fill text-danger" />
                  </h6>

                  {alerts.length === 0 ? (
                    <p className="text-muted small mb-0">Aucune alerte active pour le moment.</p>
                  ) : (
                    <div className="d-flex flex-column gap-2.5 support-alerts-scroll">
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-3 rounded-3 border support-alert-item ${selectedPatientId === alert.patientProfileId ? "selected" : ""}`}
                          style={{ borderLeft: `4px solid ${riskColor[alert.level] || "#3b82f6"} !important` }}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <strong className="small">{alert.patientName}</strong>
                            <span className="badge bg-danger-subtle text-danger x-small">{alert.level}</span>
                          </div>
                          <p className="x-small text-muted mb-2">{alert.summary}</p>
                          <div className="d-flex gap-1.5 flex-wrap">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary py-0.5 px-2 x-small"
                              onClick={async () => {
                                setSelectedPatientId(alert.patientProfileId);
                                const { data } = await api.get(`/api/support/doctor/patients/${alert.patientProfileId}`);
                                setConversation(data);
                              }}
                            >
                              Voir chat
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-success py-0.5 px-2 x-small"
                              onClick={() => navigate(`/appointments?urgentPatient=${alert.patientProfileId}`)}
                            >
                              RDV Urgent
                            </button>
                            {alert.status === "OPEN" && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary py-0.5 px-2 x-small"
                                onClick={() => acknowledgeAlert(alert.id)}
                              >
                                Accuser
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Main Column: Modern AI Conversation Studio */}
        <div className="col-12 col-lg-8 col-xl-9">
          <div className="card support-chat-card rounded-4 shadow-sm border-0 d-flex flex-column">
            {/* Top Chat Header */}
            <div className="support-chat-header px-4 py-3.5 border-bottom d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <div className="support-chat-bot-icon">
                  <i className="bi bi-chat-heart-fill text-primary" />
                </div>
                <div>
                  <h6 className="fw-bold mb-0">
                    {doctorMode
                      ? `Transcription Patient : ${conversation?.patientName || "Sélectionnez un patient"}`
                      : "Session d'Écoute Active & Accompagnement Clinique"}
                  </h6>
                  <span className="text-muted x-small">
                    {doctorMode
                      ? "Lecture en direct des échanges patient / IA"
                      : "Soutien cognitivo-comportemental (TCC) et gestion du sevrage"}
                  </span>
                </div>
              </div>

              {sosActive && (
                <span className="badge bg-danger text-white rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 animate-pulse">
                  <i className="bi bi-exclamation-octagon-fill" /> Mode Urgence SOS Actif
                </span>
              )}
            </div>

            {/* Chat Messages Body */}
            <div className="support-chat-body p-4 d-flex flex-column gap-3.5">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status" />
                  <p className="text-muted small mt-2">Chargement des échanges cliniques...</p>
                </div>
              ) : !conversation || !conversation.messages || conversation.messages.length === 0 ? (
                <div className="text-center py-5 my-auto">
                  <div className="support-empty-chat-icon mb-3">
                    <i className="bi bi-chat-dots text-muted" />
                  </div>
                  <h6 className="fw-bold text-muted">Aucun message pour le moment</h6>
                  <p className="text-muted small max-w-400 mx-auto">
                    {doctorMode
                      ? "Ce patient n'a pas encore initié de conversation avec l'assistant."
                      : "Parlez librement de vos ressentis, de vos doutes, de vos envies ou de votre stress. L'IA est à votre écoute bienveillante."}
                  </p>
                </div>
              ) : (
                <>
                  {conversation.messages.map((item, idx) => {
                    const isPatientMsg = item.senderType === "PATIENT";
                    return (
                      <div
                        key={item.id || idx}
                        className={`support-message-wrapper d-flex gap-2.5 ${isPatientMsg ? "justify-content-end" : "justify-content-start"}`}
                      >
                        {!isPatientMsg && (
                          <div className="support-msg-avatar ai-avatar">
                            <i className="bi bi-robot" />
                          </div>
                        )}

                        <div className={`support-msg-bubble ${isPatientMsg ? "patient-bubble" : "ai-bubble"}`}>
                          <div className="support-msg-header d-flex align-items-center justify-content-between gap-3 mb-1">
                            <span className="support-msg-sender fw-bold x-small">
                              {isPatientMsg ? (user?.fullName || "Vous") : "Compagnon IA NeuralConsult"}
                            </span>
                            <span className="support-msg-time x-small opacity-75">
                              {formatDateTime(item.createdAt)}
                            </span>
                          </div>

                          <div className="support-msg-text text-break">
                            {item.content}
                          </div>

                          {isPatientMsg && (
                            <div className="text-end mt-1">
                              <i className="bi bi-check2-all text-white-50 x-small" />
                            </div>
                          )}
                        </div>

                        {isPatientMsg && (
                          <div className="support-msg-avatar patient-avatar">
                            <i className="bi bi-person-fill" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {sending && (
                    <div className="support-message-wrapper d-flex gap-2.5 justify-content-start">
                      <div className="support-msg-avatar ai-avatar">
                        <i className="bi bi-robot" />
                      </div>
                      <div className="support-msg-bubble ai-bubble typing-bubble p-3">
                        <div className="typing-dots">
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Quick Suggestions Chips */}
            <div className="support-quick-chips px-4 py-2 border-top d-flex gap-2 overflow-x-auto">
              {(doctorMode ? [
                { label: "Posologie patch 21mg", text: "Quelle est la posologie recommandée pour un sevrage sous patch 21mg avec craving résiduel ?" },
                { label: "Protocole craving aigu", text: "Proposer un protocole de déconditionnement comportemental pour un patient en pic d'anxiété." },
                { label: "Interprétation RASS", text: "Comment interpréter cliniquement une élévation du score RASS chez un patient à J+15 ?" },
                { label: "Sevrage patient BPCO", text: "Quelles sont les précautions spécifiques pour le sevrage tabagique d'un patient BPCO stade II ?" }
              ] : quickSuggestions).map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  className="btn btn-sm support-chip-btn text-nowrap rounded-pill"
                  onClick={() => handleSendMessage(sug.text)}
                  disabled={sending}
                >
                  {sug.label}
                </button>
              ))}
            </div>

            {/* Chat Input Bar (Available for both Doctor & Patient) */}
            <div className="support-chat-input-area p-3.5 border-top">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="support-input-form d-flex align-items-center gap-2"
              >
                <div className="support-textarea-container flex-grow-1 position-relative">
                  <textarea
                    ref={textareaRef}
                    className="form-control support-chat-input"
                    rows="2"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={doctorMode ? "Envoyer une consigne clinique ou interroger l'assistant IA... (Entrée pour envoyer)" : "Expliquez ce qui vous pèse : envie, stress, sommeil, substituts... (Entrée pour envoyer)"}
                    disabled={sending}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary support-send-btn rounded-circle d-flex align-items-center justify-content-center"
                  disabled={!draft.trim() || sending}
                  title="Envoyer le message"
                >
                  {sending ? (
                    <span className="spinner-border spinner-border-sm text-white" role="status" />
                  ) : (
                    <i className="bi bi-send-fill" />
                  )}
                </button>
              </form>

                <div className="d-flex justify-content-between align-items-center mt-2 px-1">
                  <span className="text-muted x-small">
                    <i className="bi bi-info-circle me-1" />
                    Appuyez sur <strong>Entrée</strong> pour envoyer, <strong>Maj + Entrée</strong> pour un saut de ligne.
                  </span>

                  {sosActive && (
                    <button
                      type="button"
                      className="btn btn-link text-muted x-small p-0 text-decoration-none"
                      onClick={() => setSosActive(false)}
                    >
                      Désactiver le mode SOS
                    </button>
                  )}
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
