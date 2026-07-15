import express from "express";
import {
  getConversationMessages,
  getGroupMessages,
  getUnreadCounts,
  markConversationAsRead,
  uploadAttachment,
} from "../controllers/messageController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadAttachment as attachmentUpload } from "../middlewares/upload.js";

const messageRouter = express.Router();

messageRouter.get("/messages/unread/count", authMiddleware, getUnreadCounts);
messageRouter.post("/messages/attachment", authMiddleware, attachmentUpload.single("file"), uploadAttachment);
messageRouter.get("/messages/conversation/:userId", authMiddleware, getConversationMessages);
messageRouter.get("/messages/group/:roomId", authMiddleware, getGroupMessages);
messageRouter.put("/messages/read/:conversationId", authMiddleware, markConversationAsRead);

export default messageRouter;
