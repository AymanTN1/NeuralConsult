import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user, refetch } = useAuth();
  const [form, setForm] = useState({
    dateOfBirth: "",
    sex: "",
    heightCm: "",
    weightKg: "",
    city: "",
    countryCode: "",
    occupation: "",
    cigarettesPerDay: "",
    smokingStartAge: "",
    medicalHistoryNotes: ""
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user?.profile) {
      setForm({
        dateOfBirth: user.profile.dateOfBirth || "",
        sex: user.profile.sex || "",
        heightCm: user.profile.heightCm || "",
        weightKg: user.profile.weightKg || "",
        city: user.profile.city || "",
        countryCode: user.profile.countryCode || "",
        occupation: user.profile.occupation || "",
        cigarettesPerDay: user.profile.cigarettesPerDay || "",
        smokingStartAge: user.profile.smokingStartAge || "",
        medicalHistoryNotes: user.profile.medicalHistoryNotes || ""
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const payload = {
      ...form,
      heightCm: form.heightCm ? Number(form.heightCm) : null,
      weightKg: form.weightKg ? Number(form.weightKg) : null,
      cigarettesPerDay: form.cigarettesPerDay ? Number(form.cigarettesPerDay) : null,
      smokingStartAge: form.smokingStartAge ? Number(form.smokingStartAge) : null
    };
    await api.put("/api/patient-profile", payload);
    await refetch();
    setMessage("Profil mis a jour.");
  };

  const handleReset = async () => {
    await api.delete("/api/patient-profile");
    await refetch();
    setMessage("Profil reinitialise.");
  };

  return (
    <div className="container py-4 app-shell">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold mb-0">Profil patient</h2>
        <Link className="btn btn-outline-dark btn-sm" to="/onboarding">Profiling complet</Link>
      </div>
      {message && <div className="alert alert-success">{message}</div>}
      <form onSubmit={handleSubmit} className="card form-card p-3">
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label">Date de naissance</label>
            <input className="form-control" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Sexe</label>
            <select className="form-select" name="sex" value={form.sex} onChange={handleChange}>
              <option value="">Selectionner</option>
              <option value="FEMALE">Femme</option>
              <option value="MALE">Homme</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>
          <div className="col-6">
            <label className="form-label">Taille (cm)</label>
            <input className="form-control" type="number" name="heightCm" value={form.heightCm} onChange={handleChange} />
          </div>
          <div className="col-6">
            <label className="form-label">Poids (kg)</label>
            <input className="form-control" type="number" name="weightKg" value={form.weightKg} onChange={handleChange} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Ville</label>
            <input className="form-control" type="text" name="city" value={form.city} onChange={handleChange} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Pays (code)</label>
            <input className="form-control" type="text" name="countryCode" value={form.countryCode} onChange={handleChange} />
          </div>
          <div className="col-12">
            <label className="form-label">Profession</label>
            <input className="form-control" type="text" name="occupation" value={form.occupation} onChange={handleChange} />
          </div>
          <div className="col-6">
            <label className="form-label">Cigarettes/jour</label>
            <input className="form-control" type="number" name="cigarettesPerDay" value={form.cigarettesPerDay} onChange={handleChange} />
          </div>
          <div className="col-6">
            <label className="form-label">Age debut tabac</label>
            <input className="form-control" type="number" name="smokingStartAge" value={form.smokingStartAge} onChange={handleChange} />
          </div>
          {user?.profile?.dependenceLevel && (
            <div className="col-12">
              <span className="badge bg-secondary">Dependance: {user.profile.dependenceLevel}</span>
            </div>
          )}
          <div className="col-12">
            <label className="form-label">Notes medicales</label>
            <textarea className="form-control" rows="3" name="medicalHistoryNotes" value={form.medicalHistoryNotes} onChange={handleChange} />
          </div>
        </div>
        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-dark">Enregistrer</button>
          <button type="button" className="btn btn-outline-dark" onClick={handleReset}>
            <i className="bi bi-trash me-1" /> Reinitialiser
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
