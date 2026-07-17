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
    const group = await Group.create({ name, creator: req.user._id, members: memberIds, avatar: req.body.avatar || "" });
    const message = await Message.create({ from: req.user._id, roomId: group._id.toString(), content: req.body.initialMessage.trim() });
    const populated = await Group.findById(group._id)
      .populate("members", "_id name email profilePic profilePicture profilePicturePublicId")
      .lean();
    const payload = { ...message.toObject(), roomId: group._id.toString(), group: { _id: populated._id, id: populated._id, name: populated.name, avatar: populated.avatar || "", creator: populated.creator, members: populated.members } };
    populated.members.filter(Boolean).forEach((member) => req.app.get("io")?.to(`user_${member._id}`).emit("receive_message", payload));
    return res.status(201).json({ success: true, group: payload.group, message: payload });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const emitGroupUpdate = (io, group) => {
  group.members.filter(Boolean).forEach((member) => {
    const memberId = member._id || member;
    io.to(`user_${memberId}`).emit("group_members_updated", {
      groupId: group._id.toString(),
      creator: group.creator?.toString(),
      members: group.members.map((m) => m._id?.toString?.() || m.toString()),
    });
  });
};

export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, message: "Invalid group ID." });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    const userId = req.user._id.toString();
    if (!group.members.some((member) => member.toString() === userId)) {
      return res.status(403).json({ success: false, message: "You are not a member of this group." });
    }

    if (group.creator.toString() === userId) {
      return res.status(403).json({ success: false, message: "The creator cannot leave the group. Transfer ownership or delete the group instead." });
    }

    group.members = group.members.filter((member) => member.toString() !== userId);
    await group.save();

    const io = req.app.get("io");
    emitGroupUpdate(io, group);
    io.to(`user_${userId}`).emit("group_left", { groupId: group._id.toString() });

    return res.status(200).json({ success: true, groupId: group._id.toString() });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const kickFromGroup = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, message: "Invalid group or member ID." });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    const requesterId = req.user._id.toString();
    if (group.creator.toString() !== requesterId) {
      return res.status(403).json({ success: false, message: "Only the group creator can remove members." });
    }

    if (memberId === requesterId) {
      return res.status(400).json({ success: false, message: "The creator cannot be removed from the group." });
    }

    if (!group.members.some((member) => member.toString() === memberId)) {
      return res.status(400).json({ success: false, message: "This user is not a member of the group." });
    }

    group.members = group.members.filter((member) => member.toString() !== memberId);
    await group.save();

    const io = req.app.get("io");
    emitGroupUpdate(io, group);
    io.to(`user_${memberId}`).emit("group_removed", { groupId: group._id.toString(), removedBy: requesterId });

    return res.status(200).json({ success: true, groupId: group._id.toString(), removedMemberId: memberId });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
