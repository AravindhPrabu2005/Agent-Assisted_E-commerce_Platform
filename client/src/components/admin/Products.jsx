import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import axiosInstance from "../../axiosInstance";

const Products = () => {
  const navigate = useNavigate();

  const adminId =
    localStorage.getItem("userId") || localStorage.getItem("adminId") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    document.title = "Products Management";
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      if (!adminId) {
        setError("Admin id not found. Please login again.");
        setLoading(false);
        return;
      }

      const res = await axiosInstance.get(`/admin/products/${adminId}`, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      const productData = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.products)
        ? res.data.products
        : [];

      setProducts(productData);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [adminId]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;

    const query = searchTerm.toLowerCase();

    return products.filter((product) => {
      return (
        product.name?.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query) ||
        product.subCategory?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query)
      );
    });
  }, [products, searchTerm]);

  const formatPrice = (value) => {
    if (value === undefined || value === null || value === "") return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value));
  };

  const handleStatusChange = async (productId, nextStatus) => {
    try {
      setActionLoadingId(productId);
      setError("");

      const res = await axiosInstance.patch(`/products/${productId}/status`, {
        adminId,
        status: nextStatus,
      });

      const updatedProduct = res.data?.product;

      setProducts((prev) =>
        prev.map((item) => (item._id === productId ? updatedProduct : item))
      );
    } catch (err) {
      setError(err.response?.data?.error || `Failed to move product to ${nextStatus}.`);
    } finally {
      setActionLoadingId("");
    }
  };

  const handleDeleteProduct = async (productId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product from MongoDB and ChromaDB?"
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(productId);
      setError("");

      await axiosInstance.delete(`/products/${productId}`, {
        data: { adminId },
      });

      setProducts((prev) => prev.filter((item) => item._id !== productId));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete product.");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <>
      <AdminNavbar />

      <main className="min-h-screen bg-[#f8f8f8] px-6 py-8 lg:px-10">
        <section className="mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[#0e3558]">
                Products Management
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Search, monitor, publish, draft, and open complete product workspaces.
              </p>
            </div>

            <div className="w-full max-w-md">
              <input
                type="text"
                placeholder="Search by name, brand, category, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </div>
          </div>
        </section>

        {error && (
          <section className="mb-6 rounded-[28px] border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-medium text-red-600">{error}</p>
          </section>
        )}

        {loading ? (
          <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[28px] bg-white p-4 shadow-sm"
              >
                <div className="h-52 animate-pulse rounded-2xl bg-slate-200"></div>
                <div className="mt-4 h-4 w-24 animate-pulse rounded bg-slate-200"></div>
                <div className="mt-3 h-6 animate-pulse rounded bg-slate-200"></div>
                <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-slate-200"></div>
                <div className="mt-6 h-10 animate-pulse rounded-2xl bg-slate-200"></div>
              </div>
            ))}
          </section>
        ) : filteredProducts.length === 0 ? (
          <section className="rounded-[28px] bg-white px-6 py-16 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-[#0e3558]">
              No products found
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              You have not created any products yet, or no products match your search.
            </p>
          </section>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => {
              const isPublished = product.status?.toLowerCase() === "published";
              const isActionLoading = actionLoadingId === product._id;

              return (
                <div
                  key={product._id}
                  className="overflow-hidden rounded-[28px] bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="overflow-hidden rounded-[24px] bg-[#f4f6f8]">
                    <img
                      src={
                        product.imageUrl ||
                        "https://dummyimage.com/600x600/e5e7eb/111827&text=No+Image"
                      }
                      alt={product.name}
                      className="h-56 w-full object-cover"
                    />
                  </div>

                  <div className="mt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {product.category || "Category"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                          isPublished
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {product.status || "draft"}
                      </span>

                      {product.isFeatured && (
                        <span className="rounded-full bg-orange-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                          Featured
                        </span>
                      )}
                    </div>

                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {product.brand || "Brand"}
                    </p>

                    <h3 className="mt-2 line-clamp-1 text-xl font-black text-[#0e3558]">
                      {product.name}
                    </h3>

                    <p className="mt-2 line-clamp-2 min-h-[44px] text-sm leading-6 text-slate-500">
                      {product.shortDescription || "No short description available."}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-2xl font-black text-[#0e3558]">
                          {formatPrice(product.discountPrice || product.price)}
                        </p>

                        {product.discountPrice > 0 &&
                          product.discountPrice < product.price && (
                            <p className="text-sm text-slate-400 line-through">
                              {formatPrice(product.price)}
                            </p>
                          )}
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          SKU
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          {product.sku || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <button
                        onClick={() => navigate(`/admin/products/${product._id}`)}
                        className="rounded-2xl bg-[#0e3558] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#15466f]"
                      >
                        Open Workspace
                      </button>

                      {isPublished ? (
                        <button
                          onClick={() => handleStatusChange(product._id, "draft")}
                          disabled={isActionLoading}
                          className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isActionLoading ? "Updating..." : "Move to Draft"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(product._id, "published")}
                          disabled={isActionLoading}
                          className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isActionLoading ? "Updating..." : "Publish"}
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteProduct(product._id)}
                      disabled={isActionLoading}
                      className="mt-3 w-full rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isActionLoading ? "Processing..." : "Delete Product"}
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </>
  );
};

export default Products;