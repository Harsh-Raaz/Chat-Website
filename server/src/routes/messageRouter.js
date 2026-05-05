import express from "express";
import {
  getConversationMessages,
  getUnreadCounts,
  markConversationAsRead,
} from "../controllers/messageController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const messageRouter = express.Router();

messageRouter.get("/messages/unread/count", authMiddleware, getUnreadCounts);
messageRouter.get("/messages/conversation/:userId", authMiddleware, getConversationMessages);
messageRouter.put("/messages/read/:conversationId", authMiddleware, markConversationAsRead);

export default messageRouter;
