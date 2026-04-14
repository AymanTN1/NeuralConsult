import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { isDoctor } from "../utils/roles";

const riskCopy = {
  LOW: "Faible",
  MODERATE: "Modere",
  HIGH: "Eleve",
  CRITICAL: "Critique"
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const Support = () => {
  const { user } = useAuth();
  const doctorMode = isDoctor(user);
  const [conversation, setConversation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPatientSupport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/support/current");
      setConversation(data);
    } catch (error) {
      setConversation(null);
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorSupport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/support/doctor/alerts");
      setAlerts(data || []);
      const fallbackPatientId = selectedPatientId || data?.[0]?.patientProfileId || null;
      setSelectedPatientId(fallbackPatientId);
      if (fallbackPatientId) {
        const conversationResp = await api.get(`/api/support/doctor/patients/${fallbackPatientId}`);
        setConversation(conversationResp.data);
      } else {
        setConversation(null);
      }
    } catch (error) {
      setAlerts([]);
      setConversation(null);
    } finally {
      setLoading(false);
    }
  };

  const reload = async () => {
    if (doctorMode) {
      await loadDoctorSupport();
    } else {
      await loadPatientSupport();
    }
  };

  useEffect(() => {
    reload();
  }, [doctorMode]);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setMessage(null);
    try {
      const { data } = await api.post("/api/support/current/messages", { message: draft.trim() });
      setConversation(data);
      setDraft("");
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Impossible d'envoyer le message a l'IA." });
    }
  };

  const acknowledgeAlert = async (alertId) => {
    setMessage(null);
    try {
      await api.post(`/api/support/doctor/alerts/${alertId}/acknowledge`);
      await loadDoctorSupport();
      setMessage({ type: "success", text: "Alerte medecin accusee. Le dossier peut maintenant etre traite." });
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Impossible d'accuser l'alerte." });
    }
  };

  return (
      <div className="container py-4 app-shell" data-guide-id="support-main">
        <div className="profile-page-header" data-guide-id="support-header">
        <div>
          <div className="hero-kicker">Soutien 24/7</div>
          <h2 className="fw-bold mb-1">{doctorMode ? "Alertes et conversations IA" : "Psychologue IA disponible a tout moment"}</h2>
          <p className="muted-text mb-0">
            {doctorMode
              ? "Le medecin consulte les echanges IA, comprend le contexte psychologique et peut prioriser les alertes critiques."
              : "Le patient peut parler avec l'assistant a tout moment. Les signaux a risque sont traces pour le medecin si la situation l'exige."}
          </p>
        </div>
      </div>

      {message && <div className={`alert mt-3 ${message.type === "error" ? "alert-danger" : "alert-success"}`}>{message.text}</div>}

      <div className="doctor-workspace-grid mt-4">
        <div className="doctor-workspace-main">
          <section className="card form-card">
            <div className="section-title-sm">Vue synthese</div>
            {loading ? (
              <p className="muted-text mb-0 mt-3">Chargement du soutien IA...</p>
            ) : (
              <div className="doctor-summary-strip mt-3">
                <div className="doctor-summary-card"><span className="profile-data-label">Risque courant</span><strong>{riskCopy[conversation?.latestRiskLevel] || "Faible"}</strong></div>
                <div className="doctor-summary-card"><span className="profile-data-label">Alertes</span><strong>{doctorMode ? alerts.length : conversation?.alerts?.length || 0}</strong></div>
                <div className="doctor-summary-card"><span className="profile-data-label">Medecin lie</span><strong>{conversation?.doctorName || "Aucun pour l'instant"}</strong></div>
                <div className="doctor-summary-card"><span className="profile-data-label">Resume</span><strong>{conversation?.latestSummary || "Echange non demarre"}</strong></div>
              </div>
            )}
          </section>

          {doctorMode && (
            <section className="card form-card mt-4">
              <div className="section-title-sm">Alertes medecin</div>
              {alerts.length === 0 ? (
                <p className="muted-text mb-0 mt-3">Aucune alerte ouverte pour le moment.</p>
              ) : (
                <div className="doctor-request-stack mt-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="doctor-request-card">
                      <div className="doctor-request-card-head">
                        <div>
                          <strong>{alert.patientName}</strong>
                          <p className="mb-0 muted-text">{alert.title} · niveau {riskCopy[alert.level] || alert.level}</p>
                        </div>
                        <span className={`doctor-status-chip status-${String(alert.status || "OPEN").toLowerCase()}`}>{alert.status}</span>
                      </div>
                      <p className="muted-text">{alert.summary}</p>
                      <div className="doctor-card-actions">
                        <button type="button" className="btn btn-outline-dark" onClick={async () => {
                          setSelectedPatientId(alert.patientProfileId);
                          const { data } = await api.get(`/api/support/doctor/patients/${alert.patientProfileId}`);
                          setConversation(data);
                        }}>
                          Ouvrir la conversation
                        </button>
                        {alert.status === "OPEN" && (
                          <button type="button" className="btn btn-dark" onClick={() => acknowledgeAlert(alert.id)}>
                            Accuser l'alerte
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="doctor-dossier-panel">
          <section className="card form-card">
            <div className="section-title-sm">Conversation</div>
            {!conversation ? (
              <p className="muted-text mb-0 mt-3">Aucune conversation disponible pour le moment.</p>
            ) : (
              <>
                <div className="doctor-dossier-section mt-3">
                  <strong>{doctorMode ? "Lecture conversationnelle cote medecin" : "Espace de parole continu"}</strong>
                  <p className="muted-text mb-0">{conversation.latestSummary || "L'IA garde un fil conducteur clinique a chaque echange."}</p>
                </div>
                <div className="support-thread mt-3">
                  {(conversation.messages || []).map((item) => (
                    <div key={item.id} className={`support-bubble ${item.senderType === "PATIENT" ? "is-patient" : item.senderType === "AI" ? "is-ai" : "is-system"}`}>
                      <span className="profile-data-label">{item.senderType}</span>
                      <p className="mb-0">{item.content}</p>
                      <small>{formatDateTime(item.createdAt)}</small>
                    </div>
                  ))}
                </div>

                {!doctorMode && (
                  <form className="mt-3" onSubmit={sendMessage}>
                    <label className="form-label">Parle librement avec l'IA</label>
                    <textarea className="form-control" rows="4" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Explique ce qui te pese maintenant: craving, stress, peur de rechuter, sommeil, anxiete..." />
                    <div className="doctor-card-actions mt-3">
                      <button type="submit" className="btn btn-dark">Envoyer</button>
                    </div>
                  </form>
                )}
              </>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default Support;
