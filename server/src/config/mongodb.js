import mongoose from "mongoose";

const connectDB=async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/mernauth`);
        console.log("mongoDB connected");
    }catch(error){
        console.error("mongoDB connection failed",error.message);
        process.exit(1);
    }
};
export default connectDB;