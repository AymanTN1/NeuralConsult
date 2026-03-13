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
    setMessage("Plan genere.");
  };

  return (
    <div className="container py-4 app-shell">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="fw-bold mb-0">Plan de sevrage</h2>
          <p className="muted-text mb-0">Synthese clinique et recommandations.</p>
        </div>
        <button className="btn btn-dark" onClick={generatePlan}>
          <i className="bi bi-lightning-charge me-1" /> Generer
        </button>
      </div>
      {message && <div className="alert alert-success">{message}</div>}
      {loading && <div className="text-muted">Chargement...</div>}
      {!loading && !plan && (
        <div className="alert alert-warning">Aucun plan disponible. Cliquez sur Generer.</div>
      )}
      {plan && (
        <div className="card form-card p-3">
          <div className="card-body">
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
              <div>
                <h5 className="card-title mb-1">
                  {plan.intensity || "Plan"}{" "}
                  <span className="badge text-bg-dark ms-2">{plan.intensity}</span>
                </h5>
                <p className="muted-text mb-2">Date cible: {plan.targetQuitDate || "A definir"}</p>
              </div>
            </div>
            <p className="mt-2">{plan.summary}</p>
            <div className="row g-3 mt-2">
              <div className="col-12 col-md-6">
                <div className="metric-card h-100">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-bandaid" />
                    <h6 className="mb-0">NRT</h6>
                  </div>
                  <p className="mb-0">{plan.nrtRecommendation}</p>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="metric-card h-100">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-person-check" />
                    <h6 className="mb-0">Comportement</h6>
                  </div>
                  <p className="mb-0">{plan.behavioralRecommendations}</p>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="metric-card h-100">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-calendar-check" />
                    <h6 className="mb-0">Suivi</h6>
                  </div>
                  <p className="mb-0">{plan.followUpPlan}</p>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="metric-card h-100">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-exclamation-triangle" />
                    <h6 className="mb-0">Protocole rechute</h6>
                  </div>
                  <p className="mb-0">{plan.relapseProtocol}</p>
                </div>
              </div>
            </div>
            {plan.steps && plan.steps.length > 0 && (
              <div className="mt-4">
                <h6 className="fw-semibold">Etapes</h6>
                <ul className="list-group list-group-flush">
                  {plan.steps.map((step, idx) => (
                    <li className="list-group-item" key={`${idx}-${step}`}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Plan;
