import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserNavbar from "./UserNavbar";
import axiosInstance from "../../axiosInstance";

const Cart = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");

  const formatPrice = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const fetchCart = async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axiosInstance.get("/cart", {
        params: { userId },
      });

      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch (error) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleQuantityChange = async (itemId, nextQty) => {
    if (nextQty < 1) return;

    try {
      setActionLoadingId(itemId);

      const res = await axiosInstance.patch(`/cart/${itemId}`, {
        quantity: nextQty,
      });

      setItems((prev) =>
        prev.map((item) => (item._id === itemId ? res.data.item : item))
      );
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update quantity.");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleRemove = async (itemId) => {
    try {
      setActionLoadingId(itemId);
      await axiosInstance.delete(`/cart/${itemId}`);
      setItems((prev) => prev.filter((item) => item._id !== itemId));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to remove item.");
    } finally {
      setActionLoadingId("");
    }
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const product = item.productId;
      const price =
        product?.discountPrice && product.discountPrice > 0
          ? product.discountPrice
          : product?.price || 0;

      return sum + price * (item.quantity || 1);
    }, 0);
  }, [items]);

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [items]);

  const handleCheckout = () => {
    if (!items.length) return;

    navigate("/user/cart-checkout", {
      state: {
        cartItems: items,
      },
    });
  };

  return (
    <>
      <UserNavbar />

      <main className="min-h-screen bg-[#f8f8f8] px-4 py-6 sm:px-6 lg:px-10">
        <section className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h1 className="text-3xl font-black text-[#0e3558]">My Cart</h1>
            <p className="mt-2 text-sm text-slate-500">
              Review your selected items and update quantity before checkout.
            </p>
          </div>

          {loading ? (
            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-[28px] bg-white p-4 shadow-sm"
                  >
                    <div className="h-28 animate-pulse rounded-[20px] bg-slate-200"></div>
                  </div>
                ))}
              </div>

              <div className="rounded-[28px] bg-white p-6 shadow-sm">
                <div className="h-6 w-32 animate-pulse rounded bg-slate-200"></div>
                <div className="mt-4 h-4 animate-pulse rounded bg-slate-200"></div>
                <div className="mt-3 h-4 animate-pulse rounded bg-slate-200"></div>
                <div className="mt-6 h-12 animate-pulse rounded-2xl bg-slate-200"></div>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[28px] bg-white px-6 py-14 text-center shadow-sm">
              <h2 className="text-2xl font-black text-[#0e3558]">
                Your cart is empty
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Add products to your cart to see them here.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-4">
                {items.map((item) => {
                  const product = item.productId;
                  if (!product) return null;

                  const price =
                    product.discountPrice && product.discountPrice > 0
                      ? product.discountPrice
                      : product.price;

                  const lineTotal = price * (item.quantity || 1);

                  return (
                    <div
                      key={item._id}
                      className="rounded-[28px] bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 md:flex-row">
                        <button
                          onClick={() => navigate(`/user/product/${product._id}`)}
                          className="h-28 w-full shrink-0 overflow-hidden rounded-[20px] bg-[#f4f6f8] md:w-32"
                        >
                          <img
                            src={
                              product.imageUrl ||
                              "https://dummyimage.com/800x800/e5e7eb/111827&text=No+Image"
                            }
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {product.brand || "Brand"}
                            {product.category ? ` • ${product.category}` : ""}
                          </p>

                          <h3 className="mt-1 line-clamp-1 text-lg font-black text-[#0e3558]">
                            {product.name}
                          </h3>

                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                            {product.shortDescription || "No short description available."}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">
                              {formatPrice(price)}
                            </span>

                            <span className="rounded-full bg-[#eaf2f9] px-3 py-1 text-xs font-semibold text-[#0e3558]">
                              Total: {formatPrice(lineTotal)}
                            </span>
                          </div>
                        </div>

                        <div className="flex min-w-[170px] flex-col justify-between gap-4">
                          <div className="flex items-center justify-center rounded-2xl bg-[#f7f8fa] p-2">
                            <button
                              onClick={() =>
                                handleQuantityChange(item._id, item.quantity - 1)
                              }
                              disabled={actionLoadingId === item._id || item.quantity <= 1}
                              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              −
                            </button>

                            <span className="w-12 text-center text-sm font-bold text-[#0e3558]">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                handleQuantityChange(item._id, item.quantity + 1)
                              }
                              disabled={actionLoadingId === item._id}
                              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemove(item._id)}
                            disabled={actionLoadingId === item._id}
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {actionLoadingId === item._id ? "Please wait..." : "Remove"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <aside className="h-fit rounded-[28px] bg-white p-6 shadow-sm lg:sticky lg:top-28">
                <h2 className="text-2xl font-black text-[#0e3558]">Summary</h2>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Total Items</span>
                    <span className="font-semibold text-slate-700">{totalItems}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-700">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Shipping</span>
                    <span className="font-semibold text-green-600">Free</span>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-slate-600">
                        Total
                      </span>
                      <span className="text-2xl font-black text-[#0e3558]">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="mt-6 w-full rounded-2xl bg-[#0e3558] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#164a79]"
                >
                  Proceed to Checkout
                </button>
              </aside>
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default Cart;