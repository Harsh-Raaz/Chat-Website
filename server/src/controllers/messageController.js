import mongoose from "mongoose";
import Message from "../models/Message.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const formatMessage = (message) => ({
  _id: message._id,
  id: message._id,
  from: message.from,
  to: message.to,
  roomId: message.roomId,
  content: message.content,
  attachment: message.attachment || null,
  readStatus: message.readStatus,
  deliveredAt: message.deliveredAt,
  readAt: message.readAt,
  isRead: message.isRead,
  tempId: message.tempId,
  timestamp: message.createdAt,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

const uploadToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "chat-attachments", resource_type: "auto" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });

export const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "A file is required." });
    }

    const result = await uploadToCloudinary(req.file);
    return res.json({
      success: true,
      attachment: {
        url: result.secure_url,
        name: req.file.originalname,
        type: req.file.mimetype || "application/octet-stream",
        size: req.file.size,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "File upload failed." });
  }
};

export const getUnreadCounts = async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.user._id);

    const counts = await Message.aggregate([
      { $match: { to: currentUserId, isRead: false } },
      { $group: { _id: "$from", count: { $sum: 1 } } },
    ]);

    const unreadCounts = counts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    const totalUnread = counts.reduce((sum, item) => sum + item.count, 0);

    return res.json({ success: true, unreadCounts, totalUnread });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const before = req.query.before ? new Date(req.query.before) : null;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const query = {
      $or: [
        { from: currentUserId, to: userId },
        { from: userId, to: currentUserId },
      ],
    };

    if (before && !Number.isNaN(before.getTime())) {
      query.createdAt = { $lt: before };
    }

    const messages = await Message.find(query).sort({ createdAt: -1 }).limit(limit).lean();

    return res.json({
      success: true,
      messages: messages.reverse().map(formatMessage),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ success: false, message: "Invalid conversation ID" });
    }

    const readAt = new Date();
    const result = await Message.updateMany(
      { from: conversationId, to: currentUserId, isRead: false },
      { $set: { isRead: true, readAt, readStatus: "read" } }
    );

    return res.json({
      success: true,
      message: "Conversation marked as read.",
      modifiedCount: result.modifiedCount || 0,
      readAt,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
