import React, { useEffect, useMemo, useState } from "react";
import UserNavbar from "./UserNavbar";
import axiosInstance from "../../axiosInstance";

const OrdersListing = () => {
  const userId = localStorage.getItem("userId");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewedMap, setReviewedMap] = useState({});
  const [activeReviewItem, setActiveReviewItem] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    reviewText: "",
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  const formatPrice = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const activeReviewKey = useMemo(() => {
    if (!activeReviewItem) return "";
    return `${activeReviewItem.orderId}_${activeReviewItem.productId}`;
  }, [activeReviewItem]);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        closeReviewModal();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axiosInstance.get("/orders", {
        params: { userId },
      });

      const fetchedOrders = Array.isArray(res.data?.orders) ? res.data.orders : [];
      setOrders(fetchedOrders);

      const reviewStatusEntries = await Promise.all(
        fetchedOrders.flatMap((order) =>
          (order.items || []).map(async (item) => {
            const productId = item.productId?._id || item.productId || "";

            try {
              const reviewRes = await axiosInstance.get("/reviews/check", {
                params: {
                  userId: userId || "",
                  orderId: order._id,
                  productId,
                },
              });

              return [
                `${order._id}_${productId}`,
                reviewRes.data?.alreadyReviewed || false,
              ];
            } catch {
              return [`${order._id}_${productId}`, false];
            }
          })
        )
      );

      setReviewedMap(Object.fromEntries(reviewStatusEntries));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch orders.");
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (order, item) => {
    const productId = item.productId?._id || item.productId;
    const key = `${order._id}_${productId}`;

    if (reviewedMap[key]) return;

    setActiveReviewItem({
      orderId: order._id,
      productId,
      productName: item.name,
      productImage:
        item.imageUrl ||
        item.productId?.imageUrl ||
        "https://dummyimage.com/400x400/e5e7eb/111827&text=No+Image",
      brand: item.brand || item.productId?.brand || "Brand",
      customerName: order.customer?.fullName || "Anonymous User",
    });

    setReviewForm({
      rating: 0,
      reviewText: "",
    });
    setHoverRating(0);
  };

  const closeReviewModal = () => {
    if (submittingReview) return;
    setActiveReviewItem(null);
    setReviewForm({
      rating: 0,
      reviewText: "",
    });
    setHoverRating(0);
  };

  const handleSubmitReview = async () => {
    if (!activeReviewItem) return;

    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      alert("Please select a rating.");
      return;
    }

    if (!reviewForm.reviewText.trim()) {
      alert("Please write your review.");
      return;
    }

    try {
      setSubmittingReview(true);

      await axiosInstance.post("/reviews", {
        orderId: activeReviewItem.orderId,
        productId: activeReviewItem.productId,
        userId: userId || null,
        customerName: activeReviewItem.customerName,
        rating: reviewForm.rating,
        reviewText: reviewForm.reviewText.trim(),
      });

      setReviewedMap((prev) => ({
        ...prev,
        [activeReviewKey]: true,
      }));

      closeReviewModal();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = () => {
    const displayRating = hoverRating || reviewForm.rating;

    return (
      <div
        className="flex items-center gap-2"
        role="radiogroup"
        aria-label="Star rating"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= displayRating;

          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={reviewForm.rating === star}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() =>
                setReviewForm((prev) => ({ ...prev, rating: star }))
              }
              className={`text-3xl leading-none transition ${
                active ? "text-amber-400" : "text-slate-300"
              }`}
            >
              ★
            </button>
          );
        })}

        <span className="ml-2 text-sm font-semibold text-slate-500">
          {reviewForm.rating ? `${reviewForm.rating}/5` : "Select rating"}
        </span>
      </div>
    );
  };

  return (
    <>
      <UserNavbar />

      <main className="min-h-screen bg-[#f8f8f8] px-4 py-6 sm:px-6 lg:px-10">
        <section className="mx-auto max-w-6xl">
          <div className="mb-6">
            <h1 className="text-3xl font-black text-[#0e3558]">My Orders</h1>
            <p className="mt-2 text-sm text-slate-500">
              View your placed orders and submit one review per purchased product.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[24px] bg-white p-5 shadow-sm"
                >
                  <div className="h-5 w-44 animate-pulse rounded bg-slate-200"></div>
                  <div className="mt-4 h-24 animate-pulse rounded-[20px] bg-slate-200"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-[24px] bg-white px-6 py-12 text-center shadow-sm">
              <h2 className="text-2xl font-black text-[#0e3558]">No orders yet</h2>
              <p className="mt-2 text-sm text-slate-500">
                Place an order to see it listed here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="rounded-[24px] bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-base font-black text-[#0e3558] sm:text-lg">
                        Order #{order._id}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="rounded-full bg-[#eaf2f9] px-3 py-1 font-semibold text-[#0e3558]">
                        {order.orderStatus || "placed"}
                      </span>
                      <span className="font-bold text-slate-700">
                        {formatPrice(order.pricing?.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {(order.items || []).map((item, index) => {
                      const productId = item.productId?._id || item.productId;
                      const reviewKey = `${order._id}_${productId}`;
                      const alreadyReviewed = reviewedMap[reviewKey];

                      return (
                        <div
                          key={`${productId}_${index}`}
                          className="flex flex-col gap-4 rounded-[20px] bg-[#f7f8fa] p-4 md:flex-row md:items-center"
                        >
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[16px] bg-white">
                            <img
                              src={
                                item.imageUrl ||
                                item.productId?.imageUrl ||
                                "https://dummyimage.com/400x400/e5e7eb/111827&text=No+Image"
                              }
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                              {item.brand || item.productId?.brand || "Brand"}
                            </p>

                            <h3 className="mt-1 line-clamp-1 text-base font-black text-[#0e3558]">
                              {item.name}
                            </h3>

                            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 sm:text-sm">
                              <span>Qty: {item.quantity}</span>
                              <span>Unit: {formatPrice(item.unitPrice)}</span>
                              <span>Total: {formatPrice(item.lineTotal)}</span>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center">
                            {alreadyReviewed ? (
                              <span className="rounded-full bg-green-100 px-4 py-2 text-xs font-semibold text-green-700 sm:text-sm">
                                Review added
                              </span>
                            ) : (
                              <button
                                onClick={() => openReviewModal(order, item)}
                                className="rounded-2xl bg-[#0e3558] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#164a79] sm:text-sm"
                              >
                                Write Review
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {activeReviewItem && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px]"
            onClick={closeReviewModal}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Write review
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#0e3558]">
                    {activeReviewItem.productName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {activeReviewItem.brand}
                  </p>
                </div>

                <button
                  onClick={closeReviewModal}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-500 transition hover:bg-slate-200"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 flex items-center gap-4 rounded-[20px] bg-[#f7f8fa] p-4">
                <div className="h-16 w-16 overflow-hidden rounded-[16px] bg-white">
                  <img
                    src={activeReviewItem.productImage}
                    alt={activeReviewItem.productName}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0e3558]">
                    {activeReviewItem.productName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Share your experience with this product.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-3 block text-sm font-semibold text-slate-600">
                  Your rating
                </label>
                {renderStars()}
              </div>

              <div className="mt-6">
                <label className="mb-3 block text-sm font-semibold text-slate-600">
                  Your review
                </label>
                <textarea
                  rows={5}
                  value={reviewForm.reviewText}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      reviewText: e.target.value,
                    }))
                  }
                  placeholder="Write what you liked or disliked about the product..."
                  className="w-full resize-none rounded-[20px] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#0e3558]"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={closeReviewModal}
                  disabled={submittingReview}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="rounded-2xl bg-[#0e3558] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#164a79] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default OrdersListing;