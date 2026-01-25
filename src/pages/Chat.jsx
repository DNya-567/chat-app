import { useEffect, useRef, useState } from "react";
import { getSocket, whenConnected } from "../services/socket";
import { useAuth } from "../context/AuthContext";
import ProfileCard from "../components/profile/ProfileCard";
import SettingsModal from "../components/settings/SettingsModal";
import "./Chat.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Chat() {
  const { user, logout, loading } = useAuth();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const [searchId, setSearchId] = useState("");
  const [searchError, setSearchError] = useState("");

  const [socketReady, setSocketReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const joinedRooms = useRef(new Set());

  /* -------------------- SAFETY -------------------- */
  if (loading) return <div className="flex-center">Loading…</div>;
  if (!user?._id) return <div className="flex-center">Loading user…</div>;

  /* -------------------- SOCKET INIT -------------------- */
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;

    socketRef.current = sock;

    whenConnected(sock).then(() => {
      setSocketReady(true);
    });
  }, []);

  /* -------------------- SOCKET LISTENERS -------------------- */
  useEffect(() => {
    if (!socketReady) return;
    const sock = socketRef.current;
    if (!sock) return;

    const onChatMessages = (msgs) => setMessages(msgs);

    const onReceiveMessage = (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;

        const index = prev.findIndex(
          (m) =>
            m._id.startsWith("tmp-") &&
            getSenderId(m) === getSenderId(msg)
        );

        if (index === -1) return [...prev, msg];

        const copy = [...prev];
        copy[index] = msg;
        return copy;
      });
    };

    const onMessageUpdated = (updatedMsg) => {
      setMessages((prev) => {
        const index = prev.findIndex((m) => m._id === updatedMsg._id);
        if (index === -1) return prev;

        const copy = [...prev];
        copy[index] = {
          ...updatedMsg,
          reactions: updatedMsg.reactions || [],
        };
        return copy;
      });
    };

    const onNewChat = (chat) => {
      setChats((prev) => {
        if (prev.some((c) => c._id === chat._id)) return prev;
        return [chat, ...prev];
      });
    };

    sock.on("chat_messages", onChatMessages);
    sock.on("receive_message", onReceiveMessage);
    sock.on("message_updated", onMessageUpdated);
    sock.on("new_chat", onNewChat);

    return () => {
      sock.off("chat_messages", onChatMessages);
      sock.off("receive_message", onReceiveMessage);
      sock.off("message_updated", onMessageUpdated);
      sock.off("new_chat", onNewChat);
    };
  }, [socketReady]);

  /* -------------------- LOAD CHATS -------------------- */
  useEffect(() => {
    fetch(`${API_URL}/api/chats/my/${user._id}`)
      .then((r) => r.json())
      .then(setChats)
      .catch(console.error);
  }, [user._id]);

  /* -------------------- OPEN CHAT -------------------- */
  const openChat = async (chat) => {
    if (!chat?._id || !socketReady) return;

    setActiveChat(chat);
    setMessages([]);

    const sock = socketRef.current;
    if (!sock) return;

    await whenConnected(sock);

    if (!joinedRooms.current.has(chat._id)) {
      sock.emit("join_chat", { chatId: chat._id });
      joinedRooms.current.add(chat._id);
    }

    sock.emit("load_messages", { chatId: chat._id });
  };

  /* -------------------- START CHAT BY ID (SEARCH) -------------------- */
  const startChatById = async () => {
    setSearchError("");
    if (!searchId.trim()) return;

    try {
      const userRes = await fetch(`${API_URL}/api/users/${searchId}`);
      if (!userRes.ok) {
        setSearchError("User not found");
        return;
      }

      const otherUser = await userRes.json();

      const chatRes = await fetch(`${API_URL}/api/chats/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          otherUserId: otherUser._id,
        }),
      });

      const chat = await chatRes.json();

      setChats((prev) =>
        prev.some((c) => c._id === chat._id) ? prev : [chat, ...prev]
      );

      openChat(chat);
      setSearchId("");
    } catch {
      setSearchError("Invalid user ID");
    }
  };

  /* -------------------- SEND MESSAGE -------------------- */
  const sendMessage = () => {
    if (!message.trim() || !activeChat || !socketReady) return;

    const sock = socketRef.current;
    if (!sock) return;

    const payload = {
      chatId: activeChat._id,
      senderId: user._id,
      text: message.trim(),
    };

    sock.emit("send_message", payload);

    setMessages((prev) => [
      ...prev,
      {
        _id: `tmp-${Date.now()}`,
        chatId: payload.chatId,
        sender: user._id,
        text: payload.text,
        createdAt: new Date().toISOString(),
        reactions: [],
        deleted: false,
      },
    ]);

    setMessage("");
  };

  /* -------------------- REACT MESSAGE -------------------- */
  const reactToMessage = (messageId, emoji) => {
    if (messageId.startsWith("tmp-")) return;

    socketRef.current?.emit("react_message", {
      messageId,
      emoji,
      userId: user._id,
    });
  };

  /* -------------------- DELETE MESSAGE -------------------- */
  const deleteMessage = (messageId) => {
    if (messageId.startsWith("tmp-")) return;

    socketRef.current?.emit("delete_message", {
      messageId,
      userId: user._id,
    });
  };

  /* -------------------- HELPERS -------------------- */
  const getOtherUser = (chat) =>
    chat.participants?.find((p) => p._id !== user._id);

  const getSenderId = (msg) =>
    typeof msg.sender === "object" ? msg.sender._id : msg.sender;

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  /* -------------------- AUTO SCROLL -------------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* -------------------- UI -------------------- */
  return (
    <div className="chat-container">
      {/* LEFT SIDEBAR */}
      <div className="chat-sidebar">
        <ProfileCard user={user} />

        <input
          className="chat-search"
          placeholder="Search user by ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />

        <button className="chat-start-btn" onClick={startChatById}>
          Start Chat
        </button>

        {searchError && <div className="error">{searchError}</div>}

        <div className="chat-list">
          {chats.map((chat) => {
            const other = getOtherUser(chat);
            return (
              <div
                key={chat._id}
                onClick={() => openChat(chat)}
                className={`chat-item ${
                  activeChat?._id === chat._id ? "active" : ""
                }`}
              >
                <img
                  src={
                    other?.avatar
                      ? other.avatar.startsWith("http")
                        ? other.avatar
                        : `${API_URL}${other.avatar}`
                      : "/default-avatar.png"
                  }
                  className="chat-avatar"
                  alt="avatar"
                />
                <span className="chat-username">
                  {other?.username || "Unknown"}
                </span>
              </div>
            );
          })}
        </div>

        <button
          className="chat-start-btn"
          onClick={() => setShowSettings(true)}
        >
          ⚙ Settings
        </button>

        <button className="chat-start-btn" onClick={logout}>
          Logout
        </button>
      </div>

      {/* MAIN CHAT */}
      <div className="chat-main">
        {!activeChat ? (
          <div className="chat-messages flex-center">Select a chat</div>
        ) : (
          <>
            <div className="chat-header">
              Chat with {getOtherUser(activeChat)?.username}
            </div>

            <div className="chat-messages">
              {messages.map((msg) => {
                const mine = getSenderId(msg) === user._id;

                return (
                  <div
                    key={msg._id}
                    className={`message-row ${mine ? "mine" : ""}`}
                  >
                    <div className={`message-bubble ${mine ? "mine" : "other"}`}>
                      <div className="message-text">
                        {msg.deleted ? <i>{msg.text}</i> : msg.text}
                      </div>

                      <div className="message-time">
                        {formatTime(msg.createdAt)}
                      </div>

                      {msg.reactions?.length > 0 && (
                        <div className="reactions">
                          {msg.reactions.map((r, i) => (
                            <span key={`${r.userId}-${i}`}>{r.emoji}</span>
                          ))}
                        </div>
                      )}

                      {!msg.deleted && (
                        <div className="message-actions">
                          {["👍", "❤️", "😂", "😢"].map((e) => (
                            <span
                              key={e}
                              onClick={() => reactToMessage(msg._id, e)}
                            >
                              {e}
                            </span>
                          ))}

                          {mine && (
                            <span
                              className="delete-btn"
                              onClick={() => deleteMessage(msg._id)}
                            >
                              🗑️
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-bar">
              <input
                className="chat-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
              />
              <button className="chat-send-btn" onClick={sendMessage}>
                Send
              </button>
            </div>
          </>
        )}
      </div>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
