import React, { useEffect, useMemo, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

// Fallback initial subreddits
const DEFAULT_SUBREDDITS = [
  { id: "all", name: "r/tous", label: "Accueil Global", icon: "bi-globe2", color: "#3b82f6" },
  { id: "victoires", name: "r/victoires_sevrage", label: "Victoires & Étapes", icon: "bi-trophy-fill", color: "#10b981" },
  { id: "entraide", name: "r/entraide_urgences", label: "SOS & Urgences Craving", icon: "bi-shield-fill-exclamation", color: "#ef4444" },
  { id: "conseils", name: "r/conseils_tabacologues", label: "Conseils Médicaux", icon: "bi-heart-pulse-fill", color: "#8b5cf6" },
  { id: "tns", name: "r/substituts_tns", label: "Substituts & Traitements", icon: "bi-capsule", color: "#f59e0b" },
  { id: "sport", name: "r/sport_et_bienetre", label: "Sport & Respiration", icon: "bi-lungs-fill", color: "#06b6d4" }
];

const FLAIRS = [
  { label: "🏆 Victoire J+30", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" },
  { label: "🌟 Victoire J+14", color: "#34d399", bg: "rgba(52, 211, 153, 0.12)" },
  { label: "🆘 Urgence Craving", color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)" },
  { label: "🩺 Conseil Médecin", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.12)" },
  { label: "💡 Astuce du Jour", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
  { label: "💊 Substituts & TNS", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)" },
  { label: "🧘 Sport & Bien-être", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.12)" },
  { label: "🔄 Rechute & Courage", color: "#ec4899", bg: "rgba(236, 72, 153, 0.12)" }
];

const formatDateAgo = (isoDate) => {
  if (!isoDate) return "à l'instant";
  try {
    const diff = Math.floor((new Date() - new Date(isoDate)) / 1000);
    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(isoDate));
  } catch (e) {
    return isoDate;
  }
};

const getAvatarLetter = (name, username) => {
  const str = (username || name || "NC").replace("@", "").trim();
  return str.slice(0, 2).toUpperCase();
};

export default function Communities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  // Core Community State
  const [posts, setPosts] = useState([]);
  const [servers, setServers] = useState([]);
  const [people, setPeople] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Navigation
  const [activeSubreddit, setActiveSubreddit] = useState("all");
  const [activeFilter, setActiveFilter] = useState("hot"); // hot, new, top, discussed
  const [activeFlair, setActiveFlair] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Panels
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [targetRepostPost, setTargetRepostPost] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [imageLightboxUrl, setImageLightboxUrl] = useState(null);

  // Post Draft Form
  const [postDraft, setPostDraft] = useState({
    title: "",
    flair: "🏆 Victoire J+30",
    content: "",
    imageUrl: "",
    serverId: ""
  });
  const [postTab, setPostTab] = useState("text"); // text, media, link
  const [repostComment, setRepostComment] = useState("");

  // Comments Inline Management
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [replyingTo, setReplyingTo] = useState({}); // { [postId]: parentCommentId }

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [showNotifsMenu, setShowNotifsMenu] = useState(false);

  // Reddit Floating Chat Dock
  const [chatDockOpen, setChatDockOpen] = useState(false);
  const [activeChatTarget, setActiveChatTarget] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [conversations, setConversations] = useState([]);
  const [chatSearchQuery, setChatSearchQuery] = useState("");

  // Feedback banner
  const [feedback, setFeedback] = useState(null);

  const showToast = (msg, type = "success") => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Load Social Feed & Data
  const loadCommunityData = async () => {
    try {
      setLoading(true);
      const [socialRes, notifRes, summaryRes] = await Promise.all([
        api.get("/api/communities/social").catch(() => ({ data: null })),
        api.get("/api/notifications").catch(() => ({ data: [] })),
        api.get("/api/notifications/summary").catch(() => ({ data: { unreadCount: 0 } }))
      ]);

      if (socialRes?.data) {
        const data = socialRes.data;
        setPosts(data.posts || []);
        setServers(data.servers || []);
        setPeople(data.people || []);
        setMyProfile(data.viewer || null);
        setConversations(data.conversations || []);
      }

      setNotifications(notifRes?.data || []);
      setUnreadNotifsCount(summaryRes?.data?.unreadCount || 0);
    } catch (err) {
      console.error("Error loading community:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunityData();
  }, []);

  // Handle URL Param for Direct Profile or Post Open
  useEffect(() => {
    const userParam = searchParams.get("user");
    const usernameParam = searchParams.get("username");
    if (userParam) {
      handleOpenUserProfile(userParam);
    } else if (usernameParam) {
      handleOpenUserProfileByUsername(usernameParam);
    }
  }, [searchParams]);

  // Upvote / Downvote Post
  const handleVote = async (postId, type) => {
    try {
      const res = await api.post(`/api/communities/social/posts/${postId}/reactions`, { type });
      if (res?.data) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? res.data : p)));
      }
    } catch (err) {
      showToast("Erreur lors du vote", "danger");
    }
  };

  // React to Post with Emoji
  const handleReaction = async (postId, type) => {
    try {
      const res = await api.post(`/api/communities/social/posts/${postId}/reactions`, { type });
      if (res?.data) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? res.data : p)));
      }
    } catch (err) {
      showToast("Erreur lors de la réaction", "danger");
    }
  };

  // Comment on Post (or Reply to a comment)
  const handleAddComment = async (postId) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    const parentId = replyingTo[postId] || null;

    try {
      const res = await api.post(`/api/communities/social/posts/${postId}/comments`, {
        content: text,
        parentCommentId: parentId
      });
      if (res?.data) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? res.data : p)));
        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
        setReplyingTo((prev) => ({ ...prev, [postId]: null }));
        setExpandedComments((prev) => ({ ...prev, [postId]: true }));
        showToast("Commentaire publié !");
      }
    } catch (err) {
      showToast("Impossible d'ajouter le commentaire", "danger");
    }
  };

  // React to Comment
  const handleCommentReaction = async (postId, commentId, type = "UPVOTE") => {
    try {
      const res = await api.post(`/api/communities/social/comments/${commentId}/reactions`, { type });
      if (res?.data) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            const updatedComments = (p.comments || []).map((c) => (c.id === commentId ? res.data : c));
            return { ...p, comments: updatedComments };
          })
        );
      }
    } catch (err) {
      showToast("Erreur réaction commentaire", "danger");
    }
  };

  // Toggle Follow User
  const handleToggleFollow = async (targetUserId) => {
    try {
      const res = await api.post(`/api/communities/social/users/${targetUserId}/follow`);
      if (res?.data) {
        showToast(res.data.following ? "Abonnement enregistré !" : "Désabonnement effectué.");
        // Refresh profile if open
        if (selectedUserProfile?.user?.id === targetUserId) {
          handleOpenUserProfile(targetUserId);
        }
        // Update user state in feed
        setPosts((prev) =>
          prev.map((p) => {
            if (p.author?.id === targetUserId) {
              return { ...p, author: { ...p.author, following: res.data.following } };
            }
            return p;
          })
        );
      }
    } catch (err) {
      showToast("Erreur lors de l'abonnement", "danger");
    }
  };

  // Open User Profile Modal (Click on avatar or username)
  const handleOpenUserProfile = async (userId) => {
    try {
      setProfileLoading(true);
      setShowProfileModal(true);
      const res = await api.get(`/api/communities/social/users/${userId}`);
      setSelectedUserProfile(res.data);
    } catch (err) {
      showToast("Impossible de charger ce profil", "danger");
      setShowProfileModal(false);
    } finally {
      setProfileLoading(false);
    }
  };

  // Open User Profile by Username
  const handleOpenUserProfileByUsername = async (username) => {
    try {
      setProfileLoading(true);
      setShowProfileModal(true);
      const clean = username.replace("@", "");
      const res = await api.get(`/api/communities/social/users/by-username/${clean}`);
      setSelectedUserProfile(res.data);
    } catch (err) {
      showToast("Profil introuvable pour @" + username, "danger");
      setShowProfileModal(false);
    } finally {
      setProfileLoading(false);
    }
  };

  // Create Post Submit
  const handleCreatePostSubmit = async (e) => {
    e?.preventDefault();
    if (!postDraft.title.trim() && !postDraft.content.trim()) {
      showToast("Veuillez saisir un titre ou un contenu.", "warning");
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        title: postDraft.title.trim(),
        flair: postDraft.flair,
        content: postDraft.content.trim(),
        imageUrl: postDraft.imageUrl.trim() || null,
        serverId: postDraft.serverId || null
      };
      const res = await api.post("/api/communities/social/posts", payload);
      if (res?.data) {
        setPosts((prev) => [res.data, ...prev]);
        setShowCreateModal(false);
        setPostDraft({ title: "", flair: "🏆 Victoire J+30", content: "", imageUrl: "", serverId: "" });
        showToast("🎉 Publication créée avec succès !");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur création post", "danger");
    } finally {
      setActionLoading(false);
    }
  };

  // Repost / Cross-Post Submit
  const handleRepostSubmit = async () => {
    if (!targetRepostPost) return;
    try {
      setActionLoading(true);
      const payload = {
        title: `Republication : ${targetRepostPost.title || "Témoignage inspirant"}`,
        flair: "💡 Partage",
        content: repostComment.trim() || "Je partage cette publication inspirante !",
        repostOfPostId: targetRepostPost.id,
        repostComment: repostComment.trim()
      };
      const res = await api.post("/api/communities/social/posts", payload);
      if (res?.data) {
        setPosts((prev) => [res.data, ...prev]);
        setShowRepostModal(false);
        setTargetRepostPost(null);
        setRepostComment("");
        showToast("Publication republiée dans le fil !");
      }
    } catch (err) {
      showToast("Erreur lors de la republication", "danger");
    } finally {
      setActionLoading(false);
    }
  };

  // Direct Messaging / Chat in Dock
  const handleOpenChatWith = async (user) => {
    if (!user) return;
    setActiveChatTarget(user);
    setChatDockOpen(true);
    const targetId = user.id || user.userId;
    if (!targetId) return;
    try {
      const res = await api.get(`/api/communities/social/direct/${targetId}`);
      setChatMessages(res.data || []);
    } catch (err) {
      console.error("Error loading direct thread:", err);
    }
  };

  const handleSendChatMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || !activeChatTarget) return;

    const targetId = activeChatTarget.id || activeChatTarget.userId;
    if (!targetId) {
      showToast("Destinataire introuvable", "warning");
      return;
    }

    try {
      const res = await api.post(`/api/communities/social/direct/${targetId}`, {
        content: chatInput.trim()
      });
      if (res?.data) {
        setChatMessages((prev) => [...prev, res.data]);
        setChatInput("");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Impossible d'envoyer le message";
      showToast(msg, "danger");
    }
  };

  // Notifications Mark as Read
  const handleMarkNotifRead = async (notifId) => {
    try {
      await api.post(`/api/notifications/${notifId}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, status: "READ" } : n)));
      setUnreadNotifsCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error mark notif read:", err);
    }
  };

  // Filtered & Sorted Posts
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Filter by Subreddit
    if (activeSubreddit !== "all") {
      result = result.filter((p) => {
        const sName = (p.serverName || "").toLowerCase();
        if (activeSubreddit === "victoires") return sName.includes("victoire");
        if (activeSubreddit === "entraide") return sName.includes("entraide") || sName.includes("urgence");
        if (activeSubreddit === "conseils") return sName.includes("conseil");
        if (activeSubreddit === "tns") return sName.includes("substitut") || sName.includes("tns");
        if (activeSubreddit === "sport") return sName.includes("sport") || sName.includes("bienetre");
        return p.serverId === activeSubreddit;
      });
    }

    // Filter by Flair
    if (activeFlair) {
      result = result.filter((p) => p.flair === activeFlair);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.content || "").toLowerCase().includes(q) ||
          (p.author?.name || "").toLowerCase().includes(q) ||
          (p.author?.username || "").toLowerCase().includes(q) ||
          (p.flair || "").toLowerCase().includes(q)
      );
    }

    // Sorting
    if (activeFilter === "new") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (activeFilter === "top") {
      result.sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0));
    } else if (activeFilter === "discussed") {
      result.sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0));
    } else {
      // "hot" score
      result.sort((a, b) => {
        const scoreA = (a.upvotesCount || 0) * 3 + (a.comments?.length || 0) * 2;
        const scoreB = (b.upvotesCount || 0) * 3 + (b.comments?.length || 0) * 2;
        return scoreB - scoreA;
      });
    }

    return result;
  }, [posts, activeSubreddit, activeFlair, searchQuery, activeFilter]);

  return (
    <div className="reddit-root">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`reddit-toast alert alert-${feedback.type}`}>
          <i className="bi bi-info-circle me-2"></i>
          {feedback.msg}
        </div>
      )}

      {/* TOP REDDIT HEADER */}
      <header className="reddit-topbar">
        <div className="reddit-topbar-left">
          <div className="reddit-brand" onClick={() => { setActiveSubreddit("all"); setActiveFlair(null); setSearchQuery(""); }}>
            <span className="reddit-logo-icon">🧠</span>
            <div className="reddit-brand-text">
              <span className="brand-title">NeuralCommunity</span>
              <span className="brand-badge">Sevrage & Entraide</span>
            </div>
          </div>

          {/* Subreddit Quick Switcher */}
          <div className="reddit-subreddit-select-wrap">
            <select
              className="reddit-subreddit-select"
              value={activeSubreddit}
              onChange={(e) => setActiveSubreddit(e.target.value)}
            >
              {DEFAULT_SUBREDDITS.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} · {sub.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="reddit-search-box">
          <i className="bi bi-search search-icon"></i>
          <input
            type="text"
            placeholder="Rechercher sur NeuralCommunity (titres, astuces, @pseudos, flairs)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery("")}>
              <i className="bi bi-x-circle-fill"></i>
            </button>
          )}
        </div>

        {/* Topbar Actions */}
        <div className="reddit-topbar-right">
          {/* Theme Toggle Button */}
          <button
            className="reddit-icon-btn"
            title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
            onClick={toggleTheme}
          >
            {isDark ? <i className="bi bi-sun-fill text-warning"></i> : <i className="bi bi-moon-stars-fill text-primary"></i>}
          </button>

          {/* Create Post Action */}
          <button className="reddit-create-btn" onClick={() => setShowCreateModal(true)}>
            <i className="bi bi-plus-lg"></i>
            <span>Créer</span>
          </button>

          {/* Chat Dock Trigger */}
          <button
            className={`reddit-icon-btn ${chatDockOpen ? "active" : ""}`}
            title="Discussions privées"
            onClick={() => setChatDockOpen(!chatDockOpen)}
          >
            <i className="bi bi-chat-dots-fill"></i>
          </button>

          {/* Notification Bell with Menu */}
          <div className="reddit-notif-wrap">
            <button
              className="reddit-icon-btn position-relative"
              onClick={() => setShowNotifsMenu(!showNotifsMenu)}
              title="Notifications"
            >
              <i className="bi bi-bell-fill"></i>
              {unreadNotifsCount > 0 && (
                <span className="reddit-notif-badge">{unreadNotifsCount}</span>
              )}
            </button>

            {showNotifsMenu && (
              <div className="reddit-notif-dropdown">
                <div className="notif-header">
                  <h6>Notifications</h6>
                  <span className="notif-sub">{notifications.length} récentes</span>
                </div>
                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">Aucune notification pour le moment.</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`notif-item ${n.status === "UNREAD" ? "unread" : ""}`}
                        onClick={() => handleMarkNotifRead(n.id)}
                      >
                        <div className="notif-icon">
                          <i className="bi bi-heart-pulse-fill text-danger"></i>
                        </div>
                        <div className="notif-content">
                          <div className="notif-title">{n.title}</div>
                          <div className="notif-text">{n.content}</div>
                          <div className="notif-time">{formatDateAgo(n.createdAt)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current User Pill (Click to view own profile) */}
          {myProfile && (
            <div
              className="reddit-user-chip"
              onClick={() => myProfile.id && handleOpenUserProfile(myProfile.id)}
              title="Voir mon profil public"
            >
              <div className="reddit-avatar-sm">
                {myProfile.profilePhotoUrl ? (
                  <img src={myProfile.profilePhotoUrl} alt="Avatar" />
                ) : (
                  <span>{getAvatarLetter(myProfile.name, myProfile.username)}</span>
                )}
              </div>
              <div className="user-info-text d-none d-lg-block">
                <div className="user-name">@{myProfile.username || "mon_profil"}</div>
                <div className="user-role">{myProfile.role || "Patient"}</div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 3-COLUMN REDDIT BODY */}
      <div className="reddit-container">
        {/* LEFT SIDEBAR: Subreddits & Flairs */}
        <aside className="reddit-sidebar-left">
          <div className="sidebar-section">
            <div className="sidebar-title">FLUX PRINCIPAUX</div>
            <button
              className={`sidebar-nav-item ${activeSubreddit === "all" ? "active" : ""}`}
              onClick={() => { setActiveSubreddit("all"); setActiveFlair(null); }}
            >
              <i className="bi bi-house-door-fill"></i>
              <span>Accueil Global</span>
            </button>
            <button
              className={`sidebar-nav-item ${activeFilter === "hot" && activeSubreddit === "all" ? "active" : ""}`}
              onClick={() => { setActiveFilter("hot"); setActiveSubreddit("all"); }}
            >
              <i className="bi bi-fire text-warning"></i>
              <span>Populaires (Hot)</span>
            </button>
            <button
              className={`sidebar-nav-item ${activeFilter === "top" ? "active" : ""}`}
              onClick={() => setActiveFilter("top")}
            >
              <i className="bi bi-graph-up-arrow text-success"></i>
              <span>Meilleurs (Top)</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-title">SOUS-COMMUNAUTÉS</div>
            {DEFAULT_SUBREDDITS.filter((s) => s.id !== "all").map((sub) => (
              <button
                key={sub.id}
                className={`sidebar-nav-item ${activeSubreddit === sub.id ? "active" : ""}`}
                onClick={() => { setActiveSubreddit(sub.id); setActiveFlair(null); }}
              >
                <i className={`bi ${sub.icon}`} style={{ color: sub.color }}></i>
                <div className="sub-meta">
                  <span className="sub-name">{sub.name}</span>
                  <span className="sub-label">{sub.label}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-title">THEMES / FLAIRS</div>
            <div className="flair-chips-wrap">
              {FLAIRS.map((f) => (
                <button
                  key={f.label}
                  className={`flair-pill-btn ${activeFlair === f.label ? "active" : ""}`}
                  style={{ color: f.color, borderColor: f.color }}
                  onClick={() => setActiveFlair(activeFlair === f.label ? null : f.label)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-card rules-card">
            <div className="rules-header">
              <i className="bi bi-shield-check text-primary"></i>
              <span>Charte Bienveillante</span>
            </div>
            <p className="rules-text">
              Respect mutuel, secret médical, encouragements sans jugement et modération assurée par des tabacologues certifiés.
            </p>
          </div>
        </aside>

        {/* CENTRAL FEED: Quick Post Bar, Sort Tabs, Post Cards */}
        <main className="reddit-main-feed">
          {/* Quick Post Box */}
          <div className="reddit-quick-post" onClick={() => setShowCreateModal(true)}>
            <div className="reddit-avatar-sm">
              {myProfile?.profilePhotoUrl ? (
                <img src={myProfile.profilePhotoUrl} alt="Avatar" />
              ) : (
                <span>{getAvatarLetter(myProfile?.name, myProfile?.username)}</span>
              )}
            </div>
            <input
              type="text"
              readOnly
              placeholder="Une victoire, un conseil, un craving ou une photo à partager ?"
            />
            <div className="quick-post-actions">
              <button className="quick-action-btn" title="Photo"><i className="bi bi-image"></i></button>
              <button className="quick-action-btn" title="Lien"><i className="bi bi-link-45deg"></i></button>
            </div>
          </div>

          {/* Sort Filter Bar */}
          <div className="reddit-sort-bar">
            <div className="sort-buttons">
              <button
                className={`sort-tab ${activeFilter === "hot" ? "active" : ""}`}
                onClick={() => setActiveFilter("hot")}
              >
                <i className="bi bi-fire"></i>
                <span>Populaires</span>
              </button>
              <button
                className={`sort-tab ${activeFilter === "new" ? "active" : ""}`}
                onClick={() => setActiveFilter("new")}
              >
                <i className="bi bi-stars"></i>
                <span>Nouveaux</span>
              </button>
              <button
                className={`sort-tab ${activeFilter === "top" ? "active" : ""}`}
                onClick={() => setActiveFilter("top")}
              >
                <i className="bi bi-trophy"></i>
                <span>Meilleurs</span>
              </button>
              <button
                className={`sort-tab ${activeFilter === "discussed" ? "active" : ""}`}
                onClick={() => setActiveFilter("discussed")}
              >
                <i className="bi bi-chat-left-text"></i>
                <span>Discussions</span>
              </button>
            </div>

            {activeFlair && (
              <div className="active-flair-indicator">
                <span>Filtré par : <strong>{activeFlair}</strong></span>
                <button onClick={() => setActiveFlair(null)}><i className="bi bi-x"></i></button>
              </div>
            )}
          </div>

          {/* Posts Stream */}
          {loading ? (
            <div className="reddit-loading">
              <div className="spinner-border text-primary" role="status"></div>
              <span>Chargement des échanges communautaires...</span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="reddit-empty-state">
              <div className="empty-icon">🫁</div>
              <h4>Aucune publication trouvée</h4>
              <p>Soyez le premier à partager une victoire ou à poser une question médicale !</p>
              <button className="reddit-create-btn" onClick={() => setShowCreateModal(true)}>
                <i className="bi bi-plus-lg me-1"></i> Publier maintenant
              </button>
            </div>
          ) : (
            <div className="reddit-posts-list">
              {filteredPosts.map((post) => {
                const isDoctor = post.author?.isDoctor || post.author?.role === "Médecin Tabacologue";
                const netScore = (post.upvotesCount || 0) - (post.downvotesCount || 0);
                const commentsOpen = !!expandedComments[post.id];
                const commentsList = post.comments || [];

                return (
                  <article key={post.id} className="reddit-post-card">
                    {/* LEFT VOTE COLUMN */}
                    <div className="reddit-vote-column">
                      <button
                        className={`vote-btn upvote ${post.myReaction === "UPVOTE" ? "voted" : ""}`}
                        title="Upvote"
                        onClick={() => handleVote(post.id, "UPVOTE")}
                      >
                        <i className="bi bi-arrow-up-circle-fill"></i>
                      </button>
                      <span className={`vote-score ${netScore > 0 ? "positive" : netScore < 0 ? "negative" : ""}`}>
                        {netScore}
                      </span>
                      <button
                        className={`vote-btn downvote ${post.myReaction === "DOWNVOTE" ? "voted" : ""}`}
                        title="Downvote"
                        onClick={() => handleVote(post.id, "DOWNVOTE")}
                      >
                        <i className="bi bi-arrow-down-circle-fill"></i>
                      </button>
                    </div>

                    {/* MAIN POST BODY */}
                    <div className="reddit-post-main">
                      {/* Post Header: Subreddit, Author (clickable to profile), Role, Time, Flair */}
                      <div className="reddit-post-header">
                        <span className="post-subreddit">{post.serverName || "r/victoires_sevrage"}</span>
                        <span className="meta-dot">·</span>

                        {/* Author Clickable to Profile */}
                        <div
                          className="post-author-wrap"
                          onClick={() => post.author?.id && handleOpenUserProfile(post.author.id)}
                        >
                          <div className="author-avatar-xs">
                            {post.author?.profilePhotoUrl ? (
                              <img src={post.author.profilePhotoUrl} alt="Author" />
                            ) : (
                              <span>{getAvatarLetter(post.author?.name, post.author?.username)}</span>
                            )}
                          </div>
                          <span className="author-username">@{post.author?.username || "membre"}</span>
                        </div>

                        {/* Role / Doctor Badge */}
                        {isDoctor ? (
                          <span className="badge-doctor" title="Médecin Tabacologue Certifié">
                            <i className="bi bi-patch-check-fill me-1"></i>
                            {post.author?.name || "Dr. Tabacologue"}
                          </span>
                        ) : (
                          <span className="badge-patient">
                            {post.author?.smokeFreeStatus || "Patient"}
                          </span>
                        )}

                        <span className="meta-dot">·</span>
                        <span className="post-time">{formatDateAgo(post.createdAt)}</span>

                        {/* Flair Pill */}
                        {post.flair && (
                          <span className="post-flair-pill">{post.flair}</span>
                        )}

                        {/* Follow Button on Post Header */}
                        {post.author && authUser && post.author.id !== authUser.id && (
                          <button
                            className={`post-follow-btn ${post.author.following ? "following" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFollow(post.author.id);
                            }}
                          >
                            {post.author.following ? "Abonné" : "+ Suivre"}
                          </button>
                        )}
                      </div>

                      {/* Post Title */}
                      {post.title && (
                        <h2 className="reddit-post-title">{post.title}</h2>
                      )}

                      {/* Post Content */}
                      <div className="reddit-post-content">
                        {post.content}
                      </div>

                      {/* Post Image (Click to open Lightbox) */}
                      {post.imageUrl && (
                        <div className="reddit-post-media" onClick={() => setImageLightboxUrl(post.imageUrl)}>
                          <img src={post.imageUrl} alt="Média publication" loading="lazy" />
                        </div>
                      )}

                      {/* REPOST BOX (If this post is a repost) */}
                      {post.repostOfPost && (
                        <div className="reddit-repost-box">
                          <div className="repost-header">
                            <i className="bi bi-arrow-repeat me-1 text-primary"></i>
                            <span className="repost-origin-author" onClick={() => post.repostOfPost.author?.id && handleOpenUserProfile(post.repostOfPost.author.id)}>
                              @{post.repostOfPost.author?.username || "membre"}
                            </span>
                            <span className="meta-dot">·</span>
                            <span className="repost-sub">{post.repostOfPost.serverName}</span>
                          </div>
                          {post.repostOfPost.title && <div className="repost-title">{post.repostOfPost.title}</div>}
                          <div className="repost-content">{post.repostOfPost.content}</div>
                          {post.repostOfPost.imageUrl && (
                            <img className="repost-image" src={post.repostOfPost.imageUrl} alt="Repost média" />
                          )}
                        </div>
                      )}

                      {/* Post Footer Actions */}
                      <div className="reddit-post-footer">
                        {/* Comments Toggle */}
                        <button
                          className={`footer-action-btn ${commentsOpen ? "active" : ""}`}
                          onClick={() => setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                        >
                          <i className="bi bi-chat-square-text-fill"></i>
                          <span>{commentsList.length} Commentaires</span>
                        </button>

                        {/* Repost Button */}
                        <button
                          className="footer-action-btn"
                          title="Republier ce témoignage"
                          onClick={() => {
                            setTargetRepostPost(post);
                            setShowRepostModal(true);
                          }}
                        >
                          <i className="bi bi-arrow-repeat"></i>
                          <span>Republier</span>
                        </button>

                        {/* Emoji Quick Reactions */}
                        <div className="reaction-chips-wrap">
                          <button className="reaction-chip" onClick={() => handleReaction(post.id, "LOVE")} title="Soutien 💖">
                            💖 {post.reactions?.LOVE || 0}
                          </button>
                          <button className="reaction-chip" onClick={() => handleReaction(post.id, "FIRE")} title="Force 🔥">
                            🔥 {post.reactions?.FIRE || 0}
                          </button>
                          <button className="reaction-chip" onClick={() => handleReaction(post.id, "CLAP")} title="Bravo 👏">
                            👏 {post.reactions?.CLAP || 0}
                          </button>
                          <button className="reaction-chip" onClick={() => handleReaction(post.id, "INSIGHT")} title="Utile 💡">
                            💡 {post.reactions?.INSIGHT || 0}
                          </button>
                        </div>

                        {/* Share Button */}
                        <button
                          className="footer-action-btn ms-auto"
                          title="Partager"
                          onClick={() => {
                            navigator.clipboard?.writeText(window.location.href);
                            showToast("Lien de la publication copié !");
                          }}
                        >
                          <i className="bi bi-share"></i>
                          <span>Partager</span>
                        </button>
                      </div>

                      {/* EXPANDABLE COMMENTS THREAD */}
                      {commentsOpen && (
                        <div className="reddit-comments-section">
                          {/* Add Comment Input */}
                          <div className="comment-composer">
                            <div className="reddit-avatar-xs">
                              {myProfile?.profilePhotoUrl ? (
                                <img src={myProfile.profilePhotoUrl} alt="Avatar" />
                              ) : (
                                <span>{getAvatarLetter(myProfile?.name, myProfile?.username)}</span>
                              )}
                            </div>
                            <div className="comment-input-wrap">
                              {replyingTo[post.id] && (
                                <div className="replying-banner">
                                  <span>Réponse en cours à un commentaire</span>
                                  <button onClick={() => setReplyingTo((prev) => ({ ...prev, [post.id]: null }))}>
                                    <i className="bi bi-x"></i>
                                  </button>
                                </div>
                              )}
                              <input
                                type="text"
                                placeholder={replyingTo[post.id] ? "Votre réponse..." : "Ajouter un commentaire constructif et bienveillant..."}
                                value={commentInputs[post.id] || ""}
                                onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment(post.id);
                                  }
                                }}
                              />
                              <button
                                className="comment-submit-btn"
                                disabled={!commentInputs[post.id]?.trim()}
                                onClick={() => handleAddComment(post.id)}
                              >
                                Publier
                              </button>
                            </div>
                          </div>

                          {/* Comments List */}
                          <div className="comments-tree">
                            {commentsList.length === 0 ? (
                              <div className="comments-empty">Aucun commentaire pour le moment. Soyez le premier à répondre !</div>
                            ) : (
                              commentsList.map((comm) => {
                                const isCommDoc = comm.authorRole?.includes("Medecin") || comm.authorVerifiedBadge;
                                const isReply = !!comm.parentCommentId;

                                return (
                                  <div key={comm.id} className={`comment-card ${isReply ? "nested-reply" : ""}`}>
                                    {/* Author Avatar (Clickable to Profile) */}
                                    <div
                                      className="comment-avatar"
                                      onClick={() => comm.authorId && handleOpenUserProfile(comm.authorId)}
                                    >
                                      {comm.authorPhotoUrl ? (
                                        <img src={comm.authorPhotoUrl} alt="Avatar" />
                                      ) : (
                                        <span>{getAvatarLetter(comm.authorName, comm.authorUsername)}</span>
                                      )}
                                    </div>

                                    <div className="comment-body">
                                      <div className="comment-header">
                                        <span
                                          className="comment-author-name"
                                          onClick={() => comm.authorId && handleOpenUserProfile(comm.authorId)}
                                        >
                                          @{comm.authorUsername || "membre"}
                                        </span>

                                        {isCommDoc && (
                                          <span className="badge-doctor-sm">
                                            <i className="bi bi-patch-check-fill me-1"></i> {comm.authorName}
                                          </span>
                                        )}

                                        <span className="meta-dot">·</span>
                                        <span className="comment-time">{formatDateAgo(comm.createdAt)}</span>
                                      </div>

                                      <div className="comment-text">{comm.content}</div>

                                      {/* Comment Actions: Upvote, React, Reply */}
                                      <div className="comment-actions">
                                        <button
                                          className={`comment-vote-btn ${comm.myReaction === "UPVOTE" ? "voted" : ""}`}
                                          onClick={() => handleCommentReaction(post.id, comm.id, "UPVOTE")}
                                        >
                                          <i className="bi bi-arrow-up-circle me-1"></i>
                                          <span>{comm.upvotesCount || 0}</span>
                                        </button>

                                        <button
                                          className="comment-reply-btn"
                                          onClick={() => {
                                            setReplyingTo((prev) => ({ ...prev, [post.id]: comm.id }));
                                            document.querySelector(".comment-input-wrap input")?.focus();
                                          }}
                                        >
                                          <i className="bi bi-reply-fill me-1"></i> Répondre
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR: Widgets & Verified Tabacologues */}
        <aside className="reddit-sidebar-right">
          {/* Community Info Widget */}
          <div className="sidebar-card community-about-card">
            <div className="about-header">
              <h6>À propos de NeuralConsult</h6>
            </div>
            <p className="about-desc">
              Réseau clinique et d'entraide dédié à l'arrêt du tabac, supervisé par des médecins tabacologues et enrichi par la force du collectif.
            </p>
            <div className="about-stats-grid">
              <div className="stat-box">
                <span className="stat-val">{posts.length}+</span>
                <span className="stat-lbl">Témoignages</span>
              </div>
              <div className="stat-box">
                <span className="stat-val">100%</span>
                <span className="stat-lbl">Bienveillance</span>
              </div>
              <div className="stat-box">
                <span className="stat-val">24/7</span>
                <span className="stat-lbl">Soutien</span>
              </div>
            </div>
          </div>

          {/* Verified Tabacologues Card */}
          <div className="sidebar-card doctors-card">
            <div className="widget-header">
              <i className="bi bi-patch-check-fill text-primary"></i>
              <h6>Tabacologues & Médecins</h6>
            </div>
            <div className="doctors-list">
              {people.filter((p) => p.isDoctor || p.role?.includes("Medecin")).slice(0, 4).map((doc) => (
                <div key={doc.id} className="doc-item">
                  <div className="doc-avatar" onClick={() => handleOpenUserProfile(doc.id)}>
                    {doc.profilePhotoUrl ? (
                      <img src={doc.profilePhotoUrl} alt="Dr" />
                    ) : (
                      <span>{getAvatarLetter(doc.name, doc.username)}</span>
                    )}
                  </div>
                  <div className="doc-info" onClick={() => handleOpenUserProfile(doc.id)}>
                    <div className="doc-name">{doc.name || `@${doc.username}`}</div>
                    <div className="doc-spec">{doc.bio || "Médecin Tabacologue"}</div>
                  </div>
                  <button
                    className={`doc-follow-btn ${doc.following ? "following" : ""}`}
                    onClick={() => handleToggleFollow(doc.id)}
                  >
                    {doc.following ? "Suivi" : "+ Suivre"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones Leaderboard */}
          <div className="sidebar-card leaderboard-card">
            <div className="widget-header">
              <i className="bi bi-award-fill text-warning"></i>
              <h6>Tableau d'Honneur</h6>
            </div>
            <div className="leader-item">
              <span className="badge-rank gold">1</span>
              <div className="leader-info">
                <span className="leader-name">@samy_zen</span>
                <span className="leader-score">🌟 30 jours sans tabac</span>
              </div>
            </div>
            <div className="leader-item">
              <span className="badge-rank silver">2</span>
              <div className="leader-info">
                <span className="leader-name">@yasmine_m</span>
                <span className="leader-score">🌟 14 jours sans tabac</span>
              </div>
            </div>
            <div className="leader-item">
              <span className="badge-rank bronze">3</span>
              <div className="leader-info">
                <span className="leader-name">@karim_courage</span>
                <span className="leader-score">💪 8 jours sans tabac</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ========================================================================= */}
      {/* 👤 USER PROFILE MODAL (ONE-CLICK ON AVATAR OR USERNAME ANYWHERE)         */}
      {/* ========================================================================= */}
      <Modal
        show={showProfileModal}
        onHide={() => setShowProfileModal(false)}
        centered
        className="reddit-profile-modal"
        size="lg"
      >
        <div className="profile-modal-wrap">
          {profileLoading || !selectedUserProfile ? (
            <div className="profile-modal-loading">
              <div className="spinner-border text-primary"></div>
              <span>Chargement du profil...</span>
            </div>
          ) : (
            <>
              {/* Profile Cover / Header */}
              <div className="profile-cover-banner">
                <button className="profile-close-btn" onClick={() => setShowProfileModal(false)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="profile-body-content">
                {/* Profile Avatar & Primary Actions */}
                <div className="profile-avatar-row">
                  <div className="profile-avatar-lg">
                    {selectedUserProfile.user?.profilePhotoUrl ? (
                      <img src={selectedUserProfile.user.profilePhotoUrl} alt="Avatar" />
                    ) : (
                      <span>{getAvatarLetter(selectedUserProfile.user?.name, selectedUserProfile.user?.username)}</span>
                    )}
                  </div>

                  <div className="profile-action-buttons">
                    {authUser && selectedUserProfile.user?.id !== authUser.id && (
                      <>
                        <button
                          className={`btn-follow-lg ${selectedUserProfile.user?.following ? "following" : ""}`}
                          onClick={() => handleToggleFollow(selectedUserProfile.user?.id)}
                        >
                          {selectedUserProfile.user?.following ? "Abonné" : "+ S'abonner"}
                        </button>
                        <button
                          className="btn-chat-lg"
                          onClick={() => {
                            setShowProfileModal(false);
                            handleOpenChatWith(selectedUserProfile.user);
                          }}
                        >
                          <i className="bi bi-chat-dots-fill me-1"></i> Message Privé
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Name, Pseudonym & Confidentiality Status */}
                <div className="profile-identity">
                  <h3 className="profile-pseudo">@{selectedUserProfile.user?.username || "membre"}</h3>
                  {selectedUserProfile.user?.isDoctor ? (
                    <div className="profile-badge-doctor">
                      <i className="bi bi-patch-check-fill me-1"></i> {selectedUserProfile.user?.name} · Médecin Tabacologue
                    </div>
                  ) : (
                    <div className="profile-badge-patient">
                      <i className="bi bi-shield-lock-fill me-1"></i> Patient Anonymisé (Identité protégée)
                    </div>
                  )}
                </div>

                {/* Bio & Status */}
                <p className="profile-bio-text">
                  {selectedUserProfile.user?.bio || "Membre engagé dans la communauté NeuralConsult."}
                </p>

                {/* Stats Grid: Karma, Followers, Posts, Smoke-Free Milestone */}
                <div className="profile-stats-grid">
                  <div className="pstat-item">
                    <span className="pstat-val">{selectedUserProfile.karmaScore || 15}</span>
                    <span className="pstat-lbl">Karma Entraide</span>
                  </div>
                  <div className="pstat-item">
                    <span className="pstat-val">{selectedUserProfile.followersCount || 0}</span>
                    <span className="pstat-lbl">Abonnés</span>
                  </div>
                  <div className="pstat-item">
                    <span className="pstat-val">{selectedUserProfile.followingCount || 0}</span>
                    <span className="pstat-lbl">Abonnements</span>
                  </div>
                  <div className="pstat-item">
                    <span className="pstat-val">{selectedUserProfile.posts?.length || 0}</span>
                    <span className="pstat-lbl">Publications</span>
                  </div>
                </div>

                {/* User's Public Posts Stream */}
                <div className="profile-posts-section">
                  <h5>Publications partagées</h5>
                  {(selectedUserProfile.posts || []).length === 0 ? (
                    <div className="profile-no-posts">Cet utilisateur n'a pas encore partagé de publications.</div>
                  ) : (
                    <div className="profile-posts-list">
                      {selectedUserProfile.posts.map((p) => (
                        <div key={p.id} className="profile-post-card">
                          <div className="pcard-header">
                            <span className="pcard-sub">{p.serverName}</span>
                            <span className="meta-dot">·</span>
                            <span className="pcard-time">{formatDateAgo(p.createdAt)}</span>
                            {p.flair && <span className="pcard-flair">{p.flair}</span>}
                          </div>
                          {p.title && <div className="pcard-title">{p.title}</div>}
                          <div className="pcard-text">{p.content}</div>
                          {p.imageUrl && (
                            <img className="pcard-img" src={p.imageUrl} alt="Média" />
                          )}
                          <div className="pcard-footer">
                            <span><i className="bi bi-arrow-up-circle-fill text-warning me-1"></i> {p.upvotesCount || 0} upvotes</span>
                            <span><i className="bi bi-chat-fill text-primary ms-3 me-1"></i> {p.comments?.length || 0} commentaires</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 📝 CREATE POST MODAL (REDDIT STYLE)                                      */}
      {/* ========================================================================= */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered size="lg" className="reddit-modal">
        <div className="modal-content-reddit">
          <div className="modal-header-reddit">
            <h5 className="modal-title"><i className="bi bi-pencil-square me-2 text-primary"></i>Créer une publication</h5>
            <button className="btn-close-reddit" onClick={() => setShowCreateModal(false)}><i className="bi bi-x-lg"></i></button>
          </div>

          <form onSubmit={handleCreatePostSubmit}>
            <div className="modal-body-reddit">
              {/* Select Subreddit */}
              <div className="form-group-reddit">
                <label>Choisir la sous-communauté</label>
                <select
                  value={postDraft.serverId}
                  onChange={(e) => setPostDraft({ ...postDraft, serverId: e.target.value })}
                >
                  <option value="">r/tous · Fil Général</option>
                  {servers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} · {s.description}</option>
                  ))}
                </select>
              </div>

              {/* Select Flair */}
              <div className="form-group-reddit">
                <label>Étiquette / Flair de sujet</label>
                <div className="flair-select-row">
                  {FLAIRS.map((f) => (
                    <button
                      type="button"
                      key={f.label}
                      className={`flair-btn ${postDraft.flair === f.label ? "selected" : ""}`}
                      style={{ color: f.color }}
                      onClick={() => setPostDraft({ ...postDraft, flair: f.label })}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="form-group-reddit">
                <label>Titre de votre publication *</label>
                <input
                  type="text"
                  required
                  placeholder="Un titre clair et accrocheur (ex: 30 jours sans fumer ! Mon astuce du matin...)"
                  value={postDraft.title}
                  onChange={(e) => setPostDraft({ ...postDraft, title: e.target.value })}
                />
              </div>

              {/* Post Tabs: Text or Media */}
              <div className="post-tabs-nav">
                <button
                  type="button"
                  className={`tab-btn ${postTab === "text" ? "active" : ""}`}
                  onClick={() => setPostTab("text")}
                >
                  <i className="bi bi-card-text me-1"></i> Texte & Récit
                </button>
                <button
                  type="button"
                  className={`tab-btn ${postTab === "media" ? "active" : ""}`}
                  onClick={() => setPostTab("media")}
                >
                  <i className="bi bi-image me-1"></i> Image / Photo
                </button>
              </div>

              {/* Content Textarea */}
              <div className="form-group-reddit">
                <label>Corps du message</label>
                <textarea
                  rows="5"
                  placeholder="Partagez vos sentiments, difficultés surmontées, conseils ou questionnements..."
                  value={postDraft.content}
                  onChange={(e) => setPostDraft({ ...postDraft, content: e.target.value })}
                ></textarea>
              </div>

              {/* Image Input if tab is media */}
              {postTab === "media" && (
                <div className="form-group-reddit">
                  <label>URL de l'image / Photo</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={postDraft.imageUrl}
                    onChange={(e) => setPostDraft({ ...postDraft, imageUrl: e.target.value })}
                  />
                  {postDraft.imageUrl && (
                    <div className="img-preview-wrap mt-2">
                      <img src={postDraft.imageUrl} alt="Prévisualisation" style={{ maxHeight: "200px", borderRadius: "8px" }} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer-reddit">
              <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>Annuler</button>
              <button type="submit" className="btn-submit" disabled={actionLoading}>
                {actionLoading ? "Publication en cours..." : "Publier"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 🔄 REPOST MODAL                                                           */}
      {/* ========================================================================= */}
      <Modal show={showRepostModal} onHide={() => setShowRepostModal(false)} centered className="reddit-modal">
        <div className="modal-content-reddit">
          <div className="modal-header-reddit">
            <h5 className="modal-title"><i className="bi bi-arrow-repeat me-2 text-primary"></i>Republier ce témoignage</h5>
            <button className="btn-close-reddit" onClick={() => setShowRepostModal(false)}><i className="bi bi-x-lg"></i></button>
          </div>

          <div className="modal-body-reddit">
            <div className="form-group-reddit">
              <label>Votre mot d'accompagnement</label>
              <textarea
                rows="3"
                placeholder="Pourquoi cette publication vous inspire-t-elle ?"
                value={repostComment}
                onChange={(e) => setRepostComment(e.target.value)}
              ></textarea>
            </div>

            {targetRepostPost && (
              <div className="reddit-repost-box mt-3">
                <div className="repost-header">
                  <span>@{targetRepostPost.author?.username}</span>
                  <span className="meta-dot">·</span>
                  <span>{targetRepostPost.serverName}</span>
                </div>
                <div className="repost-title">{targetRepostPost.title}</div>
                <div className="repost-content">{targetRepostPost.content}</div>
              </div>
            )}
          </div>

          <div className="modal-footer-reddit">
            <button className="btn-cancel" onClick={() => setShowRepostModal(false)}>Annuler</button>
            <button className="btn-submit" onClick={handleRepostSubmit} disabled={actionLoading}>
              {actionLoading ? "Republication..." : "Republier"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 💬 REDDIT FLOATING DOCKED CHAT WIDGET                                     */}
      {/* ========================================================================= */}
      {chatDockOpen && (
        <div className="reddit-chat-dock">
          {/* Chat Header */}
          <div className="chat-dock-header">
            <div className="chat-title-wrap">
              <i className="bi bi-chat-dots-fill text-primary me-2"></i>
              <span>{activeChatTarget ? `@${activeChatTarget.username}` : "Discussions NeuralConsult"}</span>
            </div>
            <div className="chat-header-actions">
              {activeChatTarget && (
                <button className="chat-btn-back" onClick={() => setActiveChatTarget(null)} title="Liste des discussions">
                  <i className="bi bi-arrow-left"></i>
                </button>
              )}
              <button className="chat-btn-close" onClick={() => setChatDockOpen(false)} title="Fermer le chat">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          {/* Chat Body */}
          <div className="chat-dock-body">
            {!activeChatTarget ? (
              /* Conversations List & User Search */
              <div className="chat-contacts-view">
                <div className="chat-search-input">
                  <i className="bi bi-search"></i>
                  <input
                    type="text"
                    placeholder="Rechercher un membre pour chatter..."
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                  />
                </div>

                <div className="contacts-list">
                  {people
                    .filter((p) => !chatSearchQuery || p.username?.toLowerCase().includes(chatSearchQuery.toLowerCase()))
                    .map((contact) => (
                      <div
                        key={contact.id}
                        className="contact-item"
                        onClick={() => handleOpenChatWith(contact)}
                      >
                        <div className="contact-avatar">
                          {contact.profilePhotoUrl ? (
                            <img src={contact.profilePhotoUrl} alt="Avatar" />
                          ) : (
                            <span>{getAvatarLetter(contact.name, contact.username)}</span>
                          )}
                        </div>
                        <div className="contact-info">
                          <div className="contact-name">@{contact.username}</div>
                          <div className="contact-role">{contact.isDoctor ? "🩺 Médecin" : "Patient"}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              /* Active Message Stream */
              <div className="chat-stream-view">
                <div className="messages-scroll-area">
                  {chatMessages.length === 0 ? (
                    <div className="chat-empty">Démarrez votre conversation bienveillante avec @{activeChatTarget.username} !</div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.senderUsername === myProfile?.username || msg.outgoing;
                      return (
                        <div key={msg.id} className={`chat-bubble-wrap ${isMe ? "me" : "them"}`}>
                          <div className="chat-bubble">
                            <div className="chat-text">{msg.content}</div>
                            <div className="chat-time">{formatDateAgo(msg.createdAt)}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Input Bar */}
                <form className="chat-input-bar" onSubmit={handleSendChatMessage}>
                  <input
                    type="text"
                    placeholder="Écrire un message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button type="submit" disabled={!chatInput.trim()}>
                    <i className="bi bi-send-fill"></i>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 IMAGE LIGHTBOX MODAL                                                   */}
      {/* ========================================================================= */}
      {imageLightboxUrl && (
        <div className="image-lightbox-overlay" onClick={() => setImageLightboxUrl(null)}>
          <button className="lightbox-close"><i className="bi bi-x-lg"></i></button>
          <img src={imageLightboxUrl} alt="Zoom Média" />
        </div>
      )}
    </div>
  );
}
