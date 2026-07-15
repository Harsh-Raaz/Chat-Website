import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }],
    avatar: { type: String, default: "" },
  },
  { timestamps: true }
);

groupSchema.index({ members: 1 });

export default mongoose.model("Group", groupSchema);
