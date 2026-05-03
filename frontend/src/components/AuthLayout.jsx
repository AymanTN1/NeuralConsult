import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import Auth3DScene from "./Auth3DScene";

const AuthLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.pathname === "/register" ? "register" : "login");
  
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
    <section className="tabac-auth-wrapper position-relative" style={{ overflow: "hidden" }}>
      <div className="tabac-auth-container" style={{ zIndex: 1, position: "relative" }}>
        
        {/* Left Side (3D Scene + branding) */}
        <div className="tabac-auth-left position-relative" style={{ overflow: "hidden" }}>
          <Auth3DScene />
          
          <div style={{ position: "relative", zIndex: 2 }}>
            <div className="d-flex align-items-center gap-2 mb-4">
              <img src="/icons/icon%20Neural%20Consult%20severage.jpg" alt="Logo" style={{ width: "48px", height: "48px", borderRadius: "12px", objectFit: "cover" }} />
              <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1e3a8a" }}>NeuralConsult</span>
            </div>
            <h2>Une expérience clinique réinventée</h2>
            <ul>
              <li><i className="bi bi-graph-up-arrow" /> Suivi personnalisé de vos progrès</li>
              <li><i className="bi bi-people" /> Communauté de soutien active</li>
              <li><i className="bi bi-shield-check" /> Données sécurisées et privées</li>
              <li><i className="bi bi-journal-medical" /> Protocoles médicaux validés</li>
            </ul>
          </div>
        </div>

        {/* Right Side (Forms) */}
        <div className="tabac-auth-right" style={{ position: "relative" }}>
          <div className="tabac-auth-header">
            <h2>Bienvenue !</h2>
            <p>{activeTab === "login" ? "Connectez-vous à votre espace" : "Créez votre compte gratuitement"}</p>
          </div>
          
          <div className="tabac-auth-tabs">
            <a 
              href="/login" 
              className={`tabac-auth-tab ${activeTab === "login" ? "active" : ""}`}
              onClick={(e) => handleTabSwitch(e, "/login")}
            >
              Connexion
            </a>
            <a 
              href="/register" 
              className={`tabac-auth-tab ${activeTab === "register" ? "active" : ""}`}
              onClick={(e) => handleTabSwitch(e, "/register")}
            >
              Inscription
            </a>
          </div>

          <div className="auth-form-container" style={{ position: "relative", flex: 1 }}>
            {/* The routed form (Login or Register) will render here */}
            <Outlet />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthLayout;
