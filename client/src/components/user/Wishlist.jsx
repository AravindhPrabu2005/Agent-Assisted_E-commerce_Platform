import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserNavbar from "./UserNavbar";
import axiosInstance from "../../axiosInstance";

const Wishlist = () => {
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

  const fetchWishlist = async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axiosInstance.get("/wishlist", {
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
    fetchWishlist();
  }, []);

  const handleRemove = async (wishlistId) => {
    try {
      setActionLoadingId(wishlistId);
      await axiosInstance.delete(`/wishlist/${wishlistId}`);
      setItems((prev) => prev.filter((item) => item._id !== wishlistId));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to remove item.");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleMoveToCart = async (wishlistItem) => {
    try {
      setActionLoadingId(wishlistItem._id);

      await axiosInstance.post("/cart", {
        userId,
        productId: wishlistItem.productId?._id,
        quantity: 1,
      });

      await axiosInstance.delete(`/wishlist/${wishlistItem._id}`);

      setItems((prev) => prev.filter((item) => item._id !== wishlistItem._id));
      alert("Moved to cart successfully.");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to move item to cart.");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <>
      <UserNavbar />

      <main className="min-h-screen bg-[#f8f8f8] px-4 py-6 sm:px-6 lg:px-10">
        <section className="mx-auto max-w-6xl">
          <div className="mb-6">
            <h1 className="text-3xl font-black text-[#0e3558]">My Wishlist</h1>
            <p className="mt-2 text-sm text-slate-500">
              Save products you love and move them to cart when you are ready.
            </p>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[28px] bg-white p-4 shadow-sm"
                >
                  <div className="h-52 animate-pulse rounded-[22px] bg-slate-200"></div>
                  <div className="mt-4 h-5 animate-pulse rounded bg-slate-200"></div>
                  <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-slate-200"></div>
                  <div className="mt-4 h-10 animate-pulse rounded-2xl bg-slate-200"></div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[28px] bg-white px-6 py-14 text-center shadow-sm">
              <h2 className="text-2xl font-black text-[#0e3558]">
                Your wishlist is empty
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Explore products and save the ones you want to revisit.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                const product = item.productId;

                if (!product) return null;

                const effectivePrice =
                  product.discountPrice && product.discountPrice > 0
                    ? product.discountPrice
                    : product.price;

                return (
                  <div
                    key={item._id}
                    className="overflow-hidden rounded-[28px] bg-white p-4 shadow-sm"
                  >
                    <button
                      onClick={() => navigate(`/user/product/${product._id}`)}
                      className="w-full text-left"
                    >
                      <div className="overflow-hidden rounded-[22px] bg-[#f4f6f8]">
                        <img
                          src={
                            product.imageUrl ||
                            "https://dummyimage.com/800x800/e5e7eb/111827&text=No+Image"
                          }
                          alt={product.name}
                          className="h-56 w-full object-cover transition duration-500 hover:scale-105"
                        />
                      </div>

                      <div className="mt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {product.brand || "Brand"}
                          {product.category ? ` • ${product.category}` : ""}
                        </p>

                        <h3 className="mt-2 line-clamp-1 text-lg font-black text-[#0e3558]">
                          {product.name}
                        </h3>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                          {product.shortDescription || "No short description available."}
                        </p>

                        <div className="mt-4 flex items-center gap-2">
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">
                            {formatPrice(effectivePrice)}
                          </span>

                          {product.discountPrice &&
                            product.discountPrice < product.price && (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 line-through">
                                {formatPrice(product.price)}
                              </span>
                            )}
                        </div>
                      </div>
                    </button>

                    <div className="mt-5 grid gap-2 sm:grid-cols-2">
                      <button
                        onClick={() => handleMoveToCart(item)}
                        disabled={actionLoadingId === item._id}
                        className="rounded-2xl bg-[#0e3558] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#164a79] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionLoadingId === item._id ? "Please wait..." : "Move to Cart"}
                      </button>

                      <button
                        onClick={() => handleRemove(item._id)}
                        disabled={actionLoadingId === item._id}
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default Wishlist;