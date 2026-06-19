import fonDict from "./dict/fon.json";
import ffDict from "./dict/ff.json";
import dyuDict from "./dict/dyu.json";
import sefDict from "./dict/sef.json";
import djeDict from "./dict/dje.json";
import { CANONICAL_KEYS, COVERAGE_THRESHOLD, coverage } from "./keys";

type RawDict = Record<string, unknown>;

const RAW: Record<string, RawDict> = {
  fon: fonDict as RawDict,
  ff: ffDict as RawDict,
  dyu: dyuDict as RawDict,
  sef: sefDict as RawDict,
  dje: djeDict as RawDict,
};

export type LanguageMeta = {
  code: string;
  language: string;
  status: string;
  note?: string;
  coverage: number;
  ready: boolean;
};

const cleaned: Record<string, Record<string, string>> = {};
const meta: Record<string, LanguageMeta> = {};

for (const [code, raw] of Object.entries(RAW)) {
  const dict: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k === "_meta") continue;
    if (typeof v === "string" && v.trim().length > 0) dict[k] = v;
  }
  cleaned[code] = dict;
  const m = (raw._meta as Record<string, string>) || {};
  const cov = coverage(dict);
  meta[code] = {
    code,
    language: m.language || code,
    status: m.status || "draft",
    note: m.note,
    coverage: cov,
    ready: cov >= COVERAGE_THRESHOLD,
  };
}

export function getStaticDict(code: string): Record<string, string> | null {
  return cleaned[code] ?? null;
}

export function getLanguageMeta(code: string): LanguageMeta | null {
  return meta[code] ?? null;
}

/** Codes des langues réservées dont la couverture est suffisante pour exposition. */
export function readyReservedCodes(): string[] {
  return Object.values(meta).filter((m) => m.ready).map((m) => m.code);
}

export { CANONICAL_KEYS };
