import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import ConsultationReportForm from "../components/ConsultationReportForm";
import LungLoader from "../components/LungLoader";
import Modal from "react-bootstrap/Modal";
import Dropdown from "react-bootstrap/Dropdown";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import api from "../services/api";
import { chartTheme } from "../theme/chartTheme";

const InteractiveLung3D = lazy(() => import("../components/InteractiveLung3D"));

const Lung3DFallback = () => (
  <div className="card shadow-sm border-0 rounded-4 p-4 text-center my-3" style={{ minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--nc-panel)" }}>
    <div className="d-flex flex-column align-items-center gap-2">
      <div className="spinner-border text-info" role="status" style={{ width: "2rem", height: "2rem" }} />
      <span className="muted-text small mt-2">Chargement du modèle anatomique...</span>
    </div>
  </div>
);

const emptyForm = {
  city: "",
  countryCode: "",
  specialty: "",
  bio: "",
  acceptsTeleconsultation: true,
  yearsExperience: ""
};

const matchingCopy = {
  SAME_CITY: "Meme ville",
  SAME_COUNTRY: "Maroc",
  TELECONSULTATION: "Teleconsultation"
};

const patientWorkspaceViews = [
  { key: "overview", label: "Bilan & Historique", icon: "bi bi-grid-1x2-fill" },
  { key: "profile", label: "Profil Patient", icon: "bi bi-person-vcard-fill" },
  { key: "evaluation", label: "Dossier Médical Initial", icon: "bi bi-journal-medical" },
  { key: "dashboard", label: "Suivi Quotidien", icon: "bi bi-activity" },
  { key: "ai", label: "Plan de Sevrage IA (Groq)", icon: "bi bi-cpu-fill" },
  { key: "medical-reports", label: "Système de Rapports", icon: "bi bi-clipboard2-pulse-fill" },
  { key: "appointments", label: "Agenda & Visio", icon: "bi bi-calendar2-week-fill" }
];

const chartTooltipStyle = chartTheme.tooltip;

const displayValue = (value) => {
  if (value === true) return "Oui";
  if (value === false) return "Non";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Non renseigne";
  if (value === null || value === undefined || value === "") return "Non renseigne";
  return String(value);
};

const humanize = (value) =>
  String(value || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return "Non renseigne";
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return "Non renseigne";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hadBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!hadBirthday) {
    age -= 1;
  }
  return `${age} ans`;
};

const dedupeRequestsByPatient = (items) => {
  const map = new Map();
  items.forEach((item) => {
    if (!map.has(item.patientProfileId)) {
      map.set(item.patientProfileId, item);
    }
  });
  return [...map.values()];
};

const safeList = (value) => (Array.isArray(value) ? value : []);

const buildProgressBadges = (patient) => {
  if (!patient) return [];
  return [
    { key: "evaluation", label: "Evaluation", done: !!patient.onboardingComplete },
    { key: "tests", label: "Tests", done: !!patient.testsComplete },
    { key: "journal", label: "Journal", done: !!patient.journalComplete }
  ];
};

const buildProgressLabel = (patient) => {
  const steps = buildProgressBadges(patient).filter((item) => item.done).length;
  return `${steps}/3 etapes`;
};

const buildPatientScoreLine = (patient) => {
  if (!patient) return "Scores non disponibles";
  return `Fagerstrom ${displayValue(patient.fagerstromScore)} · HAD A ${displayValue(patient.hadAnxietyScore)} · HAD D ${displayValue(patient.hadDepressionScore)}`;
};

const calculateRassScore = (fagerstromScore, anxietyScore, depressionScore) => {
  if (fagerstromScore === undefined || fagerstromScore === null || 
      anxietyScore === undefined || anxietyScore === null || 
      depressionScore === undefined || depressionScore === null) {
    return null;
  }
  const score = (0.3 * fagerstromScore) + (0.35 * (anxietyScore / 21) * 10) + (0.35 * (depressionScore / 21) * 10);
  return Math.round(score);
};

const getRassInterpretation = (score) => {
  if (score === null || score === undefined) return "Non evalue";
  if (score <= 3) return "Risque Faible (Stable)";
  if (score <= 6) return "Risque Modere (Vigilance)";
  return "Risque Eleve (Danger)";
};

const getRassColor = (score) => {
  if (score === null || score === undefined) return "#6b7280";
  if (score <= 3) return "#10b981"; // Emerald Green
  if (score <= 6) return "#f59e0b"; // Amber Orange
  return "#ef4444"; // Coral Red
};

const resolveNextPatientId = (preferredPatientId, previousPatientId, requestData, patientData) => {
  const allowedIds = new Set([
    ...requestData.map((item) => item.patientProfileId),
    ...patientData.map((item) => item.patientProfileId)
  ]);
  const firstPending = dedupeRequestsByPatient(requestData.filter((item) => item.status === "PENDING"))[0]?.patientProfileId;
  const firstAssigned = patientData[0]?.patientProfileId;
  return [preferredPatientId, previousPatientId, firstPending, firstAssigned].find(
    (candidate) => candidate && allowedIds.has(candidate)
  ) || null;
};

const DoctorWorkspace = ({ mode = "workspace" }) => {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedPatientView, setSelectedPatientView] = useState("overview");
  const [isPatientPanelOpen, setIsPatientPanelOpen] = useState(false);
  const [dossier, setDossier] = useState(null);
  const [dossierError, setDossierError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState({});
  const [planNotes, setPlanNotes] = useState({});
  const [phaseDoctorNotes, setPhaseDoctorNotes] = useState({});
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [decisionLoadingId, setDecisionLoadingId] = useState(null);

  const exportClinicalReportPDF = () => {
    if (!dossier) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    const assessmentRows = assessmentEntries.map(([key, val]) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 600; width: 45%; color: #374151; font-size: 12px;">${humanize(key)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #4b5563; font-size: 12px;">${displayValue(val)}</td>
      </tr>
    `).join("");

    const reportsSummary = safeList(dossier.dailyReports).slice(0, 15).map((rep) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #374151;">${formatDate(rep.reportDate)}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; text-align: center; color: #111827;">${rep.cigarettesSmoked ?? 0}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; text-align: center; color: #ef4444; font-weight: 600;">${rep.cravingsIntensity ?? 0}/10</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; text-align: center; color: #f59e0b; font-weight: 600;">${rep.stressScore ?? 0}/10</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #4b5563;">${rep.moodScore ?? 0}/10</td>
      </tr>
    `).join("");

    const activePlan = dossier.validatedPlan || safeList(dossier.sevragePlans).find(p => p.active) || null;
    const planStepsHtml = activePlan ? `
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <h4 style="margin-top: 0; color: #2563eb; font-weight: 700; font-size: 14px; margin-bottom: 6px;">${activePlan.title}</h4>
        <p style="margin-bottom: 14px; font-size: 12.5px; color: #4b5563; line-height: 1.5;">${activePlan.summary}</p>
        <strong style="font-size: 11.5px; display: block; margin-bottom: 8px; color: #111827; text-transform: uppercase; letter-spacing: 0.02em;">Phases d'actions prescrites :</strong>
        <ol style="margin: 0; padding-left: 20px; font-size: 12px; color: #374151;">
          ${safeList(activePlan.steps).map(step => `<li style="margin-bottom: 6px; line-height: 1.4;">${step}</li>`).join("")}
        </ol>
      </div>
    ` : `<p style="color: #9ca3af; font-style: italic; font-size: 12.5px;">Aucun plan de sevrage thérapeutique n'a encore été validé par le médecin.</p>`;

    const fScore = dossier.latestFagerstrom?.totalScore;
    const aScore = dossier.latestHad?.anxietyScore;
    const dScore = dossier.latestHad?.depressionScore;
    const currentRass = calculateRassScore(fScore, aScore, dScore);
    const rassColor = getRassColor(currentRass);
    const rassInterpretation = getRassInterpretation(currentRass);

    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bilan Clinique de Sevrage Tabagique - ${dossier.patientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #111827;
            line-height: 1.5;
            margin: 40px;
            font-size: 12.5px;
          }
          h1, h2, h3, h4, h5 {
            font-family: 'Outfit', sans-serif;
            color: #111827;
            margin-top: 0;
          }
          .header-table {
            width: 100%;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header-title {
            font-size: 22px;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 4px;
          }
          .header-subtitle {
            font-size: 11px;
            color: #4b5563;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
          }
          .meta-table {
            width: 100%;
            margin-bottom: 20px;
            border-collapse: collapse;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #1e3a8a;
            border-bottom: 1.5px solid #2563eb;
            padding-bottom: 5px;
            margin-top: 25px;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .score-card-grid {
            display: table;
            width: 100%;
            margin-bottom: 20px;
          }
          .score-card-cell {
            display: table-cell;
            width: 25%;
            padding-right: 12px;
          }
          .score-card {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 10px 8px;
            text-align: center;
          }
          .score-label {
            font-size: 9.5px;
            font-weight: 600;
            text-transform: uppercase;
            color: #6b7280;
            display: block;
          }
          .score-val {
            font-size: 22px;
            font-weight: 700;
            color: #111827;
            margin: 3px 0;
            display: block;
          }
          .score-desc {
            font-size: 9.5px;
            color: #4b5563;
          }
          .clinical-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .clinical-table th {
            background-color: #f3f4f6;
            padding: 8px 10px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
          }
          .page-break {
            page-break-before: always;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td>
              <div class="header-title">NeuralConsult • Bilan Clinique</div>
              <div class="header-subtitle">Dossier Médical de Sevrage Tabagique</div>
            </td>
            <td style="text-align: right; font-size: 11px; color: #4b5563; line-height: 1.4;">
              <strong>Rapport Généré le :</strong> ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}<br>
              <strong>Médecin Traitant :</strong> Dr. ${profile?.fullName || "Spécialiste Tabacologue"}
            </td>
          </tr>
        </table>

        <table class="meta-table">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 15px;">
              <h3 style="color: #2563eb; margin-bottom: 8px; font-weight: 700; font-size: 13px;">Identité du Patient</h3>
              <table style="width: 100%; font-size: 11.5px;">
                <tr><td style="padding: 3px 0; font-weight: 600; color: #6b7280; width: 40%;">Nom complet :</td><td style="padding: 3px 0; color: #111827;">${dossier.patientName}</td></tr>
                <tr><td style="padding: 3px 0; font-weight: 600; color: #6b7280;">Adresse Email :</td><td style="padding: 3px 0; color: #111827;">${dossier.patientEmail}</td></tr>
                <tr><td style="padding: 3px 0; font-weight: 600; color: #6b7280;">Âge / Sexe :</td><td style="padding: 3px 0; color: #111827;">${calculateAge(dossier.profile?.dateOfBirth)} / ${dossier.profile?.sex || "Non spécifié"}</td></tr>
                <tr><td style="padding: 3px 0; font-weight: 600; color: #6b7280;">Ville de Résidence :</td><td style="padding: 3px 0; color: #111827;">${dossier.profile?.city || "Non spécifiée"}</td></tr>
              </table>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 15px; border-left: 1px solid #e5e7eb;">
              <h3 style="color: #2563eb; margin-bottom: 8px; font-weight: 700; font-size: 13px;">Profil Tabacologique</h3>
              <table style="width: 100%; font-size: 11.5px;">
                <tr><td style="padding: 3px 0; font-weight: 600; color: #6b7280; width: 45%;">Consommation Initiale :</td><td style="padding: 3px 0; color: #111827;">${dossier.profile?.cigarettesPerDay || 0} cig / jour</td></tr>
                <tr><td style="padding: 3px 0; font-weight: 600; color: #6b7280;">Âge de Début :</td><td style="padding: 3px 0; color: #111827;">${dossier.profile?.smokingStartAge || "Non spécifié"} ans</td></tr>
                <tr><td style="padding: 3px 0; font-weight: 600; color: #6b7280;">Dépendance Physique :</td><td style="padding: 3px 0; color: #111827;"><strong>${dossier.profile?.dependenceLevel || "Non évaluée"}</strong></td></tr>
                <tr><td style="padding: 3px 0; font-weight: 600; color: #6b7280;">Notes Médicales :</td><td style="padding: 3px 0; color: #4b5563; font-style: italic;">${dossier.profile?.medicalHistoryNotes || "Aucune note saisie."}</td></tr>
              </table>
            </td>
          </tr>
        </table>

        <div class="section-title">Indicateurs Cliniques Clés & Relapse Risk</div>
        <div class="score-card-grid">
          <div class="score-card-cell">
            <div class="score-card">
              <span class="score-label">Fagerström</span>
              <span class="score-val">${displayValue(fScore)}</span>
              <span class="score-desc">${displayValue(dossier.latestFagerstrom?.dependenceLevel || "Non mesuré")}</span>
            </div>
          </div>
          <div class="score-card-cell">
            <div class="score-card">
              <span class="score-label">HAD Anxiété</span>
              <span class="score-val">${displayValue(aScore)}</span>
              <span class="score-desc">${displayValue(dossier.latestHad?.anxietyInterpretation || "Non mesuré")}</span>
            </div>
          </div>
          <div class="score-card-cell">
            <div class="score-card">
              <span class="score-label">HAD Dépression</span>
              <span class="score-val">${displayValue(dScore)}</span>
              <span class="score-desc">${displayValue(dossier.latestHad?.depressionInterpretation || "Non mesuré")}</span>
            </div>
          </div>
          <div class="score-card-cell" style="padding-right: 0;">
            <div class="score-card" style="border-left: 4px solid ${rassColor};">
              <span class="score-label" style="color: ${rassColor}; font-weight: 700;">RASS Relapse Risk</span>
              <span class="score-val" style="color: ${rassColor};">${currentRass !== null ? `${currentRass}/10` : "-"}</span>
              <span class="score-desc" style="font-weight: 600; color: ${rassColor};">${rassInterpretation}</span>
            </div>
          </div>
        </div>

        <div class="section-title">Stratégie Thérapeutique & Plan de Sevrage Validé</div>
        ${planStepsHtml}

        ${dossier.clinicalNote?.medicalSummary ? `
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin-top: 15px; margin-bottom: 20px;">
            <h4 style="margin-top: 0; color: #15803d; font-weight: 700; font-size: 13.5px;"><i class="bi bi-journal-check me-2"></i>Synthèse Médicale Clinique RAG</h4>
            <p style="margin: 0; font-size: 12px; color: #166534; line-height: 1.6; font-style: italic;">"${dossier.clinicalNote.medicalSummary}"</p>
          </div>
        ` : ""}

        <div class="page-break"></div>

        <div class="section-title">Dossier Médical Initial (5 Phases d'Évaluation)</div>
        <table class="clinical-table">
          <thead>
            <tr>
              <th style="width: 45%;">Paramètre Clinique Évalué</th>
              <th>Réponse / Valeur Déclarée</th>
            </tr>
          </thead>
          <tbody>
            ${assessmentRows || '<tr><td colspan="2" style="text-align: center; color: #9ca3af; padding: 10px;">Aucune donnée d\'évaluation trouvée.</td></tr>'}
          </tbody>
        </table>

        ${reportsSummary ? `
          <div class="page-break"></div>
          <div class="section-title">Suivi Quotidien & Observance (Dernières Entrées)</div>
          <table class="clinical-table">
            <thead>
              <tr>
                <th>Date du Journal</th>
                <th style="text-align: center;">Cigarettes Fumées</th>
                <th style="text-align: center;">Intensité Cravings</th>
                <th style="text-align: center;">Intensité Stress</th>
                <th>Humeur / État Émotionnel</th>
              </tr>
            </thead>
            <tbody>
              ${reportsSummary}
            </tbody>
          </table>
        ` : ""}

        <div style="margin-top: 50px; border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 10px; color: #9ca3af; text-align: center; font-weight: 500;">
          NeuralConsult Clinical Report — Document confidentiel strictement destiné à l'usage des professionnels de santé autorisés.
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(reportHtml);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  const loadDossierFor = async (patientId) => {
    if (!patientId) {
      setDossier(null);
      setDossierError(null);
      return null;
    }
    setDossierLoading(true);
    setDossierError(null);
    try {
      const { data } = await api.get(`/api/doctors/patients/${patientId}/dossier`);
      setDossier(data);
      return data;
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setDossier(null);
      setDossierError(apiError || "Impossible de charger le dossier de ce patient pour le moment.");
      return null;
    } finally {
      setDossierLoading(false);
    }
  };

  const loadWorkspace = async (options = {}) => {
    setLoading(true);
    const [profileResp, requestsResp, patientsResp] = await Promise.allSettled([
      api.get("/api/doctors/profile/me"),
      api.get("/api/doctors/requests/doctor"),
      api.get("/api/doctors/patients"),
    ]);

    const profileData = profileResp.status === "fulfilled" ? profileResp.value.data : null;
    const requestData = requestsResp.status === "fulfilled" ? requestsResp.value.data || [] : [];
    const patientData = patientsResp.status === "fulfilled" ? patientsResp.value.data || [] : [];

    setProfile(profileData);
    setRequests(requestData);
    setPatients(patientData);
    setForm({
      city: profileData?.city || "",
      countryCode: profileData?.countryCode || "",
      specialty: profileData?.specialty || "",
      bio: profileData?.bio || "",
      acceptsTeleconsultation: profileData?.acceptsTeleconsultation ?? true,
      yearsExperience: profileData?.yearsExperience || ""
    });

    const nextPatientId = resolveNextPatientId(options.preferredPatientId, selectedPatientId, requestData, patientData);
    setSelectedPatientId(nextPatientId);
    if (!nextPatientId) {
      setDossier(null);
      setDossierError(null);
    }
    setLoading(false);
    return { nextPatientId };
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  useEffect(() => {
    if (mode !== "workspace") {
      setDossier(null);
      setDossierError(null);
      return;
    }
    if (!selectedPatientId) {
      setDossier(null);
      setDossierError(null);
      return;
    }
    loadDossierFor(selectedPatientId);
  }, [mode, selectedPatientId]);

  useEffect(() => {
    const nextNotes = {};
    safeList(dossier?.clinicalIntelligence?.phaseSummaries).forEach((item) => {
      nextNotes[item.id] = item.doctorNote || "";
    });
    setPhaseDoctorNotes(nextNotes);
  }, [dossier]);

  const pendingRequests = useMemo(
    () => dedupeRequestsByPatient(requests.filter((request) => request.status === "PENDING")),
    [requests]
  );

  const patientMap = useMemo(
    () => new Map(patients.map((patient) => [patient.patientProfileId, patient])),
    [patients]
  );

  const [medicalReports, setMedicalReports] = useState([]);

  const loadMedicalReports = async (patientUserId) => {
    try {
      const { data } = await api.get(`/api/medical/patients/${patientUserId}/reports`);
      setMedicalReports(data);
    } catch (error) {
      console.error("Error loading medical reports:", error);
    }
  };

  useEffect(() => {
    if (selectedPatientId && (selectedPatientView === "medical-reports" || selectedPatientView === "overview")) {
      loadMedicalReports(selectedPatientId);
    }
  }, [selectedPatientId, selectedPatientView]);

  const selectedPatientSummary = useMemo(
    () => patientMap.get(selectedPatientId) || null,
    [patientMap, selectedPatientId]
  );

  const selectedPendingRequest = useMemo(
    () => pendingRequests.find((request) => request.patientProfileId === selectedPatientId) || null,
    [pendingRequests, selectedPatientId]
  );

  const assessmentEntries = useMemo(() => {
    if (!dossier?.assessment) return [];
    return Object.entries(dossier.assessment).filter(([, value]) => value !== null && value !== "");
  }, [dossier]);

  const hadTrend = useMemo(
    () =>
      [...safeList(dossier?.hadHistory)]
        .reverse()
        .map((test) => ({
          date: formatDate(test.createdAt),
          anxiete: test.anxietyScore ?? 0,
          depression: test.depressionScore ?? 0
        })),
    [dossier]
  );

  const fagerTrend = useMemo(
    () =>
      [...safeList(dossier?.fagerstromHistory)]
        .reverse()
        .map((test) => ({
          date: formatDate(test.createdAt),
          score: test.totalScore ?? 0
        })),
    [dossier]
  );

  const rassTrend = useMemo(() => {
    const fagerList = [...safeList(dossier?.fagerstromHistory)].reverse();
    const hadList = [...safeList(dossier?.hadHistory)].reverse();
    return hadList.map((had, idx) => {
      const fager = fagerList[idx] || fagerList[fagerList.length - 1] || null;
      const fScore = fager ? fager.totalScore : 5;
      const rScore = calculateRassScore(fScore, had.anxietyScore, had.depressionScore);
      return {
        date: formatDate(had.createdAt),
        anxiete: had.anxietyScore ?? 0,
        depression: had.depressionScore ?? 0,
        fagerstrom: fScore,
        rass: rScore
      };
    });
  }, [dossier]);

  const dailyTrend = useMemo(
    () =>
      [...safeList(dossier?.dailyReports)]
        .sort((left, right) => String(left.reportDate).localeCompare(String(right.reportDate)))
        .map((report) => ({
          date: report.reportDate ? String(report.reportDate).slice(5) : "-",
          cigarettes: report.cigarettesSmoked ?? 0,
          cravings: report.cravingsIntensity ?? 0,
          stress: report.stressScore ?? 0
        })),
    [dossier]
  );

  const doctorProfileCards = [
    ["Nom complet", profile?.fullName],
    ["Email", profile?.email],
    ["Ville", profile?.city],
    ["Pays", profile?.countryCode || "MA"],
    ["Specialite", profile?.specialty || "Tabacologie"],
    ["Annees d'experience", profile?.yearsExperience],
    ["Teleconsultation", profile?.acceptsTeleconsultation ? "Oui" : "Non"],
    ["Score de suivi", profile?.successScore ?? "A definir"],
    ["Validation admin", profile?.active ? "Valide" : "En attente"]
  ];

  const patientCards = [
    ["Nom complet", dossier?.patientName],
    ["Email", dossier?.patientEmail],
    ["Age", calculateAge(dossier?.profile?.dateOfBirth)],
    ["Date de naissance", formatDate(dossier?.profile?.dateOfBirth)],
    ["Sexe", dossier?.profile?.sex],
    ["Taille", dossier?.profile?.heightCm ? `${dossier.profile.heightCm} cm` : null],
    ["Poids", dossier?.profile?.weightKg ? `${dossier.profile.weightKg} kg` : null],
    ["Ville", dossier?.profile?.city],
    ["Profession", dossier?.profile?.occupation],
    ["Cigarettes / jour", dossier?.profile?.cigarettesPerDay],
    ["Age debut tabac", dossier?.profile?.smokingStartAge],
    ["Dependance", dossier?.profile?.dependenceLevel],
    ["Evaluation", dossier?.profile?.onboardingComplete ? "Complete" : "Incomplet"],
    ["Tests", dossier?.profile?.testsComplete ? "Complets" : "Incomplets"],
    ["Journal", dossier?.profile?.journalComplete ? "Actif" : "A initialiser"]
  ];

  const saveProfile = async (event) => {
    event.preventDefault();
    setMessage(null);
    try {
      const payload = {
        ...form,
        yearsExperience: form.yearsExperience === "" ? null : Number(form.yearsExperience)
      };
      const { data } = await api.post("/api/doctors/profile", payload);
      setProfile(data);
      setIsEditingProfile(false);
      setMessage({ type: "success", text: "Profil medecin enregistre." });
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Impossible d'enregistrer le profil medecin." });
    }
  };

  const openPatientView = async (patientProfileId, view = "overview") => {
    setSelectedPatientView(view);
    setIsPatientPanelOpen(true);
    if (selectedPatientId !== patientProfileId) {
      setSelectedPatientId(patientProfileId);
      return;
    }
    await loadDossierFor(patientProfileId);
  };

  const decideRequest = async (requestId, action, patientProfileId) => {
    setMessage(null);
    setDecisionLoadingId(requestId);
    try {
      await api.post(`/api/doctors/requests/${requestId}/${action}`, {
        note: decisionNotes[requestId] || null
      });
      await loadWorkspace({ preferredPatientId: patientProfileId });
      setSelectedPatientView("overview");
      if (patientProfileId) {
        await loadDossierFor(patientProfileId);
      }
      setMessage({
        type: "success",
        text: action === "accept" ? "Patient accepte et dossier recharge." : "Demande refusee."
      });
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Decision medecin impossible pour le moment." });
    } finally {
      setDecisionLoadingId(null);
    }
  };

  const validatePlan = async (candidateId) => {
    setMessage(null);
    try {
      await api.post(`/api/clinical-intelligence/plans/${candidateId}/validate`, {
        doctorNote: planNotes[candidateId] || null
      });
      if (selectedPatientId) {
        await loadDossierFor(selectedPatientId);
      }
      setMessage({ type: "success", text: "Plan valide et rattache au patient." });
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Validation du plan impossible." });
    }
  };

  const savePhaseDoctorNote = async (phaseSummaryId) => {
    if (!selectedPatientId) return;
    setMessage(null);
    try {
      await api.post(`/api/doctors/patients/${selectedPatientId}/phase-summaries/${phaseSummaryId}/doctor-note`, {
        doctorNote: phaseDoctorNotes[phaseSummaryId] || null
      });
      await loadDossierFor(selectedPatientId);
      setMessage({ type: "success", text: "Resume medecin enregistre pour cette phase." });
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Impossible d'enregistrer la note medecin." });
    }
  };

  const renderProfileForm = () => (
    <section className="card form-card">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <div className="section-title-sm">Profil medecin</div>
          <p className="muted-text mb-0">Le formulaire disparait apres sauvegarde et laisse place a une vue lecture.</p>
        </div>
        {profile && (
          <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => setIsEditingProfile(false)}>
            Fermer
          </button>
        )}
      </div>

      <form className="row g-3" onSubmit={saveProfile}>
        <div className="col-12 col-md-6"><label className="form-label">Ville</label><input className="form-control" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></div>
        <div className="col-12 col-md-6"><label className="form-label">Pays</label><input className="form-control" value={form.countryCode} onChange={(e) => setForm((p) => ({ ...p, countryCode: e.target.value }))} /></div>
        <div className="col-12 col-md-6"><label className="form-label">Specialite</label><input className="form-control" value={form.specialty} onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))} /></div>
        <div className="col-12 col-md-6"><label className="form-label">Annees d'experience</label><input className="form-control" type="number" value={form.yearsExperience} onChange={(e) => setForm((p) => ({ ...p, yearsExperience: e.target.value }))} /></div>
        <div className="col-12 form-check">
          <input id="doctorTeleconsultation" className="form-check-input" type="checkbox" checked={!!form.acceptsTeleconsultation} onChange={(e) => setForm((p) => ({ ...p, acceptsTeleconsultation: e.target.checked }))} />
          <label className="form-check-label" htmlFor="doctorTeleconsultation">Accepte la teleconsultation</label>
        </div>
        <div className="col-12"><label className="form-label">Bio / approche clinique</label><textarea className="form-control" rows="4" value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} /></div>
        <div className="col-12 d-flex justify-content-end"><button className="btn btn-dark">Enregistrer le profil</button></div>
      </form>
    </section>
  );

  const renderPatientHeader = () => {
    if (!dossier) return null;
    return (
      <div className="doctor-selection-header">
        <div>
          <div className="section-title-sm">Patient selectionne</div>
          <h3 className="mb-1">{dossier.patientName}</h3>
          <p className="muted-text mb-0">{dossier.patientEmail}</p>
        </div>
        <div className="doctor-selection-meta">
          <button type="button" className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2 px-3 rounded-pill fw-semibold border border-danger border-opacity-25 bg-danger bg-opacity-10 text-danger hover-bg-danger-solid" onClick={exportClinicalReportPDF}>
            <i className="bi bi-file-earmark-pdf-fill fs-6" />
            <span>Exporter le Bilan Clinique</span>
          </button>
          <span className={`doctor-status-chip ${selectedPendingRequest ? "status-pending" : "status-accepted"}`}>{selectedPendingRequest ? "Demande a traiter" : "Patient associe"}</span>
          <span className="doctor-status-chip status-info">{displayValue(selectedPatientSummary?.dependenceLevel || dossier.profile?.dependenceLevel || "A evaluer")}</span>
        </div>
      </div>
    );
  };

  const renderPatientTabs = () => {
    if (!dossier) return null;
    return (
      <div className="doctor-view-tabs">
        {patientWorkspaceViews.map((view) => (
          <button key={view.key} type="button" className={`doctor-view-tab ${selectedPatientView === view.key ? "is-active" : ""}`} onClick={() => setSelectedPatientView(view.key)}>
            <i className={view.icon} />
            <span>{view.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderDecisionBox = () => {
    if (!selectedPendingRequest) return null;
    const isBusy = decisionLoadingId === selectedPendingRequest.id;
    return (
      <div className="doctor-dossier-section doctor-inline-decision-box">
        <strong>Decision sur cette demande</strong>
        <p className="muted-text mb-0">Le medecin peut lire tout le dossier, puis accepter ou refuser le patient avec une note de tri.</p>
        <textarea className="form-control mt-3" rows="2" placeholder="Note medecin optionnelle" value={decisionNotes[selectedPendingRequest.id] || ""} onChange={(e) => setDecisionNotes((previous) => ({ ...previous, [selectedPendingRequest.id]: e.target.value }))} />
        <div className="doctor-card-actions">
          <button type="button" className="btn btn-dark" disabled={isBusy} onClick={() => decideRequest(selectedPendingRequest.id, "accept", selectedPendingRequest.patientProfileId)}>{isBusy ? "Traitement..." : "Accepter le patient"}</button>
          <button type="button" className="btn btn-outline-dark" disabled={isBusy} onClick={() => decideRequest(selectedPendingRequest.id, "refuse", selectedPendingRequest.patientProfileId)}>Refuser</button>
        </div>
      </div>
    );
  };

  const renderOverview = () => (
    <>
      {renderDecisionBox()}
      <div className="doctor-dossier-section">
        <strong>Vue rapide du patient</strong>
        <div className="profile-card-grid mt-3">
          {patientCards.slice(0, 8).map(([label, value]) => (
            <div key={label} className="profile-data-card">
              <span className="profile-data-label">{label}</span>
              <strong>{displayValue(value)}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="doctor-dossier-section">
        <strong>Indicateurs cles</strong>
        <div className="doctor-score-grid mt-3">
          <div className="doctor-score-card"><span>Fagerstrom</span><strong>{displayValue(dossier.latestFagerstrom?.totalScore)}</strong><p>{displayValue(dossier.latestFagerstrom?.dependenceLevel)}</p></div>
          <div className="doctor-score-card"><span>HAD Anxiete</span><strong>{displayValue(dossier.latestHad?.anxietyScore)}</strong><p>{displayValue(dossier.latestHad?.anxietyInterpretation)}</p></div>
          <div className="doctor-score-card"><span>HAD Depression</span><strong>{displayValue(dossier.latestHad?.depressionScore)}</strong><p>{displayValue(dossier.latestHad?.depressionInterpretation)}</p></div>
          <div className="doctor-score-card"><span>Journal</span><strong>{safeList(dossier.dailyReports).length}</strong><p>Entrees quotidiennes</p></div>
        </div>
      </div>
      <div className="doctor-dossier-section doctor-overview-grid">
        <div className="doctor-overview-card">
          <span className="profile-data-label">Plan de Sevrage Actif</span>
          {dossier.validatedPlan ? (
            <div className="mt-2">
              <strong className="text-primary d-block">{dossier.validatedPlan.title}</strong>
              <p className="mb-0 small mt-1">{dossier.validatedPlan.summary}</p>
            </div>
          ) : (
            <p className="mb-0 text-muted">Aucun plan validé. Consultez l'onglet "Plan de Sevrage IA".</p>
          )}
        </div>
        <div className="doctor-overview-card">
          <span className="profile-data-label">Dernier Rapport Médical</span>
          {medicalReports.length > 0 ? (
            <div className="mt-2">
              <strong className="d-block">{medicalReports[0].title}</strong>
              <p className="mb-0 small text-secondary">{formatDate(medicalReports[0].consultationDate)} · {medicalReports[0].tobaccoConsumptionDaily} cig/j</p>
              <button type="button" className="btn btn-link btn-sm p-0 mt-1" onClick={() => setSelectedPatientView("medical-reports")}>Voir tout l'historique</button>
            </div>
          ) : (
            <p className="mb-0 text-muted">Aucun rapport. Effectuez un bilan depuis l'agenda.</p>
          )}
        </div>
      </div>
    </>
  );

  const renderProfileSection = () => (
    <div className="doctor-dossier-section">
      <strong>Profil personnel du patient</strong>
      <div className="profile-card-grid mt-3">
        {patientCards.map(([label, value]) => (
          <div key={label} className="profile-data-card">
            <span className="profile-data-label">{label}</span>
            <strong>{displayValue(value)}</strong>
          </div>
        ))}
      </div>
      <div className="doctor-bio-card mt-4"><span className="profile-data-label">Notes medicales generales</span><p className="mb-0">{displayValue(dossier.profile?.medicalHistoryNotes)}</p></div>
    </div>
  );

  const renderEvaluationSection = () => (
    <div className="doctor-dossier-section">
      <strong>Dossier medical initial complet</strong>
      <p className="muted-text mb-0">Toutes les reponses de l'evaluation initiale sont visibles pour l'analyse clinique.</p>
      <div className="doctor-dossier-answers mt-3">
        {assessmentEntries.length === 0 ? <p className="muted-text mb-0">Aucune reponse d'evaluation disponible.</p> : assessmentEntries.map(([key, value]) => (
          <div key={key} className="doctor-answer-row"><span>{humanize(key)}</span><strong>{displayValue(value)}</strong></div>
        ))}
      </div>
    </div>
  );

  const renderDashboardSection = () => {
    const latestFScore = dossier.latestFagerstrom?.totalScore;
    const latestAnxiety = dossier.latestHad?.anxietyScore;
    const latestDepression = dossier.latestHad?.depressionScore;
    const currentRass = calculateRassScore(latestFScore, latestAnxiety, latestDepression);

    const targetQuitDate = dossier.validatedPlan?.targetQuitDate || dossier.profile?.targetQuitDate || dossier.profile?.createdAt;
    const quitDate = targetQuitDate ? new Date(targetQuitDate) : new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const diffDays = Math.max(0, (Date.now() - quitDate.getTime()) / (1000 * 60 * 60 * 24));

    return (
      <div className="doctor-dossier-section">
        <strong>Dashboard clinique et historiques de tests</strong>
        
        {/* 🫁 Visualisation 3D Interactive de l'Évolution Pulmonaire (Patient) */}
        <div className="mt-3">
          <Suspense fallback={<Lung3DFallback />}>
            <InteractiveLung3D diffDays={diffDays} />
          </Suspense>
        </div>
        <div className="doctor-score-grid mt-3">
          <div className="doctor-score-card"><span>Fagerstrom</span><strong>{displayValue(latestFScore)}</strong><p>{displayValue(dossier.latestFagerstrom?.dependenceLevel)}</p></div>
          <div className="doctor-score-card"><span>HAD Anxiete</span><strong>{displayValue(latestAnxiety)}</strong><p>{displayValue(dossier.latestHad?.anxietyInterpretation)}</p></div>
          <div className="doctor-score-card"><span>HAD Depression</span><strong>{displayValue(latestDepression)}</strong><p>{displayValue(dossier.latestHad?.depressionInterpretation)}</p></div>
          <div className="doctor-score-card" style={{ borderLeft: `4px solid ${getRassColor(currentRass)}` }}>
            <span>Prédiction RASS</span>
            <strong style={{ color: getRassColor(currentRass) }}>{currentRass !== null ? `${currentRass}/10` : "Non évalue"}</strong>
            <p>{getRassInterpretation(currentRass)}</p>
          </div>
          <div className="doctor-score-card"><span>Progression</span><strong>{buildProgressLabel(selectedPatientSummary || dossier.profile)}</strong><p>{displayValue(selectedPatientSummary?.dependenceLevel || dossier.profile?.dependenceLevel)}</p></div>
        </div>
        <div className="doctor-dashboard-grid mt-3">
          <div className="doctor-chart-card">
            <div className="chart-card-head"><div><div className="hero-kicker">HAD</div><h3>Anxiete vs Depression</h3></div></div>
            <div className="doctor-chart-wrap">
              {hadTrend.length === 0 ? <p className="muted-text mb-0">Aucun historique HAD.</p> : <ResponsiveContainer><LineChart data={hadTrend}><CartesianGrid stroke={chartTheme.grid} strokeDasharray="4 4" /><XAxis dataKey="date" stroke={chartTheme.axis} /><YAxis stroke={chartTheme.axis} /><Tooltip contentStyle={chartTooltipStyle} /><Legend /><Line type="monotone" dataKey="anxiete" stroke={chartTheme.anxiety} strokeWidth={3} dot={{ r: 3 }} /><Line type="monotone" dataKey="depression" stroke={chartTheme.depression} strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer>}
            </div>
          </div>
          <div className="doctor-chart-card">
            <div className="chart-card-head"><div><div className="hero-kicker">Dependance</div><h3>Evolution Fagerstrom</h3></div></div>
            <div className="doctor-chart-wrap">
              {fagerTrend.length === 0 ? <p className="muted-text mb-0">Aucun historique Fagerstrom.</p> : <ResponsiveContainer><LineChart data={fagerTrend}><CartesianGrid stroke={chartTheme.grid} strokeDasharray="4 4" /><XAxis dataKey="date" stroke={chartTheme.axis} /><YAxis stroke={chartTheme.axis} /><Tooltip contentStyle={chartTooltipStyle} /><Line type="monotone" dataKey="score" stroke={chartTheme.dependence} strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer>}
            </div>
          </div>
          <div className="doctor-chart-card doctor-chart-card-wide">
            <div className="chart-card-head"><div><div className="hero-kicker">Prévention Prédictive</div><h3>Évolution du Risque de Rechute (Score RASS)</h3></div></div>
            <div className="doctor-chart-wrap">
              {rassTrend.length === 0 ? <p className="muted-text mb-0">Aucun historique RASS suffisant.</p> : (
                <ResponsiveContainer>
                  <LineChart data={rassTrend}>
                    <CartesianGrid stroke={chartTheme.grid} strokeDasharray="4 4" />
                    <XAxis dataKey="date" stroke={chartTheme.axis} />
                    <YAxis domain={[0, 10]} stroke={chartTheme.axis} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend />
                    <Line type="monotone" name="Dépendance (Fagerström)" dataKey="fagerstrom" stroke={chartTheme.anxiety} strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" name="Anxiété (HAD)" dataKey="anxiete" stroke={chartTheme.stress} strokeWidth={2} strokeDasharray="3 3" dot={{ r: 2 }} />
                    <Line type="monotone" name="Dépression (HAD)" dataKey="depression" stroke="#ec4899" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 2 }} />
                    <Line type="monotone" name="Risque RASS" dataKey="rass" stroke={chartTheme.rass} strokeWidth={4} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="doctor-chart-card doctor-chart-card-wide">
            <div className="chart-card-head"><div><div className="hero-kicker">Journal</div><h3>Cravings, stress et cigarettes</h3></div></div>
            <div className="doctor-chart-wrap">
            {dailyTrend.length === 0 ? <p className="muted-text mb-0">Aucune donnee quotidienne.</p> : <ResponsiveContainer><AreaChart data={dailyTrend}><CartesianGrid stroke={chartTheme.grid} strokeDasharray="4 4" /><XAxis dataKey="date" stroke={chartTheme.axis} /><YAxis stroke={chartTheme.axis} /><Tooltip contentStyle={chartTooltipStyle} /><Legend /><Area type="monotone" dataKey="cravings" stroke={chartTheme.cravings} fill={chartTheme.cravingsFillTop} strokeWidth={2} /><Area type="monotone" dataKey="stress" stroke={chartTheme.stress} fill={chartTheme.stressFillTop} strokeWidth={2} /><Line type="monotone" dataKey="cigarettes" stroke={chartTheme.cigarettes} strokeWidth={2} dot={false} /></AreaChart></ResponsiveContainer>}
          </div>
        </div>
      </div>
      <div className="doctor-dual-list mt-3">
        <div className="doctor-overview-card">
          <span className="profile-data-label">Historique Fagerstrom</span>
          {safeList(dossier.fagerstromHistory).length === 0 ? <p className="mb-0 muted-text">Aucun test Fagerstrom enregistre.</p> : <div className="doctor-mini-stack mt-3">{safeList(dossier.fagerstromHistory).slice(0, 6).map((test) => <div key={test.id} className="doctor-mini-row"><span>{formatDateTime(test.createdAt)}</span><strong>{displayValue(test.totalScore)} · {displayValue(test.dependenceLevel)}</strong></div>)}</div>}
        </div>
        <div className="doctor-overview-card">
          <span className="profile-data-label">Historique HAD</span>
          {safeList(dossier.hadHistory).length === 0 ? <p className="mb-0 muted-text">Aucun test HAD enregistre.</p> : <div className="doctor-mini-stack mt-3">{safeList(dossier.hadHistory).slice(0, 6).map((test) => <div key={test.id} className="doctor-mini-row"><span>{formatDateTime(test.createdAt)}</span><strong>A {displayValue(test.anxietyScore)} · D {displayValue(test.depressionScore)}</strong></div>)}</div>}
        </div>
      </div>
    </div>
  );
  };

  const renderJournalSection = () => (
    <div className="doctor-dossier-section">
      <strong>Journal quotidien du patient</strong>
      {dailyTrend.length === 0 ? <p className="muted-text mt-3 mb-0">Aucune entree de journal pour le moment.</p> : <>
        <div className="doctor-chart-card mt-3">
          <div className="chart-card-head"><div><div className="hero-kicker">Journal</div><h3>Evolution quotidienne detaillee</h3></div></div>
          <div className="doctor-chart-wrap"><ResponsiveContainer><AreaChart data={dailyTrend}><CartesianGrid stroke={chartTheme.grid} strokeDasharray="4 4" /><XAxis dataKey="date" stroke={chartTheme.axis} /><YAxis stroke={chartTheme.axis} /><Tooltip contentStyle={chartTooltipStyle} /><Legend /><Area type="monotone" dataKey="cravings" stroke={chartTheme.cravings} fill={chartTheme.cravingsFillTop} strokeWidth={2} /><Area type="monotone" dataKey="stress" stroke={chartTheme.stress} fill={chartTheme.stressFillTop} strokeWidth={2} /><Line type="monotone" dataKey="cigarettes" stroke={chartTheme.cigarettes} strokeWidth={2} dot={false} /></AreaChart></ResponsiveContainer></div>
        </div>
        <div className="doctor-request-stack mt-3">{safeList(dossier.dailyReports).slice().sort((left, right) => String(right.reportDate).localeCompare(String(left.reportDate))).map((report) => <div key={report.id} className="doctor-request-card"><div className="doctor-request-card-head"><div><strong>{formatDate(report.reportDate)}</strong><p className="mb-0 muted-text">Cigarettes {displayValue(report.cigarettesSmoked)} · Cravings {displayValue(report.cravingsIntensity)} · Stress {displayValue(report.stressScore)}</p></div><span className="doctor-status-chip status-info">Journal</span></div><p className="muted-text">Humeur: {displayValue(report.mood)} · Symptomes: {displayValue(report.withdrawalSymptoms)} · Declencheurs: {displayValue(report.triggers)}</p></div>)}</div>
      </>}
    </div>
  );

  const renderConversationSection = () => (
    <div className="doctor-dossier-section">
      <strong>Conversation IA 24/7 et alertes</strong>
      {!dossier.supportConversation ? <p className="muted-text mt-3 mb-0">Aucune conversation IA rattachee au patient pour le moment.</p> : <>
        <div className="doctor-score-grid mt-3">
          <div className="doctor-score-card"><span>Risque detecte</span><strong>{displayValue(dossier.supportConversation.latestRiskLevel)}</strong><p>{displayValue(dossier.supportConversation.latestSummary)}</p></div>
          <div className="doctor-score-card"><span>Alertes pour le medecin</span><strong>{safeList(dossier.supportAlerts).length}</strong><p>Signaux critiques remontes</p></div>
        </div>
        {safeList(dossier.supportAlerts).length > 0 && <div className="doctor-request-stack mt-3">{safeList(dossier.supportAlerts).map((alert) => <div key={alert.id} className="doctor-request-card doctor-alert-card"><div className="doctor-request-card-head"><div><strong>{displayValue(alert.alertType)}</strong><p className="mb-0 muted-text">{formatDateTime(alert.createdAt)}</p></div><span className="doctor-status-chip status-pending">Alerte</span></div><p className="muted-text">{displayValue(alert.summary)}</p></div>)}</div>}
        <div className="support-thread mt-3">{safeList(dossier.supportConversation.messages).map((item) => <div key={item.id} className={`support-bubble ${item.senderType === "PATIENT" ? "is-patient" : item.senderType === "AI" ? "is-ai" : "is-system"}`}><span className="profile-data-label">{item.senderType}</span><p className="mb-0">{item.content}</p><small>{formatDateTime(item.createdAt)}{item.riskLevel ? ` · Risque ${item.riskLevel}` : ""}</small></div>)}</div>
      </>}
    </div>
  );

  const renderAiSection = () => (
    <>
      <div className="doctor-dossier-section">
        <strong>Note clinique IA</strong>
        <p>{dossier.clinicalNote?.medicalSummary || "Aucune note validee."}</p>
        <div className="doctor-note-critical">{dossier.clinicalNote?.complementaryNote || "Aucun point critique remonte pour le moment."}</div>
      </div>
      <div className="doctor-dossier-section">
        <strong>Resume global IA</strong>
        <p>{dossier.clinicalIntelligence?.globalSummary?.summary || "Aucun resume global disponible."}</p>
        <div className="doctor-focus-list">{safeList(dossier.clinicalIntelligence?.globalSummary?.doctorFocusPoints).map((item) => <span key={item} className="evaluation-goal-chip">{item}</span>)}</div>
        {dossier.clinicalIntelligence?.globalSummary?.patientReadiness && <div className="doctor-note-critical mt-3">Readiness patient: {dossier.clinicalIntelligence.globalSummary.patientReadiness}</div>}
      </div>
      <div className="doctor-dossier-section">
        <strong>Resumes de phase IA et lecture medecin</strong>
        {safeList(dossier.clinicalIntelligence?.phaseSummaries).length === 0 ? <p className="muted-text mb-0 mt-3">Aucun resume IA de phase pour le moment.</p> : <div className="doctor-plan-stack mt-3">{safeList(dossier.clinicalIntelligence?.phaseSummaries).map((phase) => <div key={phase.id} className="doctor-plan-card"><div className="doctor-plan-card-head"><div><span className="profile-data-label">Phase {phase.phaseId}</span><strong>{phase.phaseTitle}</strong></div><span className="doctor-status-chip status-accepted">IA + medecin</span></div><div className="profile-data-label mt-2">Resume IA visible patient et medecin</div><p>{phase.summary}</p>{safeList(phase.attentionPoints).length > 0 && <div className="doctor-focus-list">{safeList(phase.attentionPoints).map((item) => <span key={item} className="evaluation-goal-chip">{item}</span>)}</div>}<label className="form-label mt-3">Resume libre du medecin non visible par le patient</label><textarea className="form-control" rows="3" placeholder="Votre lecture clinique personnelle de cette phase..." value={phaseDoctorNotes[phase.id] || ""} onChange={(e) => setPhaseDoctorNotes((previous) => ({ ...previous, [phase.id]: e.target.value }))} /><div className="doctor-card-actions"><button type="button" className="btn btn-outline-dark" onClick={() => savePhaseDoctorNote(phase.id)}>Enregistrer la note phase</button></div></div>)}</div>}
      </div>
      <div className="doctor-dossier-section">
        <strong>Plans IA candidats</strong>
        {safeList(dossier.clinicalIntelligence?.planCandidates).length === 0 ? <p className="muted-text mb-0 mt-3">Aucun plan candidat disponible.</p> : <div className="doctor-plan-stack mt-3">{safeList(dossier.clinicalIntelligence?.planCandidates).map((plan) => (
          <div key={plan.id} className="doctor-plan-card">
            <div className="doctor-plan-card-head">
              <div>
                <span className="profile-data-label">{plan.track}</span>
                <strong>{plan.title}</strong>
              </div>
              <span className="doctor-status-chip status-pending">IA</span>
            </div>
            <p className="mb-2">{plan.rationale}</p>
            {plan.scientific_reference && (
              <div className="badge bg-primary-subtle text-primary mb-3 border border-primary-subtle d-flex align-items-center" style={{ width: 'fit-content', fontSize: '0.7rem' }}>
                <i className="bi bi-patch-check-fill me-1"></i> Source : {plan.scientific_reference}
              </div>
            )}
            <ul>{safeList(plan.steps).map((step) => <li key={step}>{step}</li>)}</ul>
            <textarea className="form-control" rows="2" placeholder="Note medecin avant validation" value={planNotes[plan.id] || ""} onChange={(e) => setPlanNotes((previous) => ({ ...previous, [plan.id]: e.target.value }))} />
            <div className="doctor-card-actions">
              <button type="button" className="btn btn-dark" onClick={() => validatePlan(plan.id)}>Valider ce plan</button>
            </div>
          </div>
        ))}</div>}
      </div>
    </>
  );
  const renderMedicalReportsSection = () => (
    <div className="doctor-dossier-section">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
        <div>
          <strong style={{ fontSize: "1.05rem", display: "block" }}>Historique des consultations médicales</strong>
          <p className="muted-text mb-0">Retrouvez ici tous les bilans et suivis effectués pour ce patient.</p>
        </div>
        <button type="button" className="btn btn-danger d-flex align-items-center gap-2 px-3 py-2 rounded-pill fw-semibold shadow-sm" onClick={exportClinicalReportPDF}>
          <i className="bi bi-file-earmark-pdf-fill fs-5" />
          <span>Exporter le Bilan Global Clinique (PDF)</span>
        </button>
      </div>
      {medicalReports.length === 0 ? (
        <p className="muted-text mt-3 mb-0">Aucun rapport médical enregistré pour ce patient.</p>
      ) : (
        <div className="doctor-request-stack mt-3">
          {medicalReports.map((report) => (
            <div key={report.id} className="doctor-request-card">
              <div className="doctor-request-card-head">
                <div>
                  <span className="profile-data-label">{formatDate(report.consultationDate)}</span>
                  <strong>{report.title}</strong>
                </div>
                <span className={`doctor-status-chip ${report.reportType === 'INITIAL_ASSESSMENT' ? 'status-accepted' : 'status-info'}`}>
                  {report.reportType === 'INITIAL_ASSESSMENT' ? 'Bilan Initial' : 'Suivi'}
                </span>
              </div>
              <div className="mt-2 small text-muted">
                 <strong>Consommation:</strong> {report.tobaccoConsumptionDaily} cig/j · <strong>CO:</strong> {report.coExpiredPpm} ppm
              </div>
              {report.observations && (
                <p className="mt-2 mb-0 small text-secondary">
                   <i className="bi bi-chat-left-text me-1"></i> {report.observations}
                </p>
              )}
              {report.prescribedNrt && (
                <div className="mt-2 d-flex flex-wrap gap-2">
                   {report.nrtPatch && <span className="badge bg-light text-dark border">Patch {report.nrtPatchDosage}</span>}
                   {report.nrtGum && <span className="badge bg-light text-dark border">Gommes {report.nrtGumDosage}</span>}
                   {report.nrtLozenge && <span className="badge bg-light text-dark border">Comprimés {report.nrtLozengeDosage}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAppointmentsSection = () => (
    <div className="doctor-dossier-section">
      <strong>Rendez-vous patient</strong>
      {safeList(dossier.appointments).length === 0 ? <p className="muted-text mb-0 mt-3">Aucun rendez-vous lie a ce patient pour le moment.</p> : <div className="doctor-request-stack mt-3">{safeList(dossier.appointments).map((appointment) => <div key={appointment.id} className="doctor-request-card"><div className="doctor-request-card-head"><div><strong>{formatDateTime(appointment.startsAt)}</strong><p className="mb-0 muted-text">{appointment.durationMinutes} min · {appointment.reason || "Motif non renseigne"}</p></div><span className={`doctor-status-chip status-${String(appointment.status || "").toLowerCase()}`}>{appointment.status}</span></div>{appointment.doctorNote && <p className="muted-text mb-0">{appointment.doctorNote}</p>}</div>)}</div>}
    </div>
  );

  const renderSelectedPatientContent = () => {
    if (dossierLoading) return <p className="muted-text mb-0">Chargement du dossier...</p>;
    if (dossierError) {
      return <div className="doctor-dossier-empty-state"><p className="mb-3">{dossierError}</p>{selectedPatientId && <button type="button" className="btn btn-dark" onClick={() => loadDossierFor(selectedPatientId)}>Recharger ce dossier</button>}</div>;
    }
    if (!dossier) return <p className="muted-text mb-0">Selectionnez une demande ou un patient pour consulter le fichier complet.</p>;
    switch (selectedPatientView) {
      case "profile": return renderProfileSection();
      case "evaluation": return renderEvaluationSection();
      case "dashboard": return renderDashboardSection();
      case "journal": return renderJournalSection();
      case "conversation": return renderConversationSection();
      case "ai": return renderAiSection();
      case "medical-reports": return renderMedicalReportsSection();
      case "medical-guidance": return <ClinicalGuidelinesSearch />;
      case "appointments": return renderAppointmentsSection();
      default: return renderOverview();
    }
  };

  return (
    <div className="container py-4 app-shell">
      {(loading || dossierLoading) && <LungLoader text={dossierLoading ? "Chargement du dossier patient..." : "Chargement de l'espace medecin..."} />}
      <div className="profile-page-header">
        <div>
          <div className="hero-kicker">Espace medecin</div>
          <h2 className="fw-bold mb-1">{mode === "profile" ? "Profil medecin et positionnement" : "Demandes, dossiers et validation de plans"}</h2>
          <p className="muted-text mb-0">{mode === "profile" ? "Les informations du medecin sont affichees en lecture seule." : "On passe sur un vrai workspace medecin: demandes a trier, liste claire des patients et acces direct au bon module du dossier."}</p>
        </div>
      </div>
      {message && <div className={`alert mt-3 ${message.type === "error" ? "alert-danger" : "alert-success"}`}>{message.text}</div>}
      {profile && !profile.active && <div className="alert alert-warning mt-3">Votre compte medecin est en attente de validation administrateur. Le compte n'est pas encore visible pour les patients.</div>}
      {loading ? <div className="muted-text mt-4">Chargement de l'espace medecin...</div> : mode === "profile" ? (
        <div className="mt-4">
          {profile ? (
            <section className="card form-card">
              <div className="profile-summary-header">
                <div>
                  <div className="section-title-sm">Profil medecin</div>
                  <p className="muted-text mb-0">Les informations personnelles et professionnelles ont été validées et sont affichées en lecture seule.</p>
                </div>
              </div>
              <div className="profile-card-grid mt-3">{doctorProfileCards.map(([label, value]) => <div key={label} className="profile-data-card"><span className="profile-data-label">{label}</span><strong>{displayValue(value)}</strong></div>)}</div>
              <div className="doctor-bio-card mt-4"><span className="profile-data-label">Bio / approche clinique</span><p className="mb-0">{displayValue(profile?.bio)}</p></div>
            </section>
          ) : (
            <div className="text-center text-muted p-4">Aucun profil médecin disponible.</div>
          )}
        </div>
      ) : (
        <div className="doctor-workspace-container mt-4">
          <div className="doctor-workspace-main-full">
            <section className="card form-card doctor-summary-strip">
              <div className="doctor-summary-card"><span className="profile-data-label">Demandes en attente</span><strong>{pendingRequests.length}</strong></div>
              <div className="doctor-summary-card"><span className="profile-data-label">Patients associes</span><strong>{patients.length}</strong></div>
              <div className="doctor-summary-card"><span className="profile-data-label">Specialite</span><strong>{displayValue(profile?.specialty || "Tabacologie")}</strong></div>
              <div className="doctor-summary-card"><span className="profile-data-label">Positionnement</span><strong>{displayValue(profile?.city ? `${profile.city}, ${profile.countryCode || "MA"}` : "A completer")}</strong></div>
            </section>
            {!profile && <div className="mt-4">{renderProfileForm()}</div>}
            <section className="card form-card mt-4">
              <div className="doctor-section-head"><div><div className="section-title-sm">Demandes patients</div><p className="muted-text mb-0">Le medecin voit chaque demande avec des actions explicites et un acces direct au dossier avant decision.</p></div></div>
              {pendingRequests.length === 0 ? <p className="muted-text mb-0 mt-3">Aucune demande pour le moment.</p> : <div className="doctor-table-shell mt-3"><table className="table table-borderless align-middle doctor-table"><thead><tr><th>Patient</th><th>Matching</th><th>Message</th><th>Demande</th><th className="text-end">Actions</th></tr></thead><tbody>{pendingRequests.map((request) => { const isBusy = decisionLoadingId === request.id; return <tr key={request.id} className={selectedPatientId === request.patientProfileId ? "is-selected" : ""}><td><button type="button" className="doctor-table-link" onClick={() => openPatientView(request.patientProfileId, "overview")}>{request.patientName}</button></td><td><span className="doctor-match-chip">{matchingCopy[request.matchingMode] || request.matchingMode || "Matching standard"}</span></td><td className="doctor-cell-copy">{request.patientMessage || "Aucun message."}</td><td>{formatDateTime(request.createdAt)}</td><td><div className="doctor-row-actions"><button type="button" className="btn btn-dark btn-sm" disabled={isBusy} onClick={() => decideRequest(request.id, "accept", request.patientProfileId)}>{isBusy ? "..." : "Accepter"}</button><button type="button" className="btn btn-outline-dark btn-sm" disabled={isBusy} onClick={() => decideRequest(request.id, "refuse", request.patientProfileId)}>Refuser</button><Dropdown align="end"><Dropdown.Toggle as="button" className="doctor-action-toggle" id={`request-actions-${request.id}`}><i className="bi bi-three-dots-vertical" /></Dropdown.Toggle><Dropdown.Menu className="doctor-action-menu"><Dropdown.Item onClick={() => openPatientView(request.patientProfileId, "overview")}>Vue clinique</Dropdown.Item><Dropdown.Item onClick={() => openPatientView(request.patientProfileId, "profile")}>Profil patient</Dropdown.Item><Dropdown.Item onClick={() => openPatientView(request.patientProfileId, "evaluation")}>Dossier medical</Dropdown.Item><Dropdown.Item onClick={() => openPatientView(request.patientProfileId, "dashboard")}>Dashboard</Dropdown.Item><Dropdown.Item onClick={() => openPatientView(request.patientProfileId, "conversation")}>Conversation IA</Dropdown.Item></Dropdown.Menu></Dropdown></div></td></tr>; })}</tbody></table></div>}
            </section>
            <section className="card form-card mt-4">
              <div className="doctor-section-head"><div><div className="section-title-sm">Patients associes</div><p className="muted-text mb-0">Une liste plus professionnelle: identite, progression, scores et menu d'actions cliniques.</p></div></div>
              {patients.length === 0 ? <p className="muted-text mb-0 mt-3">Aucun patient associe pour le moment.</p> : <div className="doctor-table-shell mt-3"><table className="table table-borderless align-middle doctor-table"><thead><tr><th>Patient</th><th>Naissance</th><th>Ville</th><th>Progression</th><th>Scores</th><th>Dependance</th><th className="text-end">Actions</th></tr></thead><tbody>{patients.map((patient) => { const pid = patient.patientProfileId || patient.id; const pName = patient.patientName || patient.name || "Patient"; const pEmail = patient.patientEmail || patient.email || ""; return <tr key={pid} className={selectedPatientId === pid ? "is-selected" : ""}><td><button type="button" className="doctor-table-link" onClick={() => openPatientView(pid, "overview")}>{pName}</button><div className="doctor-table-subcopy">{pEmail}</div></td><td><div>{formatDate(patient.dateOfBirth)}</div><div className="doctor-table-subcopy">{calculateAge(patient.dateOfBirth)}</div></td><td><div>{displayValue(patient.city)}</div><div className="doctor-table-subcopy">{displayValue(patient.occupation)}</div></td><td><div className="doctor-progress-inline">{buildProgressBadges(patient).map((item) => <span key={item.key} className={`doctor-progress-pill ${item.done ? "is-done" : ""}`}>{item.label}</span>)}</div></td><td className="doctor-cell-copy">
  <div>{buildPatientScoreLine(patient)}</div>
  {calculateRassScore(patient.fagerstromScore, patient.hadAnxietyScore, patient.hadDepressionScore) !== null && (
    <span className="badge mt-1" style={{ backgroundColor: getRassColor(calculateRassScore(patient.fagerstromScore, patient.hadAnxietyScore, patient.hadDepressionScore)), color: "#fff", borderRadius: "12px", fontSize: "0.75rem", padding: "3px 8px" }}>
      RASS : {calculateRassScore(patient.fagerstromScore, patient.hadAnxietyScore, patient.hadDepressionScore)}/10 ({getRassInterpretation(calculateRassScore(patient.fagerstromScore, patient.hadAnxietyScore, patient.hadDepressionScore))})
    </span>
  )}
</td><td><span className="doctor-status-chip status-info">{displayValue(patient.dependenceLevel || "A evaluer")}</span></td><td><div className="doctor-row-actions justify-content-end"><button type="button" className="btn btn-outline-dark btn-sm" onClick={() => openPatientView(pid, "overview")}>Ouvrir</button><Dropdown align="end"><Dropdown.Toggle as="button" className="doctor-action-toggle" id={`patient-actions-${pid}`}><i className="bi bi-three-dots-vertical" /></Dropdown.Toggle><Dropdown.Menu className="doctor-action-menu">{patientWorkspaceViews.map((view) => <Dropdown.Item key={view.key} onClick={() => openPatientView(pid, view.key)}>{view.label}</Dropdown.Item>)}</Dropdown.Menu></Dropdown></div></td></tr>; })}</tbody></table></div>}
            </section>
          </div>

          <Modal
            show={isPatientPanelOpen && !!selectedPatientId}
            onHide={() => setIsPatientPanelOpen(false)}
            size="xl"
            centered
            scrollable
            contentClassName="doctor-patient-modal-content"
          >
            <Modal.Header closeButton className="border-bottom pb-3">
              <Modal.Title className="section-title-sm mb-0">Espace patient sélectionné</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4 bg-light">
              <div className="doctor-overlay-panel-body p-0">
                {renderPatientHeader()}
                {renderPatientTabs()}
                <div className="doctor-dossier-stack mt-4">
                  {renderSelectedPatientContent()}
                </div>
              </div>
            </Modal.Body>
          </Modal>
        </div>
      )}
    </div>
  );
};

export default DoctorWorkspace;
