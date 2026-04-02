import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const humanize = (value) =>
  String(value || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());

const displayValue = (value) => {
  if (value === true) return "Oui";
  if (value === false) return "Non";
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined || value === "") return "Non renseigne";
  return String(value);
};

const DoctorWorkspace = ({ mode = "workspace" }) => {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [form, setForm] = useState({
    city: "",
    countryCode: "",
    specialty: "",
    bio: "",
    acceptsTeleconsultation: true,
    yearsExperience: ""
  });
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
      api.get("/api/doctors/patients")
    ]);

    const profileData = profileResp.status === "fulfilled" ? profileResp.value.data : null;
    setProfile(profileData);
    setRequests(requestsResp.status === "fulfilled" ? requestsResp.value.data || [] : []);
    const patientRows = patientsResp.status === "fulfilled" ? patientsResp.value.data || [] : [];
    setPatients(patientRows);

    setForm({
      city: profileData?.city || "",
      countryCode: profileData?.countryCode || "",
      specialty: profileData?.specialty || "",
      bio: profileData?.bio || "",
      acceptsTeleconsultation: profileData?.acceptsTeleconsultation ?? true,
      yearsExperience: profileData?.yearsExperience || ""
    });

    if (!selectedPatientId && patientRows.length > 0) {
      setSelectedPatientId(patientRows[0].patientProfileId);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  useEffect(() => {
    if (!selectedPatientId) {
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
  }, [selectedPatientId]);

  const assessmentEntries = useMemo(() => {
    if (!dossier?.assessment) return [];
    return Object.entries(dossier.assessment).filter(([, value]) => value !== null && value !== "");
  }, [dossier]);

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
      if (action === "accept" && patientProfileId) {
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

  const orderedSections = mode === "profile"
    ? ["profile", "requests", "patients"]
    : ["requests", "patients", "profile"];

  return (
    <div className="container py-4 app-shell">
      <div className="profile-page-header">
        <div>
          <div className="hero-kicker">Doctor workspace</div>
          <h2 className="fw-bold mb-1">Lecture clinique, tri des demandes et validation therapeutique</h2>
          <p className="muted-text mb-0">
            Le medecin lit le dossier complet, consulte les notes IA, compare les plans et valide une seule strategie finale.
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
      ) : (
        <div className="doctor-workspace-grid mt-4">
          <div className="doctor-workspace-main">
            {orderedSections.includes("requests") && (
              <section className="card form-card">
                <div className="section-title-sm">Demandes patients en attente</div>
                {requests.length === 0 ? (
                  <p className="muted-text mb-0">Aucune demande pour le moment.</p>
                ) : (
                  <div className="doctor-request-stack">
                    {requests.map((request) => (
                      <div key={request.id} className="doctor-request-card">
                        <div className="doctor-request-card-head">
                          <div>
                            <strong>{request.patientName}</strong>
                            <p className="mb-0 muted-text">
                              {request.matchingMode} · score {request.matchingScore ?? 0}
                            </p>
                          </div>
                          <span className={`doctor-status-chip status-${request.status?.toLowerCase()}`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="muted-text">{request.patientMessage || "Aucun message additionnel."}</p>
                        <textarea
                          className="form-control"
                          rows="2"
                          placeholder="Note medecin optionnelle"
                          value={decisionNotes[request.id] || ""}
                          onChange={(event) =>
                            setDecisionNotes((previous) => ({ ...previous, [request.id]: event.target.value }))
                          }
                        />
                        <div className="doctor-card-actions">
                          <button
                            type="button"
                            className="btn btn-dark"
                            onClick={() => decideRequest(request.id, "accept", request.patientProfileId)}
                          >
                            Accepter
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-dark"
                            onClick={() => decideRequest(request.id, "refuse")}
                          >
                            Refuser
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {orderedSections.includes("patients") && (
              <section className="card form-card mt-4">
                <div className="section-title-sm">Patients associes</div>
                {patients.length === 0 ? (
                  <p className="muted-text mb-0">Aucun patient associe pour le moment.</p>
                ) : (
                  <div className="doctor-patient-list">
                    {patients.map((patient) => (
                      <button
                        key={patient.patientProfileId}
                        type="button"
                        className={`doctor-patient-item ${selectedPatientId === patient.patientProfileId ? "is-active" : ""}`}
                        onClick={() => setSelectedPatientId(patient.patientProfileId)}
                      >
                        <div>
                          <strong>{patient.patientName}</strong>
                          <p className="mb-0 muted-text">
                            Fagerstrom {patient.fagerstromScore ?? "-"} · HAD A {patient.hadAnxietyScore ?? "-"} · HAD D {patient.hadDepressionScore ?? "-"}
                          </p>
                        </div>
                        <span className={`doctor-status-chip ${patient.onboardingComplete ? "status-accepted" : "status-pending"}`}>
                          {patient.onboardingComplete ? "Dossier complet" : "Evaluation en cours"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            {orderedSections.includes("profile") && (
              <section className="card form-card mt-4">
                <div className="section-title-sm">Profil medecin</div>
                <form className="row g-3" onSubmit={saveProfile}>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Ville</label>
                    <input
                      className="form-control"
                      value={form.city}
                      onChange={(event) => setForm((previous) => ({ ...previous, city: event.target.value }))}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Pays</label>
                    <input
                      className="form-control"
                      value={form.countryCode}
                      onChange={(event) => setForm((previous) => ({ ...previous, countryCode: event.target.value }))}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Specialite</label>
                    <input
                      className="form-control"
                      value={form.specialty}
                      onChange={(event) => setForm((previous) => ({ ...previous, specialty: event.target.value }))}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Annees d'experience</label>
                    <input
                      className="form-control"
                      type="number"
                      value={form.yearsExperience}
                      onChange={(event) => setForm((previous) => ({ ...previous, yearsExperience: event.target.value }))}
                    />
                  </div>
                  <div className="col-12 form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={!!form.acceptsTeleconsultation}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, acceptsTeleconsultation: event.target.checked }))
                      }
                    />
                    <label className="form-check-label">Accepte la teleconsultation</label>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Bio / approche clinique</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={form.bio}
                      onChange={(event) => setForm((previous) => ({ ...previous, bio: event.target.value }))}
                    />
                  </div>
                  <div className="col-12 d-flex justify-content-end">
                    <button className="btn btn-dark">Enregistrer le profil</button>
                  </div>
                </form>
              </section>
            )}
          </div>

          <aside className="doctor-dossier-panel">
            <section className="card form-card">
              <div className="section-title-sm">Dossier patient selectionne</div>
              {dossierLoading ? (
                <p className="muted-text mb-0">Chargement du dossier...</p>
              ) : !dossier ? (
                <p className="muted-text mb-0">Selectionnez un patient accepte pour lire son dossier.</p>
              ) : (
                <div className="doctor-dossier-stack">
                  <div className="doctor-dossier-head">
                    <div>
                      <strong>{dossier.patientName}</strong>
                      <p className="muted-text mb-0">{dossier.patientEmail}</p>
                    </div>
                    <span className="doctor-status-chip status-accepted">Patient associe</span>
                  </div>

                  <div className="profile-card-grid">
                    {[
                      ["Ville", dossier.profile?.city],
                      ["Pays", dossier.profile?.countryCode],
                      ["Profession", dossier.profile?.occupation],
                      ["Cigarettes / jour", dossier.profile?.cigarettesPerDay],
                      ["Age debut tabac", dossier.profile?.smokingStartAge],
                      ["Dependance", dossier.profile?.dependenceLevel]
                    ].map(([label, value]) => (
                      <div key={label} className="profile-data-card">
                        <span className="profile-data-label">{label}</span>
                        <strong>{displayValue(value)}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="doctor-dossier-section">
                    <strong>Derniers tests</strong>
                    <div className="doctor-score-grid">
                      <div className="doctor-score-card">
                        <span>Fagerstrom</span>
                        <strong>{displayValue(dossier.latestFagerstrom?.totalScore)}</strong>
                        <p>{displayValue(dossier.latestFagerstrom?.dependenceLevel)}</p>
                      </div>
                      <div className="doctor-score-card">
                        <span>HAD Anxiete</span>
                        <strong>{displayValue(dossier.latestHad?.anxietyScore)}</strong>
                        <p>{displayValue(dossier.latestHad?.anxietyInterpretation)}</p>
                      </div>
                      <div className="doctor-score-card">
                        <span>HAD Depression</span>
                        <strong>{displayValue(dossier.latestHad?.depressionScore)}</strong>
                        <p>{displayValue(dossier.latestHad?.depressionInterpretation)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="doctor-dossier-section">
                    <strong>Questionnaire d'evaluation</strong>
                    <div className="doctor-dossier-answers">
                      {assessmentEntries.map(([key, value]) => (
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
                    <div className="doctor-note-critical">
                      {dossier.clinicalNote?.complementaryNote || "Aucun point critique remonte pour le moment."}
                    </div>
                  </div>

                  <div className="doctor-dossier-section">
                    <strong>Resume global IA</strong>
                    <p>{dossier.clinicalIntelligence?.globalSummary?.summary || "Aucun resume global disponible."}</p>
                    <div className="doctor-focus-list">
                      {(dossier.clinicalIntelligence?.globalSummary?.doctorFocusPoints || []).map((item) => (
                        <span key={item} className="evaluation-goal-chip">{item}</span>
                      ))}
                    </div>
                  </div>

                  <div className="doctor-dossier-section">
                    <strong>Resumes par phase</strong>
                    <div className="doctor-phase-stack">
                      {(dossier.clinicalIntelligence?.phaseSummaries || []).map((phase) => (
                        <div key={phase.id} className="doctor-phase-card">
                          <div className="doctor-phase-card-head">
                            <span>{phase.phaseTitle}</span>
                            <strong>Phase {phase.phaseId}</strong>
                          </div>
                          <p>{phase.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="doctor-dossier-section">
                    <strong>Plans IA candidats</strong>
                    <div className="doctor-plan-stack">
                      {(dossier.clinicalIntelligence?.planCandidates || []).map((plan) => (
                        <div key={plan.id} className="doctor-plan-card">
                          <div className="doctor-plan-card-head">
                            <div>
                              <span className="profile-data-label">{plan.track}</span>
                              <strong>{plan.title}</strong>
                            </div>
                            <span className="doctor-status-chip status-pending">IA</span>
                          </div>
                          <p>{plan.rationale}</p>
                          <ul>
                            {(plan.steps || []).map((step) => (
                              <li key={step}>{step}</li>
                            ))}
                          </ul>
                          <textarea
                            className="form-control"
                            rows="2"
                            placeholder="Ajustement ou note medecin avant validation"
                            value={planNotes[plan.id] || ""}
                            onChange={(event) =>
                              setPlanNotes((previous) => ({ ...previous, [plan.id]: event.target.value }))
                            }
                          />
                          <div className="doctor-card-actions">
                            <button type="button" className="btn btn-dark" onClick={() => validatePlan(plan.id)}>
                              Valider ce plan
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {dossier.clinicalIntelligence?.validatedPlan && (
                    <div className="doctor-dossier-section">
                      <strong>Plan valide</strong>
                      <div className="doctor-plan-card validated">
                        <div className="doctor-plan-card-head">
                          <div>
                            <span className="profile-data-label">{dossier.clinicalIntelligence.validatedPlan.track}</span>
                            <strong>{dossier.clinicalIntelligence.validatedPlan.title}</strong>
                          </div>
                          <span className="doctor-status-chip status-accepted">Valide</span>
                        </div>
                        <p>{dossier.clinicalIntelligence.validatedPlan.summary}</p>
                        <p className="muted-text mb-0">
                          Note medecin: {dossier.clinicalIntelligence.validatedPlan.doctorNote || "Aucune note."}
                        </p>
                      </div>
                    </div>
                  )}
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
