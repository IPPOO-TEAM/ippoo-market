import { useEffect, useState } from "react";
import { Bell, Camera, MapPin, Mic, HardDrive, Users, Check, X, Loader2 } from "lucide-react";
import { queryPermission, requestPermission, PermissionKind, PermissionState } from "./permissions";
import { haptic } from "./haptics";

type Row = { kind: PermissionKind; label: string; reason: string; icon: React.ReactNode };

const ROWS: Row[] = [
  { kind: "notifications", label: "Notifications", reason: "Statuts de commande, promos, messages vendeurs", icon: <Bell className="w-5 h-5" /> },
  { kind: "geolocation", label: "Localisation", reason: "Calcul des frais de livraison et points de retrait proches", icon: <MapPin className="w-5 h-5" /> },
  { kind: "camera", label: "Caméra", reason: "Scanner les codes-barres produits et QR de paiement", icon: <Camera className="w-5 h-5" /> },
  { kind: "microphone", label: "Microphone", reason: "Recherche vocale et messages audio", icon: <Mic className="w-5 h-5" /> },
  { kind: "contacts", label: "Contacts", reason: "Inviter vos clients et fournisseurs", icon: <Users className="w-5 h-5" /> },
  { kind: "persistent-storage", label: "Stockage persistant", reason: "Mode hors-ligne et reprise sur perte de réseau", icon: <HardDrive className="w-5 h-5" /> },
];

export function PermissionsPanel() {
  const [states, setStates] = useState<Record<string, PermissionState>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const out: Record<string, PermissionState> = {};
      for (const r of ROWS) out[r.kind] = await queryPermission(r.kind);
      setStates(out);
    })();
  }, []);

  const ask = async (k: PermissionKind) => {
    setBusy(k);
    const next = await requestPermission(k);
    setStates((s) => ({ ...s, [k]: next }));
    setBusy(null);
  };

  const askAll = async () => {
    haptic("medium");
    for (const r of ROWS) {
      if (states[r.kind] !== "granted") {
        // eslint-disable-next-line no-await-in-loop
        await ask(r.kind);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>Permissions de l'application</p>
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>Accordez les accès pour une expérience native complète</p>
        </div>
        <button
          onClick={askAll}
          data-haptic="medium"
          className="px-3 py-2 rounded-xl bg-[#E11D2E] text-white press-feedback"
          style={{ fontSize: 12, fontWeight: 700 }}
        >
          Tout autoriser
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {ROWS.map((r, i) => {
          const st = states[r.kind] ?? "prompt";
          return (
            <button
              key={r.kind}
              type="button"
              onClick={() => st !== "granted" && st !== "unsupported" && ask(r.kind)}
              disabled={st === "granted" || st === "unsupported" || busy === r.kind}
              className={`w-full flex items-center gap-3 p-4 text-left press-feedback ${i < ROWS.length - 1 ? "border-b border-border" : ""}`}
            >
              <span className="w-10 h-10 rounded-xl bg-[#F3F4F6] inline-flex items-center justify-center text-[#0F172A]">
                {r.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 14, fontWeight: 600 }}>{r.label}</p>
                <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>{r.reason}</p>
              </div>
              <PermissionBadge state={st} loading={busy === r.kind} />
            </button>
          );
        })}
      </div>
      <p className="text-muted-foreground text-center" style={{ fontSize: 11 }}>
        Vous pouvez révoquer ces accès à tout moment depuis les réglages de votre navigateur ou téléphone.
      </p>
    </div>
  );
}

function PermissionBadge({ state, loading }: { state: PermissionState; loading: boolean }) {
  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  if (state === "granted") return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#16A34A]/10 text-[#16A34A]" style={{ fontSize: 11, fontWeight: 700 }}><Check className="w-3 h-3" /> Autorisé</span>;
  if (state === "denied") return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#E11D2E]/10 text-[#E11D2E]" style={{ fontSize: 11, fontWeight: 700 }}><X className="w-3 h-3" /> Refusé</span>;
  if (state === "unsupported") return <span className="text-muted-foreground" style={{ fontSize: 11 }}>N/D</span>;
  return <span className="px-2 py-1 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6]" style={{ fontSize: 11, fontWeight: 700 }}>Autoriser</span>;
}
