import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ForgotPassword = () => {
  const { forgotPassword, resetPassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || localStorage.getItem("nc_pending_reset_email") || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(location.state?.step || (email ? 2 : 1));
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(location.state?.message || null);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (email) {
      localStorage.setItem("nc_pending_reset_email", email);
    }
  }, [email]);

  const handleSendCode = async (event) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await forgotPassword(email);
      setStep(2);
      setMessage(response?.message || "Un code de reinitialisation a ete envoye.");
    } catch (err) {
      const apiError = err?.response?.data?.message || err?.response?.data?.error;
      setError(apiError || "Aucun compte ne correspond a cet email.");
    } finally {
      setSending(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    if (newPassword.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caracteres.");
      setSaving(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe doivent etre identiques.");
      setSaving(false);
      return;
    }

    try {
      const response = await resetPassword(email, code, newPassword);
      localStorage.removeItem("nc_pending_reset_email");
      navigate("/login", {
        state: {
          email,
          message: response?.message || "Mot de passe modifie. Vous pouvez maintenant vous connecter."
        }
      });
    } catch (err) {
      const apiError = err?.response?.data?.message || err?.response?.data?.error;
      setError(apiError || "Impossible de reinitialiser le mot de passe.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="auth-stage light-auth-stage">
      <div className="container auth-stage-grid">
        <div className="auth-story">
          <div className="hero-kicker">Recuperation d'acces</div>
          <h1 className="auth-title">Retrouver l'acces au dossier clinique sans passer par la base de donnees.</h1>
          <p className="auth-copy">
            Nous envoyons un code a 6 chiffres sur l'email du compte. Une fois valide, vous pouvez choisir un nouveau mot de passe
            et reprendre immediatement l'espace clinique.
          </p>

          <div className="auth-story-matrix">
            <div className="matrix-card">
              <span>Etape 1</span>
              <strong>Saisir l'email du compte</strong>
            </div>
            <div className="matrix-card">
              <span>Etape 2</span>
              <strong>Recevoir le code a 6 chiffres</strong>
            </div>
            <div className="matrix-card">
              <span>Etape 3</span>
              <strong>Definir un nouveau mot de passe</strong>
            </div>
          </div>
        </div>

        <div className="auth-card-shell">
          <div className="auth-card light-glass-panel">
            <div className="hero-kicker">Mot de passe oublie</div>
            <h2 className="auth-card-title">Recuperer l'acces</h2>
            <p className="muted-text">
              {step === 1
                ? "Saisissez l'adresse email du compte. Nous vous enverrons un code de verification."
                : "Entrez le code recu par email puis choisissez un nouveau mot de passe."}
            </p>

            {error && <div className="alert alert-danger mt-3">{error}</div>}
            {message && <div className="alert alert-success mt-3">{message}</div>}

            {step === 1 ? (
              <form onSubmit={handleSendCode} className="auth-form">
                <label className="form-label">Email</label>
                <input
                  className="form-control light-input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />

                <button className="btn light-btn-submit w-100" disabled={sending}>
                  {sending ? "Envoi..." : "Envoyer le code a 6 chiffres"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="auth-form">
                <label className="form-label">Email</label>
                <input
                  className="form-control light-input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />

                <label className="form-label">Code a 6 chiffres</label>
                <input
                  className="form-control auth-code-input light-input"
                  type="text"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  maxLength={6}
                  required
                />

                <label className="form-label">Nouveau mot de passe</label>
                <div className="position-relative">
                  <input
                    className="form-control light-input"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    className="auth-pass-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    <i className={`bi ${showNewPassword ? "bi-eye-slash" : "bi-eye"}`} />
                  </button>
                </div>

                <label className="form-label">Confirmer le mot de passe</label>
                <div className="position-relative">
                  <input
                    className="form-control light-input"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    className="auth-pass-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`} />
                  </button>
                </div>

                <button className="btn light-btn-submit w-100" disabled={saving}>
                  {saving ? "Reinitialisation..." : "Changer le mot de passe"}
                </button>
              </form>
            )}

            <div className="auth-aux-actions">
              {step === 2 ? (
                <button type="button" className="btn btn-outline-dark w-100" onClick={handleSendCode} disabled={sending}>
                  {sending ? "Renvoi..." : "Renvoyer un code"}
                </button>
              ) : null}
            </div>

            <p className="auth-alt-link">
              Vous vous souvenez du mot de passe ? <Link to="/login">Revenir a la connexion</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;
