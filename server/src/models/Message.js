import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: function requiredForDirectMessage() {
        return !this.roomId;
      },
    },
    roomId: {
      type: String,
      default: null,
    },
    content: {
      type: String,
      required: function requiredWhenNoAttachment() {
        return !this.attachment?.url;
      },
      trim: true,
    },
    attachment: {
      url: { type: String, default: null },
      name: { type: String, default: null },
      type: { type: String, default: null },
      size: { type: Number, default: null },
    },
    readStatus: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    tempId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

messageSchema.index({ from: 1, to: 1, createdAt: -1 });
messageSchema.index({ to: 1, from: 1, isRead: 1 });
messageSchema.index({ readAt: 1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
