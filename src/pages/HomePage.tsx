import { motion } from "framer-motion";
import { ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Category, RestaurantDetail } from "../api/types";
import { StoreListSkeleton } from "../components/Skeleton";
import { loc, useI18n } from "../i18n";
import { haptic } from "../telegram";

// kartochka fonida rasm bo'lmaganda — har kategoriyaga barqaror gradient
const GRADIENTS = [
  "from-orange-400 to-rose-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-indigo-500",
  "from-fuchsia-400 to-purple-500",
  "from-lime-400 to-green-500",
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const card = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

export default function HomePage() {
  const { t, lang } = useI18n();
  const nav = useNavigate();
  const [store, setStore] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.store().then((s) => {
      setStore(s);
      setLoading(false);
    });
  }, []);

  const cats = useMemo(() => {
    const list = store?.categories ?? [];
    if (!q.trim()) return list;
    const needle = q.trim().toLowerCase();
    return list.filter(
      (c) =>
        c.name_uz.toLowerCase().includes(needle) ||
        c.name_ru.toLowerCase().includes(needle),
    );
  }, [store, q]);

  const open = (c: Category) => {
    haptic("light");
    nav(`/category/${c.id}`);
  };

  return (
    <div className="min-h-full bg-tg-bg">
      {/* ── Orange header (AllFoods) ───────────────────────────── */}
      <div className="sticky top-0 z-20">
        <div className="bg-gradient-to-r from-brand to-brand-dark text-white px-4 pt-3 pb-4 shadow-lg shadow-brand/20 rounded-b-3xl">
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-2xl font-extrabold tracking-tight"
          >
            {store?.name && store.name !== "Do'kon" ? store.name : "AllFoods"}
          </motion.h1>

          <div className="mt-3 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.search}
              className="w-full rounded-2xl bg-white/20 placeholder-white/70 text-white pl-10 pr-4 py-2.5 outline-none focus:bg-white/25 transition"
            />
          </div>
        </div>
      </div>

      {/* ── Category cards ─────────────────────────────────────── */}
      <div className="px-4 py-4">
        {loading ? (
          <StoreListSkeleton />
        ) : cats.length === 0 ? (
          <p className="text-center text-tg-hint py-16">{t.no_categories}</p>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            {cats.map((c, i) => (
              <motion.button
                key={c.id}
                variants={card}
                whileTap={{ scale: 0.97 }}
                onClick={() => open(c)}
                className="relative w-full h-44 rounded-3xl overflow-hidden text-left shadow-md group"
              >
                {/* fon: rasm yoki gradient */}
                {c.image_url ? (
                  <img
                    src={c.image_url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-active:scale-105"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}`} />
                )}

                {/* qoraytiruvchi gradient — matn o'qilishi uchun */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                {/* mahsulotlar soni */}
                <span className="absolute top-3 left-3 text-xs font-medium text-white/95 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
                  {c.products.length} {t.products_n}
                </span>

                {/* sarlavha */}
                <h2 className="absolute bottom-4 left-4 right-16 text-white text-2xl font-bold drop-shadow-md leading-tight">
                  {loc(c, "name", lang)}
                </h2>

                {/* chevron tugma */}
                <span className="absolute bottom-4 right-4 h-11 w-11 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center text-white">
                  <ChevronRight size={24} />
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
