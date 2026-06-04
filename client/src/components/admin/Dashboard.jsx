import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../axiosInstance";
import AdminNavbar from "./AdminNavbar";

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get("/products");
      setProducts(response.data || []);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const featuredProducts = products.filter((p) => p.isFeatured).length;
    const outOfStock = products.filter(
      (p) => Number(p.availabilityCount) === 0
    ).length;
    const lowStock = products.filter(
      (p) =>
        Number(p.availabilityCount) > 0 &&
        Number(p.availabilityCount) <= Number(p.minimumThresholdCount)
    ).length;
    const totalInventoryUnits = products.reduce(
      (sum, p) => sum + Number(p.availabilityCount || 0),
      0
    );
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + Number(p.price || 0) * Number(p.availabilityCount || 0),
      0
    );

    return {
      totalProducts,
      featuredProducts,
      outOfStock,
      lowStock,
      totalInventoryUnits,
      totalInventoryValue,
    };
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products
      .filter(
        (p) =>
          Number(p.availabilityCount) <= Number(p.minimumThresholdCount)
      )
      .slice(0, 5);
  }, [products]);

  const recentProducts = useMemo(() => {
    return [...products].slice(0, 5);
  }, [products]);

  return (
    <>
      <AdminNavbar />

      <div className="min-h-screen bg-[#f5f5f5] px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-500">
              Dashboard
            </p>
            <h1 className="mt-2 text-4xl font-extrabold text-[#0e3558]">
              Store Overview
            </h1>
            <p className="mt-3 max-w-2xl text-slate-500">
              Track inventory health, product counts, and quick operational insights
              from one place.
            </p>
          </div>

          {loading ? (
            <div className="rounded-[28px] border border-white/70 bg-white/70 p-8 shadow-2xl shadow-slate-300/20 backdrop-blur-sm">
              <p className="text-slate-500">Loading dashboard...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[24px] bg-[#0e3558] p-6 text-white shadow-xl shadow-slate-300/20">
                  <p className="text-sm uppercase tracking-[0.18em] text-orange-200">
                    Total Products
                  </p>
                  <h2 className="mt-4 text-4xl font-extrabold">
                    {stats.totalProducts}
                  </h2>
                  <p className="mt-2 text-sm text-slate-200">
                    Products currently listed in your catalog.
                  </p>
                </div>

                <div className="rounded-[24px] bg-white p-6 shadow-xl shadow-slate-300/20">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                    Inventory Units
                  </p>
                  <h2 className="mt-4 text-4xl font-extrabold text-[#0e3558]">
                    {stats.totalInventoryUnits}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Total available stock across all products.
                  </p>
                </div>

                <div className="rounded-[24px] bg-white p-6 shadow-xl shadow-slate-300/20">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                    Low Stock
                  </p>
                  <h2 className="mt-4 text-4xl font-extrabold text-orange-500">
                    {stats.lowStock}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Products at or below their threshold count.
                  </p>
                </div>

                <div className="rounded-[24px] bg-white p-6 shadow-xl shadow-slate-300/20">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                    Out of Stock
                  </p>
                  <h2 className="mt-4 text-4xl font-extrabold text-red-500">
                    {stats.outOfStock}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Products currently unavailable for sale.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-2xl shadow-slate-300/20 backdrop-blur-sm xl:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
                        Inventory Summary
                      </p>
                      <h2 className="mt-2 text-2xl font-extrabold text-[#0e3558]">
                        Key Highlights
                      </h2>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-sm text-slate-500">Featured Products</p>
                      <h3 className="mt-2 text-3xl font-extrabold text-[#0e3558]">
                        {stats.featuredProducts}
                      </h3>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-sm text-slate-500">Inventory Value</p>
                      <h3 className="mt-2 text-3xl font-extrabold text-[#0e3558]">
                        ₹{stats.totalInventoryValue.toLocaleString("en-IN")}
                      </h3>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-sm text-slate-500">Catalog Health</p>
                      <h3 className="mt-2 text-3xl font-extrabold text-[#0e3558]">
                        {stats.totalProducts === 0
                          ? "0%"
                          : `${Math.max(
                              0,
                              Math.round(
                                ((stats.totalProducts - stats.outOfStock) /
                                  stats.totalProducts) *
                                  100
                              )
                            )}%`}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-2xl shadow-slate-300/20 backdrop-blur-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
                    Quick Actions
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-[#0e3558]">
                    Admin Shortcuts
                  </h2>

                  <div className="mt-6 space-y-3">
                    <a
                      href="/admin/products/new"
                      className="block rounded-2xl bg-orange-500 px-5 py-3 text-center font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
                    >
                      Add New Product
                    </a>

                    <a
                      href="/admin/inventory"
                      className="block rounded-2xl border border-slate-300 px-5 py-3 text-center font-semibold text-[#0e3558] transition hover:border-orange-400 hover:text-orange-500"
                    >
                      Manage Inventory
                    </a>

                    <a
                      href="/admin/products"
                      className="block rounded-2xl border border-slate-300 px-5 py-3 text-center font-semibold text-[#0e3558] transition hover:border-orange-400 hover:text-orange-500"
                    >
                      View Products
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-2xl shadow-slate-300/20 backdrop-blur-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
                    Alerts
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-[#0e3558]">
                    Low Stock Products
                  </h2>

                  <div className="mt-6 space-y-4">
                    {lowStockProducts.length === 0 ? (
                      <p className="text-slate-500">No low stock alerts right now.</p>
                    ) : (
                      lowStockProducts.map((product) => (
                        <div
                          key={product._id}
                          className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50 px-4 py-4"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-14 w-14 rounded-xl object-cover"
                            />
                            <div>
                              <p className="font-semibold text-[#0e3558]">
                                {product.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {product.category}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-semibold text-orange-600">
                              {Number(product.availabilityCount) === 0
                                ? "Out of stock"
                                : "Low stock"}
                            </p>
                            <p className="text-sm text-slate-500">
                              {product.availabilityCount} left
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-2xl shadow-slate-300/20 backdrop-blur-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
                    Recent
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-[#0e3558]">
                    Recently Added Products
                  </h2>

                  <div className="mt-6 space-y-4">
                    {recentProducts.length === 0 ? (
                      <p className="text-slate-500">No products added yet.</p>
                    ) : (
                      recentProducts.map((product) => (
                        <div
                          key={product._id}
                          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-14 w-14 rounded-xl object-cover"
                            />
                            <div>
                              <p className="font-semibold text-[#0e3558]">
                                {product.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {product.brand || "No brand"}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold text-[#0e3558]">
                              ₹{product.price}
                            </p>
                            <p className="text-sm text-slate-500">
                              {product.status}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;