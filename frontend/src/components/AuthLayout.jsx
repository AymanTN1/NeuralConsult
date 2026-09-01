import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";

const AuthLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.pathname === "/register" ? "register" : "login");
  const isRegister = activeTab === "register";

  // Update state if URL changes directly
  useEffect(() => {
    setActiveTab(location.pathname === "/register" ? "register" : "login");
  }, [location.pathname]);

  const handleTabSwitch = (e, path) => {
    e.preventDefault();
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  return (
    <section className={`tabac-auth-wrapper ${isRegister ? "auth-mode-register" : "auth-mode-login"}`}>
      {isRegister ? (
        /* REGISTER MODE: Centered wide medical dossier card with top trust badges */
        <div className="tabac-auth-register-card">
          <div className="register-header-brand-row">
            <Link to="/" className="auth-brand-badge">
              <img
                src="/icons/icon_Neural_Consult_Sevrage.png"
                alt="NeuralConsult"
                className="auth-brand-logo"
              />
              <div className="auth-brand-text">
                <span className="auth-brand-eyebrow">Accompagnement Clinique</span>
                <span className="auth-brand-name">NeuralConsult</span>
              </div>
            </Link>

            <div className="auth-kicker-pill">
              <i className="bi bi-shield-check text-success" />
              <span>Dossier Médical Certifié & Sécurisé HDS</span>
            </div>
          </div>

          <div className="register-trust-banner">
            <div className="trust-mini-pill">
              <i className="bi bi-camera-video-fill text-primary" />
              <span><strong>Téléconsultation 50 DH</strong> (Solidaire)</span>
            </div>
            <div className="trust-mini-pill">
              <i className="bi bi-heart-pulse-fill" style={{ color: "#f43f5e" }} />
              <span><strong>Psychologue 24/7</strong> (TCC Sevrage)</span>
            </div>
            <div className="trust-mini-pill">
              <i className="bi bi-shield-lock-fill text-success" />
              <span><strong>Secret Médical</strong> (BO n° 7066)</span>
            </div>
            <div className="trust-mini-pill">
              <i className="bi bi-patch-check-fill text-warning" />
              <span><strong>HAS & OMS</strong> (Protocoles Agréés)</span>
            </div>
          </div>

          <div className="register-form-header">
            <div className="tabac-auth-header-clean text-center">
              <div className="auth-header-eyebrow">
                <span className="pulse-dot-sm" />
                <span>Création de Dossier Clinique Patient & Médecin</span>
              </div>
              <h2>Commencer mon sevrage</h2>
              <p>Remplissez vos informations pour débuter votre accompagnement clinique personnalisé.</p>
            </div>

            <div className="tabac-auth-tabs-segmented register-tabs-width">
              <button
                type="button"
                className={`auth-segment-btn ${activeTab === "login" ? "active" : ""}`}
                onClick={(e) => handleTabSwitch(e, "/login")}
              >
                <i className="bi bi-box-arrow-in-right me-2" />
                Connexion
              </button>
              <button
                type="button"
                className={`auth-segment-btn ${activeTab === "register" ? "active" : ""}`}
                onClick={(e) => handleTabSwitch(e, "/register")}
              >
                <i className="bi bi-person-plus-fill me-2" />
                Inscription
              </button>
            </div>
          </div>

          <div className="auth-form-container">
            <Outlet />
          </div>

          <div className="auth-right-footer-security">
            <i className="bi bi-lock-fill text-muted me-1" />
            <span>Connexion SSL 256-bit sécurisée • Hébergement Données de Santé (HDS) • Conforme Déontologie Médicale BO n° 7066</span>
          </div>
        </div>
      ) : (
        /* LOGIN MODE: 2-column split card */
        <div className="tabac-auth-container tabac-auth-container-login">
          {/* Left Side (Medical branding & clinical benefits) */}
          <div className="tabac-auth-left">
            <div className="auth-left-ambient-glow" />

            <div className="auth-left-content">
              <Link to="/" className="auth-brand-badge">
                <img
                  src="/icons/icon_Neural_Consult_Sevrage.png"
                  alt="NeuralConsult"
                  className="auth-brand-logo"
                />
                <div className="auth-brand-text">
                  <span className="auth-brand-eyebrow">Accompagnement Clinique</span>
                  <span className="auth-brand-name">NeuralConsult</span>
                </div>
              </Link>

              <div className="auth-kicker-pill">
                <i className="bi bi-shield-check text-success" />
                <span>Espace Médical Sécurisé & Certifié</span>
              </div>

              <h1 className="auth-hero-title">
                Votre liberté commence par un souffle apaisé.
              </h1>
              <p className="auth-hero-desc">
                Rejoignez une plateforme médicale fondée sur les recommandations de la Haute Autorité de Santé (HAS) et de l'OMS.
              </p>

              <div className="auth-benefits-grid">
                <div className="auth-benefit-item">
                  <div className="benefit-icon icon-blue">
                    <i className="bi bi-camera-video-fill" />
                  </div>
                  <div>
                    <strong>Téléconsultation Solidaire (50 DH)</strong>
                    <span>Médecins & Tabacologues certifiés</span>
                  </div>
                </div>

                <div className="auth-benefit-item">
                  <div className="benefit-icon icon-rose">
                    <i className="bi bi-heart-pulse-fill" />
                  </div>
                  <div>
                    <strong>Soutien Psychologique 24/7</strong>
                    <span>Thérapies TCC & gestion du manque</span>
                  </div>
                </div>

                <div className="auth-benefit-item">
                  <div className="benefit-icon icon-emerald">
                    <i className="bi bi-shield-lock-fill" />
                  </div>
                  <div>
                    <strong>Secret Médical & HDS</strong>
                    <span>Données de santé strictement chiffrées</span>
                  </div>
                </div>

                <div className="auth-benefit-item">
                  <div className="benefit-icon icon-amber">
                    <i className="bi bi-journal-check" />
                  </div>
                  <div>
                    <strong>Protocoles Agréés HAS / OMS</strong>
                    <span>Bilans Fagerström & HAD validés</span>
                  </div>
                </div>
              </div>

              <div className="auth-clinical-quote">
                <i className="bi bi-quote quote-icon" />
                <p>
                  "Le sevrage tabagique n'est pas une épreuve de volonté solitaire, mais une alliance médicale bienveillante et structurée."
                </p>
                <span>— Conseil Scientifique NeuralConsult</span>
              </div>
            </div>
          </div>

          {/* Right Side (Form card) */}
          <div className="tabac-auth-right">
            <div className="tabac-auth-header-clean">
              <div className="auth-header-eyebrow">
                <span className="pulse-dot-sm" />
                <span>Connexion Espace Patient & Médecin</span>
              </div>
              <h2>Bon retour parmi nous</h2>
              <p>Accédez à votre suivi personnalisé, vos ordonnances et vos téléconsultations.</p>
            </div>

            <div className="tabac-auth-tabs-segmented">
              <button
                type="button"
                className={`auth-segment-btn ${activeTab === "login" ? "active" : ""}`}
                onClick={(e) => handleTabSwitch(e, "/login")}
              >
                <i className="bi bi-box-arrow-in-right me-2" />
                Connexion
              </button>
              <button
                type="button"
                className={`auth-segment-btn ${activeTab === "register" ? "active" : ""}`}
                onClick={(e) => handleTabSwitch(e, "/register")}
              >
                <i className="bi bi-person-plus-fill me-2" />
                Inscription
              </button>
            </div>

            <div className="auth-form-container">
              <Outlet />
            </div>

            <div className="auth-right-footer-security">
              <i className="bi bi-lock-fill text-muted me-1" />
              <span>Connexion SSL 256-bit sécurisée • Conforme Déontologie Médicale BO n° 7066</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AuthLayout;


