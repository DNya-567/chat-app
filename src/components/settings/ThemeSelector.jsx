import { useTheme } from "../../context/ThemeContext";
import "./ThemeSelector.css";

const THEMES = [
  {
    id: "dark",
    label: "Dark",
    icon: "🌙",
  },
  {
    id: "light",
    label: "Light",
    icon: "☀️",
  },
  {
    id: "neon",
    label: "Neon",
    icon: "✨",
  },
];

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-selector">
      <h3 className="theme-title">Choose Theme</h3>

      <div className="theme-options">
        {THEMES.map((t) => (
          <label
            key={t.id}
            className={`theme-option ${
              theme === t.id ? "active" : ""
            }`}
          >
            <input
              type="radio"
              name="theme"
              value={t.id}
              checked={theme === t.id}
              onChange={() => setTheme(t.id)}
            />

            <div className="theme-card">
              <span className="theme-icon">{t.icon}</span>
              <span className="theme-label">{t.label}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
