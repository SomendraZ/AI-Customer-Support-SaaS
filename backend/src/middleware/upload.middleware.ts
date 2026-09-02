import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  const allowedExtensions = [".pdf", ".txt", ".docx"];

  const extension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(extension)) {
    callback(null, true);
  } else {
    callback(new Error("Only PDF, TXT, and DOCX files are allowed"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});
