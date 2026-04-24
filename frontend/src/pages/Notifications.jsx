import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const typeCopy = {
  APPOINTMENT: "Rendez-vous",
  REMINDER: "Rappel",
  AI_ALERT: "Alerte IA",
  SUPPORT: "Soutien",
  COMMUNITY: "Communaute",
  GENERAL: "Information"
};

const statusCopy = {
  UNREAD: "Non lue",
  READ: "Lue",
  ARCHIVED: "Archivee"
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/notifications");
      setNotifications(data || []);
    } catch (error) {
      setNotifications([]);
      setMessage({ type: "error", text: "Impossible de charger la boite de notifications." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (notificationId) => {
    try {
      await api.post(`/api/notifications/${notificationId}/read`);
      setNotifications((previous) => previous.map((item) => (
        item.id === notificationId ? { ...item, status: "READ", readAt: new Date().toISOString() } : item
      )));
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setMessage({ type: "error", text: apiError || "Impossible de marquer cette notification comme lue." });
    }
  };

  const openNotification = async (notification) => {
    await markRead(notification.id);
    if (notification.actionPath) {
      navigate(notification.actionPath);
    }
  };

  return (
    <div className="container py-4 app-shell">
      <div className="profile-page-header">
        <div>
          <div className="hero-kicker">Boite de notifications</div>
          <h2 className="fw-bold mb-1">Messages cliniques, rappels et alertes</h2>
          <p className="muted-text mb-0">
            Ici, le patient et le medecin retrouvent les confirmations de rendez-vous, les rappels journal/tests et les alertes importantes.
          </p>
        </div>
      </div>

      {message && (
        <div className={`floating-feedback-toast ${message.type === "error" ? "is-error" : "is-success"}`}>
          <div>
            <strong>{message.type === "error" ? "Action non terminee" : "Action confirmee"}</strong>
            <p className="mb-0">{message.text}</p>
          </div>
          <button type="button" className="btn btn-link btn-sm" onClick={() => setMessage(null)}>Fermer</button>
        </div>
      )}

      <section className="card form-card mt-4">
        <div className="section-title-sm">Boite de reception</div>
        {loading ? (
          <p className="muted-text mt-3 mb-0">Chargement des notifications...</p>
        ) : notifications.length === 0 ? (
          <div className="doctor-dossier-empty-state mt-3">
            <p className="mb-0">Aucune notification pour le moment.</p>
          </div>
        ) : (
          <div className="doctor-table-shell mt-3">
            <table className="table table-borderless align-middle doctor-table appointment-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Titre</th>
                  <th>Message</th>
                  <th>Etat</th>
                  <th>Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  <tr key={notification.id} className={notification.status === "UNREAD" ? "notification-row-unread" : ""}>
                    <td><strong>{typeCopy[notification.type] || notification.type}</strong></td>
                    <td>{notification.title}</td>
                    <td className="appointment-cell-copy">{notification.content}</td>
                    <td>
                      <span className={`doctor-status-chip status-${String(notification.status || "UNREAD").toLowerCase()}`}>
                        {statusCopy[notification.status] || notification.status}
                      </span>
                    </td>
                    <td>{formatDateTime(notification.createdAt)}</td>
                    <td>
                      <div className="appointment-action-column appointment-action-column-right">
                        {notification.status === "UNREAD" && (
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => markRead(notification.id)}>
                            Marquer lue
                          </button>
                        )}
                        {notification.actionPath && (
                          <button type="button" className="btn btn-success btn-sm" onClick={() => openNotification(notification)}>
                            {notification.actionLabel || "Ouvrir"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Notifications;
