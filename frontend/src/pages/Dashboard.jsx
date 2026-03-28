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
  const riskFocus = Math.max(scores.fagerstromScore || 0, scores.hadAnxietyScore || 0, scores.hadDepressionScore || 0);

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
      <section className="dashboard-command">
        <div className="dashboard-command-copy">
          <div className="hero-kicker">Clinical command center</div>
          <h2 className="dashboard-title">Le poste clinique ne montre pas juste des donnees. Il montre la trajectoire du patient.</h2>
          <p className="muted-text">
            Le brouillard se retire, les signaux deviennent plus nets et le temps de vie gagne prend la premiere place.
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

      <section className="life-gain-panel">
        <div className="life-gain-main">
          <span className="life-gain-label">Time of Life Gained</span>
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

        <article className={`score-orb severity-${severityFromScore(riskFocus)}`}>
          <span>Signal global</span>
          <strong>{riskFocus}</strong>
          <p>Le glow s'intensifie quand le score devient critique.</p>
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
                <CartesianGrid stroke="rgba(124, 214, 255, 0.12)" strokeDasharray="4 4" />
                <XAxis dataKey="date" stroke="#9cb0c4" />
                <YAxis stroke="#9cb0c4" />
                <Tooltip
                  contentStyle={{
                    background: "rgba(8, 14, 24, 0.92)",
                    border: "1px solid rgba(124, 214, 255, 0.16)",
                    borderRadius: 18,
                    color: "#eaf7ff"
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="anxiete" stroke="#74e6ff" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="depression" stroke="#ff7b7b" strokeWidth={3} dot={{ r: 3 }} />
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
                    <stop offset="0%" stopColor="#74e6ff" stopOpacity={0.42} />
                    <stop offset="100%" stopColor="#74e6ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="stressFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff7b7b" stopOpacity={0.38} />
                    <stop offset="100%" stopColor="#ff7b7b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(124, 214, 255, 0.12)" strokeDasharray="4 4" />
                <XAxis dataKey="date" stroke="#9cb0c4" />
                <YAxis stroke="#9cb0c4" />
                <Tooltip
                  contentStyle={{
                    background: "rgba(8, 14, 24, 0.92)",
                    border: "1px solid rgba(124, 214, 255, 0.16)",
                    borderRadius: 18,
                    color: "#eaf7ff"
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="cravings" stroke="#74e6ff" fill="url(#cravingsFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="stress" stroke="#ff7b7b" fill="url(#stressFill)" strokeWidth={2} />
                <Line type="monotone" dataKey="cigarettes" stroke="#f4f7fb" strokeWidth={2} dot={false} />
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
