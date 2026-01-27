import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

export const initSocket = (token) => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"], // good choice
    autoConnect: false,
  });

  socket.on("connect", () => {
    console.log("[socket] connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("[socket] disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("[socket] connect_error:", err.message);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    console.error("❌ getSocket(): socket not initialized");
  }
  return socket;
};

export const destroySocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const whenConnected = (sock) =>
  new Promise((resolve) => {
    if (sock.connected) return resolve();
    sock.once("connect", resolve);
  });
