import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../axiosInstance";
import AdminNavbar from "./AdminNavbar";

const Dashboard = () => {
  const adminId =
    localStorage.getItem("userId") || localStorage.getItem("adminId") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      if (!adminId) {
        setProducts([]);
        setError("Admin ID not found. Please login again.");
        return;
      }

      const response = await axiosInstance.get(`/admin/products/${adminId}`);

      const productData = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.products)
        ? response.data.products
        : [];

      setProducts(productData);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setProducts([]);
      setError(error.response?.data?.error || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [adminId]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const featuredProducts = products.filter((p) => p.isFeatured).length;
    const outOfStock = products.filter(
      (p) => Number(p.availabilityCount || 0) === 0
    ).length;
    const lowStock = products.filter(
      (p) =>
        Number(p.availabilityCount || 0) > 0 &&
        Number(p.availabilityCount || 0) <= Number(p.minimumThresholdCount || 0)
    ).length;
    const totalInventoryUnits = products.reduce(
      (sum, p) => sum + Number(p.availabilityCount || 0),
      0
    );
    const totalInventoryValue = products.reduce(
      (sum, p) =>
        sum +
        Number(p.discountPrice > 0 ? p.discountPrice : p.price || 0) *
          Number(p.availabilityCount || 0),
      0
    );

    const publishedProducts = products.filter(
      (p) => (p.status || "").toLowerCase() === "published"
    ).length;

    const draftProducts = products.filter(
      (p) => (p.status || "").toLowerCase() === "draft"
    ).length;

    return {
      totalProducts,
      featuredProducts,
      outOfStock,
      lowStock,
      totalInventoryUnits,
      totalInventoryValue,
      publishedProducts,
      draftProducts,
    };
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return [...products]
      .filter(
        (p) =>
          Number(p.availabilityCount || 0) <= Number(p.minimumThresholdCount || 0)
      )
      .sort(
        (a, b) => Number(a.availabilityCount || 0) - Number(b.availabilityCount || 0)
      )
      .slice(0, 5);
  }, [products]);

  const recentProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [products]);

  return (
    <>
      <AdminNavbar />

      <div className="min-h-screen bg-[#f5f5f5] px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-500">
                Dashboard
              </p>
              <h1 className="mt-2 text-4xl font-extrabold text-[#0e3558]">
                My Store Overview
              </h1>
              <p className="mt-3 max-w-2xl text-slate-500">
                Track inventory health, product counts, and operational insights for
                your own catalog.
              </p>
            </div>

            <button
              onClick={fetchProducts}
              className="rounded-2xl bg-[#0e3558] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#164a79]"
            >
              Refresh Dashboard
            </button>
          </div>

          {loading ? (
            <div className="rounded-[28px] border border-white/70 bg-white/70 p-8 shadow-2xl shadow-slate-300/20 backdrop-blur-sm">
              <p className="text-slate-500">Loading dashboard...</p>
            </div>
          ) : error ? (
            <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 shadow-2xl shadow-red-100/50">
              <p className="font-semibold text-red-600">{error}</p>
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
                    Total available stock across your products.
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
                    Products at or below threshold count.
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
                    Products unavailable for sale right now.
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

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-sm text-slate-500">Featured Products</p>
                      <h3 className="mt-2 text-3xl font-extrabold text-[#0e3558]">
                        {stats.featuredProducts}
                      </h3>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-sm text-slate-500">Inventory Value</p>
                      <h3 className="mt-2 text-3xl font-extrabold text-[#0e3558]">
                        {formatCurrency(stats.totalInventoryValue)}
                      </h3>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-sm text-slate-500">Published</p>
                      <h3 className="mt-2 text-3xl font-extrabold text-green-600">
                        {stats.publishedProducts}
                      </h3>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-sm text-slate-500">Drafts</p>
                      <h3 className="mt-2 text-3xl font-extrabold text-amber-500">
                        {stats.draftProducts}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl bg-slate-50 p-5">
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
                    <p className="mt-2 text-sm text-slate-500">
                      Percentage of your catalog that is still available for selling.
                    </p>
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
                      View My Products
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
                              src={
                                product.imageUrl ||
                                "https://dummyimage.com/100x100/e5e7eb/111827&text=No+Image"
                              }
                              alt={product.name}
                              className="h-14 w-14 rounded-xl object-cover"
                            />
                            <div>
                              <p className="font-semibold text-[#0e3558]">
                                {product.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {product.category || "No category"}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-semibold text-orange-600">
                              {Number(product.availabilityCount || 0) === 0
                                ? "Out of stock"
                                : "Low stock"}
                            </p>
                            <p className="text-sm text-slate-500">
                              {product.availabilityCount || 0} left
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
                              src={
                                product.imageUrl ||
                                "https://dummyimage.com/100x100/e5e7eb/111827&text=No+Image"
                              }
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
                              {formatCurrency(
                                product.discountPrice > 0
                                  ? product.discountPrice
                                  : product.price
                              )}
                            </p>
                            <p className="text-sm capitalize text-slate-500">
                              {product.status || "draft"}
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