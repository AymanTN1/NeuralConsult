import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user, refetch } = useAuth();
  const [assessment, setAssessment] = useState(null);
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
  const [isEditing, setIsEditing] = useState(false);

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
      setIsEditing(!user.profile.onboardingComplete);
    }
  }, [user]);

  useEffect(() => {
    const loadAssessment = async () => {
      try {
        const { data } = await api.get("/api/onboarding");
        setAssessment(data?.assessment || null);
      } catch (err) {
        setAssessment(null);
      }
    };
    if (user) {
      loadAssessment();
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
    if (user?.profile?.onboardingComplete) {
      setIsEditing(false);
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "Non renseigne";
    }
    return value;
  };

  const formatBool = (value) => {
    if (value === true) return "Oui";
    if (value === false) return "Non";
    return "Non renseigne";
  };

  const formatSex = (value) => {
    if (!value) return "Non renseigne";
    if (value === "FEMALE") return "Femme";
    if (value === "MALE") return "Homme";
    return "Autre";
  };

  const formatObjective = (value) => {
    if (value === "STOP_COMPLETELY") return "Arret complet";
    if (value === "REDUCE") return "Reduction";
    if (value === "INFO") return "Renseignements";
    if (value === "MAINTAIN_QUIT") return "Maintien de l'arret";
    return "Non renseigne";
  };

  const formatProfessionalStatus = (value) => {
    if (value === "ACTIVE") return "Actif";
    if (value === "UNEMPLOYED_RSA") return "Chomage / RSA";
    if (value === "STUDENT") return "Etudiant";
    if (value === "RETIRED") return "Retraite";
    if (value === "HOMEMAKER") return "Foyer";
    if (value === "DISABILITY") return "Invalidite / AAH";
    return "Non renseigne";
  };

  const formatEducation = (value) => {
    if (value === "NO_DIPLOMA") return "Sans diplome";
    if (value === "SECONDARY") return "Secondaire";
    if (value === "CAP_BEP") return "CAP / BEP";
    if (value === "BAC") return "Baccalaureat";
    if (value === "BAC_PLUS_2") return "Bac +2";
    if (value === "ABOVE_BAC_PLUS_2") return "Au-dela de Bac +2";
    return "Non renseigne";
  };

  const formatReferral = (value) => {
    if (value === "HOSPITALIZATION") return "Hospitalisation";
    if (value === "ENTOURAGE") return "Entourage";
    if (value === "GP") return "Medecin traitant";
    if (value === "SPECIALIST") return "Medecin specialiste";
    if (value === "OCCUPATIONAL_DOCTOR") return "Medecin du travail";
    if (value === "PHARMACIST") return "Pharmacien";
    if (value === "TABAC_INFO_SERVICE") return "Tabac Info Service";
    if (value === "PERSONAL_DECISION") return "Demarche personnelle";
    return "Non renseigne";
  };

  const formatIncome = (value) => {
    if (value === "BELOW_1000") return "Moins de 1000";
    if (value === "FROM_1001_TO_2000") return "1001 a 2000";
    if (value === "FROM_2001_TO_3000") return "2001 a 3000";
    if (value === "FROM_3001_TO_4000") return "3001 a 4000";
    if (value === "ABOVE_4000") return "Plus de 4000";
    return "Non renseigne";
  };

  const formatMotivationStage = (value) => {
    if (value === 1) return "Ne veut pas arreter";
    if (value === 2) return "Devrait arreter mais ne veut pas";
    if (value === 3) return "Veut arreter sans plan";
    if (value === 4) return "Veut arreter mais sans date";
    if (value === 5) return "Veut arreter bientot";
    if (value === 6) return "Arret dans le trimestre";
    if (value === 7) return "Arret dans le mois";
    return "Non renseigne";
  };

  const formatCannabisFrequency = (value) => {
    if (value === "NONE") return "Aucune";
    if (value === "LESS_THAN_3") return "1 a 2 fois";
    if (value === "THREE_TO_5") return "3 a 5 fois";
    if (value === "SIX_TO_9") return "6 a 9 fois";
    if (value === "TEN_TO_19") return "10 a 19 fois";
    if (value === "TWENTY_TO_29") return "20 a 29 fois";
    if (value === "DAILY") return "Tous les jours";
    return "Non renseigne";
  };

  const profile = user?.profile;
  const summaryItems = [
    { label: "Date de naissance", value: profile?.dateOfBirth },
    { label: "Sexe", value: formatSex(profile?.sex) },
    { label: "Taille", value: profile?.heightCm ? `${profile.heightCm} cm` : null },
    { label: "Poids", value: profile?.weightKg ? `${profile.weightKg} kg` : null },
    { label: "Ville", value: profile?.city },
    { label: "Pays", value: profile?.countryCode },
    { label: "Profession", value: profile?.occupation },
    { label: "Cigarettes/jour", value: profile?.cigarettesPerDay },
    { label: "Age debut tabac", value: profile?.smokingStartAge },
    { label: "Dependance", value: profile?.dependenceLevel }
  ];

  const dossierItems = [
    { label: "Delai RDV (jours)", value: assessment?.appointmentLeadDays },
    { label: "Objectif", value: formatObjective(assessment?.consultationObjective) },
    { label: "Situation professionnelle", value: formatProfessionalStatus(assessment?.professionalStatus) },
    { label: "Niveau d'etudes", value: formatEducation(assessment?.educationLevel) },
    { label: "Orientation", value: formatReferral(assessment?.referralSource) },
    { label: "Fume a l'interieur", value: formatBool(assessment?.smokesAtHome) },
    { label: "Autres fumeurs foyer", value: formatBool(assessment?.otherSmokersAtHome) }
  ];

  const bilanItems = [
    { label: "Fume actuellement", value: formatBool(assessment?.currentlySmoking) },
    { label: "Cigarettes/jour avant arret", value: assessment?.cigarettesPerDayBeforeQuit },
    { label: "Manufacturees/jour", value: assessment?.manufacturedCigarettesPerDay },
    { label: "Roulees/jour", value: assessment?.rolledCigarettesPerDay },
    { label: "Cigarillos/jour", value: assessment?.cigarillosPerDay },
    { label: "E-cigarette", value: formatBool(assessment?.usesECigarette) },
    { label: "Liquide/semaine", value: assessment?.ecigWeeklyLiquid },
    { label: "Cartouches nicotine", value: formatBool(assessment?.usesNicotineCartridges) },
    { label: "Dosage cartouches", value: assessment?.nicotineCartridgeDosage }
  ];

  const motivationItems = [
    { label: "Motivation etape", value: formatMotivationStage(assessment?.motivationStage) },
    { label: "Motivation (0-10)", value: assessment?.motivationScore },
    { label: "Confiance (0-10)", value: assessment?.confidenceScore },
    { label: "Crainte poids (0-10)", value: assessment?.weightConcernScore },
    { label: "Confiance poids (0-10)", value: assessment?.weightConfidenceScore }
  ];

  const addictionItems = [
    { label: "Score CAGE", value: assessment?.cageScore },
    { label: "Score HONC", value: assessment?.honcScore },
    { label: "Score EPICES", value: assessment?.epicesScore },
    { label: "Score Alcool", value: assessment?.alcoholScore },
    { label: "Cannabis (12 mois)", value: formatBool(assessment?.cannabisLast12Months) },
    { label: "Frequence cannabis", value: formatCannabisFrequency(assessment?.cannabisFrequency) },
    { label: "Age debut cannabis", value: assessment?.cannabisStartAge },
    { label: "Depense tabac / semaine", value: assessment?.weeklyTobaccoSpend },
    { label: "Revenus mensuels", value: formatIncome(assessment?.incomeBracket) }
  ];

  const renderSection = (title, items) => (
    <div className="card form-card p-3 mb-3">
      <h5 className="fw-bold mb-3">{title}</h5>
      <div className="row g-3">
        {items.map((item) => (
          <div className="col-12 col-md-6" key={item.label}>
            <div className="p-3 border rounded-3 bg-light h-100">
              <div className="text-uppercase small muted-text">{item.label}</div>
              <div className="fw-semibold">{formatValue(item.value)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container py-4 app-shell">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold mb-0">Profil patient</h2>
        <Link className="btn btn-outline-dark btn-sm" to="/onboarding">Profiling complet</Link>
      </div>
      {message && <div className="alert alert-success">{message}</div>}
      {profile?.onboardingComplete && !isEditing ? (
        <>
          <div className="card form-card p-3 mb-3">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h5 className="fw-bold mb-1">Synthese clinique</h5>
                <p className="muted-text mb-0">Profil patient valide et synchronise.</p>
              </div>
              <button className="btn btn-outline-dark btn-sm" onClick={() => setIsEditing(true)}>
                Editer le profil
              </button>
            </div>
            <div className="row g-3">
              {summaryItems.map((item) => (
                <div className="col-12 col-md-6" key={item.label}>
                  <div className="p-3 border rounded-3 bg-light h-100">
                    <div className="text-uppercase small muted-text">{item.label}</div>
                    <div className="fw-semibold">{formatValue(item.value)}</div>
                  </div>
                </div>
              ))}
              <div className="col-12">
                <div className="p-3 border rounded-3 bg-light">
                  <div className="text-uppercase small muted-text">Notes medicales</div>
                  <div className="fw-semibold">{formatValue(profile?.medicalHistoryNotes)}</div>
                </div>
              </div>
            </div>
          </div>
          {renderSection("Dossier patient", dossierItems)}
          {renderSection("Bilan tabagique", bilanItems)}
          {renderSection("Motivation et habitudes", motivationItems)}
          {renderSection("Addictions et contexte social", addictionItems)}
        </>
      ) : (
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
              <label className="form-label">Pays</label>
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
            {profile?.onboardingComplete && (
              <button type="button" className="btn btn-outline-dark" onClick={() => setIsEditing(false)}>
                Annuler
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default Profile;
