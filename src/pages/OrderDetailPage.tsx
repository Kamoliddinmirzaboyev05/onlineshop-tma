import { CheckCircle2, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Order } from "../api/types";
import StatusBadge from "../components/StatusBadge";
import { OrderDetailSkeleton } from "../components/Skeleton";
import ErrorState from "../components/ErrorState";
import { loc, useI18n } from "../i18n";
import { money } from "../lib/format";

const STEPS = ["pending", "confirmed", "preparing", "ready", "delivering", "delivered"] as const;
const TERMINAL = new Set(["delivered", "cancelled"]);

export default function OrderDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t, lang } = useI18n();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const confirm = async () => {
    if (!order) return;
    setConfirming(true);
    try {
      const o = await api.confirmOrder(order.id);
      setOrder(o);
    } catch {
      setError(true);
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    let iv: ReturnType<typeof setInterval> | undefined;
    const load = () =>
      api
        .order(Number(id))
        .then((o) => {
          setOrder(o);
          setError(false);
          // stop polling once the order reaches a terminal status
          if (iv && TERMINAL.has(o.status)) clearInterval(iv);
        })
        .catch(() => setError(true));
    load();
    iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [id]);

  useEffect(() => {
    if (!showReceipt) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowReceipt(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showReceipt]);

  if (error && !order) return <ErrorState onRetry={() => window.location.reload()} />;
  if (!order) return <OrderDetailSkeleton />;

  const stepIdx = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const isDelivered = order.status === "delivered";

  return (
    <div className="p-4 pb-8">
      <button onClick={() => nav("/orders")} className="text-brand mb-3">← {t.orders}</button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">№ {order.number}</h1>
        <StatusBadge status={order.status} />
      </div>

      {/* Progress bar */}
      {order.status !== "cancelled" && (
        <div className="flex justify-between mt-5 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  i <= stepIdx ? "bg-brand text-white" : "bg-tg-card text-tg-hint"
                }`}
              >
                {i < stepIdx ? "✓" : i + 1}
              </div>
              <span className="text-[10px] text-tg-hint mt-1 text-center leading-tight">{t.status[s]}</span>
            </div>
          ))}
        </div>
      )}

      {/* Items */}
      <div className="card p-4 space-y-3">
        {order.items.map((it) => (
          <div key={it.id} className="flex items-center gap-3 text-sm">
            {it.image_url ? (
              <img src={it.image_url} alt="" className="h-12 w-12 rounded-xl object-cover bg-tg-card shrink-0" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-tg-card flex items-center justify-center text-lg shrink-0">🍽</div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{loc(it, "name", lang)}</div>
              <div className="text-xs text-tg-hint">{it.quantity} × {money(it.price)} {t.sum}</div>
            </div>
            <span className="font-semibold shrink-0">{money(it.price * it.quantity)} {t.sum}</span>
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

      <div className="mt-4 text-sm text-tg-hint space-y-1">
        <p>📍 {order.address_line}</p>
        {order.phone && <p>📱 {order.phone}</p>}
        {order.comment && <p>💬 {order.comment}</p>}
        <p className="text-xs">{new Date(order.created_at).toLocaleString()}</p>
      </div>

      {/* Kuryer yetkazdi — mijoz tasdig'i so'raladi */}
      {order.courier_delivered_at && !isDelivered && (
        <div className="mt-5 rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-4 text-center">
          <p className="font-semibold text-emerald-800">
            {lang === "uz"
              ? "Kuryer buyurtmangizni yetkazdi 🛵"
              : "Курьер доставил ваш заказ 🛵"}
          </p>
          <p className="text-sm text-emerald-700 mt-0.5 mb-3">
            {lang === "uz"
              ? "Qabul qilganingizni tasdiqlang"
              : "Подтвердите получение"}
          </p>
          <button
            onClick={confirm}
            disabled={confirming}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-60"
          >
            {confirming ? "…" : (lang === "uz" ? "✓ Qabul qildim" : "✓ Получил")}
          </button>
        </div>
      )}

      {/* Receipt button */}
      <button
        onClick={() => setShowReceipt(true)}
        className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm text-tg-hint hover:bg-tg-card transition"
      >
        <Printer size={16} />
        {lang === "uz" ? "Chekni ko'rish" : "Посмотреть чек"}
      </button>

      {/* Delivered celebration */}
      {isDelivered && (
        <div className="mt-5 flex flex-col items-center gap-2 text-center">
          <CheckCircle2 size={40} className="text-emerald-500" />
          <p className="font-semibold text-emerald-700">
            {lang === "uz" ? "Buyurtma yetkazildi!" : "Заказ доставлен!"}
          </p>
          <button onClick={() => nav("/")} className="btn-brand mt-1">
            {lang === "uz" ? "Bosh sahifaga" : "На главную"}
          </button>
        </div>
      )}

      {/* ── RECEIPT MODAL ─────────────────────────────────── */}
      {showReceipt && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center z-50"
          onClick={() => setShowReceipt(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-t-3xl p-6 pb-8 shadow-2xl"
          >
            {/* Receipt header */}
            <div className="text-center mb-5">
              <div className="text-2xl font-black tracking-tight">All Foods</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {new Date(order.created_at).toLocaleString()}
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-600">
                {lang === "uz" ? "Buyurtma" : "Заказ"} № {order.number}
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-4 space-y-2.5">
              {order.items.map((it) => (
                <div key={it.id} className="flex items-center gap-2.5 text-sm">
                  {it.image_url ? (
                    <img src={it.image_url} alt="" className="h-10 w-10 rounded-lg object-cover bg-slate-100 shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">🍽</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{loc(it, "name", lang)}</div>
                    <div className="text-xs text-slate-400">
                      {it.quantity} × {money(it.price)} {t.sum}
                    </div>
                  </div>
                  <div className="font-semibold text-right shrink-0">
                    {money(it.price * it.quantity)} {t.sum}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-200 mt-4 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm text-slate-500">
                <span>{lang === "uz" ? "Mahsulotlar" : "Товары"}</span>
                <span>{money(order.items_total)} {t.sum}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>{t.delivery}</span>
                <span>{order.delivery_fee === 0 ? t.free : `${money(order.delivery_fee)} ${t.sum}`}</span>
              </div>
            </div>

            <div className="border-t-2 border-slate-900 mt-3 pt-3 flex justify-between">
              <span className="font-black text-lg">{t.total}</span>
              <span className="font-black text-lg">{money(order.total)} {t.sum}</span>
            </div>

            <div className="mt-4 text-xs text-center text-slate-400">
              📍 {order.address_line}
            </div>

            <div className="mt-1 text-xs text-center text-slate-400">
              {lang === "uz"
                ? "Xaridingiz uchun rahmat! 🙏"
                : "Спасибо за покупку! 🙏"}
            </div>

            <button
              onClick={() => setShowReceipt(false)}
              className="mt-5 w-full py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm"
            >
              {lang === "uz" ? "Yopish" : "Закрыть"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
