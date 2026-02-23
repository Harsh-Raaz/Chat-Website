import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,"uploads/");
    },
    filename: function(req,file,cb){
        const uniqueName = Date.now() +"-"+file.originalname;
        cb(null,uniqueName);
    },
});

const fileFilter =(req,file,cb)=>{
    if(!file.mimetype.startsWith("image/")){
        return cb(new Error("Only image files allowed"),false);
    }
    cb(null,true);
};

const upload = multer({
    storage,
    limits:{fileSize:2*1024*1024},
    fileFilter,
});
export default upload;