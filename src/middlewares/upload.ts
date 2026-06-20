import multer from "multer"
import { HttpError } from "./error";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { env } from "../config/env";

fs.mkdirSync("uploads/", {recursive: true});

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, "uploads/"),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomBytes(8).toString("hex")}${ext}`)
    }
  }),
  fileFilter: (_req, file, cb) => {
    const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/gif', 'application/pdf']);

    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    const err = new HttpError(400, "Type non autorisé");

    cb(err);
  },
  limits: {fileSize: env.UPLOAD_MAX_SIZE, files: 1}
})