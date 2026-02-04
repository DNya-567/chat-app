import { useState, useRef, useEffect } from "react";
import "./MessageSearch.css";

export default function MessageSearch({
  messages,
  onMessageFound,
  onSearchQueryChange,
  isVisible,
  onClose
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);

  // Focus input when search becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  // Search messages when query changes
  useEffect(() => {
    // Notify parent of search query change
    onSearchQueryChange?.(searchQuery);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentIndex(0);
      return;
    }

    setIsSearching(true);
    const query = searchQuery.toLowerCase();

    const results = messages.filter((message) => {
      // Don't search deleted messages
      if (message.deleted) return false;

      // Search in message text
      return message.text.toLowerCase().includes(query);
    });

    setSearchResults(results);
    setCurrentIndex(0);
    setIsSearching(false);

    // Navigate to first result if found
    if (results.length > 0) {
      onMessageFound(results[0]._id);
    }
  }, [searchQuery, messages, onMessageFound, onSearchQueryChange]);

  const handlePrevious = () => {
    if (searchResults.length === 0) return;

    const newIndex = currentIndex > 0 ? currentIndex - 1 : searchResults.length - 1;
    setCurrentIndex(newIndex);
    onMessageFound(searchResults[newIndex]._id);
  };

  const handleNext = () => {
    if (searchResults.length === 0) return;

    const newIndex = currentIndex < searchResults.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    onMessageFound(searchResults[newIndex]._id);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevious();
      } else {
        handleNext();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setSearchResults([]);
    setCurrentIndex(0);
    inputRef.current?.focus();
  };

  if (!isVisible) return null;

  return (
    <div className="message-search-bar">
      <div className="search-input-container">
        <span className="search-icon">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search messages..."
          className="search-input"
        />
        {searchQuery && (
          <button className="clear-search-btn" onClick={handleClear}>
            ✕
          </button>
        )}
      </div>

      <div className="search-controls">
        {searchResults.length > 0 && (
          <>
            <span className="search-count">
              {currentIndex + 1} of {searchResults.length}
            </span>
            <button
              className="search-nav-btn"
              onClick={handlePrevious}
              title="Previous (Shift+Enter)"
            >
              ↑
            </button>
            <button
              className="search-nav-btn"
              onClick={handleNext}
              title="Next (Enter)"
            >
              ↓
            </button>
          </>
        )}

        {searchQuery && searchResults.length === 0 && !isSearching && (
          <span className="no-results">No matches</span>
        )}

        <button className="close-search-btn" onClick={onClose} title="Close (Esc)">
          ✕
        </button>
      </div>
    </div>
  );
}
