// =====================================================================
// 🐳 BACKGROUND SERVICE WORKER - WEB PUSH NOTIFICATIONS
// =====================================================================
// This script runs in the background of the user's OS / Browser,
// completely independent of whether the NeuralConsult tab is open or closed.
// It wakes up automatically when a push notification is received from the server.

self.addEventListener("push", (event) => {
  if (!event.data) {
    console.log("Push event received with no data payload.");
    return;
  }

  try {
    const payload = event.data.json();
    const { title, body, actionPath, userRole } = payload;

    // Define notification options based on target audience (DOCTOR, PATIENT, ADMIN)
    let icon = "/icons/icon_Neural_Consult_Sevrage.png";
    let badge = "/icons/icon_Neural_Consult_Sevrage.png";
    let tag = "neuralconsult-alert";

    if (userRole === "DOCTOR") {
      tag = "neuralconsult-doctor-alert";
    } else if (userRole === "ADMIN") {
      tag = "neuralconsult-admin-alert";
    }

    const options = {
      body: body || "Nouvelle mise à jour disponible sur NeuralConsult.",
      icon: icon,
      badge: badge,
      tag: tag,
      requireInteraction: true, // Keep the notification on screen until user interacts
      data: {
        actionPath: actionPath || "/notifications"
      }
    };

    event.waitUntil(
      self.registration.showNotification(title || "NeuralConsult 🧠", options)
    );
  } catch (error) {
    console.error("Error parsing push notification data:", error);
    
    // Fallback notification if parsing fails
    const fallbackOptions = {
      body: event.data.text() || "Vous avez reçu un nouveau message clinique.",
      icon: "/icons/icon_Neural_Consult_Sevrage.png",
      tag: "neuralconsult-fallback"
    };
    event.waitUntil(
      self.registration.showNotification("NeuralConsult 🧠", fallbackOptions)
    );
  }
});

// Handle notification click: wakes up the browser, focuses the tab or opens a new one
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.actionPath || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // 1. If a tab is already open, focus it and redirect
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus().then(() => {
            if ("navigate" in client) {
              return client.navigate(targetUrl);
            }
          });
        }
      }
      // 2. If no tab is open, open a new browser window/tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
