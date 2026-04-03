import React, { useEffect, useMemo, useState } from "react";
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

const emptyForm = {
  city: "",
  countryCode: "",
  specialty: "",
  bio: "",
  acceptsTeleconsultation: true,
  yearsExperience: ""
};

const requestStatusCopy = {
  PENDING: "En attente",
  ACCEPTED: "Acceptee",
  REFUSED: "Refusee",
  CANCELLED: "Annulee"
};

const matchingCopy = {
  SAME_CITY: "Meme ville",
  SAME_COUNTRY: "Maroc",
  TELECONSULTATION: "Teleconsultation"
};

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
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
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

const chartTooltipStyle = chartTheme.tooltip;

const DoctorWorkspace = ({ mode = "workspace" }) => {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState({});
  const [planNotes, setPlanNotes] = useState({});
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dossierLoading, setDossierLoading] = useState(false);

  const loadWorkspace = async () => {
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

    setSelectedPatientId((previous) => {
      if (previous) return previous;
      const firstPending = dedupeRequestsByPatient(requestData.filter((item) => item.status === "PENDING"))[0];
      return firstPending?.patientProfileId || patientData[0]?.patientProfileId || null;
    });
    setLoading(false);
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  useEffect(() => {
    if (mode !== "workspace" || !selectedPatientId) {
      setDossier(null);
      return;
    }

    const loadDossier = async () => {
      setDossierLoading(true);
      try {
        const { data } = await api.get(`/api/doctors/patients/${selectedPatientId}/dossier`);
        setDossier(data);
      } catch (error) {
        setDossier(null);
      } finally {
        setDossierLoading(false);
      }
    };

    loadDossier();
  }, [mode, selectedPatientId]);

  const pendingRequests = useMemo(
    () => dedupeRequestsByPatient(requests.filter((request) => request.status === "PENDING")),
    [requests]
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
      [...(dossier?.hadHistory || [])]
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
      [...(dossier?.fagerstromHistory || [])]
        .reverse()
        .map((test) => ({
          date: formatDate(test.createdAt),
          score: test.totalScore ?? 0
        })),
    [dossier]
  );

  const dailyTrend = useMemo(
    () =>
      [...(dossier?.dailyReports || [])]
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
    ["Score de suivi", profile?.successScore ?? "A definir"]
  ];

  const patientCards = [
    ["Nom complet", dossier?.patientName],
    ["Email", dossier?.patientEmail],
    ["Age", calculateAge(dossier?.profile?.dateOfBirth)],
    ["Date de naissance", dossier?.profile?.dateOfBirth],
    ["Sexe", dossier?.profile?.sex],
    ["Taille", dossier?.profile?.heightCm ? `${dossier.profile.heightCm} cm` : null],
    ["Poids", dossier?.profile?.weightKg ? `${dossier.profile.weightKg} kg` : null],
    ["Ville", dossier?.profile?.city],
    ["Profession", dossier?.profile?.occupation],
    ["Cigarettes / jour", dossier?.profile?.cigarettesPerDay],
    ["Age debut tabac", dossier?.profile?.smokingStartAge],
    ["Dependance", dossier?.profile?.dependenceLevel]
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

  const decideRequest = async (requestId, action, patientProfileId) => {
    setMessage(null);
    try {
      await api.post(`/api/doctors/requests/${requestId}/${action}`, {
        note: decisionNotes[requestId] || null
      });
      await loadWorkspace();
      if (patientProfileId) {
        setSelectedPatientId(patientProfileId);
      }
      setMessage({
        type: "success",
        text: action === "accept" ? "Patient accepte." : "Demande refusee."
      });
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Decision medecin impossible pour le moment." });
    }
  };

  const validatePlan = async (candidateId) => {
    setMessage(null);
    try {
      await api.post(`/api/clinical-intelligence/plans/${candidateId}/validate`, {
        doctorNote: planNotes[candidateId] || null
      });
      if (selectedPatientId) {
        const { data } = await api.get(`/api/doctors/patients/${selectedPatientId}/dossier`);
        setDossier(data);
      }
      setMessage({ type: "success", text: "Plan valide et rattache au patient." });
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Validation du plan impossible." });
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
        <div className="col-12 col-md-6">
          <label className="form-label">Ville</label>
          <input className="form-control" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label">Pays</label>
          <input className="form-control" value={form.countryCode} onChange={(e) => setForm((p) => ({ ...p, countryCode: e.target.value }))} />
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label">Specialite</label>
          <input className="form-control" value={form.specialty} onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))} />
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label">Annees d'experience</label>
          <input className="form-control" type="number" value={form.yearsExperience} onChange={(e) => setForm((p) => ({ ...p, yearsExperience: e.target.value }))} />
        </div>
        <div className="col-12 form-check">
          <input
            id="doctorTeleconsultation"
            className="form-check-input"
            type="checkbox"
            checked={!!form.acceptsTeleconsultation}
            onChange={(e) => setForm((p) => ({ ...p, acceptsTeleconsultation: e.target.checked }))}
          />
          <label className="form-check-label" htmlFor="doctorTeleconsultation">Accepte la teleconsultation</label>
        </div>
        <div className="col-12">
          <label className="form-label">Bio / approche clinique</label>
          <textarea className="form-control" rows="4" value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} />
        </div>
        <div className="col-12 d-flex justify-content-end">
          <button className="btn btn-dark">Enregistrer le profil</button>
        </div>
      </form>
    </section>
  );

  return (
    <div className="container py-4 app-shell">
      <div className="profile-page-header">
        <div>
          <div className="hero-kicker">Espace medecin</div>
          <h2 className="fw-bold mb-1">
            {mode === "profile" ? "Profil medecin et positionnement" : "Demandes, dossiers et validation de plans"}
          </h2>
          <p className="muted-text mb-0">
            {mode === "profile"
              ? "Les informations du medecin sont affichees en lecture. Le formulaire ne revient que si tu choisis de modifier le profil."
              : "Le medecin doit voir les demandes patient, consulter le dossier complet et suivre l'avancement visuellement."}
          </p>
        </div>
      </div>

      {message && (
        <div className={`alert mt-3 ${message.type === "error" ? "alert-danger" : "alert-success"}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="muted-text mt-4">Chargement de l'espace medecin...</div>
      ) : mode === "profile" ? (
        <div className="mt-4">
          {profile && !isEditingProfile ? (
            <section className="card form-card">
              <div className="profile-summary-header">
                <div>
                  <div className="section-title-sm">Profil medecin</div>
                  <p className="muted-text mb-0">Vue lecture du profil praticien.</p>
                </div>
                <button className="btn btn-dark btn-sm" onClick={() => setIsEditingProfile(true)}>
                  Editer le profil
                </button>
              </div>
              <div className="profile-card-grid mt-3">
                {doctorProfileCards.map(([label, value]) => (
                  <div key={label} className="profile-data-card">
                    <span className="profile-data-label">{label}</span>
                    <strong>{displayValue(value)}</strong>
                  </div>
                ))}
              </div>
              <div className="doctor-bio-card mt-4">
                <span className="profile-data-label">Bio / approche clinique</span>
                <p className="mb-0">{displayValue(profile?.bio)}</p>
              </div>
            </section>
          ) : (
            renderProfileForm()
          )}
        </div>
      ) : (
        <div className="doctor-workspace-grid mt-4">
          <div className="doctor-workspace-main">
            <section className="card form-card doctor-summary-strip">
              <div className="doctor-summary-card"><span className="profile-data-label">Demandes en attente</span><strong>{pendingRequests.length}</strong></div>
              <div className="doctor-summary-card"><span className="profile-data-label">Patients associes</span><strong>{patients.length}</strong></div>
              <div className="doctor-summary-card"><span className="profile-data-label">Specialite</span><strong>{displayValue(profile?.specialty || "Tabacologie")}</strong></div>
              <div className="doctor-summary-card"><span className="profile-data-label">Positionnement</span><strong>{displayValue(profile?.city ? `${profile.city}, ${profile.countryCode || "MA"}` : "A completer")}</strong></div>
            </section>

            {!profile && <div className="mt-4">{renderProfileForm()}</div>}

            <section className="card form-card mt-4">
              <div className="section-title-sm">Demandes patients en attente</div>
              {pendingRequests.length === 0 ? (
                <p className="muted-text mb-0">Aucune demande pour le moment.</p>
              ) : (
                <div className="doctor-request-stack mt-3">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="doctor-request-card">
                      <div className="doctor-request-card-head">
                        <div>
                          <strong>{request.patientName}</strong>
                          <p className="mb-0 muted-text">{matchingCopy[request.matchingMode] || request.matchingMode} · score {request.matchingScore ?? 0}</p>
                        </div>
                        <span className="doctor-status-chip status-pending">{requestStatusCopy[request.status] || request.status}</span>
                      </div>
                      <p className="muted-text">{request.patientMessage || "Aucun message additionnel."}</p>
                      <textarea className="form-control" rows="2" placeholder="Note medecin optionnelle" value={decisionNotes[request.id] || ""} onChange={(e) => setDecisionNotes((p) => ({ ...p, [request.id]: e.target.value }))} />
                      <div className="doctor-card-actions">
                        <button type="button" className="btn btn-outline-dark" onClick={() => setSelectedPatientId(request.patientProfileId)}>Consulter le dossier</button>
                        <button type="button" className="btn btn-dark" onClick={() => decideRequest(request.id, "accept", request.patientProfileId)}>Accepter</button>
                        <button type="button" className="btn btn-outline-dark" onClick={() => decideRequest(request.id, "refuse", request.patientProfileId)}>Refuser</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="card form-card mt-4">
              <div className="section-title-sm">Patients associes</div>
              {patients.length === 0 ? (
                <p className="muted-text mb-0">Aucun patient associe pour le moment.</p>
              ) : (
                <div className="doctor-patient-list mt-3">
                  {patients.map((patient) => (
                    <button key={patient.patientProfileId} type="button" className={`doctor-patient-item ${selectedPatientId === patient.patientProfileId ? "is-active" : ""}`} onClick={() => setSelectedPatientId(patient.patientProfileId)}>
                      <div>
                        <strong>{patient.patientName}</strong>
                        <p className="mb-0 muted-text">Fagerstrom {patient.fagerstromScore ?? "-"} · HAD A {patient.hadAnxietyScore ?? "-"} · HAD D {patient.hadDepressionScore ?? "-"}</p>
                      </div>
                      <span className="doctor-status-chip status-accepted">Associe</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="doctor-dossier-panel">
            <section className="card form-card">
              <div className="section-title-sm">Dossier patient selectionne</div>
              {dossierLoading ? (
                <p className="muted-text mb-0">Chargement du dossier...</p>
              ) : !dossier ? (
                <p className="muted-text mb-0">Selectionnez une demande ou un patient pour consulter le fichier complet.</p>
              ) : (
                <div className="doctor-dossier-stack">
                  <div className="doctor-dossier-head">
                    <div>
                      <strong>{dossier.patientName}</strong>
                      <p className="muted-text mb-0">{dossier.patientEmail}</p>
                    </div>
                    <span className={`doctor-status-chip ${selectedPendingRequest ? "status-pending" : "status-accepted"}`}>{selectedPendingRequest ? "Demande a trier" : "Patient associe"}</span>
                  </div>

                  {selectedPendingRequest && (
                    <div className="doctor-dossier-section">
                      <strong>Decision rapide</strong>
                      <p className="muted-text">Le medecin peut lire tout le dossier avant de prendre une decision.</p>
                      <textarea className="form-control" rows="2" placeholder="Note medecin optionnelle" value={decisionNotes[selectedPendingRequest.id] || ""} onChange={(e) => setDecisionNotes((p) => ({ ...p, [selectedPendingRequest.id]: e.target.value }))} />
                      <div className="doctor-card-actions">
                        <button type="button" className="btn btn-dark" onClick={() => decideRequest(selectedPendingRequest.id, "accept", selectedPendingRequest.patientProfileId)}>Accepter ce patient</button>
                        <button type="button" className="btn btn-outline-dark" onClick={() => decideRequest(selectedPendingRequest.id, "refuse", selectedPendingRequest.patientProfileId)}>Refuser</button>
                      </div>
                    </div>
                  )}

                  <div className="doctor-dossier-section">
                    <strong>Informations personnelles</strong>
                    <div className="profile-card-grid mt-3">
                      {patientCards.map(([label, value]) => (
                        <div key={label} className="profile-data-card">
                          <span className="profile-data-label">{label}</span>
                          <strong>{displayValue(value)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="doctor-dossier-section">
                    <strong>Dashboard patient</strong>
                    <div className="doctor-score-grid mt-3">
                      <div className="doctor-score-card"><span>Fagerstrom</span><strong>{displayValue(dossier.latestFagerstrom?.totalScore)}</strong><p>{displayValue(dossier.latestFagerstrom?.dependenceLevel)}</p></div>
                      <div className="doctor-score-card"><span>HAD Anxiete</span><strong>{displayValue(dossier.latestHad?.anxietyScore)}</strong><p>{displayValue(dossier.latestHad?.anxietyInterpretation)}</p></div>
                      <div className="doctor-score-card"><span>HAD Depression</span><strong>{displayValue(dossier.latestHad?.depressionScore)}</strong><p>{displayValue(dossier.latestHad?.depressionInterpretation)}</p></div>
                      <div className="doctor-score-card"><span>Journal quotidien</span><strong>{dailyTrend.length}</strong><p>Entrees disponibles</p></div>
                    </div>
                    <div className="doctor-dashboard-grid mt-3">
                      <div className="doctor-chart-card">
                        <div className="chart-card-head"><div><div className="hero-kicker">HAD</div><h3>Anxiete vs Depression</h3></div></div>
                        <div className="doctor-chart-wrap">{hadTrend.length === 0 ? <p className="muted-text mb-0">Aucun historique HAD.</p> : <ResponsiveContainer><LineChart data={hadTrend}><CartesianGrid stroke={chartTheme.grid} strokeDasharray="4 4" /><XAxis dataKey="date" stroke={chartTheme.axis} /><YAxis stroke={chartTheme.axis} /><Tooltip contentStyle={chartTooltipStyle} /><Legend /><Line type="monotone" dataKey="anxiete" stroke={chartTheme.anxiety} strokeWidth={3} dot={{ r: 3 }} /><Line type="monotone" dataKey="depression" stroke={chartTheme.depression} strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer>}</div>
                      </div>
                      <div className="doctor-chart-card">
                        <div className="chart-card-head"><div><div className="hero-kicker">Dependance</div><h3>Evolution Fagerstrom</h3></div></div>
                        <div className="doctor-chart-wrap">{fagerTrend.length === 0 ? <p className="muted-text mb-0">Aucun historique Fagerstrom.</p> : <ResponsiveContainer><LineChart data={fagerTrend}><CartesianGrid stroke={chartTheme.grid} strokeDasharray="4 4" /><XAxis dataKey="date" stroke={chartTheme.axis} /><YAxis stroke={chartTheme.axis} /><Tooltip contentStyle={chartTooltipStyle} /><Line type="monotone" dataKey="score" stroke={chartTheme.dependence} strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer>}</div>
                      </div>
                      <div className="doctor-chart-card doctor-chart-card-wide">
                        <div className="chart-card-head"><div><div className="hero-kicker">Journal</div><h3>Cravings, stress et cigarettes</h3></div></div>
                        <div className="doctor-chart-wrap">{dailyTrend.length === 0 ? <p className="muted-text mb-0">Aucune donnee quotidienne.</p> : <ResponsiveContainer><AreaChart data={dailyTrend}><CartesianGrid stroke={chartTheme.grid} strokeDasharray="4 4" /><XAxis dataKey="date" stroke={chartTheme.axis} /><YAxis stroke={chartTheme.axis} /><Tooltip contentStyle={chartTooltipStyle} /><Legend /><Area type="monotone" dataKey="cravings" stroke={chartTheme.cravings} fill={chartTheme.cravingsFillTop} strokeWidth={2} /><Area type="monotone" dataKey="stress" stroke={chartTheme.stress} fill={chartTheme.stressFillTop} strokeWidth={2} /><Line type="monotone" dataKey="cigarettes" stroke={chartTheme.cigarettes} strokeWidth={2} dot={false} /></AreaChart></ResponsiveContainer>}</div>
                      </div>
                    </div>
                  </div>

                  <div className="doctor-dossier-section">
                    <strong>Evaluation initiale complete</strong>
                    <div className="doctor-dossier-answers mt-3">
                      {assessmentEntries.length === 0 ? <p className="muted-text mb-0">Aucune reponse d'evaluation disponible.</p> : assessmentEntries.map(([key, value]) => (
                        <div key={key} className="doctor-answer-row">
                          <span>{humanize(key)}</span>
                          <strong>{displayValue(value)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="doctor-dossier-section">
                    <strong>Note clinique IA</strong>
                    <p>{dossier.clinicalNote?.medicalSummary || "Aucune note validee."}</p>
                    <div className="doctor-note-critical">{dossier.clinicalNote?.complementaryNote || "Aucun point critique remonte pour le moment."}</div>
                  </div>

                  <div className="doctor-dossier-section">
                    <strong>Resume global IA</strong>
                    <p>{dossier.clinicalIntelligence?.globalSummary?.summary || "Aucun resume global disponible."}</p>
                    <div className="doctor-focus-list">
                      {(dossier.clinicalIntelligence?.globalSummary?.doctorFocusPoints || []).map((item) => <span key={item} className="evaluation-goal-chip">{item}</span>)}
                    </div>
                  </div>

                  <div className="doctor-dossier-section">
                    <strong>Plans IA candidats</strong>
                    <div className="doctor-plan-stack mt-3">
                      {(dossier.clinicalIntelligence?.planCandidates || []).map((plan) => (
                        <div key={plan.id} className="doctor-plan-card">
                          <div className="doctor-plan-card-head">
                            <div><span className="profile-data-label">{plan.track}</span><strong>{plan.title}</strong></div>
                            <span className="doctor-status-chip status-pending">IA</span>
                          </div>
                          <p>{plan.rationale}</p>
                          <ul>{(plan.steps || []).map((step) => <li key={step}>{step}</li>)}</ul>
                          <textarea className="form-control" rows="2" placeholder="Note medecin avant validation" value={planNotes[plan.id] || ""} onChange={(e) => setPlanNotes((p) => ({ ...p, [plan.id]: e.target.value }))} />
                          <div className="doctor-card-actions"><button type="button" className="btn btn-dark" onClick={() => validatePlan(plan.id)}>Valider ce plan</button></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
};

export default DoctorWorkspace;
