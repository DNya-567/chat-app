// src/services/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

let socket = null;

export const initSocket = (token) => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket"],
    auth: { token },
  });

  socket.on("connect", () => {
    console.log("[socket] ✅ connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("[socket] ❌ disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("[socket] ❌ connect_error:", err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const whenConnected = (sock) =>
  sock.connected
    ? Promise.resolve()
    : new Promise((res) => sock.once("connect", res));

export const destroySocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
