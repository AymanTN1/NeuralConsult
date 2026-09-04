import React, { useEffect, useMemo, useState, useRef } from "react";
import Modal from "react-bootstrap/Modal";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getDemoCommunityData } from "../services/demoMockService";
import { isDoctor } from "../utils/roles";

// Fallback initial subreddits
const DEFAULT_SUBREDDITS = [
  {
    id: "all",
    name: "r/tous",
    label: "Accueil Global",
    icon: "bi-globe2",
    color: "#3b82f6",
    desc: "Le fil unifié de tous les témoignages, conseils médicaux et victoires de sevrage.",
    members: "1 420 membres",
    online: "54 en ligne"
  },
  {
    id: "victoires",
    name: "r/victoires_sevrage",
    label: "Victoires & Étapes",
    icon: "bi-trophy-fill",
    color: "#10b981",
    desc: "Célébrez chaque jour gagné sans tabac : J+1, J+7, J+30, 1 an... Chaque victoire renforce le collectif !",
    members: "920 membres",
    online: "28 en ligne"
  },
  {
    id: "entraide",
    name: "r/entraide_urgences",
    label: "SOS & Urgences Craving",
    icon: "bi-shield-fill-exclamation",
    color: "#ef4444",
    desc: "Envie aiguë ou pic d'anxiété ? Entraide immédiate 24/7 et techniques d'urgence validées par les tabacologues.",
    members: "680 membres",
    online: "22 en ligne"
  },
  {
    id: "conseils",
    name: "r/conseils_tabacologues",
    label: "Conseils Médicaux",
    icon: "bi-heart-pulse-fill",
    color: "#8b5cf6",
    desc: "Recommandations cliniques, réponses scientifiques aux questions fréquentes et accompagnement médicalisé.",
    members: "1 210 membres",
    online: "39 en ligne"
  },
  {
    id: "tns",
    name: "r/substituts_tns",
    label: "Substituts & Traitements",
    icon: "bi-capsule",
    color: "#f59e0b",
    desc: "Échanges autour des patchs, gommes, inhaleurs, varénicline et ajustements des dosages nicotiniques.",
    members: "510 membres",
    online: "15 en ligne"
  },
  {
    id: "sport",
    name: "r/sport_et_bienetre",
    label: "Sport & Respiration",
    icon: "bi-lungs-fill",
    color: "#06b6d4",
    desc: "Reprise d'activité physique, cohérence cardiaque, gestion du stress et récupération de la capacité respiratoire.",
    members: "560 membres",
    online: "18 en ligne"
  }
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

  const isDoc = Boolean(isDoctor(authUser) || authUser?.roles?.includes("ROLE_DOCTOR") || authUser?.email === "ayman.tantani@uit.ac.ma");

  // Core Community State
  const [posts, setPosts] = useState([]);
  const [servers, setServers] = useState([]);
  const [people, setPeople] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Resolved public identity of the logged-in viewer
  const resolvedProfile = useMemo(() => {
    if (isDoc) {
      return {
        id: "user-tantani",
        name: authUser?.fullName || "Dr. Ayman Tantani",
        username: "dr_tantani",
        role: "Médecin Tabacologue",
        isDoctor: true,
        profilePhotoUrl: authUser?.profilePhotoUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
        smokeFreeStatus: "Médecin Référent"
      };
    }
    if (myProfile) {
      return myProfile;
    }
    if (authUser) {
      return {
        id: authUser.id || "user-viewer",
        name: authUser.fullName || "Membre NeuralConsult",
        username: authUser.username || (authUser.email ? authUser.email.split("@")[0] : "membre_actif"),
        role: "Patient en Sevrage",
        isDoctor: false,
        profilePhotoUrl: authUser.profilePhotoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        smokeFreeStatus: "Suivi actif"
      };
    }
    return null;
  }, [authUser, myProfile, isDoc]);

  // Filters & Navigation - default to "new" so new posts appear on top
  const [activeSubreddit, setActiveSubreddit] = useState("all");
  const [activeFilter, setActiveFilter] = useState("new"); // new, hot, top, discussed
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
    flair: isDoc ? "🩺 Conseil Médecin" : "🏆 Victoire J+30",
    content: "",
    imageUrl: "",
    serverId: ""
  });
  const [postTab, setPostTab] = useState("text"); // text, media, link
  const [imageUploadMode, setImageUploadMode] = useState("local"); // "local" | "url"
  const [localImageMeta, setLocalImageMeta] = useState(null); // { name, size, originalSize }
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef(null);
  const [repostComment, setRepostComment] = useState("");

  // Post Actions & Dropdown Management
  const [activePostMenuId, setActivePostMenuId] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDraft, setEditDraft] = useState({ id: null, title: "", content: "", flair: "" });
  const [showReportModal, setShowReportModal] = useState(false);
  const [postToReport, setPostToReport] = useState(null);
  const [reportReason, setReportReason] = useState("misinformation");
  const [hiddenPostIds, setHiddenPostIds] = useState(new Set());

  // Close post menu on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      setActivePostMenuId(null);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

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

      const data = socialRes?.data;
      if (data && data.posts && data.posts.length > 0) {
        setPosts(data.posts);
        setServers(data.servers && data.servers.length > 0 ? data.servers : DEFAULT_SUBREDDITS);
        setPeople(data.people || []);
        setMyProfile(data.viewer || null);
        setConversations(data.conversations || []);
      } else {
        const fallback = getDemoCommunityData();
        setPosts(fallback.posts || []);
        setServers(fallback.servers && fallback.servers.length > 0 ? fallback.servers : DEFAULT_SUBREDDITS);
        setPeople(fallback.people || []);
        setMyProfile(fallback.viewer || null);
        setConversations(fallback.conversations || []);
      }

      setNotifications(notifRes?.data || []);
      setUnreadNotifsCount(summaryRes?.data?.unreadCount || 0);
    } catch (err) {
      console.error("Error loading community:", err);
      const fallback = getDemoCommunityData();
      setPosts(fallback.posts || []);
      setServers(fallback.servers && fallback.servers.length > 0 ? fallback.servers : DEFAULT_SUBREDDITS);
      setPeople(fallback.people || []);
      setMyProfile(fallback.viewer || null);
      setConversations(fallback.conversations || []);
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

  // Image Compression & Processing Helpers
  const formatFileSize = (bytes) => {
    if (!bytes || bytes <= 0) return "";
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const compressImageFile = (file) => {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        reject(new Error("Fichier non reconnu comme image."));
        return;
      }

      // Preserve animated GIF, SVG, or small image (< 180 Ko)
      if (file.type === "image/gif" || file.type === "image/svg+xml" || file.size < 180 * 1024) {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            dataUrl: e.target.result,
            size: file.size,
            originalSize: file.size,
            name: file.name
          });
        };
        reader.onerror = () => reject(new Error("Erreur de lecture du fichier."));
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 1280;
          let { width, height } = img;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.82 quality
          const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
          const head = "data:image/jpeg;base64,";
          const approxBytes = Math.round((dataUrl.length - head.length) * 0.75);

          resolve({
            dataUrl,
            size: approxBytes,
            originalSize: file.size,
            name: file.name
          });
        };
        img.onerror = () => {
          resolve({
            dataUrl: e.target.result,
            size: file.size,
            originalSize: file.size,
            name: file.name
          });
        };
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier."));
      reader.readAsDataURL(file);
    });
  };

  const handleProcessImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Veuillez choisir un fichier image (JPG, PNG, WebP, GIF...)", "warning");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      showToast("Cette image est trop volumineuse (max 20 Mo)", "warning");
      return;
    }

    try {
      const result = await compressImageFile(file);
      setPostDraft((prev) => ({ ...prev, imageUrl: result.dataUrl }));
      setLocalImageMeta({
        name: result.name,
        size: result.size,
        originalSize: result.originalSize
      });
      setImageUploadMode("local");
      showToast("📸 Photo importée et optimisée avec succès !");
    } catch (err) {
      showToast("Erreur lors du traitement de l'image.", "danger");
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessImageFile(file);
    }
    if (e.target) e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingFile) setIsDraggingFile(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDropImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleProcessImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setPostDraft((prev) => ({ ...prev, imageUrl: "" }));
    setLocalImageMeta(null);
  };

  // Create Post Submit
  const handleCreatePostSubmit = async (e) => {
    e?.preventDefault();
    if (!postDraft.title.trim() && !postDraft.content.trim() && !postDraft.imageUrl.trim()) {
      showToast("Veuillez saisir un titre, un message ou ajouter une photo.", "warning");
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        title: postDraft.title.trim() || "Photo partagée",
        flair: postDraft.flair || (isDoc ? "🩺 Conseil Médecin" : "🏆 Victoire J+30"),
        content: postDraft.content.trim(),
        imageUrl: postDraft.imageUrl.trim() || null,
        serverId: postDraft.serverId || "all",
        author: resolvedProfile ? {
          id: resolvedProfile.id,
          name: resolvedProfile.name,
          username: resolvedProfile.username,
          profilePhotoUrl: resolvedProfile.profilePhotoUrl,
          role: resolvedProfile.role,
          isDoctor: resolvedProfile.isDoctor,
          smokeFreeStatus: resolvedProfile.smokeFreeStatus
        } : null
      };
      const res = await api.post("/api/communities/social/posts", payload);
      if (res?.data) {
        setPosts((prev) => [res.data, ...prev.filter(p => p.id !== res.data.id)]);
        setActiveFilter("new");
        setActiveSubreddit("all");
        setActiveFlair(null);
        setShowCreateModal(false);
        setPostDraft({
          title: "",
          flair: isDoc ? "🩺 Conseil Médecin" : "🏆 Victoire J+30",
          content: "",
          imageUrl: "",
          serverId: ""
        });
        setLocalImageMeta(null);
        showToast("🎉 Publication créée avec succès !");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur création post", "danger");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Post (Own Post)
  const handleDeletePost = async (postId) => {
    if (!postId) return;
    try {
      setActionLoading(true);
      await api.delete(`/api/communities/social/posts/${postId}`).catch(() => ({ data: null }));

      // Remove from main feed
      setPosts((prev) => prev.filter((p) => p.id !== postId));

      // Remove from profile modal if open
      if (selectedUserProfile?.posts) {
        setSelectedUserProfile((prev) => ({
          ...prev,
          posts: prev.posts.filter((p) => p.id !== postId)
        }));
      }

      // Sync demo localStorage
      try {
        const stored = JSON.parse(localStorage.getItem("nc_demo_community_posts") || "[]");
        const filtered = stored.filter((p) => p.id !== postId);
        localStorage.setItem("nc_demo_community_posts", JSON.stringify(filtered));
      } catch (e) {}

      setShowDeleteConfirmModal(false);
      setPostToDelete(null);
      setActivePostMenuId(null);
      showToast("🗑️ Votre publication a été supprimée avec succès.");
    } catch (err) {
      showToast("Impossible de supprimer cette publication.", "danger");
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Post (Own Post)
  const handleEditPostSubmit = async (e) => {
    e?.preventDefault();
    if (!editDraft.id) return;
    if (!editDraft.title.trim() && !editDraft.content.trim()) {
      showToast("Veuillez saisir un titre ou un contenu.", "warning");
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        title: editDraft.title.trim(),
        content: editDraft.content.trim(),
        flair: editDraft.flair
      };

      await api.put(`/api/communities/social/posts/${editDraft.id}`, payload).catch(() => ({ data: null }));

      // Update in posts state
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editDraft.id
            ? { ...p, title: payload.title, content: payload.content, flair: payload.flair, isEdited: true }
            : p
        )
      );

      // Update in selectedUserProfile if open
      if (selectedUserProfile?.posts) {
        setSelectedUserProfile((prev) => ({
          ...prev,
          posts: prev.posts.map((p) =>
            p.id === editDraft.id
              ? { ...p, title: payload.title, content: payload.content, flair: payload.flair, isEdited: true }
              : p
          )
        }));
      }

      // Sync demo localStorage
      try {
        const stored = JSON.parse(localStorage.getItem("nc_demo_community_posts") || "[]");
        const idx = stored.findIndex((p) => p.id === editDraft.id);
        if (idx !== -1) {
          stored[idx] = { ...stored[idx], title: payload.title, content: payload.content, flair: payload.flair, isEdited: true };
          localStorage.setItem("nc_demo_community_posts", JSON.stringify(stored));
        }
      } catch (e) {}

      setShowEditModal(false);
      setEditDraft({ id: null, title: "", content: "", flair: "" });
      setActivePostMenuId(null);
      showToast("✏️ Publication mise à jour avec succès !");
    } catch (err) {
      showToast("Erreur lors de la modification.", "danger");
    } finally {
      setActionLoading(false);
    }
  };

  // Pin / Unpin Post
  const handleTogglePinPost = (postId) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextPinned = !p.isPinned;
          showToast(nextPinned ? "📌 Publication épinglée en tête de fil." : "Publication détachée.");
          return { ...p, isPinned: nextPinned };
        }
        return p;
      })
    );
    setActivePostMenuId(null);
  };

  // Hide Post
  const handleHidePost = (postId) => {
    setHiddenPostIds((prev) => new Set([...prev, postId]));
    setActivePostMenuId(null);
    showToast("👁️‍🗨️ Cette publication a été masquée de votre fil.");
  };

  // Report Post
  const handleReportPostSubmit = (e) => {
    e?.preventDefault();
    setShowReportModal(false);
    setPostToReport(null);
    setActivePostMenuId(null);
    showToast("🛡️ Signalement transmis à l'équipe médicale de modération. Merci !");
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
        repostComment: repostComment.trim(),
        author: resolvedProfile ? {
          id: resolvedProfile.id,
          name: resolvedProfile.name,
          username: resolvedProfile.username,
          profilePhotoUrl: resolvedProfile.profilePhotoUrl,
          role: resolvedProfile.role,
          isDoctor: resolvedProfile.isDoctor,
          smokeFreeStatus: resolvedProfile.smokeFreeStatus
        } : null
      };
      const res = await api.post("/api/communities/social/posts", payload);
      if (res?.data) {
        setPosts((prev) => [res.data, ...prev.filter(p => p.id !== res.data.id)]);
        setActiveFilter("new");
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
      console.error("Error marking notif read:", err);
    }
  };

  // Filtered & Sorted Posts
  const filteredPosts = useMemo(() => {
    let result = posts.filter((p) => !hiddenPostIds.has(p.id));

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
      // "hot" score with freshness boost
      result.sort((a, b) => {
        const now = Date.now();
        const ageHoursA = Math.max(0, (now - new Date(a.createdAt).getTime()) / 3600000);
        const ageHoursB = Math.max(0, (now - new Date(b.createdAt).getTime()) / 3600000);

        const freshBonusA = ageHoursA < 2 ? 10000 : (ageHoursA < 12 ? 2000 : 0);
        const freshBonusB = ageHoursB < 2 ? 10000 : (ageHoursB < 12 ? 2000 : 0);

        const scoreA = ((a.upvotesCount || 0) * 3 + (a.comments?.length || 0) * 2 + 10) / Math.pow(ageHoursA + 1, 1.3) + freshBonusA;
        const scoreB = ((b.upvotesCount || 0) * 3 + (b.comments?.length || 0) * 2 + 10) / Math.pow(ageHoursB + 1, 1.3) + freshBonusB;
        return scoreB - scoreA;
      });
    }

    // Pinned posts always stay on top
    result.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

    return result;
  }, [posts, activeSubreddit, activeFlair, searchQuery, activeFilter, hiddenPostIds]);

  const selectedSubreddit = useMemo(() => {
    return DEFAULT_SUBREDDITS.find((s) => s.id === activeSubreddit) || DEFAULT_SUBREDDITS[0];
  }, [activeSubreddit]);

  const handleSubredditClick = (serverName) => {
    if (!serverName) return;
    const s = (serverName || "").toLowerCase();
    if (s.includes("victoire")) setActiveSubreddit("victoires");
    else if (s.includes("entraide") || s.includes("urgence")) setActiveSubreddit("entraide");
    else if (s.includes("conseil")) setActiveSubreddit("conseils");
    else if (s.includes("substitut") || s.includes("tns")) setActiveSubreddit("tns");
    else if (s.includes("sport") || s.includes("bienetre")) setActiveSubreddit("sport");
    else setActiveSubreddit("all");
    setActiveFlair(null);
  };

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
              <span className="brand-badge">Entraide & Sevrage · Modéré par Médecins</span>
            </div>
          </div>

          {/* Subreddit Quick Switcher */}
          <div className="reddit-subreddit-select-wrap">
            <i className={`bi ${selectedSubreddit.icon} select-sub-icon`} style={{ color: selectedSubreddit.color }}></i>
            <select
              className="reddit-subreddit-select"
              value={activeSubreddit}
              onChange={(e) => {
                setActiveSubreddit(e.target.value);
                setActiveFlair(null);
              }}
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
            placeholder="Rechercher sur NeuralCommunity (titres, conseils, @pseudos, flairs)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <button className="clear-search-btn" onClick={() => setSearchQuery("")} title="Effacer la recherche">
              <i className="bi bi-x-circle-fill"></i>
            </button>
          ) : (
            <span className="search-kbd-hint">⌘K</span>
          )}
        </div>

        {/* Topbar Actions */}
        <div className="reddit-topbar-right">
          {/* Create Post Action */}
          <button className="reddit-create-btn" onClick={() => setShowCreateModal(true)}>
            <i className="bi bi-plus-lg"></i>
            <span>Créer une publication</span>
          </button>

          {/* Chat Dock Trigger */}
          <button
            className={`reddit-icon-btn ${chatDockOpen ? "active" : ""}`}
            title="Messages privés"
            onClick={() => setChatDockOpen(!chatDockOpen)}
          >
            <i className="bi bi-chat-dots-fill"></i>
          </button>

          {/* Current User Pill (Click to view own profile) */}
          {resolvedProfile && (
            <div
              className="reddit-user-chip"
              onClick={() => resolvedProfile.id && handleOpenUserProfile(resolvedProfile.id)}
              title="Voir mon profil public"
            >
              <div className="reddit-avatar-sm">
                {resolvedProfile.profilePhotoUrl ? (
                  <img src={resolvedProfile.profilePhotoUrl} alt="Avatar" />
                ) : (
                  <span>{getAvatarLetter(resolvedProfile.name, resolvedProfile.username)}</span>
                )}
              </div>
              <div className="user-info-text d-none d-lg-block">
                <div className="user-name">@{resolvedProfile.username || "mon_profil"}</div>
                <div className="user-role">{resolvedProfile.role || (resolvedProfile.isDoctor ? "Médecin Tabacologue" : "Patient")}</div>
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
              className={`sidebar-nav-item ${activeSubreddit === "all" && activeFilter === "new" ? "active" : ""}`}
              onClick={() => { setActiveSubreddit("all"); setActiveFilter("new"); setActiveFlair(null); }}
            >
              <i className="bi bi-stars text-primary"></i>
              <span>Nouveautés Récentes</span>
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
              <i className="bi bi-trophy-fill text-success"></i>
              <span>Meilleurs (Top)</span>
            </button>
            <button
              className={`sidebar-nav-item ${activeFilter === "discussed" ? "active" : ""}`}
              onClick={() => setActiveFilter("discussed")}
            >
              <i className="bi bi-chat-quote-fill text-info"></i>
              <span>Discussions Actives</span>
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
                <div className="sub-icon-badge" style={{ backgroundColor: `${sub.color}20`, color: sub.color }}>
                  <i className={`bi ${sub.icon}`}></i>
                </div>
                <div className="sub-meta">
                  <span className="sub-name">{sub.name}</span>
                  <span className="sub-label">{sub.label}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-title">THÈMES & ÉTIQUETTES</div>
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
              <span>Charte Thérapeutique</span>
            </div>
            <p className="rules-text">
              Échanges bienveillants et sans jugement. Respect du secret médical et accompagnement validé par des médecins tabacologues certifiés.
            </p>
          </div>
        </aside>

        {/* CENTRAL FEED: Quick Post Bar, Sort Tabs, Post Cards */}
        <main className="reddit-main-feed">
          {/* Subreddit Contextual Hero Banner (shown when filtered) */}
          {activeSubreddit !== "all" && (
            <div className="subreddit-hero-banner" style={{ '--sub-accent': selectedSubreddit.color || '#3b82f6' }}>
              <div className="hero-banner-inner">
                <div className="hero-icon-pill" style={{ backgroundColor: `${selectedSubreddit.color}1f`, color: selectedSubreddit.color }}>
                  <i className={`bi ${selectedSubreddit.icon}`}></i>
                </div>
                <div className="hero-info-body">
                  <div className="hero-header-row">
                    <h2 className="hero-title">{selectedSubreddit.name}</h2>
                    <span className="hero-category-label">{selectedSubreddit.label}</span>
                    <span className="hero-badge-mod"><i className="bi bi-patch-check-fill me-1"></i>Modéré par les tabacologues</span>
                  </div>
                  <p className="hero-description">{selectedSubreddit.desc}</p>
                  <div className="hero-meta-strip">
                    <span className="hero-stat"><i className="bi bi-people-fill me-1"></i>{selectedSubreddit.members}</span>
                    <span className="hero-dot">·</span>
                    <span className="hero-stat online"><i className="bi bi-circle-fill me-1"></i>{selectedSubreddit.online}</span>
                    <button
                      className="hero-publish-btn"
                      onClick={() => {
                        const matchedServer = servers.find((s) => s.name === selectedSubreddit.name || s.id === selectedSubreddit.id);
                        setPostDraft((prev) => ({
                          ...prev,
                          serverId: matchedServer?.id || ""
                        }));
                        setShowCreateModal(true);
                      }}
                    >
                      <i className="bi bi-plus-circle-fill me-1"></i> Publier dans ce fil
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Post Box */}
          <div className="reddit-quick-post">
            <div className="quick-post-prompt" onClick={() => setShowCreateModal(true)}>
              <div className="reddit-avatar-sm">
                {resolvedProfile?.profilePhotoUrl ? (
                  <img src={resolvedProfile.profilePhotoUrl} alt="Avatar" />
                ) : (
                  <span>{getAvatarLetter(resolvedProfile?.name, resolvedProfile?.username)}</span>
                )}
              </div>
              <div className="quick-fake-input">
                <i className="bi bi-pencil-square me-2 text-primary"></i>
                <span>Une victoire, un conseil, un craving ou une question à partager ?</span>
              </div>
            </div>
            <div className="quick-post-chips">
              <button
                type="button"
                className="quick-chip-btn victory"
                onClick={() => {
                  setPostDraft((prev) => ({ ...prev, flair: "🏆 Victoire J+30" }));
                  setShowCreateModal(true);
                }}
              >
                <i className="bi bi-trophy-fill text-success"></i>
                <span>Victoire</span>
              </button>
              <button
                type="button"
                className="quick-chip-btn medical"
                onClick={() => {
                  setPostDraft((prev) => ({ ...prev, flair: isDoc ? "🩺 Conseil Médecin" : "💡 Astuce du Jour" }));
                  setShowCreateModal(true);
                }}
              >
                <i className="bi bi-heart-pulse-fill text-primary"></i>
                <span>{isDoc ? "Conseil Médecin" : "Astuce / Question"}</span>
              </button>
              <button
                type="button"
                className="quick-chip-btn craving"
                onClick={() => {
                  setActiveSubreddit("entraide");
                  setPostDraft((prev) => ({
                    ...prev,
                    flair: "🆘 Urgence Craving",
                    serverId: servers.find((s) => s.name?.includes("urgence") || s.id === "entraide")?.id || ""
                  }));
                  setShowCreateModal(true);
                }}
              >
                <i className="bi bi-shield-fill-exclamation text-danger"></i>
                <span>SOS Craving</span>
              </button>
              <button
                type="button"
                className="quick-chip-btn media"
                onClick={() => {
                  setPostTab("media");
                  setImageUploadMode("local");
                  setShowCreateModal(true);
                  setTimeout(() => {
                    fileInputRef.current?.click();
                  }, 250);
                }}
              >
                <i className="bi bi-image-fill text-info"></i>
                <span>Photo</span>
              </button>
            </div>
          </div>

          {/* Sort Filter Bar */}
          <div className="reddit-sort-bar">
            <div className="sort-buttons">
              <button
                className={`sort-tab ${activeFilter === "new" ? "active" : ""}`}
                onClick={() => setActiveFilter("new")}
              >
                <i className="bi bi-stars"></i>
                <span>Nouveaux</span>
              </button>
              <button
                className={`sort-tab ${activeFilter === "hot" ? "active" : ""}`}
                onClick={() => setActiveFilter("hot")}
              >
                <i className="bi bi-fire"></i>
                <span>Populaires</span>
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
                <button onClick={() => setActiveFlair(null)} title="Effacer le filtre"><i className="bi bi-x"></i></button>
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
                const isPostDoctor = Boolean(
                  post.author?.isDoctor ||
                  post.author?.role === "Médecin Tabacologue" ||
                  post.author?.role?.toLowerCase().includes("médecin") ||
                  post.author?.username === "dr_tantani"
                );
                const isMyPost = Boolean(
                  authUser && (
                    post.author?.id === authUser.id ||
                    (isDoc && (post.author?.id === "user-tantani" || post.author?.username === "dr_tantani" || post.author?.isDoctor)) ||
                    post.author?.email === authUser.email ||
                    (resolvedProfile && post.author?.username === resolvedProfile.username)
                  )
                );
                const netScore = (post.upvotesCount || 0) - (post.downvotesCount || 0);
                const commentsOpen = !!expandedComments[post.id];
                const commentsList = post.comments || [];

                return (
                  <article key={post.id} className="reddit-post-card">
                    {/* LEFT VOTE COLUMN */}
                    <div className="reddit-vote-column">
                      <button
                        className={`vote-btn upvote ${post.myReaction === "UPVOTE" ? "voted" : ""}`}
                        title="Voter pour (Upvote)"
                        onClick={() => handleVote(post.id, "UPVOTE")}
                      >
                        <i className="bi bi-arrow-up-circle-fill"></i>
                      </button>
                      <span className={`vote-score ${netScore > 0 ? "positive" : netScore < 0 ? "negative" : ""}`}>
                        {netScore}
                      </span>
                      <button
                        className={`vote-btn downvote ${post.myReaction === "DOWNVOTE" ? "voted" : ""}`}
                        title="Voter contre (Downvote)"
                        onClick={() => handleVote(post.id, "DOWNVOTE")}
                      >
                        <i className="bi bi-arrow-down-circle-fill"></i>
                      </button>
                    </div>

                    {/* MAIN POST BODY */}
                    <div className="reddit-post-main">
                      {/* Post Header: Subreddit, Author, Role, Time, Flair */}
                      <div className="reddit-post-header">
                        <button
                          className="post-subreddit-badge"
                          onClick={() => handleSubredditClick(post.serverName)}
                          title="Filtrer sur ce fil"
                        >
                          <i className="bi bi-hash"></i>
                          {post.serverName || "r/victoires_sevrage"}
                        </button>
                        <span className="meta-dot">·</span>

                        {/* Author Clickable to Profile */}
                        <div
                          className="post-author-wrap"
                          onClick={() => post.author?.id && handleOpenUserProfile(post.author.id)}
                          title="Voir le profil de l'auteur"
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
                        {isPostDoctor ? (
                          <span className="badge-doctor" title="Médecin Tabacologue Certifié">
                            <i className="bi bi-patch-check-fill me-1"></i>
                            {post.author?.name || "Dr. Ayman Tantani"}
                            <small className="doc-sublabel ms-1">Tabacologue</small>
                          </span>
                        ) : (
                          <span className="badge-patient">
                            <i className="bi bi-award-fill me-1 text-warning"></i>
                            {post.author?.smokeFreeStatus || "Patient"}
                          </span>
                        )}

                        <span className="meta-dot">·</span>
                        <span className="post-time">
                          <i className="bi bi-clock me-1"></i>
                          {formatDateAgo(post.createdAt)}
                        </span>

                        {/* Flair Pill */}
                        {post.flair && (
                          <span className="post-flair-pill">{post.flair}</span>
                        )}

                        {/* Pinned Badge */}
                        {post.isPinned && (
                          <span className="post-pinned-pill" title="Épinglé en tête de fil">
                            <i className="bi bi-pin-angle-fill me-1"></i> Épinglé
                          </span>
                        )}

                        {/* Edited Badge */}
                        {post.isEdited && (
                          <span className="post-edited-label ms-1">(modifié)</span>
                        )}

                        {/* Follow Button on Post Header */}
                        {post.author && !isMyPost && (
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

                        {/* 3-DOT POST OPTIONS DROPDOWN */}
                        <div className="post-options-menu-wrap ms-auto" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className={`post-options-btn ${activePostMenuId === post.id ? "active" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePostMenuId(activePostMenuId === post.id ? null : post.id);
                            }}
                            title="Options de la publication"
                          >
                            <i className="bi bi-three-dots"></i>
                          </button>

                          {activePostMenuId === post.id && (
                            <div className="post-dropdown-menu">
                              {/* Current user's own post actions */}
                              {isMyPost && (
                                <>
                                  <button
                                    type="button"
                                    className="dropdown-item text-danger"
                                    onClick={() => {
                                      setActivePostMenuId(null);
                                      setPostToDelete(post);
                                      setShowDeleteConfirmModal(true);
                                    }}
                                  >
                                    <i className="bi bi-trash3-fill me-2 text-danger"></i>
                                    <span>Supprimer la publication</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => {
                                      setActivePostMenuId(null);
                                      setEditDraft({
                                        id: post.id,
                                        title: post.title || "",
                                        content: post.content || "",
                                        flair: post.flair || ""
                                      });
                                      setShowEditModal(true);
                                    }}
                                  >
                                    <i className="bi bi-pencil-square me-2 text-primary"></i>
                                    <span>Modifier le texte</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => handleTogglePinPost(post.id)}
                                  >
                                    <i className={`bi ${post.isPinned ? "bi-pin-angle" : "bi-pin-angle-fill"} me-2 text-warning`}></i>
                                    <span>{post.isPinned ? "Détacher du haut" : "Épingler en haut"}</span>
                                  </button>
                                  <div className="dropdown-divider"></div>
                                </>
                              )}

                              {/* Universal actions */}
                              <button
                                type="button"
                                className="dropdown-item"
                                onClick={() => {
                                  navigator.clipboard?.writeText(`${window.location.origin}/communities?post=${post.id}`);
                                  setActivePostMenuId(null);
                                  showToast("🔗 Lien direct copié dans le presse-papier !");
                                }}
                              >
                                <i className="bi bi-link-45deg me-2 text-info"></i>
                                <span>Copier le lien direct</span>
                              </button>

                              <button
                                type="button"
                                className="dropdown-item"
                                onClick={() => handleHidePost(post.id)}
                              >
                                <i className="bi bi-eye-slash me-2 text-secondary"></i>
                                <span>Masquer cette publication</span>
                              </button>

                              {/* Report action for others' posts */}
                              {!isMyPost && (
                                <>
                                  <div className="dropdown-divider"></div>
                                  <button
                                    type="button"
                                    className="dropdown-item text-danger"
                                    onClick={() => {
                                      setActivePostMenuId(null);
                                      setPostToReport(post);
                                      setShowReportModal(true);
                                    }}
                                  >
                                    <i className="bi bi-flag-fill me-2 text-danger"></i>
                                    <span>Signaler ce contenu</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
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
                          className={`footer-action-btn comments-btn ${commentsOpen ? "active" : ""}`}
                          onClick={() => setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                        >
                          <i className="bi bi-chat-square-text-fill"></i>
                          <span>{commentsList.length} Commentaires</span>
                        </button>

                        {/* Repost Button */}
                        <button
                          className="footer-action-btn repost-btn"
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
                          <button className="reaction-chip" onClick={() => handleReaction(post.id, "LOVE")} title="Soutien bienveillant">
                            <span className="rx-emoji">💖</span> <span className="rx-label">Soutien</span> <span className="rx-count">{post.reactions?.LOVE || 0}</span>
                          </button>
                          <button className="reaction-chip" onClick={() => handleReaction(post.id, "FIRE")} title="Force & motivation">
                            <span className="rx-emoji">🔥</span> <span className="rx-label">Force</span> <span className="rx-count">{post.reactions?.FIRE || 0}</span>
                          </button>
                          <button className="reaction-chip" onClick={() => handleReaction(post.id, "CLAP")} title="Félicitations">
                            <span className="rx-emoji">👏</span> <span className="rx-label">Bravo</span> <span className="rx-count">{post.reactions?.CLAP || 0}</span>
                          </button>
                          <button className="reaction-chip" onClick={() => handleReaction(post.id, "INSIGHT")} title="Conseil utile">
                            <span className="rx-emoji">💡</span> <span className="rx-label">Utile</span> <span className="rx-count">{post.reactions?.INSIGHT || 0}</span>
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
                              {resolvedProfile?.profilePhotoUrl ? (
                                <img src={resolvedProfile.profilePhotoUrl} alt="Avatar" />
                              ) : (
                                <span>{getAvatarLetter(resolvedProfile?.name, resolvedProfile?.username)}</span>
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
          {/* SOS Craving Urgency Box */}
          <div className="sidebar-card sos-craving-card">
            <div className="sos-header">
              <div className="sos-pulse-icon">
                <i className="bi bi-shield-fill-exclamation"></i>
              </div>
              <div className="sos-header-text">
                <h6 className="sos-title">Urgence Craving ?</h6>
                <span className="sos-sub">Technique Respiratoire 3-6-5</span>
              </div>
            </div>
            <p className="sos-desc">
              Le pic d'envie dure en moyenne <strong>3 à 5 minutes</strong>. Inspirez pendant 5s, retenez 2s, puis soufflez lentement pendant 5s.
            </p>
            <div className="sos-action-strip">
              <button
                className="btn-sos-trigger"
                onClick={() => {
                  setActiveSubreddit("entraide");
                  setPostDraft((prev) => ({
                    ...prev,
                    flair: "🆘 Urgence Craving",
                    serverId: servers.find((s) => s.name?.includes("urgence") || s.id === "entraide")?.id || ""
                  }));
                  setShowCreateModal(true);
                }}
              >
                <i className="bi bi-broadcast me-1"></i> Alerte Entraide
              </button>
              <a href="tel:3989" className="sos-phone-pill" title="Tabac Info Service (Appel non surtaxé)">
                <i className="bi bi-telephone-fill me-1"></i> 39 89
              </a>
            </div>
          </div>

          {/* Community Info Widget */}
          <div className="sidebar-card community-about-card">
            <div className="about-header">
              <h6>À propos de NeuralCommunity</h6>
            </div>
            <p className="about-desc">
              Espace clinique et d'entraide dédié à l'arrêt durable du tabac. Supervisé scientifiquement par l'équipe de tabacologie du CHU et fondé sur le soutien entre pairs.
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
                <span className="stat-lbl">Soutien Actif</span>
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
              {people.filter((p) => p.isDoctor || p.role?.includes("Medecin")).slice(0, 4).map((doc) => {
                const isMe = Boolean(
                  (authUser && doc.id === authUser.id) ||
                  (isDoc && (doc.id === "user-tantani" || doc.username === "dr_tantani")) ||
                  (resolvedProfile && doc.username === resolvedProfile.username)
                );
                return (
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
                      <div className="doc-spec">{doc.bio || "Médecin Tabacologue Référent"}</div>
                    </div>
                    {isMe ? (
                      <span className="badge-doc-self">Vous</span>
                    ) : (
                      <button
                        className={`doc-follow-btn ${doc.following ? "following" : ""}`}
                        onClick={() => handleToggleFollow(doc.id)}
                      >
                        {doc.following ? "Abonné" : "+ Suivre"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Milestones Leaderboard */}
          <div className="sidebar-card leaderboard-card">
            <div className="widget-header">
              <i className="bi bi-award-fill text-warning"></i>
              <h6>Tableau d'Honneur du Mois</h6>
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
              {/* Profile Top Bar (Clean & uncropped - No Blue Banner) */}
              <div className="profile-modal-clean-top">
                <div className="profile-modal-title">
                  <i className="bi bi-person-badge text-primary me-2"></i>
                  <span>Profil de Membre</span>
                </div>
                <button
                  type="button"
                  className="profile-modal-close-btn"
                  onClick={() => setShowProfileModal(false)}
                  title="Fermer"
                >
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
                    {(() => {
                      const isOwnProfile = Boolean(
                        authUser && selectedUserProfile.user && (
                          selectedUserProfile.user.id === authUser.id ||
                          (isDoc && (selectedUserProfile.user.id === "user-tantani" || selectedUserProfile.user.username === "dr_tantani" || selectedUserProfile.user.isDoctor)) ||
                          selectedUserProfile.user.email === authUser.email ||
                          (resolvedProfile && selectedUserProfile.user.username === resolvedProfile.username)
                        )
                      );
                      if (isOwnProfile) {
                        return (
                          <button
                            className="btn-follow-lg following"
                            onClick={() => {
                              setShowProfileModal(false);
                              navigate("/profile");
                            }}
                          >
                            <i className="bi bi-person-gear me-1"></i> Gérer mon profil
                          </button>
                        );
                      }
                      if (authUser) {
                        return (
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
                        );
                      }
                      return null;
                    })()}
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
                      {selectedUserProfile.posts.map((p) => {
                        const isOwnProfilePost = Boolean(
                          authUser && selectedUserProfile.user && (
                            selectedUserProfile.user.id === authUser.id ||
                            (isDoc && (selectedUserProfile.user.id === "user-tantani" || selectedUserProfile.user.username === "dr_tantani" || selectedUserProfile.user.isDoctor)) ||
                            selectedUserProfile.user.email === authUser.email ||
                            (resolvedProfile && selectedUserProfile.user.username === resolvedProfile.username)
                          )
                        );
                        return (
                          <div key={p.id} className="profile-post-card">
                            <div className="pcard-header">
                              <span className="pcard-sub">{p.serverName}</span>
                              <span className="meta-dot">·</span>
                              <span className="pcard-time">{formatDateAgo(p.createdAt)}</span>
                              {p.flair && <span className="pcard-flair">{p.flair}</span>}

                              {/* Quick delete button if this is the user's own profile */}
                              {isOwnProfilePost && (
                                <button
                                  type="button"
                                  className="btn-delete-profile-post ms-auto"
                                  onClick={() => {
                                    setPostToDelete(p);
                                    setShowDeleteConfirmModal(true);
                                  }}
                                  title="Supprimer cette publication"
                                >
                                  <i className="bi bi-trash3 me-1 text-danger"></i>
                                  <span>Supprimer</span>
                                </button>
                              )}
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
                        );
                      })}
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
                  <div className="media-source-selector">
                    <label className="mb-2 d-block">Source de la photo</label>
                    <div className="media-mode-toggle-row">
                      <button
                        type="button"
                        className={`media-mode-btn ${imageUploadMode === "local" ? "active" : ""}`}
                        onClick={() => setImageUploadMode("local")}
                      >
                        <i className="bi bi-folder-fill me-1.5 text-primary"></i>
                        <span>Fichier sur mon appareil</span>
                      </button>
                      <button
                        type="button"
                        className={`media-mode-btn ${imageUploadMode === "url" ? "active" : ""}`}
                        onClick={() => setImageUploadMode("url")}
                      >
                        <i className="bi bi-link-45deg me-1 text-info"></i>
                        <span>Lien URL web</span>
                      </button>
                    </div>
                  </div>

                  {/* Hidden file input for local uploads */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleFileInputChange}
                  />

                  {/* Mode 1: Local upload */}
                  {imageUploadMode === "local" ? (
                    <div className="local-upload-container mt-2">
                      {postDraft.imageUrl ? (
                        <div className="local-image-preview-card">
                          <div className="preview-img-container">
                            <img src={postDraft.imageUrl} alt="Prévisualisation" />
                            <button
                              type="button"
                              className="btn-overlay-remove"
                              onClick={handleRemoveImage}
                              title="Retirer la photo"
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </div>
                          <div className="preview-details-bar">
                            <div className="preview-file-info">
                              <i className="bi bi-image text-primary me-2"></i>
                              <span className="file-name text-truncate">
                                {localImageMeta?.name || "Photo importée"}
                              </span>
                              {localImageMeta?.size && (
                                <span className="file-badge">
                                  {formatFileSize(localImageMeta.size)}
                                  {localImageMeta.originalSize > localImageMeta.size && (
                                    <span className="file-opt-badge ms-1.5">
                                      <i className="bi bi-lightning-charge-fill me-0.5 text-warning"></i>
                                      optimisée
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="preview-actions">
                              <button
                                type="button"
                                className="btn-change-photo"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <i className="bi bi-arrow-repeat me-1"></i> Remplacer
                              </button>
                              <button
                                type="button"
                                className="btn-remove-photo"
                                onClick={handleRemoveImage}
                              >
                                <i className="bi bi-trash3 me-1"></i> Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`image-dropzone ${isDraggingFile ? "dragover" : ""}`}
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDropImage}
                        >
                          <div className="dropzone-icon-circle">
                            <i className="bi bi-cloud-arrow-up-fill"></i>
                          </div>
                          <h6 className="dropzone-title">Glissez-déposez votre photo ici</h6>
                          <p className="dropzone-subtitle">ou cliquez pour parcourir vos fichiers locaux</p>
                          <div className="dropzone-hints">
                            <span className="hint-pill">JPG, PNG, WebP, GIF</span>
                            <span className="hint-pill">Compression HD automatique</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Mode 2: Web URL */
                    <div className="url-upload-container mt-2">
                      <div className="url-input-wrap">
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/..."
                          value={postDraft.imageUrl}
                          onChange={(e) => {
                            setPostDraft({ ...postDraft, imageUrl: e.target.value });
                            setLocalImageMeta(null);
                          }}
                        />
                        {postDraft.imageUrl && (
                          <button
                            type="button"
                            className="btn-clear-url"
                            onClick={handleRemoveImage}
                            title="Effacer"
                          >
                            <i className="bi bi-x-circle-fill"></i>
                          </button>
                        )}
                      </div>
                      {postDraft.imageUrl && (
                        <div className="img-preview-wrap mt-2">
                          <img
                            src={postDraft.imageUrl}
                            alt="Prévisualisation"
                            style={{ maxHeight: "200px", borderRadius: "8px", objectFit: "cover", width: "100%" }}
                            onError={(e) => {
                              e.target.style.display = "none";
                              showToast("Impossible de charger l'image depuis cette URL.", "warning");
                            }}
                          />
                        </div>
                      )}
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
      {/* 🗑️ DELETE POST CONFIRMATION MODAL                                        */}
      {/* ========================================================================= */}
      <Modal show={showDeleteConfirmModal} onHide={() => setShowDeleteConfirmModal(false)} centered className="reddit-modal delete-confirm-modal">
        <div className="modal-content-reddit">
          <div className="modal-header-reddit" style={{ borderBottomColor: "rgba(239, 68, 68, 0.2)" }}>
            <h5 className="modal-title text-danger">
              <i className="bi bi-trash3-fill me-2"></i>Supprimer la publication ?
            </h5>
            <button className="btn-close-reddit" onClick={() => setShowDeleteConfirmModal(false)}><i className="bi bi-x-lg"></i></button>
          </div>
          <div className="modal-body-reddit">
            <p className="mb-2">Êtes-vous sûr de vouloir supprimer définitivement cette publication ?</p>
            {postToDelete && (
              <div className="delete-preview-box">
                <div className="fw-bold text-truncate">{postToDelete.title || "Publication sans titre"}</div>
                {postToDelete.content && (
                  <div className="small text-muted text-truncate mt-1">{postToDelete.content}</div>
                )}
              </div>
            )}
            <p className="small text-danger mt-3 mb-0">
              <i className="bi bi-info-circle me-1"></i>Cette action est irréversible. Les commentaires et réactions associés seront également effacés.
            </p>
          </div>
          <div className="modal-footer-reddit">
            <button type="button" className="btn-cancel" onClick={() => setShowDeleteConfirmModal(false)}>Annuler</button>
            <button
              type="button"
              className="btn btn-danger px-3 py-1.5 fw-bold"
              style={{ borderRadius: "10px" }}
              disabled={actionLoading}
              onClick={() => handleDeletePost(postToDelete?.id)}
            >
              <i className="bi bi-trash3 me-1"></i>
              {actionLoading ? "Suppression..." : "Confirmer la suppression"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* ✏️ EDIT POST MODAL                                                        */}
      {/* ========================================================================= */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg" className="reddit-modal">
        <div className="modal-content-reddit">
          <div className="modal-header-reddit">
            <h5 className="modal-title">
              <i className="bi bi-pencil-square me-2 text-primary"></i>Modifier votre publication
            </h5>
            <button className="btn-close-reddit" onClick={() => setShowEditModal(false)}><i className="bi bi-x-lg"></i></button>
          </div>
          <form onSubmit={handleEditPostSubmit}>
            <div className="modal-body-reddit">
              {/* Select Flair */}
              <div className="form-group-reddit">
                <label>Étiquette / Flair de sujet</label>
                <div className="flair-select-row">
                  {FLAIRS.map((f) => (
                    <button
                      type="button"
                      key={f.label}
                      className={`flair-btn ${editDraft.flair === f.label ? "selected" : ""}`}
                      style={{ color: f.color }}
                      onClick={() => setEditDraft({ ...editDraft, flair: f.label })}
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
                  placeholder="Titre clair et précis..."
                  value={editDraft.title}
                  onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                />
              </div>

              {/* Content Textarea */}
              <div className="form-group-reddit">
                <label>Corps du message</label>
                <textarea
                  rows="5"
                  placeholder="Partagez votre message..."
                  value={editDraft.content}
                  onChange={(e) => setEditDraft({ ...editDraft, content: e.target.value })}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer-reddit">
              <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Annuler</button>
              <button type="submit" className="btn-submit" disabled={actionLoading}>
                {actionLoading ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 🚨 REPORT POST MODAL                                                      */}
      {/* ========================================================================= */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} centered className="reddit-modal">
        <div className="modal-content-reddit">
          <div className="modal-header-reddit">
            <h5 className="modal-title">
              <i className="bi bi-shield-exclamation me-2 text-warning"></i>Signaler ce contenu
            </h5>
            <button className="btn-close-reddit" onClick={() => setShowReportModal(false)}><i className="bi bi-x-lg"></i></button>
          </div>
          <form onSubmit={handleReportPostSubmit}>
            <div className="modal-body-reddit">
              <p className="small text-muted mb-3">
                La communauté NeuralConsult est un espace médicalisé d'entraide bienveillant. Veuillez sélectionner le motif de votre signalement :
              </p>
              <div className="report-options-list">
                {[
                  { id: "misinformation", label: "Désinformation médicale ou contre-indication" },
                  { id: "relapse_trigger", label: "Incitation au tabagisme ou promotion de produits" },
                  { id: "harassment", label: "Propos agressifs, harcèlement ou non-bienveillance" },
                  { id: "spam", label: "Spam, publicité ou contenu non pertinent" }
                ].map((opt) => (
                  <label key={opt.id} className="report-option-item">
                    <input
                      type="radio"
                      name="reportReason"
                      value={opt.id}
                      checked={reportReason === opt.id}
                      onChange={(e) => setReportReason(e.target.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer-reddit">
              <button type="button" className="btn-cancel" onClick={() => setShowReportModal(false)}>Annuler</button>
              <button type="submit" className="btn btn-warning fw-bold px-3 py-1.5" style={{ borderRadius: "10px" }}>
                <i className="bi bi-send-check me-1"></i> Transmettre à la modération
              </button>
            </div>
          </form>
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
                      const isMe = msg.senderUsername === resolvedProfile?.username || msg.outgoing;
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
