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
    const nextVal = type === "checkbox" ? checked : value;

    setForm((prev) => {
      const updated = { ...prev, [name]: nextVal };

      // Medical & Clinical branching reset logic:
      // 1. Gender / Pregnancy / Contraception branching
      if (name === "sex" && value !== "FEMALE") {
        updated.pregnant = false;
        updated.pregnancyTrimester = null;
        updated.usesBirthControlPill = false;
      }
      if (name === "pregnant" && !checked) {
        updated.pregnancyTrimester = null;
      }

      // 2. Alcohol AUDIT-C & CAGE branching: if Jamais (0), reset alcohol quantity, binge, and CAGE
      if (name === "alcoholFrequency" && (value === "0" || value === 0)) {
        updated.alcoholQuantity = 0;
        updated.alcoholBinge = 0;
        updated.cageCutDown = false;
        updated.cageAnnoyed = false;
        updated.cageGuilty = false;
        updated.cageEyeOpener = false;
      }

      // 3. Cannabis branching
      if (name === "cannabisLast12Months" && !checked) {
        updated.cannabisFrequency = "NONE";
        updated.cannabisStartAge = null;
      }

      // 4. E-cigarette (vaping) branching
      if (name === "usesECigarette" && !checked) {
        updated.ecigWeeklyLiquid = "";
        updated.usesNicotineCartridges = false;
        updated.nicotineCartridgeDosage = "";
      }
      if (name === "usesNicotineCartridges" && !checked) {
        updated.nicotineCartridgeDosage = "";
      }

      // 5. Cancer details branching
      if (name === "cancerOther" && !checked) {
        updated.cancerOtherDetails = "";
      }

      // 6. Current smoking vs cessation history branching
      if (name === "currentlySmoking") {
        if (checked) {
          updated.quitDays = null;
          updated.quitMonths = null;
          updated.cigarettesPerDayBeforeQuit = null;
        } else {
          updated.smokesDaily = false;
          updated.manufacturedCigarettesPerDay = null;
          updated.rolledCigarettesPerDay = null;
          updated.cigarillosPerDay = null;
        }
      }

      return updated;
    });
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

  const toNumber = (value) => (value === "" || value === null || value === undefined ? null : Number(value));
  const toEnum = (value) => (value === "" || value === null || value === undefined ? null : value);

  const payload = useMemo(() => {
    const isFemale = form.sex === "FEMALE";
    const isPregnant = isFemale && !!form.pregnant;
    const consumesAlcohol = form.alcoholFrequency && form.alcoholFrequency !== "0" && form.alcoholFrequency !== 0;
    const hasCannabis = !!form.cannabisLast12Months;
    const isSmoker = !!form.currentlySmoking;
    const usesVape = !!form.usesECigarette;

    return {
      ...form,
      appointmentLeadDays: toNumber(form.appointmentLeadDays),
      heightCm: toNumber(form.heightCm),
      weightKg: toNumber(form.weightKg),
      pregnant: isPregnant,
      pregnancyTrimester: isPregnant ? toNumber(form.pregnancyTrimester) : null,
      usesBirthControlPill: isFemale ? !!form.usesBirthControlPill : false,
      consultationObjective: toEnum(form.consultationObjective),
      professionalStatus: toEnum(form.professionalStatus),
      educationLevel: toEnum(form.educationLevel),
      referralSource: toEnum(form.referralSource),
      cigarettesPerDay: toNumber(form.cigarettesPerDay),
      smokingStartAge: toNumber(form.smokingStartAge),
      quitDays: !isSmoker ? toNumber(form.quitDays) : null,
      quitMonths: !isSmoker ? toNumber(form.quitMonths) : null,
      cigarettesPerDayBeforeQuit: !isSmoker ? toNumber(form.cigarettesPerDayBeforeQuit) : null,
      smokesDaily: isSmoker ? !!form.smokesDaily : false,
      manufacturedCigarettesPerDay: isSmoker ? toNumber(form.manufacturedCigarettesPerDay) : null,
      rolledCigarettesPerDay: isSmoker ? toNumber(form.rolledCigarettesPerDay) : null,
      cigarillosPerDay: isSmoker ? toNumber(form.cigarillosPerDay) : null,
      usesECigarette: usesVape,
      ecigWeeklyLiquid: usesVape ? (form.ecigWeeklyLiquid || "") : "",
      usesNicotineCartridges: usesVape ? !!form.usesNicotineCartridges : false,
      nicotineCartridgeDosage: usesVape && form.usesNicotineCartridges ? (form.nicotineCartridgeDosage || "") : "",
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
      alcoholQuantity: consumesAlcohol ? toNumber(form.alcoholQuantity) : 0,
      alcoholBinge: consumesAlcohol ? toNumber(form.alcoholBinge) : 0,
      cageCutDown: consumesAlcohol ? !!form.cageCutDown : false,
      cageAnnoyed: consumesAlcohol ? !!form.cageAnnoyed : false,
      cageGuilty: consumesAlcohol ? !!form.cageGuilty : false,
      cageEyeOpener: consumesAlcohol ? !!form.cageEyeOpener : false,
      cannabisLast12Months: hasCannabis,
      cannabisFrequency: hasCannabis ? toEnum(form.cannabisFrequency) : "NONE",
      cannabisStartAge: hasCannabis ? toNumber(form.cannabisStartAge) : null,
      cancerOtherDetails: form.cancerOther ? (form.cancerOtherDetails || "") : "",
      weightConcernScore: toNumber(form.weightConcernScore),
      weightConfidenceScore: toNumber(form.weightConfidenceScore),
      physicalActivityLevel: toEnum(form.physicalActivityLevel)
    };
  }, [form]);

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
                    <label className="form-label">Délai avant rendez-vous (en jours)</label>
                    <input className="form-control" type="number" name="appointmentLeadDays" value={form.appointmentLeadDays || ""} onChange={handleChange} placeholder="ex: 7" />
                    <span className="clinical-help-hint">Nombre de jours estimé avant votre prochaine consultation</span>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label">Date de naissance</label>
                    <input className="form-control" type="date" name="dateOfBirth" value={form.dateOfBirth || ""} onChange={handleChange} />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label">Sexe biologique</label>
                    <select className="form-select" name="sex" value={form.sex || ""} onChange={handleChange}>
                      <option value="">Sélectionner</option>
                      <option value="FEMALE">Femme</option>
                      <option value="MALE">Homme</option>
                      <option value="OTHER">Autre</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label">Taille (en cm)</label>
                    <input className="form-control" type="number" name="heightCm" value={form.heightCm || ""} onChange={handleChange} placeholder="ex: 175" />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Poids (en kg)</label>
                    <input className="form-control" type="number" name="weightKg" value={form.weightKg || ""} onChange={handleChange} placeholder="ex: 70" />
                  </div>

                  {/* Santé gynécologique & obstétricale : réservé aux femmes */}
                  {form.sex === "FEMALE" && (
                    <div className="col-12">
                      <div className="clinical-conditional-card">
                        <div className="clinical-subgroup-title">
                          <i className="bi bi-gender-female"></i> Santé gynécologique et obstétricale
                        </div>
                        <div className="row g-3">
                          <div className="col-12 col-md-6 form-check">
                            <input className="form-check-input" type="checkbox" id="field-pregnant" name="pregnant" checked={!!form.pregnant} onChange={handleChange} />
                            <label className="form-check-label" htmlFor="field-pregnant">Êtes-vous actuellement enceinte ?</label>
                          </div>
                          <div className="col-12 col-md-6 form-check">
                            <input className="form-check-input" type="checkbox" id="field-birthcontrol" name="usesBirthControlPill" checked={!!form.usesBirthControlPill} onChange={handleChange} />
                            <label className="form-check-label" htmlFor="field-birthcontrol">Prenez-vous une contraception hormonale (pilule, implant...) ?</label>
                          </div>
                          {form.pregnant && (
                            <div className="col-12 col-md-6">
                              <label className="form-label">À quel trimestre de grossesse êtes-vous ?</label>
                              <select className="form-select" name="pregnancyTrimester" value={form.pregnancyTrimester || ""} onChange={handleChange}>
                                <option value="">Sélectionner le trimestre</option>
                                <option value="1">1er trimestre (Semaines 1 à 13)</option>
                                <option value="2">2ème trimestre (Semaines 14 à 27)</option>
                                <option value="3">3ème trimestre (Semaines 28 et plus)</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="col-12">
                    <label className="form-label">Objectif principal de la démarche</label>
                    <select className="form-select" name="consultationObjective" value={form.consultationObjective || ""} onChange={handleChange}>
                      <option value="">Sélectionner votre objectif</option>
                      <option value="STOP_COMPLETELY">Arrêter complètement le tabac</option>
                      <option value="REDUCE">Réduire progressivement ma consommation</option>
                      <option value="INFO">Obtenir des renseignements et conseils</option>
                      <option value="MAINTAIN_QUIT">Maintenir mon arrêt et consolider le sevrage</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Situation socio-professionnelle</label>
                    <select className="form-select" name="professionalStatus" value={form.professionalStatus || ""} onChange={handleChange}>
                      <option value="">Sélectionner votre situation</option>
                      <option value="ACTIVE">En activité professionnelle</option>
                      <option value="UNEMPLOYED_RSA">Demandeur d'emploi / RSA</option>
                      <option value="STUDENT">Étudiant(e) / en formation</option>
                      <option value="RETIRED">Retraité(e)</option>
                      <option value="HOMEMAKER">Au foyer</option>
                      <option value="DISABILITY">Invalidité / AAH</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Niveau d'études</label>
                    <select className="form-select" name="educationLevel" value={form.educationLevel || ""} onChange={handleChange}>
                      <option value="">Sélectionner votre niveau</option>
                      <option value="NO_DIPLOMA">Sans diplôme</option>
                      <option value="SECONDARY">Enseignement secondaire (collège / lycée)</option>
                      <option value="CAP_BEP">CAP / BEP / Brevet</option>
                      <option value="BAC">Baccalauréat</option>
                      <option value="BAC_PLUS_2">Bac +2 (BTS, DUT...)</option>
                      <option value="ABOVE_BAC_PLUS_2">Enseignement supérieur (> Bac +2)</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Qui vous a conseillé ou orienté vers cette consultation ?</label>
                    <select className="form-select" name="referralSource" value={form.referralSource || ""} onChange={handleChange}>
                      <option value="">Sélectionner l'origine de la démarche</option>
                      <option value="PERSONAL_DECISION">Démarche et initiative personnelle</option>
                      <option value="GP">Médecin traitant</option>
                      <option value="SPECIALIST">Médecin spécialiste (cardiologue, pneumologue...)</option>
                      <option value="OCCUPATIONAL_DOCTOR">Médecin du travail</option>
                      <option value="PHARMACIST">Pharmacien</option>
                      <option value="HOSPITALIZATION">Suite à une hospitalisation</option>
                      <option value="ENTOURAGE">Famille ou entourage</option>
                      <option value="TABAC_INFO_SERVICE">Tabac Info Service</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Ville de résidence</label>
                    <input className="form-control" type="text" name="city" value={form.city || ""} onChange={handleChange} placeholder="ex: Paris, Lyon..." />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Pays</label>
                    <input className="form-control" type="text" name="countryCode" value={form.countryCode || ""} onChange={handleChange} placeholder="ex: France" />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Profession ou activité principale</label>
                    <input className="form-control" type="text" name="occupation" value={form.occupation || ""} onChange={handleChange} placeholder="ex: Ingénieur, Enseignant, Artisan..." />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Consommation habituelle (cigarettes/jour)</label>
                    <input className="form-control" type="number" name="cigarettesPerDay" value={form.cigarettesPerDay || ""} onChange={handleChange} placeholder="ex: 15" />
                    <span className="clinical-help-hint">Nombre moyen habituel par jour</span>
                  </div>
                  <div className="col-6">
                    <label className="form-label">Âge de début du tabagisme</label>
                    <input className="form-control" type="number" name="smokingStartAge" value={form.smokingStartAge || ""} onChange={handleChange} placeholder="ex: 18" />
                    <span className="clinical-help-hint">Âge où vous avez commencé à fumer quotidiennement</span>
                  </div>
                  <div className="col-12 d-flex gap-3 flex-wrap mt-2">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="field-smokesAtHome" name="smokesAtHome" checked={!!form.smokesAtHome} onChange={handleChange} />
                      <label className="form-check-label" htmlFor="field-smokesAtHome">Fumez-vous à l'intérieur de votre domicile ?</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="field-otherSmokersAtHome" name="otherSmokersAtHome" checked={!!form.otherSmokersAtHome} onChange={handleChange} />
                      <label className="form-check-label" htmlFor="field-otherSmokersAtHome">Y a-t-il d'autres fumeurs dans votre foyer ?</label>
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="row g-3">
                  <div className="col-12">
                    <h5 className="fw-semibold clinical-section-subhead">
                      <i className="bi bi-heart-pulse text-danger"></i> Facteurs de risque métabolique & cardiovasculaire
                    </h5>
                  </div>
                  {[
                    { key: "riskHypertension", label: "Hypertension artérielle (HTA)" },
                    { key: "riskDiabetes", label: "Diabète (type 1 ou type 2)" },
                    { key: "riskHypercholesterolemia", label: "Excès de cholestérol (Hypercholestérolémie)" }
                  ].map((item) => (
                    <div className="col-12 col-md-4" key={item.key}>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id={`field-${item.key}`} name={item.key} checked={!!form[item.key]} onChange={handleChange} />
                        <label className="form-check-label" htmlFor={`field-${item.key}`}>{item.label}</label>
                      </div>
                    </div>
                  ))}

                  <div className="col-12 mt-3">
                    <h5 className="fw-semibold clinical-section-subhead">
                      <i className="bi bi-activity text-primary"></i> Pathologies cardiovasculaires
                    </h5>
                  </div>
                  {[
                    { key: "cardiovascularMyocardialInfarction", label: "Infarctus du myocarde (Crise cardiaque)" },
                    { key: "cardiovascularAngina", label: "Angine de poitrine (Angor)" },
                    { key: "cardiovascularStroke", label: "Accident vasculaire cérébral (AVC ou AIT)" },
                    { key: "cardiovascularPeripheralArteryDisease", label: "Artériopathie oblitérante des membres inférieurs (AOMI)" }
                  ].map((item) => (
                    <div className="col-12 col-md-6" key={item.key}>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id={`field-${item.key}`} name={item.key} checked={!!form[item.key]} onChange={handleChange} />
                        <label className="form-check-label" htmlFor={`field-${item.key}`}>{item.label}</label>
                      </div>
                    </div>
                  ))}

                  <div className="col-12 mt-3">
                    <h5 className="fw-semibold clinical-section-subhead">
                      <i className="bi bi-lungs text-info"></i> Maladies respiratoires
                    </h5>
                  </div>
                  {[
                    { key: "respiratoryChronicBronchitis", label: "Bronchite chronique" },
                    { key: "respiratoryCopd", label: "BPCO (Broncho-Pneumopathie Chronique Obstructive)" },
                    { key: "respiratoryAsthma", label: "Asthme" }
                  ].map((item) => (
                    <div className="col-12 col-md-4" key={item.key}>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id={`field-${item.key}`} name={item.key} checked={!!form[item.key]} onChange={handleChange} />
                        <label className="form-check-label" htmlFor={`field-${item.key}`}>{item.label}</label>
                      </div>
                    </div>
                  ))}

                  <div className="col-12 mt-3">
                    <h5 className="fw-semibold clinical-section-subhead">
                      <i className="bi bi-bandaid text-warning"></i> Antécédents de cancers
                    </h5>
                  </div>
                  {[
                    { key: "cancerLung", label: "Cancer du poumon" },
                    { key: "cancerThroat", label: "Cancer de la gorge ou ORL" },
                    { key: "cancerBladder", label: "Cancer de la vessie" },
                    { key: "cancerOther", label: "Autre type de cancer" }
                  ].map((item) => (
                    <div className="col-12 col-md-3" key={item.key}>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id={`field-${item.key}`} name={item.key} checked={!!form[item.key]} onChange={handleChange} />
                        <label className="form-check-label" htmlFor={`field-${item.key}`}>{item.label}</label>
                      </div>
                    </div>
                  ))}
                  {form.cancerOther && (
                    <div className="col-12">
                      <div className="clinical-conditional-card">
                        <label className="form-label fw-semibold text-primary">Précisez la localisation de l'autre cancer :</label>
                        <input className="form-control" type="text" name="cancerOtherDetails" value={form.cancerOtherDetails || ""} onChange={handleChange} placeholder="ex: Côlon, sein, rein..." />
                      </div>
                    </div>
                  )}

                  <div className="col-12 mt-3">
                    <h5 className="fw-semibold clinical-section-subhead">
                      <i className="bi bi-capsule text-success"></i> Traitements réguliers & Psychotropes
                    </h5>
                  </div>
                  {[
                    { key: "medicationTranquilizers", label: "Tranquillisants / Anxiolytiques (ex: Lexomil, Xanax...)" },
                    { key: "medicationSleepingPills", label: "Somnifères / Hypnotiques" },
                    { key: "medicationAntidepressants", label: "Antidépresseurs" },
                    { key: "medicationNeuroleptics", label: "Neuroleptiques / Antipsychotiques" },
                    { key: "medicationMoodRegulators", label: "Régulateurs de l'humeur (Thymorégulateurs)" },
                    { key: "medicationSubstitutionTreatment", label: "Substitution aux opiacés (Subutex, Méthadone)" }
                  ].map((item) => (
                    <div className="col-12 col-md-4" key={item.key}>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id={`field-${item.key}`} name={item.key} checked={!!form[item.key]} onChange={handleChange} />
                        <label className="form-check-label" htmlFor={`field-${item.key}`}>{item.label}</label>
                      </div>
                    </div>
                  ))}

                  <div className="col-12 col-md-6 mt-3 form-check">
                    <input className="form-check-input" type="checkbox" id="field-depressionHistory" name="depressionHistory" checked={!!form.depressionHistory} onChange={handleChange} />
                    <label className="form-check-label fw-semibold" htmlFor="field-depressionHistory">Antécédents d'épisode dépressif ou de suivi psychologique</label>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Autres pathologies ou problèmes de santé :</label>
                    <textarea className="form-control" rows="2" name="otherHealthIssues" value={form.otherHealthIssues || ""} onChange={handleChange} placeholder="Allergies, interventions chirurgicales récentes, problèmes rénaux ou hépatiques..." />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Notes médicales ou précisions complémentaires :</label>
                    <textarea className="form-control" rows="2" name="medicalHistoryNotes" value={form.medicalHistoryNotes || ""} onChange={handleChange} placeholder="Toute information utile pour votre prise en charge..." />
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="row g-3">
                  <div className="col-12">
                    <h5 className="fw-semibold clinical-section-subhead">
                      <i className="bi bi-clock-history text-primary"></i> Situation tabagique actuelle
                    </h5>
                  </div>
                  <div className="col-12 col-md-6 form-check">
                    <input className="form-check-input" type="checkbox" id="field-reducedConsumptionLastMonth" name="reducedConsumptionLastMonth" checked={!!form.reducedConsumptionLastMonth} onChange={handleChange} />
                    <label className="form-check-label" htmlFor="field-reducedConsumptionLastMonth">Avez-vous réduit votre consommation le mois précédent ?</label>
                  </div>
                  <div className="col-12 col-md-6 form-check">
                    <input className="form-check-input" type="checkbox" id="field-currentlySmoking" name="currentlySmoking" checked={!!form.currentlySmoking} onChange={handleChange} />
                    <label className="form-check-label fw-semibold" htmlFor="field-currentlySmoking">Fumez-vous encore actuellement du tabac ?</label>
                  </div>

                  {/* If patient is NOT currently smoking: ask cessation history */}
                  {!form.currentlySmoking && (
                    <div className="col-12">
                      <div className="clinical-conditional-card">
                        <div className="clinical-subgroup-title text-success">
                          <i className="bi bi-check-circle-fill"></i> Sevrage en cours : Durée de l'arrêt
                        </div>
                        <div className="row g-3">
                          <div className="col-12 col-md-6">
                            <label className="form-label">Depuis combien de jours avez-vous arrêté de fumer ?</label>
                            <input className="form-control" type="number" name="quitDays" value={form.quitDays || ""} onChange={handleChange} placeholder="ex: 14" />
                          </div>
                          <div className="col-12 col-md-6">
                            <label className="form-label">Ou depuis combien de mois (si arrêt supérieur à 30 jours) ?</label>
                            <input className="form-control" type="number" name="quitMonths" value={form.quitMonths || ""} onChange={handleChange} placeholder="ex: 2" />
                          </div>
                          <div className="col-12">
                            <label className="form-label">Combien de cigarettes fumiez-vous par jour avant votre arrêt ?</label>
                            <input className="form-control" type="number" name="cigarettesPerDayBeforeQuit" value={form.cigarettesPerDayBeforeQuit || ""} onChange={handleChange} placeholder="ex: 20" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* If patient IS currently smoking: ask daily breakdown */}
                  {form.currentlySmoking && (
                    <div className="col-12">
                      <div className="clinical-conditional-card">
                        <div className="clinical-subgroup-title text-danger">
                          <i className="bi bi-fire"></i> Consommation active quotidienne
                        </div>
                        <div className="row g-3">
                          <div className="col-12 form-check">
                            <input className="form-check-input" type="checkbox" id="field-smokesDaily" name="smokesDaily" checked={!!form.smokesDaily} onChange={handleChange} />
                            <label className="form-check-label fw-semibold" htmlFor="field-smokesDaily">Fumez-vous quotidiennement (tous les jours sans exception) ?</label>
                          </div>
                          <div className="col-12 col-md-4">
                            <label className="form-label">Cigarettes classiques (par jour)</label>
                            <input className="form-control" type="number" name="manufacturedCigarettesPerDay" value={form.manufacturedCigarettesPerDay || ""} onChange={handleChange} placeholder="ex: 10" />
                          </div>
                          <div className="col-12 col-md-4">
                            <label className="form-label">Cigarettes roulées (par jour)</label>
                            <input className="form-control" type="number" name="rolledCigarettesPerDay" value={form.rolledCigarettesPerDay || ""} onChange={handleChange} placeholder="ex: 5" />
                          </div>
                          <div className="col-12 col-md-4">
                            <label className="form-label">Cigarillos ou petits cigares (par jour)</label>
                            <input className="form-control" type="number" name="cigarillosPerDay" value={form.cigarillosPerDay || ""} onChange={handleChange} placeholder="ex: 0" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="col-12 mt-3">
                    <h5 className="fw-semibold clinical-section-subhead">
                      <i className="bi bi-box-seam text-secondary"></i> Autres produits du tabac
                    </h5>
                  </div>
                  {[
                    { key: "usesCigar", label: "Cigare" },
                    { key: "usesPipe", label: "Pipe" },
                    { key: "usesChewingTobacco", label: "Tabac à mâcher / chique" },
                    { key: "usesSnus", label: "Snus ou sachets nicotiniques" },
                    { key: "usesHookah", label: "Narguilé / Chicha" },
                    { key: "usesPloom", label: "Tabac chauffé (Ploom, IQOS...)" }
                  ].map((item) => (
                    <div className="col-12 col-md-4" key={item.key}>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id={`field-${item.key}`} name={item.key} checked={!!form[item.key]} onChange={handleChange} />
                        <label className="form-check-label" htmlFor={`field-${item.key}`}>{item.label}</label>
                      </div>
                    </div>
                  ))}
                  <div className="col-12">
                    <label className="form-label">Précisions sur d'autres produits du tabac :</label>
                    <input className="form-control" type="text" name="otherTobaccoDetails" value={form.otherTobaccoDetails || ""} onChange={handleChange} placeholder="ex: Fréquence d'usage de chicha ou cigares..." />
                  </div>

                  <div className="col-12 mt-3">
                    <h5 className="fw-semibold clinical-section-subhead">
                      <i className="bi bi-plug text-primary"></i> Cigarette électronique (Vapotage)
                    </h5>
                  </div>
                  <div className="col-12 form-check">
                    <input className="form-check-input" type="checkbox" id="field-usesECigarette" name="usesECigarette" checked={!!form.usesECigarette} onChange={handleChange} />
                    <label className="form-check-label fw-semibold" htmlFor="field-usesECigarette">Utilisez-vous une cigarette électronique (vape) ?</label>
                  </div>
                  {form.usesECigarette && (
                    <div className="col-12">
                      <div className="clinical-conditional-card">
                        <div className="clinical-subgroup-title">
                          <i className="bi bi-droplet-half"></i> Précisions sur votre vapotage
                        </div>
                        <div className="row g-3">
                          <div className="col-12 col-md-6">
                            <label className="form-label">Volume de e-liquide consommé par semaine (en ml ou flacons)</label>
                            <input className="form-control" type="text" name="ecigWeeklyLiquid" value={form.ecigWeeklyLiquid || ""} onChange={handleChange} placeholder="ex: 10 ml ou 1 flacon" />
                          </div>
                          <div className="col-12 col-md-6 form-check d-flex align-items-center mt-md-4">
                            <input className="form-check-input me-2" type="checkbox" id="field-usesNicotineCartridges" name="usesNicotineCartridges" checked={!!form.usesNicotineCartridges} onChange={handleChange} />
                            <label className="form-check-label" htmlFor="field-usesNicotineCartridges">Votre e-liquide contient-il de la nicotine ?</label>
                          </div>
                          {form.usesNicotineCartridges && (
                            <div className="col-12">
                              <label className="form-label">Dosage en nicotine du liquide (en mg/ml)</label>
                              <input className="form-control" type="text" name="nicotineCartridgeDosage" value={form.nicotineCartridgeDosage || ""} onChange={handleChange} placeholder="ex: 3 mg/ml, 6 mg/ml, 12 mg/ml, 20 mg/ml" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {step === 4 && (
                <div className="row g-3">
                  <div className="col-12">
                    <div className="evaluation-inline-note">
                      <div>
                        <strong>Repère clinique de motivation et de dépendance</strong>
                        <p className="mb-0">
                          Cette phase évalue les composantes comportementales, le stade de préparation au changement et les freins psychologiques. Le test complet de Fagerström reste également consultable dans l'espace <Link to="/tests">Tests</Link>.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <h5 className="fw-semibold clinical-section-subhead">
                      <i className="bi bi-question-circle text-primary"></i> Pourquoi fumez-vous ?
                    </h5>
                    <p className="small text-muted mb-2">Évaluez chaque facteur déclencheur de 0 (jamais / pas du tout) à 10 (systématiquement / absolument) :</p>
                  </div>
                  {[
                    { key: "smokingReasonAutomatic", label: "Geste automatique ou habitude réflexe" },
                    { key: "smokingReasonConviviality", label: "Moment de convivialité ou partage social" },
                    { key: "smokingReasonPleasure", label: "Recherche de plaisir ou moment de détente" },
                    { key: "smokingReasonStress", label: "Gestion du stress, anxiété ou émotions vives" },
                    { key: "smokingReasonConcentration", label: "Besoin de stimulation ou de concentration" },
                    { key: "smokingReasonSupportMoral", label: "Soutien moral face à la solitude ou coup de blues" },
                    { key: "smokingReasonWeight", label: "Régulation de l'appétit ou peur de grossir" }
                  ].map((item) => (
                    <div className="col-12 col-md-6" key={item.key}>
                      <label className="form-label">{item.label} (0-10)</label>
                      <input className="form-control" type="number" min="0" max="10" name={item.key} value={form[item.key] || ""} onChange={handleChange} placeholder="0 à 10" />
                    </div>
                  ))}

                  <div className="col-12 mt-3">
                    <h5 className="fw-semibold clinical-section-subhead">
                      <i className="bi bi-compass text-success"></i> Stade de motivation au changement
                    </h5>
                  </div>
                  <div className="col-12">
                    <label className="form-label">À quelle étape de votre démarche d'arrêt vous situez-vous aujourd'hui ?</label>
                    <select className="form-select" name="motivationStage" value={form.motivationStage || ""} onChange={handleChange}>
                      <option value="">Sélectionner votre stade actuel</option>
                      <option value="1">1 - Je n'envisage pas d'arrêter de fumer pour le moment</option>
                      <option value="2">2 - Je pense que je devrais arrêter, mais je n'en ai pas vraiment le désir</option>
                      <option value="3">3 - Je souhaite arrêter, mais je n'ai pas encore de plan d'action précis</option>
                      <option value="4">4 - J'ai l'intention ferme d'arrêter, mais sans date fixée</option>
                      <option value="5">5 - Je prépare activement mon arrêt pour les semaines à venir</option>
                      <option value="6">6 - Je prévois d'arrêter au cours des 3 prochains mois</option>
                      <option value="7">7 - Je veux impérativement arrêter dans le mois qui vient</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Niveau global de motivation pour arrêter (0 à 10)</label>
                    <input className="form-control" type="number" min="0" max="10" name="motivationScore" value={form.motivationScore || ""} onChange={handleChange} placeholder="0 = nulle, 10 = maximale" />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Confiance en votre capacité de réussir (0 à 10)</label>
                    <input className="form-control" type="number" min="0" max="10" name="confidenceScore" value={form.confidenceScore || ""} onChange={handleChange} placeholder="0 = aucune, 10 = absolue" />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Quelles sont vos motivations majeures pour arrêter ?</label>
                    <textarea className="form-control" rows="2" name="quitReasons" value={form.quitReasons || ""} onChange={handleChange} placeholder="Santé, famille, enfants, économies financières, souffle, odeur..." />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Quelles sont vos craintes ou inquiétudes face à l'arrêt ?</label>
                    <textarea className="form-control" rows="2" name="quitFears" value={form.quitFears || ""} onChange={handleChange} placeholder="Sensations de manque, irritabilité, perturbation du sommeil, stress, échec..." />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Crainte d'une prise de poids consécutive à l'arrêt (0 à 10)</label>
                    <input className="form-control" type="number" min="0" max="10" name="weightConcernScore" value={form.weightConcernScore || ""} onChange={handleChange} placeholder="0 = pas inquiet, 10 = très inquiet" />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Confiance dans votre capacité à gérer votre alimentation (0 à 10)</label>
                    <input className="form-control" type="number" min="0" max="10" name="weightConfidenceScore" value={form.weightConfidenceScore || ""} onChange={handleChange} placeholder="0 = faible, 10 = très confiante" />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Niveau d'activité physique ou sportive hebdomadaire :</label>
                    <select className="form-select" name="physicalActivityLevel" value={form.physicalActivityLevel || "NONE"} onChange={handleChange}>
                      <option value="NONE">Aucune activité sportive régulière</option>
                      <option value="LESS_THAN_30_MIN">Moins de 30 minutes par semaine</option>
                      <option value="ONE_TO_TWO_HOURS">1 à 2 heures par semaine</option>
                      <option value="TWO_TO_FOUR_HOURS">2 à 4 heures par semaine</option>
                      <option value="MORE_THAN_FOUR_HOURS">Plus de 4 heures par semaine</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Principales situations déclenchantes d'envies irrépressibles :</label>
                    <input className="form-control" type="text" name="triggers" value={form.triggers || ""} onChange={handleChange} placeholder="ex: Café du matin, téléphone, fin de repas, apéritif, bouchons en voiture..." />
                  </div>
                </div>
              )}
              {step === 5 && (() => {
                const consumesAlcohol = form.alcoholFrequency && form.alcoholFrequency !== "0" && form.alcoholFrequency !== 0;
                return (
                  <div className="row g-3">
                    <div className="col-12">
                      <h5 className="fw-semibold clinical-section-subhead">
                        <i className="bi bi-cup-straw text-primary"></i> Consommation d'alcool (AUDIT-C)
                      </h5>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">À quelle fréquence consommez-vous des boissons alcoolisées ?</label>
                      <select className="form-select" name="alcoholFrequency" value={form.alcoholFrequency != null ? form.alcoholFrequency : ""} onChange={handleChange}>
                        <option value="">Sélectionner votre fréquence</option>
                        <option value="0">Jamais (Non-consommateur d'alcool)</option>
                        <option value="1">1 fois par mois ou moins</option>
                        <option value="2">2 à 4 fois par mois</option>
                        <option value="3">2 à 3 fois par semaine</option>
                        <option value="4">4 fois ou plus par semaine (Quotidien ou quasi-quotidien)</option>
                      </select>
                      <span className="clinical-help-hint">Bières, vins, spiritueux, apéritifs...</span>
                    </div>

                    {/* Non-consommateur : reassurance banner, pas de questions inutiles */}
                    {(form.alcoholFrequency === "0" || form.alcoholFrequency === 0) && (
                      <div className="col-12">
                        <div className="clinical-banner-positive">
                          <i className="bi bi-shield-check fs-5"></i>
                          <span>
                            Non-consommateur d'alcool : le questionnaire détaillé de dosage (AUDIT-C) et le test de dépendance (CAGE) sont désactivés pour votre profil.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Consommateur d'alcool : affichage des questions de dosage AUDIT-C et du CAGE */}
                    {consumesAlcohol && (
                      <div className="col-12">
                        <div className="clinical-conditional-card">
                          <div className="clinical-subgroup-title">
                            <i className="bi bi-pie-chart-fill"></i> Détails de consommation d'alcool (AUDIT-C)
                          </div>
                          <div className="row g-3">
                            <div className="col-12 col-md-6">
                              <label className="form-label">Combien de verres consommez-vous un jour typique d'alcoolisation ?</label>
                              <select className="form-select" name="alcoholQuantity" value={form.alcoholQuantity != null ? form.alcoholQuantity : ""} onChange={handleChange}>
                                <option value="">Sélectionner le nombre de verres</option>
                                <option value="0">1 ou 2 verres standard</option>
                                <option value="1">3 ou 4 verres standard</option>
                                <option value="2">5 ou 6 verres standard</option>
                                <option value="3">7 à 9 verres standard</option>
                                <option value="4">10 verres standard ou plus</option>
                              </select>
                              <span className="clinical-help-hint">1 verre standard = 1 ballon de vin (10cl), 1 demi de bière (25cl) ou 1 dose de spiritueux (3cl)</span>
                            </div>
                            <div className="col-12 col-md-6">
                              <label className="form-label">À quelle fréquence buvez-vous 6 verres d'alcool ou plus en une seule occasion ?</label>
                              <select className="form-select" name="alcoholBinge" value={form.alcoholBinge != null ? form.alcoholBinge : ""} onChange={handleChange}>
                                <option value="">Sélectionner la fréquence</option>
                                <option value="0">Jamais</option>
                                <option value="1">Moins d'une fois par mois</option>
                                <option value="2">Une fois par mois</option>
                                <option value="3">Une fois par semaine</option>
                                <option value="4">Tous les jours ou presque</option>
                              </select>
                              <span className="clinical-help-hint">Évaluation des épisodes de consommation ponctuelle importante</span>
                            </div>

                            <div className="col-12 mt-3">
                              <div className="clinical-subgroup-title text-danger">
                                <i className="bi bi-clipboard-pulse"></i> Questionnaire CAGE / DETA (Rapport à l'alcool)
                              </div>
                              <p className="small text-muted mb-2">Cochez les questions qui correspondent à votre ressenti :</p>
                            </div>
                            {[
                              { key: "cageCutDown", label: "Avez-vous déjà ressenti le besoin de diminuer votre consommation d'alcool ?" },
                              { key: "cageAnnoyed", label: "Votre entourage vous a-t-il déjà fait des remarques ou reproches sur votre consommation ?" },
                              { key: "cageGuilty", label: "Avez-vous déjà eu l'impression de boire trop ou éprouvé un sentiment de culpabilité ?" },
                              { key: "cageEyeOpener", label: "Avez-vous déjà eu besoin d'un verre d'alcool dès le matin pour vous sentir en forme ?" }
                            ].map((item) => (
                              <div className="col-12" key={item.key}>
                                <div className="form-check">
                                  <input className="form-check-input" type="checkbox" id={`field-${item.key}`} name={item.key} checked={!!form[item.key]} onChange={handleChange} />
                                  <label className="form-check-label" htmlFor={`field-${item.key}`}>{item.label}</label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="col-12 mt-3">
                      <h5 className="fw-semibold clinical-section-subhead">
                        <i className="bi bi-flower1 text-success"></i> Consommation de Cannabis
                      </h5>
                    </div>
                    <div className="col-12 form-check">
                      <input className="form-check-input" type="checkbox" id="field-cannabisLast12Months" name="cannabisLast12Months" checked={!!form.cannabisLast12Months} onChange={handleChange} />
                      <label className="form-check-label fw-semibold" htmlFor="field-cannabisLast12Months">Avez-vous consommé du cannabis (herbe, résine...) au cours des 12 derniers mois ?</label>
                    </div>

                    {form.cannabisLast12Months && (
                      <div className="col-12">
                        <div className="clinical-conditional-card">
                          <div className="clinical-subgroup-title">
                            <i className="bi bi-sliders"></i> Précisions sur la consommation de cannabis
                          </div>
                          <div className="row g-3">
                            <div className="col-12 col-md-6">
                              <label className="form-label">Fréquence d'usage au cours des 30 derniers jours :</label>
                              <select className="form-select" name="cannabisFrequency" value={form.cannabisFrequency || "NONE"} onChange={handleChange}>
                                <option value="NONE">Aucune consommation ce mois-ci</option>
                                <option value="LESS_THAN_3">1 à 2 fois dans le mois</option>
                                <option value="THREE_TO_5">3 à 5 fois dans le mois</option>
                                <option value="SIX_TO_9">6 à 9 fois dans le mois</option>
                                <option value="TEN_TO_19">10 à 19 fois (environ 1 jour sur 2)</option>
                                <option value="TWENTY_TO_29">20 à 29 fois (presque quotidien)</option>
                                <option value="DAILY">Tous les jours (usage quotidien)</option>
                              </select>
                            </div>
                            <div className="col-12 col-md-6">
                              <label className="form-label">Âge auquel vous avez commencé à consommer :</label>
                              <input className="form-control" type="number" name="cannabisStartAge" value={form.cannabisStartAge || ""} onChange={handleChange} placeholder="ex: 17" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="col-12 mt-3">
                      <h5 className="fw-semibold clinical-section-subhead">
                        <i className="bi bi-wallet2 text-primary"></i> Budget & Situation socio-économique (Score EPICES)
                      </h5>
                      <p className="small text-muted mb-0">Ces indicateurs permettent d'adapter le soutien médico-social et l'accès aux substituts remboursés.</p>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Budget hebdomadaire consacré au tabac (en euros / semaine) :</label>
                      <input className="form-control" type="number" name="weeklyTobaccoSpend" value={form.weeklyTobaccoSpend || ""} onChange={handleChange} placeholder="ex: 70" />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Tranche de revenus mensuels nets de votre foyer :</label>
                      <select className="form-select" name="incomeBracket" value={form.incomeBracket || ""} onChange={handleChange}>
                        <option value="">Sélectionner votre tranche de revenus</option>
                        <option value="BELOW_1000">Moins de 1 000 € / mois</option>
                        <option value="FROM_1001_TO_2000">De 1 001 € à 2 000 € / mois</option>
                        <option value="FROM_2001_TO_3000">De 2 001 € à 3 000 € / mois</option>
                        <option value="FROM_3001_TO_4000">De 3 001 € à 4 000 € / mois</option>
                        <option value="ABOVE_4000">Plus de 4 000 € / mois</option>
                      </select>
                    </div>

                    <div className="col-12 mt-2">
                      <div className="clinical-subgroup-title">
                        <i className="bi bi-shield-shaded"></i> Questionnaire social validé (EPICES)
                      </div>
                    </div>
                    {[
                      { key: "epicesQ49", label: "Rencontrez-vous actuellement un travailleur social (assistante sociale, éducateur...) ?" },
                      { key: "epicesQ50", label: "Bénéficiez-vous d'une assurance maladie complémentaire (Mutuelle ou Complémentaire Santé Solidaire / CSS) ?" },
                      { key: "epicesQ51", label: "Vivez-vous actuellement en couple au sein du même foyer ?" },
                      { key: "epicesQ52", label: "Êtes-vous propriétaire de votre logement principal ?" },
                      { key: "epicesQ53", label: "Avez-vous connu des difficultés financières pour subvenir à vos besoins au cours des 12 derniers mois ?" },
                      { key: "epicesQ54", label: "Avez-vous pratiqué une activité physique ou sportive au cours des 12 derniers mois ?" },
                      { key: "epicesQ55", label: "Êtes-vous allé(e) au cinéma, spectacle, musée ou concert au cours des 12 derniers mois ?" },
                      { key: "epicesQ56", label: "Êtes-vous parti(e) en vacances (au moins 1 semaine) au cours des 12 derniers mois ?" },
                      { key: "epicesQ57", label: "Avez-vous des contacts réguliers avec des membres de votre famille (en dehors de votre foyer) ?" },
                      { key: "epicesQ58", label: "En cas de coup dur, auriez-vous une personne dans votre entourage capable de vous héberger quelques jours ?" },
                      { key: "epicesQ59", label: "En cas d'urgence financière, auriez-vous un proche capable de vous apporter une aide matérielle ?" }
                    ].map((item) => (
                      <div className="col-12 col-md-6" key={item.key}>
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id={`field-${item.key}`} name={item.key} checked={!!form[item.key]} onChange={handleChange} />
                          <label className="form-check-label" htmlFor={`field-${item.key}`}>{item.label}</label>
                        </div>
                      </div>
                    ))}

                    <div className="col-12 mt-3">
                      <h5 className="fw-semibold clinical-section-subhead">
                        <i className="bi bi-activity text-primary"></i> Évaluation de la dépendance (Score HONC)
                      </h5>
                      <p className="small text-muted mb-0">Mesure la perte d'autonomie et l'intensité du besoin physique et psychologique :</p>
                    </div>
                    {[
                      { key: "honcQ1", label: "Avez-vous déjà essayé d'arrêter de fumer et trouvé cela difficile ?" },
                      { key: "honcQ2", label: "Fumez-vous aujourd'hui principalement parce qu'il vous semble difficile d'arrêter ?" },
                      { key: "honcQ3", label: "Ressentez-vous parfois des envies puissantes et irrépressibles d'allumer une cigarette ?" },
                      { key: "honcQ4", label: "Avez-vous parfois la sensation d'un besoin urgent d'une cigarette ?" },
                      { key: "honcQ5", label: "Éprouvez-vous de la difficulté à ne pas fumer dans les endroits où c'est interdit ?" },
                      { key: "honcQ6", label: "Avez-vous du mal à vous concentrer lorsque vous êtes privé(e) de tabac ?" },
                      { key: "honcQ7", label: "Vous sentez-vous irritable ou impatient(e) lorsque vous ne pouvez pas fumer ?" },
                      { key: "honcQ8", label: "Ressentez-vous de la nervosité ou de l'anxiété lorsque vous êtes en manque de tabac ?" },
                      { key: "honcQ9", label: "Vous arrive-t-il de vous sentir triste ou déprimé(e) sans cigarette ?" },
                      { key: "honcQ10", label: "Ressentez-vous une sensation d'angoisse ou de panique si vous vous trouvez à court de tabac ?" }
                    ].map((item) => (
                      <div className="col-12" key={item.key}>
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id={`field-${item.key}`} name={item.key} checked={!!form[item.key]} onChange={handleChange} />
                          <label className="form-check-label" htmlFor={`field-${item.key}`}>{item.label}</label>
                        </div>
                      </div>
                    ))}

                    <div className="col-12">
                      <label className="form-label">Notes médicales ou remarques complémentaires :</label>
                      <textarea className="form-control" rows="3" name="notes" value={form.notes || ""} onChange={handleChange} placeholder="Observations particulières, antécédents addictologiques ou remarques personnelles..." />
                    </div>
                  </div>
                );
              })()}

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
