import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Package,
  Store,
  Users,
  ShoppingBag,
  CreditCard,
  Crown,
  Tag,
  Headphones,
  FileEdit,
  Settings,
  LogOut,
  Bell,
  Search,
  Shield,
  BarChart3,
  FolderTree,
  Banknote,
  FileText,
  ShieldCheck,
  UserCheck,
  Star,
  Scale,
  Megaphone,
  UsersRound,
  X,
} from "lucide-react";
import { useAdmin } from "./useAdmin";
import { logoutAdmin } from "./auth";
import {
  subscribeOps, getOpsSnapshot,
  activeAnnouncements, updateAnnouncement,
  type AnnouncementLevel,
} from "./admin-ops-store";
import { getState as getPaymentsState, subscribe as subscribePayments, SERVER_SNAPSHOT as PAYMENTS_SNAPSHOT } from "../payments/store";
import { subscribePublicProducts, getPublicProducts } from "../data/public-products";
import { subscribeVendorGroups, getVendorGroupsSnapshot, listAllVendorGroups } from "../data/vendor-groups";

const NAV = [
  { to: "/admin", end: true, label: "Tableau de bord", Icon: LayoutDashboard },
  { to: "/admin/analytics", label: "Analytics", Icon: BarChart3 },
  { to: "/admin/commandes", label: "Commandes", Icon: ShoppingBag },
  { to: "/admin/produits", label: "Produits", Icon: Package },
  { to: "/admin/moderation", label: "Modération produits", Icon: ShieldCheck },
  { to: "/admin/categories", label: "Catégories", Icon: FolderTree },
  { to: "/admin/vendeurs", label: "Vendeurs", Icon: Store },
  { to: "/admin/groupements-vendeurs", label: "Groupements vendeurs", Icon: UsersRound },
  { to: "/admin/utilisateurs", label: "Utilisateurs", Icon: Users },
  { to: "/admin/abonnements", label: "Abonnements", Icon: Crown },
  { to: "/admin/transactions", label: "Transactions", Icon: CreditCard },
  { to: "/admin/reversements", label: "Reversements", Icon: Banknote },
  { to: "/admin/comptabilite", label: "Comptabilité", Icon: FileText },
  { to: "/admin/escrow", label: "Paiements protégés", Icon: ShieldCheck },
  { to: "/admin/kyc", label: "KYC", Icon: UserCheck },
  { to: "/admin/litiges", label: "Litiges & remboursements", Icon: Scale },
  { to: "/admin/promos", label: "Codes promo", Icon: Tag },
  { to: "/admin/avis", label: "Avis", Icon: Star },
  { to: "/admin/support", label: "Support / SAV", Icon: Headphones },
  { to: "/admin/annonces", label: "Annonces", Icon: Megaphone },
  { to: "/admin/contenus", label: "Contenus", Icon: FileEdit },
  { to: "/admin/equipe", label: "Équipe & rôles", Icon: UsersRound },
  { to: "/admin/audit", label: "Journal d'audit", Icon: FileText },
  { to: "/admin/parametres", label: "Paramètres", Icon: Settings },
];

const LEVEL_BG: Record<AnnouncementLevel, string> = {
  info: "#3B82F6",
  success: "#16A34A",
  warning: "#F0B429",
  critical: "#E11D2E",
};

export function AdminLayout() {
  const navigate = useNavigate();
  const admin = useAdmin();
  useSyncExternalStore(subscribeOps, getOpsSnapshot, getOpsSnapshot);
  useSyncExternalStore(subscribePayments, () => getPaymentsState(), () => PAYMENTS_SNAPSHOT);
  const openTickets = admin.tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;
  const pendingVendors = admin.vendors.filter((v) => v.status === "pending").length;
  const pendingKyc = admin.users.filter((u) => u.kyc === "pending").length;
  const outOfStock = admin.products.filter((p) => p.stock === 0).length;
  const openDisputes = getPaymentsState().orders.filter((o) => o.dispute && o.dispute.status === "open").length;
  useSyncExternalStore(subscribePublicProducts, () => getPublicProducts().length, () => 0);
  const pendingModeration = getPublicProducts().filter((p) => (p.moderation ?? "pending") === "pending").length;
  useSyncExternalStore(subscribeVendorGroups, getVendorGroupsSnapshot, getVendorGroupsSnapshot);
  const pendingVendorGroups = listAllVendorGroups().filter((g) => g.moderation === "pending" && g.status !== "archived").length;
  const banners = activeAnnouncements("admin");

  const [search, setSearch] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notifOpen) return;
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [notifOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    const lower = q.toLowerCase();
    if (admin.products.some((p) => p.id.toLowerCase() === lower || p.name.toLowerCase().includes(lower))) navigate("/admin/produits");
    else if (admin.vendors.some((v) => v.id.toLowerCase() === lower || v.name.toLowerCase().includes(lower))) navigate("/admin/vendeurs");
    else if (admin.users.some((u) => u.email.toLowerCase().includes(lower) || u.name.toLowerCase().includes(lower))) navigate("/admin/utilisateurs");
    else if (admin.tickets.some((t) => t.id.toLowerCase() === lower || t.subject.toLowerCase().includes(lower))) navigate("/admin/support");
    else navigate("/admin/commandes");
  };

  const notifs: { label: string; color: string; to: string; count: number }[] = [
    { label: "Vendeurs en attente", color: "#F0B429", to: "/admin/vendeurs", count: pendingVendors },
    { label: "Tickets ouverts", color: "#E11D2E", to: "/admin/support", count: openTickets },
    { label: "KYC à vérifier", color: "#3B82F6", to: "/admin/kyc", count: pendingKyc },
    { label: "Produits en rupture", color: "#F97316", to: "/admin/produits", count: outOfStock },
    { label: "Litiges à arbitrer", color: "#E11D2E", to: "/admin/litiges", count: openDisputes },
    { label: "Produits à modérer", color: "#F0B429", to: "/admin/moderation", count: pendingModeration },
    { label: "Groupements à valider", color: "#F0B429", to: "/admin/groupements-vendeurs", count: pendingVendorGroups },
  ].filter((n) => n.count > 0);

  return (
    <div className="min-h-screen flex bg-[#F7F8FA]">
      <aside className="w-60 shrink-0 bg-[#0F172A] text-white flex flex-col sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6A00] to-[#FF4400] flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>IPPOO Admin</p>
            <p className="text-white/50" style={{ fontSize: 10 }}>Back-office v1.3</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.map(({ to, end, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `mx-2 my-0.5 flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`
              }
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {label === "Support / SAV" && openTickets > 0 && (
                <span className="px-1.5 rounded-full bg-[#E11D2E] text-white" style={{ fontSize: 10, fontWeight: 800 }}>
                  {openTickets}
                </span>
              )}
              {label === "Vendeurs" && pendingVendors > 0 && (
                <span className="px-1.5 rounded-full bg-[#F0B429] text-[#0F172A]" style={{ fontSize: 10, fontWeight: 800 }}>
                  {pendingVendors}
                </span>
              )}
              {label === "Litiges & remboursements" && openDisputes > 0 && (
                <span className="px-1.5 rounded-full bg-[#E11D2E] text-white" style={{ fontSize: 10, fontWeight: 800 }}>
                  {openDisputes}
                </span>
              )}
              {label === "Modération produits" && pendingModeration > 0 && (
                <span className="px-1.5 rounded-full bg-[#F0B429] text-[#0F172A]" style={{ fontSize: 10, fontWeight: 800 }}>
                  {pendingModeration}
                </span>
              )}
              {label === "Groupements vendeurs" && pendingVendorGroups > 0 && (
                <span className="px-1.5 rounded-full bg-[#F0B429] text-[#0F172A]" style={{ fontSize: 10, fontWeight: 800 }}>
                  {pendingVendorGroups}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="m-3 space-y-1">
          <button
            onClick={() => { logoutAdmin(); navigate("/admin"); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/70 hover:bg-white/5 hover:text-white"
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:bg-white/5 hover:text-white"
            style={{ fontSize: 12 }}
          >
            ← Marketplace
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-border px-6 py-3 flex items-center gap-3">
          <form onSubmit={submitSearch} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher commande, utilisateur, produit…"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted border border-transparent focus:border-border focus:bg-white outline-none"
              style={{ fontSize: 13 }}
            />
          </form>
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative p-2 rounded-lg hover:bg-muted"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {notifs.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E11D2E]" />
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-border shadow-lg overflow-hidden z-30">
                <div className="px-4 py-3 border-b border-border" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14 }}>
                  Notifications
                </div>
                {notifs.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground" style={{ fontSize: 13 }}>
                    Tout est à jour 🎉
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {notifs.map((n) => (
                      <button
                        key={n.label}
                        onClick={() => { setNotifOpen(false); navigate(n.to); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left border-b border-[#F3F4F6] last:border-0"
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: n.color }} />
                        <span className="flex-1" style={{ fontSize: 13 }}>{n.label}</span>
                        <span className="px-2 py-0.5 rounded-md" style={{ fontSize: 11, fontWeight: 800, color: n.color, background: n.color + "1A" }}>
                          {n.count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
        </header>
        {banners.length > 0 && (
          <div className="space-y-1.5 px-6 pt-3">
            {banners.map((b) => (
              <div
                key={b.id}
                className="rounded-xl px-4 py-2.5 flex items-start gap-3"
                style={{ background: `${LEVEL_BG[b.level]}14`, borderLeft: `3px solid ${LEVEL_BG[b.level]}` }}
              >
                <Megaphone className="w-4 h-4 mt-0.5 shrink-0" style={{ color: LEVEL_BG[b.level] }} />
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 13, color: LEVEL_BG[b.level] }}>{b.title}</p>
                  <p className="text-foreground/80" style={{ fontSize: 12 }}>{b.body}</p>
                </div>
                <button
                  onClick={() => updateAnnouncement(b.id, { active: false })}
                  className="p-1 rounded-md hover:bg-black/5 text-muted-foreground shrink-0"
                  title="Masquer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
