import React, { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import TopNav from "./components/TopNav";
import AuthLayout from "./components/AuthLayout";
import ClinicalSidebar from "./components/ClinicalSidebar";
import ClinicalTopbar from "./components/ClinicalTopbar";
import PatientGuide from "./components/PatientGuide";
import ProtectedRoute from "./components/ProtectedRoute";
import { isAdmin, isDoctor, isPatient } from "./utils/roles";
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DoctorDirectory = lazy(() => import("./pages/DoctorDirectory"));
const DoctorWorkspace = lazy(() => import("./pages/DoctorWorkspace"));
const AdminWorkspace = lazy(() => import("./pages/AdminWorkspace"));
const Profile = lazy(() => import("./pages/Profile"));
const Tests = lazy(() => import("./pages/Tests"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Plan = lazy(() => import("./pages/Plan"));
const DailyReport = lazy(() => import("./pages/DailyReport"));
const Appointments = lazy(() => import("./pages/Appointments"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Support = lazy(() => import("./pages/Support"));
const Communities = lazy(() => import("./pages/Communities"));
const ClinicalGuidancePage = lazy(() => import("./pages/ClinicalGuidancePage"));

const PUBLIC_PATHS = new Set(["/", "/login", "/register", "/verify-email", "/forgot-password"]);

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
  const adminMode = isAdmin(user);

  if (isPublicRoute) {
    return (
      <div className="public-shell">
        <TopNav />
        <main className="public-main">
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>
              
              
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/onboarding" element={<Navigate to="/evaluation" replace />} />
              <Route
                path="/evaluation"
                element={
                  <ProtectedRoute>
                    {(!isAdmin(user) && !isDoctor(user)) ? <Onboarding /> : <Navigate to="/dashboard" replace />}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    {adminMode ? <AdminWorkspace /> : isPatient(user) ? <Dashboard /> : <DoctorWorkspace mode="workspace" />}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    {adminMode ? <AdminWorkspace /> : isPatient(user) ? <Profile /> : <DoctorWorkspace mode="profile" />}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctors"
                element={
                  <ProtectedRoute>
                    <DoctorDirectory />
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
              <Route
                path="/appointments"
                element={
                  <ProtectedRoute>
                    <Appointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/support"
                element={
                  <ProtectedRoute>
                    <Support />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/communities"
                element={
                  <ProtectedRoute>
                    <Communities />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clinical-guidance"
                element={
                  <ProtectedRoute>
                    <ClinicalGuidancePage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </main>
      </div>
    );
  }

  const shellState = !isPatient(user) || user?.profile?.onboardingComplete ? "state-oxygenated" : "state-foggy";

  return (
    <div className={`clinical-workstation ${shellState}`}>
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
                    {(!isAdmin(user) && !isDoctor(user)) ? <Onboarding /> : <Navigate to="/dashboard" replace />}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    {adminMode ? <AdminWorkspace /> : isPatient(user) ? <Dashboard /> : <DoctorWorkspace mode="workspace" />}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    {adminMode ? <AdminWorkspace /> : isPatient(user) ? <Profile /> : <DoctorWorkspace mode="profile" />}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctors"
                element={
                  <ProtectedRoute>
                    <DoctorDirectory />
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
              <Route
                path="/appointments"
                element={
                  <ProtectedRoute>
                    <Appointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/support"
                element={
                  <ProtectedRoute>
                    <Support />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/communities"
                element={
                  <ProtectedRoute>
                    <Communities />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clinical-guidance"
                element={
                  <ProtectedRoute>
                    <ClinicalGuidancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="*"
                element={
                  <ProtectedRoute>
                    {adminMode ? <AdminWorkspace /> : isPatient(user) ? <Dashboard /> : <DoctorWorkspace mode="workspace" />}
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </main>
      </div>
      <PatientGuide />
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
