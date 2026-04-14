import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isAdmin, isDoctor, isPatient } from "../utils/roles";

const patientNavItems = [
  { to: "/dashboard", icon: "bi bi-activity", label: "Tableau de bord", guideId: "nav-dashboard" },
  { to: "/evaluation", icon: "bi bi-diagram-3-fill", label: "Evaluation", guideId: "nav-evaluation" },
  { to: "/tests", icon: "bi bi-clipboard-data", label: "Tests", guideId: "nav-tests" },
  { to: "/journal", icon: "bi bi-journal-medical", label: "Journal", guideId: "nav-journal" },
  { to: "/plan", icon: "bi bi-diagram-3", label: "Plan", guideId: "nav-plan" },
  { to: "/doctors", icon: "bi bi-person-heart", label: "Medecins", guideId: "nav-doctors" },
  { to: "/appointments", icon: "bi bi-calendar2-heart", label: "Rendez-vous", guideId: "nav-appointments" },
  { to: "/support", icon: "bi bi-chat-heart", label: "IA 24/7", guideId: "nav-support" },
  { to: "/communities", icon: "bi bi-people-fill", label: "Communautes", guideId: "nav-communities" },
  { to: "/profile", icon: "bi bi-person-vcard", label: "Personal Profile", guideId: "nav-profile" }
];

const doctorNavItems = [
  { to: "/dashboard", icon: "bi bi-speedometer2", label: "Doctor Workspace" },
  { to: "/appointments", icon: "bi bi-calendar2-week", label: "Rendez-vous" },
  { to: "/support", icon: "bi bi-chat-square-heart", label: "Conversations IA" },
  { to: "/communities", icon: "bi bi-people", label: "Communautes" },
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

      <nav className="sidebar-nav" data-guide-id="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            className="sidebar-link"
            to={item.to}
            data-guide-id={item.guideId}
          >
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
