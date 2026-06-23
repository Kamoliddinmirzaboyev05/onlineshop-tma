import { useNavigate } from "react-router-dom";
import { loc, useI18n } from "../i18n";
import { money } from "../lib/format";
import { useCart } from "../store/cart";

export default function CartPage() {
  const { t, lang } = useI18n();
  const nav = useNavigate();
  const cart = useCart();
  const lines = Object.values(cart.lines);

  if (lines.length === 0) {
    return (
      <div className="p-10 text-center text-tg-hint">
        <div className="text-5xl mb-3">🛒</div>
        {t.cart_empty}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{t.cart}</h1>
      <div className="space-y-3">
        {lines.map(({ product, quantity }) => (
          <div key={product.id} className="card p-3 flex items-center gap-3">
            <div className="flex-1">
              <h3 className="font-medium">{loc(product, "name", lang)}</h3>
              <p className="text-sm text-tg-hint">{money(product.price)} {t.sum}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => cart.setQty(product.id, quantity - 1)}
                className="w-8 h-8 rounded-full bg-tg-bg border text-lg"
              >
                −
              </button>
              <span className="w-6 text-center">{quantity}</span>
              <button
                onClick={() => cart.setQty(product.id, quantity + 1)}
                className="w-8 h-8 rounded-full bg-brand text-white text-lg"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-between font-semibold text-lg">
        <span>{t.total}</span>
        <span>{money(cart.total())} {t.sum}</span>
      </div>

      <button onClick={() => nav("/checkout")} className="btn-brand w-full mt-4">
        {t.checkout}
      </button>
    </div>
  );
}
