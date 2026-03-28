import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CLINICAL_PHASES } from "../data/clinicalJourney";
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

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/api/onboarding");
        if (data?.profile || data?.assessment) {
          setForm((prev) => ({
            ...prev,
            ...(data.profile || {}),
            ...(data.assessment || {})
          }));
          setScores(data.assessment || null);
        } else if (user?.profile) {
          setForm((prev) => ({ ...prev, ...user.profile }));
        }
      } catch (err) {
        if (user?.profile) {
          setForm((prev) => ({ ...prev, ...user.profile }));
        }
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    setVisitedSteps((previous) => (previous.includes(step) ? previous : [...previous, step]));
  }, [step]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const { data } = await api.post("/api/onboarding", payload);
      setScores(data?.assessment || null);
      await refetch();
      setMessage({ type: "success", text: "Profiling enregistre. Vous pouvez naviguer dans l'application." });
    } catch (err) {
      const apiError = err?.response?.data?.error || err?.response?.data?.message;
      setMessage({ type: "error", text: apiError ? `Erreur: ${apiError}` : "Erreur lors de l'enregistrement. Verifiez les champs." });
    }
  };

  const selectedPhase = CLINICAL_PHASES.find((item) => item.id === step) || CLINICAL_PHASES[0];
  const progressPercent = user?.profile?.onboardingComplete
    ? 100
    : Math.round((visitedSteps.length / CLINICAL_PHASES.length) * 100);

  return (
    <div className="container py-4 app-shell">
      <div className="evaluation-page-header">
        <div>
          <div className="hero-kicker">Mandatory Evaluation Timeline</div>
          <h2 className="fw-bold mb-1">Consultation initiale du patient</h2>
          <div className="muted-text">
            Le profil personnel reste distinct. Toute la matiere clinique, tabagique et sociale vit dans cette timeline.
          </div>
        </div>
        <div className="evaluation-status-stack">
          <div className="evaluation-status-pill">
            <span>Signal 12</span>
            <strong>{Math.max(scores?.alcoholScore || 0, scores?.honcScore || 0, scores?.cageScore || 0)}</strong>
          </div>
          <div className={`evaluation-status-pill ${user?.profile?.onboardingComplete ? "is-complete" : ""}`}>
            <span>Profiling</span>
            <strong>{user?.profile?.onboardingComplete ? "Complet" : `${progressPercent}%`}</strong>
          </div>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.type === "error" ? "alert-danger" : "alert-success"}`}>
          {message.text}
        </div>
      )}

      {scores && (
        <div className="alert alert-info">
          CAGE: {scores.cageScore ?? "-"} {scores.cagePositive ? "(positif)" : ""}
          {" | "}HONC: {scores.honcScore ?? "-"} {scores.honcHighDependence ? "(dependance forte)" : ""}
          {" | "}EPICES: {scores.epicesScore ?? "-"}
          {" | "}Alcool: {scores.alcoholScore ?? "-"}
        </div>
      )}

      <div className="evaluation-layout">
        <aside className="evaluation-timeline">
          {CLINICAL_PHASES.map((phase) => {
            const isActive = phase.id === step;
            const isVisited = visitedSteps.includes(phase.id);
            return (
              <button
                key={phase.id}
                type="button"
                className={`timeline-phase-card ${isActive ? "is-active" : ""} ${isVisited ? "is-visited" : ""}`}
                onClick={() => setStep(phase.id)}
              >
                <span className="timeline-phase-index">{phase.id}</span>
                <div>
                  <div className="timeline-phase-label">{phase.label}</div>
                  <strong>{phase.title}</strong>
                  <p>{phase.questionRange}</p>
                </div>
              </button>
            );
          })}
        </aside>

        <form onSubmit={handleSubmit} className="card form-card p-3 evaluation-main-panel">
          <div className="evaluation-main-head">
            <div>
              <div className="evaluation-phase-kicker">{selectedPhase.label}</div>
              <h3>{selectedPhase.title}</h3>
              <p className="muted-text mb-0">{selectedPhase.summary}</p>
            </div>
            <div className="evaluation-range-chip">{selectedPhase.questionRange}</div>
          </div>

          <div className="evaluation-goals-inline">
            {selectedPhase.goals.map((goal) => (
              <div key={goal} className="evaluation-goal-chip">
                <i className="bi bi-check2-circle" />
                <span>{goal}</span>
              </div>
            ))}
          </div>

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
                  <strong>Dependency scoring timeline</strong>
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
          <button type="button" className="btn btn-outline-dark" onClick={() => setStep((prev) => Math.max(1, prev - 1))} disabled={step === 1}>
            Phase precedente
          </button>
          {step < CLINICAL_PHASES.length ? (
            <button type="button" className="btn btn-dark" onClick={() => setStep((prev) => Math.min(CLINICAL_PHASES.length, prev + 1))}>
              Phase suivante
            </button>
          ) : (
            <button type="submit" className="btn btn-dark">
              Enregistrer l'evaluation
            </button>
          )}
          </div>
        </form>
      </div>

      {user?.profile?.onboardingComplete && (
        <div className="mt-3 text-end">
          <button className="btn btn-outline-dark" onClick={() => navigate("/dashboard")}>
            Aller au tableau de bord
          </button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
