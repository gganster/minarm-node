import multer from "multer"
import { HttpError } from "./error";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

fs.mkdirSync("upload/", {recursive: true});

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, "upload/"),
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
  limits: {fileSize: 10 * 1024 * 1024, files: 1}
})