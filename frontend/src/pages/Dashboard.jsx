import React, { useEffect, useState } from "react";
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
  const lifeMinutesGained = avoidedPerDay * 11 * Math.max(reports.length, 1);
  const weeklySpend = onboarding?.weeklyTobaccoSpend || 0;
  const estimatedCostPerCigarette =
    baselineDailyConsumption > 0 && weeklySpend > 0 ? weeklySpend / Math.max(baselineDailyConsumption * 7, 1) : 0;
  const moneySaved = avoidedPerDay * estimatedCostPerCigarette * Math.max(reports.length, 1);
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
  const riskFocus = currentRass ?? Math.max(scores.fagerstromScore || 0, scores.hadAnxietyScore || 0, scores.hadDepressionScore || 0);

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

  const milestoneCards = [
    {
      label: "Temps de vie gagne",
      value: formatLifeGain(lifeMinutesGained),
      copy: "Estimation basee sur les cigarettes evitees depuis le debut du suivi."
    },
    {
      label: "Jours traces",
      value: `${reports.length}`,
      copy: "Plus les saisies sont regulieres, plus l'interface devient claire."
    },
    {
      label: "Economie estimee",
      value: `${moneySaved.toFixed(1)} €`,
      copy: "Visible, mais toujours en second plan derriere l'impact sante."
    }
  ];

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

  return (
    <div className={`app-page dashboard-stage dashboard-stage-${stage}`}>
      <section className="dashboard-command" data-guide-id="dashboard-command">
        <div className="dashboard-command-copy">
          <div className="hero-kicker">Tableau de bord clinique</div>
          <h2 className="dashboard-title">Un espace plus calme pour lire la trajectoire du patient sans surcharge visuelle.</h2>
          <p className="muted-text">
            Les scores, le journal quotidien et les notes cliniques restent visibles, mais dans une interface plus douce et plus rassurante.
          </p>
        </div>

        <div className="dashboard-command-actions">
          <Link to="/tests" className="btn btn-dark">
            Mettre a jour les scores
          </Link>
          <Link to="/plan" className="btn btn-outline-dark">
            Ouvrir le plan
          </Link>
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

      <section className="life-gain-panel">
        <div className="life-gain-main">
          <span className="life-gain-label">Temps de vie gagne</span>
          <strong>{formatLifeGain(lifeMinutesGained)}</strong>
          <p>
            Estimation mise en avant pour rappeler que la mission du produit reste la recuperation physiologique, pas la simple economie.
          </p>
        </div>

        <div className="life-gain-side">
          {milestoneCards.map((card) => (
            <div key={card.label} className="life-gain-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.copy}</p>
            </div>
          ))}
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
