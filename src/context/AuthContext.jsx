import { createContext, useContext, useEffect, useState } from "react";
import { initSocket, destroySocket } from "../services/socket";
import { normaliseUser } from "../services/normaliseUser";
import API_BASE_URL from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socketReady, setSocketReady] = useState(false);


  /* ---------- Restore session ---------- */
  useEffect(() => {
    const stored = sessionStorage.getItem("auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.user && parsed?.token) {
          setUser(normaliseUser(parsed.user));
          setToken(parsed.token);
        }
      } catch {
        sessionStorage.removeItem("auth");
      }
    }
    setLoading(false);
  }, []);

  /* ---------- Warm up backend (Render cold start) ---------- */
  useEffect(() => {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 4000);

    fetch(`${API_BASE_URL}/health`, { signal: ctrl.signal })
      .catch(() => {
        // ignore warm-up failures
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      clearTimeout(timeout);
      ctrl.abort();
    };
  }, []);

  /* ---------- Init socket (once per auth) ---------- */
useEffect(() => {
  if (!user?._id || !token) {
    console.log("⛔ skipping socket init (missing user/token)");
    return;
  }

  const sock = initSocket(token);

  console.log("🚀 calling socket.connect()");
  sock.connect();

  sock.once("connect", () => {
  console.log("✅ socket connected → joining user chats");
  sock.emit("join_user_chats", { userId: user._id });
  setSocketReady(true);
});


  return () => {
    destroySocket();
    setSocketReady(false);
  };
}, [user?._id, token]);


  /* ---------- Login ---------- */
  const login = ({ user, token }) => {
    const norm = normaliseUser(user);
    setUser(norm);
    setToken(token);

    sessionStorage.setItem(
      "auth",
      JSON.stringify({ user: norm, token })
    );
  };

  /* ---------- Update user ---------- */
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
        socketReady,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
