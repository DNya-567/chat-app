import { useState } from "react";
import "./IconNavbar.css";

export default function IconNavbar({
  activePanel,
  setActivePanel,
  onLogout,
  onOpenSettings,
}) {
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [pressedIcon, setPressedIcon] = useState(null);

  const icons = [
    {
      id: "chats",
      icon: "💬",
      label: "Chats",
      title: "Your Conversations",
      color: "#6366f1",
    },
    {
      id: "settings",
      icon: "⚙️",
      label: "Settings",
      title: "App Settings",
      color: "#8b5cf6",
    },
    {
      id: "profile",
      icon: "👤",
      label: "Profile",
      title: "Your Profile",
      color: "#06b6d4",
    },
  ];

  const handleIconClick = (id) => {
    setPressedIcon(id);
    setTimeout(() => setPressedIcon(null), 150);

    if (id === "settings") {
      onOpenSettings();
    } else if (id === "profile") {
      setActivePanel("profile");
    } else {
      setActivePanel(id);
    }
  };

  const handleLogoutClick = () => {
    setPressedIcon("logout");
    setTimeout(() => setPressedIcon(null), 150);
    onLogout();
  };

  return (
    <div className="icon-navbar">
      <div className="icon-navbar-header">
        <div className="icon-navbar-brand">
          <span className="icon-navbar-logo">💭</span>
          <span className="icon-navbar-title">Chat</span>
        </div>
      </div>

      <div className="icon-navbar-divider"></div>

      <div className="icon-navbar-icons">
        {icons.map((item) => (
          <div
            key={item.id}
            className={`icon-item ${activePanel === item.id ? "active" : ""} ${
              pressedIcon === item.id ? "pressed" : ""
            }`}
            onClick={() => handleIconClick(item.id)}
            onTouchStart={() => setHoveredIcon(item.id)}
            onTouchEnd={() => setHoveredIcon(null)}
            onMouseEnter={() => setHoveredIcon(item.id)}
            onMouseLeave={() => setHoveredIcon(null)}
            title={item.title}
            role="button"
            tabIndex="0"
          >
            <div className="icon-item-background" style={{ "--icon-color": item.color }}></div>
            <span className="icon-emoji">{item.icon}</span>
            <div className="icon-item-indicator"></div>
            {hoveredIcon === item.id && (
              <div className="icon-tooltip">{item.label}</div>
            )}
          </div>
        ))}
      </div>

      <div className="icon-navbar-divider"></div>

      <button
        className={`icon-logout-btn ${pressedIcon === "logout" ? "pressed" : ""}`}
        onClick={handleLogoutClick}
        title="Logout"
        onTouchStart={() => setHoveredIcon("logout")}
        onTouchEnd={() => setHoveredIcon(null)}
        onMouseEnter={() => setHoveredIcon("logout")}
        onMouseLeave={() => setHoveredIcon(null)}
      >
        <div className="icon-logout-background"></div>
        <span className="icon-emoji">🚪</span>
        {hoveredIcon === "logout" && (
          <div className="icon-tooltip">Logout</div>
        )}
      </button>

      <div className="icon-navbar-footer">
        <div className="icon-navbar-version">v1.0</div>
      </div>
    </div>
  );
}
