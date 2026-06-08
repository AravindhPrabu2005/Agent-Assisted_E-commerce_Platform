import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import axiosInstance from "../../axiosInstance";

const ProductWorkspace = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const adminId =
    localStorage.getItem("userId") || localStorage.getItem("adminId") || "";

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
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
  });

  useEffect(() => {
    document.title = "Product Workspace";
  }, []);

  const formatPrice = (value) => {
    if (value === undefined || value === null || value === "") return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value));
  };

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      setError("");

      const [productRes, reviewRes, summaryRes] = await Promise.allSettled([
        axiosInstance.get(`/products/${productId}`),
        axiosInstance.get(`/reviews/product/${productId}`),
        axiosInstance.get(`/products/${productId}/review-summary`),
      ]);

      if (productRes.status === "fulfilled") {
        const productData = productRes.value.data?.product || productRes.value.data;
        setProduct(productData);
        setFormData({
          name: productData.name || "",
          description: productData.description || "",
          shortDescription: productData.shortDescription || "",
          brand: productData.brand || "",
          category: productData.category || "",
          subCategory: productData.subCategory || "",
          imageUrl: productData.imageUrl || "",
          price: productData.price ?? "",
          discountPrice: productData.discountPrice ?? "",
          currency: productData.currency || "INR",
          sku: productData.sku || "",
          availabilityCount: productData.availabilityCount ?? "",
          minimumThresholdCount: productData.minimumThresholdCount ?? "",
          tags: Array.isArray(productData.tags) ? productData.tags.join(", ") : "",
          isFeatured: Boolean(productData.isFeatured),
          status: productData.status || "draft",
        });
      }

      if (reviewRes.status === "fulfilled") {
        setReviews(reviewRes.value.data?.reviews || []);
      }

      if (summaryRes.status === "fulfilled") {
        setReviewSummary(summaryRes.value.data?.summary || null);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load product workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchWorkspace();
    }
  }, [productId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();

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
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      const res = await axiosInstance.put(`/products/${productId}`, payload);
      const updatedProduct = res.data?.product || res.data;
      setProduct(updatedProduct);
      setFormData({
        name: updatedProduct.name || "",
        description: updatedProduct.description || "",
        shortDescription: updatedProduct.shortDescription || "",
        brand: updatedProduct.brand || "",
        category: updatedProduct.category || "",
        subCategory: updatedProduct.subCategory || "",
        imageUrl: updatedProduct.imageUrl || "",
        price: updatedProduct.price ?? "",
        discountPrice: updatedProduct.discountPrice ?? "",
        currency: updatedProduct.currency || "INR",
        sku: updatedProduct.sku || "",
        availabilityCount: updatedProduct.availabilityCount ?? "",
        minimumThresholdCount: updatedProduct.minimumThresholdCount ?? "",
        tags: Array.isArray(updatedProduct.tags) ? updatedProduct.tags.join(", ") : "",
        isFeatured: Boolean(updatedProduct.isFeatured),
        status: updatedProduct.status || "draft",
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save product changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSummary = async () => {
    try {
      setSummaryLoading(true);
      setError("");

      const res = await axiosInstance.post(`/products/${productId}/review-summary`, {
        adminId,
      });

      setReviewSummary(res.data?.summary || null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate review summary.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? (
          reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
          totalReviews
        ).toFixed(1)
      : "0.0";

  const inStock = Number(product?.availabilityCount || 0) > 0;
  const lowStock =
    Number(product?.availabilityCount || 0) <=
    Number(product?.minimumThresholdCount || 0);

  if (loading) {
    return (
      <>
        <AdminNavbar />
        <main className="min-h-screen bg-[#f8f8f8] px-6 py-8 lg:px-10">
          <div className="animate-pulse rounded-[32px] bg-white p-8 shadow-sm">
            <div className="h-8 w-56 rounded bg-slate-200"></div>
            <div className="mt-6 h-64 rounded-3xl bg-slate-200"></div>
          </div>
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <AdminNavbar />
        <main className="min-h-screen bg-[#f8f8f8] px-6 py-8 lg:px-10">
          <div className="rounded-[32px] bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-black text-[#0e3558]">Product not found</h1>
            <button
              onClick={() => navigate("/admin/products")}
              className="mt-5 rounded-2xl bg-[#0e3558] px-5 py-3 text-sm font-semibold text-white"
            >
              Back to Products
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />

      <main className="min-h-screen bg-[#f8f8f8] px-6 py-8 lg:px-10">
        <section className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              onClick={() => navigate("/admin/products")}
              className="mb-3 text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              ← Back to Products
            </button>
            <h1 className="text-3xl font-black tracking-tight text-[#0e3558]">
              Product Workspace
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Review complete product data, update catalog details, and inspect customer feedback.
            </p>
          </div>
        </section>

        {error && (
          <section className="mb-6 rounded-[28px] border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-medium text-red-600">{error}</p>
          </section>
        )}

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[32px] bg-white shadow-sm">
              <div className="grid gap-6 p-6 lg:grid-cols-[340px_1fr]">
                <div className="rounded-[28px] bg-[#f4f6f8] p-4">
                  <div className="flex h-[320px] items-center justify-center overflow-hidden rounded-[24px] bg-white sm:h-[380px]">
                    <img
                      src={
                        product.imageUrl ||
                        "https://dummyimage.com/700x700/e5e7eb/111827&text=No+Image"
                      }
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {product.category || "Category"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {product.subCategory || "Subcategory"}
                    </span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                      {product.status || "draft"}
                    </span>
                    {product.isFeatured && (
                      <span className="rounded-full bg-orange-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                        Featured
                      </span>
                    )}
                  </div>

                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {product.brand || "Brand"}
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-[#0e3558]">
                    {product.name}
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {product.shortDescription || "No short description available."}
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Selling Price
                      </p>
                      <p className="mt-2 text-2xl font-black text-[#0e3558]">
                        {formatPrice(product.discountPrice || product.price)}
                      </p>
                    </div>

                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        SKU
                      </p>
                      <p className="mt-2 text-lg font-black text-[#0e3558]">
                        {product.sku || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Full Description
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                      {product.description || "No description available."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[32px] bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Inventory Management
                    </p>
                    <h3 className="mt-2 text-xl font-black text-[#0e3558]">Stock Overview</h3>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                      inStock
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Available Units
                    </p>
                    <p className="mt-2 text-2xl font-black text-[#0e3558]">
                      {product.availabilityCount ?? 0}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Threshold
                    </p>
                    <p className="mt-2 text-2xl font-black text-[#0e3558]">
                      {product.minimumThresholdCount ?? 0}
                    </p>
                  </div>
                </div>

                <div
                  className={`mt-4 rounded-3xl border px-4 py-3 text-sm font-medium ${
                    lowStock
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {lowStock
                    ? "Stock is at or below the minimum threshold. Restock planning is needed."
                    : "Stock level is healthy and currently above the alert threshold."}
                </div>
              </div>

              <div className="rounded-[32px] bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Catalog Management
                </p>
                <h3 className="mt-2 text-xl font-black text-[#0e3558]">Product Metadata</h3>

                <div className="mt-5 grid gap-4">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Base Price
                    </p>
                    <p className="mt-2 text-lg font-black text-[#0e3558]">
                      {formatPrice(product.price)}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Discount Price
                    </p>
                    <p className="mt-2 text-lg font-black text-[#0e3558]">
                      {product.discountPrice ? formatPrice(product.discountPrice) : "No discount"}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Tags
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Array.isArray(product.tags) && product.tags.length > 0 ? (
                        product.tags.map((tag, index) => (
                          <span
                            key={`${tag}-${index}`}
                            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">No tags added.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveChanges} className="rounded-[32px] bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-2xl font-black text-[#0e3558]">Product Information</h3>
              <p className="mt-2 text-sm text-slate-500">
                Update the product record, storefront data, and catalog details.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
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

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={6}
                  value={formData.description}
                  onChange={handleChange}
                  required
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

              <div className="md:col-span-2">
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

              <div className="md:col-span-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Updated Image Preview
                  </p>
                  <div className="flex h-[260px] items-center justify-center overflow-hidden rounded-[20px] bg-white">
                    <img
                      src={
                        formData.imageUrl ||
                        "https://dummyimage.com/700x700/e5e7eb/111827&text=No+Image"
                      }
                      alt={formData.name || product.name}
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://dummyimage.com/700x700/e5e7eb/111827&text=No+Image";
                      }}
                    />
                  </div>
                </div>
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
                  onClick={() => navigate("/admin/products")}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Product Changes"}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[32px] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-2xl font-black text-[#0e3558]">Review Summary</h3>
                <p className="mt-2 text-sm text-slate-500">
                  AI-generated summary based on product reviews and catalog context.
                </p>
              </div>

              <button
                onClick={handleGenerateSummary}
                disabled={summaryLoading}
                className="rounded-2xl bg-[#0e3558] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#15466f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {summaryLoading ? "Generating..." : "Generate Summary"}
              </button>
            </div>

            <div className="mt-5 rounded-3xl bg-slate-50 p-5">
              {reviewSummary ? (
                <div className="space-y-4">
                  <p className="text-sm leading-7 text-slate-700">
                    {reviewSummary.summary || "No summary available."}
                  </p>

                  {Array.isArray(reviewSummary.highlights) &&
                    reviewSummary.highlights.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Highlights
                        </p>
                        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                          {reviewSummary.highlights.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {Array.isArray(reviewSummary.concerns) &&
                    reviewSummary.concerns.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Concerns
                        </p>
                        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                          {reviewSummary.concerns.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              ) : (
                <p className="text-sm leading-7 text-slate-600">
                  Summary will appear here after generation. Later, this can be refreshed
                  automatically when new reviews are added.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[32px] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-2xl font-black text-[#0e3558]">Ratings & Reviews</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Read individual customer reviews at the bottom of the workspace.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:min-w-[220px]">
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Avg Rating
                  </p>
                  <p className="mt-2 text-2xl font-black text-[#0e3558]">{averageRating}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Total Reviews
                  </p>
                  <p className="mt-2 text-2xl font-black text-[#0e3558]">{totalReviews}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {reviews.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-500">
                  No reviews have been submitted for this product yet.
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review._id} className="rounded-3xl border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {review.customerName || "Customer"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(review.createdAt).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-orange-600">
                        {review.rating} / 5
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {review.reviewText}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default ProductWorkspace;