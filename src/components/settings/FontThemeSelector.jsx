import { useFontTheme } from "../../context/FontThemeContext";
import "./FontThemeSelector.css";

export default function FontThemeSelector() {
  const { fontTheme, setFontTheme, fontThemes } = useFontTheme();

  return (
    <div className="font-theme-selector">
      <h3 className="font-theme-title">📝 Message Font Style</h3>

      <div className="font-theme-options">
        {Object.entries(fontThemes).map(([key, theme]) => (
          <label
            key={key}
            className={`font-theme-option ${fontTheme === key ? "active" : ""}`}
          >
            <input
              type="radio"
              name="fontTheme"
              value={key}
              checked={fontTheme === key}
              onChange={() => setFontTheme(key)}
            />

            <div className="font-theme-card">
              <span className="font-theme-icon">{theme.icon}</span>
              <span className="font-theme-label">{theme.name}</span>
              <p className="font-theme-preview">Sample text</p>
            </div>
          </label>
        ))}
      </div>

      <div className="font-theme-preview-box">
        <p className="font-theme-description">
          📌 Your messages will appear in{" "}
          <strong>{fontThemes[fontTheme].name}</strong> font style
        </p>
      </div>
    </div>
  );
}
