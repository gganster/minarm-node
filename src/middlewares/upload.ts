import multer from "multer"
import { HttpError } from "./error";
import fs from "node:fs";
import crypto from "node:crypto";
import { env } from "../config/env";
import { UPLOADS_DIR } from "../lib/uploads";

fs.mkdirSync(UPLOADS_DIR, {recursive: true});

// Source de vérité unique : mimetypes autorisés -> extension stockée.
// L'extension est dérivée du mimetype validé (et NON du nom fourni par le
// client), pour qu'un "evil.html" déguisé en image/png ne soit pas stocké en
// .html puis re-servi en text/html par express.static (XSS stocké).
const MIME_TO_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext = MIME_TO_EXT[file.mimetype] ?? "";
      cb(null, `${crypto.randomBytes(8).toString("hex")}${ext}`)
    }
  }),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype in MIME_TO_EXT) return cb(null, true);
    cb(new HttpError(400, "Type non autorisé"));
  },
  limits: {fileSize: env.UPLOAD_MAX_SIZE, files: 1}
})