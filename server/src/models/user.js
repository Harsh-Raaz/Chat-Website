import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    profilePic: { type: String, default: "" },
    profilePicture: { type: String, default: "" },
    profilePicturePublicId: { type: String, default: "" },
  },
  { timestamps: true }
);

const userModel = mongoose.model("user", userSchema);
export default userModel;
