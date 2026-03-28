import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });
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
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError("La creation du compte a echoue. Verifiez les champs et reessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-stage">
      <div className="container auth-stage-grid">
        <div className="auth-story">
          <div className="hero-kicker">First access</div>
          <h1 className="auth-title">Ouvrir un parcours qui transforme la fumee en donnees exploitables.</h1>
          <p className="auth-copy">
            Le nouvel utilisateur entre d'abord dans un sas clinique. Ensuite viennent le dossier initial,
            les tests, les notes medicales et le plan de sevrage.
          </p>

          <div className="auth-story-matrix">
            <div className="matrix-card">
              <span>Phase 1</span>
              <strong>Onboarding force</strong>
            </div>
            <div className="matrix-card">
              <span>Phase 2</span>
              <strong>Scoring + notes</strong>
            </div>
            <div className="matrix-card">
              <span>Phase 3</span>
              <strong>Plan + respiration</strong>
            </div>
          </div>
        </div>

        <div className="auth-card-shell">
          <div className="auth-card">
            <div className="hero-kicker">Clinical account</div>
            <h2 className="auth-card-title">Creer un compte</h2>
            <p className="muted-text">La premiere connexion ouvrira directement le dossier patient.</p>

            {error && <div className="alert alert-danger mt-3">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <label className="form-label">Nom complet</label>
              <input
                className="form-control"
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
              />

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
                {loading ? "Creation..." : "Activer le parcours clinique"}
              </button>
            </form>

            <p className="auth-alt-link">
              Deja inscrit ? <Link to="/login">Revenir a la connexion</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;
