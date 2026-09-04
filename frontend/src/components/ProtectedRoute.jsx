import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

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

  // Authenticated users (admin, doctor, patient) have full access to modules
  return children;
};

export default ProtectedRoute;
