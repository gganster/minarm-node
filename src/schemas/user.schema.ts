import {z} from "zod";

// Email normalisé (trim + minuscules) AVANT validation du format : empêche les
// comptes en double (`Alice@x.com` vs `alice@x.com`, l'unicité Postgres étant
// sensible à la casse) et le login sensible à la casse.
const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

const passwordSchema = z.string().min(8);

export const loginSchema = z.object({
  email: emailSchema,
  // Pas de borne haute au login : l'utilisateur saisit son mot de passe complet
  // (bcrypt compare de toute façon sur les 72 premiers octets).
  password: passwordSchema,
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: emailSchema,
  // bcrypt n'exploite que les 72 premiers OCTETS : on borne la création pour
  // qu'aucun suffixe ne soit silencieusement ignoré (deux mots de passe
  // partageant ces 72 octets seraient sinon équivalents).
  password: passwordSchema.refine(
    (pw) => Buffer.byteLength(pw, "utf8") <= 72,
    "Le mot de passe ne doit pas dépasser 72 octets"
  ),
});
export type SignupInput = z.infer<typeof signupSchema>;
