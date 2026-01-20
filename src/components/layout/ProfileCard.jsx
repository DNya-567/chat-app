import { useAuth } from "../../context/AuthContext";

export default function ProfileCard() {
  const { user } = useAuth();

  const avatarUrl =
    user?.avatar || "https://ui-avatars.com/api/?name=User";

  return (
    <div
      style={{
        background: "#141414",
        borderRadius: "14px",
        padding: "20px",
        marginBottom: "16px",
        textAlign: "center",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          overflow: "hidden",
          margin: "0 auto 12px",
          background: "#1f2937",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {user?.avatar ? (
          <img
            src={avatarUrl}
            alt="avatar"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <span
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#fff",
            }}
          >
            {user.username[0].toUpperCase()}
          </span>
        )}
      </div>

      <h3 style={{ margin: 0 }}>{user.username}</h3>

      <p style={{ fontSize: "13px", opacity: 0.7 }}>
        {user.email || "user@email.com"}
      </p>
    </div>
  );
}
