/* ═══════════════════════════════════════════
   IPPOO Market - 54 pays d'Afrique
   ISO-3166 alpha-2, indicatif E.164, longueur de
   numéro national (NSN) et exemple de format local.
   Source : ITU + UPU. Aucun drapeau emoji (UI no-emoji).
   ═══════════════════════════════════════════ */

export type AfricanCountry = {
  iso: string;       // "BJ"
  name: string;      // "Bénin"
  dial: string;      // "229" (sans le +)
  nsn: [number, number]; // longueur min / max du numéro national
  example: string;   // exemple complet "+229 01 91 00 00 00 00"
};

/**
 * Quand le pays n'a pas de réforme à plan fermé bien connue,
 * on autorise une plage [min, max] pour la longueur NSN.
 */
export const AFRICAN_COUNTRIES: AfricanCountry[] = [
  { iso: "DZ", name: "Algérie",                 dial: "213", nsn: [9, 9],   example: "+213 5 51 23 45 67" },
  { iso: "AO", name: "Angola",                  dial: "244", nsn: [9, 9],   example: "+244 923 123 456" },
  { iso: "BJ", name: "Bénin",                   dial: "229", nsn: [10, 12], example: "+229 01 91 00 00 00 00" },
  { iso: "BW", name: "Botswana",                dial: "267", nsn: [7, 8],   example: "+267 71 234 567" },
  { iso: "BF", name: "Burkina Faso",            dial: "226", nsn: [8, 8],   example: "+226 70 12 34 56" },
  { iso: "BI", name: "Burundi",                 dial: "257", nsn: [8, 8],   example: "+257 79 56 12 34" },
  { iso: "CV", name: "Cap-Vert",                dial: "238", nsn: [7, 7],   example: "+238 991 12 34" },
  { iso: "CM", name: "Cameroun",                dial: "237", nsn: [9, 9],   example: "+237 6 71 23 45 67" },
  { iso: "CF", name: "Centrafrique",            dial: "236", nsn: [8, 8],   example: "+236 70 12 34 56" },
  { iso: "TD", name: "Tchad",                   dial: "235", nsn: [8, 8],   example: "+235 63 01 23 45" },
  { iso: "KM", name: "Comores",                 dial: "269", nsn: [7, 7],   example: "+269 321 23 45" },
  { iso: "CG", name: "Congo",                   dial: "242", nsn: [9, 9],   example: "+242 06 123 45 67" },
  { iso: "CD", name: "RD Congo",                dial: "243", nsn: [9, 9],   example: "+243 991 234 567" },
  { iso: "CI", name: "Côte d'Ivoire",           dial: "225", nsn: [10, 10], example: "+225 01 23 45 67 89" },
  { iso: "DJ", name: "Djibouti",                dial: "253", nsn: [8, 8],   example: "+253 77 83 10 01" },
  { iso: "EG", name: "Égypte",                  dial: "20",  nsn: [9, 10],  example: "+20 100 123 4567" },
  { iso: "GQ", name: "Guinée équatoriale",      dial: "240", nsn: [9, 9],   example: "+240 222 123 456" },
  { iso: "ER", name: "Érythrée",                dial: "291", nsn: [7, 7],   example: "+291 7 123 456" },
  { iso: "SZ", name: "Eswatini",                dial: "268", nsn: [8, 8],   example: "+268 7612 3456" },
  { iso: "ET", name: "Éthiopie",                dial: "251", nsn: [9, 9],   example: "+251 91 123 4567" },
  { iso: "GA", name: "Gabon",                   dial: "241", nsn: [8, 9],   example: "+241 06 03 12 34" },
  { iso: "GM", name: "Gambie",                  dial: "220", nsn: [7, 7],   example: "+220 301 23 45" },
  { iso: "GH", name: "Ghana",                   dial: "233", nsn: [9, 9],   example: "+233 23 123 4567" },
  { iso: "GN", name: "Guinée",                  dial: "224", nsn: [8, 9],   example: "+224 601 12 34 56" },
  { iso: "GW", name: "Guinée-Bissau",           dial: "245", nsn: [7, 9],   example: "+245 955 123 456" },
  { iso: "KE", name: "Kenya",                   dial: "254", nsn: [9, 9],   example: "+254 712 123 456" },
  { iso: "LS", name: "Lesotho",                 dial: "266", nsn: [8, 8],   example: "+266 5012 3456" },
  { iso: "LR", name: "Libéria",                 dial: "231", nsn: [7, 9],   example: "+231 770 123 456" },
  { iso: "LY", name: "Libye",                   dial: "218", nsn: [9, 10],  example: "+218 91 234 5678" },
  { iso: "MG", name: "Madagascar",              dial: "261", nsn: [9, 9],   example: "+261 32 12 345 67" },
  { iso: "MW", name: "Malawi",                  dial: "265", nsn: [9, 9],   example: "+265 991 23 45 67" },
  { iso: "ML", name: "Mali",                    dial: "223", nsn: [8, 8],   example: "+223 65 01 23 45" },
  { iso: "MR", name: "Mauritanie",              dial: "222", nsn: [8, 8],   example: "+222 22 12 34 56" },
  { iso: "MU", name: "Maurice",                 dial: "230", nsn: [7, 8],   example: "+230 5251 2345" },
  { iso: "MA", name: "Maroc",                   dial: "212", nsn: [9, 9],   example: "+212 6 12 34 56 78" },
  { iso: "MZ", name: "Mozambique",              dial: "258", nsn: [9, 9],   example: "+258 82 123 4567" },
  { iso: "NA", name: "Namibie",                 dial: "264", nsn: [7, 10],  example: "+264 81 123 4567" },
  { iso: "NE", name: "Niger",                   dial: "227", nsn: [8, 8],   example: "+227 90 12 34 56" },
  { iso: "NG", name: "Nigéria",                 dial: "234", nsn: [10, 10], example: "+234 802 123 4567" },
  { iso: "RW", name: "Rwanda",                  dial: "250", nsn: [9, 9],   example: "+250 720 123 456" },
  { iso: "ST", name: "Sao Tomé-et-Principe",    dial: "239", nsn: [7, 7],   example: "+239 981 23 45" },
  { iso: "SN", name: "Sénégal",                 dial: "221", nsn: [9, 9],   example: "+221 70 123 45 67" },
  { iso: "SC", name: "Seychelles",              dial: "248", nsn: [7, 7],   example: "+248 2 510 123" },
  { iso: "SL", name: "Sierra Leone",            dial: "232", nsn: [8, 8],   example: "+232 25 123 456" },
  { iso: "SO", name: "Somalie",                 dial: "252", nsn: [7, 9],   example: "+252 61 234 5678" },
  { iso: "ZA", name: "Afrique du Sud",          dial: "27",  nsn: [9, 9],   example: "+27 71 123 4567" },
  { iso: "SS", name: "Soudan du Sud",           dial: "211", nsn: [9, 9],   example: "+211 97 123 4567" },
  { iso: "SD", name: "Soudan",                  dial: "249", nsn: [9, 9],   example: "+249 91 123 4567" },
  { iso: "TZ", name: "Tanzanie",                dial: "255", nsn: [9, 9],   example: "+255 621 234 567" },
  { iso: "TG", name: "Togo",                    dial: "228", nsn: [8, 8],   example: "+228 90 11 23 45" },
  { iso: "TN", name: "Tunisie",                 dial: "216", nsn: [8, 8],   example: "+216 20 123 456" },
  { iso: "UG", name: "Ouganda",                 dial: "256", nsn: [9, 9],   example: "+256 712 345 678" },
  { iso: "EH", name: "Sahara occidental",       dial: "212", nsn: [9, 9],   example: "+212 6 12 34 56 78" },
  { iso: "ZM", name: "Zambie",                  dial: "260", nsn: [9, 9],   example: "+260 95 1234567" },
  { iso: "ZW", name: "Zimbabwe",                dial: "263", nsn: [9, 10],  example: "+263 71 234 5678" },
];

export const DEFAULT_COUNTRY: AfricanCountry =
  AFRICAN_COUNTRIES.find((c) => c.iso === "BJ")!;

export function findCountry(iso: string): AfricanCountry | undefined {
  return AFRICAN_COUNTRIES.find((c) => c.iso === iso);
}

export function findCountryByDial(dial: string): AfricanCountry | undefined {
  const d = dial.replace(/^\+/, "");
  return AFRICAN_COUNTRIES.find((c) => c.dial === d);
}

/** Garde uniquement les chiffres et regroupe en paires : "0191000000" -> "01 91 00 00 00 00". */
export function formatNationalDigits(digits: string): string {
  const d = digits.replace(/\D/g, "");
  return d.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

/** Concatène et normalise : retourne `+229 01 91 00 00 00 00`. */
export function formatFullPhone(country: AfricanCountry, national: string): string {
  const d = national.replace(/\D/g, "");
  return d ? `+${country.dial} ${formatNationalDigits(d)}` : "";
}

/** Décompose un numéro stocké en {country, national}. Tolérant. */
export function parseStoredPhone(raw: string): { country: AfricanCountry; national: string } {
  const s = raw.trim();
  if (s.startsWith("+")) {
    const rest = s.slice(1).replace(/\s+/g, "");
    for (const c of AFRICAN_COUNTRIES) {
      if (rest.startsWith(c.dial)) {
        return { country: c, national: rest.slice(c.dial.length) };
      }
    }
  }
  return { country: DEFAULT_COUNTRY, national: s.replace(/\D/g, "") };
}

export function isValidPhone(country: AfricanCountry, national: string): boolean {
  const d = national.replace(/\D/g, "");
  return d.length >= country.nsn[0] && d.length <= country.nsn[1];
}
