import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import EditProfile from "./EditProfile";
import ThemeSelector from "./ThemeSelector";
import FontThemeSelector from "./FontThemeSelector";
import NotificationsSettings from "./NotificationsSettings";
import "./SettingsModal.css";

export default function SettingsModal({ onClose }) {
  const [activeTab, setActiveTab] = useState("main");
  const { user } = useAuth();

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div
        className="settings-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-header">
          <h3>Settings</h3>
          <button onClick={onClose}>✕</button>
        </div>

        {/* MAIN MENU */}
        {activeTab === "main" && (
          <div className="settings-content">
            <div
              className="settings-item"
              onClick={() => setActiveTab("profile")}
            >
              👤 Edit Profile
            </div>

            <div
              className="settings-item"
              onClick={() => setActiveTab("theme")}
            >
              🎨 Theme
            </div>

            <div
              className="settings-item"
              onClick={() => setActiveTab("notifications")}
            >
              🔔 Notifications
            </div>

            <div
              className="settings-item"
              onClick={() => setActiveTab("fontTheme")}
            >
              📝 Message Font
            </div>

            <div className="settings-item">
              🔒 Privacy
            </div>
          </div>
        )}

        {/* PROFILE */}
        {activeTab === "profile" && (
          <div className="settings-content">
            <EditProfile
              user={user}
              onBack={() => setActiveTab("main")}
            />
          </div>
        )}

        {/* THEME */}
        {activeTab === "theme" && (
          <div className="settings-content">
            <button
              className="back-btn"
              onClick={() => setActiveTab("main")}
            >
              ← Back
            </button>

            <ThemeSelector />
          </div>
        )}

        {/* FONT THEME */}
        {activeTab === "fontTheme" && (
          <div className="settings-content">
            <button
              className="back-btn"
              onClick={() => setActiveTab("main")}
            >
              ← Back
            </button>

            <FontThemeSelector />
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="settings-content">
            <NotificationsSettings
              onBack={() => setActiveTab("main")}
            />
          </div>
        )}

      </div>
    </div>
  );
}
