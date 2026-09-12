import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import QuestionAssistantModal from "../components/QuestionAssistantModal";
import QuestionHelpOverlay from "../components/QuestionHelpOverlay";
import { CLINICAL_PHASES } from "../data/clinicalJourney";
import { getQuestionAssistantMeta } from "../data/questionAssistantCatalog";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const defaultForm = {
  appointmentLeadDays: "",
  dateOfBirth: "",
  sex: "",
  heightCm: "",
  weightKg: "",
  pregnant: false,
  pregnancyTrimester: "",
  usesBirthControlPill: false,
  consultationObjective: "",
  professionalStatus: "",
  otherSmokersAtHome: false,
  educationLevel: "",
  referralSource: "",
  riskHypertension: false,
  riskDiabetes: false,
  riskHypercholesterolemia: false,
  cardiovascularMyocardialInfarction: false,
  cardiovascularAngina: false,
  cardiovascularStroke: false,
  cardiovascularPeripheralArteryDisease: false,
  respiratoryChronicBronchitis: false,
  respiratoryCopd: false,
  respiratoryAsthma: false,
  cancerLung: false,
  cancerThroat: false,
  cancerBladder: false,
  cancerOther: false,
  cancerOtherDetails: "",
  medicationTranquilizers: false,
  medicationSleepingPills: false,
  medicationAntidepressants: false,
  medicationNeuroleptics: false,
  medicationMoodRegulators: false,
  medicationSubstitutionTreatment: false,
  depressionHistory: false,
  otherHealthIssues: "",
  city: "",
  countryCode: "",
  occupation: "",
  cigarettesPerDay: "",
  smokingStartAge: "",
  medicalHistoryNotes: "",
  reducedConsumptionLastMonth: false,
  currentlySmoking: true,
  quitDays: "",
  quitMonths: "",
  cigarettesPerDayBeforeQuit: "",
  smokesDaily: false,
  manufacturedCigarettesPerDay: "",
  rolledCigarettesPerDay: "",
  cigarillosPerDay: "",
  usesCigar: false,
  usesPipe: false,
  usesChewingTobacco: false,
  usesSnus: false,
  usesHookah: false,
  usesPloom: false,
  otherTobaccoDetails: "",
  usesECigarette: false,
  ecigWeeklyLiquid: "",
  usesNicotineCartridges: false,
  nicotineCartridgeDosage: "",
  weeklyTobaccoSpend: "",
  incomeBracket: "",
  quitAttempts: "",
  longestQuitDays: "",
  motivationStage: "",
  motivationScore: "",
  confidenceScore: "",
  smokingReasonAutomatic: "",
  smokingReasonConviviality: "",
  smokingReasonPleasure: "",
  smokingReasonStress: "",
  smokingReasonConcentration: "",
  smokingReasonSupportMoral: "",
  smokingReasonWeight: "",
  smokesAtHome: false,
  usesOtherTobacco: false,
  triggers: "",
  quitReasons: "",
  quitFears: "",
  alcoholFrequency: "",
  alcoholQuantity: "",
  alcoholBinge: "",
  cageCutDown: false,
  cageAnnoyed: false,
  cageGuilty: false,
  cageEyeOpener: false,
  cannabisLast12Months: false,
  cannabisFrequency: "NONE",
  cannabisStartAge: "",
  weightConcernScore: "",
  weightConfidenceScore: "",
  physicalActivityLevel: "NONE",
  epicesQ49: false,
  epicesQ50: false,
  epicesQ51: false,
  epicesQ52: false,
  epicesQ53: false,
  epicesQ54: false,
  epicesQ55: false,
  epicesQ56: false,
  epicesQ57: false,
  epicesQ58: false,
  epicesQ59: false,
  honcQ1: false,
  honcQ2: false,
  honcQ3: false,
  honcQ4: false,
  honcQ5: false,
  honcQ6: false,
  honcQ7: false,
  honcQ8: false,
  honcQ9: false,
  honcQ10: false,
  notes: ""
};

const Onboarding = () => {
  const { user, refetch } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [visitedSteps, setVisitedSteps] = useState([1]);
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState(null);
  const [scores, setScores] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantField, setAssistantField] = useState(null);
  const [isPhasePanelOpen, setIsPhasePanelOpen] = useState(false);
  const formRef = useRef(null);
  const timelineStageRef = useRef(null);
  const [timelineScrollProgress, setTimelineScrollProgress] = useState(0);

  useEffect(() => {
    // Fail-safe: If a non-patient user (doctor or admin) lands on this page, 
    // redirect them to the dashboard immediately.
    const isActuallyPatient = user && !user.roles?.some(r => {
      const auth = typeof r === 'string' ? r : r.authority;
      return auth === 'ROLE_DOCTOR' || auth === 'ROLE_ADMIN';
    });

    if (user && !isActuallyPatient) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/api/onboarding");
        const loadedProfile = data?.profile || user?.profile || null;
        const loadedAssessment = data?.assessment || null;

        if (loadedProfile || loadedAssessment) {
          setForm((prev) => ({
            ...prev,
            ...(loadedProfile || {}),
            ...(loadedAssessment || {})
          }));
          setScores(loadedAssessment || null);

          // Restore visited steps from existing medical dossier data
          if (loadedProfile?.onboardingComplete) {
            setVisitedSteps([1, 2, 3, 4, 5]);
          } else {
            const steps = new Set([1]);
            const comb = { ...(loadedProfile || {}), ...(loadedAssessment || {}) };
            if (comb.consultationObjective || comb.educationLevel || comb.dateOfBirth) steps.add(1);
            if (comb.riskHypertension || comb.riskDiabetes || comb.medicalHistoryNotes || comb.respiratoryCopd) steps.add(2);
            if (comb.cigarettesPerDay || comb.smokingStartAge || comb.manufacturedCigarettesPerDay || comb.usesECigarette) steps.add(3);
            if (comb.fagerstromScore != null || loadedProfile?.fagerstromScore != null) steps.add(4);
            if (comb.cageScore != null || comb.honcScore != null || comb.alcoholScore != null || comb.epicesScore != null) steps.add(5);
            setVisitedSteps(Array.from(steps).sort());
          }
        } else if (user?.profile) {
          setForm((prev) => ({ ...prev, ...user.profile }));
          if (user.profile.onboardingComplete) {
            setVisitedSteps([1, 2, 3, 4, 5]);
          }
        }
      } catch (err) {
        if (user?.profile) {
          setForm((prev) => ({ ...prev, ...user.profile }));
          if (user.profile.onboardingComplete) {
            setVisitedSteps([1, 2, 3, 4, 5]);
          }
        }
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    setVisitedSteps((previous) => (previous.includes(step) ? previous : [...previous, step]));
  }, [step]);

  useEffect(() => {
    const stage = timelineStageRef.current;
    if (!stage) {
      return undefined;
    }

    let frameId = null;

    const computeProgress = () => {
      frameId = null;
      const rect = stage.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;

      // The liquid starts flowing as soon as the hero capacitor enters comfortable view (~75% viewport)
      // and fills 100% when the last phase is scrolled into view (~25% viewport).
      const startLine = viewportHeight * 0.75;
      const endLine = viewportHeight * 0.25;
      const totalDistance = Math.max(rect.height - (endLine - startLine), 1);
      const traveled = startLine - rect.top;
      const ratio = Math.min(1, Math.max(0, traveled / totalDistance));

      setTimelineScrollProgress(Math.round(ratio * 100));
    };

    const scheduleProgress = () => {
      if (frameId !== null) {
        return;
      }
      frameId = window.requestAnimationFrame(computeProgress);
    };

    // Calculate immediately and also after brief layout settlement
    computeProgress();
    const initTimer = setTimeout(computeProgress, 120);

    // Find all scrollable ancestor containers (e.g. .clinical-content)
    const scrollContainers = [window, document];
    let el = stage.parentElement;
    while (el) {
      const overflowY = window.getComputedStyle(el).overflowY;
      if (overflowY === "auto" || overflowY === "scroll" || el.classList.contains("clinical-content")) {
        scrollContainers.push(el);
      }
      el = el.parentElement;
    }

    scrollContainers.forEach((target) => {
      target.addEventListener("scroll", scheduleProgress, { passive: true });
    });
    window.addEventListener("resize", scheduleProgress);

    return () => {
      clearTimeout(initTimer);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      scrollContainers.forEach((target) => {
        target.removeEventListener("scroll", scheduleProgress);
      });
      window.removeEventListener("resize", scheduleProgress);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const openAssistantForField = (fieldName) => {
    if (!fieldName) return;
    setAssistantField(fieldName);
    setAssistantOpen(true);
  };

  useEffect(() => {
    const injectIcons = () => {
      const container = formRef.current;
      if (!container) return;
      
      const labels = container.querySelectorAll(".form-label, .form-check-label");
      labels.forEach((label) => {
        if (label.querySelector(".question-help-inline-btn")) return;

        const parent = label.parentElement;
        const input = parent.querySelector("input[name], select[name], textarea[name]");
        if (!input) return;

        const fieldName = input.getAttribute("name");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "question-help-inline-btn";
        btn.innerHTML = '<i class="bi bi-patch-question-fill"></i>';
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          openAssistantForField(fieldName);
        };
        label.prepend(btn); // Move icon BEFORE the question text
      });
    };

    const timer = setInterval(injectIcons, 1000);
    injectIcons();
    return () => clearInterval(timer);
  }, [isPhasePanelOpen, step]);

  const openPhasePanel = (phaseId) => {
    setStep(phaseId);
    setIsPhasePanelOpen(true);
  };

  const closePhasePanel = () => {
    setAssistantOpen(false);
    setIsPhasePanelOpen(false);
  };

  const applyAssistantSuggestion = (rawValue) => {
    if (!assistantField) return;
    setForm((previous) => {
      const currentValue = previous[assistantField];
      const nextValue = typeof currentValue === "boolean" ? rawValue === "true" : rawValue;
      return {
        ...previous,
        [assistantField]: nextValue
      };
    });
    setAssistantOpen(false);
  };

  const toNumber = (value) => (value === "" || value === null ? null : Number(value));
  const toEnum = (value) => (value === "" || value === null ? null : value);

  const payload = useMemo(() => ({
    ...form,
    appointmentLeadDays: toNumber(form.appointmentLeadDays),
    heightCm: toNumber(form.heightCm),
    weightKg: toNumber(form.weightKg),
    pregnancyTrimester: toNumber(form.pregnancyTrimester),
    consultationObjective: toEnum(form.consultationObjective),
    professionalStatus: toEnum(form.professionalStatus),
    educationLevel: toEnum(form.educationLevel),
    referralSource: toEnum(form.referralSource),
    cigarettesPerDay: toNumber(form.cigarettesPerDay),
    smokingStartAge: toNumber(form.smokingStartAge),
    quitDays: toNumber(form.quitDays),
    quitMonths: toNumber(form.quitMonths),
    cigarettesPerDayBeforeQuit: toNumber(form.cigarettesPerDayBeforeQuit),
    manufacturedCigarettesPerDay: toNumber(form.manufacturedCigarettesPerDay),
    rolledCigarettesPerDay: toNumber(form.rolledCigarettesPerDay),
    cigarillosPerDay: toNumber(form.cigarillosPerDay),
    weeklyTobaccoSpend: toNumber(form.weeklyTobaccoSpend),
    incomeBracket: toEnum(form.incomeBracket),
    quitAttempts: toNumber(form.quitAttempts),
    longestQuitDays: toNumber(form.longestQuitDays),
    motivationStage: toNumber(form.motivationStage),
    motivationScore: toNumber(form.motivationScore),
    confidenceScore: toNumber(form.confidenceScore),
    smokingReasonAutomatic: toNumber(form.smokingReasonAutomatic),
    smokingReasonConviviality: toNumber(form.smokingReasonConviviality),
    smokingReasonPleasure: toNumber(form.smokingReasonPleasure),
    smokingReasonStress: toNumber(form.smokingReasonStress),
    smokingReasonConcentration: toNumber(form.smokingReasonConcentration),
    smokingReasonSupportMoral: toNumber(form.smokingReasonSupportMoral),
    smokingReasonWeight: toNumber(form.smokingReasonWeight),
    alcoholFrequency: toNumber(form.alcoholFrequency),
    alcoholQuantity: toNumber(form.alcoholQuantity),
    alcoholBinge: toNumber(form.alcoholBinge),
    cannabisFrequency: toEnum(form.cannabisFrequency),
    cannabisStartAge: toNumber(form.cannabisStartAge),
    weightConcernScore: toNumber(form.weightConcernScore),
    weightConfidenceScore: toNumber(form.weightConfidenceScore),
    physicalActivityLevel: toEnum(form.physicalActivityLevel)
  }), [form]);

  const handleValidatePhase = async (nextPhaseId) => {
    // 1. Mark current phase as visited immediately
    setVisitedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));

    // 2. Persist intermediate draft to localStorage
    try {
      localStorage.setItem("nc_onboarding_draft", JSON.stringify(form));
    } catch (e) {}

    // 3. Save to backend API in background to ensure database persistence
    try {
      const { data } = await api.post("/api/onboarding", payload);
      if (data?.assessment) {
        setScores(data.assessment);
      }
    } catch (err) {
      console.warn("Background autosave phase:", err);
    }

    // 4. Advance step & close modal
    if (nextPhaseId) {
      setStep(nextPhaseId);
    }
    closePhasePanel();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const { data } = await api.post("/api/onboarding", payload);
      setScores(data?.assessment || null);
      setVisitedSteps([1, 2, 3, 4, 5]);
      await refetch();
      setIsPhasePanelOpen(false);
      setMessage({ type: "success", text: "Évaluation clinique enregistrée avec succès. Tous vos indicateurs sont synchronisés." });
    } catch (err) {
      const apiError = err?.response?.data?.error || err?.response?.data?.message;
      setMessage({ type: "error", text: apiError ? `Erreur: ${apiError}` : "Erreur lors de l'enregistrement. Vérifiez les champs." });
    }
  };

  const selectedPhase = CLINICAL_PHASES.find((item) => item.id === step) || CLINICAL_PHASES[0];
  const assistantQuestionMeta = useMemo(() => {
    const meta = getQuestionAssistantMeta(assistantField, selectedPhase.id);
    if (!meta) {
      return null;
    }
    return {
      ...meta,
      phaseId: meta.phaseId ?? selectedPhase.id,
      phaseLabel: selectedPhase.label,
      questionContext:
        meta.questionContext ||
        "L'assistant reformule la question et peut proposer un choix officiel, mais le patient garde toujours la reponse finale."
    };
  }, [assistantField, selectedPhase]);
  const exploredCount = visitedSteps.length;
  const totalCount = CLINICAL_PHASES.length;
  const progressPercent = Math.round((exploredCount / totalCount) * 100);
  const isFullyComplete = user?.profile?.onboardingComplete && exploredCount === totalCount;
  const timelineVisualProgress = timelineScrollProgress;

  const hasRealScores = Boolean(
    scores && (
      scores.cageScore != null ||
      scores.honcScore != null ||
      scores.epicesScore != null ||
      scores.alcoholScore != null
    )
  );

  const signal12Value = Math.max(
    scores?.alcoholScore || 0,
    scores?.honcScore || 0,
    scores?.cageScore || 0
  );

  const signal12Severity = useMemo(() => {
    if (!hasRealScores && signal12Value === 0) {
      return { label: "Non évalué", badgeClass: "is-warning" };
    }
    if (signal12Value >= 3) return { label: "Attention Clinique", badgeClass: "is-danger" };
    if (signal12Value >= 1) return { label: "Vigilance Modérée", badgeClass: "is-warning" };
    return { label: "Faible Risque", badgeClass: "is-success" };
  }, [signal12Value, hasRealScores]);

  return (
    <div className="container py-4 app-shell">
      {/* Top Clinical Header */}
      <div className="evaluation-page-header" data-guide-id="evaluation-header">
        <div>
          <div className="hero-kicker">
            <i className="bi bi-shield-check me-1" /> Protocole Médical Haute Précision
          </div>
          <h2 className="fw-bold mb-1">Consultation Initiale d'Évaluation</h2>
          <div className="muted-text">
            Recueil clinique approfondi et cartographie multidimensionnelle du profil d'addiction du patient.
          </div>
        </div>
      </div>

      {/* Executive Clinical KPI Bar */}
      <div className="evaluation-kpi-bar" data-guide-id="evaluation-kpis">
        {/* Card 1: Progression */}
        <div className="evaluation-kpi-card">
          <div className="evaluation-kpi-header">
            <div className="evaluation-kpi-icon-pill">
              <i className="bi bi-speedometer2" />
            </div>
            <span className={`evaluation-kpi-badge ${isFullyComplete ? "is-success" : "is-primary"}`}>
              {isFullyComplete ? "Protocole Validé" : "En cours"}
            </span>
          </div>
          <div className="evaluation-kpi-body">
            <div className="evaluation-kpi-value">
              {isFullyComplete ? 100 : progressPercent}%
            </div>
            <div className="evaluation-kpi-label">
              {exploredCount} sur {totalCount} phases explorées
            </div>
          </div>
        </div>

        {/* Card 2: Signal 12 */}
        <div className="evaluation-kpi-card">
          <div className="evaluation-kpi-header">
            <div className="evaluation-kpi-icon-pill">
              <i className="bi bi-shield-shaded" />
            </div>
            <span className={`evaluation-kpi-badge ${signal12Severity.badgeClass}`}>
              {signal12Severity.label}
            </span>
          </div>
          <div className="evaluation-kpi-body">
            <div className="evaluation-kpi-value">
              {signal12Value} <span style={{ fontSize: "1.1rem", opacity: 0.7 }}>/ 12</span>
            </div>
            <div className="evaluation-kpi-label">
              Indice de vulnérabilité Signal 12
            </div>
          </div>
        </div>

        {/* Card 3: Screening Scores */}
        <div className="evaluation-kpi-card">
          <div className="evaluation-kpi-header">
            <div className="evaluation-kpi-icon-pill">
              <i className="bi bi-clipboard2-pulse" />
            </div>
            <span className={`evaluation-kpi-badge ${hasRealScores ? "is-success" : ""}`}>
              {hasRealScores ? "Dépistages Actifs" : "En attente"}
            </span>
          </div>
          <div className="evaluation-kpi-body">
            <div className="screening-chips-grid">
              <div className="screening-chip">
                <span className="screening-chip-name">CAGE</span>
                <span className="screening-chip-val">
                  {scores?.cageScore != null ? `${scores.cageScore}${scores.cagePositive ? " (!)" : ""}` : "—"}
                </span>
              </div>
              <div className="screening-chip">
                <span className="screening-chip-name">HONC</span>
                <span className="screening-chip-val">
                  {scores?.honcScore != null ? `${scores.honcScore}${scores.honcHighDependence ? " (H)" : ""}` : "—"}
                </span>
              </div>
              <div className="screening-chip">
                <span className="screening-chip-name">EPICES</span>
                <span className="screening-chip-val">
                  {scores?.epicesScore != null ? scores.epicesScore : "—"}
                </span>
              </div>
              <div className="screening-chip">
                <span className="screening-chip-name">Alcool</span>
                <span className="screening-chip-val">
                  {scores?.alcoholScore != null ? scores.alcoholScore : "—"}
                </span>
              </div>
            </div>
            <div className="evaluation-kpi-label mt-2">
              Scores normalisés HAS & OMS
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Strip */}
      <div className="evaluation-nav-strip">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-compass text-primary fs-5" />
          <span className="fw-semibold small">Accès direct aux modules cliniques :</span>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button 
            type="button" 
            className="evaluation-nav-btn"
            onClick={() => navigate("/dashboard")}
          >
            <i className="bi bi-grid-1x2" />
            <span>Tableau de bord</span>
          </button>
          <button 
            type="button" 
            className="evaluation-nav-btn"
            onClick={() => navigate("/tests")}
          >
            <i className="bi bi-clipboard2-pulse" />
            <span>Tests cliniques</span>
          </button>
          <button 
            type="button" 
            className="evaluation-nav-btn"
            onClick={() => navigate("/journal")}
          >
            <i className="bi bi-journal-medical" />
            <span>Journal</span>
          </button>
          <button 
            type="button" 
            className="evaluation-nav-btn"
            onClick={() => navigate("/plan")}
          >
            <i className="bi bi-diagram-3" />
            <span>Plan thérapeutique</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.type === "error" ? "alert-danger" : "alert-success"} rounded-4 mb-4 shadow-sm`}>
          {message.text}
        </div>
      )}

      {/* The Liquid Timeline Stage */}
      <div
        ref={timelineStageRef}
        className="evaluation-timeline-stage"
        data-guide-id="evaluation-timeline"
        style={{ "--timeline-progress": `${timelineVisualProgress}%` }}
      >
        {/* Stage Hero Banner & Biometric Fluid Capacitor */}
        <div className="evaluation-journey-head">
          <div className="evaluation-journey-copy">
            <div className="hero-kicker">
              <i className="bi bi-droplet-half" /> Colonne Fluidique Réactive
            </div>
            <h2 className="timeline-main-title">TIMELINE DES PHASES D'ÉVALUATION</h2>
            <div className="timeline-subtitle">
              Cliquez sur une phase pour ouvrir le questionnaire central assisté par IA.
            </div>
            <p className="timeline-desc">
              Le fluide biométrique réagit dynamiquement au défilement de votre écran pour matérialiser l'avancement clinique. Chaque palier franchi enregistre vos données en toute confidentialité.
            </p>
          </div>

          <div className="liquid-flow-capacitor" aria-label="Jauge capacitive de flux clinique">
            <div className="capacitor-tube-outer">
              <div
                className="capacitor-tube-fill"
                style={{ height: `${timelineVisualProgress}%` }}
              />
            </div>
            <div className="capacitor-ticks">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>
            <div className="capacitor-meta">
              <div className="capacitor-meta-tag">Flux fluide</div>
              <div className="capacitor-meta-val">{timelineVisualProgress}%</div>
            </div>
          </div>
        </div>

        {/* The Centered Timeline Container */}
        <div className="evaluation-timeline-centered">
          {/* Glass Conduit with Glowing Liquid Stream & Meniscus */}
          <div className="timeline-glass-conduit" aria-hidden="true">
            <div
              className="timeline-liquid-stream"
              style={{ height: `${timelineVisualProgress}%` }}
            />
          </div>

          {CLINICAL_PHASES.map((phase, index) => {
            const isActive = phase.id === step;
            const isVisited = visitedSteps.includes(phase.id);
            const phaseFill = Math.max(
              0,
              Math.min(1, (timelineVisualProgress / 100) * CLINICAL_PHASES.length - index)
            );
            const nodeFillHeight = isVisited ? 100 : Math.round(phaseFill * 100);

            return (
              <div
                key={phase.id}
                role="button"
                tabIndex={0}
                className={`evaluation-timeline-row ${isActive ? "is-active" : ""} ${isVisited ? "is-visited" : ""}`}
                onClick={() => openPhasePanel(phase.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openPhasePanel(phase.id);
                  }
                }}
                style={{ "--phase-progress": phaseFill.toFixed(2) }}
              >
                {/* Left Aside: Identity & Objective */}
                <div className="timeline-row-aside-left">
                  <div className="timeline-row-meta-strip">
                    <span className="timeline-phase-pill">{phase.label}</span>
                    <span className="timeline-row-range">
                      <i className="bi bi-ui-checks-grid" /> {phase.questionRange}
                    </span>
                  </div>
                  <h3 className="timeline-row-heading">{phase.title}</h3>
                  <p className="timeline-row-objective">
                    {phase.goals?.[0] || phase.summary}
                  </p>
                </div>

                {/* Center Column: Liquid Milestone Node */}
                <div className="timeline-row-node-wrapper">
                  <div className="timeline-phase-node">
                    <div className="node-liquid-chamber">
                      <div
                        className="node-liquid-level"
                        style={{ height: `${nodeFillHeight}%` }}
                      />
                    </div>
                    <span className="timeline-node-index">
                      {isVisited ? <i className="bi bi-check-lg" /> : phase.id}
                    </span>
                    {isActive && <span className="node-beacon-ring" />}
                  </div>
                </div>

                {/* Right Aside: Interactive Glass Card */}
                <div className="timeline-row-card">
                  <div className="timeline-card-glass">
                    <div className="timeline-card-header">
                      <span
                        className={`timeline-card-status-badge ${
                          isVisited
                            ? "is-completed"
                            : isActive
                            ? "is-current"
                            : "is-pending"
                        }`}
                      >
                        <i
                          className={
                            isVisited
                              ? "bi bi-check-circle-fill"
                              : isActive
                              ? "bi bi-play-circle-fill"
                              : "bi bi-circle"
                          }
                        />
                        <span>
                          {isVisited
                            ? "Complété"
                            : isActive
                            ? "En cours"
                            : "À réaliser"}
                        </span>
                      </span>
                    </div>

                    <p className="timeline-card-desc">{phase.summary}</p>

                    {phase.goals && phase.goals.length > 0 && (
                      <div className="timeline-card-goals">
                        {phase.goals.slice(0, 2).map((goal, gIdx) => (
                          <span key={gIdx} className="timeline-goal-pill">
                            <i className="bi bi-bullseye" /> {goal}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className={`timeline-card-action ${isVisited ? "is-visited-btn" : "is-action-btn"}`}>
                      <span>
                        {isVisited
                          ? "Consulter ou modifier"
                          : isActive
                          ? "Continuer la phase"
                          : "Commencer la phase"}
                      </span>
                      <i className="bi bi-arrow-right" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isPhasePanelOpen && (
        <div className="evaluation-phase-modal" role="presentation" onClick={closePhasePanel}>
          <div className="evaluation-phase-modal-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="card form-card p-3 evaluation-main-panel evaluation-main-panel-modal"
            >
              <div className="evaluation-main-head">
                <div>
                  <div className="evaluation-phase-kicker">{selectedPhase.label}</div>
                  <h3>{selectedPhase.title}</h3>
                  <p className="muted-text mb-0">{selectedPhase.summary}</p>
                </div>
                <button type="button" className="evaluation-phase-close" onClick={closePhasePanel} aria-label="Fermer la phase">
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              <div className="evaluation-goals-inline">
                {selectedPhase.goals.map((goal) => (
                  <div key={goal} className="evaluation-goal-chip">
                    <i className="bi bi-check2-circle" />
                    <span>{goal}</span>
                  </div>
                ))}
              </div>

              <div className="evaluation-assistant-strip">
                <div>
                  <strong>Assistant IA question par question</strong>
                  <p className="mb-0">
                    Les pastilles bleues restent attachees aux questions elles-memes. Cliquez sur une pastille pour
                    demander une explication sans toucher aux reponses.
                  </p>
                </div>
                <span className="evaluation-assistant-strip-badge">
                  <i className="bi bi-patch-question-fill" />
                  Aide visible sur chaque question
                </span>
              </div>

              <QuestionHelpOverlay
                containerRef={formRef}
                phaseId={selectedPhase.id}
                onOpenQuestionHelp={openAssistantForField}
              />

              {step === 1 && (
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label">Delai RDV (jours)</label>
                    <input className="form-control" type="number" name="appointmentLeadDays" value={form.appointmentLeadDays || ""} onChange={handleChange} />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label">Date de naissance</label>
                    <input className="form-control" type="date" name="dateOfBirth" value={form.dateOfBirth || ""} onChange={handleChange} />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label">Sexe</label>
                    <select className="form-select" name="sex" value={form.sex || ""} onChange={handleChange}>
                      <option value="">Selectionner</option>
                      <option value="FEMALE">Femme</option>
                      <option value="MALE">Homme</option>
                      <option value="OTHER">Autre</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label">Taille (cm)</label>
                    <input className="form-control" type="number" name="heightCm" value={form.heightCm || ""} onChange={handleChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Poids (kg)</label>
                    <input className="form-control" type="number" name="weightKg" value={form.weightKg || ""} onChange={handleChange} />
                  </div>
                  {form.sex === "FEMALE" && (
                    <>
                      <div className="col-12 col-md-4 form-check">
                        <input className="form-check-input" type="checkbox" name="pregnant" checked={!!form.pregnant} onChange={handleChange} />
                        <label className="form-check-label">Enceinte</label>
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label">Trimestre</label>
                        <select className="form-select" name="pregnancyTrimester" value={form.pregnancyTrimester || ""} onChange={handleChange} disabled={!form.pregnant}>
                          <option value="">Selectionner</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                        </select>
                      </div>
                      <div className="col-12 col-md-4 form-check">
                        <input className="form-check-input" type="checkbox" name="usesBirthControlPill" checked={!!form.usesBirthControlPill} onChange={handleChange} />
                        <label className="form-check-label">Pilule</label>
                      </div>
                    </>
                  )}
                  <div className="col-12">
                    <label className="form-label">Objectif de consultation</label>
                    <select className="form-select" name="consultationObjective" value={form.consultationObjective || ""} onChange={handleChange}>
                      <option value="">Selectionner</option>
                      <option value="STOP_COMPLETELY">Arreter completement</option>
                      <option value="REDUCE">Reduire la consommation</option>
                      <option value="INFO">Renseignements sevrage</option>
                      <option value="MAINTAIN_QUIT">Maintenir l'arret</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Situation professionnelle</label>
                    <select className="form-select" name="professionalStatus" value={form.professionalStatus || ""} onChange={handleChange}>
                      <option value="">Selectionner</option>
                      <option value="ACTIVE">Actif</option>
                      <option value="UNEMPLOYED_RSA">Au chomage / RSA</option>
                      <option value="STUDENT">Etudiant / formation</option>
                      <option value="RETIRED">Retraite</option>
                      <option value="HOMEMAKER">Homme ou femme au foyer</option>
                      <option value="DISABILITY">Invalidite / AAH</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Niveau d'etudes</label>
                    <select className="form-select" name="educationLevel" value={form.educationLevel || ""} onChange={handleChange}>
                      <option value="">Selectionner</option>
                      <option value="NO_DIPLOMA">Sans diplome</option>
                      <option value="SECONDARY">Niveau secondaire</option>
                      <option value="CAP_BEP">CAP / BEP</option>
                      <option value="BAC">Baccalaureat</option>
                      <option value="BAC_PLUS_2">Bac +2</option>
                      <option value="ABOVE_BAC_PLUS_2">Au-dela de Bac +2</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Qui vous a conseille ?</label>
                    <select className="form-select" name="referralSource" value={form.referralSource || ""} onChange={handleChange}>
                      <option value="">Selectionner</option>
                      <option value="HOSPITALIZATION">Hospitalisation</option>
                      <option value="ENTOURAGE">Entourage</option>
                      <option value="GP">Medecin traitant</option>
                      <option value="SPECIALIST">Medecin specialiste</option>
                      <option value="OCCUPATIONAL_DOCTOR">Medecin du travail</option>
                      <option value="PHARMACIST">Pharmacien</option>
                      <option value="TABAC_INFO_SERVICE">Tabac Info Service</option>
                      <option value="PERSONAL_DECISION">Demarche personnelle</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Ville</label>
                    <input className="form-control" type="text" name="city" value={form.city || ""} onChange={handleChange} />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Pays</label>
                    <input className="form-control" type="text" name="countryCode" value={form.countryCode || ""} onChange={handleChange} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Profession</label>
                    <input className="form-control" type="text" name="occupation" value={form.occupation || ""} onChange={handleChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Cigarettes/jour</label>
                    <input className="form-control" type="number" name="cigarettesPerDay" value={form.cigarettesPerDay || ""} onChange={handleChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Age debut tabac</label>
                    <input className="form-control" type="number" name="smokingStartAge" value={form.smokingStartAge || ""} onChange={handleChange} />
                  </div>
                  <div className="col-12 d-flex gap-3 flex-wrap">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" name="smokesAtHome" checked={!!form.smokesAtHome} onChange={handleChange} />
                      <label className="form-check-label">Fume a l'interieur du domicile</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" name="otherSmokersAtHome" checked={!!form.otherSmokersAtHome} onChange={handleChange} />
                      <label className="form-check-label">Autres fumeurs dans le foyer</label>
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="row g-3">
                  <div className="col-12">
                    <h5 className="fw-semibold">Facteurs de risque</h5>
                  </div>
                  {[
                    { key: "riskHypertension", label: "Hypertension arterielle" },
                    { key: "riskDiabetes", label: "Diabete" },
                    { key: "riskHypercholesterolemia", label: "Exces de cholesterol" }
                  ].map((item) => (
                    <div className="col-12 col-md-4" key={item.key}>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" name={item.key} checked={!!form[item.key]} onChange={handleChange} />
                        <label className="form-check-label">{item.label}</label>
                      </div>
                    </div>
                  ))}

                  <div className="col-12 mt-2">
                    <h5 className="fw-semibold">Maladies cardiovasculaires</h5>
                  </div>
                  {[
                    { key: "cardiovascularMyocardialInfarction", label: "Infarctus du myocarde" },
                    { key: "cardiovascularAngina", label: "Angine de poitrine" },
                    { key: "cardiovascularStroke", label: "Accident vasculaire cerebral" },
                    { key: "cardiovascularPeripheralArteryDisease", label: "Arteriopathie des membres inferieurs" }
                  ].map((item) => (
                    <div className="col-12 col-md-6" key={item.key}>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" name={item.key} checked={!!form[item.key]} onChange={handleChange} />
                        <label className="form-check-label">{item.label}</label>
                      </div>
                    </div>
                  ))}

                  <div className="col-12 mt-2">
                    <h5 className="fw-semibold">Maladies respiratoires</h5>
                  </div>
                  {[
                    { key: "respiratoryChronicBronchitis", label: "Bronchite chronique" },
                    { key: "respiratoryCopd", label: "BPCO" },
                    { key: "respiratoryAsthma", label: "Asthme" }
                  ].map((item) => (
                    <div className="col-12 col-md-4" key={item.key}>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" name={item.key} checked={!!form[item.key]} onChange={handleChange} />
                        <label className="form-check-label">{item.label}</label>
                      </div>
                    </div>
                  ))}

                  <div className="col-12 mt-2">
                    <h5 className="fw-semibold">Cancers</h5>
                  </div>
                  {[
                    { key: "cancerLung", label: "Poumon" },
                    { key: "cancerThroat", label: "Gorge (ORL)" },
                    { key: "cancerBladder", label: "Vessie" },
                    { key: "cancerOther", label: "Autre" }
                  ].map((item) => (
                    <div className="col-12 col-md-3" key={item.key}>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" name={item.key} checked={!!form[item.key]} onChange={handleChange} />
                        <label className="form-check-label">{item.label}</label>
                      </div>
                    </div>
                  ))}
                  {form.cancerOther && (
                    <div className="col-12">
                      <label className="form-label">Precisez l'autre cancer</label>
                      <input className="form-control" type="text" name="cancerOtherDetails" value={form.cancerOtherDetails || ""} onChange={handleChange} />
                    </div>
                  )}

                  <div className="col-12 mt-2">
                    <h5 className="fw-semibold">Traitements reguliers</h5>
                  </div>
                  {[
                    { key: "medicationTranquilizers", label: "Tranquillisants" },
                    { key: "medicationSleepingPills", label: "Somniferes" },
                    { key: "medicationAntidepressants", label: "Antidepresseurs" },
                    { key: "medicationNeuroleptics", label: "Neuroleptiques" },
                    { key: "medicationMoodRegulators", label: "Regulateurs de l'humeur" },
                    { key: "medicationSubstitutionTreatment", label: "Substitution (subutex / methadone)" }
                  ].map((item) => (
                    <div className="col-12 col-md-4" key={item.key}>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" name={item.key} checked={!!form[item.key]} onChange={handleChange} />
                        <label className="form-check-label">{item.label}</label>
                      </div>
                    </div>
                  ))}

                  <div className="col-12 col-md-6 mt-2 form-check">
                    <input className="form-check-input" type="checkbox" name="depressionHistory" checked={!!form.depressionHistory} onChange={handleChange} />
                    <label className="form-check-label">Antecedents de depression</label>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Autres problemes de sante</label>
                    <textarea className="form-control" rows="2" name="otherHealthIssues" value={form.otherHealthIssues || ""} onChange={handleChange} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Notes medicales</label>
                    <textarea className="form-control" rows="3" name="medicalHistoryNotes" value={form.medicalHistoryNotes || ""} onChange={handleChange} />
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="row g-3">
                  <div className="col-12">
                    <h5 className="fw-semibold">Situation actuelle</h5>
                  </div>
                  <div className="col-12 col-md-6 form-check">
                    <input className="form-check-input" type="checkbox" name="reducedConsumptionLastMonth" checked={!!form.reducedConsumptionLastMonth} onChange={handleChange} />
                    <label className="form-check-label">Reduction de consommation le mois precedent</label>
                  </div>
                  <div className="col-12 col-md-6 form-check">
                    <input className="form-check-input" type="checkbox" name="currentlySmoking" checked={!!form.currentlySmoking} onChange={handleChange} />
                    <label className="form-check-label">Fume actuellement</label>
                  </div>

                  {!form.currentlySmoking && (
                    <>
                      <div className="col-6">
                        <label className="form-label">Depuis combien de jours arretes</label>
                        <input className="form-control" type="number" name="quitDays" value={form.quitDays || ""} onChange={handleChange} />
                      </div>
                      <div className="col-6">
                        <label className="form-label">Depuis combien de mois arretes</label>
                        <input className="form-control" type="number" name="quitMonths" value={form.quitMonths || ""} onChange={handleChange} />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Cigarettes/jour avant l'arret</label>
                        <input className="form-control" type="number" name="cigarettesPerDayBeforeQuit" value={form.cigarettesPerDayBeforeQuit || ""} onChange={handleChange} />
                      </div>
                    </>
                  )}

                  {form.currentlySmoking && (
                    <>
                      <div className="col-12 form-check">
                        <input className="form-check-input" type="checkbox" name="smokesDaily" checked={!!form.smokesDaily} onChange={handleChange} />
                        <label className="form-check-label">Fume tous les jours</label>
                      </div>
                      <div className="col-4">
                        <label className="form-label">Cigarettes manufact.</label>
                        <input className="form-control" type="number" name="manufacturedCigarettesPerDay" value={form.manufacturedCigarettesPerDay || ""} onChange={handleChange} />
                      </div>
                      <div className="col-4">
                        <label className="form-label">Cigarettes roulees</label>
                        <input className="form-control" type="number" name="rolledCigarettesPerDay" value={form.rolledCigarettesPerDay || ""} onChange={handleChange} />
                      </div>
                      <div className="col-4">
                        <label className="form-label">Cigarillos</label>
                        <input className="form-control" type="number" name="cigarillosPerDay" value={form.cigarillosPerDay || ""} onChange={handleChange} />
                      </div>
                    </>
                  )}

                  <div className="col-12 mt-2">
                    <h5 className="fw-semibold">Autres produits</h5>
                  </div>
                  {[
                    { key: "usesCigar", label: "Cigare" },
                    { key: "usesPipe", label: "Pipe" },
                    { key: "usesChewingTobacco", label: "Tabac a macher" },
                    { key: "usesSnus", label: "Snus" },
                    { key: "usesHookah", label: "Narguile / chicha" },
                    { key: "usesPloom", label: "Ploom" }
                  ].map((item) => (
                    <div className="col-12 col-md-4" key={item.key}>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" name={item.key} checked={!!form[item.key]} onChange={handleChange} />
                        <label className="form-check-label">{item.label}</label>
                      </div>
                    </div>
                  ))}
                  <div className="col-12">
                    <label className="form-label">Autres produits, precisions</label>
                    <input className="form-control" type="text" name="otherTobaccoDetails" value={form.otherTobaccoDetails || ""} onChange={handleChange} />
                  </div>

                  <div className="col-12 mt-2">
                    <h5 className="fw-semibold">Cigarette electronique</h5>
                  </div>
                  <div className="col-12 form-check">
                    <input className="form-check-input" type="checkbox" name="usesECigarette" checked={!!form.usesECigarette} onChange={handleChange} />
                    <label className="form-check-label">Utilise une e-cigarette</label>
                  </div>
                  {form.usesECigarette && (
                    <>
                      <div className="col-6">
                        <label className="form-label">Volume liquide / semaine</label>
                        <input className="form-control" type="text" name="ecigWeeklyLiquid" value={form.ecigWeeklyLiquid || ""} onChange={handleChange} />
                      </div>
                      <div className="col-6 form-check mt-4">
                        <input className="form-check-input" type="checkbox" name="usesNicotineCartridges" checked={!!form.usesNicotineCartridges} onChange={handleChange} />
                        <label className="form-check-label">Cartouches nicotine</label>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Dosage cartouches</label>
                        <input className="form-control" type="text" name="nicotineCartridgeDosage" value={form.nicotineCartridgeDosage || ""} onChange={handleChange} />
                      </div>
                    </>
                  )}
                </div>
              )}
              {step === 4 && (
                <div className="row g-3">
                  <div className="col-12">
                    <div className="evaluation-inline-note">
                      <div>
                        <strong>Repere de dependance</strong>
                        <p className="mb-0">
                          Cette phase prepare le score de dependance. Le calcul officiel detaille de Fagerstrom
                          reste disponible dans l'espace <Link to="/tests">Tests</Link>.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <h5 className="fw-semibold">Pourquoi fumez-vous ? (0-10)</h5>
                  </div>
                  {[
                    { key: "smokingReasonAutomatic", label: "Geste automatique" },
                    { key: "smokingReasonConviviality", label: "Convivialite" },
                    { key: "smokingReasonPleasure", label: "Plaisir" },
                    { key: "smokingReasonStress", label: "Stress" },
                    { key: "smokingReasonConcentration", label: "Me concentrer" },
                    { key: "smokingReasonSupportMoral", label: "Soutien moral" },
                    { key: "smokingReasonWeight", label: "Ne pas grossir" }
                  ].map((item) => (
                    <div className="col-12 col-md-6" key={item.key}>
                      <label className="form-label">{item.label}</label>
                      <input className="form-control" type="number" min="0" max="10" name={item.key} value={form[item.key] || ""} onChange={handleChange} />
                    </div>
                  ))}

                  <div className="col-12">
                    <label className="form-label">Motivation a arreter (etape)</label>
                    <select className="form-select" name="motivationStage" value={form.motivationStage || ""} onChange={handleChange}>
                      <option value="">Selectionner</option>
                      <option value="1">Je ne veux pas arreter de fumer</option>
                      <option value="2">Je pense que je devrais, mais je ne le souhaite pas vraiment</option>
                      <option value="3">Je veux arreter, mais pas encore de plan</option>
                      <option value="4">Je veux arreter mais je ne sais pas quand</option>
                      <option value="5">Je veux arreter bientot</option>
                      <option value="6">Je veux arreter dans le trimestre a venir</option>
                      <option value="7">Je veux arreter dans le mois qui vient</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label">Motivation (0-10)</label>
                    <input className="form-control" type="number" min="0" max="10" name="motivationScore" value={form.motivationScore || ""} onChange={handleChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Confiance (0-10)</label>
                    <input className="form-control" type="number" min="0" max="10" name="confidenceScore" value={form.confidenceScore || ""} onChange={handleChange} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Pourquoi voulez-vous arreter ?</label>
                    <textarea className="form-control" rows="2" name="quitReasons" value={form.quitReasons || ""} onChange={handleChange} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Craintes en arretant</label>
                    <textarea className="form-control" rows="2" name="quitFears" value={form.quitFears || ""} onChange={handleChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Crainte prise de poids (0-10)</label>
                    <input className="form-control" type="number" min="0" max="10" name="weightConcernScore" value={form.weightConcernScore || ""} onChange={handleChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Confiance poids (0-10)</label>
                    <input className="form-control" type="number" min="0" max="10" name="weightConfidenceScore" value={form.weightConfidenceScore || ""} onChange={handleChange} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Activite physique</label>
                    <select className="form-select" name="physicalActivityLevel" value={form.physicalActivityLevel || "NONE"} onChange={handleChange}>
                      <option value="NONE">Aucune</option>
                      <option value="LESS_THAN_30_MIN">Moins de 30 min</option>
                      <option value="ONE_TO_TWO_HOURS">1 a 2 heures</option>
                      <option value="TWO_TO_FOUR_HOURS">2 a 4 heures</option>
                      <option value="MORE_THAN_FOUR_HOURS">Plus de 4 heures</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Declencheurs principaux</label>
                    <input className="form-control" type="text" name="triggers" value={form.triggers || ""} onChange={handleChange} />
                  </div>
                </div>
              )}
              {step === 5 && (
                <div className="row g-3">
                  <div className="col-12">
                    <h5 className="fw-semibold">Alcool (AUDIT-C)</h5>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label">Frequence</label>
                    <select className="form-select" name="alcoholFrequency" value={form.alcoholFrequency || ""} onChange={handleChange}>
                      <option value="">Selectionner</option>
                      <option value="0">Jamais</option>
                      <option value="1">1 fois / mois</option>
                      <option value="2">2 a 4 fois / mois</option>
                      <option value="3">2 a 3 fois / semaine</option>
                      <option value="4">4 fois ou plus / semaine</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label">Verres par jour</label>
                    <select className="form-select" name="alcoholQuantity" value={form.alcoholQuantity || ""} onChange={handleChange}>
                      <option value="">Selectionner</option>
                      <option value="0">1 ou 2</option>
                      <option value="1">3 ou 4</option>
                      <option value="2">5 ou 6</option>
                      <option value="3">7 a 9</option>
                      <option value="4">10 ou plus</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label">6 verres ou plus</label>
                    <select className="form-select" name="alcoholBinge" value={form.alcoholBinge || ""} onChange={handleChange}>
                      <option value="">Selectionner</option>
                      <option value="0">Jamais</option>
                      <option value="1">Moins d'1 fois / mois</option>
                      <option value="2">1 fois / mois</option>
                      <option value="3">1 fois / semaine</option>
                      <option value="4">Chaque jour</option>
                    </select>
                  </div>

                  <div className="col-12 mt-2">
                    <h5 className="fw-semibold">CAGE (alcool)</h5>
                  </div>
                  {[
                    { key: "cageCutDown", label: "Besoin de diminuer ?" },
                    { key: "cageAnnoyed", label: "Entourage vous a fait des remarques ?" },
                    { key: "cageGuilty", label: "Impression de boire trop ?" },
                    { key: "cageEyeOpener", label: "Besoin d'alcool le matin ?" }
                  ].map((item) => (
                    <div className="col-12" key={item.key}>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" name={item.key} checked={!!form[item.key]} onChange={handleChange} />
                        <label className="form-check-label">{item.label}</label>
                      </div>
                    </div>
                  ))}

                  <div className="col-12 mt-2">
                    <h5 className="fw-semibold">Cannabis</h5>
                  </div>
                  <div className="col-12 form-check">
                    <input className="form-check-input" type="checkbox" name="cannabisLast12Months" checked={!!form.cannabisLast12Months} onChange={handleChange} />
                    <label className="form-check-label">Consommation dans les 12 derniers mois</label>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Frequence (30 derniers jours)</label>
                    <select className="form-select" name="cannabisFrequency" value={form.cannabisFrequency || "NONE"} onChange={handleChange}>
                      <option value="NONE">Aucune</option>
                      <option value="LESS_THAN_3">1 a 2 fois</option>
                      <option value="THREE_TO_5">3 a 5 fois</option>
                      <option value="SIX_TO_9">6 a 9 fois</option>
                      <option value="TEN_TO_19">10 a 19 fois</option>
                      <option value="TWENTY_TO_29">20 a 29 fois</option>
                      <option value="DAILY">Tous les jours</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Age de debut</label>
                    <input className="form-control" type="number" name="cannabisStartAge" value={form.cannabisStartAge || ""} onChange={handleChange} />
                  </div>

                  <div className="col-12 mt-2">
                    <h5 className="fw-semibold">Budget et EPICES</h5>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Depense tabac / semaine</label>
                    <input className="form-control" type="number" name="weeklyTobaccoSpend" value={form.weeklyTobaccoSpend || ""} onChange={handleChange} />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Revenus mensuels</label>
                    <select className="form-select" name="incomeBracket" value={form.incomeBracket || ""} onChange={handleChange}>
                      <option value="">Selectionner</option>
                      <option value="BELOW_1000">Moins de 1000</option>
                      <option value="FROM_1001_TO_2000">1001 a 2000</option>
                      <option value="FROM_2001_TO_3000">2001 a 3000</option>
                      <option value="FROM_3001_TO_4000">3001 a 4000</option>
                      <option value="ABOVE_4000">Plus de 4000</option>
                    </select>
                  </div>
                  {[
                    { key: "epicesQ49", label: "Rencontrez-vous un travailleur social ?" },
                    { key: "epicesQ50", label: "Assurance maladie complementaire ?" },
                    { key: "epicesQ51", label: "Vivez-vous en couple ?" },
                    { key: "epicesQ52", label: "Proprietaire de votre logement ?" },
                    { key: "epicesQ53", label: "Difficultes financieres dans le mois ?" },
                    { key: "epicesQ54", label: "Avez-vous fait du sport dans les 12 derniers mois ?" },
                    { key: "epicesQ55", label: "Etes-vous alle au spectacle dans les 12 derniers mois ?" },
                    { key: "epicesQ56", label: "Etes-vous parti en vacances dans les 12 derniers mois ?" },
                    { key: "epicesQ57", label: "Contacts familiaux dans les 6 derniers mois ?" },
                    { key: "epicesQ58", label: "Personne pour vous heberger quelques jours ?" },
                    { key: "epicesQ59", label: "Personne pour aide materielle ?" }
                  ].map((item) => (
                    <div className="col-12 col-md-6" key={item.key}>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" name={item.key} checked={!!form[item.key]} onChange={handleChange} />
                        <label className="form-check-label">{item.label}</label>
                      </div>
                    </div>
                  ))}

                  <div className="col-12 mt-2">
                    <h5 className="fw-semibold">HONC (dependance tabac)</h5>
                  </div>
                  {[
                    { key: "honcQ1", label: "Difficile d'arreter ?" },
                    { key: "honcQ2", label: "Fume parce que dependance ?" },
                    { key: "honcQ3", label: "Envies imperieuses ?" },
                    { key: "honcQ4", label: "Besoin urgent d'une cigarette ?" },
                    { key: "honcQ5", label: "Difficile de ne pas fumer aux endroits interdits ?" },
                    { key: "honcQ6", label: "Difficile de se concentrer sans fumer ?" },
                    { key: "honcQ7", label: "Irritable si pas fumer ?" },
                    { key: "honcQ8", label: "Nerveux ou anxieux sans fumer ?" },
                    { key: "honcQ9", label: "Triste ou deprime sans fumer ?" },
                    { key: "honcQ10", label: "Besoin urgent ou panique si pas fumer ?" }
                  ].map((item) => (
                    <div className="col-12" key={item.key}>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" name={item.key} checked={!!form[item.key]} onChange={handleChange} />
                        <label className="form-check-label">{item.label}</label>
                      </div>
                    </div>
                  ))}

                  <div className="col-12">
                    <label className="form-label">Notes complementaires</label>
                    <textarea className="form-control" rows="3" name="notes" value={form.notes || ""} onChange={handleChange} />
                  </div>
                </div>
              )}

              <div className="evaluation-footer-actions">
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                  disabled={step === 1}
                >
                  Phase precedente
                </button>
                {step < CLINICAL_PHASES.length ? (
                  <button
                    type="button"
                    className="btn btn-dark"
                    onClick={() => handleValidatePhase(Math.min(CLINICAL_PHASES.length, step + 1))}
                  >
                    Valider cette phase
                  </button>
                ) : (
                  <button type="submit" className="btn btn-dark">
                    Enregistrer l'évaluation
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-4 d-flex flex-wrap justify-content-between align-items-center gap-2 p-3 rounded-4 bg-light">
        <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => navigate("/dashboard")}>
          <i className="bi bi-arrow-left me-1" />
          Aller au Tableau de bord
        </button>
        <button className="btn btn-primary rounded-pill px-4 shadow-sm" onClick={() => navigate("/tests")}>
          Passer aux tests cliniques
          <i className="bi bi-arrow-right ms-1" />
        </button>
      </div>

      <QuestionAssistantModal
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        questionMeta={assistantQuestionMeta}
        currentValue={assistantField ? form[assistantField] : null}
        patientFacts={payload}
        onApplySuggestion={applyAssistantSuggestion}
      />
    </div>
  );
};

export default Onboarding;
