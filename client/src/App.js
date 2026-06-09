import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SignupPage from "./components/Signup";
import LoginPage from "./components/Loginpage";
import AdminSignupPage from "./components/AdminSignup";
import Landing from "./components/Landing";
import Dashboard from "./components/admin/Dashboard";
import NewProduct from "./components/admin/NewProduct";
import Orders from "./components/admin/Orders";
import Inventory from "./components/admin/Inventory";
import Analytics from "./components/admin/Analytics";
import Home from "./components/user/Home";
import Product from "./components/user/Product";
import ChatBot from "./components/user/ChatBot";
import Products from "./components/admin/Products";
import Order from "./components/user/Order";
import OrdersListing from "./components/user/OrdersListing";
import Cart from "./components/user/Cart";
import Wishlist from "./components/user/Wishlist";
import CartCheckout from "./components/user/CartCheckout";
import ProductWorkspace from "./components/admin/ProductWorkspace";
import InventoryForecast from "./components/admin/InventoryForecast";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/adminSignup" element={<AdminSignupPage />} />

        <Route path="/user/home" element={<Home />} />
        <Route path="/user/product/:id" element={<Product />} />
        <Route path="/user/product-finder" element={<ChatBot />} />
        <Route path="/user/order/:id" element={<Order />} />
        <Route path="/user/orders" element={<OrdersListing />} />
        <Route path="/user/cart" element={<Cart />} />
        <Route path="/user/wishlist" element={<Wishlist />} />
        <Route path="/user/cart-checkout" element={<CartCheckout />} />

        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/products" element={<Products />} />
        <Route path="/admin/products/:productId" element={<ProductWorkspace />} />
        <Route path="/admin/newproduct" element={<NewProduct />} />
        <Route path="/admin/orders" element={<Orders />} />
        <Route path="/admin/inventory" element={<Inventory />} />
        <Route path="/admin/inventory-forecast" element={<InventoryForecast />} />
        <Route path="/admin/analytics" element={<Analytics />} />
      </Routes>
    </Router>
  );
};

export default App;