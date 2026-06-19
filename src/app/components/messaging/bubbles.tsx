import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ShoppingCart, Package, Truck, CreditCard, QrCode, Mic, Play, Pause } from "lucide-react";
import { formatPrice } from "../mock-data";

type ProductPayload = { id?: string | number; name: string; price: number; image: string; moq: string };
type OrderPayload = { id: string; status: string; amount: number; items: number };
type PaymentPayload = { amount: number; method: string; status: string; ref: string };

export function ProductBubble({ product, sender }: { product: ProductPayload; sender: string }) {
  const navigate = useNavigate();
  const isMine = sender === "me";
  return (
    <div className={`rounded-xl overflow-hidden border ${isMine ? "border-white/20" : "border-border"}`} style={{ maxWidth: 260 }}>
      <div className="h-28 overflow-hidden relative">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-white truncate" style={{ fontSize: 12, fontWeight: 700 }}>{product.name}</p>
        </div>
      </div>
      <div className={`px-3 py-2.5 ${isMine ? "bg-white/10" : "bg-[#FEFCE8]"}`}>
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 15, color: isMine ? "#fff" : "#E11D2E" }}>
            {formatPrice(product.price)}
          </span>
          <span className={isMine ? "text-white/60" : "text-muted-foreground"} style={{ fontSize: 10 }}>{product.moq}</span>
        </div>
        <button
          onClick={() => navigate(product.id ? `/produit/${product.id}` : `/explorer?q=${encodeURIComponent(product.name)}`)}
          className={`w-full mt-2 py-1.5 rounded-lg flex items-center justify-center gap-1 ${isMine ? "bg-white/20 text-white" : "bg-[#E11D2E]/10 text-[#E11D2E]"}`}
          style={{ fontSize: 11, fontWeight: 700 }}
        >
          <ShoppingCart className="w-3.5 h-3.5" /> Voir le produit
        </button>
      </div>
    </div>
  );
}

export function OrderBubble({ order, sender }: { order: OrderPayload; sender: string }) {
  const navigate = useNavigate();
  const isMine = sender === "me";
  const statusColors: Record<string, string> = {
    "En préparation": "#F97316", "Livré": "#16A34A", "En transit": "#3B82F6", "Annulé": "#E11D2E",
  };
  const color = statusColors[order.status] || "#6B7280";
  return (
    <div className={`rounded-xl overflow-hidden border ${isMine ? "border-white/20" : "border-border"}`} style={{ maxWidth: 260 }}>
      <div className={`px-3 py-2.5 ${isMine ? "bg-white/10" : "bg-white"}`}>
        <div className="flex items-center gap-2 mb-2">
          <Package className={`w-4 h-4 ${isMine ? "text-white/70" : "text-[#F97316]"}`} />
          <span style={{ fontSize: 12, fontWeight: 700, color: isMine ? "#fff" : "#1A1A2E" }}>{order.id}</span>
          <span className="ml-auto px-2 py-0.5 rounded-full text-white" style={{ fontSize: 9, fontWeight: 700, background: color }}>
            {order.status}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className={isMine ? "text-white/60" : "text-muted-foreground"} style={{ fontSize: 11 }}>{order.items} articles</span>
          <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: isMine ? "#fff" : "#E11D2E" }}>
            {formatPrice(order.amount)}
          </span>
        </div>
        <button
          onClick={() => navigate("/commandes")}
          className={`w-full mt-2 py-1.5 rounded-lg flex items-center justify-center gap-1 ${isMine ? "bg-white/20 text-white" : "bg-[#F97316]/10 text-[#F97316]"}`}
          style={{ fontSize: 11, fontWeight: 700 }}
        >
          <Truck className="w-3.5 h-3.5" /> Suivre la commande
        </button>
      </div>
    </div>
  );
}

export function PaymentBubble({ payment, sender }: { payment: PaymentPayload; sender: string }) {
  const navigate = useNavigate();
  const isMine = sender === "me";
  const isRefund = payment.status === "Remboursé";
  const color = isRefund ? "#16A34A" : payment.status === "En attente" ? "#F97316" : "#16A34A";
  return (
    <div className={`rounded-xl overflow-hidden border ${isMine ? "border-white/20" : "border-border"}`} style={{ maxWidth: 260 }}>
      <div className={`px-3 py-3 ${isMine ? "bg-white/10" : "bg-white"}`}>
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className={`w-4 h-4 ${isMine ? "text-white/70" : "text-[#16A34A]"}`} />
          <span style={{ fontSize: 11, fontWeight: 700, color: isMine ? "#fff" : "#1A1A2E" }}>
            {isRefund ? "Remboursement" : "Demande de paiement"}
          </span>
        </div>
        <p style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 20, color: isMine ? "#fff" : color }}>
          {isRefund ? "+" : ""}{formatPrice(payment.amount)}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className={isMine ? "text-white/60" : "text-muted-foreground"} style={{ fontSize: 10 }}>{payment.method}</span>
          <span className="px-2 py-0.5 rounded-full text-white" style={{ fontSize: 9, fontWeight: 700, background: color }}>
            {payment.status}
          </span>
        </div>
        <p className={`mt-1 ${isMine ? "text-white/50" : "text-muted-foreground"}`} style={{ fontSize: 9 }}>Réf : {payment.ref}</p>
        {payment.status === "En attente" && !isMine && (
          <button
            onClick={() => {
              const qs = new URLSearchParams({
                id: payment.ref,
                amt: String(payment.amount),
                method: payment.method,
              });
              navigate(`/pay?${qs.toString()}`);
            }}
            className="w-full mt-2 py-2 rounded-lg bg-gradient-to-r from-[#00B341] to-[#00875A] text-white flex items-center justify-center gap-1"
            style={{ fontSize: 12, fontWeight: 800, fontFamily: "Poppins" }}
          >
            <QrCode className="w-3.5 h-3.5" /> Payer maintenant
          </button>
        )}
      </div>
    </div>
  );
}

function parseDurationSec(d: string): number {
  const [mm, ss] = d.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(mm) || Number.isNaN(ss)) return 0;
  return mm * 60 + ss;
}

export function VoiceBubble({ duration, sender }: { duration: string; sender: string }) {
  const isMine = sender === "me";
  const totalSec = Math.max(1, parseDurationSec(duration));
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number>(0);

  // Forme d'onde stable (pas de re-shuffle à chaque rerender).
  const bars = useRef<number[]>(Array.from({ length: 24 }, () => Math.random() * 14 + 6));

  useEffect(() => {
    if (!playing) return;
    startedAt.current = Date.now() - elapsed * 1000;
    const id = setInterval(() => {
      const now = (Date.now() - startedAt.current) / 1000;
      if (now >= totalSec) {
        setElapsed(0);
        setPlaying(false);
        clearInterval(id);
      } else {
        setElapsed(now);
      }
    }, 80);
    return () => clearInterval(id);
  }, [playing, totalSec]);

  const progress = elapsed / totalSec;
  const remaining = Math.max(0, totalSec - elapsed);
  const mm = Math.floor(remaining / 60).toString();
  const ss = Math.floor(remaining % 60).toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-2" style={{ minWidth: 180 }}>
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? "Pause" : "Lire le message vocal"}
        className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-95 ${isMine ? "bg-white/20" : "bg-[#E11D2E]/15"}`}
      >
        {playing
          ? <Pause className={`w-4 h-4 ${isMine ? "text-white" : "text-[#E11D2E]"}`} />
          : <Play className={`w-4 h-4 ${isMine ? "text-white" : "text-[#E11D2E]"}`} />}
      </button>
      <div className="flex-1">
        <div className="flex gap-0.5 items-end h-5">
          {bars.current.map((h, i) => {
            const reached = i / bars.current.length <= progress;
            const baseColor = isMine ? "bg-white/30" : "bg-[#E11D2E]/25";
            const activeColor = isMine ? "bg-white" : "bg-[#E11D2E]";
            return (
              <div
                key={i}
                className={`w-1 rounded-full ${reached ? activeColor : baseColor}`}
                style={{ height: h }}
              />
            );
          })}
        </div>
      </div>
      <span className={`tabular-nums ${isMine ? "text-white/70" : "text-muted-foreground"}`} style={{ fontSize: 10 }}>
        {playing ? `${mm}:${ss}` : duration}
      </span>
      <Mic className={`w-3 h-3 ${isMine ? "text-white/50" : "text-muted-foreground"}`} />
    </div>
  );
}
