import { motion } from "framer-motion";
import { ChevronLeft, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Category, Product, RestaurantDetail } from "../api/types";
import { MenuSkeleton } from "../components/Skeleton";
import { loc, useI18n } from "../i18n";
import { money } from "../lib/format";
import { useCart } from "../store/cart";
import { haptic } from "../telegram";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 24 } },
};

export default function CategoryPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t, lang } = useI18n();
  const [store, setStore] = useState<RestaurantDetail | null>(null);
  const cart = useCart();

  useEffect(() => {
    api.store().then(setStore);
  }, []);

  const cat: Category | undefined = useMemo(
    () => store?.categories.find((c) => c.id === Number(id)),
    [store, id],
  );

  if (!store) return <MenuSkeleton />;

  const add = (p: Product) => {
    cart.add(p);
    haptic("light");
  };

  return (
    <div className="min-h-full bg-tg-bg">
      {/* ── Header banner ──────────────────────────────────────── */}
      <div className="relative h-40 overflow-hidden rounded-b-3xl">
        {cat?.image_url ? (
          <img src={cat.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand to-brand-dark" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

        <button
          onClick={() => nav(-1)}
          className="absolute top-3 left-3 h-10 w-10 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition"
        >
          <ChevronLeft size={22} />
        </button>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4 text-white text-2xl font-bold drop-shadow-md"
        >
          {cat ? loc(cat, "name", lang) : t.categories}
        </motion.h1>
      </div>

      {/* ── Products grid ──────────────────────────────────────── */}
      <div className="px-4 py-4 pb-28">
        {!cat || cat.products.length === 0 ? (
          <p className="text-center text-tg-hint py-16">{t.empty_category}</p>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-3"
          >
            {cat.products.map((p) => (
              <motion.div key={p.id} variants={item} className="card flex flex-col">
                <div className="h-28 bg-brand-light flex items-center justify-center text-3xl">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    "🛒"
                  )}
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-medium text-sm leading-tight line-clamp-2">
                    {loc(p, "name", lang)}
                  </h3>
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <span className="font-semibold text-sm">
                      {money(p.price)} {t.sum}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => add(p)}
                      className="h-8 w-8 rounded-full bg-brand text-white flex items-center justify-center shadow-sm"
                    >
                      <Plus size={18} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Floating cart bar ──────────────────────────────────── */}
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
