#!/usr/bin/env node
/**
 * Crée (ou met à jour) un compte et lui donne le rôle admin.
 *
 *   node scripts/create-admin.mjs <email> <mot-de-passe> [Prénom Nom]
 *
 * Variables attendues (dans .env.local ou l'environnement) :
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // Pas de .env.local : on compte sur l'environnement.
  }
}
loadEnvLocal();

const [email, password, ...nameParts] = process.argv.slice(2);
const fullName = nameParts.join(" ") || email?.split("@")[0] || "";
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!email || !password) {
  console.error("Usage : node scripts/create-admin.mjs <email> <mot-de-passe> [Prénom Nom]");
  process.exit(1);
}
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont nécessaires (fichier .env.local).");
  process.exit(1);
}
if (password.length < 6) {
  console.error("Supabase exige un mot de passe d'au moins 6 caractères.");
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

async function findUserByEmail() {
  for (let page = 1; page < 50; page++) {
    const res = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=200`, { headers });
    if (!res.ok) throw new Error(`Lecture des comptes impossible (${res.status}).`);
    const data = await res.json();
    const found = (data.users ?? []).find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
    if (found) return found;
    if ((data.users ?? []).length < 200) return null;
  }
  return null;
}

let user = await findUserByEmail();
if (user) {
  const res = await fetch(`${url}/auth/v1/admin/users/${user.id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ password, email_confirm: true, user_metadata: { full_name: fullName } }),
  });
  if (!res.ok) throw new Error(`Mise à jour du mot de passe impossible (${res.status}) : ${await res.text()}`);
  console.log(`Compte existant : mot de passe mis à jour pour ${email}.`);
} else {
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: fullName } }),
  });
  if (!res.ok) throw new Error(`Création impossible (${res.status}) : ${await res.text()}`);
  user = await res.json();
  console.log(`Compte créé : ${email}.`);
}

// Le trigger crée le profil ; on force le rôle admin (et on crée le profil s'il manquait).
const res = await fetch(`${url}/rest/v1/profiles?on_conflict=id`, {
  method: "POST",
  headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify({ id: user.id, email: email.toLowerCase(), full_name: fullName, role: "admin" }),
});
if (!res.ok) throw new Error(`Rôle admin non appliqué (${res.status}) : ${await res.text()}`);
console.log(`Rôle admin attribué à ${email}. Connexion : ${process.env.NEXT_PUBLIC_SITE_URL ?? "votre espace membre"}`);
