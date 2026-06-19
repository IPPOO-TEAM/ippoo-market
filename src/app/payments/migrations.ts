import type { Order } from "./types";

/**
 * Registre des migrations : chaque entrée transforme l'état de la version
 * `from` vers `from + 1`. Pour ajouter une migration, écrire une fonction
 * pure qui prend l'état d'entrée et renvoie le nouvel état, puis bumper
 * `SCHEMA_VERSION`.
 */
const MIGRATIONS: Record<number, (raw: Record<string, unknown>) => Record<string, unknown>> = {
  2: (raw) => ({
    ...raw,
    walletActivated: false,
    walletKeyHash: "",
  }),
  1: (raw) => {
    const ordersIn = (raw.orders as Order[] | undefined) ?? [];
    const orders = ordersIn.map((o) => ({
      ...o,
      escrowStatus:
        o.escrowStatus ??
        (o.payMethod === "cod"
          ? "n/a"
          : o.status === "annulee"
            ? "refunded"
            : o.status === "livree" || o.status === "cloturee"
              ? "released"
              : "held"),
    }));
    return {
      ...raw,
      orders,
      processedKeys: (raw.processedKeys as Record<string, unknown>) ?? {},
      walletBlocked: 0,
    };
  },
};

export function migrate(raw: Record<string, unknown>, schemaVersion: number): Record<string, unknown> {
  let cur = raw;
  let v = typeof cur.schemaVersion === "number" ? cur.schemaVersion : 1;
  while (v < schemaVersion) {
    const step = MIGRATIONS[v];
    if (!step) break;
    cur = step(cur);
    v += 1;
  }
  return { ...cur, schemaVersion: v };
}
