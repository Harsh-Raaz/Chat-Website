import mongoose from "mongoose";
import Message from "../models/Message.js";
import userModel from "../models/user.js";

const buildMessagePayload = ({ from, to, roomId, content, tempId }) => ({
  from,
  to: to || null,
  roomId: roomId || null,
  content,
  tempId: tempId || null,
  timestamp: new Date().toISOString(),
});

const formatMessage = (message) => ({
  _id: message._id?.toString(),
  id: message._id?.toString(),
  from: message.from?.toString(),
  to: message.to?.toString(),
  roomId: message.roomId || null,
  content: message.content,
  readStatus: message.readStatus,
  deliveredAt: message.deliveredAt?.toISOString?.() || message.deliveredAt || null,
  readAt: message.readAt?.toISOString?.() || message.readAt || null,
  isRead: Boolean(message.isRead),
  tempId: message.tempId || null,
  timestamp: message.createdAt?.toISOString?.() || message.timestamp || new Date().toISOString(),
  createdAt: message.createdAt?.toISOString?.() || message.createdAt,
});

const getUnreadCountsForUser = async (userId) => {
  const counts = await Message.aggregate([
    { $match: { to: new mongoose.Types.ObjectId(userId), isRead: false } },
    { $group: { _id: "$from", count: { $sum: 1 } } },
  ]);

  const unreadCounts = counts.reduce((acc, item) => {
    acc[item._id.toString()] = item.count;
    return acc;
  }, {});

  const totalUnread = counts.reduce((sum, item) => sum + item.count, 0);
  return { unreadCounts, totalUnread };
};

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

    socket.on("send_message", async (payload, callback) => {
      try {
        const { to, roomId, content, tempId } = payload || {};
        const trimmedContent = content?.trim();

        if (!trimmedContent || (!to && !roomId)) {
          throw new Error("Message content and recipient or room ID are required.");
        }

        let message = buildMessagePayload({
          from: userId,
          to,
          roomId,
          content: trimmedContent,
          tempId,
        });

        if (to) {
          if (!mongoose.Types.ObjectId.isValid(to)) {
            throw new Error("Invalid recipient user ID.");
          }

          if (to === userId) {
            throw new Error("You cannot send a message to yourself.");
          }

          const recipient = await userModel.exists({ _id: to });
          if (!recipient) {
            throw new Error("Recipient user not found.");
          }

          const savedMessage = await Message.create({
            from: userId,
            to,
            content: trimmedContent,
            tempId,
            readStatus: "delivered",
            deliveredAt: new Date(),
            isRead: false,
          });

          message = formatMessage(savedMessage);
        }

        if (roomId) {
          io.to(roomId).emit("receive_message", message);
        } else {
          io.to(`user_${to}`).emit("receive_message", message);
        }

        socket.emit("message_delivered", {
          ...message,
          deliveryStatus: "delivered",
        });

        if (callback) {
          return callback({ status: "ok", message });
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

    socket.on("message_received", async ({ messageId, senderId }, callback) => {
      if (!messageId || !senderId) {
        const err = { message: "messageId and senderId are required for delivery confirmation." };
        if (callback) return callback({ status: "error", ...err });
        return socket.emit("socket_error", err);
      }

      if (mongoose.Types.ObjectId.isValid(messageId)) {
        await Message.findOneAndUpdate(
          { _id: messageId, to: userId },
          { readStatus: "delivered", deliveredAt: new Date() }
        );
      }

      io.to(`user_${senderId}`).emit("message_delivery_confirmation", {
        messageId,
        receiverId: userId,
        status: "delivered",
        receivedAt: new Date().toISOString(),
      });

      if (callback) {
        return callback({ status: "ok", message: "Delivery confirmed" });
      }
    });

    socket.on("mark_as_read", async ({ messageIds, senderId }, callback) => {
      try {
        const validMessageIds = (messageIds || []).filter((messageId) =>
          mongoose.Types.ObjectId.isValid(messageId)
        );

        if (!validMessageIds.length || !mongoose.Types.ObjectId.isValid(senderId)) {
          throw new Error("Valid messageIds and senderId are required.");
        }

        const readAt = new Date();
        const messagesToRead = await Message.find({
          _id: { $in: validMessageIds },
          from: senderId,
          to: userId,
          isRead: false,
        }).select("_id");

        const idsToUpdate = messagesToRead.map((message) => message._id);

        if (idsToUpdate.length) {
          await Message.updateMany(
            { _id: { $in: idsToUpdate } },
            { $set: { isRead: true, readAt, readStatus: "read" } }
          );
        }

        const updatedIds = idsToUpdate.map((id) => id.toString());
        const payload = {
          messageIds: updatedIds,
          readBy: userId,
          readAt: readAt.toISOString(),
        };

        io.to(`user_${senderId}`).emit("messages_read", payload);

        if (callback) {
          return callback({ status: "ok", ...payload });
        }
      } catch (error) {
        const err = { status: "error", message: error.message || "Failed to mark messages as read" };
        if (callback) return callback(err);
        socket.emit("socket_error", err);
      }
    });

    socket.on("get_unread_counts", async (callback) => {
      try {
        const counts = await getUnreadCountsForUser(userId);
        if (callback) return callback({ status: "ok", ...counts });
      } catch (error) {
        const err = { status: "error", message: error.message || "Failed to fetch unread counts" };
        if (callback) return callback(err);
        socket.emit("socket_error", err);
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
