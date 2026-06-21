import path from "node:path";

// Répertoire unique de stockage des fichiers uploadés (chemin absolu, résolu
// depuis le CWD du process). Source de vérité partagée entre le middleware
// multer (écriture), le controller (lecture via res.sendFile, suppression) et
// la logique de nettoyage. Centralise le chemin pour éviter les "uploads"
// éparpillés et garantir un chemin absolu (requis par res.sendFile).
export const UPLOADS_DIR = path.resolve("uploads");
