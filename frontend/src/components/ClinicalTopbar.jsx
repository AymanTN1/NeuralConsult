import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const pageMeta = {
  "/dashboard": {
    eyebrow: "Station clinique",
    title: "Vue d'ensemble du risque"
  },
  "/evaluation": {
    eyebrow: "Evaluation timeline",
    title: "Consultation initiale structuree"
  },
  "/tests": {
    eyebrow: "Scores dynamiques",
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
  const meta = pageMeta[location.pathname] || pageMeta["/dashboard"];
  const riskScore = Math.max(
    user?.scores?.fagerstromScore || 0,
    user?.scores?.hadAnxietyScore || 0,
    user?.scores?.hadDepressionScore || 0
  );
  const onboardingComplete = user?.profile?.onboardingComplete;

  return (
    <header className="clinical-topbar">
      <div>
        <div className="topbar-eyebrow">{meta.eyebrow}</div>
        <h1 className="topbar-title">{meta.title}</h1>
      </div>

      <div className="topbar-actions">
        <div className={`clinical-score-chip severity-${riskScore >= 11 ? "critical" : riskScore >= 8 ? "warning" : "stable"}`}>
          <span className="clinical-score-chip-label">Signal</span>
          <span className="clinical-score-chip-value">{riskScore}</span>
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
