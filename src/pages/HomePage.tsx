import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Restaurant } from "../api/types";
import { StoreListSkeleton } from "../components/Skeleton";
import { useI18n } from "../i18n";
import { money } from "../lib/format";

export default function HomePage() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [items, setItems] = useState<Restaurant[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => {
      api.restaurants(q || undefined).then((r) => {
        setItems(r);
        setLoading(false);
      });
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  return (
    <div className="p-4">
      <div className="sticky top-0 z-10 -mx-4 px-4 pb-3 pt-2 bg-tg-bg">
        <h1 className="text-2xl font-bold mb-3">All Foods 🍽</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.search}
          className="w-full rounded-xl bg-tg-card px-4 py-3 outline-none"
        />
      </div>

      {loading ? (
        <StoreListSkeleton />
      ) : (
        <div className="space-y-3 mt-2">
          {items.map((r) => (
            <button
              key={r.id}
              onClick={() => nav(`/restaurant/${r.id}`)}
              className="card w-full text-left"
            >
              <div className="h-32 bg-brand-light flex items-center justify-center text-4xl">
                {r.cover_url ? (
                  <img src={r.cover_url} alt={r.name} className="h-full w-full object-cover" />
                ) : (
                  "🍴"
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{r.name}</h3>
                  <span className="text-sm">⭐ {r.rating.toFixed(1)}</span>
                </div>
                <p className="text-sm text-tg-hint">
                  {r.avg_delivery_minutes} {t.min} ·{" "}
                  {r.delivery_fee === 0 ? t.free : `${money(r.delivery_fee)} ${t.sum}`}
                </p>
                {!r.is_open && (
                  <span className="inline-block mt-1 text-xs text-red-500">{t.closed}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
