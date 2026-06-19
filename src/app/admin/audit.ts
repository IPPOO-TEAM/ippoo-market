import { useSyncExternalStore } from "react";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";

export type AuditEntry = {
  id: string;
  ts: number;
  actor: string;
  action: string;
  target: string;
  meta?: Record<string, string | number | boolean>;
};

const KEY = "ippoo:admin-audit";
const MAX_ENTRIES = 500;

function load(): AuditEntry[] {
  try {
    const raw = safeGetItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AuditEntry[];
  } catch {
    return [];
  }
}

let entries: AuditEntry[] = load();
const listeners = new Set<() => void>();

function persist() {
  safeSetItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

function emit() { persist(); listeners.forEach((l) => l()); }

export function logAudit(action: string, target: string, meta?: AuditEntry["meta"]) {
  const entry: AuditEntry = {
    id: `A${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    ts: Date.now(),
    actor: "Admin IPPOO",
    action,
    target,
    meta,
  };
  entries = [entry, ...entries].slice(0, MAX_ENTRIES);
  emit();
}

export function getAudit(): AuditEntry[] { return entries; }

export function subscribeAudit(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); }

export function useAudit(): AuditEntry[] {
  return useSyncExternalStore(subscribeAudit, getAudit, getAudit);
}

export function clearAudit() {
  entries = [];
  emit();
}
