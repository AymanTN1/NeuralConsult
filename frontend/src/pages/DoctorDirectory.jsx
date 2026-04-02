import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const matchingCopy = {
  SAME_CITY: "Meme ville",
  SAME_COUNTRY: "Meme pays",
  TELECONSULTATION: "Teleconsultation"
};

const DoctorDirectory = () => {
  const [doctors, setDoctors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const [doctorsResp, requestsResp] = await Promise.allSettled([
      api.get("/api/doctors"),
      api.get("/api/doctors/requests/patient")
    ]);

    if (doctorsResp.status === "fulfilled") {
      setDoctors(doctorsResp.value.data || []);
    } else {
      setDoctors([]);
      setError("Impossible de charger l'annuaire medecin.");
    }

    if (requestsResp.status === "fulfilled") {
      setRequests(requestsResp.value.data || []);
    } else {
      setRequests([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const latestRequestByDoctor = useMemo(() => {
    const map = new Map();
    requests.forEach((request) => {
      if (!map.has(request.doctorProfileId)) {
        map.set(request.doctorProfileId, request);
      }
    });
    return map;
  }, [requests]);

  const sendRequest = async (doctorProfileId) => {
    setFeedback(null);
    try {
      await api.post("/api/doctors/requests", {
        doctorProfileId,
        patientMessage: messages[doctorProfileId] || null
      });
      setFeedback({ type: "success", text: "Votre demande a ete envoyee au medecin." });
      await load();
    } catch (err) {
      const apiError = err?.response?.data?.message || err?.response?.data?.error;
      setFeedback({
        type: "error",
        text: apiError || "Impossible d'envoyer la demande au medecin."
      });
    }
  };

  return (
    <div className="container py-4 app-shell">
      <div className="profile-page-header">
        <div>
          <div className="hero-kicker">Matching medecin</div>
          <h2 className="fw-bold mb-1">Choisir un medecin apres l'evaluation initiale</h2>
          <p className="muted-text mb-0">
            Priorite meme ville, puis meme pays, puis teleconsultation. Le medecin recevra votre dossier,
            les scores, les notes IA et les plans proposes avant de decider.
          </p>
        </div>
      </div>

      {feedback && (
        <div className={`alert mt-3 ${feedback.type === "error" ? "alert-danger" : "alert-success"}`}>
          {feedback.text}
        </div>
      )}

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      <section className="card form-card mt-4">
        <div className="section-title-sm">Demandes deja envoyees</div>
        {requests.length === 0 ? (
          <p className="muted-text mb-0">Aucune demande pour le moment.</p>
        ) : (
          <div className="doctor-request-stack">
            {requests.map((request) => (
              <div key={request.id} className="doctor-request-card">
                <div>
                  <strong>{request.doctorName}</strong>
                  <p className="mb-0">
                    Statut: <span className={`doctor-status-chip status-${request.status?.toLowerCase()}`}>{request.status}</span>
                    {" · "}
                    Matching: {matchingCopy[request.matchingMode] || request.matchingMode}
                  </p>
                </div>
                <div className="muted-text">{request.doctorResponseNote || "En attente de reponse."}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="doctor-grid mt-4">
        {loading ? (
          <div className="muted-text">Chargement de l'annuaire medecin...</div>
        ) : doctors.length === 0 ? (
          <div className="muted-text">Aucun medecin disponible pour le matching actuellement.</div>
        ) : (
          doctors.map((doctor) => {
            const existingRequest = latestRequestByDoctor.get(doctor.id);
            return (
              <article key={doctor.id} className="card form-card doctor-card">
                <div className="doctor-card-head">
                  <div>
                    <div className="section-title-sm">{doctor.fullName}</div>
                    <p className="muted-text mb-0">{doctor.specialty || "Tabacologie / suivi clinique"}</p>
                  </div>
                  <span className="doctor-match-chip">
                    {matchingCopy[doctor.matchingMode] || "Matching"}
                    {doctor.matchingScore ? ` · ${doctor.matchingScore}` : ""}
                  </span>
                </div>

                <div className="doctor-card-grid">
                  <div>
                    <span className="profile-data-label">Ville</span>
                    <strong>{doctor.city || "Non renseignee"}</strong>
                  </div>
                  <div>
                    <span className="profile-data-label">Pays</span>
                    <strong>{doctor.countryCode || "Non renseigne"}</strong>
                  </div>
                  <div>
                    <span className="profile-data-label">Teleconsultation</span>
                    <strong>{doctor.acceptsTeleconsultation ? "Oui" : "Non"}</strong>
                  </div>
                  <div>
                    <span className="profile-data-label">Score de suivi</span>
                    <strong>{doctor.successScore ?? "A definir"}</strong>
                  </div>
                </div>

                <p className="muted-text">{doctor.bio || "Profil medecin en cours de completion."}</p>

                <label className="form-label">Message optionnel au medecin</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={messages[doctor.id] || ""}
                  onChange={(event) =>
                    setMessages((previous) => ({ ...previous, [doctor.id]: event.target.value }))
                  }
                  placeholder="Expliquez votre contexte ou votre attente principale."
                />

                <div className="doctor-card-actions">
                  <button
                    type="button"
                    className="btn btn-dark"
                    onClick={() => sendRequest(doctor.id)}
                    disabled={existingRequest?.status === "PENDING" || existingRequest?.status === "ACCEPTED"}
                  >
                    {existingRequest?.status === "PENDING"
                      ? "Demande envoyee"
                      : existingRequest?.status === "ACCEPTED"
                        ? "Medecin associe"
                        : "Envoyer la demande"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};

export default DoctorDirectory;
