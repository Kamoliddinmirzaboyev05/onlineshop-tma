import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useI18n } from "../i18n";
import { money } from "../lib/format";
import { useAuth } from "../store/auth";
import { useCart } from "../store/cart";
import { haptic } from "../telegram";

export default function CheckoutPage() {
  const { t, lang } = useI18n();
  const nav = useNavigate();
  const cart = useCart();
  const user = useAuth((s) => s.user);

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lines = Object.values(cart.lines);

  const submit = async () => {
    if (cart.restaurantId == null) {
      setError(lang === "uz" ? "Savatcha bo'sh" : "Корзина пуста");
      return;
    }
    if (!address.trim()) {
      setError(t.address_ph);
      return;
    }
    if (!phone.trim()) {
      setError(lang === "uz" ? "Telefon raqamini kiriting" : "Введите номер телефона");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const order = await api.placeOrder({
        restaurant_id: cart.restaurantId,
        items: lines.map((l) => ({ product_id: l.product.id, quantity: l.quantity })),
        address_line: address,
        phone,
        comment,
        payment_method: "cash",
      });
      haptic("medium");
      cart.clear();
      nav(`/orders/${order.id}`, { replace: true });
    } catch (e) {
      setError(String(e));
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
        <label className="text-sm text-tg-hint">{t.address}</label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t.address_ph}
          rows={2}
          className="w-full rounded-xl bg-tg-card px-4 py-3 outline-none mt-1"
        />
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
