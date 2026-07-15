import mongoose from "mongoose";
import Message from "../models/Message.js";
import userModel from "../models/user.js";
import Group from "../models/Group.js";

const buildMessagePayload = ({ from, to, roomId, content, attachment, tempId }) => ({
  from,
  to: to || null,
  roomId: roomId || null,
  content,
  attachment: attachment || null,
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
  attachment: message.attachment || null,
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

    const relayCallSignal = (eventName, payload = {}, callback) => {
      const { to, ...signal } = payload;
      if (!mongoose.Types.ObjectId.isValid(to) || to === userId) {
        const error = { status: "error", message: "A valid recipient is required." };
        if (callback) return callback(error);
        return socket.emit("socket_error", error);
      }

      io.to(`user_${to}`).emit(eventName, { ...signal, from: userId });
      if (callback) callback({ status: "ok" });
    };

    socket.on("call_user", (payload, callback) => relayCallSignal("call_incoming", payload, callback));
    socket.on("call_answer", (payload, callback) => relayCallSignal("call_answered", payload, callback));
    socket.on("call_ice_candidate", (payload) => relayCallSignal("call_ice_candidate", payload));
    socket.on("call_end", (payload) => relayCallSignal("call_ended", payload));

    socket.on("send_message", async (payload, callback) => {
      try {
        const { to, roomId, content, attachment, tempId } = payload || {};
        const trimmedContent = content?.trim();

        if ((!trimmedContent && !attachment?.url) || (!to && !roomId)) {
          throw new Error("Message text or attachment and recipient or room ID are required.");
        }

        let message = buildMessagePayload({
          from: userId,
          to,
          roomId,
          content: trimmedContent,
          attachment,
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
            attachment,
            tempId,
            readStatus: "delivered",
            deliveredAt: new Date(),
            isRead: false,
          });

          message = formatMessage(savedMessage);
        }

        if (roomId) {
          const group = await Group.findOne({ _id: roomId, members: userId })
            .populate("members", "_id name email profilePic profilePicture profilePicturePublicId")
            .lean();
          if (!group) throw new Error("Group not found or you are not a member.");

          const savedMessage = await Message.create({
            from: userId,
            roomId: group._id.toString(),
            content: trimmedContent,
            attachment,
            tempId,
          });
          message = {
            ...formatMessage(savedMessage),
            group: { _id: group._id, id: group._id, name: group.name, avatar: group.avatar || "", members: group.members },
          };
          // Personal rooms reach every member even before their client has joined the group room.
          group.members.filter(Boolean).forEach((member) => io.to(`user_${member._id}`).emit("receive_message", message));
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

    socket.on("delete_messages", async ({ messageIds } = {}, callback) => {
      try {
        const validMessageIds = [...new Set((messageIds || []).filter((messageId) => mongoose.Types.ObjectId.isValid(messageId)))];
        if (!validMessageIds.length) throw new Error("Valid message IDs are required.");

        const messagesToDelete = await Message.find({
          _id: { $in: validMessageIds },
          from: userId,
        }).select("_id to");
        const deletedIds = messagesToDelete.map((message) => message._id.toString());
        if (!deletedIds.length) throw new Error("Only your sent messages can be deleted.");

        await Message.deleteMany({ _id: { $in: deletedIds }, from: userId });
        const deletionPayload = { messageIds: deletedIds };
        io.to(`user_${userId}`).emit("messages_deleted", deletionPayload);
        [...new Set(messagesToDelete.map((message) => message.to?.toString()).filter(Boolean))]
          .forEach((recipientId) => io.to(`user_${recipientId}`).emit("messages_deleted", deletionPayload));

        if (callback) callback({ status: "ok", ...deletionPayload });
      } catch (error) {
        const err = { status: "error", message: error.message || "Could not delete messages" };
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
