// Modal d'achat groupé déclenchée depuis une fiche produit.
// Crée un vrai Group dans le store et expose un lien d'invitation réel
// (consommé par /achat-groupe?join=GRP-...).
import { useMemo, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import {
  X, Users, UserPlus, QrCode, Link2, Copy, CheckCircle, Clock,
  Minus, Plus, Share2, ArrowRight, ChevronRight, Mail, Phone,
  Crown, ShieldCheck, AlertCircle, Gift, Wallet, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { WhatsAppIcon } from "./icons/whatsapp-icon";
import { copyToClipboard } from "./utils/copy-to-clipboard";
import { formatPrice } from "./mock-data";
import {
  createGroup, payShare, subscribeGroups, getGroups,
  currentPalierPrice, currentQty, findOpenGroupFor, extendGroup,
  type Group,
} from "../groups/store";
import { ensureAccountId } from "../auth/account-id";
import { useUserProfile } from "../auth/useUserProfile";

interface GroupPurchaseProduct {
  id: number;
  name: string;
  image: string;
  price: number;
  unit: string;
  seller: string;
  moq: number;
}

interface GroupPurchaseModalProps {
  product: GroupPurchaseProduct;
  quantity: number;
  totalPrice: number;
  onClose: () => void;
}

export function GroupPurchaseModal({ product, quantity, totalPrice, onClose }: GroupPurchaseModalProps) {
  const navigate = useNavigate();
  const profile = useUserProfile();
  const me = useMemo(() => ensureAccountId(), []);
  const myName = profile
    ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || profile.businessName || "Moi"
    : "Moi";

  // Si l'utilisateur a déjà un groupement ouvert pour ce produit, on le
  // réutilise au lieu d'empiler un nouveau groupe à chaque ouverture de la
  // modale (cas d'usage : revient sur la fiche après avoir partagé le lien).
  const existing = useMemo(() => findOpenGroupFor(me.id, product.name), [me.id, product.name]);

  const [step, setStep] = useState<"config" | "share" | "tracking">(existing ? "tracking" : "config");
  const [numParticipants, setNumParticipants] = useState(
    existing ? existing.maxParticipants : Math.max(2, Math.min(10, Math.ceil(quantity / Math.max(1, product.moq)))),
  );
  const [durationHours, setDurationHours] = useState(48);
  const [groupName, setGroupName] = useState(existing?.name ?? `Groupage ${product.name}`);
  const [groupId, setGroupId] = useState<string | null>(existing?.id ?? null);

  // Souscription store pour suivre le groupe en live (étape tracking)
  const groups = useSyncExternalStore(subscribeGroups, getGroups, getGroups);
  const liveGroup: Group | undefined = useMemo(
    () => (groupId ? groups.find((g) => g.id === groupId) : undefined),
    [groups, groupId],
  );

  const perPersonShare = useMemo(
    () => Math.ceil(totalPrice / Math.max(1, numParticipants)),
    [totalPrice, numParticipants],
  );

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteLink = groupId ? `${origin}/achat-groupe?join=${groupId}` : "";
  const inviteText = liveGroup
    ? `Rejoignez mon groupage « ${liveGroup.name} » sur IPPOO pour ${liveGroup.product} : ${inviteLink}`
    : "";
  const qrUrl = inviteLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(inviteLink)}`
    : "";

  // ─── Création réelle du groupement (ou fusion si un groupe est déjà ouvert) ───
  const createRealGroup = () => {
    const qtyPerMember = Math.max(1, Math.ceil(quantity / numParticipants));
    const reuse = findOpenGroupFor(me.id, product.name);
    if (reuse) {
      const merged = extendGroup(reuse.id, {
        targetQty: Math.max(reuse.targetQty, product.moq, quantity),
        maxParticipants: Math.max(reuse.maxParticipants, numParticipants),
        organizerQty: qtyPerMember,
        durationHours,
      });
      const g = merged ?? reuse;
      setGroupId(g.id);
      setStep("share");
      toast.success(`Groupement existant mis à jour · ${g.id}`);
      return;
    }
    const g = createGroup({
      name: groupName.trim() || `Groupage ${product.name}`,
      product: product.name,
      image: product.image,
      organizer: myName,
      organizerId: me.id,
      zone: profile?.city || "À définir",
      targetQty: Math.max(product.moq, quantity),
      maxParticipants: numParticipants,
      priceNormal: product.price,
      paymentMode: "individuel",
      delivery: "Point de retrait",
      durationHours,
      organizerQty: qtyPerMember,
    });
    setGroupId(g.id);
    setStep("share");
    toast.success(`Groupement créé · ${g.id}`);
  };

  const handlePayMyShare = () => {
    if (!liveGroup) return;
    const r = payShare(liveGroup.id, me.id);
    if (!r.ok) {
      if (r.deficit) {
        toast.error(`Solde insuffisant - manque ${formatPrice(r.deficit)}`, {
          action: { label: "Recharger", onClick: () => navigate("/wallet") },
        });
      } else {
        toast.error(r.error);
      }
      return;
    }
    toast.success("Part payée · ref " + r.txnId);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#16A34A] to-[#059669] px-4 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 16 }}>
                Achat Groupé
              </h3>
              <p className="text-white/70" style={{ fontSize: 10, fontWeight: 600 }}>
                {step === "config" ? "Configurez votre groupage" : step === "share" ? "Invitez vos proches" : "Suivi en temps réel"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-4 py-2.5 bg-[#F9FAFB] border-b border-border flex items-center gap-1 shrink-0">
          {[
            { key: "config", label: "Config", num: 1 },
            { key: "share", label: "Partager", num: 2 },
            { key: "tracking", label: "Suivi", num: 3 },
          ].map((s, i) => {
            const isActive = s.key === step;
            const steps = ["config", "share", "tracking"];
            const isDone = steps.indexOf(s.key) < steps.indexOf(step);
            return (
              <div key={s.key} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    if (isDone) setStep(s.key as typeof step);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${
                    isActive ? "bg-[#16A34A] text-white" : isDone ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-white text-muted-foreground"
                  }`}
                  style={{ fontSize: 11, fontWeight: 700 }}
                >
                  {isDone ? <CheckCircle className="w-3 h-3" /> : <span>{s.num}</span>}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < 2 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {existing && liveGroup && (
            <div className="bg-[#EFF6FF] border border-[#3B82F6]/30 rounded-xl p-3 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#3B82F6] mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8" }}>
                  Vous avez déjà un groupement ouvert pour ce produit
                </p>
                <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                  {liveGroup.id} · {liveGroup.participants.length}/{liveGroup.maxParticipants} membres - on le réutilise au lieu d'en créer un nouveau.
                </p>
              </div>
            </div>
          )}
          {/* Product recap */}
          <div className="flex items-center gap-3 p-3 bg-[#FFF7ED] rounded-xl border border-[#F97316]/15">
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>{product.name}</h4>
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>{product.seller} · {quantity} {product.unit}</p>
              <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15, color: "#E11D2E" }}>{formatPrice(totalPrice)}</p>
            </div>
          </div>

          {/* ═══════ STEP 1: CONFIG ═══════ */}
          {step === "config" && (
            <>
              <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
                <label className="block" style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                  Nom du groupage
                </label>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full rounded-xl py-2.5 px-3.5 border border-gray-200 bg-white focus:ring-2 focus:outline-none"
                  style={{ fontSize: 13 }}
                />
              </div>

              <div className="bg-white rounded-2xl border border-border p-4">
                <h4 className="flex items-center gap-2 mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                  <Users className="w-4 h-4 text-[#16A34A]" /> Nombre de participants
                </h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-[#F3F4F6] rounded-xl">
                    <button
                      onClick={() => setNumParticipants(Math.max(2, numParticipants - 1))}
                      className="p-3 hover:bg-[#E5E7EB] rounded-l-xl"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center" style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20 }}>
                      {numParticipants}
                    </span>
                    <button
                      onClick={() => setNumParticipants(Math.min(50, numParticipants + 1))}
                      className="p-3 hover:bg-[#E5E7EB] rounded-r-xl"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <p className="text-muted-foreground" style={{ fontSize: 10, fontWeight: 600 }}>Part estimée / pers.</p>
                    <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: "#16A34A" }}>
                      {formatPrice(perPersonShare)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {[2, 3, 5, 10].map(n => (
                    <button
                      key={n}
                      onClick={() => setNumParticipants(n)}
                      className={`px-3 py-1.5 rounded-lg border transition-colors ${numParticipants === n ? "bg-[#16A34A] text-white border-[#16A34A]" : "border-border bg-white text-muted-foreground hover:bg-[#F3F4F6]"}`}
                      style={{ fontSize: 12, fontWeight: 700 }}
                    >
                      {n} pers.
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border p-4">
                <h4 className="flex items-center gap-2 mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                  <Clock className="w-4 h-4 text-[#F97316]" /> Durée d'ouverture
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { h: 24, label: "24h" },
                    { h: 48, label: "48h" },
                    { h: 72, label: "72h" },
                    { h: 168, label: "7j" },
                  ].map((d) => (
                    <button
                      key={d.h}
                      onClick={() => setDurationHours(d.h)}
                      className={`py-2 rounded-lg border ${durationHours === d.h ? "border-[#F97316] bg-[#F97316]/10 text-[#F97316]" : "border-border text-muted-foreground"}`}
                      style={{ fontSize: 12, fontWeight: 700 }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#16A34A]/10 to-[#059669]/10 rounded-2xl p-4 border border-[#16A34A]/20">
                <h4 className="flex items-center gap-2 mb-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}>
                  <Gift className="w-4 h-4 text-[#16A34A]" /> Comment ça marche
                </h4>
                <div className="space-y-2">
                  {[
                    "Le groupement est créé immédiatement avec votre part initiale",
                    "Chaque invité rejoint via un lien ou QR code unique",
                    "Le prix baisse à chaque palier (30 %, 60 %, 100 %)",
                    "Chaque membre règle sa part via IPPOO CASH",
                  ].map((t, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] mt-0.5 shrink-0" />
                      <span style={{ fontSize: 12, color: "#374151" }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={createRealGroup}
                className="w-full py-3.5 bg-gradient-to-r from-[#16A34A] to-[#059669] text-white rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}
              >
                Créer le groupement <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* ═══════ STEP 2: SHARE ═══════ */}
          {step === "share" && liveGroup && (
            <>
              <div className="bg-white rounded-2xl border border-border p-4 text-center">
                <h4 className="mb-1" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                  Code du groupement
                </h4>
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#16A34A]/10 rounded-xl border-2 border-dashed border-[#16A34A]/40 mt-2">
                  <span style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 16, color: "#16A34A", letterSpacing: 2 }}>
                    {liveGroup.id}
                  </span>
                  <button
                    onClick={() => { copyToClipboard(liveGroup.id); toast.success("Code copié"); }}
                    className="p-1.5 rounded-lg hover:bg-[#16A34A]/10"
                  >
                    <Copy className="w-4 h-4 text-[#16A34A]" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border p-4 flex flex-col items-center">
                <h4 className="mb-1 flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                  <QrCode className="w-4 h-4 text-[#16A34A]" /> QR Code d'invitation
                </h4>
                <p className="text-muted-foreground mb-4 text-center" style={{ fontSize: 11 }}>
                  Vos proches scannent pour rejoindre directement
                </p>
                <img src={qrUrl} alt="QR Code" className="w-44 h-44 rounded-xl border border-gray-200 mb-3" />
              </div>

              <div className="bg-white rounded-2xl border border-border p-4">
                <h4 className="flex items-center gap-2 mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                  <Link2 className="w-4 h-4 text-[#3B82F6]" /> Lien d'invitation
                </h4>
                <div className="flex items-center gap-2 bg-[#F3F4F6] rounded-xl px-3 py-2.5">
                  <span className="flex-1 truncate text-muted-foreground" style={{ fontSize: 12 }}>
                    {inviteLink}
                  </span>
                  <button
                    onClick={() => { copyToClipboard(inviteLink); toast.success("Lien copié"); }}
                    className="shrink-0 p-1.5 rounded-lg bg-white border border-border"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(inviteText)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="py-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] flex flex-col items-center gap-1"
                    style={{ fontSize: 11, fontWeight: 700 }}
                  >
                    <WhatsAppIcon size={16} />
                    WhatsApp
                  </a>
                  <a
                    href={`sms:?body=${encodeURIComponent(inviteText)}`}
                    className="py-2.5 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] flex flex-col items-center gap-1"
                    style={{ fontSize: 11, fontWeight: 700 }}
                  >
                    <Phone className="w-4 h-4" />
                    SMS
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent("Rejoignez mon groupage IPPOO")}&body=${encodeURIComponent(inviteText)}`}
                    className="py-2.5 rounded-xl bg-[#F97316]/10 text-[#F97316] flex flex-col items-center gap-1"
                    style={{ fontSize: 11, fontWeight: 700 }}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                </div>
              </div>

              <button
                onClick={() => setStep("tracking")}
                className="w-full py-3.5 bg-gradient-to-r from-[#16A34A] to-[#059669] text-white rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15 }}
              >
                Voir le suivi <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* ═══════ STEP 3: TRACKING ═══════ */}
          {step === "tracking" && liveGroup && (
            <TrackingPanel
              group={liveGroup}
              meId={me.id}
              onPayMyShare={handlePayMyShare}
              onOpenFullPage={() => { onClose(); navigate("/achat-groupe"); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TrackingPanel({
  group, meId, onPayMyShare, onOpenFullPage,
}: { group: Group; meId: string; onPayMyShare: () => void; onOpenFullPage: () => void }) {
  const qty = currentQty(group);
  const price = currentPalierPrice(group);
  const pct = group.targetQty > 0 ? Math.round((qty / group.targetQty) * 100) : 0;
  const totalCollected = group.participants.filter((p) => p.paid).reduce((s, p) => s + p.amount, 0);
  const target = group.targetQty * price;
  const myPart = group.participants.find((p) => p.id === meId);

  return (
    <>
      <div className="bg-white rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" /> Progression
          </h4>
          <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: pct >= 100 ? "#16A34A" : "#F97316" }}>
            {pct}%
          </span>
        </div>
        <div className="w-full h-3 bg-[#F3F4F6] rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, pct)}%`,
              background: pct >= 100 ? "linear-gradient(90deg, #16A34A, #059669)" : "linear-gradient(90deg, #F97316, #E8A817)",
            }}
          />
        </div>
        <div className="flex items-center justify-between" style={{ fontSize: 11 }}>
          <span className="text-muted-foreground">
            Collecté · <span style={{ fontWeight: 700, color: "#16A34A" }}>{formatPrice(totalCollected)}</span>
          </span>
          <span className="text-muted-foreground">
            Objectif · <span style={{ fontWeight: 700 }}>{formatPrice(target)}</span>
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#E8A817]/10 to-[#F0B429]/10 rounded-xl p-3 border border-[#E8A817]/20 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8A817] to-[#F0B429] flex items-center justify-center shrink-0">
          <Crown className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 13, fontWeight: 700 }}>Vous (Organisateur)</p>
          <p className="text-muted-foreground" style={{ fontSize: 11 }}>
            {myPart ? `${myPart.qty} u. · ${formatPrice(myPart.amount)}` : "Aucune part"}
          </p>
        </div>
        {myPart && !myPart.paid && (
          <button
            onClick={onPayMyShare}
            className="px-3 py-1.5 bg-[#16A34A] text-white rounded-lg flex items-center gap-1"
            style={{ fontSize: 11, fontWeight: 700 }}
          >
            <Wallet className="w-3.5 h-3.5" /> Payer
          </button>
        )}
        {myPart?.paid && (
          <span className="px-2 py-1 bg-[#16A34A]/15 text-[#16A34A] rounded-lg flex items-center gap-1" style={{ fontSize: 10, fontWeight: 700 }}>
            <CheckCircle className="w-3 h-3" /> Payé
          </span>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-border p-4">
        <h4 className="mb-3" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
          Participants ({group.participants.length}/{group.maxParticipants})
        </h4>
        {group.participants.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground" style={{ fontSize: 12 }}>
            En attente que vos invités rejoignent…
          </div>
        ) : (
          <div className="space-y-2">
            {group.participants.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 bg-[#F9FAFB] rounded-xl">
                <div className="w-9 h-9 rounded-full bg-[#E2E8F0] flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-[#64748B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>
                    {p.name}{p.id === meId ? " (vous)" : ""}
                  </p>
                  <p className="text-muted-foreground" style={{ fontSize: 10 }}>
                    {p.qty} u. · {formatPrice(p.amount)}
                  </p>
                </div>
                {p.paid ? (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[#16A34A] bg-[#16A34A]/15" style={{ fontSize: 10, fontWeight: 700 }}>
                    <CheckCircle className="w-3 h-3" /> Payé
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[#F97316] bg-[#F97316]/15" style={{ fontSize: 10, fontWeight: 700 }}>
                    <Clock className="w-3 h-3" /> En attente
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {pct < 100 && (
        <div className="bg-[#FFF7ED] rounded-xl p-3 border border-[#F97316]/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#F97316] shrink-0" />
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>
            Continuez à inviter pour atteindre la cible et débloquer le palier suivant.
          </p>
        </div>
      )}

      <button
        onClick={onOpenFullPage}
        className="w-full py-3 rounded-xl border-2 border-[#16A34A] text-[#16A34A] flex items-center justify-center gap-2"
        style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13 }}
      >
        <ExternalLink className="w-4 h-4" /> Ouvrir dans Achat Groupé
      </button>
    </>
  );
}

/* ═══ BUTTON exposé pour la fiche produit ═══ */
interface GroupPurchaseButtonProps {
  variant?: "full" | "compact";
  onClick: () => void;
}

export function GroupPurchaseButton({ variant = "full", onClick }: GroupPurchaseButtonProps) {
  if (variant === "compact") {
    return (
      <button
        onClick={onClick}
        className="p-3 bg-[#16A34A] text-white rounded-xl active:scale-95 transition-transform"
        title="Achat Groupé"
      >
        <Users className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full py-3 rounded-xl border-2 border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center gap-2 active:scale-95 transition-transform"
      style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}
    >
      <Users className="w-5 h-5" /> Achat Groupé, Inviter famille & amis
    </button>
  );
}

export type { GroupPurchaseProduct };
