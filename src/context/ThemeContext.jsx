import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

const themes = {
  dark: {
    "--bg-main": "#0e0e10",
    "--bg-sidebar": "#141417",
    "--bg-surface": "#0f172a",
    "--bg-input": "#1f2933",
    "--text-primary": "#e5e7eb",
    "--text-muted": "#9ca3af",
    "--border": "#1f2933",
    "--hover": "#1f2933",
    "--accent": "#4f46e5",
  },

  light: {
    "--bg-main": "#f5f7fb",
    "--bg-sidebar": "#ffffff",
    "--bg-surface": "#ffffff",
    "--bg-input": "#f1f5f9",
    "--text-primary": "#111827",
    "--text-muted": "#6b7280",
    "--border": "#e5e7eb",
    "--hover": "#e5e7eb",
    "--accent": "#2563eb",
  },

  amoled: {
    "--bg-main": "#000000",
    "--bg-sidebar": "#0a0a0a",
    "--bg-surface": "#0f0f0f",
    "--bg-input": "#141414",
    "--text-primary": "#ffffff",
    "--text-muted": "#a1a1aa",
    "--border": "#1a1a1a",
    "--hover": "#1f1f1f",
    "--accent": "#22ff88",
  },
  neon: {
  /* Backgrounds */
  "--bg-main": "#0b0f14",        // deep blue‑black
  "--bg-sidebar": "#0f141b",    // slightly lifted
  "--bg-surface": "#121926",    // cards / headers
  "--bg-input": "#151d2e",      // inputs & bubbles

  /* Text */
  "--text-primary": "#e6edf6",  // soft white
  "--text-muted": "#9aa4b2",    // calm gray‑blue

  /* Borders & hover */
  "--border": "#1f2a3a",
  "--hover": "#182235",

  /* Accent (soft cyan‑blue glow) */
  "--accent": "#5ddcff",
  
}


};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return themes[saved] ? saved : "dark";
  });

  useEffect(() => {
    const vars = themes[theme];

    if (!vars || typeof vars !== "object") {
      console.error("❌ Invalid theme:", theme);
      return;
    }

    Object.entries(vars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
