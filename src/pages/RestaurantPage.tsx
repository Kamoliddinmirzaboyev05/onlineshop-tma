import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Product, RestaurantDetail } from "../api/types";
import { loc, useI18n } from "../i18n";
import { money } from "../lib/format";
import { useCart } from "../store/cart";
import { haptic } from "../telegram";

export default function RestaurantPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t, lang } = useI18n();
  const [data, setData] = useState<RestaurantDetail | null>(null);
  const cart = useCart();

  useEffect(() => {
    if (id) api.restaurant(Number(id)).then(setData);
  }, [id]);

  if (!data) return <p className="p-6 text-tg-hint">…</p>;

  const addToCart = (p: Product) => {
    cart.add(p);
    haptic("light");
  };

  return (
    <div>
      <button onClick={() => nav(-1)} className="p-4 text-brand">
        ← {t.restaurants}
      </button>

      <div className="px-4">
        <h1 className="text-2xl font-bold">{data.name}</h1>
        <p className="text-tg-hint text-sm">
          ⭐ {data.rating.toFixed(1)} · {data.avg_delivery_minutes} {t.min} ·{" "}
          {t.min_order}: {money(data.min_order)} {t.sum}
        </p>
      </div>

      {data.categories.map((c) => (
        <section key={c.id} className="mt-5 px-4">
          <h2 className="font-bold text-lg mb-2">{loc(c, "name", lang)}</h2>
          <div className="space-y-3">
            {c.products.map((p) => (
              <div key={p.id} className="card flex items-center">
                <div className="h-20 w-20 bg-brand-light flex items-center justify-center text-2xl shrink-0">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    "🍲"
                  )}
                </div>
                <div className="flex-1 p-3">
                  <h3 className="font-medium">{loc(p, "name", lang)}</h3>
                  <p className="text-sm text-tg-hint line-clamp-1">
                    {loc(p, "description", lang)}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-semibold">{money(p.price)} {t.sum}</span>
                    <button
                      onClick={() => addToCart(p)}
                      className="bg-brand text-white rounded-lg px-3 py-1 text-sm active:scale-95"
                    >
                      + {t.add}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {cart.count() > 0 && (
        <div className="fixed bottom-20 inset-x-0 px-4">
          <button onClick={() => nav("/cart")} className="btn-brand w-full flex justify-between">
            <span>{t.cart} · {cart.count()}</span>
            <span>{money(cart.total())} {t.sum}</span>
          </button>
        </div>
      )}
    </div>
  );
}
