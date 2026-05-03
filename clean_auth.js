const fs = require('fs');

function cleanLogin() {
  let l = fs.readFileSync('frontend/src/pages/Login.jsx', 'utf8');
  // We need to keep only everything inside <div className="tabac-auth-right"> after <div className="tabac-auth-tabs">
  // Actually, wait, AuthLayout already has tabac-auth-header and tabac-auth-tabs.
  // So we just need the error messages and the form.
  
  const formStart = l.indexOf('{error &&');
  const formEnd = l.lastIndexOf('</div>'); // Actually last </div> is inside section
  // Let's just use regex to extract from {error && to the end of the form
  let contentMatch = l.match(/({error &&[\s\S]*?)<\/div>\s*<\/div>\s*<\/section>/);
  if (contentMatch) {
    let content = contentMatch[1];
    
    const newLogin = `import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: location.state?.email || "", password: "" });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(location.state?.message || null);
  const [loading, setLoading] = useState(false);

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
      ${content}
    </div>
  );
};

export default Login;`;
    fs.writeFileSync('frontend/src/pages/Login.jsx', newLogin);
  }
}

function cleanRegister() {
  let r = fs.readFileSync('frontend/src/pages/Register.jsx', 'utf8');
  let contentMatch = r.match(/({error &&[\s\S]*?)<\/div>\s*<\/div>\s*\{showTermsModal/);
  if (contentMatch) {
    let content = contentMatch[1];
    const headerMatch = r.match(/const Register = \(\) => \{[\s\S]*?handleSubmit = async \(event\) => \{[\s\S]*?finally \{\s*setLoading\(false\);\s*\}\s*\};\s*/);
    
    const newRegister = `import React, { useMemo, useState } from "react";
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

${headerMatch[0]}

  return (
    <div className="auth-form-slide-enter w-100">
      ${content}
      
      {showTermsModal && <TermsModal accountType={form.accountType} onClose={() => setShowTermsModal(false)} />}
    </div>
  );
};

export default Register;`;

    fs.writeFileSync('frontend/src/pages/Register.jsx', newRegister);
  }
}

cleanLogin();
cleanRegister();
