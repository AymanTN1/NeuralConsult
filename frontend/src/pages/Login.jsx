import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: location.state?.email || "", password: "" });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(location.state?.message || null);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      const apiError = err?.response?.data;
      if (apiError?.error === "EMAIL_VERIFICATION_REQUIRED") {
        const pendingEmail = apiError?.email || form.email;
        localStorage.setItem("nc_pending_verification_email", pendingEmail);
        navigate("/verify-email", {
          state: {
            email: pendingEmail,
            message: "Votre compte existe, mais l'adresse email doit encore etre verifiee. Un nouveau code vient d'etre envoye."
          }
        });
        return;
      }
      setError(apiError?.message || "La connexion a ete refusee. Verifiez l'email et le mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-stage">
      <div className="container auth-stage-grid">
        <div className="auth-story">
          <div className="hero-kicker">Acces clinique apaise</div>
          <h1 className="auth-title">Reconnecter le patient a une interface plus douce, plus lisible et plus rassurante.</h1>
          <p className="auth-copy">
            Retrouver le tableau de bord, les scores, la note clinique et le protocole de sevrage
            dans un espace de travail qui privilegie le calme et la comprehension.
          </p>

          <div className="auth-story-pulse">
            <div className="pulse-ring" />
            <div className="pulse-core">
              <span>HAD / Fagerstrom</span>
              <strong>Repères cliniques centralises</strong>
            </div>
          </div>

          <div className="auth-feature-list">
            <div className="auth-feature-card">
              <i className="bi bi-activity" />
              <span>Vue d'ensemble du risque</span>
            </div>
            <div className="auth-feature-card">
              <i className="bi bi-journal-medical" />
              <span>Journal et progression quotidienne</span>
            </div>
            <div className="auth-feature-card">
              <i className="bi bi-stars" />
              <span>Insights cliniques et notes AI</span>
            </div>
          </div>
        </div>

        <div className="auth-card-shell">
          <div className="auth-card">
            <div className="hero-kicker">Authentification</div>
            <h2 className="auth-card-title">Connexion</h2>
            <p className="muted-text">Accedez a votre espace clinique et reprenez le suivi la ou il s'etait arrete.</p>

            {error && <div className="alert alert-danger mt-3">{error}</div>}
            {successMessage && <div className="alert alert-success mt-3">{successMessage}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <label className="form-label">Email</label>
              <input
                className="form-control"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />

              <label className="form-label">Mot de passe</label>
              <input
                className="form-control"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />

              <div className="d-flex justify-content-end mt-1">
                <Link to="/forgot-password" className="auth-inline-link">
                  Mot de passe oublie ?
                </Link>
              </div>

              <button className="btn btn-dark w-100" disabled={loading}>
                {loading ? "Connexion..." : "Entrer dans l'espace clinique"}
              </button>
            </form>

            <p className="auth-alt-link">
              Nouveau ici ? <Link to="/register">Creer le dossier d'acces</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
