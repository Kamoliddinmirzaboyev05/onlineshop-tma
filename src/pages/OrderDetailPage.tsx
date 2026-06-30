import { Check, CheckCircle2, Printer, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Order, RestaurantDetail } from "../api/types";
import StatusBadge from "../components/StatusBadge";
import { OrderDetailSkeleton } from "../components/Skeleton";
import ErrorState from "../components/ErrorState";
import { loc, useI18n } from "../i18n";
import { money, qtyUnit } from "../lib/format";

const STAGES = ["confirmed", "delivering", "delivered"] as const;
const TERMINAL = new Set(["delivered", "cancelled"]);

/** 8 ta ichki holatni 3 ko'rinadigan bosqichga siqamiz. */
function stageIndex(status: string): number {
  if (status === "delivered") return 2;
  if (status === "delivering") return 1;
  return 0; // pending, confirmed, preparing, ready, accepted
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t, lang } = useI18n();
  const [order, setOrder] = useState<Order | null>(null);
  const [store, setStore] = useState<RestaurantDetail | null>(null);
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
    api.store().then(setStore).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    let iv: ReturnType<typeof setInterval> | undefined;
    const load = () =>
      api
        .order(Number(id))
        .then((o) => {
          setOrder(o);
          setError(false);
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

  const curStage = stageIndex(order.status);
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";
  const payLabel = order.payment_method === "card" ? t.pay_card : t.pay_cash;

  return (
    <div className="p-4 pb-8">
      <button onClick={() => nav("/orders")} className="text-brand mb-3">← {t.orders}</button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">№ {order.number}</h1>
        <StatusBadge status={order.status} />
      </div>

      {/* 3-bosqichli progress */}
      {isCancelled ? (
        <div className="mt-4 mb-5 flex items-center gap-2 rounded-2xl bg-red-50 text-red-600 px-4 py-3">
          <XCircle size={20} />
          <span className="font-semibold">{t.cancelled_note}</span>
        </div>
      ) : (
        <div className="mt-6 mb-7 flex items-start">
          {STAGES.map((s, i) => {
            const done = i < curStage;
            const active = i === curStage;
            return (
              <div key={s} className="flex-1 flex flex-col items-center relative">
                {/* ulagich chiziq (chapdan) */}
                {i > 0 && (
                  <span
                    className={`absolute top-4 right-1/2 w-full h-0.5 -z-0 ${
                      i <= curStage ? "bg-brand" : "bg-tg-card"
                    }`}
                  />
                )}
                <div
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                    done || active ? "bg-brand text-white" : "bg-tg-card text-tg-hint"
                  } ${active ? "ring-4 ring-brand/20" : ""}`}
                >
                  {done ? <Check size={16} /> : i + 1}
                </div>
                <span
                  className={`text-[11px] mt-1.5 text-center leading-tight ${
                    i <= curStage ? "text-tg-text font-medium" : "text-tg-hint"
                  }`}
                >
                  {t.stages[s]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Mahsulotlar */}
      <div className="card p-4 space-y-3">
        {order.items.map((it) => (
          <div key={it.id} className="flex items-start gap-3 text-sm">
            {it.image_url ? (
              <img src={it.image_url} alt="" className="h-12 w-12 rounded-xl object-cover bg-tg-card shrink-0" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-tg-card flex items-center justify-center text-lg shrink-0">🍽</div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{loc(it, "name", lang)}</div>
              <div className="text-xs text-tg-hint">
                {qtyUnit(it.quantity, it.unit, lang)} × {money(it.price)} {t.sum}
              </div>
              {it.note && (
                <div className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2 py-1 mt-1 flex items-center gap-1">
                  💬 {it.note}
                </div>
              )}
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

      {/* Masofa + taxminiy yetkazib berish vaqti */}
      {(order.distance_km != null || order.eta_minutes != null) && (
        <div className="mt-4 flex gap-3">
          {order.distance_km != null && (
            <div className="flex-1 card px-3 py-2.5 text-center">
              <div className="text-xs text-tg-hint">{lang === "uz" ? "Masofa" : "Расстояние"}</div>
              <div className="font-bold text-sm mt-0.5">
                {order.distance_km < 1
                  ? `${Math.round(order.distance_km * 1000)} m`
                  : `${order.distance_km.toFixed(1)} km`}
              </div>
            </div>
          )}
          {order.eta_minutes != null && (
            <div className="flex-1 card px-3 py-2.5 text-center">
              <div className="text-xs text-tg-hint">{lang === "uz" ? "Taxminiy vaqt" : "Время"}</div>
              <div className="font-bold text-sm mt-0.5 text-brand">~{order.eta_minutes} {t.min}</div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-sm text-tg-hint space-y-1">
        <p>📍 {order.address_line}</p>
        {order.phone && <p>📱 {order.phone}</p>}
        <p>💳 {payLabel}</p>
        {order.comment && <p>💬 {order.comment}</p>}
        <p className="text-xs">{new Date(order.created_at).toLocaleString()}</p>
      </div>

      {/* Kuryer yetkazdi — mijoz tasdig'i so'raladi */}
      {order.courier_delivered_at && !isDelivered && (
        <div className="mt-5 rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-4 text-center">
          <p className="font-semibold text-emerald-800">
            {lang === "uz" ? "Kuryer buyurtmangizni yetkazdi 🛵" : "Курьер доставил ваш заказ 🛵"}
          </p>
          <p className="text-sm text-emerald-700 mt-0.5 mb-3">
            {lang === "uz" ? "Qabul qilganingizni tasdiqlang" : "Подтвердите получение"}
          </p>
          <button
            onClick={confirm}
            disabled={confirming}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-60"
          >
            {confirming ? "…" : lang === "uz" ? "✓ Qabul qildim" : "✓ Получил"}
          </button>
        </div>
      )}

      {/* Chekni ko'rish */}
      <button
        onClick={() => setShowReceipt(true)}
        className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm text-tg-hint hover:bg-tg-card transition"
      >
        <Printer size={16} />
        {t.view_receipt}
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
            className="bg-white w-full max-w-sm rounded-t-3xl p-6 pb-8 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header — do'kon ma'lumoti */}
            <div className="text-center mb-4">
              <div className="text-2xl font-black tracking-tight">{store?.name || "All Foods"}</div>
              {store?.address && <div className="text-xs text-slate-400 mt-1">📍 {store.address}</div>}
              {store?.phones?.[0] && <div className="text-xs text-slate-400">📱 {store.phones[0]}</div>}
            </div>

            {/* Meta */}
            <div className="border-t border-dashed border-slate-200 pt-3 text-xs text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>{t.order} №</span>
                <span className="font-semibold text-slate-700">{order.number}</span>
              </div>
              <div className="flex justify-between">
                <span>{lang === "uz" ? "Sana" : "Дата"}</span>
                <span>{new Date(order.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>{lang === "uz" ? "Holat" : "Статус"}</span>
                <span>{t.status[order.status]}</span>
              </div>
            </div>

            {/* Mahsulotlar */}
            <div className="border-t border-dashed border-slate-200 mt-3 pt-3 space-y-2.5">
              {order.items.map((it) => (
                <div key={it.id} className="flex items-start gap-2.5 text-sm">
                  {it.image_url ? (
                    <img src={it.image_url} alt="" className="h-10 w-10 rounded-lg object-cover bg-slate-100 shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">🍽</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{loc(it, "name", lang)}</div>
                    <div className="text-xs text-slate-400">
                      {qtyUnit(it.quantity, it.unit, lang)} × {money(it.price)} {t.sum}
                    </div>
                    {it.note && <div className="text-[10px] text-amber-700 mt-0.5">💬 {it.note}</div>}
                  </div>
                  <div className="font-semibold text-right shrink-0">
                    {money(it.price * it.quantity)} {t.sum}
                  </div>
                </div>
              ))}
            </div>

            {/* Yig'indilar */}
            <div className="border-t border-dashed border-slate-200 mt-4 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm text-slate-500">
                <span>{t.items_label}</span>
                <span>{money(order.items_total)} {t.sum}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>{t.delivery}</span>
                <span>{order.delivery_fee === 0 ? t.free : `${money(order.delivery_fee)} ${t.sum}`}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>{t.payment}</span>
                <span>{payLabel}</span>
              </div>
            </div>

            <div className="border-t-2 border-slate-900 mt-3 pt-3 flex justify-between">
              <span className="font-black text-lg">{t.total}</span>
              <span className="font-black text-lg">{money(order.total)} {t.sum}</span>
            </div>

            {/* Yetkazish manzili */}
            <div className="mt-4 text-xs text-slate-400 space-y-0.5">
              <div>📍 {order.address_line}</div>
              {order.phone && <div>📱 {order.phone}</div>}
            </div>

            <div className="mt-3 text-xs text-center text-slate-400">{t.thank_you}</div>

            <button
              onClick={() => setShowReceipt(false)}
              className="mt-5 w-full py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
