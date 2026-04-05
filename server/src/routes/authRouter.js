import express from "express";
import { login, logout, register, updateAvatar, checkAuth } from "../controllers/authControllers.js";
import upload from "../middlewares/upload.js";
import authMiddleware from "../middlewares/authMiddleware.js";
const authrouter=express.Router();

authrouter.post("/login",login);
authrouter.post("/logout",logout);
authrouter.post("/register",upload.single("avatar"),register);
authrouter.patch("/update-avatar",authMiddleware,upload.single("avatar"),updateAvatar);
authrouter.get("/check", authMiddleware, checkAuth);
export default authrouter;