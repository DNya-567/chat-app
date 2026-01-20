import { createContext, useContext, useEffect, useState } from "react";
import { initSocket, whenConnected, destroySocket } from "../services/socket";
import { normaliseUser } from "../services/normaliseUser";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------- Restore session ---------- */
  useEffect(() => {
    const stored = sessionStorage.getItem("auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.user && parsed?.token) {
        setUser(normaliseUser(parsed.user));
        setToken(parsed.token);
      }
    }
    setLoading(false);
  }, []);

  /* ---------- Create & connect socket ---------- */
  useEffect(() => {
    if (!user?._id || !token) return;

    const sock = initSocket(token);
    sock.connect();

    whenConnected(sock).then(() => {
      console.log("[Auth] 📤 join_user_chats →", user._id);
      sock.emit("join_user_chats", { userId: user._id });
    });

    return () => {
      destroySocket();
    };
  }, [user?._id, token]);

  /* ---------- Login ---------- */
  const login = (loginResponse) => {
    const norm = normaliseUser(loginResponse.user);
    setUser(norm);
    setToken(loginResponse.token);
    sessionStorage.setItem(
      "auth",
      JSON.stringify({ user: norm, token: loginResponse.token })
    );
  };

  /* ---------- 🔥 UPDATE USER (NEW) ---------- */
  const updateUser = (updatedUser) => {
    setUser((prev) => {
      const merged = { ...prev, ...normaliseUser(updatedUser) };

      sessionStorage.setItem(
        "auth",
        JSON.stringify({ user: merged, token })
      );

      return merged;
    });
  };

  /* ---------- Logout ---------- */
  const logout = () => {
    destroySocket();
    setUser(null);
    setToken(null);
    sessionStorage.removeItem("auth");
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        updateUser, // ✅ exposed
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
