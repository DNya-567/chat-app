import "./Input.css";

function Input({
  type = "text",
  placeholder,
  value,
  onChange,
  onKeyPress,
  icon = null,
  label = null,
  error = null,
  disabled = false
}) {
  return (
    <div className="input-wrapper">
      {label && <label className="input-label">{label}</label>}
      <div className="input-container">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyPress={onKeyPress}
          disabled={disabled}
          className={`input-field ${icon ? 'with-icon' : ''} ${error ? 'input-error' : ''}`}
        />
      </div>
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
}

export default Input;



