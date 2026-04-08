import React, { useEffect, useState } from "react";
import api from "../services/api";

const Communities = () => {
  const [servers, setServers] = useState([]);
  const [detail, setDetail] = useState(null);
  const [selectedServerId, setSelectedServerId] = useState(null);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [serverForm, setServerForm] = useState({ name: "", description: "" });
  const [messageForm, setMessageForm] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadServers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/communities/servers");
      setServers(data || []);
      setSelectedServerId((previous) => previous || data?.find((item) => item.joined)?.id || data?.[0]?.id || null);
    } catch (error) {
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadServerDetail = async (serverId) => {
    if (!serverId) {
      setDetail(null);
      setMessages([]);
      return;
    }
    try {
      const { data } = await api.get(`/api/communities/servers/${serverId}`);
      setDetail(data);
      const fallbackChannelId = selectedChannelId || data?.channels?.[0]?.id || null;
      setSelectedChannelId(fallbackChannelId);
      if (fallbackChannelId) {
        const messagesResp = await api.get(`/api/communities/channels/${fallbackChannelId}/messages`);
        setMessages(messagesResp.data || []);
      } else {
        setMessages(data?.latestMessages || []);
      }
    } catch (error) {
      setDetail(null);
      setMessages([]);
    }
  };

  useEffect(() => {
    loadServers();
  }, []);

  useEffect(() => {
    loadServerDetail(selectedServerId);
  }, [selectedServerId]);

  useEffect(() => {
    const loadChannelMessages = async () => {
      if (!selectedChannelId || !selectedServerId) return;
      try {
        const { data } = await api.get(`/api/communities/channels/${selectedChannelId}/messages`);
        setMessages(data || []);
      } catch (error) {
        setMessages([]);
      }
    };
    loadChannelMessages();
  }, [selectedChannelId]);

  const createServer = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      const { data } = await api.post("/api/communities/servers", serverForm);
      setServerForm({ name: "", description: "" });
      setFeedback({ type: "success", text: "Serveur cree. Vous en etes maintenant proprietaire." });
      await loadServers();
      setSelectedServerId(data.id);
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setFeedback({ type: "error", text: apiError || "Impossible de creer la communaute." });
    }
  };

  const joinServer = async (serverId) => {
    setFeedback(null);
    try {
      await api.post(`/api/communities/servers/${serverId}/join`);
      setFeedback({ type: "success", text: "Vous avez rejoint la communaute." });
      await loadServers();
      setSelectedServerId(serverId);
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setFeedback({ type: "error", text: apiError || "Impossible de rejoindre cette communaute." });
    }
  };

  const postMessage = async (event) => {
    event.preventDefault();
    if (!selectedChannelId || !messageForm.trim()) return;
    setFeedback(null);
    try {
      await api.post(`/api/communities/channels/${selectedChannelId}/messages`, { content: messageForm.trim() });
      setMessageForm("");
      const { data } = await api.get(`/api/communities/channels/${selectedChannelId}/messages`);
      setMessages(data || []);
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setFeedback({ type: "error", text: apiError || "Impossible d'envoyer le message." });
    }
  };

  return (
    <div className="container py-4 app-shell">
      <div className="profile-page-header">
        <div>
          <div className="hero-kicker">Communautes patients</div>
          <h2 className="fw-bold mb-1">Espaces d'entraide, serveurs et salons de discussion</h2>
          <p className="muted-text mb-0">
            Chaque patient peut rejoindre une communaute, participer aux echanges ou creer son propre serveur de soutien.
          </p>
        </div>
      </div>

      {feedback && <div className={`alert mt-3 ${feedback.type === "error" ? "alert-danger" : "alert-success"}`}>{feedback.text}</div>}

      <div className="doctor-workspace-grid mt-4">
        <div className="doctor-workspace-main">
          <section className="card form-card">
            <div className="section-title-sm">Creer une communaute</div>
            <form className="row g-3 mt-1" onSubmit={createServer}>
              <div className="col-12 col-md-6">
                <label className="form-label">Nom du serveur</label>
                <input className="form-control" value={serverForm.name} onChange={(event) => setServerForm((previous) => ({ ...previous, name: event.target.value }))} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Description</label>
                <input className="form-control" value={serverForm.description} onChange={(event) => setServerForm((previous) => ({ ...previous, description: event.target.value }))} />
              </div>
              <div className="col-12 d-flex justify-content-end">
                <button className="btn btn-dark" type="submit">Creer le serveur</button>
              </div>
            </form>
          </section>

          <section className="card form-card mt-4">
            <div className="section-title-sm">Serveurs disponibles</div>
            {loading ? (
              <p className="muted-text mb-0 mt-3">Chargement des communautes...</p>
            ) : servers.length === 0 ? (
              <p className="muted-text mb-0 mt-3">Aucun serveur disponible pour le moment.</p>
            ) : (
              <div className="doctor-request-stack mt-3">
                {servers.map((server) => (
                  <div key={server.id} className="doctor-request-card">
                    <div className="doctor-request-card-head">
                      <div>
                        <strong>{server.name}</strong>
                        <p className="mb-0 muted-text">{server.description || "Aucune description."}</p>
                      </div>
                      <span className="doctor-status-chip status-accepted">{server.memberCount} membres</span>
                    </div>
                    <p className="muted-text">Cree par {server.createdBy} · visibilite {server.visibility}</p>
                    <div className="doctor-card-actions">
                      <button type="button" className="btn btn-outline-dark" onClick={() => setSelectedServerId(server.id)}>Ouvrir</button>
                      {!server.joined && <button type="button" className="btn btn-dark" onClick={() => joinServer(server.id)}>Rejoindre</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="doctor-dossier-panel">
          <section className="card form-card">
            <div className="section-title-sm">Salon actif</div>
            {!detail ? (
              <p className="muted-text mb-0 mt-3">Selectionne un serveur pour voir les salons et les messages.</p>
            ) : (
              <>
                <div className="doctor-dossier-section mt-3">
                  <strong>{detail.server.name}</strong>
                  <p className="muted-text mb-0">{detail.server.description || "Serveur d'entraide clinique et communautaire."}</p>
                </div>
                <div className="doctor-focus-list mt-3">
                  {(detail.channels || []).map((channel) => (
                    <button key={channel.id} type="button" className={`evaluation-goal-chip ${selectedChannelId === channel.id ? "is-active" : ""}`} onClick={() => setSelectedChannelId(channel.id)}>
                      #{channel.name}
                    </button>
                  ))}
                </div>
                <div className="support-thread mt-3">
                  {messages.length === 0 ? (
                    <p className="muted-text mb-0">Aucun message dans ce salon.</p>
                  ) : (
                    messages.map((item) => (
                      <div key={item.id} className="support-bubble is-ai">
                        <span className="profile-data-label">{item.authorName}</span>
                        <p className="mb-0">{item.content}</p>
                      </div>
                    ))
                  )}
                </div>
                {detail.server.joined && selectedChannelId && (
                  <form className="mt-3" onSubmit={postMessage}>
                    <label className="form-label">Ecrire dans le salon</label>
                    <textarea className="form-control" rows="3" value={messageForm} onChange={(event) => setMessageForm(event.target.value)} placeholder="Partager une victoire, une rechute evitee, une difficulte ou une question..." />
                    <div className="doctor-card-actions mt-3">
                      <button type="submit" className="btn btn-dark">Publier</button>
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

export default Communities;
