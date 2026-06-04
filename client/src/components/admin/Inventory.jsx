import React, { useEffect, useState } from "react";
import axiosInstance from "../../axiosInstance";
import AdminNavbar from "./AdminNavbar";

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get("/inventory");
      setProducts(response.data.products || []);
    } catch (error) {
      console.error("Fetch inventory error:", error);
      alert(error.response?.data?.error || "Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleFieldChange = (id, field, value) => {
    setProducts((prev) =>
      prev.map((product) =>
        product._id === id ? { ...product, [field]: value } : product
      )
    );
  };

  const handleSave = async (product) => {
    try {
      setSavingId(product._id);

      const payload = {
        availabilityCount: Number(product.availabilityCount),
        minimumThresholdCount: Number(product.minimumThresholdCount),
        orderCount: Number(product.orderCount || 0),
        status:
          Number(product.availabilityCount) === 0 ? "out_of_stock" : product.status,
      };

      const response = await axiosInstance.put(
        `/inventory/${product._id}`,
        payload
      );

      setProducts((prev) =>
        prev.map((item) =>
          item._id === product._id ? response.data.product : item
        )
      );

      alert("Inventory updated successfully");
    } catch (error) {
      console.error("Update inventory error:", error);
      alert(error.response?.data?.error || "Failed to update inventory");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <AdminNavbar />

      <div className="min-h-screen bg-[#f5f5f5] px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-500">
              Inventory
            </p>
            <h1 className="mt-2 text-4xl font-extrabold text-[#0e3558]">
              Manage Stock Levels
            </h1>
            <p className="mt-3 max-w-2xl text-slate-500">
              Update product availability, low-stock threshold, and order count.
              Low stock items are highlighted for quick action.
            </p>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/70 shadow-2xl shadow-slate-300/20 backdrop-blur-sm">
            {loading ? (
              <div className="p-8 text-slate-500">Loading inventory...</div>
            ) : products.length === 0 ? (
              <div className="p-8 text-slate-500">No products found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#0e3558] text-white">
                    <tr>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Product</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Category</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Price</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Availability</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Min Threshold</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Order Count</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {products.map((product) => {
                      const isLowStock =
                        Number(product.availabilityCount) <=
                        Number(product.minimumThresholdCount);

                      return (
                        <tr
                          key={product._id}
                          className={`border-b border-slate-200 ${
                            isLowStock ? "bg-orange-50" : "bg-white/70"
                          }`}
                        >
                          <td className="px-4 py-4">
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
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-600">
                            {product.category}
                          </td>

                          <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                            ₹{product.price}
                          </td>

                          <td className="px-4 py-4">
                            <input
                              type="number"
                              value={product.availabilityCount}
                              onChange={(e) =>
                                handleFieldChange(
                                  product._id,
                                  "availabilityCount",
                                  e.target.value
                                )
                              }
                              className="w-28 rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                            />
                          </td>

                          <td className="px-4 py-4">
                            <input
                              type="number"
                              value={product.minimumThresholdCount}
                              onChange={(e) =>
                                handleFieldChange(
                                  product._id,
                                  "minimumThresholdCount",
                                  e.target.value
                                )
                              }
                              className="w-28 rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                            />
                          </td>

                          <td className="px-4 py-4">
                            <input
                              type="number"
                              value={product.orderCount || 0}
                              onChange={(e) =>
                                handleFieldChange(
                                  product._id,
                                  "orderCount",
                                  e.target.value
                                )
                              }
                              className="w-28 rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                            />
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                Number(product.availabilityCount) === 0
                                  ? "bg-red-100 text-red-600"
                                  : isLowStock
                                  ? "bg-orange-100 text-orange-600"
                                  : "bg-green-100 text-green-600"
                              }`}
                            >
                              {Number(product.availabilityCount) === 0
                                ? "Out of Stock"
                                : isLowStock
                                ? "Low Stock"
                                : "In Stock"}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <button
                              onClick={() => handleSave(product)}
                              disabled={savingId === product._id}
                              className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {savingId === product._id ? "Saving..." : "Save"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Inventory;