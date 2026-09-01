import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LungLoader from "../components/LungLoader";

const DEMO_ACCOUNTS = {
  doctor: {
    email: "ayman.tantani@uit.ac.ma",
    password: "password",
    role: "Médecin Tabacologue Référent",
    name: "Dr. Ayman Tantani",
    targetPath: "/doctor-workspace",
    badges: ["5 Dossiers Patients", "Synthèses IA RAG", "Téléconsultations"],
    description: "Accès complet au dossier médical, alertes d'urgences IA et ordonnances",
    icon: "bi bi-hospital-fill",
    btnColor: "#0284c7"
  },
  patient: {
    email: "tantaniayman0@gmail.com",
    password: "password",
    role: "Patient en Sevrage (J+30)",
    name: "Youssef El Fassi (@samy_zen)",
    targetPath: "/dashboard",
    badges: ["3D Poumons Interactif", "35j de Journal", "Communauté & Trophées"],
    description: "Visualisation 3D du souffle, suivi des biomarqueurs et soutien 24/7",
    icon: "bi bi-lungs-fill",
    btnColor: "#10b981"
  }
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: location.state?.email || "", password: "" });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(location.state?.message || null);
  const [loading, setLoading] = useState(false);
  const [demoLoadingKey, setDemoLoadingKey] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const executeLogin = async (email, password, redirectPath = "/dashboard") => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await login(email, password);
      if (redirectPath === "/dashboard" && result?.roles?.includes("ROLE_DOCTOR")) {
        navigate("/doctor-workspace");
      } else {
        navigate(redirectPath);
      }
    } catch (err) {
      const apiError = err?.response?.data;
      if (apiError?.error === "EMAIL_VERIFICATION_REQUIRED") {
        const pendingEmail = apiError?.email || email;
        localStorage.setItem("nc_pending_verification_email", pendingEmail);
        navigate("/verify-email", {
          state: {
            email: pendingEmail,
            message: "Votre compte existe, mais l'adresse email doit encore être vérifiée. Un nouveau code vient d'être envoyé."
          }
        });
        return;
      }
      setError(apiError?.message || "La connexion a été refusée. Vérifiez l'email et le mot de passe.");
    } finally {
      setLoading(false);
      setDemoLoadingKey(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await executeLogin(form.email, form.password);
  };

  const handleDemoLogin = async (key) => {
    const demo = DEMO_ACCOUNTS[key];
    if (!demo) return;
    
    // Auto-fill inputs visually on screen
    setForm({ email: demo.email, password: demo.password });
    setDemoLoadingKey(key);
    
    // Immediately execute login without requiring typing
    await executeLogin(demo.email, demo.password, demo.targetPath);
  };

  return (
    <div className="auth-form-slide-enter w-100">
      {loading && (
        <LungLoader
          text={
            demoLoadingKey
              ? `Connexion automatique à la session ${DEMO_ACCOUNTS[demoLoadingKey]?.role}...`
              : "Ouverture de votre session clinique..."
          }
        />
      )}

      {error && <div className="alert alert-danger mb-3 rounded-3">{error}</div>}
      {successMessage && <div className="alert alert-success mb-3 rounded-3">{successMessage}</div>}

      {/* 💼 1-CLICK PORTFOLIO / RECRUITER DEMO ACCESS */}
      <div className="demo-portfolio-box mb-4 p-3.5 rounded-4 shadow-sm">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <span className="demo-pulse-icon">
              <i className="bi bi-stars text-warning" />
            </span>
            <div>
              <strong className="d-block small text-uppercase tracking-wider text-gradient-primary">
                💼 Accès Démo Portfolio & Recruteur (1-Clic)
              </strong>
              <span className="text-muted x-small">
                Cliquez sur un rôle pour remplir et vous connecter instantanément sans mot de passe :
              </span>
            </div>
          </div>
        </div>

        <div className="row g-2.5">
          {/* Doctor Demo Button */}
          <div className="col-12 col-sm-6">
            <button
              type="button"
              className={`demo-card-btn w-100 p-3 text-start rounded-3 d-flex flex-column justify-content-between ${
                demoLoadingKey === "doctor" ? "loading" : ""
              }`}
              onClick={() => handleDemoLogin("doctor")}
              disabled={loading}
              title="Connexion 1-clic Médecin"
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="demo-role-pill doctor">
                    <i className="bi bi-hospital-fill me-1.5 text-primary" />
                    <strong>Démo Médecin</strong>
                  </div>
                  <span className="badge bg-primary text-white rounded-pill x-small px-2 py-0.5">
                    1-Clic →
                  </span>
                </div>
                <strong className="d-block small text-dark mb-0.5">{DEMO_ACCOUNTS.doctor.name}</strong>
                <span className="text-muted x-small d-block mb-2">{DEMO_ACCOUNTS.doctor.description}</span>
              </div>
              <div className="demo-badges-row d-flex flex-wrap gap-1">
                {DEMO_ACCOUNTS.doctor.badges.map((b, i) => (
                  <span key={i} className="demo-mini-tag">
                    ● {b}
                  </span>
                ))}
              </div>
            </button>
          </div>

          {/* Patient Demo Button */}
          <div className="col-12 col-sm-6">
            <button
              type="button"
              className={`demo-card-btn w-100 p-3 text-start rounded-3 d-flex flex-column justify-content-between ${
                demoLoadingKey === "patient" ? "loading" : ""
              }`}
              onClick={() => handleDemoLogin("patient")}
              disabled={loading}
              title="Connexion 1-clic Patient"
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="demo-role-pill patient">
                    <i className="bi bi-lungs-fill me-1.5 text-success" />
                    <strong>Démo Patient</strong>
                  </div>
                  <span className="badge bg-success text-white rounded-pill x-small px-2 py-0.5">
                    1-Clic →
                  </span>
                </div>
                <strong className="d-block small text-dark mb-0.5">{DEMO_ACCOUNTS.patient.name}</strong>
                <span className="text-muted x-small d-block mb-2">{DEMO_ACCOUNTS.patient.description}</span>
              </div>
              <div className="demo-badges-row d-flex flex-wrap gap-1">
                {DEMO_ACCOUNTS.patient.badges.map((b, i) => (
                  <span key={i} className="demo-mini-tag">
                    ● {b}
                  </span>
                ))}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="demo-divider my-3.5">
        <span>ou saisie manuelle d'identifiants</span>
      </div>

      {/* Standard Form */}
      <form onSubmit={handleSubmit} className="auth-form" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="form-label mb-1 fw-semibold">Adresse email</label>
          <div className="position-relative">
            <i
              className="bi bi-envelope position-absolute"
              style={{
                left: "1.1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                pointerEvents: "none",
                zIndex: 3,
                fontSize: "1.1rem"
              }}
            />
            <input
              className="form-control light-input light-input-icon"
              type="email"
              name="email"
              placeholder="votre@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="form-label mb-1 fw-semibold">Mot de passe</label>
          <div className="position-relative">
            <i
              className="bi bi-lock position-absolute"
              style={{
                left: "1.1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                pointerEvents: "none",
                zIndex: 3,
                fontSize: "1.1rem"
              }}
            />
            <input
              className="form-control light-input light-input-icon"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Votre mot de passe"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="auth-pass-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} />
            </button>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-2">
          <label className="light-checkbox d-flex align-items-center gap-2 m-0" style={{ cursor: "pointer" }}>
            <input type="checkbox" />
            <span className="muted-text">Se souvenir de moi</span>
          </label>
          <Link
            to="/forgot-password"
            style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <button className="btn tabac-btn-submit w-100 mt-1" disabled={loading}>
          {loading ? "Connexion..." : <><i className="bi bi-box-arrow-in-right me-2" /> Se connecter</>}
        </button>

        <p className="text-center mt-3 mb-0" style={{ color: "#6b7280" }}>
          Pas encore de compte ?{" "}
          <Link to="/register" style={{ color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>
            Inscrivez-vous gratuitement
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;