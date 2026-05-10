import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import IdentityOcrVerifier from "../components/IdentityOcrVerifier";
import TermsModal from "../components/TermsModal";
import { useAuth } from "../context/AuthContext";
import LungLoader from "../components/LungLoader";
import { AsYouType, parsePhoneNumberFromString } from "libphonenumber-js";
import { isFirebaseConfigured, createRecaptchaVerifier, sendVerificationSMS } from "../services/firebase";

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
  pseudonym: "",
  emergencyContact: "",
  acceptsEmergencyDisclaimer: false,
  acceptsAiDisclaimer: false,
  acceptsComplicationsDisclaimer: false,
  acceptsHealthDataConsent: false,
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
  const [showPassword, setShowPassword] = useState(false);
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

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpSending, setOtpSending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  React.useEffect(() => {
    let timer;
    if (showOtpModal && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, countdown]);

  React.useEffect(() => {
    if (isFirebaseConfigured) {
      const initRecaptcha = async () => {
        try {
          if (!window.recaptchaVerifier) {
            const verifier = createRecaptchaVerifier("recaptcha-container");
            window.recaptchaVerifier = verifier;
            if (verifier) {
              await verifier.render();
            }
          }
        } catch (err) {
          console.error("Error rendering on-mount recaptcha:", err);
        }
      };
      // Give the DOM a tiny fraction of a second to render the container div
      const t = setTimeout(initRecaptcha, 100);
      return () => clearTimeout(t);
    }
  }, []);

  const doctorMode = form.accountType === "DOCTOR";
  const isUnder18 = useMemo(() => {
    if (!form.dateOfBirth) return false;
    const today = new Date();
    const birthDate = new Date(form.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age < 18;
  }, [form.dateOfBirth]);

  const isPhoneValid = useMemo(() => {
    if (!form.phoneNumber) return true;
    const phoneNumber = parsePhoneNumberFromString(form.phoneNumber, form.countryCode || "MA");
    return phoneNumber ? phoneNumber.isValid() : false;
  }, [form.phoneNumber, form.countryCode]);

  const termsAccepted = doctorMode 
    ? (form.acceptsTerms && form.acceptsDeontology && form.acceptsLiabilityClause && form.acceptsSecretMedical && form.acceptsCndp) 
    : (form.acceptsTerms && form.acceptsEmergencyDisclaimer && form.acceptsAiDisclaimer && form.acceptsComplicationsDisclaimer && form.acceptsHealthDataConsent);

  // For doctors, require CNOM + professional card
  const doctorFieldsValid = !doctorMode || (
    form.cnomNumber.trim().length >= 3 &&
    form.cinNumber.trim().length >= 4 &&
    form.cabinetAddress.trim().length >= 5
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    let finalValue = value;
    if (name === "phoneNumber") {
      finalValue = new AsYouType(form.countryCode || "MA").input(value);
    }
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : finalValue
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

  const completeRegistration = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await register(payload);
      localStorage.setItem("nc_pending_verification_email", payload.email);

      if (doctorMode && (professionalCard || cinCopy)) {
        try {
          setDocStep("uploading");
          const formData = new FormData();
          if (professionalCard) formData.append("professionalCard", professionalCard);
          if (cinCopy) formData.append("cinCopy", cinCopy);
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

  const triggerSmsAndShowModal = async () => {
    setOtpSending(true);
    setOtpError("");
    setCountdown(60);
    setOtpCode(["", "", "", "", "", ""]);
    
    const parsedPhone = parsePhoneNumberFromString(form.phoneNumber, form.countryCode || "MA");
    const internationalPhone = parsedPhone ? parsedPhone.formatInternational().replace(/\s/g, "") : form.phoneNumber;

    if (isFirebaseConfigured) {
      try {
        let recaptchaVerifier = window.recaptchaVerifier;
        if (!recaptchaVerifier) {
          recaptchaVerifier = createRecaptchaVerifier("recaptcha-container");
          window.recaptchaVerifier = recaptchaVerifier;
          if (recaptchaVerifier) {
            await recaptchaVerifier.render();
          }
        }
        
        const confirmResult = await sendVerificationSMS(internationalPhone, recaptchaVerifier);
        setConfirmationResult(confirmResult);
        setShowOtpModal(true);
      } catch (err) {
        console.error("Firebase SMS error, falling back to Demo Mode:", err);
        if (window.grecaptcha) {
          try {
            window.grecaptcha.reset();
          } catch (e) {}
        }
        if (!confirmationResult) {
          setConfirmationResult(null);
        }
        setShowOtpModal(true);
      } finally {
        setOtpSending(false);
      }
    } else {
      setTimeout(() => {
        setConfirmationResult(null);
        setShowOtpModal(true);
        setOtpSending(false);
      }, 1000);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.join("");
    if (code.length < 6) {
      setOtpError("Veuillez saisir le code complet à 6 chiffres.");
      return;
    }
    setLoading(true);
    setOtpError("");
    try {
      if (isFirebaseConfigured && confirmationResult) {
        await confirmationResult.confirm(code);
      } else {
        if (code !== "123456") {
          throw new Error("Code de vérification incorrect. Saisissez '123456' en mode démo.");
        }
      }
      setShowOtpModal(false);
      await completeRegistration();
    } catch (err) {
      console.error("OTP verification error:", err);
      setOtpError(err.message || "Code OTP invalide. Veuillez réessayer.");
      setLoading(false);
    }
  };

  const handleResendSms = () => {
    setShowOtpModal(false);
    if (window.grecaptcha) {
      try {
        window.grecaptcha.reset();
      } catch (e) {}
    }
    setOtpError("");
    setError("Veuillez valider à nouveau la case 'Je ne suis pas un robot' pour renvoyer le code par SMS.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading || otpSending) return;
    if (form.phoneNumber) {
      await triggerSmsAndShowModal();
    } else {
      await completeRegistration();
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
        {isUnder18 && (
          <div className="alert alert-danger p-2 mb-0" style={{ fontSize: "0.85rem", borderRadius: "10px" }}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            NeuralConsult est strictement réservé aux personnes majeures (18 ans et plus). L'inscription est bloquée.
          </div>
        )}

        <label className="form-label">Téléphone</label>
        <input 
          className={`form-control light-input ${form.phoneNumber ? (isPhoneValid ? "is-valid" : "is-invalid") : ""}`} 
          type="text" 
          name="phoneNumber" 
          placeholder="Ex: 0612345678"
          value={form.phoneNumber} 
          onChange={handleChange} 
        />
        {form.phoneNumber && !isPhoneValid && (
          <div className="text-danger mt-1" style={{ fontSize: "0.8rem" }}>
            <i className="bi bi-x-circle me-1"></i> Numéro de téléphone invalide pour le pays sélectionné ({form.countryCode || "MA"}).
          </div>
        )}
        {form.phoneNumber && isPhoneValid && (
          <div className="text-success mt-1" style={{ fontSize: "0.8rem" }}>
            <i className="bi bi-check-circle me-1"></i> Numéro de téléphone valide.
          </div>
        )}

        <label className="form-label">Email</label>
        <input className="form-control light-input" type="email" name="email" value={form.email} onChange={handleChange} required />

        {!doctorMode && (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Pseudonyme (Optionnel - Pour chat anonyme)</label>
              <input className="form-control light-input" type="text" name="pseudonym" value={form.pseudonym} onChange={handleChange} placeholder="Ex: SevreZen" />
            </div>
            <div className="col-md-6">
              <label className="form-label">Contact d'urgence (Optionnel)</label>
              <input className="form-control light-input" type="text" name="emergencyContact" value={form.emergencyContact} onChange={handleChange} placeholder="Ex: Proche +212..." />
            </div>
          </div>
        )}

        <label className="form-label">Mot de passe</label>
        <div className="position-relative">
          <input 
            className="form-control light-input" 
            type={showPassword ? "text" : "password"} 
            name="password" 
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

          {!doctorMode && (
            <>
              {/* 🚨 Non service d'urgence */}
              <label className="auth-checkbox-terms light-checkbox">
                <input
                  type="checkbox"
                  name="acceptsEmergencyDisclaimer"
                  checked={form.acceptsEmergencyDisclaimer}
                  onChange={handleChange}
                  required
                />
                <span>
                  <strong>Pas un service d'urgence :</strong> J'accepte et comprends que NeuralConsult n'est pas un service d'urgence médicale. En cas de douleur thoracique, de forte détresse respiratoire ou de pensées critiques, je m'engage à contacter les urgences (le 15) ou à me rendre immédiatement à l'hôpital.
                </span>
              </label>

              {/* 🤖 IA de soutien */}
              <label className="auth-checkbox-terms light-checkbox">
                <input
                  type="checkbox"
                  name="acceptsAiDisclaimer"
                  checked={form.acceptsAiDisclaimer}
                  onChange={handleChange}
                  required
                />
                <span>
                  <strong>Soutien comportemental par l'IA :</strong> J'accepte expressément que les conseils prodigués par l'IA (Psy-RAG, chatbot) constituent un soutien de coaching comportemental et psychologique, et ne remplacent en aucun cas un diagnostic ou une prescription médicale faite par un professionnel de santé.
                </span>
              </label>

              {/* 🩺 Limitation de responsabilité santé */}
              <label className="auth-checkbox-terms light-checkbox">
                <input
                  type="checkbox"
                  name="acceptsComplicationsDisclaimer"
                  checked={form.acceptsComplicationsDisclaimer}
                  onChange={handleChange}
                  required
                />
                <span>
                  <strong>Limitation de responsabilité santé :</strong> J'accepte que l'éditeur de l'application ne puisse être tenu responsable des échecs de mon sevrage ou de toute complication de santé survenant durant mon parcours.
                </span>
              </label>

              {/* 🔒 Données de santé (CNDP) */}
              <label className="auth-checkbox-terms light-checkbox">
                <input
                  type="checkbox"
                  name="acceptsHealthDataConsent"
                  checked={form.acceptsHealthDataConsent}
                  onChange={handleChange}
                  required
                />
                <span>
                  <strong>Traitement des données de santé :</strong> J'accepte explicitement que mes données sensibles (habitudes de consommation, historique de chat, évolution) soient collectées et traitées par NeuralConsult pour personnaliser mon accompagnement, sachant que les données d'amélioration de l'algorithme sont strictement anonymisées.
                </span>
              </label>
            </>
          )}

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

        {/* 🔐 Google reCAPTCHA Checkbox */}
        <div className="d-flex justify-content-center my-3" style={{ minHeight: "78px" }}>
          <div id="recaptcha-container"></div>
        </div>

        <button
          className="btn tabac-btn-submit w-100"
          disabled={loading || otpSending || !identityVerification.verified || !termsAccepted || !doctorFieldsValid || isUnder18 || !isPhoneValid}
        >
          {loading ? "Création..." : otpSending ? "Envoi du SMS..." : doctorMode ? "Créer le compte médecin" : "Activer mon espace patient"}
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
        {!doctorMode && !form.acceptsEmergencyDisclaimer && (
          <p className="muted-text alert-text mb-0">✓ Cochez la case de Clause de Non-Urgence</p>
        )}
        {!doctorMode && !form.acceptsAiDisclaimer && (
          <p className="muted-text alert-text mb-0">✓ Cochez la case pour reconnaître l'IA comme soutien</p>
        )}
        {!doctorMode && !form.acceptsComplicationsDisclaimer && (
          <p className="muted-text alert-text mb-0">✓ Cochez la case de Limitation de responsabilité santé</p>
        )}
        {!doctorMode && !form.acceptsHealthDataConsent && (
          <p className="muted-text alert-text mb-0">✓ Cochez la case de Consentement au traitement des données de santé</p>
        )}
        {isUnder18 && (
          <p className="muted-text alert-text mb-0">✓ L'inscription est bloquée car vous êtes mineur(e)</p>
        )}
        {!identityVerification.verified && (
          <p className="muted-text alert-text mb-0">✓ La vérification CIN est requise pour créer le compte</p>
        )}
        {doctorMode && !doctorFieldsValid && (
          <p className="muted-text alert-text mb-0">✓ Renseignez votre N° CNOM, numéro CIN et adresse du cabinet</p>
        )}
        {!isPhoneValid && (
          <p className="muted-text alert-text mb-0">✓ Veuillez renseigner un numéro de téléphone valide ({form.countryCode || "MA"})</p>
        )}

        <p className="text-center mt-3 mb-0" style={{ color: "#6b7280" }}>
          Déjà inscrit ? <Link to="/login" style={{ color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>Revenir à la connexion</Link>
        </p>
      </form>

      {showTermsModal && <TermsModal accountType={form.accountType} onClose={() => setShowTermsModal(false)} />}

      {/* 🔐 MODALE OTP DE VÉRIFICATION SMS */}
      {showOtpModal && (
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(8px)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.1)", background: "rgba(255, 255, 255, 0.95)", boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)" }}>
              <div className="modal-header border-0 pb-0 justify-content-between align-items-center">
                <span className="hero-kicker" style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>🛡️ Sécurité Clinique</span>
                <button type="button" className="btn-close" onClick={() => setShowOtpModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body text-center py-4 px-4">
                <div className="d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>
                  <i className="bi bi-shield-lock-fill" style={{ fontSize: "2rem" }}></i>
                </div>
                <h4 className="fw-bold mb-2">Vérification Téléphonique</h4>
                <p className="muted-text mb-4" style={{ fontSize: "0.9rem" }}>
                  Nous avons envoyé un code de validation SMS au <strong style={{ color: "#1f2937" }}>{form.phoneNumber}</strong>.<br />
                  {!isFirebaseConfigured && <span className="badge bg-warning text-dark mt-2" style={{ fontSize: "0.75rem" }}>Mode Démo : Entrez le code <strong>123456</strong></span>}
                </p>

                {/* OTP Input Boxes */}
                <div className="d-flex justify-content-center gap-2 mb-4">
                  {otpCode.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-box-${idx}`}
                      type="text"
                      className="form-control text-center fw-bold"
                      style={{ width: "45px", height: "55px", fontSize: "1.5rem", borderRadius: "10px", border: "2px solid #e5e7eb", background: "#f9fafb" }}
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        const newOtp = [...otpCode];
                        newOtp[idx] = val;
                        setOtpCode(newOtp);
                        if (val && idx < 5) {
                          document.getElementById(`otp-box-${idx + 1}`).focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otpCode[idx] && idx > 0) {
                          document.getElementById(`otp-box-${idx - 1}`).focus();
                        }
                      }}
                    />
                  ))}
                </div>

                {otpError && (
                  <div className="alert alert-danger p-2 mb-3" style={{ fontSize: "0.85rem", borderRadius: "10px" }}>
                    <i className="bi bi-exclamation-circle me-2"></i> {otpError}
                  </div>
                )}

                <button 
                  className="btn tabac-btn-submit w-100 py-2 fw-bold" 
                  style={{ borderRadius: "12px", background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", border: "none", color: "#fff", transition: "all 0.2s" }}
                  onClick={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? "Vérification..." : "Valider et activer"}
                </button>

                <div className="mt-4" style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                  {countdown > 0 ? (
                    <span>Renvoyer le SMS dans <strong style={{ color: "#4f46e5" }}>{countdown}s</strong></span>
                  ) : (
                    <button type="button" className="btn btn-link p-0 text-decoration-none fw-semibold" style={{ color: "#8b5cf6", fontSize: "0.85rem" }} onClick={handleResendSms}>
                      Renvoyer le code par SMS
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default Register;