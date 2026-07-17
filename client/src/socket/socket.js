// client/src/socket/socket.js
import { io } from "socket.io-client";

export const socket = io("https://chat-website-backend-holo.onrender.com", {
  autoConnect: false,
  withCredentials: true,
});