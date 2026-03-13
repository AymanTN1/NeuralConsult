import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError("Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container auth-shell py-5">
      <div className="row g-4 align-items-stretch w-100">
        <div className="col-12 col-lg-6">
          <div className="auth-aside h-100">
            <span className="badge">NeuralConsult Sevrage</span>
            <h2 className="fw-bold mt-3">Reconnectez-vous a votre tableau clinique.</h2>
            <p className="mt-3 text-white-50">
              Retrouvez vos scores, votre plan de sevrage et votre journal quotidien.
            </p>
            <div className="mt-4 d-flex flex-column gap-3">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-clipboard2-pulse" />
                <span>Profiling INPES et tests cliniques</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-graph-up-arrow" />
                <span>Evolution des scores et indicateurs</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-bell" />
                <span>Alertes et suivi personnalise</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card form-card p-4">
            <div className="card-body">
              <h2 className="h4 mb-3 fw-bold">Connexion</h2>
              <p className="muted-text">Accedez a votre espace clinique.</p>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit} className="mt-4">
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Mot de passe</label>
                  <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} required />
                </div>
                <button className="btn btn-dark w-100" disabled={loading}>
                  {loading ? "Connexion..." : "Se connecter"}
                </button>
              </form>
              <p className="mt-3 small muted-text">
                Pas de compte ? <Link to="/register">Creer un compte</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
