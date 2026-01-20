import { useAuth } from "../../context/AuthContext";
import ProfileCard from "./ProfileCard";

export default function RightPanel({ onOpenSettings }) {
  const { logout } = useAuth();

  return (
    <div className="right-panel">
      {/* PROFILE */}
      <ProfileCard />

      {/* MENU */}
      <div className="right-panel-menu">
        <MenuItem label="👤 Profile" />
        <MenuItem label="⚙️ Settings" onClick={onOpenSettings} />
        <MenuItem label="🔒 Privacy" />
        <MenuItem label="💬 Chats" />
      </div>

      {/* LOGOUT */}
      <button className="right-panel-logout" onClick={logout}>
        🚪 Logout
      </button>
    </div>
  );
}

/* ---------------- MENU ITEM ---------------- */

function MenuItem({ label, onClick }) {
  return (
    <div className="right-panel-item" onClick={onClick}>
      {label}
    </div>
  );
}
