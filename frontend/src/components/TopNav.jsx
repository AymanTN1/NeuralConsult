import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const TopNav = () => {
  const { user } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const isLanding = location.pathname === "/";

  const handleScrollTo = (e, targetId) => {
    if (!isLanding) return;
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const navHeight = 76;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - navHeight,
        behavior: "smooth"
      });
    }
  };

  return (
    <header className={`public-nav ${isLanding ? "public-nav-landing" : ""}`}>
      <div className="container public-nav-inner">
        <Link className="public-brand" to="/">
          <span className="public-brand-mark">
            <img src="/icons/icon_Neural_Consult_Sevrage.png" alt="NeuralConsult Icon" className="public-brand-img" />
          </span>
          <span className="public-brand-text">
            <span className="public-brand-eyebrow">Accompagnement clinique</span>
            <span className="public-brand-title">NeuralConsult</span>
          </span>
        </Link>

        {isLanding ? (
          <nav className="public-links" aria-label="Navigation principale">
            <a href="#services" onClick={(e) => handleScrollTo(e, "services")} className="public-link">
              Services & Tarifs
            </a>
            <a href="#impact" onClick={(e) => handleScrollTo(e, "impact")} className="public-link">
              Impact
            </a>
            <a href="#accreditations" onClick={(e) => handleScrollTo(e, "accreditations")} className="public-link">
              Agréments & Science
            </a>
            <a href="#pathway" onClick={(e) => handleScrollTo(e, "pathway")} className="public-link">
              Parcours
            </a>
            <a href="#contact" onClick={(e) => handleScrollTo(e, "contact")} className="public-link">
              Contact
            </a>
          </nav>
        ) : (
          <div className="public-links" />
        )}

        <div className="public-actions d-flex align-items-center gap-2">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
            title={isDark ? "Mode clair" : "Mode sombre"}
            type="button"
          >
            {isDark ? <i className="bi bi-sun-fill text-warning" /> : <i className="bi bi-moon-stars-fill text-primary" />}
          </button>
          {user ? (
            <NavLink to="/dashboard" className="btn btn-primary-gradient btn-sm">
              <i className="bi bi-shield-check me-1" />
              Espace clinique
            </NavLink>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline-primary btn-sm rounded-pill fw-bold px-2.5 d-none d-sm-inline-flex align-items-center">
                <i className="bi bi-stars text-warning me-1.5" />
                Démo Portfolio
              </Link>
              <Link to="/login" className="btn btn-ghost-nav btn-sm">
                Connexion
              </Link>
              <Link to="/register" className="btn btn-primary-gradient btn-sm">
                Commencer
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
