import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../axiosInstance";
import AdminNavbar from "./AdminNavbar";

const Analytics = () => {
  const adminId =
    localStorage.getItem("userId") || localStorage.getItem("adminId") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = adminId
        ? await axiosInstance.get(`/admin/products/${adminId}`)
        : await axiosInstance.get("/products");

      const productData = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.products)
        ? response.data.products
        : [];

      setProducts(productData);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError(err.response?.data?.error || "Failed to load analytics.");
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

  const analytics = useMemo(() => {
    const totalProducts = products.length;
    const publishedProducts = products.filter(
      (p) => (p.status || "").toLowerCase() === "published"
    ).length;
    const draftProducts = products.filter(
      (p) => (p.status || "").toLowerCase() === "draft"
    ).length;
    const archivedProducts = products.filter(
      (p) => (p.status || "").toLowerCase() === "archived"
    ).length;

    const featuredProducts = products.filter((p) => Boolean(p.isFeatured)).length;
    const nonFeaturedProducts = totalProducts - featuredProducts;

    const totalStockUnits = products.reduce(
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

    const avgPrice =
      totalProducts === 0
        ? 0
        : Math.round(
            products.reduce((sum, p) => sum + Number(p.price || 0), 0) /
              totalProducts
          );

    const avgDiscountedPrice =
      totalProducts === 0
        ? 0
        : Math.round(
            products.reduce(
              (sum, p) =>
                sum +
                Number(p.discountPrice > 0 ? p.discountPrice : p.price || 0),
              0
            ) / totalProducts
          );

    const inStock = products.filter((p) => Number(p.availabilityCount || 0) > 0).length;
    const outOfStock = products.filter(
      (p) => Number(p.availabilityCount || 0) === 0
    ).length;
    const lowStock = products.filter(
      (p) =>
        Number(p.availabilityCount || 0) > 0 &&
        Number(p.availabilityCount || 0) <= Number(p.minimumThresholdCount || 0)
    ).length;
    const healthyStock = products.filter(
      (p) => Number(p.availabilityCount || 0) > Number(p.minimumThresholdCount || 0)
    ).length;

    const categoryMap = {};
    const brandMap = {};

    products.forEach((product) => {
      const category = product.category || "Uncategorized";
      const brand = product.brand || "Unbranded";

      if (!categoryMap[category]) {
        categoryMap[category] = {
          name: category,
          count: 0,
          units: 0,
          value: 0,
        };
      }

      if (!brandMap[brand]) {
        brandMap[brand] = {
          name: brand,
          count: 0,
        };
      }

      categoryMap[category].count += 1;
      categoryMap[category].units += Number(product.availabilityCount || 0);
      categoryMap[category].value +=
        Number(product.discountPrice > 0 ? product.discountPrice : product.price || 0) *
        Number(product.availabilityCount || 0);

      brandMap[brand].count += 1;
    });

    const categoryBreakdown = Object.values(categoryMap)
      .sort((a, b) => b.count - a.count)
      .map((item) => ({
        ...item,
        percentage:
          totalProducts === 0 ? 0 : Math.round((item.count / totalProducts) * 100),
      }));

    const topBrands = Object.values(brandMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((item) => ({
        ...item,
        percentage:
          totalProducts === 0 ? 0 : Math.round((item.count / totalProducts) * 100),
      }));

    const topValueProducts = [...products]
      .map((product) => ({
        ...product,
        inventoryValue:
          Number(product.discountPrice > 0 ? product.discountPrice : product.price || 0) *
          Number(product.availabilityCount || 0),
      }))
      .sort((a, b) => b.inventoryValue - a.inventoryValue)
      .slice(0, 5);

    const recentTrend = [...products]
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(-7);

    return {
      totalProducts,
      publishedProducts,
      draftProducts,
      archivedProducts,
      featuredProducts,
      nonFeaturedProducts,
      totalStockUnits,
      totalInventoryValue,
      avgPrice,
      avgDiscountedPrice,
      inStock,
      outOfStock,
      lowStock,
      healthyStock,
      categoryBreakdown,
      topBrands,
      topValueProducts,
      recentTrend,
    };
  }, [products]);

  const maxCategoryCount = Math.max(
    ...analytics.categoryBreakdown.map((item) => item.count),
    1
  );

  const maxBrandCount = Math.max(...analytics.topBrands.map((item) => item.count), 1);

  const maxTrendValue = Math.max(
    ...analytics.recentTrend.map((item) => Number(item.price || 0)),
    1
  );

  return (
    <>
      <AdminNavbar />

      <main className="min-h-screen bg-[linear-gradient(180deg,#f7f8fb_0%,#eef2f7_100%)] px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl">
          

          {loading ? (
            <div className="rounded-[28px] bg-white p-8 shadow-xl">
              <p className="text-slate-500">Loading analytics...</p>
            </div>
          ) : error ? (
            <div className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-8">
              <p className="font-semibold text-red-600">{error}</p>
            </div>
          ) : (
            <>
              <section className="grid grid-cols-1 gap-6 xl:grid-cols-4">
                <div className="rounded-[28px] bg-white p-6 shadow-xl shadow-slate-300/20">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Total Products
                  </p>
                  <h2 className="mt-3 text-4xl font-black text-[#0e3558]">
                    {analytics.totalProducts}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Overall products contributing to your catalog analytics.
                  </p>
                </div>

                <div className="rounded-[28px] bg-white p-6 shadow-xl shadow-slate-300/20">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Avg Sell Price
                  </p>
                  <h2 className="mt-3 text-4xl font-black text-[#0e3558]">
                    {formatCurrency(analytics.avgDiscountedPrice)}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Average effective selling price after discounts.
                  </p>
                </div>

                <div className="rounded-[28px] bg-white p-6 shadow-xl shadow-slate-300/20">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Featured Share
                  </p>
                  <h2 className="mt-3 text-4xl font-black text-orange-500">
                    {analytics.totalProducts === 0
                      ? "0%"
                      : `${Math.round(
                          (analytics.featuredProducts / analytics.totalProducts) * 100
                        )}%`}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Portion of catalog currently highlighted as featured.
                  </p>
                </div>

                <div className="rounded-[28px] bg-white p-6 shadow-xl shadow-slate-300/20">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Stock Coverage
                  </p>
                  <h2 className="mt-3 text-4xl font-black text-green-600">
                    {analytics.totalProducts === 0
                      ? "0%"
                      : `${Math.round(
                          (analytics.inStock / analytics.totalProducts) * 100
                        )}%`}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Share of products that are currently in stock.
                  </p>
                </div>
              </section>

              <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[30px] bg-white p-6 shadow-2xl shadow-slate-300/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
                        Category Mix
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-[#0e3558]">
                        Category Distribution
                      </h2>
                    </div>
                  </div>

                  <div className="mt-6 space-y-5">
                    {analytics.categoryBreakdown.length === 0 ? (
                      <p className="text-slate-500">No category data available.</p>
                    ) : (
                      analytics.categoryBreakdown.map((item) => (
                        <div key={item.name}>
                          <div className="mb-2 flex items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-[#0e3558]">
                                {item.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {item.count} products • {item.units} units
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-slate-500">
                              {item.percentage}%
                            </p>
                          </div>

                          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#0e3558] to-orange-500"
                              style={{
                                width: `${(item.count / maxCategoryCount) * 100}%`,
                              }}
                            />
                          </div>

                          <p className="mt-2 text-xs text-slate-400">
                            Inventory value: {formatCurrency(item.value)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-[30px] bg-white p-6 shadow-2xl shadow-slate-300/20">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
                    Publish State
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#0e3558]">
                    Catalog Status Split
                  </h2>

                  <div className="mt-6 space-y-4">
                    {[
                      {
                        label: "Published",
                        value: analytics.publishedProducts,
                        color: "bg-green-500",
                      },
                      {
                        label: "Draft",
                        value: analytics.draftProducts,
                        color: "bg-amber-500",
                      },
                      {
                        label: "Archived",
                        value: analytics.archivedProducts,
                        color: "bg-slate-400",
                      },
                    ].map((item) => {
                      const percentage =
                        analytics.totalProducts === 0
                          ? 0
                          : Math.round((item.value / analytics.totalProducts) * 100);

                      return (
                        <div
                          key={item.label}
                          className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`h-3 w-3 rounded-full ${item.color}`} />
                              <p className="font-semibold text-[#0e3558]">
                                {item.label}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-slate-500">
                              {item.value}
                            </p>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-white">
                            <div
                              className={`h-full rounded-full ${item.color}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          <p className="mt-2 text-xs text-slate-400">
                            {percentage}% of total catalog
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[30px] bg-white p-6 shadow-2xl shadow-slate-300/20">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
                    Stock Shape
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#0e3558]">
                    Stock Health Breakdown
                  </h2>

                  <div className="mt-8 flex items-center justify-center">
                    <div className="relative flex h-64 w-64 items-center justify-center rounded-full bg-[conic-gradient(#16a34a_0%_55%,#f59e0b_55%_82%,#ef4444_82%_100%)]">
                      <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Healthy Stock
                        </p>
                        <p className="mt-2 text-3xl font-black text-[#0e3558]">
                          {analytics.healthyStock}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between rounded-2xl bg-green-50 px-4 py-3">
                      <p className="font-semibold text-green-700">Healthy</p>
                      <p className="font-bold text-green-700">
                        {analytics.healthyStock}
                      </p>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
                      <p className="font-semibold text-amber-700">Low Stock</p>
                      <p className="font-bold text-amber-700">{analytics.lowStock}</p>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-red-50 px-4 py-3">
                      <p className="font-semibold text-red-700">Out of Stock</p>
                      <p className="font-bold text-red-700">{analytics.outOfStock}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[30px] bg-white p-6 shadow-2xl shadow-slate-300/20">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
                    Brand Presence
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#0e3558]">
                    Top Brands by Count
                  </h2>

                  <div className="mt-6 space-y-4">
                    {analytics.topBrands.length === 0 ? (
                      <p className="text-slate-500">No brand data available.</p>
                    ) : (
                      analytics.topBrands.map((brand, index) => (
                        <div
                          key={brand.name}
                          className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0e3558] text-xs font-bold text-white">
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-semibold text-[#0e3558]">
                                  {brand.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {brand.percentage}% of catalog
                                </p>
                              </div>
                            </div>
                            <p className="font-bold text-slate-600">{brand.count}</p>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-white">
                            <div
                              className="h-full rounded-full bg-[#0e3558]"
                              style={{
                                width: `${(brand.count / maxBrandCount) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>

              <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[30px] bg-white p-6 shadow-2xl shadow-slate-300/20">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
                    Value Leaders
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#0e3558]">
                    Highest Inventory Value Products
                  </h2>

                  <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-100">
                    <div className="grid grid-cols-[1.8fr_0.8fr_0.8fr_1fr] bg-slate-50 px-4 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      <p>Product</p>
                      <p>Units</p>
                      <p>Price</p>
                      <p className="text-right">Value</p>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {analytics.topValueProducts.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-slate-500">
                          No products available.
                        </div>
                      ) : (
                        analytics.topValueProducts.map((product) => (
                          <div
                            key={product._id}
                            className="grid grid-cols-[1.8fr_0.8fr_0.8fr_1fr] items-center px-4 py-4"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-12 w-12 rounded-xl object-cover"
                              />
                              <div>
                                <p className="font-semibold text-[#0e3558]">
                                  {product.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {product.category || "Category"}
                                </p>
                              </div>
                            </div>

                            <p className="font-semibold text-slate-600">
                              {product.availabilityCount || 0}
                            </p>

                            <p className="font-semibold text-slate-600">
                              {formatCurrency(
                                product.discountPrice > 0
                                  ? product.discountPrice
                                  : product.price
                              )}
                            </p>

                            <p className="text-right font-bold text-[#0e3558]">
                              {formatCurrency(product.inventoryValue)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[30px] bg-white p-6 shadow-2xl shadow-slate-300/20">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
                    Recent Pricing
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#0e3558]">
                    Latest Product Price Pattern
                  </h2>

                  <div className="mt-8 flex h-[320px] items-end gap-4 overflow-x-auto rounded-[24px] bg-slate-50 px-4 py-6">
                    {analytics.recentTrend.length === 0 ? (
                      <p className="text-sm text-slate-500">No recent data available.</p>
                    ) : (
                      analytics.recentTrend.map((product) => {
                        const height = `${
                          (Number(product.price || 0) / maxTrendValue) * 220
                        }px`;

                        return (
                          <div
                            key={product._id}
                            className="flex min-w-[84px] flex-1 flex-col items-center justify-end"
                          >
                            <p className="mb-2 text-xs font-semibold text-slate-500">
                              ₹{Number(product.price || 0).toLocaleString("en-IN")}
                            </p>

                            <div
                              className="w-full rounded-t-[18px] bg-gradient-to-t from-orange-500 to-[#0e3558]"
                              style={{ height }}
                            />

                            <p className="mt-3 line-clamp-2 text-center text-xs font-semibold text-[#0e3558]">
                              {product.name}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default Analytics;