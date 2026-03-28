import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", icon: "bi bi-activity", label: "Command Center" },
  { to: "/onboarding", icon: "bi bi-clipboard2-pulse", label: "Profiling" },
  { to: "/tests", icon: "bi bi-clipboard-data", label: "Tests" },
  { to: "/plan", icon: "bi bi-diagram-3", label: "Plan" },
  { to: "/journal", icon: "bi bi-journal-medical", label: "Journal" },
  { to: "/profile", icon: "bi bi-person-vcard", label: "Profil" }
];

const ClinicalSidebar = () => {
  const { user } = useAuth();
  const profile = user?.profile;
  const statusLabel = profile?.onboardingComplete ? "Patient actif" : "Candidat";

  return (
    <aside className="clinical-sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">
          <i className="bi bi-plus-square-pulse-fill" />
        </div>
        <div>
          <div className="sidebar-eyebrow">Mirror of Urgency</div>
          <div className="sidebar-title">NeuralConsult</div>
        </div>
      </div>

      <div className="sidebar-patient">
        <div className="sidebar-patient-label">Dossier en cours</div>
        <div className="sidebar-patient-name">{user?.fullName || "Patient"}</div>
        <div className="sidebar-status-pill">{statusLabel}</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink key={item.to} className="sidebar-link" to={item.to}>
            <span className="sidebar-link-icon">
              <i className={item.icon} />
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-label">Signal clinique</div>
        <div className="sidebar-footer-copy">
          Plus le brouillard recule, plus le parcours respire.
        </div>
      </div>
    </aside>
  );
};

export default ClinicalSidebar;
