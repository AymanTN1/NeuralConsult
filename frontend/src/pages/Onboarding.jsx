import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const defaultForm = {
  dateOfBirth: "",
  sex: "",
  heightCm: "",
  weightKg: "",
  city: "",
  countryCode: "",
  occupation: "",
  cigarettesPerDay: "",
  smokingStartAge: "",
  medicalHistoryNotes: "",
  quitAttempts: "",
  longestQuitDays: "",
  motivationScore: "",
  confidenceScore: "",
  smokesAtHome: false,
  usesOtherTobacco: false,
  triggers: "",
  cageCutDown: false,
  cageAnnoyed: false,
  cageGuilty: false,
  cageEyeOpener: false,
  cannabisLast12Months: false,
  cannabisFrequency: "NONE",
  weightConcernScore: "",
  weightConfidenceScore: "",
  physicalActivityLevel: "NONE",
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
  const [step, setStep] = useState(1);
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
          setScores(data.assessment);
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const toNumber = (value) => (value === "" || value === null ? null : Number(value));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const payload = {
      ...form,
      heightCm: toNumber(form.heightCm),
      weightKg: toNumber(form.weightKg),
      cigarettesPerDay: toNumber(form.cigarettesPerDay),
      smokingStartAge: toNumber(form.smokingStartAge),
      quitAttempts: toNumber(form.quitAttempts),
      longestQuitDays: toNumber(form.longestQuitDays),
      motivationScore: toNumber(form.motivationScore),
      confidenceScore: toNumber(form.confidenceScore),
      weightConcernScore: toNumber(form.weightConcernScore),
      weightConfidenceScore: toNumber(form.weightConfidenceScore)
    };
    const { data } = await api.post("/api/onboarding", payload);
    setScores(data?.assessment || null);
    await refetch();
    setMessage("Profiling enregistre.");
  };

  return (
    <div className="container py-4 app-shell">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold mb-0">Profiling initial</h2>
        <span className="badge bg-dark">Etape {step}/3</span>
      </div>
      {message && <div className="alert alert-success">{message}</div>}
      {scores && (
        <div className="alert alert-info">
          CAGE: {scores.cageScore ?? "-"} {scores.cagePositive ? "(positif)" : ""}
          {" | "}HONC: {scores.honcScore ?? "-"} {scores.honcHighDependence ? "(dependance forte)" : ""}
        </div>
      )}
      <form onSubmit={handleSubmit} className="card form-card p-3">
        {step === 1 && (
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label">Date de naissance</label>
              <input className="form-control" type="date" name="dateOfBirth" value={form.dateOfBirth || ""} onChange={handleChange} />
            </div>
            <div className="col-12 col-md-6">
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
            <div className="col-12 col-md-6">
              <label className="form-label">Ville</label>
              <input className="form-control" type="text" name="city" value={form.city || ""} onChange={handleChange} />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Pays (code)</label>
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
            <div className="col-6">
              <label className="form-label">Tentatives d'arret</label>
              <input className="form-control" type="number" name="quitAttempts" value={form.quitAttempts || ""} onChange={handleChange} />
            </div>
            <div className="col-6">
              <label className="form-label">Plus longue abstinence (jours)</label>
              <input className="form-control" type="number" name="longestQuitDays" value={form.longestQuitDays || ""} onChange={handleChange} />
            </div>
            <div className="col-6">
              <label className="form-label">Motivation (0-10)</label>
              <input className="form-control" type="number" name="motivationScore" value={form.motivationScore || ""} onChange={handleChange} min="0" max="10" />
            </div>
            <div className="col-6">
              <label className="form-label">Confiance (0-10)</label>
              <input className="form-control" type="number" name="confidenceScore" value={form.confidenceScore || ""} onChange={handleChange} min="0" max="10" />
            </div>
            <div className="col-12">
              <label className="form-label">Declencheurs principaux</label>
              <input className="form-control" type="text" name="triggers" value={form.triggers || ""} onChange={handleChange} />
            </div>
            <div className="col-12 d-flex gap-3 flex-wrap">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" name="smokesAtHome" checked={!!form.smokesAtHome} onChange={handleChange} />
                <label className="form-check-label">Fume a la maison</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" name="usesOtherTobacco" checked={!!form.usesOtherTobacco} onChange={handleChange} />
                <label className="form-check-label">Autres produits tabac</label>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="row g-3">
            <div className="col-12">
              <h5 className="fw-semibold">Questionnaire CAGE (alcool)</h5>
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
              <h5 className="fw-semibold">Questionnaire HONC (dependance)</h5>
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
          </div>
        )}

        {step === 3 && (
          <div className="row g-3">
            <div className="col-12">
              <h5 className="fw-semibold">Cannabis</h5>
              <div className="form-check mt-2">
                <input className="form-check-input" type="checkbox" name="cannabisLast12Months" checked={!!form.cannabisLast12Months} onChange={handleChange} />
                <label className="form-check-label">Consommation durant les 12 derniers mois</label>
              </div>
            </div>
            <div className="col-12">
              <label className="form-label">Frequence de consommation</label>
              <select className="form-select" name="cannabisFrequency" value={form.cannabisFrequency || "NONE"} onChange={handleChange}>
                <option value="NONE">Aucune</option>
                <option value="LESS_THAN_3">1 a 2 fois/mois</option>
                <option value="THREE_TO_5">3 a 5 fois</option>
                <option value="SIX_TO_9">6 a 9 fois</option>
                <option value="TEN_TO_19">10 a 19 fois</option>
                <option value="TWENTY_TO_29">20 a 29 fois</option>
                <option value="DAILY">Tous les jours</option>
              </select>
            </div>
            <div className="col-12">
              <h5 className="fw-semibold mt-2">Peur de prise de poids</h5>
            </div>
            <div className="col-6">
              <label className="form-label">Crainte (0-10)</label>
              <input className="form-control" type="number" name="weightConcernScore" value={form.weightConcernScore || ""} onChange={handleChange} min="0" max="10" />
            </div>
            <div className="col-6">
              <label className="form-label">Confiance (0-10)</label>
              <input className="form-control" type="number" name="weightConfidenceScore" value={form.weightConfidenceScore || ""} onChange={handleChange} min="0" max="10" />
            </div>
            <div className="col-12">
              <h5 className="fw-semibold mt-2">Activite physique</h5>
              <select className="form-select" name="physicalActivityLevel" value={form.physicalActivityLevel || "NONE"} onChange={handleChange}>
                <option value="NONE">Aucune</option>
                <option value="LESS_THAN_30_MIN">Moins de 30 min</option>
                <option value="ONE_TO_TWO_HOURS">1 a 2 heures</option>
                <option value="TWO_TO_FOUR_HOURS">2 a 4 heures</option>
                <option value="MORE_THAN_FOUR_HOURS">Plus de 4 heures</option>
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Notes complementaires</label>
              <textarea className="form-control" rows="3" name="notes" value={form.notes || ""} onChange={handleChange} />
            </div>
            <div className="col-12">
              <label className="form-label">Notes medicales</label>
              <textarea className="form-control" rows="3" name="medicalHistoryNotes" value={form.medicalHistoryNotes || ""} onChange={handleChange} />
            </div>
          </div>
        )}

        <div className="d-flex justify-content-between mt-4">
          <button type="button" className="btn btn-outline-secondary" onClick={() => setStep((prev) => Math.max(1, prev - 1))} disabled={step === 1}>
            Precedent
          </button>
          {step < 3 ? (
            <button type="button" className="btn btn-dark" onClick={() => setStep((prev) => Math.min(3, prev + 1))}>
              Suivant
            </button>
          ) : (
            <button type="submit" className="btn btn-dark">
              Enregistrer
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Onboarding;
