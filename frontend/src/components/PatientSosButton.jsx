import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isPatient } from "../utils/roles";

const PatientSosButton = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isPatient(user)) {
    return null;
  }

  const openSos = () => {
    navigate("/support?sos=1");
  };

  return (
    <button
      type="button"
      className={`patient-sos-button ${location.pathname === "/support" ? "is-in-support" : ""}`}
      onClick={openSos}
      aria-label="Declencher SOS envie"
      title="SOS envie"
    >
      <span className="patient-sos-button-icon">
        <i className="bi bi-broadcast-pin" />
      </span>
      <span className="patient-sos-button-copy">
        <strong>SOS</strong>
        <small>Envie</small>
      </span>
    </button>
  );
};

export default PatientSosButton;
