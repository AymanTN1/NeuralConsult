import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";

const emptyOverview = {
  viewer: null,
  posts: [],
  circles: [],
  people: [],
  pendingInvitations: [],
  friends: [],
  conversations: [],
  activity: []
};

const sectionItems = [
  { key: "feed", label: "Pour vous", icon: "bi-house-heart" },
  { key: "explore", label: "Explorer", icon: "bi-search-heart" },
  { key: "activity", label: "Activite", icon: "bi-bell" },
  { key: "messages", label: "Messages", icon: "bi-chat-dots" },
  { key: "profile", label: "Mon profil", icon: "bi-person-badge" }
];

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

const formatLongDate = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
};

const totalReactions = (post) => Object.values(post?.reactions || {}).reduce((sum, value) => sum + Number(value || 0), 0);
const loveCount = (post) => Number(post?.reactions?.LOVE || 0);

const userLabel = (user) => user?.name || (user?.username ? `@${user.username}` : "Membre NeuralConsult");

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Impossible de lire cette image."));
    reader.readAsDataURL(file);
  });

const avatarFallback = (value) => {
  if (!value) return "NC";
  return value
    .replace("@", "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "NC";
};

const Communities = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [overview, setOverview] = useState(emptyOverview);
  const [activeSection, setActiveSection] = useState("feed");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [composer, setComposer] = useState({ content: "", serverId: "", imageUrl: "" });
  const [profileForm, setProfileForm] = useState({ username: "", profilePhotoUrl: "", bio: "" });
  const [shareDraft, setShareDraft] = useState({ postId: "", counterpartId: "", message: "" });
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [chatDraft, setChatDraft] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [exploreQuery, setExploreQuery] = useState("");
  const deferredQuery = useDeferredValue(exploreQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  const viewer = overview.viewer;
  const myPosts = useMemo(
    () => (overview.posts || []).filter((post) => post.author?.id === viewer?.userId),
    [overview.posts, viewer]
  );

  const unresolvedInvitations = overview.pendingInvitations || [];
  const conversations = overview.conversations || [];
  const friends = overview.friends || [];
  const discoverPeople = deferredQuery.trim() ? searchResults : overview.people || [];

  const setToast = (type, text) => setFeedback({ type, text });

  const loadOverview = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/communities/social");
      setOverview(data || emptyOverview);
      if (data?.viewer) {
        setProfileForm({
          username: data.viewer.username || "",
          profilePhotoUrl: data.viewer.profilePhotoUrl || "",
          bio: data.viewer.bio || ""
        });
        setShowProfileSetup(!data.viewer.profileCompleted);
      }
    } catch (error) {
      setOverview(emptyOverview);
      setToast("error", "Impossible de charger l'espace communaute.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    const targetChat = searchParams.get("chat");
    if (!targetChat) {
      return;
    }
    const candidate = conversations.find((item) => item.counterpartId === targetChat) || friends.find((item) => item.id === targetChat);
    if (!candidate) {
      return;
    }
    openConversation(candidate);
    const next = new URLSearchParams(searchParams);
    next.delete("chat");
    setSearchParams(next, { replace: true });
  }, [conversations, friends, searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    const query = deferredQuery.trim();
    if (!query) {
      setSearchResults([]);
      return undefined;
    }

    const load = async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/api/communities/social/search?query=${encodeURIComponent(query)}`);
        if (!cancelled) {
          setSearchResults(data || []);
        }
      } catch (error) {
        if (!cancelled) {
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [deferredQuery]);

  const saveProfile = async (event) => {
    event?.preventDefault();
    setSavingProfile(true);
    try {
      await api.put("/api/communities/social/profile", profileForm);
      setShowProfileSetup(false);
      await loadOverview();
      setToast("success", "Profil communautaire mis a jour.");
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setToast("error", apiError || "Impossible d'enregistrer ce profil communautaire.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleProfilePhoto = async (event, target = "profile") => {
    try {
      const file = event.target.files?.[0];
      const dataUrl = await readFileAsDataUrl(file);
      if (!dataUrl) return;
      if (dataUrl.length > 1_800_000) {
        setToast("error", "L'image est trop lourde. Choisis une photo plus legere.");
        return;
      }
      if (target === "profile") {
        setProfileForm((previous) => ({ ...previous, profilePhotoUrl: dataUrl }));
      } else {
        setComposer((previous) => ({ ...previous, imageUrl: dataUrl }));
      }
    } catch (error) {
      setToast("error", "Impossible de charger cette image.");
    } finally {
      event.target.value = "";
    }
  };

  const publishPost = async (event) => {
    event.preventDefault();
    setPublishing(true);
    try {
      await api.post("/api/communities/social/posts", {
        content: composer.content,
        serverId: composer.serverId || null,
        imageUrl: composer.imageUrl || null
      });
      setComposer({ content: "", serverId: "", imageUrl: "" });
      await loadOverview();
      setToast("success", "Post publie dans la communaute.");
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setToast("error", apiError || "Impossible de publier ce post.");
    } finally {
      setPublishing(false);
    }
  };

  const toggleLove = async (postId) => {
    try {
      await api.post(`/api/communities/social/posts/${postId}/reactions`, { type: "LOVE" });
      await loadOverview();
    } catch (error) {
      setToast("error", "Impossible de mettre a jour le coeur.");
    }
  };

  const toggleComments = (postId) => {
    setCommentsOpen((previous) => ({ ...previous, [postId]: !previous[postId] }));
  };

  const commentOnPost = async (postId) => {
    const content = (commentDrafts[postId] || "").trim();
    if (!content) return;
    try {
      await api.post(`/api/communities/social/posts/${postId}/comments`, { content });
      setCommentDrafts((previous) => ({ ...previous, [postId]: "" }));
      setCommentsOpen((previous) => ({ ...previous, [postId]: true }));
      await loadOverview();
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setToast("error", apiError || "Impossible d'ajouter ce commentaire.");
    }
  };

  const toggleFollow = async (userId) => {
    try {
      await api.post(`/api/communities/social/users/${userId}/follow`);
      await loadOverview();
      if (selectedProfile?.user?.id === userId) {
        await openProfile(userId);
      }
    } catch (error) {
      setToast("error", "Impossible de modifier le suivi.");
    }
  };

  const sendInvitation = async (userId) => {
    try {
      await api.post(`/api/communities/social/users/${userId}/connections`);
      await loadOverview();
      if (selectedProfile?.user?.id === userId) {
        await openProfile(userId);
      }
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setToast("error", apiError || "Impossible d'envoyer cette invitation.");
    }
  };

  const answerInvitation = async (connectionId, action) => {
    try {
      await api.post(`/api/communities/social/connections/${connectionId}/${action}`);
      await loadOverview();
      setToast("success", action === "accept" ? "Invitation acceptee." : "Invitation refusee.");
    } catch (error) {
      setToast("error", "Impossible de traiter cette invitation.");
    }
  };

  const openConversation = async (person) => {
    const counterpartId = person.counterpartId || person.id;
    setActiveSection("messages");
    setActiveChat(person);
    setMessageLoading(true);
    try {
      const { data } = await api.get(`/api/communities/social/direct/${counterpartId}`);
      setChatMessages(data || []);
      await loadOverview();
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setToast("error", apiError || "Impossible d'ouvrir cette discussion.");
    } finally {
      setMessageLoading(false);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const counterpartId = activeChat?.counterpartId || activeChat?.id;
    if (!counterpartId || !chatDraft.trim()) return;
    try {
      await api.post(`/api/communities/social/direct/${counterpartId}`, { content: chatDraft.trim() });
      setChatDraft("");
      const { data } = await api.get(`/api/communities/social/direct/${counterpartId}`);
      setChatMessages(data || []);
      await loadOverview();
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setToast("error", apiError || "Impossible d'envoyer ce message.");
    }
  };

  const openProfile = async (userId) => {
    setProfileLoading(true);
    try {
      const { data } = await api.get(`/api/communities/social/users/${userId}`);
      setSelectedProfile(data);
    } catch (error) {
      setToast("error", "Impossible de charger ce profil.");
    } finally {
      setProfileLoading(false);
    }
  };

  const openShare = (postId) => {
    setShareDraft({ postId, counterpartId: friends[0]?.id || "", message: "" });
    setShowShareModal(true);
  };

  const submitShare = async (event) => {
    event.preventDefault();
    if (!shareDraft.postId || !shareDraft.counterpartId) return;
    try {
      await api.post(`/api/communities/social/posts/${shareDraft.postId}/share`, {
        counterpartId: shareDraft.counterpartId,
        message: shareDraft.message
      });
      setShowShareModal(false);
      setShareDraft({ postId: "", counterpartId: "", message: "" });
      await loadOverview();
      setToast("success", "Post partage avec votre ami.");
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.response?.data?.error;
      setToast("error", apiError || "Impossible de partager ce post.");
    }
  };

  const joinCircle = async (circleId) => {
    try {
      await api.post(`/api/communities/servers/${circleId}/join`);
      await loadOverview();
      setToast("success", "Cercle rejoint.");
    } catch (error) {
      setToast("error", "Impossible de rejoindre ce cercle.");
    }
  };

  const renderAvatar = (person, className = "social-space-avatar") => {
    const isVerified = person?.verifiedBadge;
    return (
      <div className="social-space-avatar-wrapper">
        {person?.profilePhotoUrl ? (
          <img className={className} src={person.profilePhotoUrl} alt={userLabel(person)} />
        ) : (
          <div className={`${className} is-fallback`}>{avatarFallback(person?.name || person?.username)}</div>
        )}
        {isVerified && <i className="bi bi-patch-check-fill social-verified-badge" title="Compte officiel"></i>}
      </div>
    );
  };

  const renderPostCard = (post) => {
    const commentsVisible = Boolean(commentsOpen[post.id]);
    return (
      <article key={post.id} className="social-space-post">
        <button type="button" className="social-space-post-head" onClick={() => openProfile(post.author.id)}>
          {renderAvatar(post.author)}
          <div className="social-space-post-meta">
            <div className="social-space-post-author-row">
              <strong>{post.author.name}</strong>
              {post.postType === "OFFICIAL_NEWS" && <span className="badge bg-primary ms-2 social-blog-badge">ARTICLE OFFICIEL</span>}
            </div>
            <span>{post.author.role} · {post.serverName} · {formatDate(post.createdAt)}</span>
          </div>
        </button>

        {post.content?.trim() && <p className="social-space-post-copy">{post.content}</p>}
        {post.imageUrl && (
          <div className="social-space-post-media">
            <img src={post.imageUrl} alt={post.content || "Publication communautaire"} />
          </div>
        )}

        {post.postType === "OFFICIAL_NEWS" && post.sourceUrl && (
          <div className="social-blog-footer">
            <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm w-100 mt-2">
              <i className="bi bi-box-arrow-up-right me-2"></i>
              Lire l'article sur {post.sourceLabel || "la source originale"}
            </a>
          </div>
        )}

        <div className="social-space-post-actions">
          <button type="button" className={`social-space-action ${post.myReaction === "LOVE" ? "is-active" : ""}`} onClick={() => toggleLove(post.id)}>
            <i className={`bi ${post.myReaction === "LOVE" ? "bi-heart-fill" : "bi-heart"}`} />
            <span>{loveCount(post)}</span>
          </button>
          <button type="button" className={`social-space-action ${commentsVisible ? "is-active" : ""}`} onClick={() => toggleComments(post.id)}>
            <i className="bi bi-chat" />
            <span>{post.comments?.length || 0}</span>
          </button>
          <button type="button" className="social-space-action" onClick={() => openShare(post.id)}>
            <i className="bi bi-send" />
            <span>Partager</span>
          </button>
          <div className="social-space-engagement">{totalReactions(post)} reactions</div>
        </div>

        {commentsVisible && (
          <div className="social-space-comments">
            {(post.comments || []).length === 0 ? (
              <p className="muted-text mb-0">Aucun commentaire pour le moment.</p>
            ) : (
              (post.comments || []).map((comment) => (
                <div key={comment.id} className="social-space-comment">
                  {renderAvatar({ profilePhotoUrl: comment.authorPhotoUrl, name: comment.authorName, username: comment.authorUsername }, "social-space-avatar social-space-avatar-sm")}
                  <div>
                    <strong>{comment.authorName}</strong>
                    <p>{comment.content}</p>
                    <span>{formatDate(comment.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
            <div className="social-space-comment-compose">
              <input
                className="form-control"
                placeholder="Ajouter un commentaire"
                value={commentDrafts[post.id] || ""}
                onChange={(event) => setCommentDrafts((previous) => ({ ...previous, [post.id]: event.target.value }))}
              />
              <button type="button" className="btn btn-dark" onClick={() => commentOnPost(post.id)}>Envoyer</button>
            </div>
          </div>
        )}
      </article>
    );
  };

  const renderFeed = () => (
    <div className="social-space-column">
      <section className="social-space-panel social-space-composer">
        <div className="social-space-panel-head">
          <div>
            <h3>Publier dans le fil</h3>
            <p>Une victoire, une photo, une pensee ou une difficulte du jour.</p>
          </div>
          <div className="social-space-circle-picker">
            <select className="form-select" value={composer.serverId} onChange={(event) => setComposer((previous) => ({ ...previous, serverId: event.target.value }))}>
              <option value="">Pour vous</option>
              {(overview.circles || []).filter((circle) => circle.joined).map((circle) => (
                <option key={circle.id} value={circle.id}>{circle.name}</option>
              ))}
            </select>
          </div>
        </div>
        <form onSubmit={publishPost}>
          <textarea
            className="form-control social-space-textarea"
            rows="4"
            placeholder="Qu'est-ce qui merite d'etre partage aujourd'hui ?"
            value={composer.content}
            onChange={(event) => setComposer((previous) => ({ ...previous, content: event.target.value }))}
          />
          {composer.imageUrl && (
            <div className="social-space-upload-preview">
              <img src={composer.imageUrl} alt="Apercu du post" />
              <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => setComposer((previous) => ({ ...previous, imageUrl: "" }))}>
                Retirer
              </button>
            </div>
          )}
          <div className="social-space-composer-row">
            <label className="social-space-upload-btn">
              <i className="bi bi-image" />
              <span>Photo</span>
              <input type="file" accept="image/*" onChange={(event) => handleProfilePhoto(event, "post")} />
            </label>
            <button type="submit" className="btn btn-primary" disabled={publishing}>
              {publishing ? "Publication..." : "Publier"}
            </button>
          </div>
        </form>
      </section>

      <section className="social-space-panel social-space-feed-header">
        <div>
          <h3>Pour vous</h3>
          <p>Les publications des profils suivis montent naturellement en premier, puis les histoires qui engagent le plus la communaute.</p>
        </div>
      </section>

      {loading ? (
        <section className="social-space-panel"><p className="muted-text mb-0">Chargement du fil...</p></section>
      ) : (overview.posts || []).length === 0 ? (
        <section className="social-space-empty">
          <h3>Le fil attend votre premiere histoire.</h3>
          <p>Publiez une photo, un petit progres ou un moment difficile pour demarrer les echanges.</p>
        </section>
      ) : (
        (overview.posts || []).map(renderPostCard)
      )}
    </div>
  );

  const renderExplore = () => (
    <div className="social-space-column">
      <section className="social-space-panel">
        <div className="social-space-panel-head">
          <div>
            <h3>Explorer la communaute</h3>
            <p>Rechercher des personnes, voir leurs profils et trouver de nouveaux espaces.</p>
          </div>
        </div>
        <div className="social-space-search-row">
          <div className="social-space-search-box">
            <i className="bi bi-search" />
            <input
              type="search"
              value={exploreQuery}
              onChange={(event) => setExploreQuery(event.target.value)}
              placeholder="Chercher un utilisateur, un username ou un email"
            />
          </div>
          <span className="social-space-search-state">{searching ? "Recherche..." : `${discoverPeople.length} profils`}</span>
        </div>
      </section>

      <section className="social-space-user-grid">
        {discoverPeople.map((person) => (
          <article key={person.id} className="social-space-user-card">
            <button type="button" className="social-space-user-head" onClick={() => openProfile(person.id)}>
              {renderAvatar(person)}
              <div>
                <strong>{person.name}</strong>
                <span>{person.username ? `@${person.username}` : person.role}</span>
              </div>
            </button>
            <p>{person.bio || "Parcours discret, mais deja present dans l'espace de soutien."}</p>
            <div className="social-space-user-stats">
              <span>{person.followersCount} abonnes</span>
              <span>{person.postsCount} posts</span>
            </div>
            <div className="social-space-user-actions">
              <button type="button" className="btn btn-outline-dark" onClick={() => toggleFollow(person.id)}>
                {person.following ? "Suivi" : "Suivre"}
              </button>
              {person.connectionStatus === "FRIEND" ? (
                <button type="button" className="btn btn-dark" onClick={() => openConversation(person)}>Message</button>
              ) : person.connectionStatus === "PENDING_SENT" ? (
                <button type="button" className="btn btn-light" disabled>Invitation envoyee</button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => sendInvitation(person.id)}>Ajouter</button>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="social-space-panel">
        <div className="social-space-panel-head">
          <div>
            <h3>Cercles thematiques</h3>
            <p>Des espaces plus calmes autour d'un besoin commun.</p>
          </div>
        </div>
        <div className="social-space-circle-grid">
          {(overview.circles || []).map((circle) => (
            <article key={circle.id} className="social-space-circle-card">
              <div>
                <strong>{circle.name}</strong>
                <span>{circle.memberCount} membres</span>
              </div>
              <p>{circle.description || "Espace de discussion et d'entraide."}</p>
              {circle.joined ? (
                <span className="social-space-mini-state">deja rejoint</span>
              ) : (
                <button type="button" className="btn btn-outline-dark" onClick={() => joinCircle(circle.id)}>Rejoindre</button>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const renderActivity = () => (
    <div className="social-space-column">
      <section className="social-space-panel">
        <div className="social-space-panel-head">
          <div>
            <h3>Activite autour de vous</h3>
            <p>Ceux qui ont commente vos posts, envoye un coeur ou demande a vous rejoindre.</p>
          </div>
        </div>
      </section>

      <section className="social-space-panel">
        <h4>Invitations a traiter</h4>
        {unresolvedInvitations.length === 0 ? (
          <p className="muted-text mb-0">Aucune invitation en attente.</p>
        ) : (
          <div className="social-space-activity-stack">
            {unresolvedInvitations.map((item) => (
              <article key={item.id} className="social-space-activity-card">
                {renderAvatar(item.requester)}
                <div className="social-space-activity-copy">
                  <strong>{item.requester.name}</strong>
                  <p>souhaite vous ajouter a son reseau de soutien</p>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <div className="social-space-activity-actions">
                  <button type="button" className="btn btn-primary" onClick={() => answerInvitation(item.id, "accept")}>Accepter</button>
                  <button type="button" className="btn btn-outline-dark" onClick={() => answerInvitation(item.id, "decline")}>Refuser</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="social-space-panel">
        <h4>Reactions et commentaires</h4>
        {(overview.activity || []).length === 0 ? (
          <p className="muted-text mb-0">Les nouvelles interactions sur vos posts apparaitront ici.</p>
        ) : (
          <div className="social-space-activity-stack">
            {(overview.activity || []).map((item) => (
              <article key={`${item.type}-${item.id}`} className="social-space-activity-card">
                {renderAvatar(item.actor)}
                <div className="social-space-activity-copy">
                  <strong>{item.actor.name}</strong>
                  <p>
                    {item.type === "COMMENT" ? "a commente votre publication" : "a laisse un coeur sur votre publication"}
                  </p>
                  <small>{item.content}</small>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <button type="button" className="btn btn-outline-dark" onClick={() => openProfile(item.actor.id)}>Voir le profil</button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderMessages = () => (
    <div className="social-space-messaging">
      <aside className="social-space-thread-list">
        <div className="social-space-panel-head">
          <div>
            <h3>Discussions</h3>
            <p>Vos amis et vos echanges prives.</p>
          </div>
        </div>
        <div className="social-space-thread-scroll">
          {conversations.length === 0 ? (
            <p className="muted-text mb-0">Ajoutez un ami pour demarrer une conversation.</p>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.counterpartId}
                type="button"
                className={`social-space-thread-card ${activeChat?.counterpartId === conversation.counterpartId ? "is-active" : ""}`}
                onClick={() => openConversation(conversation)}
              >
                {renderAvatar({ profilePhotoUrl: conversation.counterpartPhotoUrl, name: conversation.counterpartName, username: conversation.counterpartUsername }, "social-space-avatar social-space-avatar-sm")}
                <div>
                  <strong>{conversation.counterpartName}</strong>
                  <span>{conversation.lastMessage}</span>
                </div>
                {conversation.unreadCount > 0 && <small>{conversation.unreadCount}</small>}
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="social-space-thread-panel">
        {!activeChat ? (
          <div className="social-space-thread-empty">
            <h3>Choisissez une conversation</h3>
            <p>Les messages directs vivent ici avec plus d'espace pour lire et repondre tranquillement.</p>
          </div>
        ) : (
          <>
            <div className="social-space-thread-head">
              <button type="button" className="social-space-user-head is-inline" onClick={() => openProfile(activeChat.counterpartId || activeChat.id)}>
                {renderAvatar(
                  {
                    profilePhotoUrl: activeChat.counterpartPhotoUrl || activeChat.profilePhotoUrl,
                    name: activeChat.counterpartName || activeChat.name,
                    username: activeChat.counterpartUsername || activeChat.username
                  },
                  "social-space-avatar"
                )}
                <div>
                  <strong>{activeChat.counterpartName || activeChat.name}</strong>
                  <span>{activeChat.counterpartUsername ? `@${activeChat.counterpartUsername}` : activeChat.counterpartRole || activeChat.role}</span>
                </div>
              </button>
            </div>

            <div className="social-space-thread-body">
              {messageLoading ? (
                <p className="muted-text mb-0">Chargement des messages...</p>
              ) : (
                chatMessages.map((message) => (
                  <div key={message.id} className={`social-space-message-bubble ${message.mine ? "is-mine" : ""}`}>
                    {message.sharedPostId && (
                      <div className="social-space-shared-post">
                        {message.sharedPostImageUrl && <img src={message.sharedPostImageUrl} alt={message.sharedPostPreview || "Post partage"} />}
                        <div>
                          <strong>{message.sharedPostAuthorName}</strong>
                          <span>{message.sharedPostPreview}</span>
                        </div>
                      </div>
                    )}
                    {message.content && <p>{message.content}</p>}
                    <small>{formatDate(message.createdAt)} · {message.status}</small>
                  </div>
                ))
              )}
            </div>

            <form className="social-space-thread-form" onSubmit={sendMessage}>
              <input className="form-control" value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder="Ecrire un message prive" />
              <button type="submit" className="btn btn-primary">Envoyer</button>
            </form>
          </>
        )}
      </section>
    </div>
  );

  const renderProfile = () => (
    <div className="social-space-column">
      <section className="social-space-panel social-space-profile-editor">
        <div className="social-space-panel-head">
          <div>
            <h3>Votre identite communautaire</h3>
            <p>Le username est ce qui sera vu par la communaute. La photo reste optionnelle.</p>
          </div>
        </div>
        <form onSubmit={saveProfile}>
          <div className="social-space-profile-layout">
            <div className="social-space-profile-preview">
              {renderAvatar({ profilePhotoUrl: profileForm.profilePhotoUrl, name: profileForm.username || viewer?.displayName, username: profileForm.username })}
              <label className="social-space-upload-btn">
                <i className="bi bi-camera" />
                <span>Choisir une photo</span>
                <input type="file" accept="image/*" onChange={(event) => handleProfilePhoto(event, "profile")} />
              </label>
            </div>
            <div className="social-space-profile-fields">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Username</label>
                  <input className="form-control" value={profileForm.username} onChange={(event) => setProfileForm((previous) => ({ ...previous, username: event.target.value }))} placeholder="ex: souffle.neuf" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Role visible</label>
                  <input className="form-control" value={viewer?.role || ""} readOnly />
                </div>
                <div className="col-12">
                  <label className="form-label">Bio</label>
                  <textarea className="form-control" rows="3" value={profileForm.bio} onChange={(event) => setProfileForm((previous) => ({ ...previous, bio: event.target.value }))} placeholder="Quelques mots sur votre parcours ou votre maniere d'aider." />
                </div>
              </div>
              <div className="social-space-composer-row">
                <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                  {savingProfile ? "Enregistrement..." : "Enregistrer le profil"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </section>

      <section className="social-space-panel">
        <div className="social-space-panel-head">
          <div>
            <h3>Vos publications</h3>
            <p>{myPosts.length} post{myPosts.length > 1 ? "s" : ""} deja visibles dans le fil.</p>
          </div>
        </div>
      </section>

      {myPosts.length === 0 ? (
        <section className="social-space-empty">
          <h3>Votre profil est pret.</h3>
          <p>Le premier post donnera vie a votre espace et aidera les autres a vous reconnaitre.</p>
        </section>
      ) : (
        myPosts.map(renderPostCard)
      )}
    </div>
  );

  return (
    <div className="container py-4 app-shell social-space" data-guide-id="communities-main">
      <div className="profile-page-header social-space-header" data-guide-id="communities-header">
        <div>
          <div className="hero-kicker">Communaute de soutien</div>
          <h2 className="fw-bold mb-1">Un espace plus vivant, plus humain et plus simple a parcourir</h2>
          <p className="muted-text mb-0">
            Fil photo, recherche de profils, activite, messagerie privee et cercles thematiques dans une interface plus douce et plus engageante.
          </p>
        </div>
      </div>

      {feedback && (
        <div className={`floating-feedback-toast ${feedback.type === "error" ? "is-error" : "is-success"}`}>
          <div>
            <strong>{feedback.type === "error" ? "Action non terminee" : "Action confirmee"}</strong>
            <p className="mb-0">{feedback.text}</p>
          </div>
        </div>
      )}

      <section className="social-space-shell">
        <aside className="social-space-sidebar">
          <div className="social-space-viewer-card">
            {renderAvatar({ profilePhotoUrl: viewer?.profilePhotoUrl, name: viewer?.displayName, username: viewer?.username })}
            <div>
              <strong>{viewer?.displayName || "Votre espace"}</strong>
              <span>{viewer?.username ? `@${viewer.username}` : "Configurez votre profil"}</span>
            </div>
          </div>

          <nav className="social-space-nav">
            {sectionItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`social-space-nav-item ${activeSection === item.key ? "is-active" : ""}`}
                onClick={() => setActiveSection(item.key)}
              >
                <i className={`bi ${item.icon}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <section className="social-space-sidebar-panel">
            <h4>Rythme du moment</h4>
            <div className="social-space-stat-row">
              <span>Amis</span>
              <strong>{friends.length}</strong>
            </div>
            <div className="social-space-stat-row">
              <span>Invitations</span>
              <strong>{unresolvedInvitations.length}</strong>
            </div>
            <div className="social-space-stat-row">
              <span>Interactions</span>
              <strong>{overview.activity?.length || 0}</strong>
            </div>
          </section>
        </aside>

        <main className="social-space-main">
          {activeSection === "feed" && renderFeed()}
          {activeSection === "explore" && renderExplore()}
          {activeSection === "activity" && renderActivity()}
          {activeSection === "messages" && renderMessages()}
          {activeSection === "profile" && renderProfile()}
        </main>

        <aside className="social-space-sidepane">
          <section className="social-space-panel">
            <div className="social-space-panel-head">
              <div>
                <h3>A la une</h3>
                <p>Un regard rapide sur votre espace relationnel.</p>
              </div>
            </div>
            <div className="social-space-compact-list">
              {friends.slice(0, 5).map((friend) => (
                <button key={friend.id} type="button" className="social-space-compact-item" onClick={() => openConversation(friend)}>
                  {renderAvatar(friend, "social-space-avatar social-space-avatar-sm")}
                  <div>
                    <strong>{friend.name}</strong>
                    <span>{friend.username ? `@${friend.username}` : friend.role}</span>
                  </div>
                </button>
              ))}
              {friends.length === 0 && <p className="muted-text mb-0">Les amis acceptes apparaitront ici.</p>}
            </div>
          </section>

          <section className="social-space-panel">
            <div className="social-space-panel-head">
              <div>
                <h3>Profils a voir</h3>
                <p>Une selection courte pour ne pas surcharger l'ecran.</p>
              </div>
            </div>
            <div className="social-space-compact-list">
              {(overview.people || []).slice(0, 4).map((person) => (
                <button key={person.id} type="button" className="social-space-compact-item" onClick={() => openProfile(person.id)}>
                  {renderAvatar(person, "social-space-avatar social-space-avatar-sm")}
                  <div>
                    <strong>{person.name}</strong>
                    <span>{person.username ? `@${person.username}` : person.role}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Partager avec un ami</Modal.Title>
        </Modal.Header>
        <form onSubmit={submitShare}>
          <Modal.Body>
            {friends.length === 0 ? (
              <p className="mb-0">Ajoutez d'abord un ami avant de partager un post en direct.</p>
            ) : (
              <>
                <label className="form-label">Choisir un ami</label>
                <select className="form-select mb-3" value={shareDraft.counterpartId} onChange={(event) => setShareDraft((previous) => ({ ...previous, counterpartId: event.target.value }))}>
                  {friends.map((friend) => <option key={friend.id} value={friend.id}>{friend.name}</option>)}
                </select>
                <label className="form-label">Petit mot optionnel</label>
                <textarea className="form-control" rows="3" value={shareDraft.message} onChange={(event) => setShareDraft((previous) => ({ ...previous, message: event.target.value }))} placeholder="Pourquoi ce post pourrait lui parler ?" />
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn btn-outline-dark" onClick={() => setShowShareModal(false)}>Fermer</button>
            <button type="submit" className="btn btn-primary" disabled={friends.length === 0}>Partager</button>
          </Modal.Footer>
        </form>
      </Modal>

      <Modal show={Boolean(selectedProfile) || profileLoading} onHide={() => setSelectedProfile(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{selectedProfile?.user?.name || "Profil communautaire"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {profileLoading || !selectedProfile ? (
            <p className="mb-0">Chargement du profil...</p>
          ) : (
            <div className="social-space-profile-modal">
              <div className="social-space-profile-banner">
                {renderAvatar(selectedProfile.user)}
                <div>
                  <h3>{selectedProfile.user.name}</h3>
                  <p>{selectedProfile.user.username ? `@${selectedProfile.user.username}` : selectedProfile.user.role}</p>
                  <span>{selectedProfile.bio || "Pas encore de bio partagee."}</span>
                </div>
              </div>
              <div className="social-space-profile-stats">
                <div><strong>{selectedProfile.user.followersCount}</strong><span>abonnes</span></div>
                <div><strong>{selectedProfile.followingCount}</strong><span>abonnements</span></div>
                <div><strong>{selectedProfile.friendsCount}</strong><span>amis</span></div>
                <div><strong>{selectedProfile.user.postsCount}</strong><span>posts</span></div>
              </div>
              <div className="social-space-user-actions mb-3">
                <button type="button" className="btn btn-outline-dark" onClick={() => toggleFollow(selectedProfile.user.id)}>
                  {selectedProfile.user.following ? "Suivi" : "Suivre"}
                </button>
                {selectedProfile.user.connectionStatus === "FRIEND" ? (
                  <button type="button" className="btn btn-primary" onClick={() => { setSelectedProfile(null); openConversation(selectedProfile.user); }}>
                    Message
                  </button>
                ) : selectedProfile.user.connectionStatus === "PENDING_SENT" ? (
                  <button type="button" className="btn btn-light" disabled>Invitation envoyee</button>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={() => sendInvitation(selectedProfile.user.id)}>
                    Ajouter
                  </button>
                )}
              </div>
              <div className="social-space-modal-posts">
                {selectedProfile.posts.map(renderPostCard)}
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={showProfileSetup} backdrop="static" keyboard={false} centered>
        <Modal.Header>
          <Modal.Title>Choisissez votre identite communautaire</Modal.Title>
        </Modal.Header>
        <form onSubmit={saveProfile}>
          <Modal.Body>
            <p className="mb-3">
              Pour entrer dans l'espace communaute, choisissez un username. La photo de profil peut etre ajoutee maintenant ou plus tard.
            </p>
            <div className="social-space-profile-preview is-modal">
              {renderAvatar({ profilePhotoUrl: profileForm.profilePhotoUrl, name: profileForm.username })}
            </div>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input className="form-control" value={profileForm.username} onChange={(event) => setProfileForm((previous) => ({ ...previous, username: event.target.value }))} placeholder="ex: souffle.neuf" />
            </div>
            <div className="mb-3">
              <label className="form-label">Bio courte</label>
              <textarea className="form-control" rows="3" value={profileForm.bio} onChange={(event) => setProfileForm((previous) => ({ ...previous, bio: event.target.value }))} placeholder="Une phrase sur votre presence ici." />
            </div>
            <label className="social-space-upload-btn">
              <i className="bi bi-camera" />
              <span>Ajouter une photo optionnelle</span>
              <input type="file" accept="image/*" onChange={(event) => handleProfilePhoto(event, "profile")} />
            </label>
          </Modal.Body>
          <Modal.Footer>
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? "Enregistrement..." : "Entrer dans la communaute"}
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};

export default Communities;
