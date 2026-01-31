import { useState, useRef, useEffect } from "react";
import "./MessageActions.css";

export default function MessageActions({
  message,
  onReply,
  onDelete,
  onReact,
  isOwn,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const menuBtnRef = useRef(null);
  const emojiTriggerRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const emojis = [
    "👍", "❤️", "😂", "😢", "😮", "😡",
    "🔥", "✨", "👏", "🎉", "😍", "🤔",
    "👌", "💯", "🚀", "⭐", "💪", "🎊",
    "😎", "🥳", "💖", "😘", "🙌", "💬"
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      // If click is inside any of these refs, don't close
      if (
        (menuRef.current && menuRef.current.contains(target)) ||
        (menuBtnRef.current && menuBtnRef.current.contains(target)) ||
        (emojiTriggerRef.current && emojiTriggerRef.current.contains(target)) ||
        (emojiPickerRef.current && emojiPickerRef.current.contains(target))
      ) {
        return;
      }

      setShowMenu(false);
      setShowEmojiPicker(false);
    };

    // Use 'mousedown' so we catch early interactions, but ensure our handlers stop propagation
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleReply = () => {
    onReply(message);
    setShowMenu(false);
  };

  const handleDelete = () => {
    onDelete(message._id);
    setShowMenu(false);
  };

  const handleEmoji = (emoji) => {
    console.log("🎯 Emoji clicked:", emoji);
    // Emit reaction immediately
    onReact(message._id, emoji);
    // Keep the picker open briefly to show the selected emoji (avoid immediate flicker)
    setTimeout(() => {
      setShowEmojiPicker(false);
      setShowMenu(false);
    }, 150);
  };

  const handleReactClick = (e) => {
    e.stopPropagation();
    if (emojiTriggerRef.current) {
      const rect = emojiTriggerRef.current.getBoundingClientRect();
      setPickerPosition({
        top: rect.bottom + 6,
        left: rect.left,
      });
    }
    // toggle
    setShowEmojiPicker((s) => !s);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    if (menuBtnRef.current) {
      const rect = menuBtnRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 6,
        // Position aligned under the button to avoid gaps
        left: Math.max(8, rect.left),
      });
    }
    setShowMenu((s) => !s);
  };

  return (
    <div className="message-actions-container" ref={menuRef}>
      {/* Settings Button */}
      <button
        ref={menuBtnRef}
        className="message-actions-btn"
        onClick={handleMenuClick}
        title="Message options"
      >
        ⋮
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div
          className="message-actions-menu"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
        >
          {/* Reply Option */}
          <button
            className="message-action-item reply-action"
            onClick={handleReply}
          >
            <span className="action-icon">↩️</span>
            <span className="action-text">Reply</span>
          </button>

          {/* Emoji Reaction - Submenu */}
          <div className="message-action-item emoji-submenu">
            <button
              ref={emojiTriggerRef}
              className="emoji-trigger"
              onClick={handleReactClick}
            >
              <span className="action-icon">😊</span>
              <span className="action-text">React</span>
              <span className="arrow">›</span>
            </button>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="emoji-picker"
                style={{
                  top: `${pickerPosition.top}px`,
                  left: `${Math.max(8, pickerPosition.left - 140)}px`,
                }}
              >
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    className="emoji-option"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEmoji(emoji);
                    }}
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete Option - Only for own messages */}
          {isOwn && (
            <button
              className="message-action-item delete-action"
              onClick={handleDelete}
            >
              <span className="action-icon">🗑️</span>
              <span className="action-text">Delete</span>
            </button>
          )}

          {/* Divider for future actions */}
          <div className="message-action-divider"></div>

          {/* Placeholder for future actions */}
          <div className="message-action-item disabled">
            <span className="action-icon">📌</span>
            <span className="action-text">Pin</span>
            <span className="coming-soon">Soon</span>
          </div>

          <div className="message-action-item disabled">
            <span className="action-icon">✏️</span>
            <span className="action-text">Edit</span>
            <span className="coming-soon">Soon</span>
          </div>

          <div className="message-action-item disabled">
            <span className="action-icon">⚡</span>
            <span className="action-text">Forward</span>
            <span className="coming-soon">Soon</span>
          </div>
        </div>
      )}
    </div>
  );
}
