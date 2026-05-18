// =====================================================================
// 🔔 DESKTOP NATIVE NOTIFICATIONS SERVICE (HTML5 Web Notification API)
// =====================================================================
// Integrates with the OS notification system (Windows Action Center, macOS)
// to display native, rich push notifications like a desktop application.

let lastNotificationId = null;

/**
 * Registers the background Service Worker for closed-tab Web Push notifications.
 */
export const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/"
      });
      console.log("Service Worker registered successfully with scope:", registration.scope);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return null;
    }
  }
  return null;
};

/**
 * Requests the user's permission to display native OS notifications.
 */
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notifications.");
    return false;
  }

  let granted = false;
  if (Notification.permission === "default") {
    try {
      const permission = await Notification.requestPermission();
      granted = permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  } else {
    granted = Notification.permission === "granted";
  }

  if (granted) {
    // Automatically register the background service worker when permission is granted
    registerServiceWorker();
  }

  return granted;
};

/**
 * Displays a native OS notification.
 * 
 * @param {string} title The notification title
 * @param {string} body The notification body message
 * @param {string} actionPath Optional router path to navigate to when clicked
 * @param {function} navigate React router navigate function
 */
export const showNativeNotification = (title, body, actionPath = "/notifications", navigate = null) => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const options = {
    body: body,
    icon: "/icons/icon_Neural_Consult_Sevrage.png", // Beautiful app icon
    badge: "/icons/icon_Neural_Consult_Sevrage.png",
    requireInteraction: false,
    silent: false,
    tag: "neuralconsult-alert" // Prevents duplicate notifications stacking
  };

  try {
    const notification = new Notification(title, options);

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      if (navigate && actionPath) {
        navigate(actionPath);
      }
      notification.close();
    };
  } catch (error) {
    console.error("Failed to trigger native desktop notification:", error);
  }
};

/**
 * Checks for new notifications and triggers native alerts if any are found.
 * Tracks the last seen notification to prevent duplicate popups.
 * 
 * @param {Array} notificationsList List of notifications fetched from the API
 * @param {function} navigate React Router navigate function
 */
export const processIncomingNotificationsForNativeAlerts = (notificationsList, navigate) => {
  if (!notificationsList || notificationsList.length === 0) return;

  // Find the most recent unread notification
  const unreadNotifications = notificationsList.filter(n => n.status === "UNREAD");
  if (unreadNotifications.length === 0) return;

  // Sort by date to get the newest one
  const newest = [...unreadNotifications].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )[0];

  // If this notification is different from the last one we alerted about, pop it!
  if (newest.id !== lastNotificationId) {
    lastNotificationId = newest.id;
    
    // Map nice display names based on type
    const typeLabel = {
      APPOINTMENT: "📅 Nouveau Rendez-vous",
      REMINDER: "⏰ Rappel quotidien",
      AI_ALERT: "🧠 Alerte IA Clinique",
      SUPPORT: "💬 Soutien Clinique",
      COMMUNITY: "👥 Espace Communauté",
      GENERAL: "ℹ️ Information NeuralConsult"
    }[newest.type] || "🔔 Notification NeuralConsult";

    showNativeNotification(
      typeLabel,
      newest.title + " : " + newest.content,
      newest.actionPath || "/notifications",
      navigate
    );
  }
};
