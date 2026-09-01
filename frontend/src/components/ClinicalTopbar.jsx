import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import { isAdmin, isDoctor, isPatient } from "../utils/roles";
import { requestNotificationPermission, processIncomingNotificationsForNativeAlerts } from "../services/desktopNotifications";

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
  "/appointments": {
    eyebrow: "Rendez-vous clinique",
    title: "Organisation des seances et soutien psychique"
  },
  "/notifications": {
    eyebrow: "Boite de reception clinique",
    title: "Notifications, rappels et messages importants"
  },
  "/support": {
    eyebrow: "Soutien 24/7",
    title: "Conversations IA, signaux de risque et escalade medecin"
  },
  "/communities": {
    eyebrow: "Communautes patients",
    title: "Salons d'entraide, discussions et moderation"
  },
  "/profile": {
    eyebrow: "Identite patient",
    title: "Profil personnel"
  },
  "/clinical-guidance": {
    eyebrow: "Ressources Cliniques",
    title: "Assistant Clinique RAG & Guidelines"
  }
};

const ClinicalTopbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const adminMode = isAdmin(user);
  const doctorMode = isDoctor(user);
  const [unreadCount, setUnreadCount] = useState(0);
  const meta = adminMode
    ? { eyebrow: "Validation clinique", title: "Comptes medecins en attente de validation" }
    : doctorMode
    ? location.pathname === "/profile"
      ? { eyebrow: "Identite praticien", title: "Profil medecin et positionnement" }
      : location.pathname === "/appointments"
        ? { eyebrow: "Rendez-vous medecin", title: "Planning, confirmations et seances completes" }
        : location.pathname === "/notifications"
          ? { eyebrow: "Boite de reception medecin", title: "Alertes, rendez-vous et rappels a traiter" }
        : location.pathname === "/support"
          ? { eyebrow: "Conversations assistees", title: "Alertes IA et suivi psychologique continu" }
          : location.pathname === "/communities"
            ? { eyebrow: "Communautes cliniques", title: "Groupes d'entraide et moderation" }
            : location.pathname === "/clinical-guidance"
              ? { eyebrow: "Ressources Cliniques", title: "Assistant Clinique RAG & Guidelines" }
      : { eyebrow: "Espace medecin", title: "Demandes, dossiers et validation de plans" }
    : (pageMeta[location.pathname] || pageMeta["/dashboard"]);
  const riskScore = Math.max(
    user?.scores?.fagerstromScore || 0,
    user?.scores?.hadAnxietyScore || 0,
    user?.scores?.hadDepressionScore || 0
  );
  const onboardingComplete = !isPatient(user) || user?.profile?.onboardingComplete;

  useEffect(() => {
    let ignore = false;

    if (user) {
      requestNotificationPermission();
    }

    const loadSummaryAndCheckNative = async () => {
      try {
        const summaryRes = await api.get("/api/notifications/summary");
        if (!ignore) {
          setUnreadCount(summaryRes.data?.unreadCount || 0);
        }

        if (summaryRes.data?.unreadCount > 0) {
          const listRes = await api.get("/api/notifications");
          if (!ignore) {
            processIncomingNotificationsForNativeAlerts(listRes.data, navigate);
          }
        }
      } catch (error) {
        if (!ignore) {
          setUnreadCount(0);
        }
      }
    };

    if (user) {
      loadSummaryAndCheckNative();
      const interval = setInterval(loadSummaryAndCheckNative, 20000);
      return () => {
        ignore = true;
        clearInterval(interval);
      };
    }
  }, [user, location.pathname, navigate]);

  return (
    <header className="clinical-topbar">
      <div className="d-flex align-items-center gap-3">
        <img className="d-lg-none" src="/icons/icon_Neural_Consult_Sevrage.png" alt="Logo" style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover' }} />
        <div>
          <div className="topbar-eyebrow">{meta.eyebrow}</div>
          <h1 className="topbar-title">{meta.title}</h1>
        </div>
      </div>

      <div className="topbar-actions">
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
          title={isDark ? "Mode clair" : "Mode sombre"}
        >
          {isDark ? (
            <span className="d-flex align-items-center gap-2">
              <i className="bi bi-sun-fill text-warning" />
              <span className="theme-toggle-label d-none d-md-inline">Clair</span>
            </span>
          ) : (
            <span className="d-flex align-items-center gap-2">
              <i className="bi bi-moon-stars-fill text-primary" />
              <span className="theme-toggle-label d-none d-md-inline">Sombre</span>
            </span>
          )}
        </button>
        <div className={`clinical-score-chip severity-${riskScore >= 11 ? "critical" : riskScore >= 8 ? "warning" : "stable"}`}>
          <span className="clinical-score-chip-label">{doctorMode || adminMode ? "Role" : "Repere"}</span>
          <span className="clinical-score-chip-value">{adminMode ? "ADMIN" : doctorMode ? "MD" : riskScore}</span>
        </div>
        <div className={`clinical-score-chip ${onboardingComplete ? "severity-stable" : "severity-warning"}`}>
          <span className="clinical-score-chip-label">Parcours</span>
          <span className="clinical-score-chip-value">{onboardingComplete ? "Complet" : "En cours"}</span>
        </div>
        <div className="topbar-user">
          <div className="topbar-user-name">{user?.fullName || "Patient"}</div>
          <div className="topbar-user-copy">{user?.email}</div>
        </div>
        <button className="btn btn-outline-dark btn-sm topbar-notifications" onClick={() => navigate("/notifications")} aria-label="Ouvrir les notifications" title="Notifications">
          <i className="bi bi-bell-fill" />
          {unreadCount > 0 && <span className="topbar-notification-count">{unreadCount}</span>}
        </button>
        <button className="btn btn-outline-dark btn-sm topbar-logout" onClick={logout}>
          <i className="bi bi-box-arrow-right me-1" />
          Deconnexion
        </button>
      </div>
    </header>
  );
};

export default ClinicalTopbar;
