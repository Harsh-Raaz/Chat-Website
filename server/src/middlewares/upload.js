import multer from "multer";

const storage = multer.memoryStorage();
const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(new Error("Profile picture must be a JPG, PNG, or WEBP image."));
    }

    callback(null, true);
  },
});

export default upload;
