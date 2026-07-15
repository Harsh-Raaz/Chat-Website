import express from "express";
import { createGroup } from "../controllers/groupController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const groupRouter = express.Router();
groupRouter.post("/groups", authMiddleware, createGroup);
export default groupRouter;
