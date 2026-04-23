import jwt from "jsonwebtoken";
import userModel from "../models/user.js";

export const verifyAuthToken = async (token) => {
  if (!token) {
    throw new Error("Not authorized");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await userModel.findById(decoded.id).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const user = await verifyAuthToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: error.message || "Invalid token" });
  }
};

export default authMiddleware;