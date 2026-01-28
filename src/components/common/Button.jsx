import { useState } from "react";
import "./Button.css";

function Button({ text, onClick, disabled = false, variant = "primary" }) {
  const [ripples, setRipples] = useState([]);

  const handleMouseDown = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      id: Date.now(),
      x,
      y,
      size,
    };

    setRipples((prev) => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  };

  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      className={`btn btn-${variant}`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      disabled={disabled}
    >
      <span className="btn-content">{text}</span>
      <div className="ripples-container">
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}
      </div>
    </button>
  );
}

export default Button;


