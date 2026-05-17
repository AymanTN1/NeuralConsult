import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const emptyOverview = {
  viewer: null,
  posts: [],
  servers: [],
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
  const navigate = useNavigate();
  const { logout } = useAuth();
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [activeStory, setActiveStory] = useState(null);
  const [showArchives, setShowArchives] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState(null);
  const [showCreateServerModal, setShowCreateServerModal] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [serverForm, setServerForm] = useState({ name: "", description: "", visibility: "PUBLIC", iconUrl: "" });
  const [creatingServer, setCreatingServer] = useState(false);
  const [mockMembers, setMockMembers] = useState({});
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  const viewer = overview.viewer;
  const myPosts = useMemo(
    () => (overview.posts || []).filter((post) => post.author?.id === viewer?.id),
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

  const renderStories = () => {
    const storyList = [
      { id: "story-1", name: "Dr. Amrani", avatar: "", active: true, isDr: true, initial: "DA" },
      { id: "story-2", name: "Samy_Zen", avatar: "", active: true, initial: "SZ" },
      { id: "story-3", name: "PneumoCare", avatar: "", active: false, initial: "PC" },
      { id: "story-4", name: "Yasmine_M", avatar: "", active: true, initial: "YM" },
      { id: "story-5", name: "Anas_S", avatar: "", active: true, initial: "AS" },
      { id: "story-6", name: "SevrePure", avatar: "", active: false, initial: "SP" },
    ];

    return (
      <div className="instagram-stories-bar mb-3" style={{
        display: "flex",
        gap: "1.2rem",
        overflowX: "auto",
        padding: "1rem",
        background: "rgba(255, 255, 255, 0.8)",
        borderRadius: "16px",
        border: "1px solid rgba(59, 130, 246, 0.15)",
        scrollbarWidth: "none"
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", flexShrink: 0 }}>
          <div style={{
            width: "66px",
            height: "66px",
            borderRadius: "50%",
            padding: "3px",
            background: "linear-gradient(45deg, #3b82f6, #8b5cf6, #10b981)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }}>
            <div style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}>
              {viewer?.profilePhotoUrl ? (
                <img src={viewer.profilePhotoUrl} alt="Moi" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#3b82f6" }}>{avatarFallback(viewer?.displayName)}</div>
              )}
            </div>
            <div style={{
              position: "absolute",
              bottom: "0",
              right: "0",
              background: "#3b82f6",
              color: "#fff",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #fff",
              fontSize: "0.8rem",
              fontWeight: "bold"
            }}>+</div>
          </div>
          <span style={{ fontSize: "0.78rem", marginTop: "0.4rem", color: "#4b5563", fontWeight: 600 }}>Votre story</span>
        </div>

        {storyList.map((story) => (
          <div key={story.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", flexShrink: 0 }} onClick={() => setActiveStory(story)}>
            <div style={{
              width: "66px",
              height: "66px",
              borderRadius: "50%",
              padding: "3px",
              background: story.active ? "linear-gradient(45deg, #f59e0b, #ec4899, #8b5cf6)" : "rgba(156, 163, 175, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <div style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden"
              }}>
                {story.avatar ? (
                  <img src={story.avatar} alt={story.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: story.active ? "#ec4899" : "#9ca3af",
                    background: "rgba(243, 244, 246, 1)",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>{story.initial}</div>
                )}
              </div>
            </div>
            <span style={{ fontSize: "0.78rem", marginTop: "0.4rem", color: "#4b5563", fontWeight: 500 }}>
              {story.name} {story.isDr && "🩺"}
            </span>
          </div>
        ))}
      </div>
    );
  };


  const getActiveServer = () => (overview.servers || []).find(c => c.id === selectedServerId) || null;

  const createServer = async (e) => {
    e.preventDefault();
    if (!serverForm.name.trim()) return;
    setCreatingServer(true);
    try {
      const { data } = await api.post("/api/communities/servers", serverForm);
      setOverview(prev => ({ ...prev, circles: [...(prev.circles || []), { ...data, joined: true, myRole: "OWNER" }] }));
      setSelectedServerId(data.id);
      // Seed mock members for new server
      setMockMembers(prev => ({ ...prev, [data.id]: [
        { id: "m1", name: viewer?.displayName || viewer?.username || "Vous", username: viewer?.username, role: "OWNER", avatar: viewer?.profilePhotoUrl },
      ]}));
      setServerForm({ name: "", description: "", visibility: "PUBLIC", iconUrl: "" });
      setShowCreateServerModal(false);
      setToast("success", `Serveur "${data.name}" cree avec succes !`);
    } catch {
      // Create a local mock server if API fails (demo mode)
      const mockId = `local-${Date.now()}`;
      const mockServer = { id: mockId, name: serverForm.name, description: serverForm.description, visibility: serverForm.visibility, joined: true, myRole: "OWNER", memberCount: 1, createdAt: new Date().toISOString() };
      setOverview(prev => ({ ...prev, circles: [...(prev.circles || []), mockServer] }));
      setSelectedServerId(mockId);
      setMockMembers(prev => ({ ...prev, [mockId]: [
        { id: "m1", name: viewer?.displayName || viewer?.username || "Vous", username: viewer?.username, role: "OWNER", avatar: viewer?.profilePhotoUrl },
      ]}));
      setServerForm({ name: "", description: "", visibility: "PUBLIC", iconUrl: "" });
      setShowCreateServerModal(false);
      setToast("success", `Serveur "${serverForm.name}" cree (mode demo) !`);
    } finally {
      setCreatingServer(false);
    }
  };

  const changeMemberRole = (serverId, memberId, newRole) => {
    setMockMembers(prev => ({
      ...prev,
      [serverId]: (prev[serverId] || []).map(m => m.id === memberId ? { ...m, role: newRole } : m)
    }));
  };

  const kickMember = (serverId, memberId) => {
    setMockMembers(prev => ({
      ...prev,
      [serverId]: (prev[serverId] || []).filter(m => m.id !== memberId)
    }));
  };

  const renderServerMemberPanel = () => {
    const server = getActiveServer();
    if (!server) return null;
    const members = mockMembers[server.id] || (overview.people || []).slice(0, 8).map((p, i) => ({
      id: p.id || i,
      name: p.name,
      username: p.username,
      avatar: p.profilePhotoUrl,
      role: i === 0 ? "OWNER" : i < 2 ? "ADMIN" : i < 4 ? "MODERATOR" : "MEMBER"
    }));

    const roleOrder = ["OWNER", "ADMIN", "MODERATOR", "MEMBER"];
    const roleLabel = { OWNER: "👑 Propriétaire", ADMIN: "🛡️ Administrateurs", MODERATOR: "🔨 Modérateurs", MEMBER: "👤 Membres" };
    const roleColor = { OWNER: "#f59e0b", ADMIN: "#3b82f6", MODERATOR: "#8b5cf6", MEMBER: "#6b7280" };
    const grouped = roleOrder.reduce((acc, r) => { acc[r] = members.filter(m => m.role === r); return acc; }, {});
    const isAdmin = server.myRole === "OWNER" || server.myRole === "ADMIN";

    return (
      <aside className="social-space-sidepane">
        <section className="social-space-panel" style={{ position: "sticky", top: "100px" }}>
          <div className="social-space-panel-head">
            <div>
              <h3 style={{ fontSize: "1rem" }}>Membres</h3>
              <p>{server.memberCount || members.length} dans ce serveur</p>
            </div>
            {isAdmin && (
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setShowServerSettings(true)}>
                <i className="bi bi-gear" />
              </button>
            )}
          </div>
          <div style={{ maxHeight: "calc(100vh - 260px)", overflowY: "auto" }}>
            {roleOrder.map(role => grouped[role].length > 0 && (
              <div key={role}>
                <div className="discord-member-role-header" style={{ color: roleColor[role] }}>{roleLabel[role]} — {grouped[role].length}</div>
                {grouped[role].map(member => (
                  <button key={member.id} type="button" className="discord-member-item" onClick={() => isAdmin && member.role !== "OWNER" && setShowServerSettings(true)}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {member.avatar
                        ? <img src={member.avatar} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#374151" }}>{avatarFallback(member.name)}</span>
                      }
                    </div>
                    <div className="discord-member-item-info">
                      <strong>{member.name}</strong>
                      <span>{member.username ? `@${member.username}` : role}</span>
                    </div>
                    <span className="ms-auto" style={{ fontSize: "0.65rem", background: roleColor[role] + "22", color: roleColor[role], padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
                      {role === "OWNER" ? "Owner" : role === "ADMIN" ? "Admin" : role === "MODERATOR" ? "Mod" : ""}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </section>
      </aside>
    );
  };

  const renderDiscordServerSidebar = () => {
    const myCircles = (overview.servers || []).filter(c => c.joined);
    return (
      <div className="discord-server-sidebar">
        <button type="button" className={`discord-server-btn ${!selectedServerId ? "is-active" : ""}`} title="Fil global" onClick={() => setSelectedServerId(null)}>
          <i className="bi bi-house-heart-fill" />
        </button>
        {myCircles.length > 0 && <div className="discord-server-divider" />}
        {myCircles.map(circle => (
          <button key={circle.id} type="button" className={`discord-server-btn ${selectedServerId === circle.id ? "is-active" : ""}`} title={circle.name} onClick={() => setSelectedServerId(circle.id)}>
            {circle.iconUrl
              ? <img src={circle.iconUrl} alt={circle.name} />
              : <span>{avatarFallback(circle.name)}</span>
            }
          </button>
        ))}
        <div className="discord-server-divider" />
        <button type="button" className="discord-server-btn" title="Creer un serveur" onClick={() => setShowCreateServerModal(true)} style={{ background: "#f0fdf4", color: "#16a34a", fontSize: "1.4rem" }}>
          <i className="bi bi-plus-lg" />
        </button>
      </div>
    );
  };

  const renderFeed = () => {
    const activeCircle = getActiveServer();
    const feedPosts = activeCircle ? (overview.posts || []).filter(p => p.serverId === activeCircle.id) : (overview.posts || []);

    return (
      <div className="social-space-column">
        {!activeCircle && renderStories()}
        {activeCircle && (
          <section className="social-space-panel" style={{ background: "linear-gradient(135deg, #667eea22, #764ba222)", border: "1px solid rgba(102,126,234,0.2)" }}>
            <div className="d-flex align-items-center gap-3">
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "#764ba2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 700, color: "white", flexShrink: 0 }}>
                {activeCircle.iconUrl ? <img src={activeCircle.iconUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }} /> : avatarFallback(activeCircle.name)}
              </div>
              <div className="flex-grow-1">
                <h3 className="mb-0 fw-bold"># {activeCircle.name}</h3>
                <p className="mb-1 text-muted small">{activeCircle.description || "Espace d'entraide communautaire."}</p>
                <div className="d-flex gap-2 flex-wrap">
                  <span className="badge" style={{ background: "#764ba222", color: "#764ba2" }}><i className="bi bi-people-fill me-1" />{activeCircle.memberCount || 1} membres</span>
                  {activeCircle.myRole === "OWNER" && <span className="badge" style={{ background: "#fef3c722", color: "#f59e0b" }}>👑 Propriétaire</span>}
                  {activeCircle.myRole === "ADMIN" && <span className="badge" style={{ background: "#dbeafe", color: "#3b82f6" }}>🛡️ Admin</span>}
                  <span className="badge" style={{ background: "#f0fdf4", color: "#16a34a" }}>🔓 {activeCircle.visibility === "PRIVATE" ? "Privé" : "Public"}</span>
                </div>
              </div>
              {(activeCircle.myRole === "OWNER" || activeCircle.myRole === "ADMIN") && (
                <button type="button" className="btn btn-light btn-sm rounded-circle" onClick={() => setShowServerSettings(true)}>
                  <i className="bi bi-gear-fill" />
                </button>
              )}
            </div>
          </section>
        )}

        <section className="social-space-panel social-space-composer">
          <div className="social-space-panel-head">
            <div>
              <h3>Publier dans le fil</h3>
              <p>{activeCircle ? `Dans #${activeCircle.name}` : "Une victoire, une photo, une pensee ou une difficulte du jour."}</p>
            </div>
          </div>
          <form onSubmit={publishPost}>
            <textarea
              className="form-control social-space-textarea"
              rows="3"
              placeholder={activeCircle ? `Ecrire dans #${activeCircle.name}...` : "Qu'est-ce qui merite d'etre partage aujourd'hui ?"}
              value={composer.content}
              onChange={(event) => setComposer((previous) => ({ ...previous, content: event.target.value, serverId: activeCircle?.id || "" }))}
            />
            {composer.imageUrl && (
              <div className="social-space-upload-preview">
                <img src={composer.imageUrl} alt="Apercu du post" />
                <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => setComposer((previous) => ({ ...previous, imageUrl: "" }))}>Retirer</button>
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

        {loading ? (
          <section className="social-space-panel"><p className="muted-text mb-0">Chargement du fil...</p></section>
        ) : feedPosts.length === 0 ? (
          <section className="social-space-empty p-5 text-center">
            <div className="mb-3"><i className={`bi ${activeCircle ? "bi-hash" : "bi-inbox"} fs-1 text-muted`} /></div>
            <h3>{activeCircle ? `#${activeCircle.name} est encore calme.` : "Le fil attend votre premiere histoire."}</h3>
            <p>{activeCircle ? "Soyez le premier à partager quelque chose avec ce groupe." : "Publiez une photo, un petit progres ou un moment difficile pour demarrer les echanges."}</p>
          </section>
        ) : (
          feedPosts.map(renderPostCard)
        )}
      </div>
    );
  };


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
          {(overview.servers || []).map((circle) => (
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
        <div className="social-space-thread-head p-3 border-bottom d-flex align-items-center justify-content-between">
          <h3 className="mb-0 fs-5 fw-bold">Discussions</h3>
          <button type="button" className="btn btn-link p-0 text-dark">
            <i className="bi bi-pencil-square fs-5" />
          </button>
        </div>
        <div className="social-space-thread-scroll">
          {conversations.length === 0 ? (
            <div className="p-4 text-center">
              <p className="muted-text mb-0">Ajoutez un ami pour demarrer une conversation.</p>
            </div>
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
                  <div className="d-flex justify-content-between align-items-center">
                    <strong>{conversation.counterpartName}</strong>
                    {conversation.unreadCount > 0 && <span className="badge rounded-circle bg-primary p-1" style={{ width: '8px', height: '8px' }}> </span>}
                  </div>
                  <span>{conversation.lastMessage || "Nouveau message..."}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="social-space-thread-panel">
        {!activeChat ? (
          <div className="social-space-thread-empty flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center p-5">
            <div className="rounded-circle border border-2 border-dark p-3 mb-3">
              <i className="bi bi-send fs-1" />
            </div>
            <h3>Vos messages</h3>
            <p className="muted-text">Envoyez des messages directs a vos amis pour un soutien plus personnel.</p>
            <button type="button" className="btn btn-primary" onClick={() => setActiveSection("explore")}>Chercher des amis</button>
          </div>
        ) : (
          <>
            <div className="social-space-thread-head p-3 border-bottom bg-white d-flex align-items-center gap-3">
              <button type="button" className="social-space-user-head is-inline" onClick={() => openProfile(activeChat.counterpartId || activeChat.id)}>
                {renderAvatar(
                  {
                    profilePhotoUrl: activeChat.counterpartPhotoUrl || activeChat.profilePhotoUrl,
                    name: activeChat.counterpartName || activeChat.name,
                    username: activeChat.counterpartUsername || activeChat.username
                  },
                  "social-space-avatar"
                )}
                <div className="ms-2">
                  <strong className="d-block">{activeChat.counterpartName || activeChat.name}</strong>
                  <span className="muted-text" style={{ fontSize: '0.8rem' }}>{activeChat.counterpartUsername ? `@${activeChat.counterpartUsername}` : activeChat.counterpartRole || activeChat.role}</span>
                </div>
              </button>
            </div>

            <div className="social-space-thread-body p-4 flex-grow-1 overflow-auto bg-white">
              {messageLoading ? (
                <p className="muted-text mb-0">Chargement des messages...</p>
              ) : (
                chatMessages.map((message) => (
                  <div key={message.id} className={`social-space-message-bubble ${message.mine ? "is-mine" : ""}`}>
                    {message.sharedPostId && (
                      <div className="social-space-shared-post mb-2 p-2 border rounded bg-light">
                        {message.sharedPostImageUrl && <img src={message.sharedPostImageUrl} alt={message.sharedPostPreview || "Post partage"} className="img-fluid rounded mb-2" />}
                        <div>
                          <strong className="d-block small">{message.sharedPostAuthorName}</strong>
                          <span className="small text-muted">{message.sharedPostPreview}</span>
                        </div>
                      </div>
                    )}
                    {message.content && <p className="mb-1">{message.content}</p>}
                    <small className="opacity-50" style={{ fontSize: '0.7rem' }}>{formatDate(message.createdAt)}</small>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-white border-top">
              <form className="social-space-thread-form d-flex gap-2 align-items-center" onSubmit={sendMessage}>
                <div className="flex-grow-1 position-relative">
                  <input 
                    className="form-control rounded-pill px-4 py-2" 
                    value={chatDraft} 
                    onChange={(event) => setChatDraft(event.target.value)} 
                    placeholder="Ecrire un message..." 
                  />
                </div>
                <button type="submit" className="btn btn-link text-primary fw-bold text-decoration-none" disabled={!chatDraft.trim()}>Envoyer</button>
              </form>
            </div>
          </>
        )}
      </section>
    </div>
  );

  const renderProfile = () => (
    <div className="social-space-column">
      <section className="social-space-panel social-space-profile-editor" style={{ position: 'relative', zIndex: 100 }}>
        <div className="social-space-panel-head">
          <div>
            <h3>Votre identite communautaire</h3>
            <p>Le username est ce qui sera vu par la communaute. La photo reste optionnelle.</p>
          </div>
          <div className="position-relative">
            <button 
              type="button" 
              className="btn btn-outline-dark btn-sm rounded-circle p-2" 
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <i className="bi bi-three-dots-vertical" />
            </button>
            {showOptionsMenu && (
              <div className="profile-option-menu">
                <button type="button" className="profile-option-item" onClick={() => { navigate("/profile"); setShowOptionsMenu(false); }}>
                  <i className="bi bi-gear" /> <span>Parametres</span>
                </button>
                <button type="button" className="profile-option-item" onClick={() => { setShowBlockedModal(true); setShowOptionsMenu(false); }}>
                  <i className="bi bi-slash-circle" /> <span>Comptes bloques</span>
                </button>
                <button type="button" className="profile-option-item" onClick={() => { setShowArchives(true); setShowOptionsMenu(false); }}>
                  <i className="bi bi-archive" /> <span>Archives stories</span>
                </button>
                <hr className="my-1" />
                <button type="button" className="profile-option-item text-danger" onClick={async () => { setShowOptionsMenu(false); await logout(); navigate("/login"); }}>
                  <i className="bi bi-box-arrow-right" /> <span>Deconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
        <form onSubmit={saveProfile}>
          <div className="social-space-profile-layout">
            <div className="social-space-profile-preview position-relative" style={{ zIndex: 10 }}>
              <div 
                className="profile-avatar-interactive rounded-circle overflow-hidden d-flex align-items-center justify-content-center" 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{ width: '120px', height: '120px', margin: '0 auto', border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              >
                {profileForm.profilePhotoUrl ? (
                  <img src={profileForm.profilePhotoUrl} className="w-100 h-100 object-fit-cover" alt="Profile" />
                ) : (
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light text-primary fs-1 fw-bold">
                    {(profileForm.username || viewer?.displayName || "NC").substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="profile-avatar-overlay">
                  <i className="bi bi-camera-fill fs-3" />
                </div>
              </div>

              {showProfileMenu && (
                <div className="profile-option-menu" style={{ zIndex: 1000 }}>
                  <label className="profile-option-item mb-0 cursor-pointer">
                    <i className="bi bi-image" /> 
                    <span>Choisir une photo</span>
                    <input type="file" accept="image/*" className="d-none" onChange={(event) => { handleProfilePhoto(event, "profile"); setShowProfileMenu(false); }} />
                  </label>
                  <button type="button" className="profile-option-item" onClick={() => { setActiveSection("feed"); setShowProfileMenu(false); }}>
                    <i className="bi bi-plus-circle" /> <span>Ajouter une story</span>
                  </button>
                  <button type="button" className="profile-option-item text-danger" onClick={() => { setProfileForm(p => ({ ...p, profilePhotoUrl: "" })); setShowProfileMenu(false); }}>
                    <i className="bi bi-trash" /> <span>Supprimer la photo</span>
                  </button>
                </div>
              )}
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
              <div className="social-space-composer-row mt-3">
                <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                  {savingProfile ? "Enregistrement..." : "Enregistrer le profil"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </section>

      {showArchives ? (
        <section className="social-space-panel">
          <div className="social-space-panel-head d-flex align-items-center gap-3">
            <button type="button" className="btn btn-link p-0 text-dark" onClick={() => setShowArchives(false)}>
              <i className="bi bi-arrow-left fs-4" />
            </button>
            <div>
              <h3>Archives des stories</h3>
              <p>Retrouvez vos moments passes, classes par date.</p>
            </div>
          </div>
          <div className="row g-3 mt-2">
            {[
              { date: "12 Mai 2024", time: "14:20", text: "Premier jour sans tabac !", color: "#3b82f6" },
              { date: "10 Mai 2024", time: "09:15", text: "Petit footing matinal", color: "#8b5cf6" },
              { date: "05 Mai 2024", time: "22:45", text: "Moment de detente", color: "#10b981" }
            ].map((arch, idx) => (
              <div key={idx} className="col-6 col-md-4">
                <div className="rounded-3 p-3 text-white d-flex flex-column justify-content-between shadow-sm" style={{ height: '160px', background: arch.color }}>
                  <span className="small opacity-75">{arch.date} · {arch.time}</span>
                  <strong className="small">{arch.text}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <>
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
        </>
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
        {renderDiscordServerSidebar()}

        <aside className="social-space-sidebar">
          <div className="social-space-viewer-card align-items-center">
            {renderAvatar({ profilePhotoUrl: viewer?.profilePhotoUrl, name: viewer?.displayName, username: viewer?.username })}
            <div className="d-flex flex-column overflow-hidden text-truncate">
              {(!viewer?.displayName || viewer.displayName === viewer.username || viewer.displayName === `@${viewer.username}`) ? (
                <strong className="text-truncate">{viewer?.username ? `@${viewer.username}` : "Votre espace"}</strong>
              ) : (
                <>
                  <strong className="text-truncate">{viewer?.displayName}</strong>
                  <span className="text-truncate text-muted" style={{ fontSize: '0.85rem' }}>{viewer?.username ? `@${viewer.username}` : "Configurez votre profil"}</span>
                </>
              )}
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

        {activeSection === "feed" && selectedServerId ? renderServerMemberPanel() : (
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
        )}
      </section>

      {/* ── Create Server Modal ── */}
      <Modal show={showCreateServerModal} onHide={() => setShowCreateServerModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>✨ Créer un nouveau serveur</Modal.Title>
        </Modal.Header>
        <form onSubmit={createServer}>
          <Modal.Body>
            <p className="text-muted small mb-4">Un serveur est un espace privé pour votre groupe. Donnez-lui un nom, une description et une image.</p>
            <div className="mb-3">
              <label className="form-label fw-semibold">Nom du serveur *</label>
              <input className="form-control" placeholder="ex: Équipe Cardiologie, Support sevrage..." value={serverForm.name} onChange={e => setServerForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Description</label>
              <textarea className="form-control" rows="2" placeholder="Décrivez l'objectif de ce serveur..." value={serverForm.description} onChange={e => setServerForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Visibilité</label>
              <select className="form-select" value={serverForm.visibility} onChange={e => setServerForm(p => ({ ...p, visibility: e.target.value }))}>
                <option value="PUBLIC">🔓 Public — Tout le monde peut rejoindre</option>
                <option value="PRIVATE">🔐 Privé — Sur invitation uniquement</option>
              </select>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCreateServerModal(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={creatingServer || !serverForm.name.trim()}>
              {creatingServer ? "Création..." : "Créer le serveur"}
            </button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* ── Server Settings Modal ── */}
      <Modal show={showServerSettings} onHide={() => setShowServerSettings(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>⚙️ Gérer le serveur — {getActiveServer()?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(() => {
            const server = getActiveServer();
            if (!server) return null;
            const members = mockMembers[server.id] || (overview.people || []).slice(0, 8).map((p, i) => ({ id: p.id || i, name: p.name, username: p.username, avatar: p.profilePhotoUrl, role: i === 0 ? "OWNER" : i < 2 ? "ADMIN" : "MEMBER" }));
            const roleColor = { OWNER: "#f59e0b", ADMIN: "#3b82f6", MODERATOR: "#8b5cf6", MEMBER: "#6b7280" };
            return (
              <div>
                <h6 className="fw-bold mb-3">Membres du serveur ({members.length})</h6>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Membre</th>
                        <th>Rôle actuel</th>
                        <th>Changer le rôle</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(member => (
                        <tr key={member.id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                                {member.avatar ? <img src={member.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{avatarFallback(member.name)}</span>}
                              </div>
                              <div>
                                <div className="fw-semibold">{member.name}</div>
                                {member.username && <div className="text-muted small">@{member.username}</div>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge rounded-pill" style={{ background: roleColor[member.role] + "22", color: roleColor[member.role], fontWeight: 700 }}>
                              {member.role === "OWNER" ? "👑 Owner" : member.role === "ADMIN" ? "🛡️ Admin" : member.role === "MODERATOR" ? "🔨 Mod" : "👤 Membre"}
                            </span>
                          </td>
                          <td>
                            {member.role !== "OWNER" ? (
                              <select className="form-select form-select-sm" style={{ width: "auto" }} value={member.role} onChange={e => changeMemberRole(server.id, member.id, e.target.value)}>
                                <option value="ADMIN">🛡️ Admin</option>
                                <option value="MODERATOR">🔨 Modérateur</option>
                                <option value="MEMBER">👤 Membre</option>
                              </select>
                            ) : <span className="text-muted small">—</span>}
                          </td>
                          <td>
                            {member.role !== "OWNER" ? (
                              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => kickMember(server.id, member.id)}>
                                <i className="bi bi-person-dash" /> Retirer
                              </button>
                            ) : <span className="text-muted small">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-outline-secondary" onClick={() => setShowServerSettings(false)}>Fermer</button>
        </Modal.Footer>
      </Modal>

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

      <Modal show={Boolean(activeStory)} onHide={() => setActiveStory(null)} centered size="md" className="story-viewer-modal">
        <Modal.Body className="p-0 position-relative bg-dark" style={{ height: '70vh', borderRadius: '16px', overflow: 'hidden' }}>
          {activeStory && (
            <>
              <div className="story-progress-bar position-absolute top-0 w-100 p-2 d-flex gap-1" style={{ zIndex: 10 }}>
                <div className="flex-grow-1 bg-white opacity-50 rounded-pill" style={{ height: '2px' }}>
                  <div className="bg-white h-100 rounded-pill" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div className="story-header position-absolute top-0 w-100 p-3 d-flex align-items-center gap-2" style={{ zIndex: 10, marginTop: '8px' }}>
                <img src={activeStory.avatar || "/icons/icon_Neural_Consult_Sevrage.png"} className="rounded-circle border border-white" style={{ width: '32px', height: '32px' }} alt="" />
                <span className="text-white fw-bold small">{activeStory.name}</span>
                <span className="text-white-50 small">12h</span>
                <button type="button" className="btn-close btn-close-white ms-auto" onClick={() => setActiveStory(null)}></button>
              </div>
              <div className="story-content w-100 h-100 d-flex align-items-center justify-content-center">
                {activeStory.avatar ? (
                  <img src={activeStory.avatar} className="w-100 h-100 object-fit-cover" alt="" />
                ) : (
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white fs-1 fw-bold" style={{ background: 'linear-gradient(45deg, #f59e0b, #ec4899, #8b5cf6)' }}>
                    {activeStory.initial}
                  </div>
                )}
              </div>
              <div className="story-footer position-absolute bottom-0 w-100 p-3 d-flex gap-2" style={{ zIndex: 10 }}>
                <input className="form-control form-control-sm bg-transparent border-white text-white rounded-pill" placeholder="Repondre a la story..." />
                <button className="btn btn-link text-white p-0"><i className="bi bi-heart fs-4"></i></button>
                <button className="btn btn-link text-white p-0"><i className="bi bi-send fs-4"></i></button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={showBlockedModal} onHide={() => setShowBlockedModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Comptes bloqués</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center text-muted p-4">
            <i className="bi bi-shield-check fs-1 mb-2"></i>
            <p>Vous n'avez bloqué aucun compte pour le moment.</p>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Communities;
