import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2 } from "lucide-react";
import { DELIVERY_LABELS, PAYMENT_LABELS } from "../../auth/user-profile";
import type { DeliveryMethod, PaymentMethod, UserProfile } from "../../auth/user-profile";
import { SECTORS, CIRCUITS, JURIDICAL_FORMS, getSubsectors, getNiches, type CircuitId, type JuridicalForm } from "../../data/sectors";
import { ModalShell, Input, PrimaryBtn } from "./profile-primitives";

export function EditProModal({
  profile,
  onClose,
  onSave,
}: {
  profile: UserProfile;
  onClose: () => void;
  onSave: (patch: Partial<UserProfile>) => void;
}) {
  const [businessName, setBusinessName] = useState(profile.businessName ?? "");
  const [juridicalForm, setJuridicalForm] = useState<JuridicalForm | "">(profile.juridicalForm ?? "");
  const [rccm, setRccm] = useState(profile.rccm ?? "");
  const [ifu, setIfu] = useState(profile.ifu ?? "");
  const [sectorId, setSectorId] = useState(profile.sectorId ?? "");
  const [subsectorId, setSubsectorId] = useState(profile.subsectorId ?? "");
  const [niche, setNiche] = useState(profile.niche ?? "");
  const [circuit, setCircuit] = useState<CircuitId | "">(profile.circuit ?? "");
  const [description, setDescription] = useState(profile.description ?? "");

  const subsectors = sectorId ? getSubsectors(sectorId) : [];
  const niches = sectorId && subsectorId ? getNiches(sectorId, subsectorId) : [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      businessName: businessName.trim() || undefined,
      juridicalForm: juridicalForm || undefined,
      rccm: rccm.trim() || undefined,
      ifu: ifu.trim() || undefined,
      sectorId: sectorId || undefined,
      subsectorId: subsectorId || undefined,
      niche: niche.trim() || undefined,
      circuit: circuit || undefined,
      description: description.trim() || undefined,
    });
  };

  return (
    <ModalShell title="Modifier l'activité pro" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Input label="Raison sociale" value={businessName} onChange={setBusinessName} placeholder="Nom commercial" />
        <label className="block">
          <span className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>Forme juridique</span>
          <select
            value={juridicalForm}
            onChange={(e) => setJuridicalForm(e.target.value as JuridicalForm | "")}
            className="w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none"
            style={{ fontSize: 13 }}
          >
            <option value="">— Sélectionner —</option>
            {JURIDICAL_FORMS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Input label="RCCM" value={rccm} onChange={setRccm} placeholder="RCCM" />
          <Input label="IFU" value={ifu} onChange={setIfu} placeholder="IFU" />
        </div>
        <label className="block">
          <span className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>Secteur</span>
          <select
            value={sectorId}
            onChange={(e) => { setSectorId(e.target.value); setSubsectorId(""); setNiche(""); }}
            className="w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none"
            style={{ fontSize: 13 }}
          >
            <option value="">— Sélectionner un secteur —</option>
            {SECTORS.map((s) => (
              <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
            ))}
          </select>
        </label>
        {sectorId && (
          <label className="block">
            <span className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>Sous-secteur</span>
            <select
              value={subsectorId}
              onChange={(e) => { setSubsectorId(e.target.value); setNiche(""); }}
              className="w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none"
              style={{ fontSize: 13 }}
            >
              <option value="">— Sélectionner un sous-secteur —</option>
              {subsectors.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </label>
        )}
        {subsectorId && (
          <label className="block">
            <span className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>Métier / Niche</span>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none"
              style={{ fontSize: 13 }}
            >
              <option value="">— Sélectionner un métier —</option>
              {niches.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        )}
        <label className="block">
          <span className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>Circuit</span>
          <select
            value={circuit}
            onChange={(e) => setCircuit(e.target.value as CircuitId | "")}
            className="w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none"
            style={{ fontSize: 13 }}
          >
            <option value="">— Sélectionner —</option>
            {CIRCUITS.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:outline-none resize-none"
            style={{ fontSize: 13 }}
            placeholder="Présentez brièvement votre activité"
          />
        </label>
        <PrimaryBtn type="submit">Enregistrer</PrimaryBtn>
      </form>
    </ModalShell>
  );
}

export function EditLogisticsModal({
  profile,
  onClose,
  onSave,
}: {
  profile: UserProfile;
  onClose: () => void;
  onSave: (patch: Partial<UserProfile>) => void;
}) {
  const [methods, setMethods] = useState<DeliveryMethod[]>(profile.deliveryMethods ?? []);
  const [openingHours, setOpeningHours] = useState(profile.openingHours ?? "");
  const [processingDelay, setProcessingDelay] = useState(profile.processingDelay ?? "");

  const toggle = (m: DeliveryMethod) => {
    setMethods((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      deliveryMethods: methods,
      openingHours: openingHours.trim() || undefined,
      processingDelay: processingDelay.trim() || undefined,
    });
  };

  return (
    <ModalShell title="Modifier la logistique" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <span className="text-muted-foreground block mb-2" style={{ fontSize: 12 }}>Modes de livraison</span>
          <div className="space-y-2">
            {(Object.keys(DELIVERY_LABELS) as DeliveryMethod[]).map((m) => (
              <label key={m} className="flex items-center gap-2 p-2 rounded-xl bg-[#F3F4F6] cursor-pointer">
                <input
                  type="checkbox"
                  checked={methods.includes(m)}
                  onChange={() => toggle(m)}
                  className="w-4 h-4 accent-[#E11D2E]"
                />
                <span style={{ fontSize: 13 }}>{DELIVERY_LABELS[m]}</span>
              </label>
            ))}
          </div>
        </div>
        <Input label="Horaires d'ouverture" value={openingHours} onChange={setOpeningHours} placeholder="Ex: Lun-Sam 8h-18h" />
        <Input label="Délai de traitement" value={processingDelay} onChange={setProcessingDelay} placeholder="Ex: 24-48h" />
        <PrimaryBtn type="submit">Enregistrer</PrimaryBtn>
      </form>
    </ModalShell>
  );
}

export function EditPaymentsModal({
  profile,
  onClose,
  onSave,
}: {
  profile: UserProfile;
  onClose: () => void;
  onSave: (patch: Partial<UserProfile>) => void;
}) {
  const [methods, setMethods] = useState<PaymentMethod[]>(profile.paymentMethods ?? []);
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState(profile.mobileMoneyNumber ?? "");

  const toggle = (m: PaymentMethod) => {
    setMethods((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  };

  const needsMoMo = methods.some((m) => m === "mtn" || m === "moov" || m === "celtis");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (needsMoMo && !mobileMoneyNumber.trim()) {
      return toast.error("Numéro Mobile Money requis");
    }
    onSave({
      paymentMethods: methods,
      mobileMoneyNumber: mobileMoneyNumber.trim() || undefined,
    });
  };

  return (
    <ModalShell title="Modifier les paiements" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <span className="text-muted-foreground block mb-2" style={{ fontSize: 12 }}>Méthodes acceptées</span>
          <div className="space-y-2">
            {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => (
              <label key={m} className="flex items-center gap-2 p-2 rounded-xl bg-[#F3F4F6] cursor-pointer">
                <input
                  type="checkbox"
                  checked={methods.includes(m)}
                  onChange={() => toggle(m)}
                  className="w-4 h-4 accent-[#E11D2E]"
                />
                <span style={{ fontSize: 13 }}>{PAYMENT_LABELS[m]}</span>
              </label>
            ))}
          </div>
        </div>
        {needsMoMo && (
          <Input label="Numéro Mobile Money" type="tel" value={mobileMoneyNumber} onChange={setMobileMoneyNumber} placeholder="Ex: +229 97 00 00 00" />
        )}
        <PrimaryBtn type="submit">Enregistrer</PrimaryBtn>
      </form>
    </ModalShell>
  );
}

const DOC_LABELS: Record<"logo" | "shopPhoto" | "certificate", string> = {
  logo: "Logo",
  shopPhoto: "Photo de boutique",
  certificate: "Certificat / Document officiel",
};

export function EditDocModal({
  field,
  current,
  onClose,
  onSave,
  onRemove,
}: {
  field: "logo" | "shopPhoto" | "certificate";
  current?: string;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  onRemove: () => void;
}) {
  const [preview, setPreview] = useState<string | undefined>(current);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choisis une image");
    if (file.size > 4 * 1024 * 1024) return toast.error("Image trop lourde (max 4 Mo)");
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <ModalShell title={DOC_LABELS[field]} onClose={onClose}>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} />
      <div className="aspect-square rounded-2xl border-2 border-dashed border-border bg-[#F3F4F6] overflow-hidden flex items-center justify-center mb-3">
        {preview ? (
          <img src={preview} alt={DOC_LABELS[field]} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-muted-foreground" style={{ fontSize: 12 }}>
            Aucun document
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full py-2.5 rounded-xl bg-[#F3F4F6] flex items-center justify-center gap-2 mb-2"
        style={{ fontSize: 13, fontWeight: 600 }}
      >
        <Upload className="w-4 h-4" /> {preview ? "Remplacer" : "Téléverser"}
      </button>
      <div className="flex gap-2">
        {current && (
          <button
            type="button"
            onClick={onRemove}
            className="flex-1 py-2.5 rounded-xl bg-[#FEF2F2] text-[#E11D2E] flex items-center justify-center gap-1"
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        )}
        <button
          type="button"
          disabled={!preview || preview === current}
          onClick={() => preview && onSave(preview)}
          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF4400] text-white disabled:opacity-50"
          style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
        >
          Enregistrer
        </button>
      </div>
    </ModalShell>
  );
}
