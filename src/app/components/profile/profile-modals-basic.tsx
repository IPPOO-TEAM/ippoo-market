import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Check } from "lucide-react";
import { SUPPORTED_LANGUAGES, getLangCode } from "../../i18n";
import { getSupabase } from "../../auth/supabase";
import { ModalShell, Input, PrimaryBtn, validateEmail, validatePhone } from "./profile-primitives";
import type { Address, TeamMember } from "./types";

export function EditInfoModal({ info, onClose, onSave }: { info: { name: string; email: string; phone: string; company: string; city: string }; onClose: () => void; onSave: (v: typeof info) => void }) {
  const [v, setV] = useState(info);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.name.trim()) return toast.error("Nom requis");
    if (!validateEmail(v.email)) return toast.error("Email invalide");
    if (!validatePhone(v.phone)) return toast.error("Téléphone invalide");
    onSave(v);
  };
  return (
    <ModalShell title="Modifier le profil" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Input label="Nom complet" value={v.name} onChange={(x) => setV({ ...v, name: x })} />
        <Input label="Email" type="email" value={v.email} onChange={(x) => setV({ ...v, email: x })} />
        <Input label="Téléphone" type="tel" value={v.phone} onChange={(x) => setV({ ...v, phone: x })} />
        <Input label="Entreprise" value={v.company} onChange={(x) => setV({ ...v, company: x })} />
        <Input label="Ville" value={v.city} onChange={(x) => setV({ ...v, city: x })} />
        <PrimaryBtn type="submit">Enregistrer</PrimaryBtn>
      </form>
    </ModalShell>
  );
}

export function AddressModal({ initial, onClose, onSave }: { initial: Address | null; onClose: () => void; onSave: (a: Omit<Address, "id">) => void }) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [details, setDetails] = useState(initial?.details ?? "");
  const [type, setType] = useState<"delivery" | "billing">(initial?.type ?? "delivery");
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return toast.error("Donne un nom à l'adresse");
    if (details.trim().length < 5) return toast.error("Adresse trop courte");
    onSave({ label, details, type, isDefault });
  };

  return (
    <ModalShell title={initial ? "Modifier l'adresse" : "Nouvelle adresse"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Input label="Libellé" value={label} onChange={setLabel} placeholder="Ex: Boutique Cotonou" />
        <Input label="Adresse complète" value={details} onChange={setDetails} placeholder="Rue, quartier, ville, pays" />
        <div>
          <span className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>Type</span>
          <div className="flex gap-2">
            {(["delivery", "billing"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-xl ${type === t ? "bg-[#FF6A00] text-white" : "bg-[#F3F4F6] text-foreground"}`}
                style={{ fontSize: 13, fontWeight: 600 }}
              >
                {t === "delivery" ? "Livraison" : "Facturation"}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="w-4 h-4 accent-[#E11D2E]" />
          <span style={{ fontSize: 13 }}>Définir comme adresse par défaut</span>
        </label>
        <PrimaryBtn type="submit">{initial ? "Enregistrer" : "Ajouter"}</PrimaryBtn>
      </form>
    </ModalShell>
  );
}

export function PasswordModal({ onClose }: { onClose: () => void }) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPwd.length < 6) return toast.error("Mot de passe actuel requis");
    if (newPwd.length < 8) return toast.error("Le nouveau mot de passe doit faire au moins 8 caractères");
    if (newPwd !== confirm) return toast.error("La confirmation ne correspond pas");
    if (oldPwd === newPwd) return toast.error("Choisis un mot de passe différent");
    setBusy(true);
    try {
      const sb = getSupabase();
      const { data: sessionData } = await sb.auth.getSession();
      const email = sessionData.session?.user?.email;
      if (!email) { toast.error("Session expirée - reconnecte-toi"); setBusy(false); return; }
      const reauth = await sb.auth.signInWithPassword({ email, password: oldPwd });
      if (reauth.error) { toast.error("Mot de passe actuel incorrect"); setBusy(false); return; }
      const upd = await sb.auth.updateUser({ password: newPwd });
      if (upd.error) throw upd.error;
      toast.success("Mot de passe modifié");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la modification");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Changer le mot de passe" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Input label="Mot de passe actuel" type="password" value={oldPwd} onChange={setOldPwd} />
        <Input label="Nouveau mot de passe" type="password" value={newPwd} onChange={setNewPwd} />
        <Input label="Confirmer le nouveau mot de passe" type="password" value={confirm} onChange={setConfirm} />
        <PrimaryBtn type="submit" disabled={busy}>{busy ? "Mise à jour…" : "Mettre à jour"}</PrimaryBtn>
      </form>
    </ModalShell>
  );
}

const PREF_OPTIONS = {
  language: SUPPORTED_LANGUAGES,
  currency: ["FCFA (XOF)", "EUR (€)", "USD ($)", "NGN (₦)", "GHS (₵)"],
  notifications: ["SMS + Push", "Push uniquement", "Email uniquement", "Aucune"],
};

export function PrefModal({ field, current, onClose, onSave }: { field: "language" | "currency" | "notifications"; current: string; onClose: () => void; onSave: (v: string) => void }) {
  const titles = { language: "Langue", currency: "Devise", notifications: "Notifications" };
  return (
    <ModalShell title={titles[field]} onClose={onClose}>
      <div className="space-y-2">
        {PREF_OPTIONS[field].map((opt) => {
          const isLang = field === "language";
          const code = isLang ? getLangCode(opt).toUpperCase() : null;
          return (
            <button
              key={opt}
              onClick={() => onSave(opt)}
              className={`w-full flex items-center justify-between p-3 rounded-xl ${opt === current ? "bg-[#FEF2F2] border border-[#E11D2E]" : "bg-[#F3F4F6]"}`}
            >
              <span className="flex items-center gap-2 min-w-0">
                {code && (
                  <span
                    className="px-1.5 py-0.5 rounded-md bg-white border border-border text-muted-foreground shrink-0"
                    style={{ fontSize: 10, fontWeight: 700, fontFamily: "Poppins", letterSpacing: 0.5 }}
                  >
                    {code}
                  </span>
                )}
                <span className="truncate" style={{ fontSize: 14, fontWeight: 500 }}>{opt}</span>
              </span>
              {opt === current && <Check className="w-4 h-4 text-[#E11D2E] shrink-0" />}
            </button>
          );
        })}
      </div>
    </ModalShell>
  );
}

const ROLES = ["Acheteur", "Acheteuse", "Comptable", "Manager", "Admin"];

export function TeamModal({ team, onClose, onChange }: { team: TeamMember[]; onClose: () => void; onChange: (t: TeamMember[]) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(ROLES[0]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Nom requis");
    if (!validateEmail(email)) return toast.error("Email invalide");
    onChange([...team, { id: `t${Date.now()}`, name, email, role }]);
    setName("");
    setEmail("");
    toast.success("Membre invité");
  };

  const remove = (id: string) => {
    onChange(team.filter((m) => m.id !== id));
    toast.success("Membre retiré");
  };

  return (
    <ModalShell title="Gestion des utilisateurs" onClose={onClose}>
      <div className="space-y-2 mb-4">
        {team.length === 0 && (
          <p className="text-muted-foreground text-center py-4" style={{ fontSize: 13 }}>Aucun membre pour le moment</p>
        )}
        {team.map((m) => (
          <div key={m.id} className="flex items-center justify-between p-3 bg-[#F3F4F6] rounded-xl">
            <div className="min-w-0">
              <p className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</p>
              <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>{m.email} · {m.role}</p>
            </div>
            <button onClick={() => remove(m.id)} aria-label="Retirer" className="p-1 text-muted-foreground hover:text-[#E11D2E]">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={add} className="space-y-3 border-t border-border pt-4">
        <p style={{ fontSize: 13, fontWeight: 600 }}>Inviter un membre</p>
        <Input label="Nom" value={name} onChange={setName} />
        <Input label="Email" type="email" value={email} onChange={setEmail} />
        <label className="block">
          <span className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>Rôle</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none"
            style={{ fontSize: 13 }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <PrimaryBtn type="submit">Inviter</PrimaryBtn>
      </form>
    </ModalShell>
  );
}

export function ConfirmModal({ title, message, onCancel, onConfirm }: { title: string; message: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <ModalShell title={title} onClose={onCancel}>
      <p className="text-muted-foreground mb-4" style={{ fontSize: 14 }}>{message}</p>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-[#F3F4F6]"
          style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 14 }}
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-3 rounded-xl bg-[#FF6A00] text-white"
          style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}
        >
          Confirmer
        </button>
      </div>
    </ModalShell>
  );
}
