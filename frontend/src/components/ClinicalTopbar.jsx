import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isDoctor, isPatient } from "../utils/roles";

const pageMeta = {
  "/dashboard": {
    eyebrow: "Suivi clinique",
    title: "Vue d'ensemble du parcours"
  },
  "/evaluation": {
    eyebrow: "Evaluation initiale",
    title: "Consultation initiale structuree"
  },
  "/doctors": {
    eyebrow: "Alliance medecin-patient",
    title: "Annuaire, matching et demandes"
  },
  "/tests": {
    eyebrow: "Scores cliniques",
    title: "Fagerstrom, HAD et historique"
  },
  "/plan": {
    eyebrow: "Strategie therapeutique",
    title: "Plans de sevrage et protocole"
  },
  "/journal": {
    eyebrow: "Suivi quotidien",
    title: "Respiration, cravings et rechute"
  },
  "/profile": {
    eyebrow: "Identite patient",
    title: "Personal Profile"
  }
};

const ClinicalTopbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const doctorMode = isDoctor(user);
  const meta = doctorMode
    ? location.pathname === "/profile"
      ? { eyebrow: "Identite praticien", title: "Profil medecin et positionnement" }
      : { eyebrow: "Espace medecin", title: "Demandes, dossiers et validation de plans" }
    : (pageMeta[location.pathname] || pageMeta["/dashboard"]);
  const riskScore = Math.max(
    user?.scores?.fagerstromScore || 0,
    user?.scores?.hadAnxietyScore || 0,
    user?.scores?.hadDepressionScore || 0
  );
  const onboardingComplete = !isPatient(user) || user?.profile?.onboardingComplete;

  return (
    <header className="clinical-topbar">
      <div>
        <div className="topbar-eyebrow">{meta.eyebrow}</div>
        <h1 className="topbar-title">{meta.title}</h1>
      </div>

      <div className="topbar-actions">
        <div className={`clinical-score-chip severity-${riskScore >= 11 ? "critical" : riskScore >= 8 ? "warning" : "stable"}`}>
          <span className="clinical-score-chip-label">{doctorMode ? "Role" : "Repere"}</span>
          <span className="clinical-score-chip-value">{doctorMode ? "MD" : riskScore}</span>
        </div>
        <div className={`clinical-score-chip ${onboardingComplete ? "severity-stable" : "severity-warning"}`}>
          <span className="clinical-score-chip-label">Profiling</span>
          <span className="clinical-score-chip-value">{onboardingComplete ? "Complet" : "En cours"}</span>
        </div>
        <div className="topbar-user">
          <div className="topbar-user-name">{user?.fullName || "Patient"}</div>
          <div className="topbar-user-copy">{user?.email}</div>
        </div>
        <button className="btn btn-outline-dark btn-sm topbar-logout" onClick={logout}>
          <i className="bi bi-box-arrow-right me-1" />
          Deconnexion
        </button>
      </div>
    </header>
  );
};

export default ClinicalTopbar;
