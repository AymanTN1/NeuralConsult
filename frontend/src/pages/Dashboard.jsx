import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Dashboard = () => {
  const { user } = useAuth();
  const scores = user?.scores || {};
  const [plan, setPlan] = useState(null);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [planResp, reportResp] = await Promise.all([
          api.get("/api/sevrage-plan/current"),
          api.get("/api/daily-reports")
        ]);
        setPlan(planResp.data);
        setReports(reportResp.data || []);
      } catch (err) {
        setPlan(null);
        setReports([]);
      }
    };
    load();
  }, []);

  const trendData = useMemo(
    () =>
      reports.map((report) => ({
        date: report.reportDate?.slice(5),
        cigarettes: report.cigarettesSmoked ?? 0,
        cravings: report.cravingsIntensity ?? 0,
        mood: report.moodScore ?? 0,
        stress: report.stressScore ?? 0
      })),
    [reports]
  );

  const avgCravings = useMemo(() => {
    if (!reports.length) return 0;
    const total = reports.reduce((sum, report) => sum + (report.cravingsIntensity ?? 0), 0);
    return Math.round(total / reports.length);
  }, [reports]);

  const riskIndex = Math.min(
    100,
    Math.round(
      (scores.fagerstromScore ? (scores.fagerstromScore / 10) * 40 : 0) +
        (Math.max(scores.hadAnxietyScore || 0, scores.hadDepressionScore || 0) / 21) * 40 +
        (avgCravings / 10) * 20
    )
  );

  const scoreData = [
    {
      name: "Scores",
      fagerstrom: scores.fagerstromScore || 0,
      anxiete: scores.hadAnxietyScore || 0,
      depression: scores.hadDepressionScore || 0
    }
  ];

  return (
    <div className="container py-4 app-shell">
      <div className="dashboard-hero mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <p className="muted-text small mb-1">Bienvenue</p>
            <h2 className="fw-bold mb-1">{user?.fullName || "Patient"}</h2>
            <p className="muted-text mb-0">Suivi intelligent et evolution clinique en temps reel.</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/onboarding" className="btn btn-outline-dark">
              <i className="bi bi-clipboard2-pulse me-1" /> Profiling
            </Link>
            <Link to="/tests" className="btn btn-dark">
              <i className="bi bi-ui-checks me-1" /> Passer un test
            </Link>
          </div>
        </div>
        <div className="row g-3 mt-3">
          <div className="col-12 col-md-4">
            <div className="metric-card h-100">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="muted-text">Indice de risque</span>
                <span className="badge text-bg-dark">{riskIndex}%</span>
              </div>
              <div className="progress" style={{ height: 8 }}>
                <div className="progress-bar bg-dark" style={{ width: `${riskIndex}%` }} />
              </div>
              <p className="muted-text small mt-2 mb-0">
                Combine dependance, humeur et envies recentes.
              </p>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="metric-card h-100">
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-map" />
                <span className="fw-semibold">Plan actif</span>
              </div>
              <p className="mb-1">{plan?.summary || "Plan non genere."}</p>
              <p className="muted-text small mb-0">Cible: {plan?.targetQuitDate || "A definir"}</p>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="metric-card h-100">
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-journal-text" />
                <span className="fw-semibold">Journal</span>
              </div>
              <p className="mb-1">{reports.length} entree(s) sur 7 jours</p>
              <p className="muted-text small mb-0">Envies moyennes: {avgCravings}/10</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <div className="chart-card p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Evolution quotidienne</h5>
              <span className="muted-text small">7 derniers jours</span>
            </div>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cigarettes" stroke="#0f172a" name="Cigarettes" />
                  <Line type="monotone" dataKey="cravings" stroke="#f97316" name="Envies" />
                  <Line type="monotone" dataKey="mood" stroke="#14b8a6" name="Humeur" />
                  <Line type="monotone" dataKey="stress" stroke="#38bdf8" name="Stress" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-5">
          <div className="chart-card p-3 h-100">
            <h5 className="mb-3">Scores cliniques</h5>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="fagerstrom" fill="#0f172a" name="Fagerstrom" />
                  <Bar dataKey="anxiete" fill="#38bdf8" name="HAD Anxiete" />
                  <Bar dataKey="depression" fill="#f97316" name="HAD Depression" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="d-flex justify-content-between mt-3">
              <Link to="/tests" className="btn btn-outline-dark btn-sm">Mettre a jour</Link>
              <Link to="/plan" className="btn btn-dark btn-sm">Voir plan</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
