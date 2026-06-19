// Agrégateur de paiement Fedapay (stub front-end).
// Centralise les flux Mobile Money / carte utilisés à la fois pour la
// recharge IPPOO CASH (Feature 5) et le checkout direct sans solde (Feature 6).
//
// En production, ces fonctions feraient un POST vers l'API Fedapay
// (https://api.fedapay.com/v1/transactions) avec le secret côté serveur.
// Ici, on simule une latence réseau et un taux d'échec faible.

export type FedapayChannel = "mobile" | "card";

export type FedapayMobileMeta = {
  channel: "mobile";
  phone: string;
  operator: "mtn" | "moov" | "celtis" | "wave" | "orange";
  otp: string;
};

export type FedapayCardMeta = {
  channel: "card";
  last4: string;
  brand: string;
};

export type FedapayMeta = FedapayMobileMeta | FedapayCardMeta;

export type FedapayResult =
  | { ok: true; reference: string; processor: "fedapay"; channel: FedapayChannel }
  | { ok: false; error: string };

const NETWORK_DELAY_MS = 750;
const FAIL_RATE = 0; // 0 = jamais (démo), bumper pour stress-tester

function genRef(): string {
  const part = () => Math.random().toString(36).slice(2, 7).toUpperCase();
  return `FDP-${part()}-${part()}`;
}

/**
 * Charge un montant via Fedapay (Mobile Money ou carte).
 * Utilisé pour : recharge wallet, paiement direct sans solde IPPOO CASH.
 */
export async function chargeViaFedapay(
  amount: number,
  meta: FedapayMeta,
): Promise<FedapayResult> {
  await new Promise((r) => setTimeout(r, NETWORK_DELAY_MS));

  if (!Number.isFinite(amount) || amount < 100) {
    return { ok: false, error: "Montant minimum : 100 FCFA" };
  }
  if (amount > 5_000_000) {
    return { ok: false, error: "Plafond Fedapay : 5 000 000 FCFA" };
  }

  if (meta.channel === "mobile") {
    if (!meta.phone.trim()) return { ok: false, error: "Numéro Mobile Money requis" };
    if (!/^\d{4,6}$/.test(meta.otp)) return { ok: false, error: "Code OTP invalide" };
  } else {
    if (!/^\d{4}$/.test(meta.last4)) return { ok: false, error: "Carte invalide" };
  }

  if (Math.random() < FAIL_RATE) {
    return { ok: false, error: "Fedapay : transaction refusée par l'émetteur" };
  }

  return { ok: true, reference: genRef(), processor: "fedapay", channel: meta.channel };
}
