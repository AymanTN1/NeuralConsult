import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

  if (user?.profile?.onboardingComplete === false && location.pathname !== "/evaluation") {
    return <Navigate to="/evaluation" replace />;
  }

  return children;
};

export default ProtectedRoute;
