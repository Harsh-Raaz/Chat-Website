import express from "express";
import { createGroup, dismissGroup, leaveGroup, kickFromGroup } from "../controllers/groupController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const groupRouter = express.Router();
groupRouter.post("/groups", authMiddleware, createGroup);
groupRouter.post("/groups/:groupId/leave", authMiddleware, leaveGroup);
groupRouter.delete("/groups/:groupId", authMiddleware, dismissGroup);
groupRouter.post("/groups/:groupId/members/:memberId/remove", authMiddleware, kickFromGroup);
export default groupRouter;
