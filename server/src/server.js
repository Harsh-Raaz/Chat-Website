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
app.use(cookieParser());

connectDB();
app.use("/api",authrouter);
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
});

const PORT=process.env.PORT || 4000;
app.listen(PORT,()=>{
    console.log(`Server running on PORT ${PORT}`);
})