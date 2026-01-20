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
  "--bg-main": "#000000",        // true black
  "--bg-sidebar": "#0a0a0a",     // slightly lifted
  "--bg-surface": "#0f0f0f",     // cards / headers
  "--bg-input": "#141414",       // inputs & bubbles

  "--text-primary": "#ffffff",
  "--text-muted": "#a1a1aa",

  "--border": "#1a1a1a",
  "--hover": "#1f1f1f",

  "--accent": "#22ff88",         // neon green accent
},

};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    const vars = themes[theme];
    Object.keys(vars).forEach((key) => {
      document.documentElement.style.setProperty(key, vars[key]);
    });

    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
