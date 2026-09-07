import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import { isAdmin, isDoctor, isPatient } from "../utils/roles";
import { requestNotificationPermission, processIncomingNotificationsForNativeAlerts } from "../services/desktopNotifications";

const pageMeta = {
  "/dashboard": {
    eyebrow: "Suivi Clinique · Vue d'ensemble",
    title: "Tableau de bord du parcours"
  },
  "/evaluation": {
    eyebrow: "Évaluation Initiale",
    title: "Consultation initiale structurée"
  },
  "/doctors": {
    eyebrow: "Alliance Thérapeutique",
    title: "Annuaire praticiens & matching"
  },
  "/tests": {
    eyebrow: "Scores & Biométrie",
    title: "Fagerström, HAD & Historique"
  },
  "/plan": {
    eyebrow: "Stratégie Thérapeutique",
    title: "Plans de sevrage & protocoles"
  },
  "/journal": {
    eyebrow: "Suivi Quotidien",
    title: "Respiration, cravings & journal"
  },
  "/appointments": {
    eyebrow: "Rendez-vous Cliniques",
    title: "Consultations & soutien psychique"
  },
  "/notifications": {
    eyebrow: "Boîte de Réception Clinique",
    title: "Alertes, rappels & notifications"
  },
  "/support": {
    eyebrow: "Espace Clinique · Télésurveillance",
    title: "Conversations Assistées & Télésuivi IA"
  },
  "/communities": {
    eyebrow: "Communautés Patients",
    title: "Salons d'entraide & modération"
  },
  "/profile": {
    eyebrow: "Identité",
    title: "Profil & Paramètres"
  },
  "/clinical-guidance": {
    eyebrow: "Ressources Cliniques",
    title: "Assistant RAG & Guidelines HAS"
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
    ? { eyebrow: "Administration Système", title: "Validation des comptes praticiens" }
    : doctorMode
    ? location.pathname === "/profile"
      ? { eyebrow: "Identité Praticien", title: "Profil médecin & exercice" }
      : location.pathname === "/appointments"
        ? { eyebrow: "Agenda Médical", title: "Planning des consultations & urgences" }
        : location.pathname === "/notifications"
          ? { eyebrow: "Télésurveillance", title: "Alertes cliniques & rappels patients" }
        : location.pathname === "/support"
          ? { eyebrow: "Cockpit Médical · Télésurveillance", title: "Conversations Assistées & Triage IA" }
          : location.pathname === "/communities"
            ? { eyebrow: "Communautés Cliniques", title: "Groupes d'entraide & veille" }
            : location.pathname === "/clinical-guidance"
              ? { eyebrow: "Aide à la Décision", title: "Assistant Clinique RAG & Guidelines" }
      : { eyebrow: "Espace Médical", title: "Dossiers patients & validation des protocoles" }
    : (pageMeta[location.pathname] || pageMeta["/dashboard"]);

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
        <img
          className="d-lg-none"
          src="/icons/icon_Neural_Consult_Sevrage.png"
          alt="Logo"
          style={{ width: "36px", height: "36px", borderRadius: "10px", objectFit: "cover" }}
        />
        <div>
          <div className="topbar-eyebrow">{meta.eyebrow}</div>
          <h1 className="topbar-title">{meta.title}</h1>
        </div>
      </div>

      <div className="topbar-actions">
        {/* Live sync badge */}
        <div className="topbar-status-indicator d-none d-xl-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill">
          <span className="pulse-dot" />
          <span className="topbar-status-text">Sync IA Active 24/7</span>
        </div>

        {/* Doctor or Patient verified identity card */}
        {doctorMode ? (
          <div className="topbar-doctor-card d-flex align-items-center gap-2 px-2.5 py-1.5 rounded-3">
            <div className="topbar-doctor-avatar">
              <i className="bi bi-person-badge-fill" />
            </div>
            <div className="d-flex flex-column line-height-tight">
              <div className="d-flex align-items-center gap-1.5">
                <span className="topbar-user-name text-truncate" style={{ maxWidth: "160px" }}>
                  {user?.fullName || "Dr. Ayman Tantani"}
                </span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill x-small px-1.5 py-0">
                  Médecin
                </span>
              </div>
              <span className="topbar-user-sub">Tabacologue Référent</span>
            </div>
          </div>
        ) : adminMode ? (
          <div className="topbar-doctor-card d-flex align-items-center gap-2 px-2.5 py-1.5 rounded-3">
            <div className="topbar-doctor-avatar admin-avatar">
              <i className="bi bi-shield-lock-fill" />
            </div>
            <div className="d-flex flex-column line-height-tight">
              <span className="topbar-user-name">{user?.fullName || "Administrateur"}</span>
              <span className="topbar-user-sub">Supervision Clinique</span>
            </div>
          </div>
        ) : (
          <div className="topbar-doctor-card d-flex align-items-center gap-2 px-2.5 py-1.5 rounded-3">
            <div className="topbar-doctor-avatar patient-avatar">
              <i className="bi bi-person-heart" />
            </div>
            <div className="d-flex flex-column line-height-tight">
              <span className="topbar-user-name text-truncate" style={{ maxWidth: "140px" }}>
                {user?.fullName || "Patient"}
              </span>
              <span className="topbar-user-sub">
                {onboardingComplete ? "Protocole Sevrage J+14" : "Parcours en cours"}
              </span>
            </div>
          </div>
        )}

        {/* Notifications */}
        <button
          className="btn btn-sm topbar-notifications-btn position-relative"
          onClick={() => navigate("/notifications")}
          aria-label="Ouvrir les notifications"
          title="Notifications cliniques"
        >
          <i className="bi bi-bell-fill" />
          {unreadCount > 0 && <span className="topbar-notification-count">{unreadCount}</span>}
        </button>

        {/* Theme toggle */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
          title={isDark ? "Mode clair" : "Mode sombre"}
        >
          {isDark ? (
            <span className="d-flex align-items-center gap-1.5">
              <i className="bi bi-sun-fill text-warning" />
              <span className="theme-toggle-label d-none d-lg-inline">Clair</span>
            </span>
          ) : (
            <span className="d-flex align-items-center gap-1.5">
              <i className="bi bi-moon-stars-fill text-primary" />
              <span className="theme-toggle-label d-none d-lg-inline">Sombre</span>
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          className="btn btn-outline-danger btn-sm topbar-logout-btn d-flex align-items-center gap-1"
          onClick={logout}
          title="Fermer la session clinique"
        >
          <i className="bi bi-box-arrow-right" />
          <span className="d-none d-md-inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
};

export default ClinicalTopbar;
