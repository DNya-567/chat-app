import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./EditProfile.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function EditProfile({ user, onBack }) {
  const [username, setUsername] = useState(user?.username || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { updateUser, token } = useAuth();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setError("");
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!username.trim()) {
      setError("Username cannot be empty");
      return;
    }

    setSaving(true);
    setError("");

    const formData = new FormData();
    formData.append("userId", user._id);
    formData.append("username", username.trim());

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    try {
      const res = await fetch(
        `${API_URL}/api/users/update-profile`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Profile update failed");
      }

      const data = await res.json();
      updateUser(data.user);
      onBack();
    } catch (err) {
      console.error("❌ Profile update error:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-profile">
      <button className="back-btn" onClick={onBack}>
        ← Back
      </button>

      {/* Avatar Section */}
      <div className="edit-avatar">
        <img
          src={
            avatarPreview ||
            "https://ui-avatars.com/api/?name=User&size=256"
          }
          alt="User Avatar"
        />
        <label className="avatar-label">
          📷 Change Photo
          <input
            className="avatar-input"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
          />
        </label>
        <p className="avatar-text">
          JPG, PNG or GIF (Max 5MB)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="profile-error">
          ⚠️ {error}
        </div>
      )}

      {/* Form Section */}
      <div className="edit-profile-form">
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={30}
          />
          <span className="char-count">
            {username.length}/30
          </span>
        </div>

        <div className="form-group">
          <label>User ID</label>
          <input
            type="text"
            value={user._id}
            disabled
            style={{ opacity: 0.6 }}
          />
          <span className="form-hint">
            This is your unique user identifier
          </span>
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            style={{ opacity: 0.6 }}
          />
          <span className="form-hint">
            Contact support to change email
          </span>
        </div>

        <div className="profile-info">
          💡 Your profile information will be visible to all users you chat with.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="profile-actions">
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={saving || !username.trim()}
        >
          {saving ? "⏳ Saving..." : "✓ Save Changes"}
        </button>
        <button
          className="cancel-btn"
          onClick={onBack}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
