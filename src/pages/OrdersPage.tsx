import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Order } from "../api/types";
import StatusBadge from "../components/StatusBadge";
import { OrderListSkeleton } from "../components/Skeleton";
import { useI18n } from "../i18n";
import { money } from "../lib/format";

export default function OrdersPage() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.myOrders().then((o) => {
      setOrders(o);
      setLoading(false);
    });
  }, []);

  if (loading) return <OrderListSkeleton />;

  if (orders.length === 0) {
    return (
      <div className="p-10 text-center text-tg-hint">
        <div className="text-5xl mb-3">🧾</div>
        {t.no_orders}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{t.orders}</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <button
            key={o.id}
            onClick={() => nav(`/orders/${o.id}`)}
            className="card p-4 w-full text-left"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">№ {o.number}</span>
              <StatusBadge status={o.status} />
            </div>
            <p className="text-sm text-tg-hint mt-1">
              {o.items.length} ta · {money(o.total)} {t.sum}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
