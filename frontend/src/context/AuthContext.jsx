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
    await api.post("/api/auth/login", { email, password });
    await fetchMe();
  };

  const register = async (payload) => {
    await api.post("/api/auth/register", payload);
    await fetchMe();
  };

  const logout = async () => {
    await api.post("/api/auth/logout");
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, error, login, register, logout, refetch: fetchMe }), [user, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
