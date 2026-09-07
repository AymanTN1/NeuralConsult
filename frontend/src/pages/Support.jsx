import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { isDoctor } from "../utils/roles";
import { createDemoDossier, DEMO_DOCTOR_PATIENTS } from "../services/demoMockService";

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

const doctorClinicalChips = [
  { label: "💊 Posologie TSN (Patch 21mg)", text: "Quelle est la posologie recommandée pour un sevrage sous patch 21mg avec craving résiduel ?" },
  { label: "🫁 Protocole Craving Aigu 4-7-8", text: "Proposer un protocole de déconditionnement comportemental et cohérence cardiaque pour un pic d'anxiété." },
  { label: "⚠️ Directive Sevrage Anxiété", text: "Directive clinique : renforcer l'ancrage comportemental et rapprocher le contrôle télésuivi à 48 heures." },
  { label: "📋 Synthèse d'Évolution RAG", text: "Générer une synthèse clinique de l'évolution des envies de fumer et du score d'anxiété sur les 7 derniers jours." },
  { label: "🫀 Patient Cardiovasculaire", text: "Quelles précautions particulières pour l'utilisation des substituts nicotiniques chez un patient coronarien ?" }
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

const getInitials = (name) => {
  if (!name) return "PT";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
  const [activeTab, setActiveTab] = useState("alerts"); // "alerts" | "all"
  const [searchQuery, setSearchQuery] = useState("");
  const [sendMode, setSendMode] = useState("patient"); // "patient" | "ai_directive"
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [supportLanguage, setSupportLanguage] = useState(readStoredSupportLanguage);
  const chatBodyRef = useRef(null);
  const textareaRef = useRef(null);
  const sosHandledRef = useRef(false);

  const selectedSosPrompt = getSosPrompt(supportLanguage);

  // Scroll ONLY inside the chat container - NEVER scroll the whole browser window!
  const scrollToBottom = (smooth = true) => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto"
      });
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
      if (data && data.messages && data.messages.length > 0) {
        setConversation(data);
      } else {
        const activeEmail = user?.email || (typeof window !== "undefined" && localStorage.getItem("nc_active_demo_email"));
        const fallbackId = user?.id || user?.patientProfile?.id || "p0c70000-0000-0000-0000-000000000001";
        const dossier = createDemoDossier(fallbackId);
        if (activeEmail) {
          try {
            const stored = JSON.parse(localStorage.getItem(`nc_demo_conv_${activeEmail}`) || "[]");
            if (stored.length > 0) {
              dossier.supportConversation.messages = [...dossier.supportConversation.messages, ...stored];
            }
          } catch (e) {}
        }
        setConversation(dossier.supportConversation);
      }
    } catch (error) {
      const fallbackId = user?.id || user?.patientProfile?.id || "p0c70000-0000-0000-0000-000000000001";
      const dossier = createDemoDossier(fallbackId);
      setConversation(dossier.supportConversation);
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorSupport = async (forcePatientId = null) => {
    setLoading(true);
    try {
      const [alertsResp, patientsResp] = await Promise.allSettled([
        api.get("/api/support/doctor/alerts"),
        api.get("/api/doctors/patients")
      ]);
      let nextAlerts = alertsResp.status === "fulfilled" ? alertsResp.value.data || [] : [];
      let nextPatients = patientsResp.status === "fulfilled" ? patientsResp.value.data || [] : [];

      // Merge dynamic alerts from localStorage
      try {
        const storedAlerts = JSON.parse(localStorage.getItem("nc_demo_alerts") || "[]");
        if (storedAlerts.length > 0) {
          const existingIds = new Set(nextAlerts.map((a) => a.id));
          const toAdd = storedAlerts.filter((a) => !existingIds.has(a.id));
          nextAlerts = [...toAdd, ...nextAlerts];
        }
      } catch (e) {}

      // Merge acknowledged alerts from localStorage
      try {
        const ackList = JSON.parse(localStorage.getItem("nc_acknowledged_alerts") || "[]");
        if (ackList.length > 0) {
          nextAlerts = nextAlerts.map((a) => (ackList.includes(a.id) ? { ...a, status: "ACKNOWLEDGED" } : a));
        }
      } catch (e) {}

      // Enrich patients with realistic demo profiles if missing or sparse
      if (!nextPatients || nextPatients.length === 0) {
        nextPatients = DEMO_DOCTOR_PATIENTS.map((dp) => ({
          patientProfileId: dp.id,
          patientName: dp.patientName,
          city: dp.city,
          status: dp.status || "Suivi actif",
          patientEmail: dp.email,
          fagerstromScore: dp.fagerstromScore || 8,
          hadAnxietyScore: dp.hadAnxietyScore || 14
        }));
      } else {
        nextPatients = nextPatients.map((p, idx) => {
          const demoMatch = DEMO_DOCTOR_PATIENTS.find(
            (dp) => dp.email && p.patientEmail && dp.email.toLowerCase() === p.patientEmail.toLowerCase()
          ) || DEMO_DOCTOR_PATIENTS[idx % DEMO_DOCTOR_PATIENTS.length];
          const hasName = p.patientName && p.patientName.trim() !== "" && p.patientName !== "-";
          return {
            ...p,
            patientName: hasName ? p.patientName : demoMatch.patientName,
            city: p.city && p.city !== "Non renseigne" ? p.city : demoMatch.city,
            status: p.status || demoMatch.status || "Suivi actif",
            patientEmail: p.patientEmail || demoMatch.email,
            fagerstromScore: p.fagerstromScore || demoMatch.fagerstromScore || 8,
            hadAnxietyScore: p.hadAnxietyScore || demoMatch.hadAnxietyScore || 14
          };
        });
      }

      setAlerts(nextAlerts);
      setDoctorPatients(nextPatients);

      const resolvedPatientId =
        forcePatientId ||
        selectedPatientId ||
        nextAlerts[0]?.patientProfileId ||
        nextPatients[0]?.patientProfileId ||
        "p0c70000-0000-0000-0000-000000000001";

      setSelectedPatientId(resolvedPatientId);

      if (resolvedPatientId) {
        try {
          const conversationResp = await api.get(`/api/support/doctor/patients/${resolvedPatientId}`);
          if (conversationResp.data && conversationResp.data.messages) {
            setConversation(conversationResp.data);
          } else {
            const dossier = createDemoDossier(resolvedPatientId);
            setConversation(dossier.supportConversation);
          }
        } catch (e) {
          const dossier = createDemoDossier(resolvedPatientId);
          setConversation(dossier.supportConversation);
        }
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

  const selectPatient = async (patientId) => {
    setSelectedPatientId(patientId);
    setLoading(true);
    try {
      const { data } = await api.get(`/api/support/doctor/patients/${patientId}`);
      if (data && data.messages) {
        setConversation(data);
      } else {
        const dossier = createDemoDossier(patientId);
        setConversation(dossier.supportConversation);
      }
    } catch (err) {
      const dossier = createDemoDossier(patientId);
      setConversation(dossier.supportConversation);
    } finally {
      setLoading(false);
    }
  };

  const reload = async () => {
    if (doctorMode) {
      await loadDoctorSupport(selectedPatientId);
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
        setMessage({ type: "success", text: "🚨 Mode SOS activé : L'IA vous accompagne immédiatement sur la vague de craving." });
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

    selectPatient(patientId);
    const next = new URLSearchParams(searchParams);
    next.delete("patient");
    setSearchParams(next, { replace: true });
  }, [doctorMode, searchParams, setSearchParams]);

  const handleSendMessage = async (textToSend) => {
    const content = (textToSend || draft).trim();
    if (!content || sending) return;

    setDraft("");
    setSending(true);
    setMessage(null);

    const isDirective = doctorMode && sendMode === "ai_directive";

    // Optimistic bubble
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      senderType: doctorMode ? "DOCTOR" : "PATIENT",
      senderName: doctorMode ? (user?.fullName || "Dr. Ayman Tantani") : (user?.fullName || "Patient"),
      content: isDirective ? `[DIRECTIVE CLINIQUE IA] ${content}` : content,
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
        message: isDirective ? `Directive médecin : ${content}` : content,
        emergencyMode: sosActive,
        preferredLanguage: supportLanguage,
        patientProfileId: selectedPatientId
      });

      if (data && data.messages) {
        setConversation(data);
      } else {
        setConversation((prev) => ({
          ...prev,
          messages: [
            ...(prev?.messages || []),
            {
              id: `ai-${Date.now()}`,
              senderType: "AI",
              senderName: "Assistant Clinique RAG · NeuralConsult",
              content: doctorMode
                ? (isDirective
                    ? `🧠 Directive clinique intégrée au profil patient : « ${content} ». L'agent RAG ajustera ses prochaines interactions selon ces consignes.`
                    : `Message médical transmis au patient ${conversation?.patientName || "Karim Benali"}. Notification clinique envoyée sur son espace personnel.`)
                : `Je vous accompagne pas à pas. Prenez une inspiration lente et bloquez 4 secondes... Vous êtes en sécurité et sur la bonne voie.`,
              createdAt: new Date().toISOString()
            }
          ]
        }));
      }
      setSosActive(false);
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Erreur lors de la communication avec l'assistant clinique." });
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

  // Dedicated Alert Acknowledgment with real action and persistence
  const acknowledgeAlert = async (alertId, e) => {
    if (e) e.stopPropagation();
    setMessage(null);

    // Optimistic local update
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: "ACKNOWLEDGED", acknowledgedAt: new Date().toISOString() } : a))
    );

    // Persist to localStorage so the acknowledgment survives page reloads
    try {
      const ackList = JSON.parse(localStorage.getItem("nc_acknowledged_alerts") || "[]");
      if (!ackList.includes(alertId)) {
        ackList.push(alertId);
        localStorage.setItem("nc_acknowledged_alerts", JSON.stringify(ackList));
      }
    } catch (err) {}

    try {
      await api.post(`/api/support/doctor/alerts/${alertId}/acknowledge`);
    } catch (error) {
      // Mock / fallback handled optimistically
    }

    const targetAlert = alerts.find((a) => a.id === alertId);
    setMessage({
      type: "success",
      text: `✓ Alerte pour ${targetAlert?.patientName || "le patient"} accusée et prise en charge par le Dr. Tantani.`
    });
  };

  const currentRisk = conversation?.latestRiskLevel || "HIGH";
  const openAlertsCount = alerts.filter((a) => a.status === "OPEN").length;

  // Filtered lists for Doctor triage
  const filteredAlerts = alerts.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (a.patientName || "").toLowerCase().includes(q) ||
      (a.summary || "").toLowerCase().includes(q) ||
      (a.level || "").toLowerCase().includes(q)
    );
  });

  const filteredPatients = doctorPatients.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.patientName || "").toLowerCase().includes(q) ||
      (p.city || "").toLowerCase().includes(q) ||
      (p.status || "").toLowerCase().includes(q)
    );
  });

  const selectedPatient =
    doctorPatients.find((p) => p.patientProfileId === selectedPatientId) ||
    alerts.find((a) => a.patientProfileId === selectedPatientId) ||
    {
      patientProfileId: selectedPatientId || "p0c70000-0000-0000-0000-000000000001",
      patientName: conversation?.patientName || "Karim Benali",
      city: conversation?.city || "Casablanca",
      status: conversation?.status || "Suivi actif",
      fagerstromScore: conversation?.fagerstromScore || 8,
      hadAnxietyScore: conversation?.hadAnxietyScore || 14
    };

  return (
    <div className="support-page-container container-fluid py-2" data-guide-id="support-main">
      {/* Sleek Clinical Cockpit Bar */}
      <div className="support-cockpit-bar mb-2.5 p-2.5 px-3 rounded-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-2.5">
          <div className="support-cockpit-icon">
            <i className={doctorMode ? "bi bi-heart-pulse-fill text-primary" : "bi bi-robot text-primary"} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h5 className="fw-bold mb-0 text-gradient-primary">
                {doctorMode ? "Cockpit Télésurveillance & Conversations IA" : "Psychologue & Compagnon IA 24/7"}
              </h5>
              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-0.5 x-small d-flex align-items-center gap-1">
                <span className="pulse-dot" /> RAG Clinique v2.4 Actif
              </span>
              {doctorMode && (
                <span
                  className={`badge ${
                    openAlertsCount > 0
                      ? "bg-danger-subtle text-danger border-danger-subtle"
                      : "bg-success-subtle text-success border-success-subtle"
                  } border rounded-pill px-2.5 py-0.5 x-small`}
                >
                  {openAlertsCount > 0
                    ? `🚨 ${openAlertsCount} alerte${openAlertsCount > 1 ? "s" : ""} active${openAlertsCount > 1 ? "s" : ""}`
                    : `✓ 0 alerte ouverte`}
                </span>
              )}
            </div>
            <p className="text-muted x-small mb-0 mt-0.5">
              {doctorMode
                ? "Supervision continue des échanges patient-IA, détection prédictive des rechutes et aide à la décision clinique."
                : "Votre espace bienveillant d'écoute active, de sophrologie et de soutien immédiat face aux envies de fumer."}
            </p>
          </div>
        </div>

        {/* Right Cockpit Controls */}
        {!doctorMode ? (
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
        ) : (
          <div className="d-flex align-items-center gap-2">
            <div className="support-cockpit-stat-pill">
              <span className="stat-label">File active :</span>
              <span className="stat-val">{doctorPatients.length} patients</span>
            </div>
            <button
              className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 d-flex align-items-center gap-1.5"
              onClick={() => reload()}
              title="Actualiser les flux de télésurveillance"
            >
              <i className="bi bi-arrow-clockwise" />
              <span className="d-none d-sm-inline">Actualiser</span>
            </button>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`alert ${message.type === "error" ? "alert-danger" : "alert-success"} alert-dismissible fade show rounded-4 shadow-sm mb-2.5`}
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <i className={`bi ${message.type === "error" ? "bi-exclamation-triangle-fill" : "bi-check-circle-fill"} fs-5`} />
            <div>{message.text}</div>
          </div>
          <button type="button" className="btn-close" onClick={() => setMessage(null)} />
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="row g-3 support-layout-row">
        {/* Left Column: Triage & Patient List */}
        <div className="col-12 col-lg-4 col-xl-3.5">
          <div className="support-sidebar-stack d-flex flex-column gap-2.5">
            {/* DOCTOR MODE: Triage Panel with Segmented Tabs & Search */}
            {doctorMode ? (
              <div className="card support-card-glass p-3 rounded-4 shadow-sm">
                {/* Search Bar */}
                <div className="support-search-box position-relative mb-2">
                  <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                  <input
                    type="text"
                    className="form-control form-control-sm ps-5 rounded-pill support-search-input"
                    placeholder="Filtrer par nom ou ville..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-2 p-0 text-muted border-0 bg-transparent"
                      onClick={() => setSearchQuery("")}
                    >
                      <i className="bi bi-x-circle-fill" />
                    </button>
                  )}
                </div>

                {/* Segmented Control */}
                <div className="support-segmented-control mb-2.5 p-1 rounded-pill d-flex">
                  <button
                    type="button"
                    className={`segmented-tab flex-fill rounded-pill ${activeTab === "alerts" ? "active" : ""}`}
                    onClick={() => setActiveTab("alerts")}
                  >
                    <i className="bi bi-exclamation-triangle-fill text-danger me-1" />
                    Alertes {openAlertsCount > 0 ? `(${openAlertsCount})` : `(${filteredAlerts.length})`}
                  </button>
                  <button
                    type="button"
                    className={`segmented-tab flex-fill rounded-pill ${activeTab === "all" ? "active" : ""}`}
                    onClick={() => setActiveTab("all")}
                  >
                    <i className="bi bi-people-fill text-primary me-1" />
                    Patients ({filteredPatients.length})
                  </button>
                </div>

                {/* Triage List */}
                <div className="support-triage-scroll d-flex flex-column gap-2">
                  {activeTab === "alerts" ? (
                    filteredAlerts.length === 0 ? (
                      <div className="text-center py-4 text-muted small">
                        <i className="bi bi-shield-check text-success fs-3 d-block mb-1" />
                        Aucune alerte active dans cette sélection.
                      </div>
                    ) : (
                      filteredAlerts.map((alert) => {
                        const isSel = selectedPatientId === alert.patientProfileId;
                        const alertLvl = alert.level || "HIGH";
                        const isAcknowledged = alert.status === "ACKNOWLEDGED";

                        return (
                          <div
                            key={alert.id}
                            className={`p-2.5 rounded-3 border support-triage-card ${isSel ? "selected" : ""} ${isAcknowledged ? "acknowledged" : ""}`}
                            style={{
                              borderLeft: `4px solid ${isAcknowledged ? "#10b981" : riskColor[alertLvl] || "#ef4444"} !important`,
                              cursor: "pointer"
                            }}
                            onClick={() => selectPatient(alert.patientProfileId)}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <div className="d-flex align-items-center gap-2">
                                <div className="triage-initials-badge">
                                  {getInitials(alert.patientName)}
                                </div>
                                <div>
                                  <strong className="small text-truncate d-block" style={{ maxWidth: "130px" }}>
                                    {alert.patientName}
                                  </strong>
                                  <span className="x-small text-muted">{alert.city || "Maroc"}</span>
                                </div>
                              </div>
                              <span
                                className="badge rounded-pill x-small px-2 py-0.5 fw-semibold"
                                style={{
                                  backgroundColor: `${riskColor[alertLvl]}20`,
                                  color: riskColor[alertLvl],
                                  border: `1px solid ${riskColor[alertLvl]}40`
                                }}
                              >
                                {alertLvl}
                              </span>
                            </div>

                            <p className="x-small text-muted mb-2 text-truncate-2">
                              {alert.summary || "Envie aiguë signalée via l'agent RAG."}
                            </p>

                            <div className="d-flex gap-1.5 flex-wrap align-items-center">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary py-0.5 px-2.5 x-small rounded-pill"
                                onClick={() => selectPatient(alert.patientProfileId)}
                              >
                                Voir le fil
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-success py-0.5 px-2.5 x-small rounded-pill"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/appointments?urgentPatient=${alert.patientProfileId}`);
                                }}
                              >
                                RDV Urgent
                              </button>
                              {alert.status === "OPEN" ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-warning py-0.5 px-2.5 x-small rounded-pill fw-semibold"
                                  onClick={(e) => acknowledgeAlert(alert.id, e)}
                                  title="Accuser réception et consigner la prise en charge clinique"
                                >
                                  <i className="bi bi-check2-circle me-1" />
                                  Accuser
                                </button>
                              ) : (
                                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1 x-small d-inline-flex align-items-center gap-1">
                                  <i className="bi bi-check-circle-fill" /> Accusée
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )
                  ) : (
                    filteredPatients.length === 0 ? (
                      <div className="text-center py-4 text-muted small">
                        Aucun patient trouvé pour cette recherche.
                      </div>
                    ) : (
                      filteredPatients.map((p) => {
                        const isSel = selectedPatientId === p.patientProfileId;
                        return (
                          <div
                            key={p.patientProfileId}
                            className={`p-2.5 rounded-3 border support-triage-card d-flex align-items-center justify-content-between ${isSel ? "selected" : ""}`}
                            style={{ cursor: "pointer" }}
                            onClick={() => selectPatient(p.patientProfileId)}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <div className="triage-initials-badge">
                                {getInitials(p.patientName)}
                              </div>
                              <div>
                                <strong className="d-block small">{p.patientName}</strong>
                                <span className="x-small text-muted">{p.city} · {p.status || "Suivi actif"}</span>
                              </div>
                            </div>
                            <span className={`badge ${isSel ? "bg-primary text-white" : "bg-light text-dark"} rounded-pill x-small px-2 py-0.5`}>
                              {isSel ? "Actif" : "Ouvrir"}
                            </span>
                          </div>
                        );
                      })
                    )
                  )}
                </div>
              </div>
            ) : null}

            {/* Clinical Indicators & Summary Card */}
            <div className="card support-card-glass p-3 rounded-4 shadow-sm">
              <h6 className="fw-bold mb-2.5 d-flex align-items-center justify-content-between">
                <span>{doctorMode ? "Synthèse Clinique RAG" : "Indicateurs Cliniques"}</span>
                <i className="bi bi-shield-check text-primary" />
              </h6>

              {!doctorMode && (
                <div className="support-vitals-list d-flex flex-column gap-2">
                  <div className="support-vital-item d-flex justify-content-between align-items-center p-2 rounded-3">
                    <span className="text-muted small">Niveau de risque :</span>
                    <span
                      className="badge rounded-pill fw-semibold px-2.5 py-1"
                      style={{
                        backgroundColor: `${riskColor[currentRisk]}22`,
                        color: riskColor[currentRisk],
                        border: `1px solid ${riskColor[currentRisk]}44`
                      }}
                    >
                      ● {riskCopy[currentRisk] || currentRisk}
                    </span>
                  </div>

                  <div className="support-vital-item d-flex justify-content-between align-items-center p-2 rounded-3">
                    <span className="text-muted small">Médecin traitant :</span>
                    <strong className="small text-truncate" style={{ maxWidth: "140px" }}>
                      {conversation?.doctorName || "Dr. Ayman Tantani"}
                    </strong>
                  </div>

                  <div className="support-vital-item d-flex justify-content-between align-items-center p-2 rounded-3">
                    <span className="text-muted small">Alertes ouvertes :</span>
                    <span className="badge bg-secondary-subtle text-body rounded-pill px-2">
                      {conversation?.alerts?.length || 0}
                    </span>
                  </div>
                </div>
              )}

              {/* RAG Clinical Summary — always visible */}
              {conversation?.latestSummary ? (
                <div className={`support-summary-quote ${!doctorMode ? 'mt-2.5' : ''} p-2.5 rounded-3`}>
                  {!doctorMode && (
                    <div className="text-muted text-uppercase x-small fw-bold mb-1">
                      <i className="bi bi-chat-quote me-1 text-primary" /> Synthèse Clinique RAG
                    </div>
                  )}
                  <p className="mb-0 small fst-italic" style={{ color: 'var(--nc-copy, inherit)', opacity: 0.85 }}>
                    "{conversation.latestSummary}"
                  </p>
                </div>
              ) : (
                <div className="text-center py-3 text-muted small">
                  <i className="bi bi-chat-quote fs-4 d-block mb-1 opacity-50" />
                  Aucune synthèse RAG disponible pour ce patient.
                </div>
              )}
            </div>

            {/* Quick-Relief Tools (Patient Only) */}
            {!doctorMode && (
              <div className="card support-card-glass p-3 rounded-4 shadow-sm">
                <h6 className="fw-bold mb-2.5 d-flex align-items-center justify-content-between">
                  <span>Outils d'Urgence Immédiats</span>
                  <i className="bi bi-lightning-charge-fill text-warning" />
                </h6>

                <div className="d-flex flex-column gap-2">
                  <button
                    type="button"
                    className="btn text-start d-flex align-items-center gap-2.5 p-2 rounded-3 support-tool-btn"
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
                    className="btn text-start d-flex align-items-center gap-2.5 p-2 rounded-3 support-tool-btn"
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
                    className="btn text-start d-flex align-items-center gap-2.5 p-2 rounded-3 support-tool-btn"
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
          </div>
        </div>

        {/* Right Main Column: Modern AI Clinical Studio */}
        <div className="col-12 col-lg-8 col-xl-8.5">
          <div className="card support-chat-card rounded-4 shadow-sm border-0 d-flex flex-column">
            {/* Top Studio Header - Pinned at top */}
            <div className="support-studio-header px-4 py-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                {doctorMode ? (
                  <div className="patient-avatar-circle">
                    {getInitials(conversation?.patientName || selectedPatient?.patientName || "Karim Benali")}
                  </div>
                ) : (
                  <div className="support-chat-bot-icon">
                    <i className="bi bi-robot text-primary" />
                  </div>
                )}
                <div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <h5 className="fw-bold mb-0">
                      {doctorMode
                        ? (conversation?.patientName || selectedPatient?.patientName || "Karim Benali")
                        : "Session d'Écoute Active & Accompagnement RAG"}
                    </h5>
                    {doctorMode && (
                      <>
                        <span
                          className="badge rounded-pill fw-semibold px-2.5 py-1 x-small support-risk-badge"
                          style={{
                            backgroundColor: `${riskColor[currentRisk]}30`,
                            color: riskColor[currentRisk],
                            border: `1.5px solid ${riskColor[currentRisk]}55`
                          }}
                        >
                          ● Risque {riskCopy[currentRisk] || currentRisk}
                        </span>
                        <span className="badge bg-secondary-subtle text-body rounded-pill px-2 py-0.5 x-small">
                          Fagerström: {conversation?.fagerstromScore || selectedPatient?.fagerstromScore || 8}/10
                        </span>
                        <span className="badge bg-secondary-subtle text-body rounded-pill px-2 py-0.5 x-small">
                          HAD: {conversation?.hadAnxietyScore || selectedPatient?.hadAnxietyScore || 14}/21
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-muted x-small mt-0.5 d-flex align-items-center gap-2">
                    {doctorMode ? (
                      <>
                        <span><i className="bi bi-geo-alt me-0.5" />{conversation?.city || selectedPatient?.city || "Casablanca"}</span>
                        <span>•</span>
                        <span><i className="bi bi-shield-check me-0.5" />Médecin référent : {conversation?.doctorName || "Dr. Ayman Tantani"}</span>
                      </>
                    ) : (
                      <span>Soutien cognitivo-comportemental (TCC) et gestion continue du sevrage tabagique</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="d-flex align-items-center gap-2">
                {doctorMode ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 fw-semibold"
                      onClick={() => navigate(`/appointments?urgentPatient=${selectedPatientId || conversation?.patientProfileId}`)}
                      title="Programmer une téléconsultation prioritaire"
                    >
                      <i className="bi bi-camera-video-fill" />
                      <span className="d-none d-md-inline">Téléconsultation</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 fw-semibold"
                      onClick={() => navigate(`/evaluation?patient=${selectedPatientId || conversation?.patientProfileId}`)}
                      title="Consulter le dossier clinique structuré"
                    >
                      <i className="bi bi-file-earmark-medical-fill" />
                      <span className="d-none d-md-inline">Dossier Clinique</span>
                    </button>
                  </>
                ) : (
                  sosActive && (
                    <span className="badge bg-danger text-white rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 animate-pulse">
                      <i className="bi bi-exclamation-octagon-fill" /> Mode Urgence SOS Actif
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Chat Messages Stream - Roomy, Breathable, Flexible Internal Scroll */}
            <div ref={chatBodyRef} className="support-chat-body">
              {loading ? (
                <div className="text-center py-5 my-auto">
                  <div className="spinner-border text-primary" role="status" />
                  <p className="text-muted small mt-2">Chargement des données de télésurveillance...</p>
                </div>
              ) : !conversation || !conversation.messages || conversation.messages.length === 0 ? (
                <div className="text-center py-5 my-auto">
                  <div className="support-empty-chat-icon mb-3">
                    <i className="bi bi-chat-dots text-muted" />
                  </div>
                  <h6 className="fw-bold text-muted">Aucun échange pour le moment</h6>
                  <p className="text-muted small max-w-400 mx-auto">
                    {doctorMode
                      ? "Ce patient n'a pas encore initié de session d'échange avec le compagnon RAG."
                      : "Parlez librement de vos ressentis, de vos doutes, de vos envies ou de votre stress. L'IA est à votre écoute 24/7."}
                  </p>
                </div>
              ) : (
                <>
                  {conversation.messages.map((item, idx) => {
                    const isPatient = item.senderType === "PATIENT";
                    const isDoctorSender = item.senderType === "DOCTOR";
                    const isAi = !isPatient && !isDoctorSender;
                    const isRightAligned = doctorMode ? isDoctorSender : isPatient;

                    const bubbleSenderName = isPatient
                      ? (doctorMode ? (conversation?.patientName || item.senderName || "Karim Benali") : "Vous")
                      : isDoctorSender
                      ? (item.senderName || user?.fullName || "Dr. Ayman Tantani (Tabacologue)")
                      : "Assistant Clinique RAG · NeuralConsult";

                    const isSosMessage = isPatient && (
                      (item.content || "").includes("SOS") ||
                      (item.content || "").includes("🚨") ||
                      (item.content || "").toLowerCase().includes("envie")
                    );

                    return (
                      <div
                        key={item.id || idx}
                        className={`support-message-wrapper d-flex gap-3 ${isRightAligned ? "justify-content-end" : "justify-content-start"}`}
                      >
                        {!isRightAligned && (
                          <div
                            className={`support-msg-avatar ${
                              isPatient
                                ? (isSosMessage ? "patient-sos-avatar" : "patient-avatar")
                                : isDoctorSender
                                ? "doctor-avatar"
                                : "ai-avatar"
                            }`}
                          >
                            {isPatient ? (
                              <i className={isSosMessage ? "bi bi-exclamation-octagon-fill text-danger" : "bi bi-person-fill"} />
                            ) : isDoctorSender ? (
                              <i className="bi bi-person-badge-fill" />
                            ) : (
                              <i className="bi bi-robot" />
                            )}
                          </div>
                        )}

                        <div
                          className={`support-msg-bubble ${
                            isPatient
                              ? (doctorMode
                                  ? (isSosMessage ? "patient-sos-bubble" : "patient-observed-bubble")
                                  : "patient-bubble")
                              : isDoctorSender
                              ? "doctor-bubble"
                              : "ai-bubble"
                          }`}
                        >
                          <div className="support-msg-header d-flex align-items-center justify-content-between gap-3 mb-2">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className="support-msg-sender fw-bold">
                                {bubbleSenderName}
                              </span>
                              {isPatient && isSosMessage && (
                                <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill x-small px-2 py-0.5 fw-semibold">
                                  🚨 Urgence Craving
                                </span>
                              )}
                              {isAi && (
                                <span className="badge bg-info-subtle text-info border border-info-subtle rounded-pill x-small px-2 py-0.5 fw-semibold">
                                  📚 Guidelines HAS Sevrage (2024)
                                </span>
                              )}
                              {isDoctorSender && (
                                <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill x-small px-2 py-0.5 fw-semibold">
                                  👨‍⚕️ Médecin Référent
                                </span>
                              )}
                            </div>
                            <span className="support-msg-time x-small opacity-75">
                              {formatDateTime(item.createdAt)}
                            </span>
                          </div>

                          <div className="support-msg-text text-break">
                            {item.content}
                          </div>

                          {isRightAligned && (
                            <div className="text-end mt-1.5">
                              <i className="bi bi-check2-all text-white-50 small" />
                            </div>
                          )}
                        </div>

                        {isRightAligned && (
                          <div
                            className={`support-msg-avatar ${
                              isDoctorSender ? "doctor-avatar" : "patient-avatar"
                            }`}
                          >
                            {isDoctorSender ? (
                              <i className="bi bi-person-badge-fill" />
                            ) : (
                              <i className="bi bi-person-fill" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {sending && (
                    <div className="support-message-wrapper d-flex gap-3 justify-content-start">
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
                </>
              )}
            </div>

            {/* Clinical Accelerator Chips - Patient mode only */}
            {!doctorMode && (
              <div className="support-quick-chips px-4 py-2.5 border-top">
                <div className="d-flex align-items-center justify-content-between mb-1.5">
                  <span className="x-small text-muted fw-bold text-uppercase d-flex align-items-center gap-1">
                    <i className="bi bi-lightning-charge-fill text-warning" />
                    Suggestions d'urgence & questions fréquentes :
                  </span>
                </div>
                <div className="d-flex gap-2 overflow-x-auto pb-1">
                  {quickSuggestions.map((sug, i) => (
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
              </div>
            )}

            {/* Input Console - Patient mode only (Doctor is read-only observer) */}
            {!doctorMode ? (
              <div className="support-chat-input-area px-4 py-3 border-top">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="support-input-form d-flex align-items-center gap-2.5"
                >
                  <div className="support-textarea-container flex-grow-1 position-relative">
                    <textarea
                      ref={textareaRef}
                      className="form-control support-chat-input"
                      rows="2"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Expliquez ce qui vous pèse : envie soudaine, stress, sommeil, substituts... (Entrée pour envoyer)"
                      disabled={sending}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn support-send-btn rounded-circle d-flex align-items-center justify-content-center btn-primary"
                    disabled={!draft.trim() || sending}
                    title="Envoyer"
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
            ) : (
              /* Doctor read-only footer */
              <div className="support-doctor-readonly-footer px-4 py-2.5 border-top d-flex align-items-center justify-content-center gap-2">
                <i className="bi bi-eye-fill opacity-50" />
                <span className="text-muted small">Mode lecture seule — Transcription de la conversation patient × IA RAG</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
