import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });
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
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError("Impossible de creer le compte. Verifiez les champs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container auth-shell py-5">
      <div className="row g-4 align-items-stretch w-100">
        <div className="col-12 col-lg-6">
          <div className="auth-aside h-100">
            <span className="badge">Nouveau parcours</span>
            <h2 className="fw-bold mt-3">Creez votre dossier clinique en quelques minutes.</h2>
            <p className="mt-3 text-white-50">
              Acces au profiling INPES, tests HAD et plan de sevrage personalise.
            </p>
            <div className="mt-4 d-flex flex-column gap-3">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-person-check" />
                <span>Profil patient securise</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-clipboard2-data" />
                <span>Historique medical et scores</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-map" />
                <span>Plan de sevrage adapte</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card form-card p-4">
            <div className="card-body">
              <h2 className="h4 mb-3 fw-bold">Creer un compte</h2>
              <p className="muted-text">Accedez a votre tableau clinique.</p>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit} className="mt-4">
                <div className="mb-3">
                  <label className="form-label">Nom complet</label>
                  <input className="form-control" type="text" name="fullName" value={form.fullName} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Mot de passe</label>
                  <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} required />
                </div>
                <button className="btn btn-dark w-100" disabled={loading}>
                  {loading ? "Creation..." : "Creer le compte"}
                </button>
              </form>
              <p className="mt-3 small muted-text">
                Deja inscrit ? <Link to="/login">Se connecter</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
