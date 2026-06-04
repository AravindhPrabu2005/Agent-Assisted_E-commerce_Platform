import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Products", path: "/admin/products" },
    { name: "New Product", path: "/admin/newproduct" },
    { name: "Orders", path: "/admin/orders" },
    { name: "Inventory", path: "/admin/inventory" },
    { name: "Analytics", path: "/admin/analytics" },
  ];

  const adminName = localStorage.getItem("userName") || "Admin";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-[#f5f5f5]">
      <div className="flex items-center justify-between px-6 py-4 lg:px-10">
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
                Admin Panel
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

        <div className="ml-auto flex items-center gap-4">
          <div className="hidden text-right md:block">
            <p className="text-sm text-slate-500">Welcome</p>
            <p className="text-base font-semibold text-[#0e3558]">{adminName}</p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-orange-200 bg-white text-sm font-bold text-orange-500 shadow-sm">
            {adminName.charAt(0).toUpperCase()}
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-[#0e3558] transition hover:border-orange-400 hover:text-orange-500"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto px-6 pb-3 xl:hidden">
        {navItems.map((item) => {
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
            </Link>
          );
        })}
      </div>
    </header>
  );
}