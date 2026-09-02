import React, { useEffect, useState } from "react";
import api from "../services/api";

const Plan = () => {
  const [plan, setPlan] = useState(null);
  const [clinical, setClinical] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const loadPlan = async () => {
    setLoading(true);
    try {
      const [planResp, clinicalResp] = await Promise.allSettled([
        api.get("/api/sevrage-plan/current"),
        api.get("/api/clinical-intelligence")
      ]);
      setPlan(planResp.status === "fulfilled" ? planResp.value.data : null);
      let clinicalData = clinicalResp.status === "fulfilled" ? clinicalResp.value.data : null;
      if (!clinicalData) {
        try {
          const generated = await api.post("/api/clinical-intelligence/generate");
          clinicalData = generated.data;
        } catch (error) {
          clinicalData = null;
        }
      }
      setClinical(clinicalData);
    } catch (err) {
      setPlan(null);
      setClinical(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const generatePlan = async () => {
    setMessage(null);
    const { data } = await api.post("/api/sevrage-plan/generate");
    setPlan(data);
    setMessage("Le plan a ete regenere avec succes.");
  };

  return (
    <div className="app-page" data-guide-id="plan-main">
      <section className="dashboard-command nc-glass-card p-4 mb-4" data-guide-id="plan-header">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="dashboard-command-copy">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="pulse-dot-live" />
              <span className="nc-badge-pill bg-primary-subtle text-primary border border-primary-subtle">
                Protocole Clinique Personnalisé
              </span>
            </div>
            <h2 className="dashboard-title mb-1 fw-bold">Feuille de Route Thérapeutique</h2>
            <p className="muted-text mb-0">
              Stratégie de substitution nicotinique (TNS), étapes comportementales et plan d'urgence anti-rechute.
            </p>
          </div>

          <div className="dashboard-command-actions">
            <button className="btn btn-primary-gradient" onClick={generatePlan}>
              <i className="bi bi-stars me-2" />
              Régénérer le Plan IA
            </button>
          </div>
        </div>
      </section>

      {message && <div className="alert alert-success">{message}</div>}
      {loading && <div className="alert alert-info">Chargement du plan clinique...</div>}
      {!loading && !plan && <div className="alert alert-warning">Aucun plan disponible. Cliquez sur Generer.</div>}

      {(clinical?.phaseSummaries || []).length > 0 && (
        <section className="milestone-stack">
          <div className="chart-card-head">
            <div>
              <div className="hero-kicker">Synthese par phase</div>
              <h3>Resumes IA du dossier</h3>
            </div>
          </div>
          {clinical?.globalSummary?.summary && (
            <div className="doctor-note-critical mt-3">{clinical.globalSummary.summary}</div>
          )}
          <div className="doctor-plan-stack mt-3">
            {clinical.phaseSummaries.map((phase) => (
              <div className="doctor-plan-card" key={phase.id}>
                <div className="doctor-plan-card-head">
                  <div>
                    <span className="profile-data-label">Phase {phase.phaseId}</span>
                    <strong>{phase.phaseTitle}</strong>
                  </div>
                  <span className="doctor-status-chip status-accepted">IA</span>
                </div>
                <p>{phase.summary}</p>
                {(phase.attentionPoints || []).length > 0 && (
                  <div className="doctor-focus-list">
                    {phase.attentionPoints.map((item) => (
                      <span key={item} className="evaluation-goal-chip">{item}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {plan && (
        <>
          <section className="life-gain-panel">
            <div className="life-gain-main">
              <span className="life-gain-label">Active Track</span>
              <strong>{plan.intensity || "Plan"}</strong>
              <p>{plan.summary}</p>
            </div>

            <div className="life-gain-side">
              <div className="life-gain-card">
                <span>Date cible</span>
                <strong>{plan.targetQuitDate || "A definir"}</strong>
                <p>Le point d'atterrissage therapeutique du plan de sevrage.</p>
              </div>
              <div className="life-gain-card">
                <span>Demarrage</span>
                <strong>{plan.startDate || "En attente"}</strong>
                <p>Le protocole devient respirant a partir de cette date.</p>
              </div>
              <div className="life-gain-card">
                <span>Orientation</span>
                <strong>{plan.intensity || "Medium"}</strong>
                <p>Lecture rapide du niveau d'intensite pour le soignant.</p>
              </div>
            </div>
          </section>

          <section className="dashboard-support-grid">
            <article className="chart-card">
              <div className="chart-card-head">
                <div>
                  <div className="hero-kicker">Substitution</div>
                  <h3>NRT Recommendation</h3>
                </div>
              </div>
              <p className="muted-text">{plan.nrtRecommendation}</p>
            </article>

            <article className="chart-card">
              <div className="chart-card-head">
                <div>
                  <div className="hero-kicker">Behavior</div>
                  <h3>Behavioral Support</h3>
                </div>
              </div>
              <p className="muted-text">{plan.behavioralRecommendations}</p>
            </article>

            <article className="chart-card">
              <div className="chart-card-head">
                <div>
                  <div className="hero-kicker">Follow-up</div>
                  <h3>Clinical Follow-Up</h3>
                </div>
              </div>
              <p className="muted-text">{plan.followUpPlan}</p>
            </article>

            <article className="chart-card">
              <div className="chart-card-head">
                <div>
                  <div className="hero-kicker">Relapse shield</div>
                  <h3>Emergency Protocol</h3>
                </div>
              </div>
              <p className="muted-text">{plan.relapseProtocol}</p>
            </article>
          </section>

          {plan.steps && plan.steps.length > 0 && (
            <section className="milestone-stack">
              <div className="chart-card-head">
                <div>
                  <div className="hero-kicker">Execution steps</div>
                  <h3>Sequence de mise en oeuvre</h3>
                </div>
              </div>

              <div className="milestone-list">
                {plan.steps.map((step, index) => (
                  <div className="milestone-item is-done" key={`${index}-${step}`}>
                    <span className="milestone-bullet">
                      <i className="bi bi-check2" />
                    </span>
                    <div>
                      <strong>Etape {index + 1}</strong>
                      <p>{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Plan;
