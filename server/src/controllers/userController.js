import mongoose from "mongoose";
import Message from "../models/Message.js";
import userModel from "../models/user.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const uploadToCloudinary = (fileBuffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "avatars", resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete failed:", error.message);
  }
};

const formatUser = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  profilePicture: user.profilePicture || user.profilePic || "",
  profilePic: user.profilePic || "",
  profilePicturePublicId: user.profilePicturePublicId || "",
});

const formatMessage = (message) => ({
  _id: message._id,
  id: message._id,
  from: message.from,
  to: message.to,
  content: message.content,
  readStatus: message.readStatus,
  deliveredAt: message.deliveredAt,
  readAt: message.readAt,
  isRead: message.isRead,
  tempId: message.tempId,
  timestamp: message.createdAt || message.timestamp,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

export const getCurrentUserProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id).select("-password").lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, user: formatUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCurrentUserProfile = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const updates = {};

    if (name !== undefined) {
      if (name.length < 2 || name.length > 50) {
        return res.status(400).json({ success: false, message: "Name must be 2-50 characters." });
      }
      updates.name = name;
    }

    if (email !== undefined) {
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: "Please enter a valid email." });
      }

      const existingUser = await userModel.findOne({
        email,
        _id: { $ne: req.user._id },
      });

      if (existingUser) {
        return res.status(409).json({ success: false, message: "Email is already in use." });
      }

      updates.email = email;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: "No profile changes provided." });
    }

    const updatedUser = await userModel
      .findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
      .select("-password")
      .lean();

    return res.json({ success: true, user: formatUser(updatedUser), message: "Profile updated." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Profile picture is required." });
    }

    const currentUser = await userModel.findById(req.user._id).select("profilePicturePublicId");
    const result = await uploadToCloudinary(req.file.buffer);

    const updatedUser = await userModel
      .findByIdAndUpdate(
        req.user._id,
        {
          profilePic: result.secure_url,
          profilePicture: result.secure_url,
          profilePicturePublicId: result.public_id,
        },
        { new: true }
      )
      .select("-password")
      .lean();

    await deleteFromCloudinary(currentUser?.profilePicturePublicId);

    return res.json({ success: true, user: formatUser(updatedUser), message: "Profile picture updated." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProfilePicture = async (req, res) => {
  try {
    const currentUser = await userModel.findById(req.user._id).select("profilePicturePublicId");

    const updatedUser = await userModel
      .findByIdAndUpdate(
        req.user._id,
        { profilePic: "", profilePicture: "", profilePicturePublicId: "" },
        { new: true }
      )
      .select("-password")
      .lean();

    await deleteFromCloudinary(currentUser?.profilePicturePublicId);

    return res.json({ success: true, user: formatUser(updatedUser), message: "Profile picture removed." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const email = (req.query.email || "").trim();

    if (!email) {
      return res.json({ success: true, users: [] });
    }

    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const users = await userModel
      .find({
        _id: { $ne: req.user._id },
        email: { $regex: escapedEmail, $options: "i" },
      })
      .select("_id name email profilePic profilePicture profilePicturePublicId")
      .limit(10)
      .lean();

    return res.json({ success: true, users: users.map(formatUser) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await userModel
      .findById(userId)
      .select("_id name email profilePic profilePicture profilePicturePublicId")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, user: formatUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMessageHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const currentUserId = req.user._id;
    const messages = await Message.find({
      $or: [
        { from: currentUserId, to: userId },
        { from: userId, to: currentUserId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      messages: messages.reverse().map(formatMessage),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const messages = await Message.find({
      $or: [{ from: currentUserId }, { to: currentUserId }],
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("from", "_id name email profilePic profilePicture profilePicturePublicId")
      .populate("to", "_id name email profilePic profilePicture profilePicturePublicId")
      .lean();

    const conversations = new Map();

    messages.forEach((message) => {
      const otherUser =
        message.from._id.toString() === currentUserId.toString() ? message.to : message.from;

      if (!conversations.has(otherUser._id.toString())) {
        conversations.set(otherUser._id.toString(), {
          user: formatUser(otherUser),
          lastMessage: formatMessage({
            ...message,
            from: message.from._id,
            to: message.to._id,
          }),
        });
      }
    });

    return res.json({ success: true, conversations: Array.from(conversations.values()) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
