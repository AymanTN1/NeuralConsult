import React, { useEffect, useState } from "react";
import api from "../services/api";

const Plan = () => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const loadPlan = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/sevrage-plan/current");
      setPlan(data);
    } catch (err) {
      setPlan(null);
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
    <div className="app-page">
      <section className="dashboard-command">
        <div className="dashboard-command-copy">
          <div className="hero-kicker">Therapeutic pathway</div>
          <h2 className="dashboard-title">Le plan doit paraitre prescrit, pas simplement affiche.</h2>
          <p className="muted-text">
            Cette zone regroupe l'intensite, la strategie NRT, les recommandations comportementales et le protocole anti-rechute.
          </p>
        </div>

        <div className="dashboard-command-actions">
          <button className="btn btn-dark" onClick={generatePlan}>
            <i className="bi bi-stars me-1" />
            Generer
          </button>
        </div>
      </section>

      {message && <div className="alert alert-success">{message}</div>}
      {loading && <div className="alert alert-info">Chargement du plan clinique...</div>}
      {!loading && !plan && <div className="alert alert-warning">Aucun plan disponible. Cliquez sur Generer.</div>}

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
