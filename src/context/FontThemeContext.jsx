import { createContext, useContext, useEffect, useState } from "react";

const FontThemeContext = createContext();

const fontThemes = {
  default: {
    name: "Default",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    fontSize: "14px",
    lineHeight: "1.5",
    letterSpacing: "0px",
    icon: "📝",
  },

  modern: {
    name: "Modern",
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    fontSize: "15px",
    lineHeight: "1.6",
    letterSpacing: "0.3px",
    icon: "✨",
  },

  elegant: {
    name: "Elegant",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: "16px",
    lineHeight: "1.8",
    letterSpacing: "0.5px",
    icon: "💎",
  },

  compact: {
    name: "Compact",
    fontFamily: "'Courier New', monospace",
    fontSize: "13px",
    lineHeight: "1.4",
    letterSpacing: "0px",
    icon: "📦",
  },

  playful: {
    name: "Playful",
    fontFamily: "'Comic Sans MS', 'Comic Sans', cursive",
    fontSize: "15px",
    lineHeight: "1.6",
    letterSpacing: "0.2px",
    icon: "🎨",
  },

  minimal: {
    name: "Minimal",
    fontFamily: "'Arial', sans-serif",
    fontSize: "14px",
    lineHeight: "1.5",
    letterSpacing: "0px",
    icon: "⚪",
  },

  sophisticated: {
    name: "Sophisticated",
    fontFamily: "'Garamond', serif",
    fontSize: "15px",
    lineHeight: "1.7",
    letterSpacing: "0.4px",
    icon: "👑",
  },

  tech: {
    name: "Tech",
    fontFamily: "'Consolas', 'Monaco', monospace",
    fontSize: "13px",
    lineHeight: "1.5",
    letterSpacing: "0.1px",
    icon: "💻",
  },
};

export function FontThemeProvider({ children }) {
  const [fontTheme, setFontTheme] = useState(() => {
    const saved = localStorage.getItem("fontTheme");
    return fontThemes[saved] ? saved : "default";
  });

  useEffect(() => {
    const theme = fontThemes[fontTheme];

    if (!theme) {
      console.error("❌ Invalid font theme:", fontTheme);
      return;
    }

    const root = document.documentElement;
    root.style.setProperty("--font-family", theme.fontFamily);
    root.style.setProperty("--font-size", theme.fontSize);
    root.style.setProperty("--line-height", theme.lineHeight);
    root.style.setProperty("--letter-spacing", theme.letterSpacing);

    localStorage.setItem("fontTheme", fontTheme);
    console.log("✅ Font theme applied:", fontTheme);
  }, [fontTheme]);

  return (
    <FontThemeContext.Provider value={{ fontTheme, setFontTheme, fontThemes }}>
      {children}
    </FontThemeContext.Provider>
  );
}

export const useFontTheme = () => {
  const context = useContext(FontThemeContext);
  if (!context) {
    throw new Error("useFontTheme must be used within FontThemeProvider");
  }
  return context;
};
