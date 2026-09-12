import React, { useState, useEffect } from "react";

export const CLINICAL_HEALING_BENCHMARKS = [
  {
    id: "20min",
    timeLabel: "+20 minutes",
    hoursRequired: 20 / 60,
    title: "Normalisation cardiaque & artérielle",
    desc: "La pression artérielle et la fréquence cardiaque redeviennent normales. La température des mains et des pieds augmente.",
    icon: "bi-heart-pulse",
    category: "Cardiovasculaire",
    color: "#10b981"
  },
  {
    id: "8h",
    timeLabel: "+8 heures",
    hoursRequired: 8,
    title: "Oxygénation cellulaire rétablie",
    desc: "Le taux de monoxyde de carbone (CO) dans le sang diminue de moitié. L'oxygénation des cellules et des tissus redevient optimale.",
    icon: "bi-wind",
    category: "Hématologique",
    color: "#06b6d4"
  },
  {
    id: "24h",
    timeLabel: "+24 heures",
    hoursRequired: 24,
    title: "Nettoyage pulmonaire & baisse d'infarctus",
    desc: "Le monoxyde de carbone est totalement éliminé. Les poumons commencent à rejeter les résidus de fumée et le mucus.",
    icon: "bi-lungs",
    category: "Pulmonaire",
    color: "#3b82f6"
  },
  {
    id: "48h",
    timeLabel: "+48 heures",
    hoursRequired: 48,
    title: "Nicotine purgée, goût et odorat éveillés",
    desc: "Il n'y a plus aucune trace de nicotine dans le corps. Les terminaisons nerveuses gustatives et olfactives commencent à repousser.",
    icon: "bi-flower1",
    category: "Sensoriel",
    color: "#f59e0b"
  },
  {
    id: "72h",
    timeLabel: "+72 heures",
    hoursRequired: 72,
    title: "Relâchement bronchique & regain d'énergie",
    desc: "Les bronches se détendent, respirer devient plus ample et facile. Le pic du sevrage physique aigu est franchi avec succès.",
    icon: "bi-lightning-charge-fill",
    category: "Énergie",
    color: "#8b5cf6"
  },
  {
    id: "14d",
    timeLabel: "+2 semaines",
    hoursRequired: 14 * 24,
    title: "Circulation sanguine & endurance régénérées",
    desc: "La circulation générale s'améliore nettement. Marcher, monter les escaliers et faire de l'exercice devient beaucoup moins fatigant.",
    icon: "bi-activity",
    category: "Endurance",
    color: "#ec4899"
  },
  {
    id: "21d",
    timeLabel: "+3 semaines",
    hoursRequired: 21 * 24,
    title: "Neuroplasticité : automatisme comportemental rompu",
    desc: "Le cerveau a créé de nouvelles connexions synaptiques indépendantes de la cigarette. Le réflexe pavlovien du geste est brisé.",
    icon: "bi-shield-check",
    category: "Neurologique",
    color: "#10b981"
  },
  {
    id: "30d",
    timeLabel: "+1 mois",
    hoursRequired: 30 * 24,
    title: "Capacité pulmonaire accrue de 30%",
    desc: "La toux et la congestion nasale diminuent fortement. Le teint de la peau est plus lumineux et la voix s'éclaircit.",
    icon: "bi-trophy-fill",
    category: "Respiratoire",
    color: "#eab308"
  },
  {
    id: "90d",
    timeLabel: "+3 mois",
    hoursRequired: 90 * 24,
    title: "Régénération des cils bronchiques",
    desc: "Les cils vibratiles bronchiques ont repoussé, nettoyant les poumons naturellement et réduisant drastiquement le risque d'infection.",
    icon: "bi-gem",
    category: "Immunitaire",
    color: "#0284c7"
  },
  {
    id: "180d",
    timeLabel: "+6 mois",
    hoursRequired: 180 * 24,
    title: "Liberté psychologique & baisse du stress",
    desc: "L'anxiété chronique liée au manque de tabac s'est dissipée. La vitalité quotidienne et la gestion des émotions sont stabilisées.",
    icon: "bi-emoji-smile-fill",
    category: "Psychologique",
    color: "#6366f1"
  },
  {
    id: "365d",
    timeLabel: "+1 an",
    hoursRequired: 365 * 24,
    title: "Risque cardiovasculaire divisé par deux",
    desc: "Le risque d'accident vasculaire cérébral et d'infarctus du myocarde est réduit de 50% par rapport à un fumeur actif.",
    icon: "bi-stars",
    category: "Longévité",
    color: "#ef4444"
  }
];

export const DAILY_ROUTINE_TASKS = [
  {
    id: "zero_cigs",
    title: "Zéro bouffée de fumée aujourd'hui",
    desc: "Maintenir mon cap de pureté totale pour cette journée.",
    icon: "bi-slash-circle-fill",
    color: "#10b981"
  },
  {
    id: "hydration_drain",
    title: "Hydratation détoxifiante (1.5L d'eau)",
    desc: "Boire un grand verre d'eau frais à chaque envie réflexe.",
    icon: "bi-droplet-half",
    color: "#0284c7"
  },
  {
    id: "breathing_pause",
    title: "Exercice de respiration ou cohérence cardiaque",
    desc: "3 minutes d'inspiration/expiration lente pour calmer le système nerveux.",
    icon: "bi-wind",
    color: "#8b5cf6"
  },
  {
    id: "active_move",
    title: "20 minutes de marche ou d'activité dynamique",
    desc: "Oxygéner les poumons et stimuler les endorphines naturelles.",
    icon: "bi-person-walking",
    color: "#f59e0b"
  },
  {
    id: "journal_checkin",
    title: "Compléter mon journal clinique du jour",
    desc: "Enregistrer mes cravings, mon humeur et mon niveau de stress.",
    icon: "bi-journal-check",
    color: "#ec4899"
  }
];

const RecoveryChecklist = ({ diffDays = 0, reportsCount = 0 }) => {
  const [activeTab, setActiveTab] = useState("daily"); // "daily" | "clinical"
  const [todayTasks, setTodayTasks] = useState({});
  const [celebrateDaily, setCelebrateDaily] = useState(false);

  const todayKey = `nc_daily_checklist_${new Date().toISOString().slice(0, 10)}`;

  // Load daily tasks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(todayKey);
      if (saved) {
        setTodayTasks(JSON.parse(saved));
      } else {
        // Auto-check journal task if patient has a report for today
        if (reportsCount > 0) {
          setTodayTasks({ journal_checkin: true });
        }
      }
    } catch (e) {}
  }, [todayKey, reportsCount]);

  const toggleTask = (taskId) => {
    setTodayTasks((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      try {
        localStorage.setItem(todayKey, JSON.stringify(next));
      } catch (e) {}

      const completedCount = Object.values(next).filter(Boolean).length;
      if (completedCount === DAILY_ROUTINE_TASKS.length) {
        setCelebrateDaily(true);
      }
      return next;
    });
  };

  const completedDailyCount = DAILY_ROUTINE_TASKS.filter((t) => todayTasks[t.id]).length;
  const dailyProgressPercent = Math.round((completedDailyCount / DAILY_ROUTINE_TASKS.length) * 100);

  // Compute clinical benchmarks
  const hoursElapsed = Math.max(0, diffDays * 24);
  const clinicalCompletedCount = CLINICAL_HEALING_BENCHMARKS.filter(
    (b) => hoursElapsed >= b.hoursRequired
  ).length;
  const clinicalProgressPercent = Math.round(
    (clinicalCompletedCount / CLINICAL_HEALING_BENCHMARKS.length) * 100
  );

  return (
    <article className="milestone-stack recovery-checklist-card">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <div className="hero-kicker">
            <i className="bi bi-shield-heart-fill text-danger me-1"></i> Health Milestones
          </div>
          <h3 className="mb-0 fw-bold">Checklist de Récupération</h3>
        </div>

        {/* Tab Switcher */}
        <div className="checklist-tabs-pill">
          <button
            type="button"
            className={`checklist-tab-btn ${activeTab === "daily" ? "is-active" : ""}`}
            onClick={() => setActiveTab("daily")}
          >
            <i className="bi bi-calendar-check me-1.5"></i>
            Routine du Jour ({completedDailyCount}/{DAILY_ROUTINE_TASKS.length})
          </button>
          <button
            type="button"
            className={`checklist-tab-btn ${activeTab === "clinical" ? "is-active" : ""}`}
            onClick={() => setActiveTab("clinical")}
          >
            <i className="bi bi-lungs-fill me-1.5"></i>
            Jalons Cliniques ({clinicalCompletedCount}/{CLINICAL_HEALING_BENCHMARKS.length})
          </button>
        </div>
      </div>

      {activeTab === "daily" && (
        <div>
          <div className="checklist-progress-bar-wrap mb-3">
            <div className="d-flex justify-content-between align-items-center small mb-1">
              <span className="fw-semibold text-secondary">
                Objectifs de sevrage du jour : {completedDailyCount} sur {DAILY_ROUTINE_TASKS.length}
              </span>
              <span className="fw-bold" style={{ color: dailyProgressPercent === 100 ? "#10b981" : "#0284c7" }}>
                {dailyProgressPercent}%
              </span>
            </div>
            <div className="progress" style={{ height: "8px", borderRadius: "999px", background: "rgba(0,0,0,0.05)" }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                style={{
                  width: `${dailyProgressPercent}%`,
                  background: dailyProgressPercent === 100 ? "linear-gradient(90deg, #10b981, #059669)" : "linear-gradient(90deg, #0284c7, #38bdf8)",
                  borderRadius: "999px"
                }}
              />
            </div>
          </div>

          {celebrateDaily && (
            <div className="alert alert-success d-flex align-items-center gap-2 p-2.5 mb-3 rounded-3 shadow-sm border-0" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#065f46" }}>
              <i className="bi bi-stars fs-4 text-success"></i>
              <span className="small">
                <strong>Bravo !</strong> Vous avez validé tous vos piliers de santé pour aujourd'hui. Vos poumons et votre cœur vous remercient !
              </span>
            </div>
          )}

          <div className="daily-tasks-list d-flex flex-column gap-2">
            {DAILY_ROUTINE_TASKS.map((task) => {
              const isDone = !!todayTasks[task.id];
              return (
                <div
                  key={task.id}
                  className={`checklist-task-item ${isDone ? "is-checked" : ""}`}
                  onClick={() => toggleTask(task.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="task-checkbox-wrap">
                    <input
                      type="checkbox"
                      className="form-check-input mt-0"
                      checked={isDone}
                      onChange={() => toggleTask(task.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="task-content">
                    <div className="d-flex align-items-center gap-2">
                      <i className={`bi ${task.icon}`} style={{ color: task.color, fontSize: "1rem" }}></i>
                      <strong className={`task-title ${isDone ? "text-decoration-line-through text-muted" : "text-dark"}`}>
                        {task.title}
                      </strong>
                    </div>
                    <p className="task-desc text-secondary small mb-0">{task.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "clinical" && (
        <div>
          <div className="checklist-progress-bar-wrap mb-3">
            <div className="d-flex justify-content-between align-items-center small mb-1">
              <span className="fw-semibold text-secondary">
                Restauration globale du corps : {clinicalCompletedCount} sur {CLINICAL_HEALING_BENCHMARKS.length} jalons franchis
              </span>
              <span className="fw-bold text-success">{clinicalProgressPercent}%</span>
            </div>
            <div className="progress" style={{ height: "8px", borderRadius: "999px", background: "rgba(0,0,0,0.05)" }}>
              <div
                className="progress-bar"
                role="progressbar"
                style={{
                  width: `${clinicalProgressPercent}%`,
                  background: "linear-gradient(90deg, #10b981, #0284c7)",
                  borderRadius: "999px"
                }}
              />
            </div>
          </div>

          <div className="clinical-benchmarks-list d-flex flex-column gap-2" style={{ maxHeight: "380px", overflowY: "auto", paddingRight: "4px" }}>
            {CLINICAL_HEALING_BENCHMARKS.map((benchmark) => {
              const isAchieved = hoursElapsed >= benchmark.hoursRequired;
              const progressToNext = isAchieved
                ? 100
                : Math.min(100, Math.round((hoursElapsed / benchmark.hoursRequired) * 100));

              return (
                <div
                  key={benchmark.id}
                  className={`clinical-benchmark-item ${isAchieved ? "is-achieved" : "is-upcoming"}`}
                >
                  <div className="benchmark-badge-wrap">
                    <div
                      className="benchmark-icon"
                      style={{
                        background: isAchieved ? `${benchmark.color}15` : "rgba(0,0,0,0.04)",
                        color: isAchieved ? benchmark.color : "#94a3b8",
                        border: `1.5px solid ${isAchieved ? benchmark.color : "#cbd5e1"}`
                      }}
                    >
                      <i className={`bi ${isAchieved ? "bi-check2" : benchmark.icon}`}></i>
                    </div>
                  </div>

                  <div className="benchmark-content flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge rounded-pill bg-light text-dark border px-2 py-1 small fw-bold">
                          {benchmark.timeLabel}
                        </span>
                        <strong className="benchmark-title">{benchmark.title}</strong>
                      </div>
                      <span
                        className={`badge ${isAchieved ? "bg-success-subtle text-success border border-success-subtle" : "bg-light text-secondary border"} rounded-pill`}
                        style={{ fontSize: "0.72rem" }}
                      >
                        {isAchieved ? "Atteint ✓" : `${progressToNext}%`}
                      </span>
                    </div>

                    <p className="benchmark-desc text-secondary small mb-1">{benchmark.desc}</p>

                    {!isAchieved && (
                      <div className="progress" style={{ height: "4px", borderRadius: "999px" }}>
                        <div
                          className="progress-bar bg-info"
                          style={{ width: `${progressToNext}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
};

export default RecoveryChecklist;
