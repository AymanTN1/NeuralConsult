import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  email: "",
  password: "",
  fullName: "",
  phoneNumber: "",
  accountType: "PATIENT",
  city: "",
  countryCode: "MA",
  specialty: "",
  yearsExperience: "",
  bio: "",
  acceptsTeleconsultation: true
};

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const doctorMode = form.accountType === "DOCTOR";

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const payload = useMemo(
    () => ({
      ...form,
      yearsExperience: form.yearsExperience === "" ? null : Number(form.yearsExperience)
    }),
    [form]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register(payload);
      navigate("/dashboard");
    } catch (err) {
      setError("La creation du compte a echoue. Verifiez les champs et reessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-stage">
      <div className="container auth-stage-grid">
        <div className="auth-story">
          <div className="hero-kicker">Ouverture de parcours</div>
          <h1 className="auth-title">Un acces structure pour les patients et un onboarding verifie pour les medecins.</h1>
          <p className="auth-copy">
            Le patient entre dans un parcours de sevrage progressif. Le medecin renseigne son positionnement clinique
            des l'inscription, puis attend la validation administrateur avant d'etre visible dans l'annuaire.
          </p>

          <div className="auth-story-matrix">
            <div className="matrix-card">
              <span>Patient</span>
              <strong>Profil personnel puis evaluation initiale</strong>
            </div>
            <div className="matrix-card">
              <span>Medecin</span>
              <strong>Compte controle avant mise en relation</strong>
            </div>
            <div className="matrix-card">
              <span>Alliance</span>
              <strong>Lecture du dossier, plans et suivi visuel</strong>
            </div>
          </div>
        </div>

        <div className="auth-card-shell">
          <div className="auth-card">
            <div className="hero-kicker">Compte clinique</div>
            <h2 className="auth-card-title">Creer un compte</h2>
            <p className="muted-text">Choisissez votre role puis completez uniquement les informations utiles a ce role.</p>

            {error && <div className="alert alert-danger mt-3">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <label className="form-label">Type de compte</label>
              <select className="form-select" name="accountType" value={form.accountType} onChange={handleChange}>
                <option value="PATIENT">Patient</option>
                <option value="DOCTOR">Medecin</option>
              </select>

              <label className="form-label">Nom complet</label>
              <input className="form-control" type="text" name="fullName" value={form.fullName} onChange={handleChange} required />

              <label className="form-label">Telephone</label>
              <input className="form-control" type="text" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />

              <label className="form-label">Email</label>
              <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />

              <label className="form-label">Mot de passe</label>
              <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} required />

              {doctorMode && (
                <div className="auth-doctor-grid">
                  <div className="auth-doctor-grid-head">
                    <span className="hero-kicker">Infos praticien</span>
                    <p className="muted-text mb-0">Ces informations sont enregistrees des l'inscription et soumises a validation admin.</p>
                  </div>

                  <label className="form-label">Ville</label>
                  <input className="form-control" type="text" name="city" value={form.city} onChange={handleChange} required={doctorMode} />

                  <label className="form-label">Pays</label>
                  <input className="form-control" type="text" name="countryCode" value={form.countryCode} onChange={handleChange} required={doctorMode} />

                  <label className="form-label">Specialite</label>
                  <input className="form-control" type="text" name="specialty" value={form.specialty} onChange={handleChange} required={doctorMode} />

                  <label className="form-label">Annees d'experience</label>
                  <input className="form-control" type="number" min="0" name="yearsExperience" value={form.yearsExperience} onChange={handleChange} required={doctorMode} />

                  <label className="form-label">Bio / approche clinique</label>
                  <textarea className="form-control" rows="4" name="bio" value={form.bio} onChange={handleChange} required={doctorMode} />

                  <label className="auth-inline-toggle">
                    <input type="checkbox" name="acceptsTeleconsultation" checked={!!form.acceptsTeleconsultation} onChange={handleChange} />
                    <span>J'accepte la teleconsultation</span>
                  </label>
                </div>
              )}

              <button className="btn btn-dark w-100" disabled={loading}>
                {loading ? "Creation..." : doctorMode ? "Creer et soumettre le compte medecin" : "Activer mon espace patient"}
              </button>
            </form>

            <p className="auth-alt-link">
              Deja inscrit ? <Link to="/login">Revenir a la connexion</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;
