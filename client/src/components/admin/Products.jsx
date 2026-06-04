import React, { useEffect, useMemo, useState } from "react";
import AdminNavbar from "./AdminNavbar";
import axiosInstance from "../../axiosInstance";

const initialFormState = {
  name: "",
  description: "",
  shortDescription: "",
  brand: "",
  category: "",
  subCategory: "",
  imageUrl: "",
  price: "",
  discountPrice: "",
  currency: "INR",
  sku: "",
  availabilityCount: "",
  minimumThresholdCount: "",
  tags: "",
  isFeatured: false,
  status: "draft",
};

const Products = () => {
  const adminId =
    localStorage.getItem("userId") || localStorage.getItem("adminId") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [searchTerm, setSearchTerm] = useState("");

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

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      shortDescription: product.shortDescription || "",
      brand: product.brand || "",
      category: product.category || "",
      subCategory: product.subCategory || "",
      imageUrl: product.imageUrl || "",
      price: product.price ?? "",
      discountPrice: product.discountPrice ?? "",
      currency: product.currency || "INR",
      sku: product.sku || "",
      availabilityCount: product.availabilityCount ?? "",
      minimumThresholdCount: product.minimumThresholdCount ?? "",
      tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
      isFeatured: Boolean(product.isFeatured),
      status: product.status || "draft",
    });
  };

  const closeEditModal = () => {
    setSelectedProduct(null);
    setFormData(initialFormState);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    if (!selectedProduct?._id) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        adminId,
        ...formData,
        price: Number(formData.price),
        discountPrice: Number(formData.discountPrice || 0),
        availabilityCount: Number(formData.availabilityCount),
        minimumThresholdCount: Number(formData.minimumThresholdCount),
      };

      const res = await axiosInstance.put(
        `/products/${selectedProduct._id}`,
        payload
      );

      const updatedProduct = res.data?.product;

      setProducts((prev) =>
        prev.map((item) =>
          item._id === selectedProduct._id ? updatedProduct : item
        )
      );

      closeEditModal();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update product.");
    } finally {
      setSaving(false);
    }
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

      if (selectedProduct?._id === productId) {
        closeEditModal();
      }
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
                Manage Products
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                View, edit, publish, draft, and delete only your own products.
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

                    <div className="mt-4 flex items-center justify-between">
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
                        onClick={() => openEditModal(product)}
                        className="rounded-2xl bg-[#0e3558] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#15466f]"
                      >
                        Edit
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

        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-[#0e3558]">
                    Edit Product
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Update product information for your store listing.
                  </p>
                </div>

                <button
                  onClick={closeEditModal}
                  className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={5}
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Short Description
                  </label>
                  <textarea
                    name="shortDescription"
                    rows={3}
                    value={formData.shortDescription}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Subcategory
                  </label>
                  <input
                    type="text"
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Image URL
                  </label>
                  <input
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Discount Price
                  </label>
                  <input
                    type="number"
                    name="discountPrice"
                    value={formData.discountPrice}
                    onChange={handleChange}
                    min="0"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Currency
                  </label>
                  <input
                    type="text"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Availability Count
                  </label>
                  <input
                    type="number"
                    name="availabilityCount"
                    value={formData.availabilityCount}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Minimum Threshold Count
                  </label>
                  <input
                    type="number"
                    name="minimumThresholdCount"
                    value={formData.minimumThresholdCount}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="Laptop, Tech, AI"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-8">
                  <input
                    id="isFeatured"
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                  />
                  <label
                    htmlFor="isFeatured"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Mark as featured product
                  </label>
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default Products;