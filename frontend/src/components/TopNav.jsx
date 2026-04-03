import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const TopNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <header className={`public-nav ${isLanding ? "public-nav-landing" : ""}`}>
      <div className="container public-nav-inner">
        <Link className="public-brand" to="/">
          <span className="public-brand-mark">
            <i className="bi bi-plus-square-fill" />
          </span>
          <span>
            <span className="public-brand-eyebrow">Accompagnement clinique</span>
            <span className="public-brand-title">NeuralConsult</span>
          </span>
        </Link>

        {isLanding ? (
          <nav className="public-links">
            <a href="#impact" className="public-link">Impact</a>
            <a href="#pathway" className="public-link">Parcours</a>
            <a href="#clarity" className="public-link">Clarte</a>
          </nav>
        ) : (
          <div className="public-links" />
        )}

        <div className="public-actions">
          {user ? (
            <NavLink to="/dashboard" className="btn btn-dark btn-sm">
              Ouvrir l'espace clinique
            </NavLink>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline-dark btn-sm">
                Connexion
              </Link>
              <Link to="/register" className="btn btn-dark btn-sm">
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
