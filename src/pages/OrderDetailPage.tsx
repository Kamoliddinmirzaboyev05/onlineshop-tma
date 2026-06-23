import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Order } from "../api/types";
import StatusBadge from "../components/StatusBadge";
import { OrderDetailSkeleton } from "../components/Skeleton";
import { loc, useI18n } from "../i18n";
import { money } from "../lib/format";

const STEPS = ["pending", "confirmed", "preparing", "delivering", "delivered"] as const;

export default function OrderDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t, lang } = useI18n();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = () => api.order(Number(id)).then(setOrder);
    load();
    const iv = setInterval(load, 10000); // poll status
    return () => clearInterval(iv);
  }, [id]);

  if (!order) return <OrderDetailSkeleton />;

  const stepIdx = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  return (
    <div className="p-4">
      <button onClick={() => nav("/orders")} className="text-brand mb-3">← {t.orders}</button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">№ {order.number}</h1>
        <StatusBadge status={order.status} />
      </div>

      {order.status !== "cancelled" && (
        <div className="flex justify-between mt-5 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                  i <= stepIdx ? "bg-brand text-white" : "bg-tg-card text-tg-hint"
                }`}
              >
                {i + 1}
              </div>
              <span className="text-[10px] text-tg-hint mt-1 text-center">{t.status[s]}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card p-4 space-y-2">
        {order.items.map((it) => (
          <div key={it.id} className="flex justify-between text-sm">
            <span>{loc(it, "name", lang)} × {it.quantity}</span>
            <span>{money(it.price * it.quantity)} {t.sum}</span>
          </div>
        ))}
        <hr className="border-black/10" />
        <div className="flex justify-between text-sm text-tg-hint">
          <span>{t.delivery}</span>
          <span>{order.delivery_fee === 0 ? t.free : `${money(order.delivery_fee)} ${t.sum}`}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>{t.total}</span>
          <span>{money(order.total)} {t.sum}</span>
        </div>
      </div>

      <div className="mt-4 text-sm text-tg-hint">
        <p>📍 {order.address_line}</p>
        {order.phone && <p>📱 {order.phone}</p>}
      </div>
    </div>
  );
}
