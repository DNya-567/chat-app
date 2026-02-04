/**
 * Push Notification Service
 * Handles browser notifications for new messages
 */

class NotificationService {
  constructor() {
    this.permission = "default";
    this.isSupported = "Notification" in window;
  }

  /**
   * Request permission for notifications
   * @returns {Promise<string>} Permission status
   */
  async requestPermission() {
    if (!this.isSupported) {
      console.warn("🔔 Notifications not supported in this browser");
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      console.log("🔔 Notification permission:", permission);
      return permission;
    } catch (error) {
      console.error("🔔 Error requesting notification permission:", error);
      return "denied";
    }
  }

  /**
   * Check if notifications are allowed
   * @returns {boolean}
   */
  isAllowed() {
    return this.isSupported && Notification.permission === "granted";
  }

  /**
   * Get current permission status
   * @returns {string}
   */
  getPermission() {
    if (!this.isSupported) return "unsupported";
    return Notification.permission;
  }

  /**
   * Check if user has notifications enabled in settings
   * @returns {boolean}
   */
  isEnabledInSettings() {
    const enabled = JSON.parse(localStorage.getItem("notify-enabled") ?? "true");
    const dnd = JSON.parse(localStorage.getItem("notify-dnd") ?? "false");
    return enabled && !dnd;
  }

  /**
   * Check if sound is enabled in settings
   * @returns {boolean}
   */
  isSoundEnabled() {
    return JSON.parse(localStorage.getItem("notify-sound") ?? "true");
  }

  /**
   * Check if preview is enabled in settings
   * @returns {boolean}
   */
  isPreviewEnabled() {
    return JSON.parse(localStorage.getItem("notify-preview") ?? "true");
  }

  /**
   * Show a notification for a new message
   * @param {Object} options - Notification options
   * @param {string} options.title - Notification title
   * @param {string} options.body - Notification body
   * @param {string} options.icon - Icon URL
   * @param {string} options.tag - Unique tag to prevent duplicates
   * @param {Function} options.onClick - Click callback
   * @param {boolean} options.forceShow - Show even if page is focused
   * @returns {Notification|null}
   */
  showNotification({ title, body, icon, tag, onClick, forceShow = false }) {
    // Check if notifications are enabled in user settings
    if (!this.isEnabledInSettings()) {
      console.log("🔔 Notifications disabled in settings, skipping");
      return null;
    }

    if (!this.isAllowed()) {
      console.log("🔔 Notifications not allowed, skipping");
      return null;
    }

    // Don't show notification if page is visible and focused (unless forceShow is true)
    if (!forceShow && document.visibilityState === "visible" && document.hasFocus()) {
      console.log("🔔 Page is active, skipping notification");
      return null;
    }

    // Check if preview is enabled
    const displayBody = this.isPreviewEnabled() ? body : "New message";

    try {
      const notification = new Notification(title, {
        body: displayBody,
        icon: icon || "/default-avatar.png",
        tag: tag || `msg-${Date.now()}`,
        badge: "/default-avatar.png",
        vibrate: [200, 100, 200],
        requireInteraction: false,
        silent: false,
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        if (onClick) onClick();
      };

      notification.onclose = () => {
        console.log("🔔 Notification closed");
      };

      notification.onerror = (error) => {
        console.error("🔔 Notification error:", error);
      };

      // Play sound if enabled
      if (this.isSoundEnabled()) {
        this.playSound();
      }

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      console.log("🔔 Notification shown:", title);
      return notification;
    } catch (error) {
      console.error("🔔 Error showing notification:", error);
      return null;
    }
  }

  /**
   * Show notification for a new chat message
   * @param {Object} message - Message object
   * @param {Object} sender - Sender user object
   * @param {Function} onClickCallback - Callback when notification clicked
   */
  showMessageNotification(message, sender, onClickCallback) {
    const senderName = sender?.username || "Someone";
    const messagePreview =
      message.text.length > 50
        ? message.text.substring(0, 50) + "..."
        : message.text;

    this.showNotification({
      title: `New message from ${senderName}`,
      body: messagePreview,
      icon: sender?.avatar || "/default-avatar.png",
      tag: `chat-msg-${message._id}`,
      onClick: onClickCallback,
      forceShow: true, // Always show for new messages
    });
  }

  /**
   * Show notification for message reaction
   * @param {string} senderName - Who reacted
   * @param {string} emoji - The emoji used
   */
  showReactionNotification(senderName, emoji) {
    this.showNotification({
      title: `${senderName} reacted ${emoji}`,
      body: "Tap to view the message",
      tag: `reaction-${Date.now()}`,
    });
  }

  /**
   * Show notification for pinned message
   * @param {string} senderName - Who pinned
   * @param {string} messagePreview - Preview of pinned message
   */
  showPinNotification(senderName, messagePreview) {
    this.showNotification({
      title: `${senderName} pinned a message`,
      body: messagePreview,
      tag: `pin-${Date.now()}`,
    });
  }

  /**
   * Play notification sound
   */
  playSound() {
    try {
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Audio play failed (user interaction required)
        console.log("🔔 Could not play notification sound");
      });
    } catch (error) {
      console.log("🔔 Notification sound not available");
    }
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
