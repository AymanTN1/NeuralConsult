import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import IdentityOcrVerifier from "../components/IdentityOcrVerifier";
import TermsModal from "../components/TermsModal";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  phoneNumber: "",
  accountType: "PATIENT",
  city: "",
  countryCode: "MA",
  specialty: "",
  yearsExperience: "",
  bio: "",
  acceptsTeleconsultation: true,
  acceptsTerms: false,
  acceptsDeontology: false
};

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [identityVerification, setIdentityVerification] = useState({
    verified: false,
    extractedFirstName: "",
    extractedLastName: "",
    extractedDateOfBirth: "",
    rawText: "",
    confidence: null,
    documentType: "CIN"
  });

  const doctorMode = form.accountType === "DOCTOR";
  const termsAccepted = doctorMode ? (form.acceptsTerms && form.acceptsDeontology) : form.acceptsTerms;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const payload = useMemo(
    () => ({
      ...form,
      fullName: `${form.firstName} ${form.lastName}`.replace(/\s+/g, " ").trim(),
      yearsExperience: form.yearsExperience === "" ? null : Number(form.yearsExperience),
      identityVerification: {
        documentType: identityVerification.documentType || "CIN",
        extractedFirstName: identityVerification.extractedFirstName,
        extractedLastName: identityVerification.extractedLastName,
        extractedDateOfBirth: identityVerification.extractedDateOfBirth || null,
        rawText: identityVerification.rawText,
        confidence: identityVerification.confidence
      }
    }),
    [form, identityVerification]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await register(payload);
      localStorage.setItem("nc_pending_verification_email", payload.email);
      navigate("/verify-email", {
        state: {
          email: payload.email,
          message:
            response?.message ||
            "Le compte a ete cree. Saisissez le code envoye par email pour activer l'acces clinique."
        }
      });
    } catch (err) {
      setError(err?.response?.data?.message || "La creation du compte a echoue. Verifiez les champs et reessayez.");
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div className="auth-form-slide-enter w-100">
      {error && <div className="alert alert-danger mb-3">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <label className="form-label">Type de compte</label>
              <select className="form-select light-input" name="accountType" value={form.accountType} onChange={handleChange}>
                <option value="PATIENT">Patient</option>
                <option value="DOCTOR">Medecin</option>
              </select>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Prenom</label>
                  <input className="form-control light-input" type="text" name="firstName" value={form.firstName} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Nom</label>
                  <input className="form-control light-input" type="text" name="lastName" value={form.lastName} onChange={handleChange} required />
                </div>
              </div>

              <label className="form-label">Date de naissance</label>
              <input className="form-control light-input" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} required />

              <label className="form-label">Telephone</label>
              <input className="form-control light-input" type="text" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />

              <label className="form-label">Email</label>
              <input className="form-control light-input" type="email" name="email" value={form.email} onChange={handleChange} required />

<label className="form-label">Mot de passe</label>
              <input className="form-control light-input" type="password" name="password" value={form.password} onChange={handleChange} required />

              <IdentityOcrVerifier
                firstName={form.firstName}
                lastName={form.lastName}
                dateOfBirth={form.dateOfBirth}
                onVerificationChange={setIdentityVerification}
              />

              <div className="terms-section">
                <h4 className="terms-section-title">Conditions d'utilisation</h4>
                
                <label className="auth-checkbox-terms light-checkbox">
                  <input 
                    type="checkbox" 
                    name="acceptsTerms" 
                    checked={form.acceptsTerms} 
                    onChange={handleChange} 
                    required
                  />
                  <span>
                    J'accepte les <button 
                      type="button" 
                      className="link-btn"
                      onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}
                    >conditions d'utilisation</button> de NeuralConsult
                  </span>
                </label>

                {doctorMode && (
                  <label className="auth-checkbox-terms light-checkbox">
                    <input 
                      type="checkbox" 
                      name="acceptsDeontology" 
                      checked={form.acceptsDeontology} 
                      onChange={handleChange} 
                      required
                    />
                    <span>
                      J'accepte de respecter le Code de Déontologie de la profession médicale 
                      (<button 
                        type="button"
                        className="link-btn"
                        onClick={(e) => { 
                          e.preventDefault(); 
                          window.open("/Code-de-Deontologie-de-la-profession-medicale-BO-n-7066-17-2-2022%20ordre%20national%20des%20medcins.pdf", "_blank");
                        }}
                      >consulter</button>)
                    </span>
                  </label>
                )}
              </div>

              {doctorMode && (
                <div className="auth-doctor-grid">
                  <div className="auth-doctor-grid-head">
                    <span className="hero-kicker">Infos praticien</span>
                    <p className="muted-text mb-0">Ces informations sont enregistrees des l'inscription et soumises a validation admin.</p>
                  </div>

                  <label className="form-label">Ville</label>
                  <input className="form-control light-input" type="text" name="city" value={form.city} onChange={handleChange} required={doctorMode} />

                  <label className="form-label">Pays</label>
                  <input className="form-control light-input" type="text" name="countryCode" value={form.countryCode} onChange={handleChange} required={doctorMode} />

                  <label className="form-label">Specialite</label>
                  <input className="form-control light-input" type="text" name="specialty" value={form.specialty} onChange={handleChange} required={doctorMode} />

                  <label className="form-label">Annees d'experience</label>
                  <input className="form-control light-input" type="number" min="0" name="yearsExperience" value={form.yearsExperience} onChange={handleChange} required={doctorMode} />

                  <label className="form-label">Bio / approche clinique</label>
                  <textarea className="form-control light-input" rows="4" name="bio" value={form.bio} onChange={handleChange} required={doctorMode} />

                  <label className="auth-inline-toggle light-checkbox mt-3">
                    <input type="checkbox" name="acceptsTeleconsultation" checked={!!form.acceptsTeleconsultation} onChange={handleChange} />
                    <span className="hover-dark">
                      J'accepte la teleconsultation 
                      (<button type="button" className="link-btn" onClick={(e) => { e.preventDefault(); window.open("/Code-de-Deontologie-de-la-profession-medicale-BO-n-7066-17-2-2022%20ordre%20national%20des%20medcins.pdf", "_blank"); }}>consulter</button>)
                    </span>
                  </label>
                </div>
              )}

              {!doctorMode && (
                <label className="auth-inline-toggle light-checkbox mb-3">
                  <input type="checkbox" name="acceptsTeleconsultation" checked={!!form.acceptsTeleconsultation} onChange={handleChange} />
                  <span className="hover-dark">J'accepte la teleconsultation avec mon médecin</span>
                </label>
              )}

              <button className="btn tabac-btn-submit w-100" disabled={loading || !identityVerification.verified || !termsAccepted}>
                {loading ? "Création..." : doctorMode ? "Créer le compte médecin" : "Activer mon espace patient"}
              </button>
              
              {!form.acceptsTerms && (
                <p className="muted-text alert-text mb-0">✓ Cochez la case pour accepter les conditions d'utilisation</p>
              )}
              
              {doctorMode && !form.acceptsDeontology && (
                <p className="muted-text alert-text mb-0">✓ Cochez la case pour accepter le Code de Déontologie</p>
              )}
              
              {!identityVerification.verified && (
                <p className="muted-text alert-text mb-0">✓ La verification CIN est requise pour creer le compte</p>
              )}

            <p className="text-center mt-3 mb-0" style={{ color: "#6b7280" }}>
              Déjà inscrit ? <Link to="/login" style={{ color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>Revenir à la connexion</Link>
            </p>
          </form>
        
      
      {showTermsModal && <TermsModal accountType={form.accountType} onClose={() => setShowTermsModal(false)} />}
    </div>
  );
};

export default Register;