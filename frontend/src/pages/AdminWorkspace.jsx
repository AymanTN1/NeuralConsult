import React, { useEffect, useState } from "react";
import api from "../services/api";

const field = (label, value) => (
  <div className="profile-data-card" key={label}>
    <span className="profile-data-label">{label}</span>
    <strong>{value || "Non renseigne"}</strong>
  </div>
);

const AdminWorkspace = () => {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPendingDoctors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/doctors/admin/pending");
      setPendingDoctors(data || []);
    } catch (error) {
      setPendingDoctors([]);
      setMessage({
        type: "error",
        text: "Impossible de charger les comptes medecins en attente."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingDoctors();
  }, []);

  const decide = async (doctorProfileId, action) => {
    setMessage(null);
    try {
      await api.post(`/api/doctors/admin/${doctorProfileId}/${action}`);
      await loadPendingDoctors();
      setMessage({
        type: "success",
        text: action === "approve" ? "Compte medecin valide." : "Compte medecin refuse."
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: "La decision admin n'a pas pu etre enregistree."
      });
    }
  };

  return (
    <div className="container py-4 app-shell">
      <div className="profile-page-header">
        <div>
          <div className="hero-kicker">Administration</div>
          <h2 className="fw-bold mb-1">Validation des comptes medecins</h2>
          <p className="muted-text mb-0">
            Un compte medecin est visible pour les patients uniquement apres validation par l'administrateur.
          </p>
        </div>
      </div>

      {message && (
        <div className={`alert mt-3 ${message.type === "error" ? "alert-danger" : "alert-success"}`}>
          {message.text}
        </div>
      )}

      <section className="card form-card mt-4">
        <div className="doctor-summary-strip">
          <div className="doctor-summary-card">
            <span className="profile-data-label">Demandes admin</span>
            <strong>{pendingDoctors.length}</strong>
          </div>
          <div className="doctor-summary-card">
            <span className="profile-data-label">Regle</span>
            <strong>Validation avant mise en relation</strong>
          </div>
        </div>

        <div className="section-title-sm mt-4">Comptes medecins en attente</div>

        {loading ? (
          <p className="muted-text mt-3 mb-0">Chargement des comptes en attente...</p>
        ) : pendingDoctors.length === 0 ? (
          <p className="muted-text mt-3 mb-0">Aucun compte medecin en attente pour le moment.</p>
        ) : (
          <div className="doctor-request-stack mt-4">
            {pendingDoctors.map((doctor) => (
              <article key={doctor.id} className="doctor-request-card">
                <div className="doctor-request-card-head">
                  <div>
                    <strong>{doctor.fullName}</strong>
                    <p className="mb-0 muted-text">{doctor.email}</p>
                  </div>
                  <span className="doctor-status-chip status-pending">Validation admin</span>
                </div>

                <div className="profile-card-grid mt-3">
                  {[
                    ["Ville", doctor.city],
                    ["Pays", doctor.countryCode || "MA"],
                    ["Specialite", doctor.specialty],
                    ["Annees d'experience", doctor.yearsExperience ? `${doctor.yearsExperience} ans` : null],
                    ["Teleconsultation", doctor.acceptsTeleconsultation ? "Oui" : "Non"],
                    ["Statut compte", doctor.accountStatus]
                  ].map(([label, value]) => field(label, value))}
                </div>

                <div className="doctor-bio-card mt-3">
                  <span className="profile-data-label">Bio / approche clinique</span>
                  <p className="mb-0">{doctor.bio || "Non renseigne"}</p>
                </div>

                <div className="doctor-card-actions mt-3">
                  <button type="button" className="btn btn-dark" onClick={() => decide(doctor.id, "approve")}>
                    Valider le compte
                  </button>
                  <button type="button" className="btn btn-outline-dark" onClick={() => decide(doctor.id, "reject")}>
                    Refuser
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminWorkspace;
