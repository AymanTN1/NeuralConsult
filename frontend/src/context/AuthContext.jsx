import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMe = async () => {
    try {
      const { data } = await api.get("/api/me");
      setUser(data);
      setError(null);
      return data;
    } catch (err) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    await fetchMe();
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post("/api/auth/register", payload);
    return data;
  };

  const verifyEmail = async (email, code) => {
    const { data } = await api.post("/api/auth/verify-email", { email, code });
    await fetchMe();
    return data;
  };

  const resendVerification = async (email) => {
    const { data } = await api.post("/api/auth/resend-verification", { email });
    return data;
  };

  const forgotPassword = async (email) => {
    const { data } = await api.post("/api/auth/forgot-password", { email });
    return data;
  };

  const resetPassword = async (email, code, newPassword) => {
    const { data } = await api.post("/api/auth/reset-password", { email, code, newPassword });
    return data;
  };

  const logout = async () => {
    await api.post("/api/auth/logout");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      register,
      verifyEmail,
      resendVerification,
      forgotPassword,
      resetPassword,
      logout,
      refetch: fetchMe
    }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
