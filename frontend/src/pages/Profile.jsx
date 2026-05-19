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
  const profile = user?.profile;
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

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleProfilePhoto = async (event) => {
    try {
      const file = event.target.files?.[0];
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = String(reader.result || "");
        if (dataUrl.length > 1_800_000) {
          setMessage({ type: "error", text: "L'image est trop lourde." });
          return;
        }
        // Update via API
        await api.put("/api/communities/social/profile", { 
          ...user.profile, 
          profilePhotoUrl: dataUrl,
          username: user.profile.username || user.fullName?.toLowerCase().replace(/\s+/g, ".")
        });
        await refetch();
        setShowProfileMenu(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setMessage({ type: "error", text: "Impossible de charger cette image." });
    }
  };

  const profileCards = useMemo(
    () => [
      { label: "Prenom legal", value: user?.firstName || "Non renseigne" },
      { label: "Nom legal", value: user?.lastName || "Non renseigne" },
      { label: "Nom complet", value: user?.fullName || "Non renseigne" },
      { label: "Email", value: user?.email || "Non renseigne" },
      { label: "CIN verifiee", value: user?.identityVerified ? "Oui, OCR valide" : "Non verifiee" },
      { label: "Age", value: calculateAge(profile?.dateOfBirth) },
      { label: "Date de naissance", value: profile?.dateOfBirth || "Non renseigne" },
      { label: "Sexe", value: formatSex(profile?.sex) },
      { label: "Ville", value: profile?.city || "Non renseigne" },
      { label: "Pays", value: profile?.countryCode || "Non renseigne" },
      { label: "Profession", value: profile?.occupation || "Non renseigne" },
      { label: "Niveau d'etudes", value: formatEducation(assessment?.educationLevel) },
      {
        label: "Statut d'evaluation",
        value: profile?.onboardingComplete ? "Parcours initial complet" : "Evaluation en cours"
      }
    ],
    [assessment?.educationLevel, profile, user]
  );

  return (
      <div className="container py-4 app-shell" data-guide-id="profile-main">
      <div className="profile-page-header mb-5" data-guide-id="profile-header">
        <div className="d-flex align-items-center gap-4">
          <div className="position-relative">
            <div 
              className="profile-avatar-interactive" 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{ width: '100px', height: '100px' }}
            >
              {user?.profile?.profilePhotoUrl ? (
                <img 
                  src={user.profile.profilePhotoUrl} 
                  alt={user.fullName} 
                  className="rounded-circle w-100 h-100 object-fit-cover border" 
                />
              ) : (
                <div className="rounded-circle w-100 h-100 bg-light border d-flex align-items-center justify-content-center fs-2 fw-bold text-primary">
                  {user?.fullName?.charAt(0)}
                </div>
              )}
              <div className="profile-avatar-overlay">
                <i className="bi bi-camera-fill fs-3" />
              </div>
            </div>

            {showProfileMenu && (
              <div className="profile-option-menu" style={{ left: '0', transform: 'none' }}>
                <label className="profile-option-item mb-0 cursor-pointer">
                  <i className="bi bi-image" /> 
                  <span>Choisir une photo</span>
                  <input type="file" accept="image/*" className="d-none" onChange={handleProfilePhoto} />
                </label>
                <hr className="my-1" />
                <button type="button" className="profile-option-item text-danger" onClick={async () => {
                  await api.put("/api/communities/social/profile", { ...user.profile, profilePhotoUrl: "" });
                  await refetch();
                  setShowProfileMenu(false);
                }}>
                  <i className="bi bi-trash" /> <span>Supprimer</span>
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="hero-kicker">Profil personnel</div>
            <h2 className="fw-bold mb-1">{user?.fullName || "Patient"}</h2>
            <p className="muted-text mb-0">
              {user?.email} · {user?.profile?.onboardingComplete ? "Parcours verifie" : "En cours d'onboarding"}
            </p>
          </div>
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
              <div className="section-title-sm">Synthese d'identite clinique</div>
              <p className="muted-text mb-0">Lecture rapide du dossier patient avant revue clinique.</p>
            </div>
            <span className={`profile-status-badge ${profile?.onboardingComplete ? "is-complete" : "is-pending"}`}>
              {profile?.onboardingComplete ? "Parcours complet" : "Evaluation en cours"}
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
          <div className="section-title-sm">Rappel de perimetre</div>
          <p className="muted-text">
            Les facteurs de risque, le bilan tabagique, Fagerstrom, l'alcool, le cannabis et EPICES
            sont maintenant centralises dans la timeline d'evaluation.
          </p>
          <div className="profile-side-steps">
            <div className="profile-side-step">
              <span>1</span>
              <div>
                <strong>Profil personnel</strong>
                <p>Identite, date de naissance verifiee, ville, profession, niveau d'etudes.</p>
              </div>
            </div>
            <div className="profile-side-step">
              <span>2</span>
              <div>
                <strong>Evaluation obligatoire</strong>
                <p>Questions cliniques, tabacologie, Fagerstrom et vulnerabilites.</p>
              </div>
            </div>
          </div>
          <div className="profile-cta-container">
            <Link className="btn btn-dark profile-cta-btn" to="/evaluation">
              Continuer la timeline clinique
            </Link>
          </div>
        </aside>
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="card form-card mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <div className="section-title-sm">Modifier le profil personnel</div>
              <p className="muted-text mb-0">Les biometries et donnees cliniques se modifient dans l'evaluation.</p>
            </div>
            <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => setIsEditing(false)}>
              Annuler
            </button>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label">Date de naissance</label>
              <input
                className="form-control"
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                disabled
              />
              <small className="muted-text">
                La date de naissance a été validée à l'inscription et ne peut pas être modifiée.
              </small>
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
