import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import UserNavbar from "./UserNavbar";
import axiosInstance from "../../axiosInstance";

const Order = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const userId = localStorage.getItem("userId");

  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!location.state?.product);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [successOrder, setSuccessOrder] = useState(null);

  const [quantity, setQuantity] = useState(1);

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

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id || product) return;

      try {
        setLoading(true);
        setError("");
        const res = await axiosInstance.get(`/products/${id}`);
        const productData = res.data?.product || res.data;
        setProduct(productData);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load product.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, product]);

  const formatPrice = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    return product.discountPrice && product.discountPrice > 0
      ? product.discountPrice
      : product.price;
  }, [product]);

  const maxQty = useMemo(() => {
    return Math.max(1, product?.availabilityCount || 1);
  }, [product]);

  const subtotal = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);
  const gstPercent = 18;
  const gstAmount = useMemo(() => (subtotal * gstPercent) / 100, [subtotal]);
  const shippingCharge = 0;
  const totalAmount = useMemo(
    () => subtotal + gstAmount + shippingCharge,
    [subtotal, gstAmount]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const incrementQty = () => {
    setQuantity((prev) => Math.min(prev + 1, maxQty));
  };

  const decrementQty = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  };

  const validateForm = () => {
    if (
      !form.fullName.trim() ||
      !form.phone.trim() ||
      !form.addressLine1.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.postalCode.trim()
    ) {
      return "Please fill all required fields.";
    }

    if (!product || quantity < 1) {
      return "Invalid product or quantity.";
    }

    if (quantity > (product.availabilityCount || 0)) {
      return "Selected quantity exceeds available stock.";
    }

    return "";
  };

  const handlePlaceOrder = async () => {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setPlacingOrder(true);
      setError("");

      const payload = {
        userId: userId || null,
        items: [
          {
            productId: product._id,
            quantity,
          },
        ],
        customer: {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        },
        shippingAddress: {
          addressLine1: form.addressLine1.trim(),
          addressLine2: form.addressLine2.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim() || "India",
        },
      };

      const res = await axiosInstance.post("/orders", payload);

      setSuccessOrder(res.data?.order || null);

      setProduct((prev) =>
        prev
          ? {
              ...prev,
              availabilityCount: Math.max(
                (prev.availabilityCount || 0) - quantity,
                0
              ),
            }
          : prev
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <>
        <UserNavbar />
        <main className="min-h-screen bg-[#f8f8f8] px-6 py-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[32px] bg-white p-8 shadow-sm">
              <div className="h-[520px] animate-pulse rounded-[28px] bg-slate-200"></div>
            </div>
            <div className="rounded-[32px] bg-white p-8 shadow-sm">
              <div className="h-10 animate-pulse rounded bg-slate-200"></div>
              <div className="mt-4 h-10 animate-pulse rounded bg-slate-200"></div>
              <div className="mt-4 h-10 animate-pulse rounded bg-slate-200"></div>
              <div className="mt-4 h-40 animate-pulse rounded bg-slate-200"></div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error && !product) {
    return (
      <>
        <UserNavbar />
        <main className="min-h-screen bg-[#f8f8f8] px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-3xl rounded-[32px] border border-red-200 bg-red-50 px-6 py-10 text-center">
            <h2 className="text-2xl font-bold text-red-600">
              Unable to load order page
            </h2>
            <p className="mt-3 text-sm text-red-500">{error}</p>
          </div>
        </main>
      </>
    );
  }

  if (successOrder) {
    return (
      <>
        <UserNavbar />
        <main className="min-h-screen bg-[#f8f8f8] px-6 py-8 lg:px-10">
          <section className="mx-auto max-w-3xl rounded-[32px] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
              ✓
            </div>

            <h1 className="mt-6 text-3xl font-black text-[#0e3558]">
              Payment successful
            </h1>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              Your order has been placed and inventory has been updated.
            </p>

            <div className="mt-8 rounded-[24px] bg-[#f7f8fa] p-6 text-left">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-sm font-semibold text-slate-500">
                  Order ID
                </span>
                <span className="text-sm font-bold text-slate-700">
                  {successOrder._id}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-sm font-semibold text-slate-500">
                  Transaction Ref
                </span>
                <span className="text-sm font-bold text-slate-700">
                  {successOrder.payment?.transactionRef}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500">
                  Amount Paid
                </span>
                <span className="text-lg font-black text-[#0e3558]">
                  {formatPrice(successOrder.pricing?.totalAmount)}
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate(`/user/product/${product._id}`)}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              >
                Back to Product
              </button>

              <button
                onClick={() => navigate("/user/home")}
                className="rounded-2xl bg-[#0e3558] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#164a79]"
              >
                Continue Shopping
              </button>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <UserNavbar />

      <main className="min-h-screen bg-[#f8f8f8] px-6 py-8 lg:px-10">
        <section className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-[32px] bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Order item
              </p>

              <div className="mt-4 flex gap-4">
                <div className="h-28 w-28 overflow-hidden rounded-[24px] bg-[#f4f6f8]">
                  <img
                    src={
                      product?.imageUrl ||
                      "https://dummyimage.com/800x800/e5e7eb/111827&text=No+Image"
                    }
                    alt={product?.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {product?.brand || "Brand"}
                  </p>
                  <h1 className="mt-2 text-2xl font-black leading-tight text-[#0e3558]">
                    {product?.name}
                  </h1>
                  <p className="mt-2 text-sm text-slate-500">
                    {product?.shortDescription ||
                      "No short description available."}
                  </p>
                  <p className="mt-3 text-lg font-black text-[#0e3558]">
                    {formatPrice(unitPrice)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-[#0e3558]">
                Delivery details
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Full name *"
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#0e3558]"
                />
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone number *"
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#0e3558]"
                />
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email address"
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#0e3558] sm:col-span-2"
                />
                <input
                  name="addressLine1"
                  value={form.addressLine1}
                  onChange={handleChange}
                  placeholder="Address line 1 *"
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#0e3558] sm:col-span-2"
                />
                <input
                  name="addressLine2"
                  value={form.addressLine2}
                  onChange={handleChange}
                  placeholder="Address line 2"
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#0e3558] sm:col-span-2"
                />
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City *"
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#0e3558]"
                />
                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="State *"
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#0e3558]"
                />
                <input
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  placeholder="Postal code *"
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#0e3558]"
                />
                <input
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="Country"
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#0e3558]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[32px] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-[#0e3558]">
                Order summary
              </h2>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500">
                  Quantity
                </span>
                <div className="flex items-center gap-3 rounded-full bg-[#f7f8fa] px-3 py-2">
                  <button
                    onClick={decrementQty}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-700 shadow-sm"
                  >
                    -
                  </button>
                  <span className="min-w-6 text-center text-sm font-bold text-[#0e3558]">
                    {quantity}
                  </span>
                  <button
                    onClick={incrementQty}
                    disabled={quantity >= maxQty}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-700 shadow-sm disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Available stock: {product?.availabilityCount ?? 0}
              </p>

              <div className="mt-6 space-y-4 rounded-[24px] bg-[#f7f8fa] p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Unit price</span>
                  <span className="font-semibold text-slate-700">
                    {formatPrice(unitPrice)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-700">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">GST ({gstPercent}%)</span>
                  <span className="font-semibold text-slate-700">
                    {formatPrice(gstAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Shipping</span>
                  <span className="font-semibold text-slate-700">
                    {formatPrice(shippingCharge)}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-slate-700">
                      Total payable
                    </span>
                    <span className="text-2xl font-black text-[#0e3558]">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {userId && (
                <p className="mt-3 text-xs text-slate-400">
                  Ordering as user: {userId}
                </p>
              )}

              {error && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder || (product?.availabilityCount || 0) < 1}
                className="mt-6 w-full rounded-2xl bg-[#0e3558] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#164a79] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {placingOrder
                  ? "Simulating payment..."
                  : `Pay ${formatPrice(totalAmount)}`}
              </button>

              <p className="mt-3 text-center text-xs text-slate-400">
                This is a simulated payment flow. No real gateway is connected.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Order;