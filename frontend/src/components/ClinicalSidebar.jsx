import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isAdmin, isDoctor, isPatient } from "../utils/roles";

const patientNavItems = [
  { to: "/dashboard", icon: "bi bi-activity", label: "Tableau de bord" },
  { to: "/evaluation", icon: "bi bi-diagram-3-fill", label: "Evaluation" },
  { to: "/doctors", icon: "bi bi-person-heart", label: "Medecins" },
  { to: "/tests", icon: "bi bi-clipboard-data", label: "Tests" },
  { to: "/plan", icon: "bi bi-diagram-3", label: "Plan" },
  { to: "/journal", icon: "bi bi-journal-medical", label: "Journal" },
  { to: "/profile", icon: "bi bi-person-vcard", label: "Personal Profile" }
];

const doctorNavItems = [
  { to: "/dashboard", icon: "bi bi-speedometer2", label: "Doctor Workspace" },
  { to: "/profile", icon: "bi bi-person-badge", label: "Doctor Profile" }
];

const adminNavItems = [
  { to: "/dashboard", icon: "bi bi-shield-check", label: "Validation medecins" }
];

const ClinicalSidebar = () => {
  const { user } = useAuth();
  const profile = user?.profile;
  const adminMode = isAdmin(user);
  const doctorMode = isDoctor(user);
  const statusLabel = adminMode
    ? "Administrateur"
    : doctorMode
    ? "Medecin"
    : profile?.onboardingComplete
      ? "Patient actif"
      : "Candidat";
  const navItems = adminMode ? adminNavItems : doctorMode ? doctorNavItems : patientNavItems;

  return (
    <aside className="clinical-sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">
          <i className="bi bi-plus-square-pulse-fill" />
        </div>
        <div>
          <div className="sidebar-eyebrow">Calm Clinical Care</div>
          <div className="sidebar-title">NeuralConsult</div>
        </div>
      </div>

      <div className="sidebar-patient">
        <div className="sidebar-patient-label">{doctorMode || adminMode ? "Session en cours" : "Dossier en cours"}</div>
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
        <div className="sidebar-footer-label">{isPatient(user) ? "Repere clinique" : "Pilotage clinique"}</div>
        <div className="sidebar-footer-copy">
          {adminMode
            ? "Vue admin: valider les comptes medecins avant leur mise en relation avec les patients."
            : doctorMode
            ? "Vue medecin: lire le dossier, comprendre la progression et valider un plan adapte."
            : "Une interface plus douce pour aider le patient a rester engage sans surcharge."}
        </div>
      </div>
    </aside>
  );
};

export default ClinicalSidebar;
