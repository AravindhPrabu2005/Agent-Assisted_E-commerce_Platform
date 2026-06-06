import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../axiosInstance";
import AdminNavbar from "./AdminNavbar";

const Orders = () => {
  const adminId =
    localStorage.getItem("userId") || localStorage.getItem("adminId") || "";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get(`/admin/orders/${adminId}`);

      const orderData = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.orders)
        ? response.data.orders
        : [];

      setOrders(orderData);
    } catch (err) {
      console.error("Failed to fetch admin orders:", err);
      setError(err.response?.data?.error || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminId) {
      setError("Admin not found.");
      setLoading(false);
      return;
    }

    fetchOrders();
  }, [adminId]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClasses = (status) => {
    const normalized = (status || "").toLowerCase();

    if (normalized === "delivered") {
      return "bg-green-50 text-green-700 border border-green-200";
    }

    if (normalized === "shipped") {
      return "bg-blue-50 text-blue-700 border border-blue-200";
    }

    if (normalized === "cancelled") {
      return "bg-red-50 text-red-700 border border-red-200";
    }

    return "bg-amber-50 text-amber-700 border border-amber-200";
  };

  const getPaymentClasses = (status) => {
    const normalized = (status || "").toLowerCase();

    if (normalized === "paid") {
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    }

    if (normalized === "failed") {
      return "bg-red-50 text-red-700 border border-red-200";
    }

    return "bg-slate-100 text-slate-600 border border-slate-200";
  };

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;

    return orders.filter(
      (order) => (order.orderStatus || "").toLowerCase() === statusFilter
    );
  }, [orders, statusFilter]);

  const summary = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order?.pricing?.totalAmount || 0),
      0
    );
    const totalItems = orders.reduce(
      (sum, order) =>
        sum +
        (Array.isArray(order.items)
          ? order.items.reduce((acc, item) => acc + Number(item.quantity || 0), 0)
          : 0),
      0
    );
    const pendingOrders = orders.filter(
      (order) => (order.orderStatus || "").toLowerCase() === "placed"
    ).length;
    const shippedOrders = orders.filter(
      (order) => (order.orderStatus || "").toLowerCase() === "shipped"
    ).length;
    const deliveredOrders = orders.filter(
      (order) => (order.orderStatus || "").toLowerCase() === "delivered"
    ).length;

    return {
      totalOrders,
      totalRevenue,
      totalItems,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
    };
  }, [orders]);

  return (
    <>
      <AdminNavbar />

      <main className="min-h-screen bg-[linear-gradient(180deg,#f7f8fb_0%,#eef2f7_100%)] px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">
                Order Control
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-[#0e3558]">
                Admin Orders
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                View and monitor orders that include products belonging to this admin.
              </p>
            </div>

            <button
              onClick={fetchOrders}
              className="rounded-2xl bg-[#0e3558] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#164a79]"
            >
              Refresh Orders
            </button>
          </div>

          {loading ? (
            <div className="rounded-[28px] bg-white p-8 shadow-xl">
              <p className="text-slate-500">Loading orders...</p>
            </div>
          ) : error ? (
            <div className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-8">
              <p className="font-semibold text-red-600">{error}</p>
            </div>
          ) : (
            <>
              <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-[28px] bg-white p-6 shadow-xl shadow-slate-300/20">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Total Orders
                  </p>
                  <h2 className="mt-3 text-4xl font-black text-[#0e3558]">
                    {summary.totalOrders}
                  </h2>
                </div>

                <div className="rounded-[28px] bg-white p-6 shadow-xl shadow-slate-300/20">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Revenue
                  </p>
                  <h2 className="mt-3 text-4xl font-black text-[#0e3558]">
                    {formatCurrency(summary.totalRevenue)}
                  </h2>
                </div>

                <div className="rounded-[28px] bg-white p-6 shadow-xl shadow-slate-300/20">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Items Sold
                  </p>
                  <h2 className="mt-3 text-4xl font-black text-orange-500">
                    {summary.totalItems}
                  </h2>
                </div>

                <div className="rounded-[28px] bg-white p-6 shadow-xl shadow-slate-300/20">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Pending
                  </p>
                  <h2 className="mt-3 text-4xl font-black text-amber-500">
                    {summary.pendingOrders}
                  </h2>
                </div>

                <div className="rounded-[28px] bg-white p-6 shadow-xl shadow-slate-300/20">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Delivered
                  </p>
                  <h2 className="mt-3 text-4xl font-black text-green-600">
                    {summary.deliveredOrders}
                  </h2>
                </div>
              </section>

              <section className="mt-6 rounded-[30px] bg-white p-6 shadow-2xl shadow-slate-300/20">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
                      Order Feed
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-[#0e3558]">
                      Seller-Specific Orders
                    </h2>
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 outline-none"
                  >
                    <option value="all">All statuses</option>
                    <option value="placed">Placed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-100">
                  <div className="grid grid-cols-[1.3fr_1fr_0.8fr_0.8fr_0.7fr] bg-slate-50 px-4 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    <p>Customer</p>
                    <p>Items</p>
                    <p>Status</p>
                    <p>Payment</p>
                    <p className="text-right">Amount</p>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {filteredOrders.length === 0 ? (
                      <div className="px-4 py-8 text-sm text-slate-500">
                        No orders found for this admin.
                      </div>
                    ) : (
                      filteredOrders.map((order) => (
                        <div
                          key={order._id}
                          className="grid grid-cols-1 gap-4 px-4 py-5 md:grid-cols-[1.3fr_1fr_0.8fr_0.8fr_0.7fr]"
                        >
                          <div>
                            <p className="font-semibold text-[#0e3558]">
                              {order.customer?.fullName || "Customer"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {order.customer?.phone || "No phone"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>

                          <div className="space-y-2">
                            {Array.isArray(order.items) && order.items.length > 0 ? (
                              order.items.slice(0, 2).map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <img
                                    src={
                                      item.imageUrl ||
                                      "https://dummyimage.com/100x100/e5e7eb/111827&text=No+Image"
                                    }
                                    alt={item.name || "Product"}
                                    className="h-9 w-9 rounded-lg object-cover"
                                  />
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-700">
                                      {item.name || "Product"}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      Qty: {item.quantity || 0}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-slate-400">No items</p>
                            )}

                            {Array.isArray(order.items) && order.items.length > 2 && (
                              <p className="text-xs font-medium text-orange-500">
                                +{order.items.length - 2} more items
                              </p>
                            )}
                          </div>

                          <div>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                                order.orderStatus
                              )}`}
                            >
                              {order.orderStatus || "placed"}
                            </span>
                          </div>

                          <div>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getPaymentClasses(
                                order.payment?.status
                              )}`}
                            >
                              {order.payment?.status || "pending"}
                            </span>
                          </div>

                          <div className="text-right">
                            <p className="text-base font-bold text-[#0e3558]">
                              {formatCurrency(order.pricing?.totalAmount || 0)}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {order.items?.reduce(
                                (sum, item) => sum + Number(item.quantity || 0),
                                0
                              ) || 0}{" "}
                              units
                            </p>
                          </div>
                        </div>
                      ))
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

export default Orders;