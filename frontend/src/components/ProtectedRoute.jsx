import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isAdmin, isDoctor, isPatient } from "../utils/roles";

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

  // Admins and doctors have unrestricted clinical workspace access
  if (isAdmin(user) || isDoctor(user)) {
    return children;
  }

  // Patients handling
  if (isPatient(user)) {
    // Check if it is a demo patient account
    const isDemo = Boolean(
      user.isDemo ||
      user.email?.includes("tantani") ||
      user.email?.includes("demo") ||
      user.email?.includes("saidpa") ||
      user.email?.includes("testaccsimo") ||
      user.email?.includes("projetfinetude") ||
      user.email === "aymantantani18@gmail.com" ||
      user.email === "tantaniayman0@gmail.com"
    );

    // Demo patients have instant, unrestricted access to all modules
    if (isDemo) {
      return children;
    }

    // Real new patient accounts must complete their clinical progression
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
