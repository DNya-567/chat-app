import { useState, useEffect } from "react";
import "./ProfilePanel.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ProfilePanel({ user, onBack, isNavbarExpanded }) {
  const [copied, setCopied] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Enforce single scroll behavior on desktop
  useEffect(() => {
    const profilePanel = document.querySelector('.profile-panel');
    const profileContent = document.querySelector('.profile-content');

    if (window.innerWidth > 768 && profilePanel && profileContent) {
      // Force scroll properties
      profilePanel.style.overflow = 'hidden';
      profilePanel.style.overflowY = 'hidden';
      profilePanel.style.overflowX = 'hidden';

      profileContent.style.overflowY = 'auto';
      profileContent.style.overflowX = 'hidden';

      // Prevent any other scrollable elements
      const allChildren = profilePanel.querySelectorAll('*:not(.profile-content)');
      allChildren.forEach(child => {
        if (child !== profileContent) {
          child.style.overflow = 'visible';
        }
      });
    }
  }, []);

  // Fetch chat and message counts
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch chats count
        const chatsRes = await fetch(`${API_URL}/api/chats/my/${user._id}`);
        if (chatsRes.ok) {
          const chats = await chatsRes.json();
          setChatCount(Array.isArray(chats) ? chats.length : 0);
        }

        // Fetch message count - sum of messages from all chats
        const chatsRes2 = await fetch(`${API_URL}/api/chats/my/${user._id}`);
        if (chatsRes2.ok) {
          const chats = await chatsRes2.json();
          let totalMessages = 0;

          // Fetch messages for each chat
          if (Array.isArray(chats)) {
            for (const chat of chats) {
              try {
                const msgsRes = await fetch(`${API_URL}/api/messages/${chat._id}`);
                if (msgsRes.ok) {
                  const msgs = await msgsRes.json();
                  // Count only messages sent by this user
                  const userMessages = msgs.filter(
                    (msg) =>
                      (typeof msg.sender === "object"
                        ? msg.sender._id
                        : msg.sender) === user._id
                  );
                  totalMessages += userMessages.length;
                }
              } catch (err) {
                console.error(`Error fetching messages for chat ${chat._id}:`, err);
              }
            }
          }
          setMessageCount(totalMessages);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchStats();
    }
  }, [user._id]);

  const copyId = async () => {
    await navigator.clipboard.writeText(user._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const copyEmail = async () => {
    if (user.email) {
      await navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const getAvatarUrl = () => {
    if (user.avatar && user.avatar.startsWith("http")) {
      return user.avatar;
    }
    return "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(user.username || "User");
  };

  return (
    <div className={`profile-panel ${isNavbarExpanded ? 'navbar-expanded' : ''}`}>
      <div className="profile-header">
        <button className="profile-back-btn" onClick={onBack}>
          ← Back
        </button>
        <h2 className="profile-title">👤 Your Profile</h2>
      </div>

      <div className="profile-content">
        {/* Avatar Section */}
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper">
            <img src={getAvatarUrl()} alt="profile" className="profile-avatar" />
          </div>
          <h3 className="profile-username">{user.username}</h3>
          <p className="profile-status">🟢 Active Now</p>
        </div>

        {/* Info Section */}
        <div className="profile-info-section">
          {/* User ID */}
          <div className="profile-info-item">
            <div className="profile-info-label">👤 User ID</div>
            <div className="profile-info-value">
              <span className="profile-id-text">{user._id}</span>
              <button
                className="profile-copy-btn"
                onClick={copyId}
                title="Copy ID"
              >
                {copied ? "✓" : "📋"}
              </button>
            </div>
          </div>

          {/* Email */}
          <div className="profile-info-item">
            <div className="profile-info-label">📧 Email</div>
            <div className="profile-info-value">
              <span className="profile-email-text">{user.email || "Not set"}</span>
              {user.email && (
                <button
                  className="profile-copy-btn"
                  onClick={copyEmail}
                  title="Copy Email"
                >
                  {copied ? "✓" : "📋"}
                </button>
              )}
            </div>
          </div>

          {/* Join Date */}
          <div className="profile-info-item">
            <div className="profile-info-label">📅 Joined</div>
            <div className="profile-info-value">
              <span className="profile-date-text">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Unknown"}
              </span>
            </div>
          </div>

          {/* Account Status */}
          <div className="profile-info-item">
            <div className="profile-info-label">⚙️ Status</div>
            <div className="profile-info-value">
              <span className="profile-status-badge">Active</span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="profile-stats-section">
          <div className="profile-stat">
            <div className="profile-stat-value">
              {loading ? "..." : chatCount}
            </div>
            <div className="profile-stat-label">Chats</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">
              {loading ? "..." : messageCount}
            </div>
            <div className="profile-stat-label">Messages</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">🟢</div>
            <div className="profile-stat-label">Online</div>
          </div>
        </div>


        {/* Bio/About */}
        <div className="profile-about-section">
          <div className="profile-about-title">📝 About</div>
          <div className="profile-about-content">
            {user.about || "No bio added yet. Add one in settings!"}
          </div>
        </div>
      </div>
    </div>
  );
}
