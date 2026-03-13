import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const TopNav = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isHome = location.pathname === "/";

  const handleToggle = () => setOpen((prev) => !prev);
  const handleNavClick = () => setOpen(false);

  return (
    <nav className={`navbar navbar-expand-lg navbar-light ${isHome ? "nav-hero" : "bg-white"} sticky-top border-bottom`}>
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
          <span className="brand-icon"><i className="bi bi-activity" /></span>
          NeuralConsult
        </Link>
        <button className="navbar-toggler" type="button" onClick={handleToggle} aria-label="Toggle navigation">
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse ${open ? "show" : ""}`}>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {user && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/dashboard" onClick={handleNavClick}>
                    <i className="bi bi-speedometer2 me-1" /> Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/onboarding" onClick={handleNavClick}>
                    <i className="bi bi-clipboard2-pulse me-1" /> Profiling
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/tests" onClick={handleNavClick}>
                    <i className="bi bi-ui-checks me-1" /> Tests
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/plan" onClick={handleNavClick}>
                    <i className="bi bi-map me-1" /> Plan
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/journal" onClick={handleNavClick}>
                    <i className="bi bi-journal-text me-1" /> Journal
                  </NavLink>
                </li>
              </>
            )}
          </ul>
          <div className="d-flex align-items-center gap-2">
            {!user && (
              <>
                <Link to="/login" className="btn btn-outline-dark btn-sm" onClick={handleNavClick}>
                  Se connecter
                </Link>
                <Link to="/register" className="btn btn-dark btn-sm" onClick={handleNavClick}>
                  Commencer
                </Link>
              </>
            )}
            {user && (
              <>
                <NavLink className="btn btn-outline-dark btn-sm" to="/profile" onClick={handleNavClick}>
                  <i className="bi bi-person-circle me-1" /> Profil
                </NavLink>
                <button className="btn btn-dark btn-sm" onClick={logout}>
                  <i className="bi bi-box-arrow-right me-1" /> Deconnexion
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
