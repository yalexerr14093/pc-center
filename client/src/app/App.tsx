import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "../components/Layout";
import { RequireAdmin } from "../components/RequireAdmin";
import { HomePage } from "../pages/HomePage";
import { CatalogPage } from "../pages/CatalogPage";
import { ProductPage } from "../pages/ProductPage";
import { CartPage } from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { AuthPage } from "../pages/AuthPage";
import { SellPage } from "../pages/SellPage";
import { MyListingsPage } from "../pages/MyListingsPage";
import { SellerAnalyticsPage } from "../pages/SellerAnalyticsPage";
import { MessagesPage } from "../pages/MessagesPage";
import { OrdersPage } from "../pages/OrdersPage";
import { SellerPage } from "../pages/SellerPage";
import { AdminAnalyticsPage } from "../pages/admin/AdminAnalyticsPage";
import { AdminChatsPage } from "../pages/admin/AdminChatsPage";
import { AdminOrdersPage } from "../pages/admin/AdminOrdersPage";
import { AdminReportsPage } from "../pages/admin/AdminReportsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/seller/:id" element={<SellerPage />} />
        <Route path="/sell" element={<SellPage />} />
        <Route path="/my" element={<MyListingsPage />} />
        <Route path="/my/analytics" element={<SellerAnalyticsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<RequireAdmin />}>
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/admin/chats" element={<AdminChatsPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

