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
  patient1: {
    email: "tantaniayman0@gmail.com",
    password: "password",
    role: "Patient en Sevrage (J+30)",
    name: "Youssef El Fassi",
    targetPath: "/dashboard",
    badges: ["3D Poumons Interactif", "35j de Journal", "Communauté & Trophées"],
    description: "Visualisation 3D du souffle, suivi des biomarqueurs et soutien 24/7",
    icon: "bi bi-lungs-fill",
    btnColor: "#10b981"
  },
  patient2: {
    email: "aymantantani18@gmail.com",
    password: "password",
    role: "Patient en Risque de Rechute (J+4)",
    name: "Karim Benali",
    targetPath: "/dashboard",
    badges: ["🚨 Alerte Urgence SOS", "Pic Craving Aigu", "Dialogue Psychologue IA"],
    description: "Scénario d'urgence : Craving violent, échange avec l'IA et alerte médecin",
    icon: "bi bi-exclamation-triangle-fill",
    btnColor: "#f59e0b"
  },
  patient3: {
    email: "projetfinetude4@gmail.com",
    password: "password",
    role: "Patiente en Progression (J+14)",
    name: "Sara Mansour",
    targetPath: "/dashboard",
    badges: ["Substitution TSN 14mg", "Cohérence Cardiaque", "Tests Validés"],
    description: "Parcours féminin actif : réduction progressive et gestion du stress",
    icon: "bi bi-graph-up-arrow",
    btnColor: "#8b5cf6"
  },
  patient4: {
    email: "saidpa1969@gmail.com",
    password: "password",
    role: "Patient Senior Sevré (J+60)",
    name: "Said Alaoui",
    targetPath: "/dashboard",
    badges: ["Abstinence 60 jours", "Capacité +35%", "Sevrage Consolidé"],
    description: "Ancien fumeur de 30 ans : suivi biologique et rémission tabagique",
    icon: "bi bi-check-circle-fill",
    btnColor: "#059669"
  },
  patient5: {
    email: "testaccsimo@gmail.com",
    password: "password",
    role: "Patient Dépendance Sévère (J+2)",
    name: "Mohamed Chraibi",
    targetPath: "/dashboard",
    badges: ["HAD Anxiété 12/21", "Fagerström 7/10", "SOS Déclenché"],
    description: "Scénario crise de sevrage : insomnie, anxiété aiguë et suivi prioritaire",
    icon: "bi bi-lightning-charge-fill",
    btnColor: "#ef4444"
  }
};

// Backwards compatibility alias
DEMO_ACCOUNTS.patient = DEMO_ACCOUNTS.patient1;

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
      if (err?.code === "ECONNABORTED" || err?.message?.includes("timeout") || !err?.response) {
        setError("Impossible de joindre le serveur API (délai d'attente dépassé ou serveur en réveil). Veuillez réessayer dans quelques instants.");
      } else {
        setError(apiError?.message || "La connexion a été refusée. Vérifiez l'email et le mot de passe.");
      }
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
          <div className="col-12">
            <button
              type="button"
              className={`demo-card-btn w-100 p-3 text-start rounded-3 d-flex flex-column justify-content-between ${
                demoLoadingKey === "doctor" ? "loading" : ""
              }`}
              onClick={() => handleDemoLogin("doctor")}
              disabled={loading}
              title="Connexion 1-clic Médecin"
              style={{ borderLeft: "4px solid #0284c7" }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="demo-role-pill doctor">
                    <i className="bi bi-hospital-fill me-1.5 text-primary" />
                    <strong>Espace Médecin Tabacologue</strong>
                  </div>
                  <span className="badge bg-primary text-white rounded-pill x-small px-2.5 py-1">
                    1-Clic Médecin →
                  </span>
                </div>
                <strong className="d-block small text-dark mb-0.5">{DEMO_ACCOUNTS.doctor.name} ({DEMO_ACCOUNTS.doctor.email})</strong>
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

          <div className="col-12 mt-2">
            <div className="d-flex align-items-center gap-2 mb-1">
              <i className="bi bi-people-fill text-success" />
              <span className="x-small fw-bold text-uppercase text-secondary">
                Comptes Patients Démo Associés au Dr. Tantani (1-Clic) :
              </span>
            </div>
          </div>

          {/* 5 Patient Demo Accounts */}
          {[
            { key: "patient1", acc: DEMO_ACCOUNTS.patient1, color: "#10b981", badgeColor: "bg-success" },
            { key: "patient2", acc: DEMO_ACCOUNTS.patient2, color: "#f59e0b", badgeColor: "bg-warning text-dark" },
            { key: "patient3", acc: DEMO_ACCOUNTS.patient3, color: "#8b5cf6", badgeColor: "bg-purple text-white", style: { backgroundColor: "#8b5cf6" } },
            { key: "patient4", acc: DEMO_ACCOUNTS.patient4, color: "#059669", badgeColor: "bg-success" },
            { key: "patient5", acc: DEMO_ACCOUNTS.patient5, color: "#ef4444", badgeColor: "bg-danger" }
          ].map(({ key, acc, color, badgeColor, style }) => (
            <div key={key} className="col-12 col-md-6">
              <button
                type="button"
                className={`demo-card-btn w-100 p-2.5 text-start rounded-3 d-flex flex-column justify-content-between h-100 ${
                  demoLoadingKey === key ? "loading" : ""
                }`}
                onClick={() => handleDemoLogin(key)}
                disabled={loading}
                title={`Connexion 1-clic ${acc.name}`}
                style={{ borderLeft: `3.5px solid ${color}` }}
              >
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <div className="demo-role-pill patient" style={{ fontSize: "0.75rem" }}>
                      <i className={`${acc.icon} me-1`} style={{ color }} />
                      <strong>{acc.role}</strong>
                    </div>
                    <span className={`badge rounded-pill x-small px-2 py-0.5 ${badgeColor}`} style={style || {}}>
                      1-Clic →
                    </span>
                  </div>
                  <strong className="d-block small text-dark mb-0">{acc.name}</strong>
                  <span className="x-small text-primary d-block mb-1 font-monospace">{acc.email}</span>
                  <span className="text-muted x-small d-block mb-2 line-clamp-2">{acc.description}</span>
                </div>
                <div className="demo-badges-row d-flex flex-wrap gap-1 mt-auto">
                  {acc.badges.map((b, i) => (
                    <span key={i} className="demo-mini-tag" style={{ fontSize: "0.68rem" }}>
                      ● {b}
                    </span>
                  ))}
                </div>
              </button>
            </div>
          ))}
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