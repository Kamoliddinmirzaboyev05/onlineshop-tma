import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import LocationPicker from "../components/LocationPicker";
import { useI18n } from "../i18n";
import { money } from "../lib/format";
import { useAuth } from "../store/auth";
import { useCart } from "../store/cart";
import { haptic } from "../telegram";

/** Backend xato matnini ({"detail": "..."}) ajratib oladi. */
function errorText(e: unknown): string {
  const raw = String(e);
  const m = raw.match(/\{.*\}/s);
  if (m) {
    try {
      const d = JSON.parse(m[0]).detail;
      if (typeof d === "string") return d;
    } catch {
      /* ignore */
    }
  }
  return raw;
}

export default function CheckoutPage() {
  const { t, lang } = useI18n();
  const nav = useNavigate();
  const cart = useCart();
  const user = useAuth((s) => s.user);

  const [phone, setPhone] = useState(user?.phone ?? "");
  const [comment, setComment] = useState("");
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lines = Object.values(cart.lines);

  const submit = async () => {
    if (cart.restaurantId == null) {
      setError(lang === "uz" ? "Savatcha bo'sh" : "Корзина пуста");
      return;
    }
    if (!phone.trim()) {
      setError(lang === "uz" ? "Telefon raqamini kiriting" : "Введите номер телефона");
      return;
    }
    if (!loc) {
      setError(lang === "uz" ? "Joylashuvga ruxsat bering yoki xaritada belgilang" : "Разрешите геолокацию или отметьте на карте");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // Manzil yozilmaydi — joylashuv yuboriladi, server koordinatadan manzilni oladi.
      const order = await api.placeOrder({
        restaurant_id: cart.restaurantId,
        items: lines.map((l) => ({ product_id: l.product.id, quantity: l.quantity })),
        lat: loc.lat,
        lng: loc.lng,
        phone,
        comment,
        payment_method: "cash",
      });
      haptic("medium");
      cart.clear();
      nav(`/orders/${order.id}`, { replace: true });
    } catch (e) {
      setError(errorText(e));
      setSubmitting(false);
    }
  };

  if (lines.length === 0) {
    return <div className="p-10 text-center text-tg-hint">{t.cart_empty}</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">{t.checkout}</h1>

      <div>
        <label className="text-sm font-medium">
          📍 {lang === "uz" ? "Yetkazib berish manzili" : "Адрес доставки"}
        </label>
        <p className="text-xs text-tg-hint mt-0.5 mb-1">
          {lang === "uz"
            ? "Joylashuvingiz avtomatik aniqlanadi. Kerak bo'lsa nuqtani xaritada suring."
            : "Геолокация определится автоматически. При необходимости передвиньте точку на карте."}
        </p>
        <LocationPicker value={loc} onChange={(lat, lng) => setLoc({ lat, lng })} />
        <p className={`text-xs mt-1 ${loc ? "text-emerald-600" : "text-tg-hint"}`}>
          {loc
            ? (lang === "uz" ? "✓ Joylashuv belgilandi" : "✓ Местоположение отмечено")
            : (lang === "uz" ? "Joylashuv aniqlanmoqda…" : "Определение местоположения…")}
        </p>
      </div>

      <div>
        <label className="text-sm text-tg-hint">{t.phone}</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+998 90 123 45 67"
          className="w-full rounded-xl bg-tg-card px-4 py-3 outline-none mt-1"
        />
      </div>

      <div>
        <label className="text-sm text-tg-hint">{t.comment}</label>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-xl bg-tg-card px-4 py-3 outline-none mt-1"
        />
      </div>

      <div className="card p-4 flex items-center gap-3">
        <span className="text-2xl">💵</span>
        <span>{t.pay_cash}</span>
      </div>

      <div className="flex justify-between text-tg-hint">
        <span>{t.delivery}</span>
        <span>{t.total}</span>
      </div>
      <div className="flex justify-between font-bold text-lg">
        <span>{t.total}</span>
        <span>{money(cart.total())} {t.sum}</span>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button onClick={submit} disabled={submitting} className="btn-brand w-full disabled:opacity-60">
        {submitting ? "…" : t.place_order}
      </button>
    </div>
  );
}
