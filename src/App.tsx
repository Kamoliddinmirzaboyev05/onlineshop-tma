import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import HomePage from "./pages/HomePage";
import OrderDetailPage from "./pages/OrderDetailPage";
import OrdersPage from "./pages/OrdersPage";
import ProfilePage from "./pages/ProfilePage";
import RestaurantPage from "./pages/RestaurantPage";
import { useAuth } from "./store/auth";

export default function App() {
  const { ready, login } = useAuth();

  useEffect(() => {
    login();
  }, [login]);

  if (!ready) {
    return (
      <div className="h-full flex items-center justify-center text-tg-hint">
        Yuklanmoqda…
      </div>
    );
  }

  return (
    <div className="min-h-full pb-20">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/restaurant/:id" element={<RestaurantPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
