import "./MiddlePanel.css";

export default function MiddlePanel({
  activePanel,
  chats,
  activeChat,
  setActiveChat,
  searchId,
  setSearchId,
  searchError,
  onStartChat,
  user,
  getOtherUser,
}) {
  if (activePanel === "settings" || activePanel === "profile") {
    return null;
  }

  return (
    <div className="middle-panel">
      <div className="middle-header">
        <h2 className="middle-title">
          {activePanel === "chats" ? "💬 Your Chats" : "Conversations"}
        </h2>
      </div>

      <div className="middle-search">
        <input
          className="middle-search-input"
          placeholder="Search by user ID..."
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
        <button className="middle-start-btn" onClick={onStartChat}>
          + Start Chat
        </button>
      </div>

      {searchError && <div className="middle-error">{searchError}</div>}

      <div className="middle-chat-list">
        {chats && chats.length > 0 ? (
          chats.map((chat) => {
            const other = getOtherUser(chat);
            const avatar =
              other?.avatar && other.avatar.startsWith("http")
                ? other.avatar
                : "https://ui-avatars.com/api/?name=" +
                  encodeURIComponent(other?.username || "User");

            const isActive = activeChat?._id === chat._id;

            return (
              <div
                key={chat._id}
                className={`middle-chat-item ${isActive ? "active" : ""}`}
                onClick={() => setActiveChat(chat)}
              >
                <img src={avatar} alt="avatar" className="middle-chat-avatar" />
                <div className="middle-chat-info">
                  <div className="middle-chat-name">
                    {other?.username || "Unknown"}
                  </div>
                  <div className="middle-chat-time">
                    {new Date(chat.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="middle-empty">
            <p>No chats yet</p>
            <p className="middle-empty-hint">Start a new chat to begin</p>
          </div>
        )}
      </div>
    </div>
  );
}
