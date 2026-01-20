import { useEffect, useRef, useState } from "react";
import { getSocket, whenConnected } from "../services/socket";
import { useAuth } from "../context/AuthContext";
import ProfileCard from "../components/profile/ProfileCard";
import SettingsModal from "../components/settings/SettingsModal";
import "./Chat.css";

const log = (...args) => console.log("[Chat]", ...args);

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
    const interval = setInterval(() => {
      const sock = getSocket();
      if (sock) {
        socketRef.current = sock;

        whenConnected(sock).then(() => {
          log("📡 socket connected:", sock.id);
          setSocketReady(true);
        });

        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  /* -------------------- SOCKET LISTENERS -------------------- */
  useEffect(() => {
    if (!socketReady) return;
    const sock = socketRef.current;
    if (!sock) return;

    const onChatMessages = (msgs) => {
      setMessages(msgs);
    };

    const onReceiveMessage = (msg) => {
      const senderId =
        typeof msg.sender === "object" ? msg.sender._id : msg.sender;

      // ignore optimistic echo
      if (senderId === user._id) return;

      setMessages((prev) => [...prev, msg]);
    };

    sock.on("chat_messages", onChatMessages);
    sock.on("receive_message", onReceiveMessage);

    return () => {
      sock.off("chat_messages", onChatMessages);
      sock.off("receive_message", onReceiveMessage);
    };
  }, [socketReady, user._id]);

  /* -------------------- LOAD CHATS -------------------- */
  useEffect(() => {
    fetch(`http://localhost:5000/api/chats/my/${user._id}`)
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

  /* -------------------- SEND MESSAGE -------------------- */
  const sendMessage = async () => {
    if (!message.trim() || !activeChat || !socketReady) return;

    const sock = socketRef.current;
    if (!sock) return;

    const payload = {
      chatId: activeChat._id,
      senderId: user._id,
      text: message.trim(),
    };

    sock.emit("send_message", payload);

    // optimistic UI
    setMessages((prev) => [
      ...prev,
      { ...payload, sender: user._id, _id: `tmp-${Date.now()}` },
    ]);

    setMessage("");
  };

  /* -------------------- START CHAT BY ID -------------------- */
  const startChatById = async () => {
    setSearchError("");

    try {
      const userRes = await fetch(
        `http://localhost:5000/api/users/${searchId}`
      );

      if (!userRes.ok) {
        setSearchError("User not found");
        return;
      }

      const otherUser = await userRes.json();

      const chatRes = await fetch(
        "http://localhost:5000/api/chats/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id,
            otherUserId: otherUser._id,
          }),
        }
      );

      const chat = await chatRes.json();

      setChats((prev) =>
        prev.some((c) => c._id === chat._id) ? prev : [chat, ...prev]
      );

      openChat(chat);
    } catch {
      setSearchError("Invalid user ID");
    }
  };

  /* -------------------- AUTO SCROLL -------------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* -------------------- HELPERS -------------------- */
  const getOtherUser = (chat) =>
    chat.participants?.find((p) => p._id !== user._id);

  const getSenderId = (msg) =>
    typeof msg.sender === "object" ? msg.sender._id : msg.sender;

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
          {chats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => openChat(chat)}
              className={`chat-item ${
                activeChat?._id === chat._id ? "active" : ""
              }`}
            >
              {getOtherUser(chat)?.username || "Unknown"}
            </div>
          ))}
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
          <div className="chat-messages flex-center">
            Select a chat
          </div>
        ) : (
          <>
            <div className="chat-header">
              Chat with {getOtherUser(activeChat)?.username}
            </div>

            <div className="chat-messages">
              {messages.map((msg, i) => {
                const mine = getSenderId(msg) === user._id;

                return (
                  <div
                    key={i}
                    className={`message-row ${mine ? "mine" : ""}`}
                  >
                    <div
                      className={`message-bubble ${
                        mine ? "mine" : "other"
                      } animate-msg`}
                    >
                      {msg.text}
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
              <button
                className="chat-send-btn"
                onClick={sendMessage}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
