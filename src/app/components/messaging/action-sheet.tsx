import { Camera, Image as ImageIcon, FileText, Package, Receipt, QrCode, MapPin, X } from "lucide-react";
import { motion } from "motion/react";

export function ActionSheet({ onClose, onAction }: { onClose: () => void; onAction: (action: string) => void }) {
  const actions = [
    { icon: Camera, label: "Photo", color: "#E11D2E", key: "camera" },
    { icon: ImageIcon, label: "Galerie", color: "#F97316", key: "gallery" },
    { icon: FileText, label: "Document", color: "#3B82F6", key: "document" },
    { icon: Package, label: "Produit", color: "#16A34A", key: "product" },
    { icon: Receipt, label: "Facture", color: "#6366F1", key: "invoice" },
    { icon: QrCode, label: "QR Pay", color: "#E8A817", key: "qr" },
    { icon: MapPin, label: "Lieu", color: "#EC4899", key: "location" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-full left-0 right-0 mb-2 mx-2 bg-white rounded-2xl border border-border overflow-hidden z-20"
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 12 }}>Envoyer</span>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>
      <div className="grid grid-cols-4 gap-1 p-2.5">
        {actions.map((a) => (
          <button key={a.key} onClick={() => { onAction(a.key); onClose(); }}
            className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-[#FFF7ED] active:scale-95 transition-all">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${a.color}12` }}>
              <a.icon className="w-5 h-5" style={{ color: a.color }} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 600 }}>{a.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
