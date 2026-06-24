import express from "express";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/mongodb.js";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authrouter from "./routes/authRouter.js";
import userRouter from "./routes/userRouter.js";
import messageRouter from "./routes/messageRouter.js";
import socketAuth from "./middlewares/socketAuth.js";
import initializeSocket from "./controllers/socketController.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", authrouter);
app.use("/api", userRouter);
app.use("/api", messageRouter);
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File must be less than the allowed size." });
  }
  if (err.message?.includes("Profile picture must be")) {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
console.log("MONGODB_URI =", process.env.MONGODB_URI);
io.use(socketAuth);
initializeSocket(io);

const PORT = process.env.PORT || 4000;
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`Server running on PORT ${PORT}`);
    });
  } catch (error) {
    console.error("Server start failed:", error.message);
  }
};

startServer();
