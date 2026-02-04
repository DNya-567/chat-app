import { useState, useEffect } from "react";
import notificationService from "../../services/notificationService";
import "./NotificationsSettings.css";

export default function NotificationsSettings({ onBack }) {
  const [enabled, setEnabled] = useState(
    JSON.parse(localStorage.getItem("notify-enabled") ?? "true")
  );
  const [sound, setSound] = useState(
    JSON.parse(localStorage.getItem("notify-sound") ?? "true")
  );
  const [preview, setPreview] = useState(
    JSON.parse(localStorage.getItem("notify-preview") ?? "true")
  );
  const [dnd, setDnd] = useState(
    JSON.parse(localStorage.getItem("notify-dnd") ?? "false")
  );
  const [browserPermission, setBrowserPermission] = useState(
    notificationService.getPermission()
  );

  useEffect(() => {
    // Update permission status on mount
    setBrowserPermission(notificationService.getPermission());
  }, []);

  const save = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const requestBrowserPermission = async () => {
    const permission = await notificationService.requestPermission();
    setBrowserPermission(permission);
  };

  const sendTestNotification = () => {
    notificationService.showNotification({
      title: "Test Notification",
      body: "Push notifications are working! 🎉",
      tag: "test-notification",
    });
  };

  return (
    <div className="notifications-settings">
      <button className="back-btn" onClick={onBack}>
        ← Back
      </button>

      <h3 className="notifications-title">Notification Preferences</h3>

      {/* Browser Permission Section */}
      <div className="browser-permission-section">
        <div className="permission-status">
          <span className="permission-icon">
            {browserPermission === "granted" ? "✅" : browserPermission === "denied" ? "🚫" : "⏳"}
          </span>
          <div className="permission-info">
            <span className="permission-label">Browser Notifications</span>
            <span className="permission-value">
              {browserPermission === "granted"
                ? "Allowed"
                : browserPermission === "denied"
                ? "Blocked (enable in browser settings)"
                : browserPermission === "unsupported"
                ? "Not supported in this browser"
                : "Not yet requested"}
            </span>
          </div>
        </div>

        {browserPermission === "default" && (
          <button className="permission-btn" onClick={requestBrowserPermission}>
            🔔 Enable Browser Notifications
          </button>
        )}

        {browserPermission === "granted" && (
          <button className="test-notification-btn" onClick={sendTestNotification}>
            🧪 Send Test Notification
          </button>
        )}
      </div>

      <div className="settings-divider"></div>

      <SettingToggle
        label="Enable Notifications"
        description="Receive notifications for new messages"
        icon="🔔"
        value={enabled}
        onChange={(v) => {
          setEnabled(v);
          save("notify-enabled", v);
        }}
      />

      <SettingToggle
        label="Message Preview"
        description="Show message content in notifications"
        icon="👁️"
        value={preview}
        disabled={!enabled}
        onChange={(v) => {
          setPreview(v);
          save("notify-preview", v);
        }}
      />

      <SettingToggle
        label="Sound"
        description="Play sound for new messages"
        icon="🔊"
        value={sound}
        disabled={!enabled}
        onChange={(v) => {
          setSound(v);
          save("notify-sound", v);
        }}
      />

      <SettingToggle
        label="Do Not Disturb"
        description="Disable all notifications temporarily"
        icon="😴"
        value={dnd}
        onChange={(v) => {
          setDnd(v);
          save("notify-dnd", v);
        }}
      />

      <div className="profile-info">
        💡 These settings control how you receive notifications from ChatApp.
      </div>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  icon,
  value,
  onChange,
  disabled,
}) {
  return (
    <div className={`setting-toggle ${disabled ? "disabled" : ""}`}>
      <div className="toggle-info">
        <span className="toggle-label">
          {icon} {label}
        </span>
        {description && (
          <span className="toggle-description">{description}</span>
        )}
      </div>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="toggle-knob"></div>
      </label>
    </div>
  );
}
