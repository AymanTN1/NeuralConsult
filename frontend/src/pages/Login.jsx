import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LungLoader from "../components/LungLoader";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: location.state?.email || "", password: "" });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(location.state?.message || null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="auth-form-slide-enter w-100">
      {loading && <LungLoader text="Ouverture de votre session clinique..." />}
      {error && <div className="alert alert-danger mb-3">{error}</div>}
          {successMessage && <div className="alert alert-success mb-3">{successMessage}</div>}

          <form onSubmit={handleSubmit} className="auth-form" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="form-label mb-1">Adresse email</label>
              <div className="position-relative">
                <i className="bi bi-envelope position-absolute" style={{ left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
                <input className="form-control light-input light-input-icon" type="email" name="email" placeholder="votre@email.com" value={form.email} onChange={handleChange} required />
              </div>
            </div>

            <div>
              <label className="form-label mb-1">Mot de passe</label>
              <div className="position-relative">
                <i className="bi bi-lock position-absolute" style={{ left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
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
              <Link to="/forgot-password" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>Mot de passe oublié ?</Link>
            </div>

            <button className="btn tabac-btn-submit w-100" disabled={loading}>
              {loading ? "Connexion..." : <><i className="bi bi-box-arrow-in-right me-2" /> Se connecter</>}
            </button>

            <p className="text-center mt-3 mb-0" style={{ color: "#6b7280" }}>
              Pas encore de compte ? <Link to="/register" style={{ color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>Inscrivez-vous gratuitement</Link>
            </p>
          </form>
        
    </div>
  );
};

export default Login;