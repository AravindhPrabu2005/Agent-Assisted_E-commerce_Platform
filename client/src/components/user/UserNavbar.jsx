import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bot } from "lucide-react";
import axiosInstance from "../../axiosInstance";

export default function UserNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  const userName = localStorage.getItem("userName") || "User";
  const userId = localStorage.getItem("userId");

  const navItems = [
    { name: "Home", path: "/user/home" },
    { name: "Orders", path: "/user/orders" },
  ];

  const badgeClass =
    "absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-white bg-orange-500 px-1 text-[10px] font-bold text-white shadow-[0_4px_10px_rgba(249,115,22,0.28)]";

  const mobileBadgeClass =
    "ml-2 inline-flex min-w-[20px] items-center justify-center rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white";

  const fetchNavbarCounts = async () => {
    if (!userId) {
      setWishlistCount(0);
      setCartCount(0);
      return;
    }

    try {
      const [wishlistRes, cartRes] = await Promise.all([
        axiosInstance.get("/wishlist", {
          params: { userId },
        }),
        axiosInstance.get("/cart", {
          params: { userId },
        }),
      ]);

      const wishlistItems = Array.isArray(wishlistRes.data?.items)
        ? wishlistRes.data.items
        : [];

      const cartItems = Array.isArray(cartRes.data?.items)
        ? cartRes.data.items
        : [];

      setWishlistCount(wishlistItems.length);
      setCartCount(
        cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
      );
    } catch (error) {
      setWishlistCount(0);
      setCartCount(0);
    }
  };

  useEffect(() => {
    fetchNavbarCounts();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = search.trim();
    if (!trimmed) return;
    navigate(`/shop?search=${encodeURIComponent(trimmed)}`);
  };

  const handleProductFinder = () => {
    navigate("/user/product-finder");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-[#f5f5f5]">
      <div className="px-6 py-4 lg:px-10">
        <div className="flex items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-orange-500 text-lg font-extrabold text-white shadow-md shadow-orange-200">
                eK
              </div>

              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-black">
                  eKadai
                </h1>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  Smart Shopping
                </p>
              </div>
            </div>

            <nav className="hidden items-center gap-8 xl:flex">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`relative pb-2 text-lg font-semibold transition ${
                      isActive
                        ? "text-[#0e3558]"
                        : "text-slate-700 hover:text-orange-500"
                    }`}
                  >
                    {item.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-full bg-orange-500"></span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="hidden min-w-[320px] flex-1 justify-center xl:flex">
            <form
              onSubmit={handleSearch}
              className="flex w-full max-w-md items-center rounded-2xl border border-slate-300 bg-white px-3 py-2 shadow-sm"
            >
              <svg
                className="h-5 w-5 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20L17 17" />
              </svg>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />

              <button
                type="submit"
                className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Search
              </button>
            </form>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={handleProductFinder}
              title="Product Finder"
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-500 shadow-sm transition hover:border-orange-400 hover:bg-orange-50"
            >
              <Bot className="h-5 w-5" />
            </button>

            <Link
              to="/user/wishlist"
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-500 shadow-sm transition hover:border-orange-400 hover:bg-orange-50"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 21s-6.716-4.35-9.192-8.192C.966 9.983 2.13 5.944 5.7 4.518c2.153-.86 4.405-.21 5.8 1.56 1.395-1.77 3.647-2.42 5.8-1.56 3.57 1.426 4.734 5.465 2.892 8.29C18.716 16.65 12 21 12 21z" />
              </svg>

              {wishlistCount > 0 && (
                <span className={badgeClass}>
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to="/user/cart"
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-500 shadow-sm transition hover:border-orange-400 hover:bg-orange-50"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="9" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
                <path d="M3 4h2l2.4 10.2a1 1 0 0 0 .98.8H18a1 1 0 0 0 .96-.73L21 7H6" />
              </svg>

              {cartCount > 0 && (
                <span className={badgeClass}>
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            <div className="hidden text-right md:block">
              <p className="text-sm text-slate-500">Welcome</p>
              <p className="text-base font-semibold text-[#0e3558]">
                {userName}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-orange-200 bg-white text-sm font-bold text-orange-500 shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-[#0e3558] transition hover:border-orange-400 hover:text-orange-500"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-4 xl:hidden">
          <form
            onSubmit={handleSearch}
            className="flex items-center rounded-2xl border border-slate-300 bg-white px-3 py-2 shadow-sm"
          >
            <svg
              className="h-5 w-5 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20L17 17" />
            </svg>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-transparent px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />

            <button
              type="submit"
              className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Search
            </button>
          </form>
        </div>

        <div className="mt-4 flex gap-6 overflow-x-auto pb-1 xl:hidden">
          {[
            ...navItems,
            { name: "Finder", path: "/user/product-finder" },
            { name: "Wishlist", path: "/user/wishlist" },
            { name: "Cart", path: "/user/cart" },
          ].map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`whitespace-nowrap border-b-2 pb-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-orange-500 text-[#0e3558]"
                    : "border-transparent text-slate-600 hover:text-orange-500"
                }`}
              >
                {item.name}

                {item.name === "Wishlist" && wishlistCount > 0 && (
                  <span className={mobileBadgeClass}>
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}

                {item.name === "Cart" && cartCount > 0 && (
                  <span className={mobileBadgeClass}>
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}