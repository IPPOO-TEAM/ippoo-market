import { z } from "npm:zod@3.23.8";
import { PREFIX, supabase, rateLimit, clientKey, logSafe } from "../_shared.tsx";
import * as kv from "../kv_store.tsx";
import {
  sendWelcomeEmail,
  sendOtpEmail,
  sendPasswordResetEmail,
  sendLoginAlertEmail,
  isEmailReady,
} from "../_email.tsx";

const SignupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(200),
  name: z.string().max(120).optional(),
});

const EmailOnlySchema = z.object({ email: z.string().email().max(255) });
const VerifyOtpSchema = z.object({
  email: z.string().email().max(255),
  code: z.string().min(4).max(8),
});

const OTP_TTL_MS = 10 * 60_000;       // 10 minutes
const OTP_MAX_ATTEMPTS = 5;

function genOtp(): string {
  // 6 chiffres, sans biais notable.
  const n = (crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000);
  return n.toString().padStart(6, "0");
}

export function registerAuth(app: any) {
  /* ─── Inscription (auto-confirm) + email de bienvenue ───────── */
  app.post(`${PREFIX}/signup`, async (c: any) => {
    if (!rateLimit(clientKey(c, "signup"), 5, 60_000)) {
      return c.json({ error: "Trop de tentatives, réessayez dans 1 min." }, 429);
    }
    try {
      const parsed = SignupSchema.safeParse(await c.req.json().catch(() => ({})));
      if (!parsed.success) return c.json({ error: "Champs invalides", details: parsed.error.flatten() }, 400);
      const { email, password, name } = parsed.data;
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { name: name || "" },
        email_confirm: true,
      });
      if (error) {
        console.log(`Signup error ${await logSafe("email", email)}: ${error.message}`);
        return c.json({ error: "Impossible de créer le compte" }, 400);
      }
      // Email de bienvenue (best-effort, n'échoue jamais l'inscription).
      sendWelcomeEmail(email, name).catch(() => undefined);
      return c.json({ ok: true, userId: data.user?.id, emailReady: isEmailReady() });
    } catch (e) {
      console.log(`Signup exception: ${e}`);
      return c.json({ error: `Erreur serveur signup` }, 500);
    }
  });

  /* ─── Demande de code de vérification (OTP) par email ───────── */
  app.post(`${PREFIX}/auth/otp/request`, async (c: any) => {
    if (!rateLimit(clientKey(c, "otp-req"), 5, 60_000)) {
      return c.json({ error: "Trop de demandes, patientez une minute." }, 429);
    }
    try {
      const parsed = EmailOnlySchema.safeParse(await c.req.json().catch(() => ({})));
      if (!parsed.success) return c.json({ error: "Email invalide" }, 400);
      const email = parsed.data.email.toLowerCase();
      const code = genOtp();
      await kv.set(`otp:${email}`, { code, exp: Date.now() + OTP_TTL_MS, attempts: 0 });
      const r = await sendOtpEmail(email, code);
      if (!r.ok) return c.json({ error: "Envoi du code impossible", emailReady: isEmailReady() }, 502);
      return c.json({ ok: true });
    } catch (e) {
      console.log(`OTP request exception: ${e}`);
      return c.json({ error: "Erreur serveur" }, 500);
    }
  });

  /* ─── Vérification du code OTP ──────────────────────────────── */
  app.post(`${PREFIX}/auth/otp/verify`, async (c: any) => {
    if (!rateLimit(clientKey(c, "otp-verify"), 10, 60_000)) {
      return c.json({ error: "Trop de tentatives, patientez une minute." }, 429);
    }
    try {
      const parsed = VerifyOtpSchema.safeParse(await c.req.json().catch(() => ({})));
      if (!parsed.success) return c.json({ error: "Champs invalides" }, 400);
      const email = parsed.data.email.toLowerCase();
      const rec = await kv.get(`otp:${email}`);
      if (!rec) return c.json({ error: "Code expiré ou inexistant" }, 400);
      if (Date.now() > rec.exp) { await kv.del(`otp:${email}`); return c.json({ error: "Code expiré" }, 400); }
      if ((rec.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
        await kv.del(`otp:${email}`);
        return c.json({ error: "Trop d'essais. Demandez un nouveau code." }, 429);
      }
      if (rec.code !== parsed.data.code.trim()) {
        await kv.set(`otp:${email}`, { ...rec, attempts: (rec.attempts ?? 0) + 1 });
        return c.json({ error: "Code incorrect" }, 400);
      }
      await kv.del(`otp:${email}`);
      return c.json({ ok: true, verified: true });
    } catch (e) {
      console.log(`OTP verify exception: ${e}`);
      return c.json({ error: "Erreur serveur" }, 500);
    }
  });

  /* ─── Réinitialisation de mot de passe (lien Resend) ────────── */
  app.post(`${PREFIX}/auth/password/reset-request`, async (c: any) => {
    if (!rateLimit(clientKey(c, "pwd-reset"), 4, 60_000)) {
      return c.json({ error: "Trop de demandes, patientez une minute." }, 429);
    }
    try {
      const parsed = EmailOnlySchema.safeParse(await c.req.json().catch(() => ({})));
      if (!parsed.success) return c.json({ error: "Email invalide" }, 400);
      const email = parsed.data.email.toLowerCase();
      const redirectTo = (await c.req.json().catch(() => ({})))?.redirectTo
        ?? c.req.header("origin")
        ?? undefined;
      // Génère un lien de recovery via Supabase Admin puis l'envoie via Resend.
      const { data, error } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email,
        options: redirectTo ? { redirectTo } : undefined,
      });
      // On répond toujours ok (anti-énumération de comptes).
      if (!error && data?.properties?.action_link) {
        await sendPasswordResetEmail(email, data.properties.action_link).catch(() => undefined);
      }
      return c.json({ ok: true });
    } catch (e) {
      console.log(`Password reset exception: ${e}`);
      return c.json({ ok: true }); // ne révèle rien
    }
  });

  /* ─── Alerte de connexion (best-effort) ─────────────────────── */
  app.post(`${PREFIX}/auth/login-alert`, async (c: any) => {
    try {
      const parsed = EmailOnlySchema.safeParse(await c.req.json().catch(() => ({})));
      if (!parsed.success) return c.json({ ok: true });
      const when = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo" });
      sendLoginAlertEmail(parsed.data.email.toLowerCase(), when).catch(() => undefined);
      return c.json({ ok: true });
    } catch {
      return c.json({ ok: true });
    }
  });
}
