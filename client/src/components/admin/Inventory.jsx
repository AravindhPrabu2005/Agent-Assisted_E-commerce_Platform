import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../axiosInstance";
import AdminNavbar from "./AdminNavbar";

const Inventory = () => {
  const adminId =
    localStorage.getItem("userId") || localStorage.getItem("adminId") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
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

      const response = await axiosInstance.get(`/admin/inventory/${adminId}`);

      const productData = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.products)
        ? response.data.products
        : [];

      setProducts(productData);
    } catch (error) {
      console.error("Fetch inventory error:", error);
      setProducts([]);
      setError(error.response?.data?.error || "Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [adminId]);

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
        adminId,
        availabilityCount: Number(product.availabilityCount || 0),
        minimumThresholdCount: Number(product.minimumThresholdCount || 0),
        orderCount: Number(product.orderCount || 0),
        status:
          Number(product.availabilityCount || 0) === 0
            ? "out_of_stock"
            : product.status || "in_stock",
      };

      const response = await axiosInstance.put(
        `/admin/inventory/${product._id}`,
        payload
      );

      const updatedProduct = response.data?.product || response.data;

      setProducts((prev) =>
        prev.map((item) => (item._id === product._id ? updatedProduct : item))
      );

      alert("Inventory updated successfully");
    } catch (error) {
      console.error("Update inventory error:", error);
      alert(error.response?.data?.error || "Failed to update inventory");
    } finally {
      setSavingId(null);
    }
  };

  const inventoryStats = useMemo(() => {
    const totalProducts = products.length;
    const totalUnits = products.reduce(
      (sum, product) => sum + Number(product.availabilityCount || 0),
      0
    );
    const lowStock = products.filter(
      (product) =>
        Number(product.availabilityCount || 0) > 0 &&
        Number(product.availabilityCount || 0) <=
          Number(product.minimumThresholdCount || 0)
    ).length;
    const outOfStock = products.filter(
      (product) => Number(product.availabilityCount || 0) === 0
    ).length;

    return {
      totalProducts,
      totalUnits,
      lowStock,
      outOfStock,
    };
  }, [products]);

  return (
    <>
      <AdminNavbar />

      <div className="min-h-screen bg-[#f5f5f5] px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-500">
                Inventory
              </p>
              <h1 className="mt-2 text-4xl font-extrabold text-[#0e3558]">
                Manage My Stock
              </h1>
              <p className="mt-3 max-w-2xl text-slate-500">
                Update availability, low-stock threshold, and order count for your
                own products only.
              </p>
            </div>

            <button
              onClick={fetchProducts}
              className="rounded-2xl bg-[#0e3558] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#164a79]"
            >
              Refresh Inventory
            </button>
          </div>

          {loading ? (
            <div className="rounded-[28px] border border-white/70 bg-white/70 p-8 shadow-2xl shadow-slate-300/20 backdrop-blur-sm">
              <p className="text-slate-500">Loading inventory...</p>
            </div>
          ) : error ? (
            <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 shadow-2xl shadow-red-100/50">
              <p className="font-semibold text-red-600">{error}</p>
            </div>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[24px] bg-[#0e3558] p-6 text-white shadow-xl shadow-slate-300/20">
                  <p className="text-sm uppercase tracking-[0.18em] text-orange-200">
                    Total Products
                  </p>
                  <h2 className="mt-4 text-4xl font-extrabold">
                    {inventoryStats.totalProducts}
                  </h2>
                </div>

                <div className="rounded-[24px] bg-white p-6 shadow-xl shadow-slate-300/20">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                    Stock Units
                  </p>
                  <h2 className="mt-4 text-4xl font-extrabold text-[#0e3558]">
                    {inventoryStats.totalUnits}
                  </h2>
                </div>

                <div className="rounded-[24px] bg-white p-6 shadow-xl shadow-slate-300/20">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                    Low Stock
                  </p>
                  <h2 className="mt-4 text-4xl font-extrabold text-orange-500">
                    {inventoryStats.lowStock}
                  </h2>
                </div>

                <div className="rounded-[24px] bg-white p-6 shadow-xl shadow-slate-300/20">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                    Out of Stock
                  </p>
                  <h2 className="mt-4 text-4xl font-extrabold text-red-500">
                    {inventoryStats.outOfStock}
                  </h2>
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/70 shadow-2xl shadow-slate-300/20 backdrop-blur-sm">
                {products.length === 0 ? (
                  <div className="p-8 text-slate-500">No products found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-[#0e3558] text-white">
                        <tr>
                          <th className="px-4 py-4 text-left text-sm font-semibold">
                            Product
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold">
                            Category
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold">
                            Price
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold">
                            Availability
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold">
                            Min Threshold
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold">
                            Order Count
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold">
                            Status
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {products.map((product) => {
                          const isLowStock =
                            Number(product.availabilityCount || 0) <=
                            Number(product.minimumThresholdCount || 0);

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
                              </td>

                              <td className="px-4 py-4 text-sm text-slate-600">
                                {product.category || "No category"}
                              </td>

                              <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                                ₹
                                {Number(
                                  product.discountPrice > 0
                                    ? product.discountPrice
                                    : product.price || 0
                                ).toLocaleString("en-IN")}
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
                                    Number(product.availabilityCount || 0) === 0
                                      ? "bg-red-100 text-red-600"
                                      : isLowStock
                                      ? "bg-orange-100 text-orange-600"
                                      : "bg-green-100 text-green-600"
                                  }`}
                                >
                                  {Number(product.availabilityCount || 0) === 0
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
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Inventory;