// Validation utilities pour les paiements IPPOO Market.
// 100 % côté client, sans dépendance.

export function digitsOnly(s: string): string {
  return (s || "").replace(/\D/g, "");
}

export function formatCardNumber(raw: string): string {
  return digitsOnly(raw).slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
}

/** Algorithme de Luhn pour valider un numéro de carte (13-19 chiffres). */
export function luhnCheck(raw: string): boolean {
  const s = digitsOnly(raw);
  if (s.length < 13 || s.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let n = parseInt(s[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function detectCardBrand(raw: string): "visa" | "mastercard" | "amex" | "unknown" {
  const s = digitsOnly(raw);
  if (/^4/.test(s)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(s)) return "mastercard";
  if (/^3[47]/.test(s)) return "amex";
  return "unknown";
}

/** Format MM/AA. Retourne true si la carte n'est pas expirée. */
export function expiryValid(mmYY: string): boolean {
  const m = mmYY.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) return false;
  const month = parseInt(m[1], 10);
  const year = 2000 + parseInt(m[2], 10);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const exp = new Date(year, month, 0, 23, 59, 59);
  return exp.getTime() >= now.getTime();
}

export function cvvValid(cvv: string, brand: string): boolean {
  const len = brand === "amex" ? 4 : 3;
  return new RegExp(`^\\d{${len}}$`).test(cvv);
}

/** Numéro Mobile Money valide (Bénin/Afrique de l'Ouest, format international toléré). */
export function momoPhoneValid(phone: string): boolean {
  const s = digitsOnly(phone);
  if (s.length < 8 || s.length > 15) return false;
  // Préfixes courants Bénin: 90,91,96,97 (MTN) / 94,95,98,99 (Moov)
  return /^(\+?22[19]?)?\d{8,11}$/.test(phone.replace(/\s/g, ""));
}

export function momoOperator(phone: string): "mtn" | "moov" | "unknown" {
  const s = digitsOnly(phone);
  const last8 = s.slice(-8);
  const p = last8.slice(0, 2);
  if (["90", "91", "96", "97", "61", "62", "66", "67", "51", "52", "56", "57"].includes(p)) return "mtn";
  if (["94", "95", "98", "99", "64", "65", "68", "69", "54", "55", "58", "59"].includes(p)) return "moov";
  return "unknown";
}

/** Validation d'un numéro selon l'opérateur. Accepte les formats internationaux. */
export function providerPhoneValid(
  phone: string,
  provider: "mtn" | "moov" | "celtis" | "wave" | "orange",
): boolean {
  if (!momoPhoneValid(phone)) return false;
  const s = digitsOnly(phone);
  const last8 = s.slice(-8);
  const p2 = last8.slice(0, 2);
  switch (provider) {
    case "mtn":
      return ["90", "91", "96", "97", "61", "62", "66", "67", "51", "52", "56", "57"].includes(p2);
    case "moov":
      return ["94", "95", "98", "99", "64", "65", "68", "69", "54", "55", "58", "59"].includes(p2);
    case "celtis":
      return s.length >= 8;
    case "wave":
      return s.length >= 8;
    case "orange":
      return s.length >= 8;
  }
}

/** Code PIN à 4 chiffres pour le wallet IPPOO. */
export function pinValid(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}
