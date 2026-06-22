/* ═══════════════════════════════════════════════════════════════
   IPPOO — Envoi d'emails transactionnels via Resend
   La clé API est lue depuis le secret d'environnement RESEND_API_KEY
   (jamais en dur dans le code). Les emails couvrent les processus
   d'authentification : bienvenue, code de vérification (OTP),
   réinitialisation de mot de passe, alerte de connexion.
   ═══════════════════════════════════════════════════════════════ */

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
// Adresse expéditrice. Doit appartenir à un domaine vérifié dans Resend.
// Par défaut on utilise le domaine de test Resend (onboarding@resend.dev)
// pour que ça marche immédiatement avant la vérification du domaine IPPOO.
const FROM = Deno.env.get("RESEND_FROM") ?? "IPPOO Market <onboarding@resend.dev>";

export function isEmailReady(): boolean {
  return RESEND_API_KEY.length > 0;
}

type SendResult = { ok: true; id?: string } | { ok: false; error: string };

/** Envoi bas-niveau via l'API REST Resend. Best-effort : ne lève jamais. */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendResult> {
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY manquante — email non envoyé");
    return { ok: false, error: "Email non configuré" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.log(`Resend send failed: HTTP ${res.status} ${body.slice(0, 200)}`);
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const j = await res.json().catch(() => ({}));
    return { ok: true, id: j?.id };
  } catch (e) {
    console.log(`Resend send exception: ${e}`);
    return { ok: false, error: String(e) };
  }
}

/* ─── Gabarit de base (chartre IPPOO) ───────────────────────────── */
function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#FFF7ED;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:24px;">
    <div style="text-align:center;padding:8px 0 16px;">
      <span style="display:inline-block;font-weight:900;font-size:22px;color:#E11D2E;letter-spacing:.5px;">IPPOO MARKET</span>
    </div>
    <div style="background:#ffffff;border:1px solid #F0E0D0;border-radius:16px;padding:28px;">
      <h1 style="margin:0 0 14px;font-size:19px;color:#1A1A1A;">${title}</h1>
      ${body}
    </div>
    <p style="text-align:center;color:#9CA3AF;font-size:11px;margin-top:18px;">
      IPPOO Market — Marketplace B2B de vente en gros<br/>
      Cet email vous a été envoyé dans le cadre de votre compte. Si vous n'êtes pas à l'origine de cette action, ignorez-le.
    </p>
  </div></body></html>`;
}

/* ─── Templates ─────────────────────────────────────────────────── */

export function sendWelcomeEmail(to: string, name?: string): Promise<SendResult> {
  const hi = name?.trim() ? `Bonjour ${name.trim()},` : "Bonjour,";
  return sendEmail({
    to,
    subject: "Bienvenue sur IPPOO Market 🎉",
    html: layout("Bienvenue sur IPPOO Market", `
      <p style="font-size:14px;color:#374151;line-height:1.6;">${hi}</p>
      <p style="font-size:14px;color:#374151;line-height:1.6;">
        Votre compte a bien été créé. Vous pouvez dès maintenant explorer le catalogue en gros,
        comparer les prix, rejoindre des achats groupés et payer avec IPPOO Cash.
      </p>
      <p style="font-size:14px;color:#374151;line-height:1.6;">Bon business sur IPPOO Market !</p>
    `),
    text: `${hi}\nVotre compte IPPOO Market a bien été créé. Bon business !`,
  });
}

export function sendOtpEmail(to: string, code: string): Promise<SendResult> {
  return sendEmail({
    to,
    subject: `Votre code de vérification IPPOO : ${code}`,
    html: layout("Code de vérification", `
      <p style="font-size:14px;color:#374151;line-height:1.6;">
        Utilisez le code ci-dessous pour valider votre adresse email. Il expire dans <strong>10 minutes</strong>.
      </p>
      <div style="text-align:center;margin:22px 0;">
        <span style="display:inline-block;font-size:32px;font-weight:900;letter-spacing:8px;color:#E11D2E;background:#FFF7ED;border:1px dashed #E11D2E;border-radius:12px;padding:14px 22px;">${code}</span>
      </div>
      <p style="font-size:12px;color:#9CA3AF;line-height:1.6;">Ne partagez jamais ce code. L'équipe IPPOO ne vous le demandera jamais.</p>
    `),
    text: `Votre code de vérification IPPOO : ${code} (valable 10 minutes).`,
  });
}

export function sendPasswordResetEmail(to: string, link: string): Promise<SendResult> {
  return sendEmail({
    to,
    subject: "Réinitialisation de votre mot de passe IPPOO",
    html: layout("Réinitialiser votre mot de passe", `
      <p style="font-size:14px;color:#374151;line-height:1.6;">
        Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous.
        Ce lien expire dans 1 heure.
      </p>
      <div style="text-align:center;margin:22px 0;">
        <a href="${link}" style="display:inline-block;background:#E11D2E;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;border-radius:12px;padding:13px 26px;">Réinitialiser mon mot de passe</a>
      </div>
      <p style="font-size:12px;color:#9CA3AF;line-height:1.6;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `),
    text: `Réinitialisez votre mot de passe IPPOO : ${link} (valable 1 heure).`,
  });
}

export function sendLoginAlertEmail(to: string, when: string): Promise<SendResult> {
  return sendEmail({
    to,
    subject: "Nouvelle connexion à votre compte IPPOO",
    html: layout("Nouvelle connexion détectée", `
      <p style="font-size:14px;color:#374151;line-height:1.6;">
        Une connexion à votre compte IPPOO a été enregistrée le <strong>${when}</strong>.
      </p>
      <p style="font-size:12px;color:#9CA3AF;line-height:1.6;">
        Si c'était bien vous, aucune action n'est requise. Sinon, changez immédiatement votre mot de passe.
      </p>
    `),
    text: `Nouvelle connexion à votre compte IPPOO le ${when}.`,
  });
}
