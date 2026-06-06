import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import UserNavbar from "./UserNavbar";
import axiosInstance from "../../axiosInstance";

const CartCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem("userId");

  const cartItems = Array.isArray(location.state?.cartItems)
    ? location.state.cartItems
    : [];

  const [placingOrder, setPlacingOrder] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const formatPrice = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const product = item.productId;
      const price =
        product?.discountPrice && product.discountPrice > 0
          ? product.discountPrice
          : product?.price || 0;

      return sum + price * (item.quantity || 1);
    }, 0);
  }, [cartItems]);

  const gstPercent = 18;
  const gstAmount = useMemo(() => {
    return Math.round(subtotal * (gstPercent / 100));
  }, [subtotal]);

  const shippingCharge = 0;
  const totalAmount = subtotal + gstAmount + shippingCharge;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!cartItems.length) {
      alert("No cart items found for checkout.");
      return;
    }

    try {
      setPlacingOrder(true);

      const payload = {
        userId,
        items: cartItems.map((item) => ({
          productId: item.productId?._id,
          quantity: item.quantity,
        })),
        customer: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
        },
        shippingAddress: {
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
        },
      };

      const res = await axiosInstance.post("/orders", payload);

      alert(res.data?.message || "Order placed successfully.");
      navigate("/user/orders");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to place order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!cartItems.length) {
    return (
      <>
        <UserNavbar />
        <main className="min-h-screen bg-[#f8f8f8] px-4 py-6 sm:px-6 lg:px-10">
          <section className="mx-auto max-w-4xl rounded-[32px] bg-white px-6 py-16 text-center shadow-sm">
            <h1 className="text-3xl font-black text-[#0e3558]">
              No checkout items found
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Please go back to your cart and continue from there.
            </p>
            <button
              onClick={() => navigate("/user/cart")}
              className="mt-6 rounded-2xl bg-[#0e3558] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#164a79]"
            >
              Back to Cart
            </button>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <UserNavbar />

      <main className="min-h-screen bg-[#f8f8f8] px-4 py-6 sm:px-6 lg:px-10">
        <section className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h1 className="text-3xl font-black text-[#0e3558]">Checkout</h1>
            <p className="mt-2 text-sm text-slate-500">
              Enter your delivery details and place your order securely.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <form
              onSubmit={handlePlaceOrder}
              className="rounded-[32px] bg-white p-6 shadow-sm sm:p-8"
            >
              <div>
                <h2 className="text-2xl font-black text-[#0e3558]">
                  Customer Details
                </h2>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Full name"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0e3558]"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email address"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0e3558]"
                  />
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0e3558] sm:col-span-2"
                    required
                  />
                </div>
              </div>

              <div className="mt-10">
                <h2 className="text-2xl font-black text-[#0e3558]">
                  Shipping Address
                </h2>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    name="addressLine1"
                    value={form.addressLine1}
                    onChange={handleChange}
                    placeholder="Address line 1"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0e3558] sm:col-span-2"
                    required
                  />
                  <input
                    type="text"
                    name="addressLine2"
                    value={form.addressLine2}
                    onChange={handleChange}
                    placeholder="Address line 2 (optional)"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0e3558] sm:col-span-2"
                  />
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0e3558]"
                    required
                  />
                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="State"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0e3558]"
                    required
                  />
                  <input
                    type="text"
                    name="postalCode"
                    value={form.postalCode}
                    onChange={handleChange}
                    placeholder="Postal code"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0e3558]"
                    required
                  />
                  <input
                    type="text"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    placeholder="Country"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0e3558]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={placingOrder}
                className="mt-10 w-full rounded-2xl bg-[#0e3558] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#164a79] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {placingOrder ? "Placing Order..." : "Place Order"}
              </button>
            </form>

            <aside className="h-fit rounded-[32px] bg-white p-6 shadow-sm lg:sticky lg:top-28">
              <h2 className="text-2xl font-black text-[#0e3558]">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">
                {cartItems.map((item) => {
                  const product = item.productId;
                  if (!product) return null;

                  const price =
                    product.discountPrice && product.discountPrice > 0
                      ? product.discountPrice
                      : product.price;

                  return (
                    <div
                      key={item._id}
                      className="flex gap-3 rounded-[22px] bg-[#f7f8fa] p-3"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[16px] bg-white">
                        <img
                          src={
                            product.imageUrl ||
                            "https://dummyimage.com/800x800/e5e7eb/111827&text=No+Image"
                          }
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-bold text-[#0e3558]">
                          {product.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Qty: {item.quantity}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-orange-600">
                          {formatPrice(price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-700">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>GST ({gstPercent}%)</span>
                  <span className="font-semibold text-slate-700">
                    {formatPrice(gstAmount)}
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
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
};

export default CartCheckout;