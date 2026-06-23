import { NavLink } from "react-router-dom";
import { useI18n } from "../i18n";
import { useCart } from "../store/cart";

const base =
  "flex flex-col items-center justify-center gap-1 flex-1 py-2 text-xs transition";

export default function BottomNav() {
  const { t } = useI18n();
  const count = useCart((s) => s.count());

  const item = (to: string, label: string, icon: string, badge?: number) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${base} ${isActive ? "text-brand" : "text-tg-hint"}`
      }
    >
      <span className="relative text-xl">
        {icon}
        {badge ? (
          <span className="absolute -top-1 -right-3 bg-brand text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
            {badge}
          </span>
        ) : null}
      </span>
      {label}
    </NavLink>
  );

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-tg-bg border-t border-black/10 flex">
      {item("/", t.restaurants, "🍽")}
      {item("/cart", t.cart, "🛒", count)}
      {item("/orders", t.orders, "🧾")}
      {item("/profile", t.profile, "👤")}
    </nav>
  );
}
