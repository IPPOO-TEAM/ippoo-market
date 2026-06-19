/* ═══════════════════════════════════════════
   IPPOO — Inscription via Edge Function
   Crée le compte côté serveur avec admin.createUser({ email_confirm: true })
   pour contourner la confirmation par email, puis ouvre la session.
   ═══════════════════════════════════════════ */

import { projectId, publicAnonKey } from "/utils/supabase/info";
import { getSupabase } from "./supabase";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-cc347259`;

export type SignupServerResult =
  | { ok: true; userId?: string }
  | { ok: false; error: string; alreadyExists: boolean };

/** Crée le compte côté serveur (admin.createUser auto-confirm). */
export async function signupViaServer(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<SignupServerResult> {
  try {
    const res = await fetch(`${BASE}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        name: input.name ?? "",
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = String(json?.error || `HTTP ${res.status}`);
      const alreadyExists = /already|exist|registered|duplicate/i.test(message);
      return { ok: false, error: message, alreadyExists };
    }
    return { ok: true, userId: json?.userId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur réseau", alreadyExists: false };
  }
}

/** Inscription complète : crée le compte serveur puis ouvre la session. */
export async function signupAndSignIn(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = getSupabase();
  const created = await signupViaServer(input);
  const alreadyExists = !created.ok && created.alreadyExists;
  if (!created.ok && !alreadyExists) {
    return { ok: false, error: created.error };
  }
  // Que le compte vienne d'être créé ou qu'il existait déjà, on tente de se
  // connecter avec le mot de passe fourni.
  const { error } = await sb.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) {
    if (alreadyExists) {
      return { ok: false, error: "Un compte existe déjà avec cet email. Mot de passe incorrect." };
    }
    return { ok: false, error: `Compte créé mais connexion impossible : ${error.message}` };
  }
  return { ok: true };
}
