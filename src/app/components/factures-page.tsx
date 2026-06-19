import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { FileText, Download, Search, Filter, Eye, ChevronRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "./mock-data";
import { usePayments } from "../payments/usePayments";

export function FacturesPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { invoices: realInvoices } = usePayments();

  const merged = useMemo(() => realInvoices.map((i) => ({
    id: i.id,
    date: i.date,
    type: "Achat",
    seller: i.vendorRefs?.[0]?.vendorName ?? "IPPOO Market",
    total: i.total,
    status: i.status === "paid" ? "Payée" : "En attente",
    color: i.status === "paid" ? "#16A34A" : "#F97316",
  })), [realInvoices]);

  const filtered = merged
    .filter((f) => filter === "all" || (filter === "achat" && f.type === "Achat") || (filter === "avoir" && f.type === "Avoir") || (filter === "payee" && f.status === "Payée"))
    .filter((f) => f.id.toLowerCase().includes(search.toLowerCase()) || f.seller.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="bg-gradient-to-r from-[#00B341] to-[#00875A] px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/70 mb-3 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Retour</span>
          </button>
          <h1 className="text-white flex items-center gap-2" style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 22 }}>
            <FileText className="w-6 h-6" /> FACTURES & DOCUMENTS
          </h1>
          <p className="text-white/80 mt-1" style={{ fontSize: 13 }}>Factures d'achat, avoirs, exports comptables</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Rechercher une facture..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-border" style={{ fontSize: 13 }} />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {[
            { key: "all", label: "Toutes" },
            { key: "achat", label: "Factures" },
            { key: "avoir", label: "Avoirs" },
            { key: "payee", label: "Payées" },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`shrink-0 px-4 py-2 rounded-xl border transition-all ${filter === tab.key ? "bg-[#00B341] text-white border-[#00B341]" : "bg-white text-foreground border-border"}`}
              style={{ fontSize: 12, fontWeight: 600 }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((inv) => (
            <div key={inv.id} className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>{inv.id}</p>
                  <p className="text-muted-foreground" style={{ fontSize: 11 }}>{inv.date} · {inv.seller}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg" style={{ fontSize: 11, fontWeight: 700, color: inv.color, background: `${inv.color}15` }}>
                  {inv.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#F3F4F6]" style={{ fontSize: 10, fontWeight: 600 }}>{inv.type}</span>
                  <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 15, color: "#E11D2E" }}>{formatPrice(inv.total)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => navigate(`/facture/${inv.id}`)} className="p-2 hover:bg-muted rounded-lg" title="Ouvrir la facture détaillée">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => navigate(`/facture/${inv.id}`)} className="p-2 hover:bg-muted rounded-lg" title="Imprimer / télécharger">
                    <Download className="w-4 h-4 text-[#16A34A]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>Aucune facture</h3>
          </div>
        )}

        <button onClick={() => toast.success("Export comptable téléchargé !")} className="w-full mt-4 py-3 border border-border rounded-xl flex items-center justify-center gap-2 bg-white" style={{ fontSize: 13, fontWeight: 600 }}>
          <Download className="w-4 h-4" /> Export comptable (Excel)
        </button>
      </div>
    </div>
  );
}