import React, { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import TopNav from "./components/TopNav";
import ClinicalSidebar from "./components/ClinicalSidebar";
import ClinicalTopbar from "./components/ClinicalTopbar";
import ProtectedRoute from "./components/ProtectedRoute";
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Tests = lazy(() => import("./pages/Tests"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Plan = lazy(() => import("./pages/Plan"));
const DailyReport = lazy(() => import("./pages/DailyReport"));

const PUBLIC_PATHS = new Set(["/", "/login", "/register"]);

const RouteLoader = () => (
  <div className="clinical-loader">
    <div className="clinical-loader-ring" />
    <div className="clinical-loader-copy">Chargement de l'experience clinique...</div>
  </div>
);

const AppShell = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isPublicRoute = PUBLIC_PATHS.has(location.pathname);

  if (isPublicRoute) {
    return (
      <div className="public-shell">
        <TopNav />
        <main className="public-main">
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/onboarding" element={<Navigate to="/evaluation" replace />} />
              <Route
                path="/evaluation"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tests"
                element={
                  <ProtectedRoute>
                    <Tests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plan"
                element={
                  <ProtectedRoute>
                    <Plan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/journal"
                element={
                  <ProtectedRoute>
                    <DailyReport />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </main>
      </div>
    );
  }

  return (
    <div className={`clinical-workstation ${user?.profile?.onboardingComplete ? "state-oxygenated" : "state-foggy"}`}>
      <ClinicalSidebar />
      <div className="clinical-content">
        <ClinicalTopbar />
        <main className="clinical-main">
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/onboarding" element={<Navigate to="/evaluation" replace />} />
              <Route
                path="/evaluation"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tests"
                element={
                  <ProtectedRoute>
                    <Tests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plan"
                element={
                  <ProtectedRoute>
                    <Plan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/journal"
                element={
                  <ProtectedRoute>
                    <DailyReport />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
