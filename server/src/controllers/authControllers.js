import userModel from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const cookieConfig={
    httpOnly:true,
    secure:process.env.NODE_ENV==="production",
    sameSite:process.env.NODE_ENV==="production"?"none":"lax",
    maxAge: 7*24*60*60*1000
}
export const register=async(req,res)=>{
    const {name,email,password}=req.body;
    if(!email|| !name|| !password){
        return res.json({success:false,message:"credentials missing"});
    }
    try{
        const existingUser=await userModel.findOne({email});
        if(existingUser){
            return res.json({success:false,message:"user already exists"});
        }
        const profilePic=req.file?req.file.path:"/default.jpg";
        const hashedPassword = await bcrypt.hash(password,10);
        const user=new userModel({name,email,password:hashedPassword});
        await user.save();
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"7d",});
        res.cookie("token",token,cookieConfig);
        return res.json({success:true,message:"successful",token,user:{id:user._id,name:user,email:user.email}});

    }catch(error){
        return res.json({success:false,message:error.message});
    }
};
export const login=async(req,res)=>{
    const {email,password}=req.body;
    if(!email || !password){
        return res.json({success:false,message:"credentials missing"});
    }
    try{
        const existingUser=await userModel.findOne({email});
        if(!existingUser){
            return res.json({success:false,message:"user doesnt exist"});
        }
        const hashedPassword=await bcrypt.compare(password,existingUser.password);
        if(!hashedPassword){
            return res.json({success:false,message:"password is wrong"});
        }
        const token = jwt.sign({id:existingUser._id},process.env.JWT_SECRET,{expiresIn:"7d"});
        res.cookie("token",token,cookieConfig);
        return res.json({success:true,message:"login donee",token,user:{id:existingUser._id,name:existingUser.name,email:existingUser.email}});
    }catch(error){
        return res.json({success:false,message:error.message});
    }
}
export const logout=async(req,res)=>{
    res.clearCookie("token",cookieConfig);
    return res.json({success:true,message:"logout done"});
}
export const updateAvatar=async(req,res)=>{
   try{
     if(!req.file){
        return res.json({success:"false",message:"avatar not uploaded"});
    }
    const updatedUser = await userModel.findByIdAndUpdate(
  req.user.id,
  { profilePic },
  { returnDocument: "after" }
).select("-password");
    return res.json({success:"true",message:UpdatedUser});
   }catch(err){
    return res.json({success:"false",message:err.message});
   }
};