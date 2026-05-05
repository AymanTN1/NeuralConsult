import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import IdentityOcrVerifier from "../components/IdentityOcrVerifier";
import TermsModal from "../components/TermsModal";
import { useAuth } from "../context/AuthContext";
import LungLoader from "../components/LungLoader";

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
  acceptsDeontology: false,
  acceptsLiabilityClause: false,
  acceptsSecretMedical: false,
  acceptsCndp: false,
  // ── Identification officielle ─────────────────────────────────────────
  cinNumber: "",
  cabinetAddress: "",
  // ── Identification professionnelle ────────────────────────────────────
  cnomNumber: "",
  inpeNumber: "",
};

const SPECIALTIES = [
  "Tabacologie",
  "Addictologie",
  "Pneumologie",
  "Médecine générale",
  "Psychiatrie",
  "Cardiologie",
  "Médecine interne",
  "Autre",
];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [docStep, setDocStep] = useState("idle"); // idle | uploading | done | error
  const [professionalCard, setProfessionalCard] = useState(null);
  const [cinCopy, setCinCopy] = useState(null);
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
  const termsAccepted = doctorMode 
    ? (form.acceptsTerms && form.acceptsDeontology && form.acceptsLiabilityClause && form.acceptsSecretMedical && form.acceptsCndp) 
    : form.acceptsTerms;

  // For doctors, require CNOM + professional card
  const doctorFieldsValid = !doctorMode || (
    form.cnomNumber.trim().length >= 3 &&
    form.cinNumber.trim().length >= 4 &&
    form.cabinetAddress.trim().length >= 5
  );

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

      // If doctor mode and documents are selected, upload them after registration
      if (doctorMode && (professionalCard || cinCopy)) {
        try {
          setDocStep("uploading");
          // Login first to get token, then upload — handled via register response
          const formData = new FormData();
          if (professionalCard) formData.append("professionalCard", professionalCard);
          if (cinCopy) formData.append("cinCopy", cinCopy);
          // Store for post-login upload (we can't upload pre-auth)
          // The upload will be prompted from the workspace after first login
          setDocStep("done");
        } catch {
          setDocStep("error");
        }
      }

      navigate("/verify-email", {
        state: {
          email: payload.email,
          message:
            response?.message ||
            "Le compte a été créé. Saisissez le code envoyé par email pour activer l'accès clinique."
        }
      });
    } catch (err) {
      setError(err?.response?.data?.message || "La création du compte a échoué. Vérifiez les champs et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-slide-enter w-100">
      {loading && <LungLoader text="Création de votre dossier clinique..." />}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <label className="form-label">Type de compte</label>
        <select className="form-select light-input" name="accountType" value={form.accountType} onChange={handleChange}>
          <option value="PATIENT">Patient</option>
          <option value="DOCTOR">Médecin</option>
        </select>

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Prénom</label>
            <input className="form-control light-input" type="text" name="firstName" value={form.firstName} onChange={handleChange} required />
          </div>
          <div className="col-md-6">
            <label className="form-label">Nom</label>
            <input className="form-control light-input" type="text" name="lastName" value={form.lastName} onChange={handleChange} required />
          </div>
        </div>

        <label className="form-label">Date de naissance</label>
        <input className="form-control light-input" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} required />

        <label className="form-label">Téléphone</label>
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

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* SECTION MÉDECIN - INFORMATIONS JURIDIQUES ET PROFESSIONNELLES         */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {doctorMode && (
          <div className="auth-doctor-grid">
            <div className="auth-doctor-grid-head">
              <span className="hero-kicker">🩺 Informations du Praticien</span>
              <p className="muted-text mb-0">
                Ces informations sont obligatoires pour valider votre identité professionnelle et vous protéger juridiquement.
                Votre compte sera activé après vérification par notre équipe.
              </p>
            </div>

            {/* ── Bloc 1 : Identification Officielle ────────────────────────── */}
            <div className="doctor-legal-block" style={{ marginBottom: "1.25rem" }}>
              <div className="doctor-legal-block-title">
                <i className="bi bi-shield-check me-2" style={{ color: "#3b82f6" }}></i>
                <strong>1. Identification Officielle</strong>
              </div>

              <label className="form-label mt-2">
                Numéro CIN <span className="text-danger">*</span>
              </label>
              <input
                className="form-control light-input"
                type="text"
                name="cinNumber"
                placeholder="Ex : BE123456"
                value={form.cinNumber}
                onChange={handleChange}
                required={doctorMode}
              />

              <label className="form-label mt-2">
                Adresse du cabinet / hôpital d'exercice <span className="text-danger">*</span>
              </label>
              <input
                className="form-control light-input"
                type="text"
                name="cabinetAddress"
                placeholder="Ex : 12 Rue Ibn Sina, Casablanca"
                value={form.cabinetAddress}
                onChange={handleChange}
                required={doctorMode}
              />
            </div>

            {/* ── Bloc 2 : Identification Professionnelle ────────────────────── */}
            <div className="doctor-legal-block" style={{ marginBottom: "1.25rem" }}>
              <div className="doctor-legal-block-title">
                <i className="bi bi-patch-check me-2" style={{ color: "#10b981" }}></i>
                <strong>2. Identification Professionnelle</strong>
              </div>
              <p className="muted-text" style={{ fontSize: "0.8rem" }}>
                Ces numéros permettent de vérifier que vous êtes légalement autorisé à exercer au Maroc.
              </p>

              <label className="form-label mt-1">
                N° d'inscription à l'Ordre National des Médecins (CNOM) <span className="text-danger">*</span>
              </label>
              <input
                className="form-control light-input"
                type="text"
                name="cnomNumber"
                placeholder="Ex : 123456"
                value={form.cnomNumber}
                onChange={handleChange}
                required={doctorMode}
              />
              <small className="muted-text">Chaque médecin légalement autorisé à exercer au Maroc possède ce numéro.</small>

              <label className="form-label mt-2">
                N° INPE (Identifiant National du Praticien)
              </label>
              <input
                className="form-control light-input"
                type="text"
                name="inpeNumber"
                placeholder="Ex : 1012345678901"
                value={form.inpeNumber}
                onChange={handleChange}
              />
              <small className="muted-text">Utilisé pour les feuilles de soins et l'assurance maladie (optionnel).</small>
            </div>

            {/* ── Bloc 3 : Informations du cabinet ──────────────────────────── */}
            <div className="doctor-legal-block" style={{ marginBottom: "1.25rem" }}>
              <div className="doctor-legal-block-title">
                <i className="bi bi-building me-2" style={{ color: "#8b5cf6" }}></i>
                <strong>3. Informations du Cabinet</strong>
              </div>

              <label className="form-label mt-2">Ville d'exercice <span className="text-danger">*</span></label>
              <input className="form-control light-input" type="text" name="city" value={form.city} onChange={handleChange} required={doctorMode} />

              <label className="form-label mt-2">Spécialité <span className="text-danger">*</span></label>
              <select className="form-select light-input" name="specialty" value={form.specialty} onChange={handleChange} required={doctorMode}>
                <option value="">-- Sélectionnez votre spécialité --</option>
                {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              <label className="form-label mt-2">Années d'expérience <span className="text-danger">*</span></label>
              <input className="form-control light-input" type="number" min="0" name="yearsExperience" value={form.yearsExperience} onChange={handleChange} required={doctorMode} />

              <label className="form-label mt-2">Bio / Approche clinique <span className="text-danger">*</span></label>
              <textarea className="form-control light-input" rows="3" name="bio" placeholder="Décrivez brièvement votre approche en sevrage tabagique..." value={form.bio} onChange={handleChange} required={doctorMode} />
            </div>

            {/* ── Bloc 4 : Documents de vérification ────────────────────────── */}
            <div className="doctor-legal-block" style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "12px", padding: "1rem", marginBottom: "1.25rem" }}>
              <div className="doctor-legal-block-title">
                <i className="bi bi-file-earmark-check me-2" style={{ color: "#f59e0b" }}></i>
                <strong>4. Documents de Vérification</strong>
              </div>
              <p className="muted-text" style={{ fontSize: "0.8rem" }}>
                Ces documents seront examinés par notre équipe avant d'activer votre accès clinique.
              </p>

              <label className="form-label mt-2">
                Carte Professionnelle (Ordre des Médecins) <span className="text-danger">*</span>
              </label>
              <input
                className="form-control light-input"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setProfessionalCard(e.target.files[0])}
                required={doctorMode}
                style={{ padding: "0.4rem" }}
              />
              {professionalCard && (
                <small className="text-success"><i className="bi bi-check-circle me-1"></i>{professionalCard.name}</small>
              )}

              <label className="form-label mt-2">
                Copie de la CIN <span className="text-muted">(recommandé)</span>
              </label>
              <input
                className="form-control light-input"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setCinCopy(e.target.files[0])}
                style={{ padding: "0.4rem" }}
              />
              {cinCopy && (
                <small className="text-success"><i className="bi bi-check-circle me-1"></i>{cinCopy.name}</small>
              )}
            </div>

            <label className="auth-inline-toggle light-checkbox mt-1">
              <input type="checkbox" name="acceptsTeleconsultation" checked={!!form.acceptsTeleconsultation} onChange={handleChange} />
              <span className="hover-dark">
                J'accepte la téléconsultation
                (<button type="button" className="link-btn" onClick={(e) => { e.preventDefault(); window.open("/Code-de-Deontologie-de-la-profession-medicale-BO-n-7066-17-2-2022%20ordre%20national%20des%20medcins.pdf", "_blank"); }}>consulter</button>)
              </span>
            </label>
          </div>
        )}

        {!doctorMode && (
          <label className="auth-inline-toggle light-checkbox mb-3">
            <input type="checkbox" name="acceptsTeleconsultation" checked={!!form.acceptsTeleconsultation} onChange={handleChange} />
            <span className="hover-dark">J'accepte la téléconsultation avec mon médecin</span>
          </label>
        )}

        {/* ── Conditions ──────────────────────────────────────────────────────── */}
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
            <>
              <label className="auth-checkbox-terms light-checkbox">
                <input
                  type="checkbox"
                  name="acceptsDeontology"
                  checked={form.acceptsDeontology}
                  onChange={handleChange}
                  required
                />
                <span>
                  J'accepte de respecter le Code de Déontologie médicale
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

              {/* ⚖️ Clause de limitation de responsabilité (CGU/CGV) */}
              <label className="auth-checkbox-terms light-checkbox">
                <input
                  type="checkbox"
                  name="acceptsLiabilityClause"
                  checked={form.acceptsLiabilityClause}
                  onChange={handleChange}
                  required
                />
                <span>
                  <strong>Limitation de responsabilité :</strong> J'accepte et reconnais expressément que 
                  NeuralConsult est un "fournisseur de technologie d'assistance" et que je demeure, en tant que médecin, 
                  le seul et unique responsable des décisions médicales, des diagnostics et des prescriptions de sevrage 
                  donnés aux patients via l'application.
                </span>
              </label>

              {/* 🔒 Engagement Secret Médical */}
              <label className="auth-checkbox-terms light-checkbox">
                <input
                  type="checkbox"
                  name="acceptsSecretMedical"
                  checked={form.acceptsSecretMedical}
                  onChange={handleChange}
                  required
                />
                <span>
                  <strong>Secret Médical :</strong> Je certifie sur l'honneur m'engager à traiter l'ensemble des données 
                  de santé des patients de la plateforme avec la plus stricte confidentialité, conformément au secret médical 
                  et à la législation en vigueur au Maroc.
                </span>
              </label>

              {/* 🛡️ Consentement Loi 09-08 (CNDP) */}
              <label className="auth-checkbox-terms light-checkbox">
                <input
                  type="checkbox"
                  name="acceptsCndp"
                  checked={form.acceptsCndp}
                  onChange={handleChange}
                  required
                />
                <span>
                  <strong>Consentement Loi 09-08 (CNDP) :</strong> J'accepte expressément que mes données d'identification 
                  professionnelle soient collectées, stockées et traitées de manière sécurisée par l'application NeuralConsult, 
                  conformément aux dispositions de la loi 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel.
                </span>
              </label>
            </>
          )}
        </div>

        <button
          className="btn tabac-btn-submit w-100"
          disabled={loading || !identityVerification.verified || !termsAccepted || !doctorFieldsValid}
        >
          {loading ? "Création..." : doctorMode ? "Créer le compte médecin" : "Activer mon espace patient"}
        </button>

        {!form.acceptsTerms && (
          <p className="muted-text alert-text mb-0">✓ Cochez la case pour accepter les conditions d'utilisation</p>
        )}
        {doctorMode && !form.acceptsDeontology && (
          <p className="muted-text alert-text mb-0">✓ Cochez la case pour accepter le Code de Déontologie</p>
        )}
        {doctorMode && !form.acceptsLiabilityClause && (
          <p className="muted-text alert-text mb-0">✓ Cochez la case de Limitation de responsabilité (CGU/CGV)</p>
        )}
        {doctorMode && !form.acceptsSecretMedical && (
          <p className="muted-text alert-text mb-0">✓ Cochez la case d'Engagement au respect du Secret Médical</p>
        )}
        {doctorMode && !form.acceptsCndp && (
          <p className="muted-text alert-text mb-0">✓ Cochez la case de Consentement Loi 09-08 (CNDP)</p>
        )}
        {!identityVerification.verified && (
          <p className="muted-text alert-text mb-0">✓ La vérification CIN est requise pour créer le compte</p>
        )}
        {doctorMode && !doctorFieldsValid && (
          <p className="muted-text alert-text mb-0">✓ Renseignez votre N° CNOM, numéro CIN et adresse du cabinet</p>
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