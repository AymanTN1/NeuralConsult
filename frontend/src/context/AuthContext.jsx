import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getDemoUserByEmail } from "../services/demoMockService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMe = async () => {
    // 1. Check if mock demo session is saved in localStorage
    const savedDemoEmail = typeof window !== "undefined" ? localStorage.getItem("nc_active_demo_email") : null;
    if (savedDemoEmail) {
      const demoUser = getDemoUserByEmail(savedDemoEmail);
      if (demoUser) {
        setUser(demoUser);
        setError(null);
        setLoading(false);
        return demoUser;
      }
    }

    try {
      const { data } = await api.get("/api/me");
      const demoFallback = data?.email ? getDemoUserByEmail(data.email) : null;
      const finalUser = demoFallback
        ? {
            ...demoFallback,
            ...data,
            isDemo: true,
            fullName: (data.fullName && data.fullName !== "-") ? data.fullName : demoFallback.fullName,
            firstName: data.firstName || demoFallback.firstName,
            lastName: data.lastName || demoFallback.lastName,
            dateOfBirth: data.dateOfBirth || demoFallback.dateOfBirth,
            identityVerified: true,
            accountEnabled: true,
            profile: {
              ...(demoFallback.profile || {}),
              ...(data.profile || {}),
              onboardingComplete: true,
              testsComplete: true,
              journalComplete: true
            }
          }
        : data;

      setUser(finalUser);
      setError(null);
      return finalUser;
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
    const demoUser = getDemoUserByEmail(email);

    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      if (demoUser) {
        localStorage.setItem("nc_active_demo_email", email);
      }
      await fetchMe();
      return data;
    } catch (err) {
      // If network fails or API is offline on Vercel, activate high-fidelity demo mock session!
      if (demoUser) {
        localStorage.setItem("nc_active_demo_email", email);
        localStorage.setItem("nc_token", "demo_jwt_token_" + demoUser.id);
        setUser(demoUser);
        setError(null);
        return { accessToken: "demo_jwt_token_" + demoUser.id, user: demoUser, roles: demoUser.roles };
      }
      throw err;
    }
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
    try {
      await api.post("/api/auth/logout");
    } catch (e) {
      // ignore
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("nc_active_demo_email");
      localStorage.removeItem("nc_token");
    }
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

export default AuthContext;
