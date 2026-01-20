import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import EditProfile from "./EditProfile";
import ThemeSelector from "./ThemeSelector";
import NotificationsSettings from "./NotificationsSettings";

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

            <div className="settings-item">
              🔒 Privacy
            </div>
          </div>
        )}

        {/* PROFILE */}
        {activeTab === "profile" && (
          <EditProfile
            user={user}
            onBack={() => setActiveTab("main")}
          />
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
        {activeTab === "notifications" && (
  <NotificationsSettings
    onBack={() => setActiveTab("main")}
  />
)}


        
      </div>
    </div>
  );
}
