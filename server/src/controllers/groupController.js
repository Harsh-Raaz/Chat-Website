import mongoose from "mongoose";
import Group from "../models/Group.js";
import Message from "../models/Message.js";

export const createGroup = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const requestedMembers = Array.isArray(req.body.members) ? req.body.members : [];
    const memberIds = [...new Set([req.user._id.toString(), ...requestedMembers.map(String)])];
    if (!name || !req.body.initialMessage?.trim()) {
      return res.status(400).json({ success: false, message: "A group name and first message are required." });
    }
    if (memberIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ success: false, message: "One or more members are invalid." });
    }
    const group = await Group.create({ name, members: memberIds, avatar: req.body.avatar || "" });
    const message = await Message.create({ from: req.user._id, roomId: group._id.toString(), content: req.body.initialMessage.trim() });
    const populated = await Group.findById(group._id)
      .populate("members", "_id name email profilePic profilePicture profilePicturePublicId")
      .lean();
    const payload = { ...message.toObject(), roomId: group._id.toString(), group: { _id: populated._id, id: populated._id, name: populated.name, avatar: populated.avatar || "", members: populated.members } };
    populated.members.filter(Boolean).forEach((member) => req.app.get("io")?.to(`user_${member._id}`).emit("receive_message", payload));
    return res.status(201).json({ success: true, group: payload.group, message: payload });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
