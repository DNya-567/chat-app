import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function EditProfile({ user, onBack }) {
  const [username, setUsername] = useState(user?.username || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const { updateUser, token } = useAuth();

  /* -------------------- Avatar Change -------------------- */
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  /* -------------------- Save Profile -------------------- */
  const handleSave = async () => {
    if (!username.trim()) {
      alert("Username cannot be empty");
      return;
    }

    setSaving(true);

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

      // 🔥 Instant global UI update
      updateUser(data.user);

      alert("Profile updated successfully");
      onBack();
    } catch (err) {
      console.error("❌ Profile update error:", err);
      alert(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-profile">
      <button className="back-btn" onClick={onBack}>
        ← Back
      </button>

      <div className="edit-avatar">
        <img
          src={
            avatarPreview ||
            "https://ui-avatars.com/api/?name=User"
          }
          alt="avatar"
        />

        <label className="change-avatar">
          Change photo
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
          />
        </label>
      </div>

      <label className="edit-label">Username</label>
      <input
        className="edit-input"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <label className="edit-label">User ID</label>
      <input
        className="edit-input"
        value={user._id}
        disabled
      />

      <button
        className="save-btn"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
