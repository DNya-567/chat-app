import { useState } from "react";
import "./UserProfileModal.css";

export default function UserProfileModal({ user, isOpen, onClose }) {
  if (!isOpen || !user) return null;

  const formatJoinDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLastSeen = (date, isOnline) => {
    if (isOnline) return "Online now";
    if (!date) return "Unknown";

    const now = new Date();
    const lastSeen = new Date(date);
    const diffInSeconds = Math.floor((now - lastSeen) / 1000);

    if (diffInSeconds < 60) return "Just now";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return diffInMinutes === 1 ? "1 minute ago" : `${diffInMinutes} minutes ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return diffInDays === 1 ? "Yesterday" : `${diffInDays} days ago`;
    }

    if (diffInDays < 30) {
      const diffInWeeks = Math.floor(diffInDays / 7);
      return diffInWeeks === 1 ? "1 week ago" : `${diffInWeeks} weeks ago`;
    }

    return formatJoinDate(date);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="user-profile-modal-overlay" onClick={handleOverlayClick}>
      <div className="user-profile-modal">
        {/* Header */}
        <div className="profile-modal-header">
          <h2 className="profile-modal-title">User Profile</h2>
          <button className="profile-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Profile Content */}
        <div className="profile-modal-content">
          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-container">
              <img
                src={user.avatar || "/default-avatar.png"}
                alt={`${user.username}'s avatar`}
                className="profile-avatar-large"
              />
              <div className="profile-online-status">
                <span className={`status-indicator ${user.isOnline ? 'online' : 'offline'}`}>
                  {user.isOnline ? '🟢' : '⚫'}
                </span>
                <span className="status-text">
                  {user.isOnline ? 'Online' : formatLastSeen(user.lastSeen, false)}
                </span>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="profile-info-section">
            <div className="profile-field">
              <span className="field-icon">👤</span>
              <div className="field-content">
                <span className="field-label">Username</span>
                <span className="field-value">{user.username}</span>
              </div>
            </div>

            <div className="profile-field">
              <span className="field-icon">📧</span>
              <div className="field-content">
                <span className="field-label">Email</span>
                <span className="field-value">{user.email || "Not provided"}</span>
              </div>
            </div>

            <div className="profile-field">
              <span className="field-icon">📅</span>
              <div className="field-content">
                <span className="field-label">Member Since</span>
                <span className="field-value">
                  {user.createdAt ? formatJoinDate(user.createdAt) : "Unknown"}
                </span>
              </div>
            </div>

            <div className="profile-field">
              <span className="field-icon">🕒</span>
              <div className="field-content">
                <span className="field-label">Last Seen</span>
                <span className="field-value">
                  {formatLastSeen(user.lastSeen, user.isOnline)}
                </span>
              </div>
            </div>

            {user.bio && (
              <div className="profile-field bio-field">
                <span className="field-icon">📝</span>
                <div className="field-content">
                  <span className="field-label">Bio</span>
                  <span className="field-value bio-text">{user.bio}</span>
                </div>
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="profile-stats-section">
            <div className="profile-stat">
              <span className="stat-number">{user.messageCount || 0}</span>
              <span className="stat-label">Messages</span>
            </div>
            <div className="profile-stat">
              <span className="stat-number">{user.chatCount || 0}</span>
              <span className="stat-label">Chats</span>
            </div>
            <div className="profile-stat">
              <span className="stat-number">{user.friendCount || 0}</span>
              <span className="stat-label">Friends</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="profile-actions">
            <button className="profile-action-btn message-btn">
              💬 Send Message
            </button>
            <button className="profile-action-btn block-btn">
              🚫 Block User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
