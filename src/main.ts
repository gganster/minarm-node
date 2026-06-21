import { app } from "./app";
import { env } from "./config/env";

// Point d'entrée prod/dev : monte l'app exportée par `app.ts` sur le port HTTP.
app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});
