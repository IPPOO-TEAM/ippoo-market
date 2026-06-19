import { useEffect, useState } from "react";
import { ChevronRight, Lock, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "./ui-kit/Switch";
import { changePin, isPinLocked, resetPinLock, verifyPinWithLock, PIN_MAX_ATTEMPTS } from "../payments/store";
import { usePayments } from "../payments/usePayments";
import { pinValid } from "../payments/validators";
import { getSupabase, getSession } from "../auth/supabase";

export type Device = { id: string; name: string; location: string; lastSeen: string; current?: boolean };

export function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-border p-5">
      <h3 className="mb-4 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>
        {icon} {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function RowSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span style={{ fontSize: 14 }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#F3F4F6] rounded-lg px-3 py-1.5 border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none"
        style={{ fontSize: 13 }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

export function RowToggle({ label, sub, value, onChange, disabled }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${disabled ? "opacity-50" : ""}`}>
      <div className="min-w-0">
        <p style={{ fontSize: 14 }}>{label}</p>
        {sub && <p className="text-muted-foreground" style={{ fontSize: 11 }}>{sub}</p>}
      </div>
      <Switch checked={value} onChange={onChange} disabled={disabled} label={label} />
    </div>
  );
}

export function RowAction({ icon: Icon, label, value, onClick }: { icon: typeof Lock; label: string; value?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between py-2 border-b border-[#F3F4F6]">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span style={{ fontSize: 14 }}>{label}</span>
      </div>
      <div className="flex items-center gap-1 text-muted-foreground">
        {value && <span style={{ fontSize: 12 }}>{value}</span>}
        <ChevronRight className="w-4 h-4" />
      </div>
    </button>
  );
}

export function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 17 }}>{title}</h3>
          <button onClick={onClose} aria-label="Fermer" className="p-1 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PasswordModal({ onClose }: { onClose: () => void }) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (oldPwd.length < 6) return setError("Mot de passe actuel requis");
    if (newPwd.length < 8) return setError("Le nouveau mot de passe doit faire au moins 8 caractères");
    if (newPwd !== confirm) return setError("La confirmation ne correspond pas");
    if (oldPwd === newPwd) return setError("Choisissez un mot de passe différent");
    if (!pinValid(pin)) return setError("Code PIN du wallet à 4 chiffres requis");
    const r = await verifyPinWithLock(pin);
    if (!r.ok) {
      if (r.reason === "locked") return setError(`PIN verrouillé. Réessayez dans ${Math.ceil(r.remainingMs / 60000)} min`);
      if (r.lockedNow) return setError("Trop d'échecs. PIN verrouillé pendant 15 minutes");
      return setError(`PIN incorrect. ${r.attemptsLeft} essai(s) restant(s)`);
    }
    try {
      const sb = getSupabase();
      const sess = await getSession();
      const email = sess?.user?.email;
      if (!email) return setError("Session expirée — reconnecte-toi");
      const reauth = await sb.auth.signInWithPassword({ email, password: oldPwd });
      if (reauth.error) return setError("Mot de passe actuel incorrect");
      const upd = await sb.auth.updateUser({ password: newPwd });
      if (upd.error) return setError(upd.error.message);
    } catch (err) {
      return setError(err instanceof Error ? err.message : "Échec de la mise à jour");
    }
    toast.success("Mot de passe modifié");
    onClose();
  };

  return (
    <ModalShell title="Changer le mot de passe" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {[
          { label: "Mot de passe actuel", value: oldPwd, set: setOldPwd, type: "password" as const, max: undefined },
          { label: "Nouveau mot de passe", value: newPwd, set: setNewPwd, type: "password" as const, max: undefined },
          { label: "Confirmer le nouveau mot de passe", value: confirm, set: setConfirm, type: "password" as const, max: undefined },
        ].map((f) => (
          <label key={f.label} className="block">
            <span className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>{f.label}</span>
            <input
              type={f.type}
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none"
              style={{ fontSize: 13 }}
            />
          </label>
        ))}
        <label className="block pt-1">
          <span className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>
            Code PIN du wallet (validation de sécurité)
          </span>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="••••"
            className="w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none tracking-[0.5em] text-center"
            style={{ fontSize: 16 }}
          />
        </label>
        {error && (
          <div className="rounded-xl bg-[#FEE2E2] border border-[#E11D2E]/30 p-3 text-[#E11D2E]" style={{ fontSize: 12, fontWeight: 600 }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF4400] text-white"
          style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}
        >
          Mettre à jour
        </button>
      </form>
    </ModalShell>
  );
}

export function PinModal({ onClose }: { onClose: () => void }) {
  const state = usePayments();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Re-render chaque seconde pour faire défiler le compte à rebours du verrou
  useEffect(() => {
    if (!state.pinLockedUntil) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [state.pinLockedUntil]);
  void tick;

  const lock = isPinLocked();
  const failures = state.pinFailures;
  const remaining = lock.locked ? Math.ceil(lock.remainingMs / 60000) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pinValid(current)) return setError("PIN actuel : 4 chiffres requis");
    if (!pinValid(next)) return setError("Nouveau PIN : 4 chiffres requis");
    if (next !== confirm) return setError("La confirmation ne correspond pas");
    if (next === current) return setError("Choisissez un PIN différent");
    if (/^(\d)\1{3}$/.test(next)) return setError("PIN trop simple (chiffres identiques)");
    if (next === "1234" || next === "0000") return setError("PIN trop facile à deviner");
    const r = await changePin(current, next);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    toast.success("Code PIN mis à jour");
    onClose();
  };

  return (
    <ModalShell title="Code PIN du wallet" onClose={onClose}>
      {lock.locked ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-[#FEE2E2] border border-[#E11D2E]/30 p-3 text-[#E11D2E]" style={{ fontSize: 13, fontWeight: 600 }}>
            PIN verrouillé après {PIN_MAX_ATTEMPTS} tentatives. Réessayez dans {remaining} min.
          </div>
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>
            Pour des raisons de sécurité, toutes les opérations protégées par PIN sont bloquées pendant la durée du verrou.
          </p>
          <button
            onClick={() => { resetPinLock(); toast.success("Verrou réinitialisé"); }}
            className="w-full py-3 rounded-xl border border-border"
            style={{ fontWeight: 700, fontSize: 13 }}
          >
            Réinitialiser le verrou
          </button>
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-[#FF6A00] text-white" style={{ fontWeight: 700 }}>
            Fermer
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>
            Le code PIN protège les paiements via IPPOO CASH et les retraits. Il est verrouillé 15 min après {PIN_MAX_ATTEMPTS} échecs.
          </p>
          {failures > 0 && (
            <p className="text-[#F97316]" style={{ fontSize: 12, fontWeight: 600 }}>
              {failures} échec(s) récent(s). {PIN_MAX_ATTEMPTS - failures} essai(s) avant verrouillage.
            </p>
          )}
          {[
            { label: "PIN actuel (4 chiffres)", value: current, set: setCurrent },
            { label: "Nouveau PIN", value: next, set: setNext },
            { label: "Confirmer le nouveau PIN", value: confirm, set: setConfirm },
          ].map((f) => (
            <label key={f.label} className="block">
              <span className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>{f.label}</span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={f.value}
                onChange={(e) => f.set(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none tracking-[0.5em] text-center"
                style={{ fontSize: 16 }}
              />
            </label>
          ))}
          {error && (
            <div className="rounded-xl bg-[#FEE2E2] border border-[#E11D2E]/30 p-3 text-[#E11D2E]" style={{ fontSize: 12, fontWeight: 600 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF4400] text-white"
            style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}
          >
            Mettre à jour le PIN
          </button>
        </form>
      )}
    </ModalShell>
  );
}

export function DevicesModal({ devices, onClose, onRevoke }: { devices: Device[]; onClose: () => void; onRevoke: (id: string) => void | Promise<void> }) {
  return (
    <ModalShell title="Appareils connectés" onClose={onClose}>
      <p className="text-muted-foreground mb-3" style={{ fontSize: 12 }}>
        Pour des raisons de sécurité, seul l'appareil courant est listé ici. Le bouton ci-dessous révoque toutes les autres sessions ouvertes sur ton compte.
      </p>
      <div className="space-y-2">
        {devices.map((d) => (
          <div key={d.id} className="p-3 bg-[#F3F4F6] rounded-xl">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>
                    {d.name}
                    {d.current && <span className="ml-2 px-2 py-0.5 bg-[#16A34A] text-white rounded-lg" style={{ fontSize: 10, fontWeight: 700 }}>Actuel</span>}
                  </p>
                  <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>{d.location} · {d.lastSeen}</p>
                </div>
              </div>
              {!d.current && (
                <button
                  onClick={() => onRevoke(d.id)}
                  className="text-[#E11D2E] hover:bg-[#FEF2F2] rounded-lg px-2 py-1 shrink-0"
                  style={{ fontSize: 12, fontWeight: 600 }}
                >
                  Déconnecter
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

export const HELP_CONTENT: Record<string, { title: string; body: string }> = {
  cgu: {
    title: "Conditions générales d'utilisation",
    body: "En utilisant IPPOO Market, tu acceptes nos règles d'usage : respect des autres membres, vente de produits conformes, paiements via les moyens proposés. Toute fraude entraîne la suspension immédiate du compte. Les commandes sont fermes et engagent vendeur et acheteur. Les litiges sont résolus via notre service SAV.",
  },
  privacy: {
    title: "Politique de confidentialité",
    body: "Tes données personnelles (nom, email, téléphone, adresses) sont stockées de façon sécurisée et ne sont jamais revendues. Elles servent uniquement à : traiter tes commandes, te contacter, améliorer le service. Tu peux exporter ou supprimer tes données à tout moment depuis cette page. Les paiements sont chiffrés (TLS 1.3).",
  },
};

export function HelpModal({ kind, onClose }: { kind: string; onClose: () => void }) {
  const content = HELP_CONTENT[kind];
  if (!content) return null;
  return (
    <ModalShell title={content.title} onClose={onClose}>
      <p className="text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.6 }}>{content.body}</p>
    </ModalShell>
  );
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmColor,
  requireTyping,
  typingPhrase,
  requirePin,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  requireTyping?: boolean;
  typingPhrase?: string;
  requirePin?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const canType = !requireTyping || typed === typingPhrase;
  const canPin = !requirePin || pinValid(pin);

  const handleConfirm = async () => {
    if (requirePin) {
      const r = await verifyPinWithLock(pin);
      if (!r.ok) {
        if (r.reason === "locked") setError(`PIN verrouillé. Réessayez dans ${Math.ceil(r.remainingMs / 60000)} min`);
        else if (r.lockedNow) setError("Trop d'échecs. PIN verrouillé pendant 15 minutes");
        else setError(`PIN incorrect. ${r.attemptsLeft} essai(s) restant(s)`);
        return;
      }
    }
    onConfirm();
  };

  return (
    <ModalShell title={title} onClose={onCancel}>
      <p className="text-muted-foreground mb-4" style={{ fontSize: 14 }}>{message}</p>
      {requireTyping && typingPhrase && (
        <div className="mb-4">
          <p className="mb-1" style={{ fontSize: 12 }}>
            Tape <span className="px-1.5 py-0.5 bg-[#FEF2F2] text-[#E11D2E] rounded" style={{ fontWeight: 700 }}>{typingPhrase}</span> pour confirmer
          </p>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none"
            style={{ fontSize: 13 }}
          />
        </div>
      )}
      {requirePin && (
        <div className="mb-4">
          <p className="mb-1" style={{ fontSize: 12 }}>
            Saisissez votre <strong>code PIN</strong> du wallet pour valider
          </p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(null); }}
            placeholder="••••"
            className="w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none tracking-[0.5em] text-center"
            style={{ fontSize: 16 }}
          />
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-[#FEE2E2] border border-[#E11D2E]/30 p-3 mb-3 text-[#E11D2E]" style={{ fontSize: 12, fontWeight: 600 }}>
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-[#F3F4F6]"
          style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 14 }}
        >
          Annuler
        </button>
        <button
          onClick={handleConfirm}
          disabled={!canType || !canPin}
          className="flex-1 py-3 rounded-xl text-white disabled:opacity-50"
          style={{ background: confirmColor, fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}
