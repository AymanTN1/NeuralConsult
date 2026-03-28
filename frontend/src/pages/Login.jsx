import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError("La connexion a ete refusee. Verifiez l'email et le mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-stage">
      <div className="container auth-stage-grid">
        <div className="auth-story">
          <div className="hero-kicker">Secure clinical access</div>
          <h1 className="auth-title">Reconnecter le patient a une interface qui respire avec lui.</h1>
          <p className="auth-copy">
            Retrouver le dashboard, la note clinique, les scores evolutifs et le protocole de sevrage
            dans une meme station de travail sombre, precise et apaisante.
          </p>

          <div className="auth-story-pulse">
            <div className="pulse-ring" />
            <div className="pulse-core">
              <span>HAD / Fagerstrom</span>
              <strong>Signal clinique centralise</strong>
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
            <div className="hero-kicker">Authentication</div>
            <h2 className="auth-card-title">Connexion</h2>
            <p className="muted-text">Accedez a votre poste clinique sans quitter le contexte patient.</p>

            {error && <div className="alert alert-danger mt-3">{error}</div>}

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

              <button className="btn btn-dark w-100" disabled={loading}>
                {loading ? "Connexion..." : "Entrer dans le poste clinique"}
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
