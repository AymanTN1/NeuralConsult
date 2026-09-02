import React, { Suspense, lazy, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
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
import { chartTheme } from "../theme/chartTheme";

const InteractiveLung3D = lazy(() => import("../components/InteractiveLung3D"));

const Lung3DFallback = () => (
  <div className="card shadow-sm border-0 rounded-4 p-4 text-center my-4" style={{ minHeight: "220px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--nc-panel)" }}>
    <div className="d-flex flex-column align-items-center gap-2">
      <div className="spinner-border text-info" role="status" style={{ width: "2.2rem", height: "2.2rem" }} />
      <span className="muted-text small mt-2">Initialisation du modèle anatomique 3D...</span>
    </div>
  </div>
);

const severityFromScore = (score) => {
  if (score >= 11) return "critical";
  if (score >= 8) return "warning";
  return "stable";
};

const formatLifeGain = (minutes) => {
  if (!minutes) return "0 h";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)} h`;
  return `${(minutes / 1440).toFixed(1)} jours`;
};

const Dashboard = () => {
  const { user } = useAuth();
  const scores = user?.scores || {};
  const [plan, setPlan] = useState(null);
  const [reports, setReports] = useState([]);
  const [hadHistory, setHadHistory] = useState([]);
  const [onboarding, setOnboarding] = useState(null);
  const [clinicalNote, setClinicalNote] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [planResp, reportResp, hadResp, onboardingResp, noteResp] = await Promise.allSettled([
        api.get("/api/sevrage-plan/current"),
        api.get("/api/daily-reports"),
        api.get("/api/tests/had"),
        api.get("/api/onboarding"),
        api.get("/api/clinical-notes")
      ]);

      setPlan(planResp.status === "fulfilled" ? planResp.value.data : null);
      setReports(reportResp.status === "fulfilled" ? reportResp.value.data || [] : []);
      setHadHistory(hadResp.status === "fulfilled" ? hadResp.value.data || [] : []);
      setOnboarding(onboardingResp.status === "fulfilled" ? onboardingResp.value.data?.assessment || null : null);
      setClinicalNote(noteResp.status === "fulfilled" ? noteResp.value.data || null : null);
    };

    load();
  }, []);

  const stage = plan?.targetQuitDate ? "patient" : "candidate";
  const averageDailyConsumption = reports.length
    ? reports.reduce((sum, report) => sum + (report.cigarettesSmoked ?? 0), 0) / reports.length
    : 0;
  const baselineDailyConsumption = user?.profile?.cigarettesPerDay || onboarding?.manufacturedCigarettesPerDay || 0;
  const avoidedPerDay = Math.max(0, baselineDailyConsumption - averageDailyConsumption);
  const weeklySpend = onboarding?.weeklyTobaccoSpend || 0;
  const estimatedCostPerCigarette =
    baselineDailyConsumption > 0 && weeklySpend > 0 ? weeklySpend / Math.max(baselineDailyConsumption * 7, 1) : 0;
  
  const latestFScore = scores.fagerstromScore;
  const latestAnxiety = scores.hadAnxietyScore;
  const latestDepression = scores.hadDepressionScore;

  const calculateRassScore = (fScore, aScore, dScore) => {
    if (fScore === undefined || fScore === null || 
        aScore === undefined || aScore === null || 
        dScore === undefined || dScore === null) {
      return null;
    }
    const score = (0.3 * fScore) + (0.35 * (aScore / 21) * 10) + (0.35 * (dScore / 21) * 10);
    return Math.round(score);
  };

  const currentRass = calculateRassScore(latestFScore, latestAnxiety, latestDepression);

  const habitTrend = reports.map((report) => ({
    date: report.reportDate?.slice(5),
    cigarettes: report.cigarettesSmoked ?? 0,
    cravings: report.cravingsIntensity ?? 0,
    mood: report.moodScore ?? 0,
    stress: report.stressScore ?? 0
  }));

  const hadTrend = [...hadHistory]
    .reverse()
    .map((test) => ({
      date: test.createdAt ? new Date(test.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) : "-",
      anxiete: test.anxietyScore ?? 0,
      depression: test.depressionScore ?? 0
    }));

  const healthMilestones = [
    {
      title: "Le souffle remonte",
      copy: "La sensation d'oxygene redevient un indicateur concret plutot qu'un concept abstrait.",
      done: reports.length >= 3
    },
    {
      title: "Le brouillard baisse",
      copy: "Les pics de cravings et de stress deviennent plus lisibles pour le medecin.",
      done: averageDailyConsumption < baselineDailyConsumption
    },
    {
      title: "L'alliance clinique prend",
      copy: "Le parcours est suffisamment documente pour piloter le plan et la note medicale.",
      done: Boolean(plan || clinicalNote)
    }
  ];

  // 🎮 Gamification real-time calculations
  const targetQuitDate = plan?.targetQuitDate || user?.profile?.targetQuitDate || user?.createdAt;
  const quitDate = targetQuitDate ? new Date(targetQuitDate) : new Date(Date.now() - 4 * 24 * 60 * 60 * 1000); // 4 days default for stunning visual first impression!
  
  const [timeElapsed, setTimeElapsed] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [realtimeMoney, setRealtimeMoney] = useState(0);
  const [realtimeCigarettes, setRealtimeCigarettes] = useState(0);

  useEffect(() => {
    const updateStats = () => {
      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - quitDate.getTime());
      
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      setTimeElapsed({ days, hours, minutes, seconds });

      const dailyQty = baselineDailyConsumption || 15;
      const costPerCig = estimatedCostPerCigarette || 2; // 2 DH per cigarette (40 DH per pack)
      
      const totalSecondsElapsed = diffMs / 1000;
      const cigarettesPerSecond = dailyQty / (24 * 60 * 60);
      const avoidedCigs = totalSecondsElapsed * cigarettesPerSecond;
      const savedAmount = avoidedCigs * costPerCig;

      setRealtimeCigarettes(avoidedCigs);
      setRealtimeMoney(savedAmount);
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [quitDate, baselineDailyConsumption, estimatedCostPerCigarette]);

  const diffDays = Math.max(0, (Date.now() - quitDate.getTime()) / (1000 * 60 * 60 * 24));

  const physiologicalIndicators = [
    {
      name: "Oxygénation du sang",
      duration: "24 heures",
      progress: Math.min(100, (diffDays * 100) / 1),
      icon: "bi-wind",
      desc: "Le niveau d'oxygène dans le sang redevient normal.",
      color: "#10b981"
    },
    {
      name: "Monoxyde de carbone",
      duration: "48 heures",
      progress: Math.min(100, (diffDays * 100) / 2),
      icon: "bi-shield-check",
      desc: "Le CO est complètement éliminé des poumons.",
      color: "#3b82f6"
    },
    {
      name: "Goût & Odorat",
      duration: "7 jours",
      progress: Math.min(100, (diffDays * 100) / 7),
      icon: "bi-flower1",
      desc: "Les terminaisons nerveuses repoussent, les sens s'éveillent.",
      color: "#f59e0b"
    },
    {
      name: "Capacité pulmonaire",
      duration: "30 jours",
      progress: Math.min(100, (diffDays * 100) / 30),
      icon: "bi-lungs",
      desc: "La toux et l'essoufflement diminuent considérablement.",
      color: "#ec4899"
    },
    {
      name: "Santé Cardiovasculaire",
      duration: "365 jours",
      progress: Math.min(100, (diffDays * 100) / 365),
      icon: "bi-heart-fill",
      desc: "Le risque d'accident cardiaque est divisé par deux.",
      color: "#ef4444"
    }
  ];

  const badgesList = [
    { id: "bronze", title: "Bronze", requirement: "3 jours libres", icon: "bi-award-fill", color: "#cd7f32", unlocked: diffDays >= 3 },
    { id: "argent", title: "Argent", requirement: "1 semaine libre", icon: "bi-award-fill", color: "#c0c0c0", unlocked: diffDays >= 7 },
    { id: "or", title: "Or", requirement: "1 mois libre", icon: "bi-award-fill", color: "#ffd700", unlocked: diffDays >= 30 },
    { id: "platine", title: "Platine", requirement: "3 mois libres", icon: "bi-gem", color: "#60a5fa", unlocked: diffDays >= 90 },
    { id: "legende", title: "Légende", requirement: "1 an libre", icon: "bi-trophy-fill", color: "#a855f7", unlocked: diffDays >= 365 }
  ];

  const currentLevel = Math.max(1, Math.floor(diffDays / 7) + 1);

  return (
    <div className={`app-page dashboard-stage dashboard-stage-${stage}`}>
      <section className="dashboard-command nc-glass-card p-4 mb-4" data-guide-id="dashboard-command">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="dashboard-command-copy">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="pulse-dot-live" />
              <span className="nc-badge-pill bg-success-subtle text-success border border-success-subtle">
                Suivi Actif — J+{diffDays} Sans Tabac
              </span>
            </div>
            <h2 className="dashboard-title mb-1 fw-bold">
              Bonjour, {user?.firstName || user?.fullName || "Youssef"} 👋
            </h2>
            <p className="muted-text mb-0">
              Votre santé pulmonaire s'améliore chaque jour. Consultez vos biomarqueurs et maintenez votre progression.
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <Link to="/daily-report" className="btn btn-emerald-gradient btn-sm d-inline-flex align-items-center">
              <i className="bi bi-journal-plus me-1.5" />
              Journal du Jour
            </Link>
            <Link to="/support" className="btn btn-primary-gradient btn-sm d-inline-flex align-items-center">
              <i className="bi bi-heart-pulse-fill me-1.5" />
              SOS Soutien 24/7
            </Link>
            <Link to="/tests" className="btn btn-outline-primary btn-sm rounded-pill fw-semibold px-3 d-inline-flex align-items-center">
              <i className="bi bi-activity me-1.5" />
              Bilans Fagerström & HAD
            </Link>
          </div>
        </div>
      </section>

      {currentRass !== null && currentRass > 6 && (
        <section className="card p-4 mb-4 border-0 shadow-sm" style={{ background: "linear-gradient(135deg, #fffcf6 0%, #fff3e0 100%)", borderRadius: "24px", borderLeft: "6px solid #f59e0b" }}>
          <div className="d-flex align-items-start gap-3">
            <div className="p-3 bg-warning bg-opacity-25 rounded-circle text-warning">
              <i className="bi bi-heart-pulse-fill fs-3"></i>
            </div>
            <div>
              <h4 className="fw-bold text-dark mb-2">Un instant pour vous, en toute sérénité 🌸</h4>
              <p className="text-secondary mb-3 fs-6">
                Nous ressentons une légère tension émotionnelle ou une envie de fumer plus forte aujourd'hui. C'est tout à fait normal dans votre parcours, et chaque étape vous renforce. Prenez une grande inspiration et accordez-vous une pause bienveillante.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/chat" className="btn btn-warning text-dark fw-semibold px-4 rounded-pill">
                  Parler à l'Assistant IA de soutien
                </Link>
                <button type="button" className="btn btn-outline-warning text-dark fw-semibold px-4 rounded-pill" onClick={() => alert("Pratiquez la cohérence cardiaque : Inspirez pendant 5 secondes... Expirez pendant 5 secondes... Répétez 3 fois. Vous êtes sur la bonne voie !")}>
                  Faire un exercice de respiration (1 min)
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 🫁 Visualisation 3D Interactive de l'Évolution Pulmonaire */}
      <Suspense fallback={<Lung3DFallback />}>
        <InteractiveLung3D diffDays={diffDays} />
      </Suspense>

      {/* 🏆 Section Gamification & Récompenses */}
      <section className="rewards-dashboard-section">
        {/* Main rewards card with real-time ticker and badges */}
        <div className="rewards-main-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span className="hero-kicker">🏆 Vos Victoires Cliniques & Récompenses</span>
              <h3 className="fw-bold text-dark mb-0">Sevrage Niveau {currentLevel}</h3>
            </div>
            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-semibold border border-primary border-opacity-15">
              Libre depuis {timeElapsed.days} jours
            </span>
          </div>

          <p className="text-secondary mb-4">
            Chaque seconde sans fumer permet à votre corps de se régénérer et à votre cagnotte de grandir. Continuez ainsi !
          </p>

          <div className="reward-ticker-grid">
            <div className="reward-ticker-card">
              <span className="ticker-label">💰 Cagnotte Économisée</span>
              <span className="ticker-value text-success">{realtimeMoney.toFixed(2)} DH</span>
              <span className="ticker-sub">Basé sur vos dépenses habituelles</span>
            </div>

            <div className="reward-ticker-card">
              <span className="ticker-label">🚭 Cigarettes Évitées</span>
              <span className="ticker-value text-primary">{Math.floor(realtimeCigarettes)} cig.</span>
              <span className="ticker-sub">Non consommées au total</span>
            </div>

            <div className="reward-ticker-card">
              <span className="ticker-label">⏳ Temps de Liberté</span>
              <span className="ticker-value text-dark" style={{ fontSize: "1.25rem", padding: "0.2rem 0" }}>
                {timeElapsed.days}j {timeElapsed.hours}h {timeElapsed.minutes}m {timeElapsed.seconds}s
              </span>
              <span className="ticker-sub">Compteur de liberté en direct</span>
            </div>
          </div>

          <hr className="my-4" style={{ opacity: 0.1 }} />

          <div>
            <h5 className="fw-bold text-dark mb-3"><i className="bi bi-trophy-fill text-warning me-2"></i>Vos Trophées Débloqués</h5>
            <div className="badges-shelf">
              {badgesList.map((badge) => (
                <div key={badge.id} className={`badge-trophy ${badge.unlocked ? "unlocked" : "locked"}`} title={badge.unlocked ? `Débloqué ! - ${badge.requirement}` : `Verrouillé - Requis: ${badge.requirement}`}>
                  <div className="badge-circle" style={{ backgroundColor: badge.unlocked ? `${badge.color}15` : "#e5e7eb", color: badge.unlocked ? badge.color : "#9ca3af", border: badge.unlocked ? `2px solid ${badge.color}` : "2px solid #d1d5db" }}>
                    <i className={`bi ${badge.icon}`}></i>
                    {!badge.unlocked && (
                      <div className="badge-lock">
                        <i className="bi bi-lock-fill"></i>
                      </div>
                    )}
                  </div>
                  <span className="badge-title">{badge.title}</span>
                  <span className="badge-req">{badge.requirement}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Physiological recovery gauges */}
        <div className="physiological-recovery-card">
          <div>
            <span className="hero-kicker">🫁 Restauration Physiologique</span>
            <h4 className="fw-bold text-dark mb-3">Régénération du Corps</h4>
            <p className="text-secondary small mb-4">
              Voici l'évolution de vos fonctions vitales depuis votre dernière cigarette :
            </p>
          </div>

          <div className="d-flex flex-column gap-3">
            {physiologicalIndicators.map((indicator) => (
              <div key={indicator.name} className="physiological-item">
                <div className="physiological-icon-wrap" style={{ backgroundColor: `${indicator.color}15`, color: indicator.color, border: `1px solid ${indicator.color}25` }}>
                  <i className={`bi ${indicator.icon}`}></i>
                </div>
                <div className="physiological-progress-wrap">
                  <div className="physiological-header">
                    <strong>{indicator.name}</strong>
                    <span style={{ color: indicator.color, fontSize: '0.75rem', fontWeight: 600 }}>
                      {indicator.progress >= 100 ? "100% (Atteint)" : `${Math.round(indicator.progress)}% (${indicator.duration})`}
                    </span>
                  </div>
                  <div className="physiological-bar-container">
                    <div className="physiological-bar-fill" style={{ width: `${indicator.progress}%`, backgroundColor: indicator.color }}></div>
                  </div>
                  <span className="text-muted d-block mt-1" style={{ fontSize: "0.7rem", lineHeight: 1.2 }}>
                    {indicator.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-score-grid">
        <article className={`score-orb severity-${severityFromScore(scores.fagerstromScore || 0)}`}>
          <span>Fagerstrom</span>
          <strong>{scores.fagerstromScore ?? 0}</strong>
          <p>Dependance physique actuelle</p>
        </article>

        <article className={`score-orb severity-${severityFromScore(scores.hadAnxietyScore || 0)}`}>
          <span>HAD Anxiete</span>
          <strong>{scores.hadAnxietyScore ?? 0}</strong>
          <p>Intensite psychique immediate</p>
        </article>

        <article className={`score-orb severity-${severityFromScore(scores.hadDepressionScore || 0)}`}>
          <span>HAD Depression</span>
          <strong>{scores.hadDepressionScore ?? 0}</strong>
          <p>Vigilance emotionnelle et rechute</p>
        </article>

        <article className="score-orb" style={{ boxShadow: currentRass > 6 ? "0 0 20px rgba(245, 158, 11, 0.4)" : "none", border: currentRass !== null ? `2px solid ${currentRass <= 3 ? "#10b981" : currentRass <= 6 ? "#f59e0b" : "#ef4444"}` : "none" }}>
          <span>Score RASS</span>
          <strong>{currentRass !== null ? `${currentRass}/10` : "-"}</strong>
          <p>{currentRass !== null ? (currentRass <= 3 ? "État Stable (Vert)" : currentRass <= 6 ? "Vigilance (Orange)" : "Soutien (Rouge)") : "Non calculé"}</p>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="chart-card chart-card-large">
          <div className="chart-card-head">
            <div>
              <div className="hero-kicker">HAD evolution</div>
              <h3>Comparaison Anxiete / Depression</h3>
            </div>
            <span className="chart-badge">Psychological pulse</span>
          </div>

          <div className="dashboard-chart-wrap">
            <ResponsiveContainer>
              <LineChart data={hadTrend}>
                <CartesianGrid stroke={chartTheme.grid} strokeDasharray="4 4" />
                <XAxis dataKey="date" stroke={chartTheme.axis} />
                <YAxis stroke={chartTheme.axis} />
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Legend />
                <Line type="monotone" dataKey="anxiete" stroke={chartTheme.anxiety} strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="depression" stroke={chartTheme.depression} strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card chart-card-tall">
          <div className="chart-card-head">
            <div>
              <div className="hero-kicker">Daily rhythm</div>
              <h3>Cravings, stress et consommation</h3>
            </div>
            <span className="chart-badge">Last entries</span>
          </div>

          <div className="dashboard-chart-wrap">
            <ResponsiveContainer>
              <AreaChart data={habitTrend}>
                <defs>
                  <linearGradient id="cravingsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartTheme.cravingsFillTop} />
                    <stop offset="100%" stopColor={chartTheme.cravingsFillBottom} />
                  </linearGradient>
                  <linearGradient id="stressFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartTheme.stressFillTop} />
                    <stop offset="100%" stopColor={chartTheme.stressFillBottom} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartTheme.grid} strokeDasharray="4 4" />
                <XAxis dataKey="date" stroke={chartTheme.axis} />
                <YAxis stroke={chartTheme.axis} />
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Legend />
                <Area type="monotone" dataKey="cravings" stroke={chartTheme.cravings} fill="url(#cravingsFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="stress" stroke={chartTheme.stress} fill="url(#stressFill)" strokeWidth={2} />
                <Line type="monotone" dataKey="cigarettes" stroke={chartTheme.cigarettes} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="dashboard-support-grid">
        <article className="clinical-note-preview">
          <div className="chart-card-head">
            <div>
              <div className="hero-kicker">AI clinical note</div>
              <h3>Synthese immediate pour le medecin</h3>
            </div>
          </div>
          <p className="muted-text">
            {clinicalNote?.medicalSummary
              ? `${clinicalNote.medicalSummary.slice(0, 280)}...`
              : "Aucune note clinique validee n'est encore disponible. La zone est prete a accueillir les insights RAG et la synthese medicale securisee."}
          </p>
          <Link to="/plan" className="btn btn-outline-dark btn-sm">
            Voir la strategie therapeutique
          </Link>
        </article>

        <article className="milestone-stack">
          <div className="chart-card-head">
            <div>
              <div className="hero-kicker">Health milestones</div>
              <h3>Checklist de recuperation</h3>
            </div>
          </div>

          <div className="milestone-list">
            {healthMilestones.map((milestone) => (
              <div key={milestone.title} className={`milestone-item ${milestone.done ? "is-done" : ""}`}>
                <span className="milestone-bullet">
                  <i className={`bi ${milestone.done ? "bi-check2" : "bi-record-circle"}`} />
                </span>
                <div>
                  <strong>{milestone.title}</strong>
                  <p>{milestone.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
};

export default Dashboard;
