import fs from "fs";
import path from "path";
import multer from "multer";

const uploadsRoot = path.resolve(process.cwd(), "uploads");
const datasetDir = path.join(uploadsRoot, "datasets");
const proofDir = path.join(uploadsRoot, "proofs");

for (const dir of [uploadsRoot, datasetDir, proofDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    if (file.fieldname === "proofAttachment") {
      cb(null, proofDir);
      return;
    }

    cb(null, datasetDir);
  },
  filename: (_req, file, cb) => {
    const safeBase = path
      .parse(file.originalname)
      .name
      .replace(/[^a-zA-Z0-9-_]+/g, "_")
      .slice(0, 80) || "upload";
    const ext = path.extname(file.originalname) || ".dat";
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});
export default upload;
