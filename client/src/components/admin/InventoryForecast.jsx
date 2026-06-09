import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../axiosInstance";
import AdminNavbar from "./AdminNavbar";

const TrendBadge = ({ action }) => {
  const map = {
    increase: {
      label: "Increase",
      className: "bg-emerald-100 text-emerald-700",
      icon: "↗",
    },
    decrease: {
      label: "Decrease",
      className: "bg-red-100 text-red-700",
      icon: "↘",
    },
    keep: {
      label: "Keep",
      className: "bg-slate-100 text-slate-700",
      icon: "→",
    },
  };

  const item = map[action] || map.keep;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${item.className}`}>
      <span className="text-sm">{item.icon}</span>
      {item.label}
    </span>
  );
};

const RiskBadge = ({ riskLevel }) => {
  const map = {
    high: "bg-red-100 text-red-700",
    medium: "bg-orange-100 text-orange-700",
    low: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        map[riskLevel] || "bg-slate-100 text-slate-700"
      }`}
    >
      {(riskLevel || "unknown").toUpperCase()}
    </span>
  );
};

const TinySparkline = ({ data = [] }) => {
  const width = 150;
  const height = 44;
  const padding = 6;
  const values = (data || []).map((item) => Number(item.units || 0));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const points = values
    .map((value, index) => {
      const x =
        padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1);
      const y =
        height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `${padding},${height - padding} ${points} ${
    width - padding
  },${height - padding}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-12 w-40"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#sparkFill)" />
      <polyline
        points={points}
        fill="none"
        stroke="#f97316"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const InventoryForecast = () => {
  const navigate = useNavigate();
  const adminId =
    localStorage.getItem("userId") || localStorage.getItem("adminId") || "";

  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("risk");

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      setError("");

      if (!adminId) {
        setInsights([]);
        setError("Admin ID not found. Please login again.");
        return;
      }

      const response = await axiosInstance.get(`/admin/inventory-agent/${adminId}`);
      const forecastData = Array.isArray(response.data?.insights)
        ? response.data.insights
        : [];

      setInsights(forecastData);
    } catch (error) {
      console.error("Fetch forecast error:", error);
      setInsights([]);
      setError(error.response?.data?.error || "Failed to fetch forecast insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecasts();
  }, [adminId]);

  const handleApplyThreshold = async (productId) => {
    try {
      setApplyingId(productId);

      const response = await axiosInstance.post(
        `/admin/inventory-agent/${productId}/apply-threshold`,
        { adminId }
      );

      const updatedProduct = response.data?.product;
      const updatedRecommendation = response.data?.recommendation;
      const updatedReasoning = response.data?.reasoning;

      setInsights((prev) =>
        prev.map((item) =>
          String(item.product?._id || item.productId) === String(productId)
            ? {
                ...item,
                product: {
                  ...item.product,
                  ...updatedProduct,
                },
                recommendation: {
                  ...item.recommendation,
                  ...updatedRecommendation,
                  currentThreshold:
                    updatedProduct?.minimumThresholdCount ??
                    updatedRecommendation?.currentThreshold ??
                    item.recommendation?.currentThreshold,
                },
                reasoning: updatedReasoning || item.reasoning,
              }
            : item
        )
      );

      alert("Recommended threshold applied successfully");
    } catch (error) {
      console.error("Apply threshold error:", error);
      alert(error.response?.data?.error || "Failed to apply threshold");
    } finally {
      setApplyingId(null);
    }
  };

  const filteredInsights = useMemo(() => {
    const riskRank = { high: 3, medium: 2, low: 1 };

    let data = [...insights];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((item) => {
        const product = item.product || {};
        return (
          product.name?.toLowerCase().includes(q) ||
          product.brand?.toLowerCase().includes(q) ||
          product.category?.toLowerCase().includes(q) ||
          product.sku?.toLowerCase().includes(q)
        );
      });
    }

    if (riskFilter !== "all") {
      data = data.filter(
        (item) => item.recommendation?.riskLevel === riskFilter
      );
    }

    if (actionFilter !== "all") {
      data = data.filter(
        (item) => item.recommendation?.action === actionFilter
      );
    }

    data.sort((a, b) => {
      if (sortBy === "demand") {
        return (
          Number(b.metrics?.predictedNext7Days || 0) -
          Number(a.metrics?.predictedNext7Days || 0)
        );
      }

      if (sortBy === "threshold") {
        return (
          Math.abs(Number(b.recommendation?.suggestedChange || 0)) -
          Math.abs(Number(a.recommendation?.suggestedChange || 0))
        );
      }

      return (
        (riskRank[b.recommendation?.riskLevel] || 0) -
          (riskRank[a.recommendation?.riskLevel] || 0) ||
        Number(b.metrics?.predictedNext7Days || 0) -
          Number(a.metrics?.predictedNext7Days || 0)
      );
    });

    return data;
  }, [insights, search, riskFilter, actionFilter, sortBy]);

  const overview = useMemo(() => {
    const highRisk = insights.filter(
      (item) => item.recommendation?.riskLevel === "high"
    ).length;

    const increaseCount = insights.filter(
      (item) => item.recommendation?.action === "increase"
    ).length;

    const decreaseCount = insights.filter(
      (item) => item.recommendation?.action === "decrease"
    ).length;

    const avgPredictedDemand =
      insights.length > 0
        ? Math.round(
            insights.reduce(
              (sum, item) => sum + Number(item.metrics?.predictedNext7Days || 0),
              0
            ) / insights.length
          )
        : 0;

    return {
      total: insights.length,
      highRisk,
      increaseCount,
      decreaseCount,
      avgPredictedDemand,
    };
  }, [insights]);

  return (
    <>
      <AdminNavbar />

      <div className="min-h-screen bg-[#f5f5f5] px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <button
                onClick={() => navigate("/admin/inventory")}
                className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-700"
              >
                ← Back to Inventory
              </button>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-500">
                Forecast Center
              </p>
              <h1 className="mt-2 text-4xl font-extrabold text-[#0e3558]">
                Demand Prediction & Threshold Insights
              </h1>
              <p className="mt-3 max-w-3xl text-slate-500">
                Practical demand forecast based on product orders, stock pressure,
                threshold movement, and AI-generated inventory insights for faster
                restocking decisions.
              </p>
            </div>

            <button
              onClick={fetchForecasts}
              className="rounded-2xl bg-[#0e3558] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#164a79]"
            >
              Refresh Forecast
            </button>
          </div>

          {loading ? (
            <div className="rounded-[28px] border border-white/70 bg-white/70 p-8 shadow-2xl shadow-slate-300/20 backdrop-blur-sm">
              <p className="text-slate-500">Loading forecast insights...</p>
            </div>
          ) : error ? (
            <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 shadow-2xl shadow-red-100/50">
              <p className="font-semibold text-red-600">{error}</p>
            </div>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-[24px] bg-[#0e3558] p-6 text-white shadow-xl shadow-slate-300/20">
                  <p className="text-sm uppercase tracking-[0.18em] text-orange-200">
                    Forecasted Products
                  </p>
                  <h2 className="mt-4 text-4xl font-extrabold">{overview.total}</h2>
                </div>

                <div className="rounded-[24px] bg-white p-6 shadow-xl shadow-slate-300/20">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                    High Risk
                  </p>
                  <h2 className="mt-4 text-4xl font-extrabold text-red-500">
                    {overview.highRisk}
                  </h2>
                </div>

                <div className="rounded-[24px] bg-white p-6 shadow-xl shadow-slate-300/20">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                    Increase Threshold
                  </p>
                  <h2 className="mt-4 text-4xl font-extrabold text-emerald-500">
                    {overview.increaseCount}
                  </h2>
                </div>

                <div className="rounded-[24px] bg-white p-6 shadow-xl shadow-slate-300/20">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                    Decrease Threshold
                  </p>
                  <h2 className="mt-4 text-4xl font-extrabold text-orange-500">
                    {overview.decreaseCount}
                  </h2>
                </div>

                <div className="rounded-[24px] bg-white p-6 shadow-xl shadow-slate-300/20">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                    Avg 7-Day Demand
                  </p>
                  <h2 className="mt-4 text-4xl font-extrabold text-[#0e3558]">
                    {overview.avgPredictedDemand}
                  </h2>
                </div>
              </div>

              <div className="mb-6 rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-2xl shadow-slate-300/20 backdrop-blur-sm">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Search Product
                    </label>
                    <input
                      type="text"
                      placeholder="Search by name, brand, SKU..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Risk Filter
                    </label>
                    <select
                      value={riskFilter}
                      onChange={(e) => setRiskFilter(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    >
                      <option value="all">All Risks</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Threshold Action
                    </label>
                    <select
                      value={actionFilter}
                      onChange={(e) => setActionFilter(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    >
                      <option value="all">All Actions</option>
                      <option value="increase">Increase</option>
                      <option value="decrease">Decrease</option>
                      <option value="keep">Keep</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    >
                      <option value="risk">Risk Priority</option>
                      <option value="demand">Predicted Demand</option>
                      <option value="threshold">Threshold Change</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/70 shadow-2xl shadow-slate-300/20 backdrop-blur-sm">
                {filteredInsights.length === 0 ? (
                  <div className="p-8 text-slate-500">
                    No forecast insights found for the selected filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-[1600px] w-full">
                      <thead className="bg-[#0e3558] text-white">
                        <tr>
                          <th className="px-4 py-4 text-left text-sm font-semibold">
                            Product
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold">
                            Demand Trend
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold">
                            Current Stock
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold">
                            Current Threshold
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold">
                            Recommended
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold">
                            Action
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold">
                            Risk
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold">
                            7-Day Demand
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold">
                            14-Day Demand
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold">
                            Insight
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-semibold">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredInsights.map((item) => {
                          const product = item.product || {};
                          const recommendation = item.recommendation || {};
                          const metrics = item.metrics || {};
                          const currentStock = Number(product.availabilityCount || 0);
                          const currentThreshold = Number(
                            product.minimumThresholdCount || 0
                          );
                          const recommendedThreshold = Number(
                            recommendation.recommendedThreshold || 0
                          );
                          const thresholdDelta =
                            recommendedThreshold - currentThreshold;
                          const isCritical =
                            recommendation.riskLevel === "high";

                          return (
                            <tr
                              key={product._id}
                              className={`border-b border-slate-200 ${
                                isCritical ? "bg-red-50/60" : "bg-white/70"
                              }`}
                            >
                              <td className="px-4 py-5 align-top">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={
                                      product.imageUrl ||
                                      "https://dummyimage.com/100x100/e5e7eb/111827&text=No+Image"
                                    }
                                    alt={product.name}
                                    className="h-14 w-14 rounded-xl object-cover"
                                  />
                                  <div className="max-w-[220px]">
                                    <p className="font-semibold text-[#0e3558]">
                                      {product.name}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                      {product.brand || "No brand"}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {product.sku || "No SKU"}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-5 align-top">
                                <div className="flex min-w-[170px] flex-col gap-2">
                                  <TinySparkline data={metrics.recentDailyDemand || []} />
                                  <p className="text-xs text-slate-500">
                                    Last 30 days movement
                                  </p>
                                </div>
                              </td>

                              <td className="px-4 py-5 align-top text-sm font-semibold text-slate-700">
                                {currentStock}
                              </td>

                              <td className="px-4 py-5 align-top text-sm font-semibold text-slate-700">
                                {currentThreshold}
                              </td>

                              <td className="px-4 py-5 align-top">
                                <div className="flex min-w-[120px] flex-col">
                                  <span className="text-base font-bold text-[#0e3558]">
                                    {recommendedThreshold}
                                  </span>
                                  <span
                                    className={`text-xs font-semibold ${
                                      thresholdDelta > 0
                                        ? "text-emerald-600"
                                        : thresholdDelta < 0
                                        ? "text-red-600"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {thresholdDelta > 0
                                      ? `+${thresholdDelta} suggested`
                                      : thresholdDelta < 0
                                      ? `${thresholdDelta} suggested`
                                      : "No change"}
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-5 align-top">
                                <TrendBadge action={recommendation.action} />
                              </td>

                              <td className="px-4 py-5 align-top">
                                <RiskBadge riskLevel={recommendation.riskLevel} />
                              </td>

                              <td className="px-4 py-5 align-top">
                                <div className="min-w-[110px]">
                                  <p className="text-base font-bold text-[#0e3558]">
                                    {Number(metrics.predictedNext7Days || 0)}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    predicted units
                                  </p>
                                </div>
                              </td>

                              <td className="px-4 py-5 align-top">
                                <div className="min-w-[110px]">
                                  <p className="text-base font-bold text-[#0e3558]">
                                    {Number(metrics.predictedNext14Days || 0)}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    projected units
                                  </p>
                                </div>
                              </td>

                              <td className="px-4 py-5 align-top">
                                <div className="min-w-[360px] max-w-[420px] rounded-2xl bg-slate-50 p-4">
                                  <p className="text-sm leading-6 text-slate-600">
                                    {item.reasoning || "No insight available."}
                                  </p>
                                </div>
                              </td>

                              <td className="px-4 py-5 align-top">
                                <button
                                  onClick={() => handleApplyThreshold(product._id)}
                                  disabled={applyingId === product._id}
                                  className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {applyingId === product._id
                                    ? "Applying..."
                                    : "Apply Threshold"}
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

export default InventoryForecast;