import { useEffect, useRef, useState } from "react";
import { getSocket, whenConnected } from "../services/socket";
import { useAuth } from "../context/AuthContext";
import notificationService from "../services/notificationService";
import IconNavbar from "../components/layout/IconNavbar";
import MiddlePanel from "../components/layout/MiddlePanel";
import ProfilePanel from "../components/profile/ProfilePanel";
import SettingsModal from "../components/settings/SettingsModal";
import MessageActions from "../components/chat/MessageActions";
import MessageSearch from "../components/chat/MessageSearch";
import ReplyPreview from "../components/chat/ReplyPreview";
import ReadReceipts from "../components/chat/ReadReceipts";
import UserProfileModal from "../components/user/UserProfileModal";
import "./Chat.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Chat() {
  const { user, logout, loading, socketReady } = useAuth();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

  // Search states
  const [showSearch, setShowSearch] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [currentSearchQuery, setCurrentSearchQuery] = useState("");

  // User profile modal state
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

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

    // Request notification permission
    notificationService.requestPermission().then((permission) => {
      console.log("🔔 Notification permission:", permission);
    });
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

    const onChatReadReceiptsUpdated = (data) => {
      const { chatId, messages: updatedMessages } = data;
      const activeId = activeChat ? String(activeChat._id) : null;

      if (String(chatId) !== String(activeId)) {
        console.log('⛔ Ignoring read receipts for different chat');
        return;
      }

      console.log("[socket] chat_read_receipts_updated:", updatedMessages.length, "messages");
      setMessages(updatedMessages);
    };

    const onNewChat = (chat) => {
      console.log("[socket] new_chat:", chat._id, chat);
      setChats((prev) => {
        // If chat already exists, remove it from current position
        const filtered = prev.filter((c) => String(c._id) !== String(chat._id));
        // Add it at the beginning (top)
        return [chat, ...filtered];
      });
    };

    const onErrorMessage = (err) => {
      console.error("[socket] server error:", err);
      // Optionally show UI notification here
    };

    // Handler for push notifications from any chat
    const onNewMessageNotification = (data) => {
      const { message, chat } = data;
      const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
      const senderName = typeof message.sender === 'object' ? message.sender.username : 'Someone';

      console.log('[socket] new_message_notification', message._id, 'from', senderName);

      // Don't show notification for own messages
      if (String(senderId) === String(user._id)) {
        return;
      }

      // Show notification
      notificationService.showMessageNotification(
        message,
        { username: senderName, avatar: message.sender?.avatar },
        () => {
          // On click, could navigate to that chat
          console.log("🔔 Notification clicked, opening chat:", chat._id);
        }
      );
    };

    sock.on("chat_messages", onChatMessages);
    sock.on("receive_message", (m) => { console.log('[socket] receive_message', m._id); onReceiveMessage(m); });
    sock.on("message_updated", onMessageUpdated);
    sock.on("chat_read_receipts_updated", onChatReadReceiptsUpdated);
    sock.on("new_chat", onNewChat);
    sock.on("new_message_notification", onNewMessageNotification);
    sock.on("error_message", onErrorMessage);

    return () => {
      sock.off("chat_messages", onChatMessages);
      sock.off("receive_message", onReceiveMessage);
      sock.off("message_updated", onMessageUpdated);
      sock.off("chat_read_receipts_updated", onChatReadReceiptsUpdated);
      sock.off("new_chat", onNewChat);
      sock.off("new_message_notification", onNewMessageNotification);
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

    // Mark all messages as read when opening the chat
    sock.emit("mark_chat_as_read", { chatId: chat._id, userId: user._id });

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

    // If editing, save the edit instead
    if (editingMessage) {
      saveEditMessage();
      return;
    }

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
        pinned: false,
        edited: false,
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

  const pinMessage = (messageId) => {
    if (messageId.startsWith("tmp-")) {
      console.log('⛔ Cannot pin temporary message');
      return;
    }

    if (!activeChat) {
      console.log('⛔ No active chat');
      return;
    }

    console.log("[pin_message] emitting:", { messageId, userId: user._id, chatId: activeChat._id });
    socketRef.current?.emit("pin_message", {
      messageId,
      userId: user._id,
      chatId: activeChat._id,
    });
  };

  const startEditMessage = (msg) => {
    if (!msg || msg.deleted) return;

    setEditingMessage(msg);
    setMessage(msg.text);
    setReplyingTo(null); // Clear reply when editing
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setMessage("");
  };

  const saveEditMessage = () => {
    if (!editingMessage || !message.trim()) return;

    if (message.trim() === editingMessage.text) {
      // No changes, just cancel
      cancelEdit();
      return;
    }

    console.log("[edit_message] emitting:", {
      messageId: editingMessage._id,
      userId: user._id,
      newText: message.trim()
    });

    socketRef.current?.emit("edit_message", {
      messageId: editingMessage._id,
      userId: user._id,
      newText: message.trim(),
    });

    cancelEdit();
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

  const handleMessageFound = (messageId) => {
    // Find the message element and scroll to it
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Highlight the message temporarily
      setHighlightedMessageId(messageId);

      // Remove highlight after 2 seconds
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2000);
    }
  };

  const highlightSearchMatches = (text, query) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ?
        <span key={index} className="search-match">{part}</span> :
        part
    );
  };

  const handleOpenUserProfile = async (user) => {
    if (!user?._id) return;

    try {
      console.log(`📊 Fetching profile for user: ${user.username} (${user._id})`);

      // Fetch detailed user profile from API
      const response = await fetch(`${API_URL}/api/users/profile/${user._id}`);
      if (response.ok) {
        const userProfile = await response.json();
        console.log(`📊 Profile data received:`, userProfile);
        setSelectedUser(userProfile);
        setShowUserProfile(true);
      } else {
        console.error("Failed to fetch user profile:", response.status);
        // Use basic user data as fallback
        setSelectedUser({
          ...user,
          isOnline: false,
          messageCount: 0,
          chatCount: 0,
          friendCount: 0,
          lastSeen: new Date(),
          bio: "Profile unavailable",
        });
        setShowUserProfile(true);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Fallback to basic data on network error
      setSelectedUser({
        ...user,
        isOnline: false,
        messageCount: 0,
        chatCount: 0,
        friendCount: 0,
        lastSeen: new Date(),
        bio: "Unable to load profile",
      });
      setShowUserProfile(true);
    }
  };

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
              <span className="chat-title">
                Chat with{" "}
                <button
                  className="clickable-username"
                  onClick={() => handleOpenUserProfile(getOtherUser(activeChat))}
                  title="View user profile"
                >
                  {getOtherUser(activeChat)?.username}
                </button>
              </span>
              <div className="chat-header-actions">
                <button
                  className={`chat-action-btn search-btn ${showSearch ? "active" : ""}`}
                  onClick={() => setShowSearch(!showSearch)}
                  title="Search messages"
                >
                  🔍
                </button>
              </div>
            </div>

            {/* Message Search */}
            <MessageSearch
              messages={messages}
              onMessageFound={handleMessageFound}
              onSearchQueryChange={setCurrentSearchQuery}
              isVisible={showSearch}
              onClose={() => {
                setShowSearch(false);
                setCurrentSearchQuery("");
                setHighlightedMessageId(null);
              }}
            />

            {/* Pinned Messages Section */}
            {messages.filter((m) => m.pinned).length > 0 && (
              <div className="pinned-messages-section">
                <div className="pinned-header">
                  <span className="pinned-icon">📌</span>
                  <span className="pinned-title">Pinned Messages</span>
                </div>
                <div className="pinned-messages-list">
                  {messages
                    .filter((m) => m.pinned)
                    .map((msg) => (
                      <div key={msg._id} className="pinned-message-item">
                        <div className="pinned-message-text">
                          {msg.text.length > 50
                            ? msg.text.substring(0, 50) + "..."
                            : msg.text}
                        </div>
                        <div className="pinned-message-info">
                          {msg.edited && <span className="edited-badge">✏️ edited</span>}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

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
                    data-message-id={msg._id}
                  >
                    <div className={`message-bubble ${mine ? "mine" : "other"} ${msg.pinned ? "pinned" : ""} ${highlightedMessageId === msg._id ? "search-highlight" : ""}`}>
                      <div className="message-content">
                        {/* Pinned indicator */}
                        {msg.pinned && (
                          <div className="message-pinned-badge">📌 Pinned</div>
                        )}

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
                          {msg.deleted ? (
                            <i>{msg.text}</i>
                          ) : (
                            highlightSearchMatches(msg.text, currentSearchQuery)
                          )}
                        </div>

                        <div className="message-time">
                          {formatTime(msg.createdAt)}
                          {msg.edited && <span className="message-edited-indicator"> (edited)</span>}
                        </div>

                        {/* Show read receipts only for own messages */}
                        {mine && (
                          <ReadReceipts readReceipts={msg.readReceipts} userId={getOtherUser(activeChat)?._id} />
                        )}

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
                          onPin={(msgId) => pinMessage(msgId)}
                          onEdit={(msg) => startEditMessage(msg)}
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

            {/* Edit Preview */}
            {editingMessage && (
              <div className="reply-preview editing-preview">
                <div className="reply-preview-header">
                  <span className="reply-label">✏️ Editing message</span>
                  <button
                    className="reply-close-btn"
                    onClick={cancelEdit}
                    title="Cancel edit"
                  >
                    ✕
                  </button>
                </div>
                <div className="reply-preview-content">
                  <div className="reply-text">{editingMessage.text}</div>
                </div>
              </div>
            )}

            <div className="chat-input-bar">
              <input
                className="chat-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
              />
              <button className="chat-send-btn" onClick={sendMessage}>
                {editingMessage ? "Save" : "Send"}
              </button>
            </div>
          </>
        )}
          </div>
        </>
      )}
      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        user={selectedUser}
        isOpen={showUserProfile}
        onClose={() => {
          setShowUserProfile(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
}
