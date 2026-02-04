import { useState, useRef, useEffect } from "react";
import "./MessageActions.css";

export default function MessageActions({
  message,
  onReply,
  onDelete,
  onReact,
  onPin,
  onEdit,
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

  const MENU_MARGIN = 8;
  const MENU_DEFAULT_WIDTH = 180;

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

    // Use 'mousedown' so we catch early interactions
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleReply = () => {
    onReply(message);
    setShowMenu(false);
  };

  const handleDelete = () => {
    onDelete(message._id);
    setShowMenu(false);
  };

  const handlePin = () => {
    onPin(message._id);
    setShowMenu(false);
  };

  const handleEdit = () => {
    onEdit(message);
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
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = rect.bottom + 6;
      let left = rect.left;

      // Clamp horizontally within viewport
      if (left + MENU_DEFAULT_WIDTH > viewportWidth - MENU_MARGIN) {
        left = Math.max(MENU_MARGIN, viewportWidth - MENU_DEFAULT_WIDTH - MENU_MARGIN);
      } else {
        left = Math.max(MENU_MARGIN, left);
      }

      // Basic vertical clamp to keep menu visible in viewport
      const estimatedMenuHeight = 280;
      if (top + estimatedMenuHeight > viewportHeight - MENU_MARGIN) {
        top = Math.max(MENU_MARGIN, rect.top - estimatedMenuHeight - 6);
      }

      setMenuPosition({
        top,
        left,
      });
    }
    setShowMenu((s) => !s);
  };

  return (
    <div className={`message-actions-container ${showMenu ? "menu-open" : ""}`} ref={menuRef}>
      {/* Settings Button */}
      <button
        ref={menuBtnRef}
        className="message-actions-btn"
        onClick={handleMenuClick}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
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
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
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

          {/* Divider */}
          <div className="message-action-divider"></div>

          {/* Pin Option - Available to all users */}
          <button
            className="message-action-item pin-action"
            onClick={handlePin}
          >
            <span className="action-icon">{message.pinned ? "📌" : "📍"}</span>
            <span className="action-text">{message.pinned ? "Unpin" : "Pin"}</span>
          </button>

          {/* Edit Option - Only for own messages */}
          {isOwn && !message.deleted && (
            <button
              className="message-action-item edit-action"
              onClick={handleEdit}
            >
              <span className="action-icon">✏️</span>
              <span className="action-text">Edit</span>
            </button>
          )}

          {/* Forward Option - Placeholder for future */}
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
