import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Category, RestaurantDetail } from "../api/types";
import { StoreListSkeleton } from "../components/Skeleton";
import { loc, useI18n } from "../i18n";
import { money } from "../lib/format";
import { useCart } from "../store/cart";
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
  const cart = useCart();

  useEffect(() => {
    api.store().then((s) => {
      setStore(s);
      setLoading(false);
    });
  }, []);

  const cats = store?.categories ?? [];
  const title = store?.name && store.name !== "Do'kon" ? store.name : "AllFoods";

  const open = (c: Category) => {
    haptic("light");
    nav(`/category/${c.id}`);
  };

  return (
    <div className="min-h-full bg-tg-bg">
      {/* ── Orange header (AllFoods) ───────────────────────────── */}
      <div className="sticky top-0 z-20 px-3 pt-2 pb-1 bg-tg-bg">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand text-white rounded-2xl py-3.5 shadow-md shadow-brand/25"
        >
          <h1 className="text-center text-2xl font-extrabold tracking-tight">{title}</h1>
        </motion.div>
      </div>

      {/* ── Category cards ─────────────────────────────────────── */}
      <div className="px-3 pb-4 pt-2">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                {/* sarlavha */}
                <h2 className="absolute bottom-5 left-5 right-16 text-white text-2xl font-bold drop-shadow-md leading-tight">
                  {loc(c, "name", lang)}
                </h2>

                {/* chevron tugma (rasmdagidek o'ng-markazda) */}
                <span className="absolute top-1/2 -translate-y-1/2 right-4 h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white">
                  <ChevronRight size={24} />
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>

      {cart.count() > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-20 inset-x-0 px-4 z-20"
        >
          <button onClick={() => nav("/cart")} className="btn-brand w-full flex justify-between shadow-lg">
            <span>{t.cart} · {cart.count()}</span>
            <span>{money(cart.total())} {t.sum}</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}
