import { useState } from "react";

export default function NotificationsSettings({ onBack }) {
  const [enabled, setEnabled] = useState(
    JSON.parse(localStorage.getItem("notify-enabled") ?? "true")
  );
  const [sound, setSound] = useState(
    JSON.parse(localStorage.getItem("notify-sound") ?? "true")
  );
  const [preview, setPreview] = useState(
    JSON.parse(localStorage.getItem("notify-preview") ?? "true")
  );
  const [dnd, setDnd] = useState(
    JSON.parse(localStorage.getItem("notify-dnd") ?? "false")
  );

  const save = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  return (
    <div className="settings-content">
      <button className="back-btn" onClick={onBack}>
        ← Back
      </button>

      <SettingToggle
        label="Enable Notifications"
        value={enabled}
        onChange={(v) => {
          setEnabled(v);
          save("notify-enabled", v);
        }}
      />

      <SettingToggle
        label="Message Preview"
        value={preview}
        disabled={!enabled}
        onChange={(v) => {
          setPreview(v);
          save("notify-preview", v);
        }}
      />

      <SettingToggle
        label="Sound"
        value={sound}
        disabled={!enabled}
        onChange={(v) => {
          setSound(v);
          save("notify-sound", v);
        }}
      />

      <SettingToggle
        label="Do Not Disturb"
        value={dnd}
        onChange={(v) => {
          setDnd(v);
          save("notify-dnd", v);
        }}
      />
    </div>
  );
}

function SettingToggle({ label, value, onChange, disabled }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        opacity: disabled ? 0.5 : 1,
        padding: "10px 0",
      }}
    >
      <span>{label}</span>
      <input
        type="checkbox"
        checked={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}
