import express from "express";
import connectDB from "./config/mongodb.js";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authrouter from "./routes/authRouter.js";
dotenv.config();

const app=express();

app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use("/api",authrouter);
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

const PORT=process.env.PORT || 4000;
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on PORT ${PORT}`);
    });

  } catch (error) {
    console.error("Server start failed:", error.message);
  }
};
console.log(process.env.CLOUD_API_KEY);

startServer();