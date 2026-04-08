import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isPatient } from "../utils/roles";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="clinical-loader">
        <div className="clinical-loader-ring" />
        <div className="clinical-loader-copy">Initialisation de l'espace clinique...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isPatient(user)) {
    const onboardingComplete = !!user?.profile?.onboardingComplete;
    const testsComplete = !!user?.profile?.testsComplete;
    const journalComplete = !!user?.profile?.journalComplete;

    if (!onboardingComplete && location.pathname !== "/evaluation") {
      return <Navigate to="/evaluation" replace />;
    }

    if (onboardingComplete && !testsComplete && location.pathname !== "/tests") {
      return <Navigate to="/tests" replace />;
    }

    if (onboardingComplete && testsComplete && !journalComplete && location.pathname !== "/journal") {
      return <Navigate to="/journal" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
