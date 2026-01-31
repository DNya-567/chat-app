import { useEffect, useRef, useState } from "react";
import { getSocket, whenConnected } from "../services/socket";
import { useAuth } from "../context/AuthContext";
import IconNavbar from "../components/layout/IconNavbar";
import MiddlePanel from "../components/layout/MiddlePanel";
import ProfilePanel from "../components/profile/ProfilePanel";
import SettingsModal from "../components/settings/SettingsModal";
import MessageActions from "../components/chat/MessageActions";
import ReplyPreview from "../components/chat/ReplyPreview";
import "./Chat.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Chat() {
  const { user, logout, loading, socketReady } = useAuth();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  const [searchId, setSearchId] = useState("");
  const [searchError, setSearchError] = useState("");
  const [activePanel, setActivePanel] = useState("chats");
  const [showSettings, setShowSettings] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const joinedRooms = useRef(new Set());
  const requestedChatIdRef = useRef(null);

  /* -------------------- SAFETY -------------------- */
  if (loading) return <div className="flex-center">Loading…</div>;
  if (!user?._id) return <div className="flex-center">Loading user…</div>;

  /* -------------------- SOCKET INIT -------------------- */
  useEffect(() => {
    if (!socketReady) return;

    const sock = getSocket();
    if (!sock) {
      console.error("❌ Chat.jsx: socket still missing");
      return;
    }

    socketRef.current = sock;
    console.log("✅ Chat.jsx socket available");
  }, [socketReady]);

  /* -------------------- SOCKET LISTENERS -------------------- */
  useEffect(() => {
    if (!socketReady) return;
    const sock = socketRef.current;
    if (!sock) return;

    const normId = (id) => {
      if (!id) return null;
      if (typeof id === "string") return id;
      if (typeof id === "object") return id._id || id.toString();
      return String(id);
    };

    const onChatMessages = (data) => {
      const messages = Array.isArray(data) ? data : data.messages;
      const chatIdRaw = Array.isArray(data) ? undefined : data.chatId;
      const chatId = normId(chatIdRaw);

      // Only load messages if they're for the currently active chat
      const activeId = activeChat ? String(activeChat._id) : null;
      const requestedId = requestedChatIdRef.current;

      if (!activeId && !requestedId) return;

      if (chatId) {
        if (activeId && String(chatId) === String(activeId)) {
          // ok
        } else if (requestedId && String(chatId) === String(requestedId)) {
          requestedChatIdRef.current = null;
        } else {
          console.log("⛔ Ignoring messages from different chat", chatId, "active:", activeId, "requested:", requestedId);
          return;
        }
      }

      console.log("✅ Loading", messages.length, "messages for chat", chatId || activeId || requestedId);
      setMessages(messages);
    };

    const onReceiveMessage = (msg) => {
      const msgChatId = normId(msg.chatId);
      console.log('[socket] receive_message event', msg._id, msgChatId);

      const activeId = activeChat ? String(activeChat._id) : null;
      const requestedId = requestedChatIdRef.current;

      // Accept message if it belongs to the active chat OR the requested chat (UI switching race)
      if (!activeId && !requestedId) {
        console.log('⛔ Ignoring receive_message because no active or requested chat');
        return;
      }

      if (String(msgChatId) !== String(activeId) && String(msgChatId) !== String(requestedId)) {
        console.log(
          "⛔ Ignoring message from different chat:",
          msgChatId,
          "active:",
          activeId,
          "requested:",
          requestedId
        );
        return;
      }

      // If this was for the requested chat, clear the requested marker
      if (requestedId && String(msgChatId) === String(requestedId)) {
        requestedChatIdRef.current = null;
      }

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
      const updatedChatId = normId(updatedMsg.chatId);
      console.log("[socket] message_updated received:", updatedMsg._id, updatedMsg);

      const activeId = activeChat ? String(activeChat._id) : null;
      const requestedId = requestedChatIdRef.current;

      if (!activeId && !requestedId) {
        console.log('⛔ Ignoring message_updated because no active or requested chat');
        return;
      }

      if (String(updatedChatId) !== String(activeId) && String(updatedChatId) !== String(requestedId)) {
        console.log('⛔ Ignoring message_updated for different chat', updatedChatId, 'active:', activeId, 'requested:', requestedId);
        return;
      }

      if (requestedId && String(updatedChatId) === String(requestedId)) {
        requestedChatIdRef.current = null;
      }

      setMessages((prev) => {
        const index = prev.findIndex((m) => m._id === updatedMsg._id);
        if (index === -1) {
          // Not found - append
          return [...prev, updatedMsg];
        }

        const copy = [...prev];
        copy[index] = updatedMsg;
        return copy;
      });
    };

    const onNewChat = (chat) => {
      console.log("[socket] new_chat:", chat._id);
      setChats((prev) => {
        if (prev.some((c) => c._id === chat._id)) return prev;
        return [chat, ...prev];
      });
    };

    const onErrorMessage = (err) => {
      console.error("[socket] server error:", err);
      // Optionally show UI notification here
    };

    sock.on("chat_messages", onChatMessages);
    sock.on("receive_message", (m) => { console.log('[socket] receive_message', m._id); onReceiveMessage(m); });
    sock.on("message_updated", onMessageUpdated);
    sock.on("new_chat", onNewChat);
    sock.on("error_message", onErrorMessage);

    return () => {
      sock.off("chat_messages", onChatMessages);
      sock.off("receive_message", onReceiveMessage);
      sock.off("message_updated", onMessageUpdated);
      sock.off("new_chat", onNewChat);
      sock.off("error_message", onErrorMessage);
    };
  }, [socketReady, activeChat]);

  /* -------------------- LOAD CHATS -------------------- */
  useEffect(() => {
    fetch(`${API_URL}/api/chats/my/${user._id}`)
      .then((r) => r.json())
      .then(setChats)
      .catch(console.error);
  }, [user._id]);

  /* -------------------- OPEN CHAT -------------------- */
  const openChat = async (chat) => {
    console.log("📂 openChat called", chat?._id);

    if (!chat?._id) {
      console.warn("⛔ openChat: invalid chat");
      return;
    }

    // Remember which chat we requested so incoming chat_messages can be accepted
    requestedChatIdRef.current = String(chat._id);

    setActiveChat(chat);
    setMessages([]);

    const sock = socketRef.current;

    if (!sock) {
      console.error("❌ openChat: socketRef.current is NULL");
      return;
    }

    console.log("🟡 openChat: socket exists, waiting for connection");

    await whenConnected(sock);

    console.log("🟢 openChat: socket connected, joining room");

    if (!joinedRooms.current.has(chat._id)) {
      sock.emit("join_chat", { chatId: chat._id });
      joinedRooms.current.add(chat._id);
    }

    console.log("📨 openChat: loading messages");
    sock.emit("load_messages", { chatId: chat._id });

    // Fallback: also fetch via HTTP in case socket messages are missed or arrive before activeChat is set
    try {
      const res = await fetch(`${API_URL}/api/messages/${chat._id}`);
      if (res.ok) {
        const msgs = await res.json();
        console.log(`📥 HTTP fallback loaded ${msgs.length} messages for chat ${chat._id}`);
        // Only set messages if still viewing this chat (prevents race)
        if (String(requestedChatIdRef.current) === String(chat._id) || (activeChat && String(activeChat._id) === String(chat._id))) {
          setMessages(msgs);
          requestedChatIdRef.current = null;
        }
      } else {
        console.warn('HTTP fallback /api/messages returned', res.status);
      }
    } catch (err) {
      console.warn('HTTP fallback error fetching messages:', err);
    }
  };

  /* -------------------- SEARCH / START CHAT -------------------- */
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
      replyTo: replyingTo?._id || null,
    };

    console.log("[send_message] payload:", payload);
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
        replyTo: replyingTo ? { _id: replyingTo._id, text: replyingTo.text, sender: { _id: replyingTo.senderId, username: replyingTo.senderName } } : null,
      },
    ]);

    setMessage("");
    setReplyingTo(null);
  };

  /* -------------------- MESSAGE ACTIONS -------------------- */
  const reactToMessage = (messageId, emoji) => {
    if (messageId.startsWith("tmp-")) {
      console.log('⛔ Cannot react to temporary message');
      return;
    }

    console.log("[react_message] emitting:", { messageId, emoji, userId: user._id });
    socketRef.current?.emit("react_message", {
      messageId,
      emoji,
      userId: user._id,
    });
  };

  const deleteMessage = (messageId) => {
    if (messageId.startsWith("tmp-")) {
      console.log('⛔ Cannot delete temporary message');
      return;
    }

    console.log("[delete_message] emitting:", { messageId, userId: user._id });
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
      {/* ICON NAVBAR */}
      <IconNavbar
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        onLogout={logout}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* PROFILE PANEL - FULL WIDTH */}
      {activePanel === "profile" ? (
        <ProfilePanel user={user} onBack={() => setActivePanel("chats")} />
      ) : (
        <>
          {/* MIDDLE PANEL */}
          <MiddlePanel
            activePanel={activePanel}
            chats={chats}
            activeChat={activeChat}
            setActiveChat={openChat}
            searchId={searchId}
            setSearchId={setSearchId}
            searchError={searchError}
            onStartChat={startChatById}
            user={user}
            getOtherUser={getOtherUser}
          />

          {/* CHAT MAIN AREA */}
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
                const senderName = mine
                  ? "You"
                  : getOtherUser(activeChat)?.username || "User";

                return (
                  <div
                    key={msg._id}
                    className={`message-row ${mine ? "mine" : ""}`}
                  >
                    <div className={`message-bubble ${mine ? "mine" : "other"}`}>
                      <div className="message-content">
                        {msg.replyTo && (
                          <>
                            <div className="message-reply-preview">
                              <div className="reply-sender">{msg.replyTo.sender?.username || msg.replyTo.senderName || 'User'}</div>
                              <div className="reply-text">{typeof msg.replyTo === 'string' ? '' : (msg.replyTo.text || '')}</div>
                            </div>
                            <div className="reply-divider"></div>
                          </>
                        )}

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
                      </div>

                      {/* Message Actions Menu */}
                      {!msg.deleted && (
                        <MessageActions
                          message={msg}
                          onReply={() =>
                            setReplyingTo({
                              _id: msg._id,
                              text: msg.text,
                              senderName: senderName,
                            })
                          }
                          onDelete={() => deleteMessage(msg._id)}
                          onReact={(msgId, emoji) =>
                            reactToMessage(msgId, emoji)
                          }
                          isOwn={mine}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <ReplyPreview
              replyingTo={replyingTo}
              onClear={() => setReplyingTo(null)}
            />

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
        </>
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
