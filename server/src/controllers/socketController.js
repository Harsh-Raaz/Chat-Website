const buildMessagePayload = ({ from, to, roomId, content, tempId }) => ({
  from,
  to: to || null,
  roomId: roomId || null,
  content,
  tempId: tempId || null,
  timestamp: new Date().toISOString(),
});

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    const personalRoom = `user_${userId}`;

    socket.join(personalRoom);
    socket.emit("socket_connected", { message: "Socket authenticated", userId });

    socket.on("join_room", ({ roomId }, callback) => {
      if (!roomId) {
        const error = { message: "Room ID is required to join a room." };
        if (callback) return callback({ status: "error", ...error });
        return socket.emit("socket_error", error);
      }

      socket.join(roomId);
      const success = { message: `Joined room ${roomId}` };
      if (callback) return callback({ status: "ok", ...success });
      socket.emit("room_joined", success);
    });

    socket.on("send_message", (payload, callback) => {
      try {
        const { to, roomId, content, tempId } = payload || {};

        if (!content || (!to && !roomId)) {
          throw new Error("Message content and recipient or room ID are required.");
        }

        const message = buildMessagePayload({ from: userId, to, roomId, content, tempId });

        if (roomId) {
          io.to(roomId).emit("receive_message", message);
        } else {
          io.to(`user_${to}`).emit("receive_message", message);
        }

        socket.emit("message_delivered", {
          ...message,
          deliveryStatus: "delivered",
          deliveredAt: new Date().toISOString(),
        });

        if (callback) {
          return callback({ status: "ok", message: "Message sent" });
        }
      } catch (error) {
        const err = {
          status: "error",
          message: error.message || "Failed to send message",
        };
        if (callback) return callback(err);
        socket.emit("message_error", err);
      }
    });

    socket.on("message_received", ({ messageId, senderId }, callback) => {
      if (!messageId || !senderId) {
        const err = { message: "messageId and senderId are required for delivery confirmation." };
        if (callback) return callback({ status: "error", ...err });
        return socket.emit("socket_error", err);
      }

      io.to(`user_${senderId}`).emit("message_delivery_confirmation", {
        messageId,
        receiverId: userId,
        status: "received",
        receivedAt: new Date().toISOString(),
      });

      if (callback) {
        return callback({ status: "ok", message: "Delivery confirmed" });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${userId} (${reason})`);
    });

    socket.on("error", (error) => {
      console.error("Socket error for user", userId, error);
    });
  });
};

export default initializeSocket;
