import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "datasets",
    resource_type: "raw",
  },
});

const upload = multer({ storage });
export default upload;
