import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import {
  approveLecture,
  chatWithLecture,
  getLecture,
  getLectureNotes,
  getLectureStatus,
  listPersonalLectures,
  submitLecture,
  uploadLecture,
  uploadLectureAsync,
} from "../controllers/lectureController.js";

const uploadRoot = process.env.UPLOAD_DIR || "uploads";
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(uploadRoot, { recursive: true });
    cb(null, uploadRoot);
  },
  filename: (_req, file, cb) => {
    const safeOriginalName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeOriginalName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_AUDIO_UPLOAD_BYTES || 500 * 1024 * 1024) },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith("audio/") || file.mimetype === "video/mp4" || file.mimetype === "application/octet-stream") {
      cb(null, true);
      return;
    }
    cb(new Error("Uploaded file must be an audio file"));
  },
});

const router = Router();

router.get("/personal", listPersonalLectures);
router.post("/", upload.single("audio"), uploadLecture);
router.post("/upload-async", upload.single("audio"), uploadLectureAsync);
router.get("/:lectureId/status", getLectureStatus);
router.get("/:lectureId/notes", getLectureNotes);
router.get("/:lectureId", getLecture);
router.post("/:lectureId/submit", submitLecture);
router.post("/:lectureId/approve", approveLecture);
router.post("/:lectureId/chat", chatWithLecture);

export default router;
