import React, { useState } from "react";
import axiosInstance from "../../axiosInstance"
import AdminNavbar from "./AdminNavbar";

const NewProduct = () => {
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
    status: "published",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const adminId = localStorage.getItem("userId");

      if (!adminId) {
        alert("Admin ID not found in localStorage");
        return;
      }

      const payload = {
        ...formData,
        adminId,
        price: Number(formData.price),
        discountPrice: Number(formData.discountPrice || 0),
        availabilityCount: Number(formData.availabilityCount),
        minimumThresholdCount: Number(formData.minimumThresholdCount),
      };

      const response = await axiosInstance.post("/products", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert(response.data.message);

      setFormData({
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
        status: "published",
      });
    } catch (error) {
      console.error("Create product error:", error);
      alert(error.response?.data?.error || "Failed to create product");
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="min-h-screen bg-[#f5f5f5] px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-500">
              Catalog
            </p>
            <h1 className="mt-2 text-4xl font-extrabold text-[#0e3558]">
              Create New Product
            </h1>
            <p className="mt-3 max-w-2xl text-slate-500">
              Add product details, inventory values, pricing, and searchable
              product information for your future product finder agent.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-2xl shadow-slate-300/20 backdrop-blur-sm md:p-8">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Image URL
                </label>
                <input
                  type="text"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="Paste product image link"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Brand name"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  SKU
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="SKU code"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Category"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Sub Category
                </label>
                <input
                  type="text"
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  placeholder="Sub category"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Price
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Enter price"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Discount Price
                </label>
                <input
                  type="number"
                  name="discountPrice"
                  value={formData.discountPrice}
                  onChange={handleChange}
                  placeholder="Discounted price"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Availability Count
                </label>
                <input
                  type="number"
                  name="availabilityCount"
                  value={formData.availabilityCount}
                  onChange={handleChange}
                  placeholder="Available stock"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Minimum Threshold Count
                </label>
                <input
                  type="number"
                  name="minimumThresholdCount"
                  value={formData.minimumThresholdCount}
                  onChange={handleChange}
                  placeholder="Low stock alert count"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Currency
                </label>
                <input
                  type="text"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  placeholder="INR"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Short Description
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  placeholder="Short one-line description"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Full Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Detailed product description"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="Comma separated tags like shoes, sports, men"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                />
                <label className="text-sm font-semibold text-[#0e3558]">
                  Mark as featured product
                </label>
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  className="rounded-2xl bg-orange-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewProduct;