import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Play, Headphones, Video, Search, Filter, Clock,
  ChevronRight, Star, Eye, Users, ShoppingCart, FileText,
  Globe, Package, Truck, Shield, Share2, ThumbsUp,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const P = "#9333EA";
const PL = "#FAF5FF";
const RED = "#E11D2E";
const GREEN = "#16A34A";
const BLUE = "#3B82F6";
const GOLD = "#E8A817";
const ORANGE = "#F97316";

const IMG = {
  hero: "https://images.unsplash.com/photo-1764664035133-0d2ca12016dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWRlbyUyMHBvZGNhc3QlMjBtZWRpYSUyMGNvbnRlbnQlMjBjcmVhdGlvbiUyMHN0dWRpb3xlbnwxfHx8fDE3NzMzMzA0MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
};

type Tab = "tous" | "videos" | "podcasts";

interface MediaItem {
  id: number;
  type: "video" | "podcast";
  title: string;
  desc: string;
  duration: string;
  views: number;
  theme: string;
  themeColor: string;
  cta: { label: string; path: string };
  thumbnail: string;
}

const themes = [
  { name: "Tous", color: "#6B7280" },
  { name: "Acheter", color: RED },
  { name: "Groupement", color: ORANGE },
  { name: "International", color: BLUE },
  { name: "Qualité", color: GREEN },
  { name: "Livraison", color: "#7C3AED" },
];

const mediaItems: MediaItem[] = [
  {
    id: 1, type: "video", title: "Comment passer une commande sur IPPOO", desc: "Guide pas-à-pas : de la recherche produit au paiement et suivi de livraison.",
    duration: "8:24", views: 3420, theme: "Acheter", themeColor: RED,
    cta: { label: "Explorer le catalogue", path: "/explorer" },
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=225&fit=crop",
  },
  {
    id: 2, type: "video", title: "L'achat groupé expliqué en 5 min", desc: "Créez un groupement, invitez vos proches, et voyez le prix baisser en temps réel.",
    duration: "5:12", views: 5100, theme: "Groupement", themeColor: ORANGE,
    cta: { label: "Créer un groupement", path: "/achat-groupe" },
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=225&fit=crop",
  },
  {
    id: 3, type: "podcast", title: "Le commerce de gros en Afrique, Épisode 1", desc: "Découvrez les enjeux du commerce en gros et comment IPPOO transforme le circuit.",
    duration: "32:15", views: 1890, theme: "Acheter", themeColor: RED,
    cta: { label: "Découvrir les profils", path: "/profils" },
    thumbnail: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=225&fit=crop",
  },
  {
    id: 4, type: "video", title: "Commander depuis l'étranger", desc: "Diaspora : comment commander depuis la France, la Belgique ou le Canada pour une livraison au Bénin.",
    duration: "6:45", views: 2300, theme: "International", themeColor: BLUE,
    cta: { label: "Espace International", path: "/international" },
    thumbnail: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=400&h=225&fit=crop",
  },
  {
    id: 5, type: "video", title: "Contrôle qualité IPPOO : nos standards", desc: "Comment nous vérifions poids, grades, certifications et photos de chaque produit.",
    duration: "7:30", views: 1650, theme: "Qualité", themeColor: GREEN,
    cta: { label: "Voir les cotations", path: "/cotation" },
    thumbnail: "https://images.unsplash.com/photo-1606824722920-4c652a70f348?w=400&h=225&fit=crop",
  },
  {
    id: 6, type: "podcast", title: "Femmes entrepreneuses du marché, Épisode 2", desc: "Portraits de vendeuses qui utilisent IPPOO pour développer leur activité.",
    duration: "28:40", views: 2800, theme: "Acheter", themeColor: RED,
    cta: { label: "Devenir vendeur", path: "/devenir-vendeur" },
    thumbnail: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=225&fit=crop",
  },
  {
    id: 7, type: "video", title: "Livraison & points de retrait expliqués", desc: "Tout comprendre sur les options de livraison : groupée, individuelle, point de retrait.",
    duration: "4:50", views: 1200, theme: "Livraison", themeColor: "#7C3AED",
    cta: { label: "Mes commandes", path: "/commandes" },
    thumbnail: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=400&h=225&fit=crop",
  },
  {
    id: 8, type: "video", title: "Achat groupé du poulet : cas pratique", desc: "Comment un groupe de 20 familles a divisé par 3 le prix du poulet grâce au groupement IPPOO.",
    duration: "6:10", views: 4500, theme: "Groupement", themeColor: ORANGE,
    cta: { label: "Rejoindre un groupement", path: "/achat-groupe" },
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=225&fit=crop",
  },
  {
    id: 9, type: "podcast", title: "Les prix du marché décryptés, Épisode 3", desc: "Pourquoi les prix varient, comment lire la cotation, et quand acheter au meilleur moment.",
    duration: "25:00", views: 1950, theme: "Qualité", themeColor: GREEN,
    cta: { label: "Cotation des prix", path: "/cotation" },
    thumbnail: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=225&fit=crop",
  },
];

export function RessourcesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("tous");
  const [selectedTheme, setSelectedTheme] = useState("Tous");
  const [searchQ, setSearchQ] = useState("");

  const filtered = mediaItems
    .filter(m => activeTab === "tous" || m.type === (activeTab === "videos" ? "video" : "podcast"))
    .filter(m => selectedTheme === "Tous" || m.theme === selectedTheme)
    .filter(m => !searchQ || m.title.toLowerCase().includes(searchQ.toLowerCase()));

  const tabs: { key: Tab; label: string; icon: LucideIcon }[] = [
    { key: "tous", label: "Tous", icon: Play },
    { key: "videos", label: "Vidéos", icon: Video },
    { key: "podcasts", label: "Podcasts", icon: Headphones },
  ];

  return (
    <div className="min-h-screen pb-6" style={{ background: "#FFF7ED" }}>
      <div className="sticky top-0 z-20 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${P}15` }}>
          <Play className="w-4.5 h-4.5" style={{ color: P }} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="truncate" style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "#1A1A2E" }}>Centre de Ressources</h1>
          <p style={{ fontSize: 11, color: "#6B7280" }}>Vidéos, podcasts & guides</p>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ height: 140 }}>
        <ImageWithFallback src={IMG.hero} alt="Ressources" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(147,51,234,0.88), rgba(236,72,153,0.7))" }} />
        <div className="absolute inset-0 flex items-center p-4">
          <div>
            <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20, color: "#FFF", lineHeight: 1.15 }}>Apprenez, comprenez,<br/>achetez mieux</p>
            <p className="mt-1" style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>Contenus pratiques reliés à vos achats</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="px-4 mt-3 grid grid-cols-3 gap-2">
        {[
          { v: `${mediaItems.filter(m => m.type === "video").length}`, l: "Vidéos", icon: Video, color: RED },
          { v: `${mediaItems.filter(m => m.type === "podcast").length}`, l: "Podcasts", icon: Headphones, color: P },
          { v: `${Math.round(mediaItems.reduce((a, m) => a + m.views, 0) / 1000)}K+`, l: "Vues totales", icon: Eye, color: BLUE },
        ].map((s, i) => {
          const SI = s.icon;
          return (
            <div key={i} className="rounded-xl py-2.5 px-2 text-center" style={{ background: "#FFF" }}>
              <SI className="w-4 h-4 mx-auto mb-1" style={{ color: s.color }} />
              <p style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 18, color: s.color }}>{s.v}</p>
              <p style={{ fontSize: 10, color: "#6B7280" }}>{s.l}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => {
          const TI = tab.icon;
          const on = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap shrink-0" style={{ fontSize: 13, fontFamily: "Poppins", fontWeight: on ? 700 : 500, background: on ? P : "#FFF", color: on ? "#FFF" : "#6B7280" }}>
              <TI className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="px-4 mt-3 space-y-3.5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Rechercher un contenu..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:outline-none" style={{ fontSize: 13, background: "#FFF" }} />
        </div>

        {/* Theme filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {themes.map(t => (
            <button key={t.name} onClick={() => setSelectedTheme(t.name)} className="px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0" style={{ fontSize: 12, fontWeight: selectedTheme === t.name ? 700 : 500, background: selectedTheme === t.name ? `${t.color}12` : "#FFF", color: selectedTheme === t.name ? t.color : "#6B7280", border: selectedTheme === t.name ? `2px solid ${t.color}` : "1px solid #E5E7EB" }}>
              {t.name}
            </button>
          ))}
        </div>

        {/* Media list */}
        <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: "#1A1A2E" }}>{filtered.length} contenus</p>

        <div className="space-y-3">
          {filtered.map(m => (
            <div key={m.id} className="rounded-xl overflow-hidden" style={{ background: "#FFF" }}>
              {/* Thumbnail */}
              <div className="relative" style={{ height: 160 }}>
                <ImageWithFallback src={m.thumbnail} alt={m.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)" }} />
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md" style={{ fontSize: 10, fontWeight: 700, color: "#FFF", background: m.type === "video" ? RED : P }}>
                    {m.type === "video" ? "VIDÉO" : "PODCAST"}
                  </span>
                  <span className="px-2 py-0.5 rounded-md" style={{ fontSize: 10, fontWeight: 700, color: "#FFF", background: m.themeColor }}>
                    {m.theme}
                  </span>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70">
                  <span style={{ fontSize: 11, color: "#FFF", fontWeight: 600 }}>{m.duration}</span>
                </div>
                <button onClick={() => toast.info(`Lecture : ${m.title}`)} className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-6 h-6 ml-1" style={{ color: m.type === "video" ? RED : P }} />
                  </div>
                </button>
              </div>

              <div className="p-3.5">
                <p style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14, color: "#1A1A2E", lineHeight: 1.25 }}>{m.title}</p>
                <p className="mt-1" style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.4 }}>{m.desc}</p>

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" style={{ color: "#9CA3AF" }} />
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>{m.views.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" style={{ color: "#9CA3AF" }} />
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>{m.duration}</span>
                  </div>
                  <button onClick={() => toast.success("Partagé !")} className="ml-auto flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />
                  </button>
                  <button onClick={() => toast.success("J'aime !")}>
                    <ThumbsUp className="w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />
                  </button>
                </div>

                {/* CTA */}
                <button onClick={() => navigate(m.cta.path)} className="w-full mt-2.5 py-2 rounded-xl flex items-center justify-center gap-1.5" style={{ background: `${m.themeColor}10`, fontWeight: 700, fontSize: 12, color: m.themeColor }}>
                  {m.cta.label} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
