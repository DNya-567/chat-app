import { createContext, useContext, useEffect, useState } from "react";
import { initSocket, destroySocket } from "../services/socket";
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

  /* ---------- Init socket (once per auth) ---------- */
  useEffect(() => {
    if (!user?._id || !token) return;

    const socket = initSocket(token);
    socket.connect();

    return () => {
      destroySocket();
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
