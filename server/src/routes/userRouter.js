import express from "express";
import {
  deleteProfilePicture,
  getConversations,
  getCurrentUserProfile,
  getMessageHistory,
  getUserProfile,
  updateCurrentUserProfile,
  uploadProfilePicture,
  searchUsers,
} from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.js";

const userRouter = express.Router();

userRouter.get("/users/profile", authMiddleware, getCurrentUserProfile);
userRouter.put("/users/profile", authMiddleware, updateCurrentUserProfile);
userRouter.post("/users/profile/picture", authMiddleware, upload.single("profilePicture"), uploadProfilePicture);
userRouter.delete("/users/profile/picture", authMiddleware, deleteProfilePicture);
userRouter.get("/users/search", authMiddleware, searchUsers);
userRouter.get("/users/conversations", authMiddleware, getConversations);
userRouter.get("/users/:userId/messages", authMiddleware, getMessageHistory);
userRouter.get("/users/:userId", authMiddleware, getUserProfile);

export default userRouter;
