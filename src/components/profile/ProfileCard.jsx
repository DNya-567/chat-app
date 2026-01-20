import { useState } from "react";

export default function ProfileCard({ user }) {
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    await navigator.clipboard.writeText(user._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      style={{
        textAlign: "center",
        marginBottom: "20px",
        paddingBottom: "16px",
        borderBottom: "1px solid #222",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          overflow: "hidden",
          background: "#4f46e5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 8px",
        }}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt="avatar"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <span style={{ fontSize: "26px", color: "#fff" }}>
            {user.username?.[0]?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Username */}
      <div style={{ fontWeight: "600", marginBottom: "6px" }}>
        {user.username}
      </div>

      {/* User ID */}
      <div
        style={{
          fontSize: "12px",
          opacity: 0.7,
          wordBreak: "break-all",
          marginBottom: "8px",
        }}
      >
        ID: {user._id}
      </div>

      {/* Copy Button */}
      <button
        onClick={copyId}
        style={{
          padding: "6px 12px",
          fontSize: "12px",
          borderRadius: "8px",
          background: copied ? "#1e7f4f" : "#1a1a1a",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        {copied ? "Copied ✓" : "Copy ID"}
      </button>
    </div>
  );
}
