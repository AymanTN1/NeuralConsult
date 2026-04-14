import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  dateOfBirth: "",
  sex: "",
  city: "",
  countryCode: "",
  occupation: ""
};

const formatSex = (value) => {
  if (value === "FEMALE") return "Femme";
  if (value === "MALE") return "Homme";
  if (value === "OTHER") return "Autre";
  return "Non renseigne";
};

const formatEducation = (value) => {
  if (value === "NO_DIPLOMA") return "Sans diplome";
  if (value === "SECONDARY") return "Niveau secondaire";
  if (value === "CAP_BEP") return "CAP / BEP";
  if (value === "BAC") return "Baccalaureat";
  if (value === "BAC_PLUS_2") return "Bac +2";
  if (value === "ABOVE_BAC_PLUS_2") return "Au-dela de Bac +2";
  return "Non renseigne";
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return "Non renseigne";
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return "Non renseigne";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return `${age} ans`;
};

const Profile = () => {
  const { user, refetch } = useAuth();
  const [assessment, setAssessment] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!user?.profile) return;
    setForm({
      dateOfBirth: user.profile.dateOfBirth || "",
      sex: user.profile.sex || "",
      city: user.profile.city || "",
      countryCode: user.profile.countryCode || "",
      occupation: user.profile.occupation || ""
    });
  }, [user]);

  useEffect(() => {
    const loadAssessment = async () => {
      try {
        const { data } = await api.get("/api/onboarding");
        setAssessment(data?.assessment || null);
      } catch (error) {
        setAssessment(null);
      }
    };

    if (user) {
      loadAssessment();
    }
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    const currentProfile = user?.profile || {};
    const payload = {
      dateOfBirth: form.dateOfBirth || null,
      sex: form.sex || null,
      city: form.city || null,
      countryCode: form.countryCode || null,
      occupation: form.occupation || null,
      heightCm: currentProfile.heightCm ?? null,
      weightKg: currentProfile.weightKg ?? null,
      cigarettesPerDay: currentProfile.cigarettesPerDay ?? null,
      smokingStartAge: currentProfile.smokingStartAge ?? null,
      medicalHistoryNotes: currentProfile.medicalHistoryNotes ?? null
    };

    try {
      await api.put("/api/patient-profile", payload);
      await refetch();
      setIsEditing(false);
      setMessage({ type: "success", text: "Identite patient mise a jour." });
    } catch (error) {
      const apiMessage = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({
        type: "error",
        text: apiMessage || "Impossible de mettre a jour le profil personnel."
      });
    }
  };

  const profile = user?.profile;
  const profileCards = useMemo(
    () => [
      { label: "Nom complet", value: user?.fullName || "Non renseigne" },
      { label: "Email", value: user?.email || "Non renseigne" },
      { label: "Age", value: calculateAge(profile?.dateOfBirth) },
      { label: "Date de naissance", value: profile?.dateOfBirth || "Non renseigne" },
      { label: "Sexe", value: formatSex(profile?.sex) },
      { label: "Ville", value: profile?.city || "Non renseigne" },
      { label: "Pays", value: profile?.countryCode || "Non renseigne" },
      { label: "Profession", value: profile?.occupation || "Non renseigne" },
      { label: "Niveau d'etudes", value: formatEducation(assessment?.educationLevel) },
      {
        label: "Statut d'evaluation",
        value: profile?.onboardingComplete ? "Profiling complet" : "Evaluation en cours"
      }
    ],
    [assessment?.educationLevel, profile, user]
  );

  return (
      <div className="container py-4 app-shell" data-guide-id="profile-main">
        <div className="profile-page-header" data-guide-id="profile-header">
        <div>
          <div className="hero-kicker">Personal Profile</div>
          <h2 className="fw-bold mb-1">Fiche d'identite patient</h2>
          <p className="muted-text mb-0">
            Cette page ne contient que les informations personnelles et demographiques. Les questions
            cliniques et tabacologiques restent dans l'evaluation obligatoire.
          </p>
        </div>
        <div className="profile-header-actions">
          <Link className="btn btn-outline-dark btn-sm" to="/evaluation">
            Ouvrir l'evaluation
          </Link>
          {!isEditing && (
            <button className="btn btn-dark btn-sm" onClick={() => setIsEditing(true)}>
              Editer le profil
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`alert ${message.type === "error" ? "alert-danger" : "alert-success"} mt-3`}>
          {message.text}
        </div>
      )}

      <div className="profile-layout-grid mt-4">
        <section className="card form-card profile-summary-panel">
          <div className="profile-summary-header">
            <div>
              <div className="section-title-sm">Clinical identity summary</div>
              <p className="muted-text mb-0">Lecture rapide du dossier patient avant revue clinique.</p>
            </div>
            <span className={`profile-status-badge ${profile?.onboardingComplete ? "is-complete" : "is-pending"}`}>
              {profile?.onboardingComplete ? "Profiling complet" : "Evaluation en cours"}
            </span>
          </div>

          <div className="profile-card-grid">
            {profileCards.map((item) => (
              <div key={item.label} className="profile-data-card">
                <span className="profile-data-label">{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <aside className="card form-card profile-aside-panel">
          <div className="section-title-sm">Boundary reminder</div>
          <p className="muted-text">
            Les facteurs de risque, le bilan tabagique, Fagerstrom, l'alcool, le cannabis et EPICES
            sont maintenant centralises dans la timeline d'evaluation.
          </p>
          <div className="profile-side-steps">
            <div className="profile-side-step">
              <span>1</span>
              <div>
                <strong>Personal Profile</strong>
                <p>Identite, age, ville, profession, niveau d'etudes.</p>
              </div>
            </div>
            <div className="profile-side-step">
              <span>2</span>
              <div>
                <strong>Mandatory Evaluation</strong>
                <p>Questions cliniques, tabacologie, Fagerstrom et vulnerabilites.</p>
              </div>
            </div>
          </div>
          <Link className="btn btn-outline-dark w-100" to="/evaluation">
            Continuer la timeline clinique
          </Link>
        </aside>
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="card form-card mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <div className="section-title-sm">Edit Personal Profile</div>
              <p className="muted-text mb-0">Les biometries et donnees cliniques se modifient dans l'evaluation.</p>
            </div>
            <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => setIsEditing(false)}>
              Annuler
            </button>
          </div>

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
            <div className="col-12 col-md-6">
              <label className="form-label">Niveau d'etudes</label>
              <input
                className="form-control"
                type="text"
                value={formatEducation(assessment?.educationLevel)}
                disabled
              />
              <small className="muted-text">Le niveau d'etudes se modifie dans la timeline d'evaluation.</small>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4">
            <button className="btn btn-dark">Enregistrer les changements</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Profile;
