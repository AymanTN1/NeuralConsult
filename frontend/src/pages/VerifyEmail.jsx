import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const VerifyEmail = () => {
  const { verifyEmail, resendVerification } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || localStorage.getItem("nc_pending_verification_email") || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(location.state?.message || null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (email) {
      localStorage.setItem("nc_pending_verification_email", email);
    }
  }, [email]);

  const handleVerify = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await verifyEmail(email, code);
      localStorage.removeItem("nc_pending_verification_email");
      navigate("/dashboard");
    } catch (err) {
      const apiError = err?.response?.data?.message || err?.response?.data?.error;
      setError(apiError || "Impossible de verifier cet email pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Saisissez d'abord l'email a verifier.");
      return;
    }
    setResending(true);
    setError(null);
    try {
      const response = await resendVerification(email);
      setMessage(response?.message || "Un nouveau code a ete envoye.");
    } catch (err) {
      const apiError = err?.response?.data?.message || err?.response?.data?.error;
      setError(apiError || "Impossible de renvoyer le code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <section className="auth-stage">
      <div className="container auth-stage-grid">
        <div className="auth-story">
          <div className="hero-kicker">Verification clinique</div>
          <h1 className="auth-title">Confirmez que votre adresse email est bien accessible avant d'entrer dans la plateforme.</h1>
          <p className="auth-copy">
            Nous envoyons un code a 6 chiffres pour valider l'adresse et fiabiliser les rappels cliniques, les rendez-vous
            et les alertes qui seront partages entre patient et medecin.
          </p>

          <div className="auth-story-matrix">
            <div className="matrix-card">
              <span>Verification</span>
              <strong>Adresse email controlee avant activation</strong>
            </div>
            <div className="matrix-card">
              <span>Rappels</span>
              <strong>Consultations, tests et journal mieux suivis</strong>
            </div>
            <div className="matrix-card">
              <span>Securite</span>
              <strong>Moins d'erreurs sur les contacts critiques</strong>
            </div>
          </div>
        </div>

        <div className="auth-card-shell">
          <div className="auth-card">
            <div className="hero-kicker">Verification d'email</div>
            <h2 className="auth-card-title">Activer le compte</h2>
            <p className="muted-text">Saisissez le code recu par email. En cas de besoin, vous pouvez en demander un nouveau.</p>

            {error && <div className="alert alert-danger mt-3">{error}</div>}
            {message && <div className="alert alert-success mt-3">{message}</div>}

            <form onSubmit={handleVerify} className="auth-form">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />

              <label className="form-label">Code a 6 chiffres</label>
              <input
                className="form-control auth-code-input"
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                required
              />

              <button className="btn btn-dark w-100" disabled={loading}>
                {loading ? "Verification..." : "Verifier et entrer dans l'espace clinique"}
              </button>
            </form>

            <div className="auth-aux-actions">
              <button type="button" className="btn btn-outline-dark w-100" onClick={handleResend} disabled={resending}>
                {resending ? "Renvoi..." : "Renvoyer un code"}
              </button>
            </div>

            <p className="auth-alt-link">
              Vous avez deja valide votre compte ? <Link to="/login">Revenir a la connexion</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VerifyEmail;
