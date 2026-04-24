import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";

const REACTIONS = [
  { type: "LIKE", label: "J'aime", icon: "bi-hand-thumbs-up" },
  { type: "LOVE", label: "J'adore", icon: "bi-heart" },
  { type: "SUPPORT", label: "Force", icon: "bi-shield-check" },
  { type: "LAUGH", label: "Haha", icon: "bi-emoji-smile" },
  { type: "ANGRY", label: "Grr", icon: "bi-emoji-angry" }
];

const emptyOverview = {
  posts: [],
  circles: [],
  people: [],
  pendingInvitations: [],
  friends: [],
  conversations: []
};

const formatDate = (value) => {
  if (!value) return "maintenant";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
};

const reactionTotal = (post) => Object.values(post?.reactions || {}).reduce((sum, value) => sum + Number(value || 0), 0);

const Communities = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [overview, setOverview] = useState(emptyOverview);
  const [postForm, setPostForm] = useState({ content: "", serverId: "" });
  const [circleForm, setCircleForm] = useState({ name: "", description: "" });
  const [commentDrafts, setCommentDrafts] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState("");

  const joinedCircles = useMemo(() => (overview.circles || []).filter((circle) => circle.joined), [overview.circles]);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/communities/social");
      setOverview(data || emptyOverview);
    } catch (error) {
      setOverview(emptyOverview);
      setFeedback({ type: "error", text: "Impossible de charger le fil communautaire." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    const chatId = searchParams.get("chat");
    if (!chatId) {
      return;
    }

    const candidate = (overview.conversations || []).find((item) => item.counterpartId === chatId)
      || (overview.friends || []).find((item) => item.id === chatId)
      || (overview.people || []).find((item) => item.id === chatId);

    if (!candidate) {
      return;
    }

    openChat(candidate);
    const next = new URLSearchParams(searchParams);
    next.delete("chat");
    setSearchParams(next, { replace: true });
  }, [overview, searchParams, setSearchParams]);

  const createPost = async (event) => {
    event.preventDefault();
    if (!postForm.content.trim()) return;
    setFeedback(null);
    try {
      await api.post("/api/communities/social/posts", {
        content: postForm.content.trim(),
        serverId: postForm.serverId || null
      });
      setPostForm({ content: "", serverId: "" });
      await loadOverview();
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setFeedback({ type: "error", text: apiError || "Impossible de publier le post." });
    }
  };

  const reactToPost = async (postId, type) => {
    try {
      await api.post(`/api/communities/social/posts/${postId}/reactions`, { type });
      await loadOverview();
    } catch (error) {
      setFeedback({ type: "error", text: "Impossible d'ajouter la reaction." });
    }
  };

  const commentOnPost = async (postId) => {
    const content = commentDrafts[postId]?.trim();
    if (!content) return;
    try {
      await api.post(`/api/communities/social/posts/${postId}/comments`, { content });
      setCommentDrafts((previous) => ({ ...previous, [postId]: "" }));
      await loadOverview();
    } catch (error) {
      setFeedback({ type: "error", text: "Impossible d'ajouter le commentaire." });
    }
  };

  const createCircle = async (event) => {
    event.preventDefault();
    if (!circleForm.name.trim()) return;
    try {
      await api.post("/api/communities/servers", circleForm);
      setCircleForm({ name: "", description: "" });
      await loadOverview();
    } catch (error) {
      setFeedback({ type: "error", text: "Impossible de creer ce cercle." });
    }
  };

  const joinCircle = async (circleId) => {
    try {
      await api.post(`/api/communities/servers/${circleId}/join`);
      await loadOverview();
    } catch (error) {
      setFeedback({ type: "error", text: "Impossible de rejoindre ce cercle." });
    }
  };

  const followUser = async (userId) => {
    try {
      await api.post(`/api/communities/social/users/${userId}/follow`);
      await loadOverview();
    } catch (error) {
      setFeedback({ type: "error", text: "Impossible de modifier le suivi." });
    }
  };

  const connectUser = async (userId) => {
    try {
      await api.post(`/api/communities/social/users/${userId}/connections`);
      await loadOverview();
    } catch (error) {
      setFeedback({ type: "error", text: "Impossible d'envoyer l'invitation." });
    }
  };

  const answerInvitation = async (connectionId, action) => {
    try {
      await api.post(`/api/communities/social/connections/${connectionId}/${action}`);
      await loadOverview();
    } catch (error) {
      setFeedback({ type: "error", text: "Impossible de traiter cette invitation." });
    }
  };

  const openChat = async (person) => {
    setActiveChat(person);
    setChatMessages([]);
    try {
      const { data } = await api.get(`/api/communities/social/direct/${person.id || person.counterpartId}`);
      setChatMessages(data || []);
      await loadOverview();
    } catch (error) {
      setFeedback({ type: "error", text: "Impossible d'ouvrir la discussion. Il faut etre amis." });
    }
  };

  const sendChatMessage = async (event) => {
    event.preventDefault();
    const counterpartId = activeChat?.id || activeChat?.counterpartId;
    if (!counterpartId || !chatDraft.trim()) return;
    try {
      await api.post(`/api/communities/social/direct/${counterpartId}`, { content: chatDraft.trim() });
      setChatDraft("");
      const { data } = await api.get(`/api/communities/social/direct/${counterpartId}`);
      setChatMessages(data || []);
      await loadOverview();
    } catch (error) {
      setFeedback({ type: "error", text: "Impossible d'envoyer le message." });
    }
  };

  return (
    <div className="container py-4 app-shell community-social" data-guide-id="communities-main">
      <div className="profile-page-header community-social-header" data-guide-id="communities-header">
        <div>
          <div className="hero-kicker">Communautes patients</div>
          <h2 className="fw-bold mb-1">Fil social de soutien et histoires de sevrage</h2>
          <p className="muted-text mb-0">
            Une experience simple inspiree de LinkedIn, X et Reddit: publier, reagir, commenter, suivre, inviter et discuter.
          </p>
        </div>
      </div>

      {feedback && <div className={`alert ${feedback.type === "error" ? "alert-danger" : "alert-success"}`}>{feedback.text}</div>}

      <div className="community-social-grid">
        <aside className="community-left-rail">
          <section className="community-panel community-profile-card">
            <div className="section-title-sm">Demarrer doucement</div>
            <p className="muted-text mb-0">
              Partage une victoire, une difficulte ou une question. Les patients et medecins peuvent repondre pour soutenir le parcours.
            </p>
          </section>

          <section className="community-panel">
            <div className="section-title-sm">Cercles thematiques</div>
            <form className="community-circle-form" onSubmit={createCircle}>
              <input className="form-control" placeholder="Nom du cercle" value={circleForm.name} onChange={(event) => setCircleForm((previous) => ({ ...previous, name: event.target.value }))} />
              <textarea className="form-control" rows="2" placeholder="Objectif du cercle" value={circleForm.description} onChange={(event) => setCircleForm((previous) => ({ ...previous, description: event.target.value }))} />
              <button className="btn btn-dark w-100" type="submit">Creer</button>
            </form>
            <div className="community-circle-list">
              {(overview.circles || []).slice(0, 6).map((circle) => (
                <div key={circle.id} className="community-circle-item">
                  <div>
                    <strong>{circle.name}</strong>
                    <span>{circle.memberCount} membres</span>
                  </div>
                  {circle.joined ? (
                    <span className="community-mini-chip">rejoint</span>
                  ) : (
                    <button className="btn btn-outline-dark btn-sm" type="button" onClick={() => joinCircle(circle.id)}>Rejoindre</button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </aside>

        <main className="community-feed-column">
          <section className="community-composer-card">
            <form onSubmit={createPost}>
              <textarea
                className="form-control community-composer-input"
                rows="4"
                placeholder="Racontez une histoire, une envie de fumer evitee, un conseil, ou une difficulte du jour..."
                value={postForm.content}
                onChange={(event) => setPostForm((previous) => ({ ...previous, content: event.target.value }))}
              />
              <div className="community-composer-actions">
                <select className="form-select" value={postForm.serverId} onChange={(event) => setPostForm((previous) => ({ ...previous, serverId: event.target.value }))}>
                  <option value="">Fil general</option>
                  {joinedCircles.map((circle) => <option key={circle.id} value={circle.id}>{circle.name}</option>)}
                </select>
                <button className="btn btn-dark" type="submit">Publier</button>
              </div>
            </form>
          </section>

          {loading ? (
            <section className="community-panel"><p className="muted-text mb-0">Chargement du fil...</p></section>
          ) : (overview.posts || []).length === 0 ? (
            <section className="community-empty-feed">
              <h3>Le fil est pret.</h3>
              <p>Publie le premier temoignage: une motivation, un obstacle ou une petite victoire de sevrage.</p>
            </section>
          ) : (
            (overview.posts || []).map((post) => (
              <article key={post.id} className="community-post-card">
                <div className="community-post-head">
                  <div className="community-avatar">{post.author?.name?.slice(0, 1) || "N"}</div>
                  <div>
                    <strong>{post.author?.name}</strong>
                    <div className="muted-text community-post-meta">{post.author?.role} · {post.serverName} · {formatDate(post.createdAt)}</div>
                  </div>
                  <button className="btn btn-outline-dark btn-sm ms-auto" type="button" onClick={() => followUser(post.author.id)}>
                    {post.author.following ? "Suivi" : "Suivre"}
                  </button>
                </div>

                <p className="community-post-content">{post.content}</p>

                <div className="community-reaction-summary">
                  <span>{reactionTotal(post)} reactions</span>
                  <span>{post.comments?.length || 0} commentaires</span>
                </div>

                <div className="community-reaction-bar">
                  {REACTIONS.map((reaction) => (
                    <button
                      key={reaction.type}
                      type="button"
                      className={`community-reaction-btn ${post.myReaction === reaction.type ? "is-active" : ""}`}
                      onClick={() => reactToPost(post.id, reaction.type)}
                    >
                      <i className={`bi ${reaction.icon}`} />
                      <span>{reaction.label}</span>
                      <small>{post.reactions?.[reaction.type] || 0}</small>
                    </button>
                  ))}
                </div>

                <div className="community-comments">
                  {(post.comments || []).slice(-3).map((comment) => (
                    <div key={comment.id} className="community-comment">
                      <strong>{comment.authorName}</strong>
                      <p>{comment.content}</p>
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                  ))}
                  <div className="community-comment-composer">
                    <input
                      className="form-control"
                      placeholder="Ecrire un commentaire de soutien..."
                      value={commentDrafts[post.id] || ""}
                      onChange={(event) => setCommentDrafts((previous) => ({ ...previous, [post.id]: event.target.value }))}
                    />
                    <button className="btn btn-outline-dark" type="button" onClick={() => commentOnPost(post.id)}>Commenter</button>
                  </div>
                </div>
              </article>
            ))
          )}
        </main>

        <aside className="community-right-rail">
          <section className="community-panel">
            <div className="section-title-sm">Invitations</div>
            {(overview.pendingInvitations || []).length === 0 ? (
              <p className="muted-text mb-0">Aucune invitation en attente.</p>
            ) : (
              <div className="community-people-stack">
                {overview.pendingInvitations.map((item) => (
                  <div key={item.id} className="community-person-card">
                    <div>
                      <strong>{item.requester.name}</strong>
                      <span>{item.requester.role}</span>
                    </div>
                    <div className="community-person-actions">
                      <button className="btn btn-dark btn-sm" type="button" onClick={() => answerInvitation(item.id, "accept")}>Accepter</button>
                      <button className="btn btn-outline-dark btn-sm" type="button" onClick={() => answerInvitation(item.id, "decline")}>Refuser</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="community-panel">
            <div className="section-title-sm">Personnes a decouvrir</div>
            <div className="community-people-stack">
              {(overview.people || []).slice(0, 8).map((person) => (
                <div key={person.id} className="community-person-card">
                  <div>
                    <strong>{person.name}</strong>
                    <span>{person.role} · {person.followersCount} abonnes</span>
                  </div>
                  <div className="community-person-actions">
                    <button className="btn btn-outline-dark btn-sm" type="button" onClick={() => followUser(person.id)}>{person.following ? "Suivi" : "Suivre"}</button>
                    {person.connectionStatus === "FRIEND" ? (
                      <button className="btn btn-dark btn-sm" type="button" onClick={() => openChat(person)}>Message</button>
                    ) : person.connectionStatus === "PENDING_SENT" ? (
                      <span className="community-mini-chip">envoyee</span>
                    ) : (
                      <button className="btn btn-dark btn-sm" type="button" onClick={() => connectUser(person.id)}>Inviter</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="community-panel">
            <div className="section-title-sm">Discussions</div>
            {(overview.conversations || []).length === 0 ? (
              <p className="muted-text mb-0">Ajoute un ami pour ouvrir une discussion simple.</p>
            ) : (
              <div className="community-conversation-list">
                {overview.conversations.map((conversation) => (
                  <button key={conversation.counterpartId} type="button" className="community-conversation-card" onClick={() => openChat(conversation)}>
                    <div>
                      <strong>{conversation.counterpartName}</strong>
                      <span>{conversation.lastMessage}</span>
                    </div>
                    <small>{conversation.unreadCount > 0 ? `${conversation.unreadCount} non lus` : conversation.lastMessageStatus}</small>
                  </button>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      {activeChat && (
        <div className="community-chat-dock">
          <div className="community-chat-head">
            <div>
              <strong>{activeChat.name || activeChat.counterpartName}</strong>
              <span>{activeChat.role || activeChat.counterpartRole}</span>
            </div>
            <button type="button" onClick={() => setActiveChat(null)} aria-label="Fermer la discussion">
              <i className="bi bi-x-lg" />
            </button>
          </div>
          <div className="community-chat-messages">
            {chatMessages.length === 0 ? (
              <p className="muted-text mb-0">Demarre la discussion avec un message court et bienveillant.</p>
            ) : (
              chatMessages.map((message) => (
                <div key={message.id} className={`community-chat-bubble ${message.mine ? "is-mine" : ""}`}>
                  <p>{message.content}</p>
                  <span>{formatDate(message.createdAt)} · {message.status}</span>
                </div>
              ))
            )}
          </div>
          <form className="community-chat-form" onSubmit={sendChatMessage}>
            <input className="form-control" value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder="Ecrire un message..." />
            <button className="btn btn-dark" type="submit">Envoyer</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Communities;



