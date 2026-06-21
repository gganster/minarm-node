// Préchargé via `--import` AVANT tout module applicatif : pose les variables
// d'environnement lues une seule fois par src/config/env.ts (dotenv n'écrase pas
// process.env déjà défini, donc ces valeurs priment sur le .env pour les tests).
//
// - NODE_ENV=test           -> coupe la journalisation (sortie du runner lisible)
// - RATE_LIMIT_MAX très haut -> le limiteur global n'interfère jamais
// - AUTH_RATE_LIMIT_MAX=30   -> assez haut pour les tests fonctionnels d'auth,
//                               assez bas pour que tests/rate-limit le déclenche
//
// DATABASE_URL / JWT_SECRET ne sont PAS posés ici : ils proviennent du .env
// (workflow de dev) pour viser la vraie base Postgres.
process.env.NODE_ENV = "test";
process.env.RATE_LIMIT_MAX = "1000000";
process.env.AUTH_RATE_LIMIT_MAX = "30";
// Épinglé pour que le test "upload > 5MB -> 413" soit déterministe quelle que
// soit la valeur du .env local.
process.env.UPLOAD_MAX_SIZE = "5242880";
