/* ═══════════════════════════════════════════
   IPPOO — Authentification biométrique (WebAuthn)
   - registerBiometric : associe une empreinte/Face ID à un profil minimal
   - loginBiometric    : redonne ce profil minimal (nom, prénom, organisation)
   - confirmBiometric  : sert pour valider un paiement (présence utilisateur)
   Aucune donnée sensible n'est exposée par l'API publique : seuls
   firstName / lastName / organization sont retournés à l'interface.
   ═══════════════════════════════════════════ */

import { safeGetItem, safeSetItem, safeRemoveItem } from "../lib/safe-storage";

const PROFILE_KEY = "ippoo:bio-profile";
const CRED_KEY = "ippoo:bio-cred";

export type BioPublicProfile = {
  firstName: string;
  lastName: string;
  organization: string;
};

type StoredProfile = BioPublicProfile & {
  // jamais retourné par loginBiometric — réservé à l'app
  email?: string;
  phone?: string;
};

function b64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomBytes(n: number): Uint8Array<ArrayBuffer> {
  const a = new Uint8Array(new ArrayBuffer(n));
  crypto.getRandomValues(a);
  return a;
}

export function isBiometricSupported(): boolean {
  return typeof window !== "undefined"
    && !!window.PublicKeyCredential
    && !!navigator.credentials
    && typeof navigator.credentials.create === "function";
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isBiometricSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function hasBiometricCredential(): boolean {
  return !!safeGetItem(CRED_KEY) && !!safeGetItem(PROFILE_KEY);
}

export function getPublicProfile(): BioPublicProfile | null {
  try {
    const raw = safeGetItem(PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as StoredProfile;
    return {
      firstName: p.firstName || "",
      lastName: p.lastName || "",
      organization: p.organization || "",
    };
  } catch {
    return null;
  }
}

export function clearBiometric() {
  safeRemoveItem(PROFILE_KEY);
  safeRemoveItem(CRED_KEY);
}

export async function registerBiometric(profile: StoredProfile): Promise<BioPublicProfile> {
  if (!isBiometricSupported()) throw new Error("Biométrie non disponible sur cet appareil");
  const available = await isPlatformAuthenticatorAvailable();
  if (!available) throw new Error("Aucun capteur biométrique détecté (Touch ID / Face ID / empreinte)");

  const userId = randomBytes(16);
  const challenge = randomBytes(32);
  const displayName = `${profile.firstName} ${profile.lastName}`.trim() || "Utilisateur IPPOO";

  const opts: CredentialCreationOptions = {
    publicKey: {
      challenge,
      rp: { name: "IPPOO CASH" },
      user: {
        id: userId,
        name: profile.email || profile.phone || `ippoo-${b64(userId).slice(0, 8)}`,
        displayName,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },   // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60_000,
      attestation: "none",
    },
  };

  const cred = (await navigator.credentials.create(opts)) as PublicKeyCredential | null;
  if (!cred) throw new Error("Enregistrement biométrique annulé");

  const credId = b64(cred.rawId);
  const pub: BioPublicProfile = {
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
    organization: profile.organization.trim(),
  };
  safeSetItem(CRED_KEY, credId);
  safeSetItem(PROFILE_KEY, JSON.stringify({ ...profile, ...pub }));
  return pub;
}

async function assertBiometric(): Promise<void> {
  if (!isBiometricSupported()) throw new Error("Biométrie non disponible");
  const challenge = randomBytes(32);
  const credIdStr = safeGetItem(CRED_KEY) || "";
  const allowCredentials: PublicKeyCredentialDescriptor[] = [];
  if (credIdStr) {
    const bin = atob(credIdStr.replace(/-/g, "+").replace(/_/g, "/"));
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    allowCredentials.push({ type: "public-key", id: arr });
  }
  const opts: CredentialRequestOptions = {
    publicKey: {
      challenge,
      timeout: 60_000,
      userVerification: "required",
      allowCredentials,
    },
  };
  const assertion = await navigator.credentials.get(opts);
  if (!assertion) throw new Error("Vérification biométrique annulée");
}

export async function loginBiometric(): Promise<BioPublicProfile> {
  if (!hasBiometricCredential()) throw new Error("Aucun profil biométrique enregistré sur cet appareil");
  await assertBiometric();
  const pub = getPublicProfile();
  if (!pub) throw new Error("Profil introuvable");
  return pub;
}

export async function confirmBiometric(): Promise<boolean> {
  await assertBiometric();
  return true;
}
