import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import UserNavbar from "./UserNavbar";
import axiosInstance from "../../axiosInstance";

const StarDisplay = ({ rating, size = "text-sm" }) => {
  return (
    <div
      className={`flex items-center gap-0.5 ${size}`}
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rating ? "text-amber-400" : "text-slate-200"}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const Product = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const userId = localStorage.getItem("userId");

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axiosInstance.get(`/products/${id}`);
        const productData = res.data?.product || res.data;
        setProduct(productData);
        setSelectedImage(
          productData?.imageUrl ||
            "https://dummyimage.com/800x800/e5e7eb/111827&text=No+Image"
        );
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load product.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const res = await axiosInstance.get(`/reviews/product/${id}`);
        const fetched = Array.isArray(res.data?.reviews) ? res.data.reviews : [];
        setReviews(fetched);
      } catch {
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    if (id) fetchReviews();
  }, [id]);

  useEffect(() => {
    const fetchSavedStatus = async () => {
      if (!userId || !id) return;

      try {
        const [cartRes, wishlistRes] = await Promise.all([
          axiosInstance.get("/cart/check", {
            params: { userId, productId: id },
          }),
          axiosInstance.get("/wishlist/check", {
            params: { userId, productId: id },
          }),
        ]);

        setIsInCart(!!cartRes.data?.exists);
        setIsInWishlist(!!wishlistRes.data?.exists);
      } catch {
        setIsInCart(false);
        setIsInWishlist(false);
      }
    };

    fetchSavedStatus();
  }, [id, userId]);

  const formatPrice = (value) => {
    if (value === undefined || value === null) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const discountPercent = useMemo(() => {
    if (!product?.price || !product?.discountPrice) return 0;
    if (product.discountPrice >= product.price) return 0;
    return Math.round(
      ((product.price - product.discountPrice) / product.price) * 100
    );
  }, [product]);

  const productImages = useMemo(() => {
    if (!product) return [];
    const img =
      product.imageUrl ||
      "https://dummyimage.com/800x800/e5e7eb/111827&text=No+Image";
    return [img, img, img];
  }, [product]);

  const ratingBreakdown = useMemo(() => {
    if (!reviews.length) return [];
    return [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((r) => r.rating === star).length;
      const percent = Math.round((count / reviews.length) * 100);
      return { star, count, percent };
    });
  }, [reviews]);

  const computedAverage = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const handleOrderNow = () => {
    navigate(`/user/order/${product._id}`, { state: { product } });
  };

  const handleAddToCart = async () => {
    if (!userId) {
      alert("Please login first.");
      return;
    }

    try {
      setCartLoading(true);

      await axiosInstance.post("/cart", {
        userId,
        productId: product._id,
        quantity: 1,
      });

      setIsInCart(true);
      alert("Product added to cart");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add to cart.");
    } finally {
      setCartLoading(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!userId) {
      alert("Please login first.");
      return;
    }

    try {
      setWishlistLoading(true);

      await axiosInstance.post("/wishlist", {
        userId,
        productId: product._id,
      });

      setIsInWishlist(true);
      alert("Product added to wishlist");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add to wishlist.");
    } finally {
      setWishlistLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <UserNavbar />
        <div className="min-h-screen bg-[#f8f8f8] px-6 py-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
            <div className="rounded-[32px] bg-white p-6 shadow-sm">
              <div className="h-[500px] animate-pulse rounded-[28px] bg-slate-200"></div>
            </div>
            <div className="rounded-[32px] bg-white p-8 shadow-sm">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200"></div>
              <div className="mt-4 h-10 animate-pulse rounded bg-slate-200"></div>
              <div className="mt-4 h-6 w-40 animate-pulse rounded bg-slate-200"></div>
              <div className="mt-6 h-28 animate-pulse rounded bg-slate-200"></div>
              <div className="mt-8 h-12 animate-pulse rounded-2xl bg-slate-200"></div>
              <div className="mt-4 h-12 animate-pulse rounded-2xl bg-slate-200"></div>
              <div className="mt-4 h-12 animate-pulse rounded-2xl bg-slate-200"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <UserNavbar />
        <div className="min-h-screen bg-[#f8f8f8] px-6 py-10 lg:px-10">
          <div className="mx-auto max-w-3xl rounded-[32px] border border-red-200 bg-red-50 px-6 py-10 text-center">
            <h2 className="text-2xl font-bold text-red-600">
              Unable to load product
            </h2>
            <p className="mt-3 text-sm text-red-500">
              {error || "Product not found."}
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <UserNavbar />

      <main className="min-h-screen bg-[#f8f8f8] px-6 py-8 lg:px-10">
        <section className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] bg-white p-5 shadow-sm lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-[28px] bg-[#f4f6f8]">
              <img
                src={selectedImage}
                alt={product.name}
                className="h-[420px] w-full object-cover sm:h-[520px]"
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(image)}
                  className={`overflow-hidden rounded-[20px] border-2 bg-[#f4f6f8] transition ${
                    selectedImage === image
                      ? "border-orange-500"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} preview ${index + 1}`}
                    className="h-24 w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] bg-white p-8 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {product.brand || "Brand"}
                </span>

                {product.category && (
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
                    {product.category}
                  </span>
                )}

                {product.isFeatured && (
                  <span className="rounded-full bg-[#0e3558] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                    Featured
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-black leading-tight text-[#0e3558] sm:text-4xl">
                {product.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <StarDisplay
                    rating={Math.round(
                      Number(computedAverage || product.ratingAverage || 0)
                    )}
                    size="text-base"
                  />
                  <span className="text-sm font-bold text-amber-500">
                    {computedAverage || product.ratingAverage || 0}
                  </span>
                  <span className="text-sm text-slate-400">
                    ({reviews.length || product.ratingCount || 0} reviews)
                  </span>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    (product.availabilityCount || 0) > 0
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {(product.availabilityCount || 0) > 0
                    ? "In Stock"
                    : "Out of Stock"}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-end gap-4">
                <div>
                  <p className="text-4xl font-black text-[#0e3558]">
                    {formatPrice(product.discountPrice || product.price)}
                  </p>
                  {product.discountPrice &&
                    product.discountPrice < product.price && (
                      <p className="mt-1 text-lg text-slate-400 line-through">
                        {formatPrice(product.price)}
                      </p>
                    )}
                </div>

                {discountPercent > 0 && (
                  <span className="rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white">
                    Save {discountPercent}%
                  </span>
                )}
              </div>

              <p className="mt-6 text-sm leading-7 text-slate-600">
                {product.shortDescription || "No short description available."}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <button
                  onClick={handleOrderNow}
                  className="rounded-2xl bg-[#0e3558] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#164a79]"
                >
                  Order Now
                </button>

                <button
                  onClick={handleAddToCart}
                  disabled={cartLoading || isInCart}
                  className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cartLoading
                    ? "Adding..."
                    : isInCart
                    ? "Added to Cart"
                    : "Add to Cart"}
                </button>

                <button
                  onClick={handleAddToWishlist}
                  disabled={wishlistLoading || isInWishlist}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-400 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {wishlistLoading
                    ? "Saving..."
                    : isInWishlist
                    ? "Wishlisted"
                    : "Wishlist"}
                </button>
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-black text-[#0e3558]">
                Product Details
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#f7f8fa] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    SKU
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {product.sku || "N/A"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f8fa] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Currency
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {product.currency || "INR"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f8fa] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Available Count
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {product.availabilityCount ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f8fa] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Tags
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {product.tags?.length ? product.tags.join(", ") : "N/A"}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] bg-[#f7f8fa] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Description
                </p>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {product.description || "No description available."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-7xl">
          <div className="rounded-[32px] bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
              <div className="flex shrink-0 flex-col items-center justify-center rounded-[28px] bg-[#f7f8fa] p-8 text-center sm:min-w-[200px]">
                <p className="text-6xl font-black text-[#0e3558]">
                  {computedAverage || "0.0"}
                </p>
                <StarDisplay
                  rating={Math.round(Number(computedAverage))}
                  size="text-2xl"
                />
                <p className="mt-2 text-sm text-slate-500">
                  {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex flex-1 flex-col justify-center gap-3">
                <h2 className="text-2xl font-black text-[#0e3558]">
                  Customer Reviews
                </h2>

                {ratingBreakdown.length > 0 ? (
                  ratingBreakdown.map(({ star, count, percent }) => (
                    <div key={star} className="flex items-center gap-3">
                      <span className="w-12 shrink-0 text-right text-xs font-semibold text-slate-500">
                        {star} ★
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-xs font-semibold text-slate-500">
                        {count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No ratings to break down yet.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8">
              {reviewsLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-[24px] border border-slate-100 bg-[#fafafa] p-5"
                    >
                      <div className="h-4 w-28 animate-pulse rounded bg-slate-200"></div>
                      <div className="mt-3 h-3 w-20 animate-pulse rounded bg-slate-200"></div>
                      <div className="mt-4 h-16 animate-pulse rounded bg-slate-200"></div>
                    </div>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="rounded-[24px] bg-[#f7f8fa] px-6 py-10 text-center">
                  <p className="text-2xl">💬</p>
                  <h3 className="mt-3 text-base font-black text-[#0e3558]">
                    No reviews yet
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Be the first to review this product after purchase.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {reviews.map((review) => (
                    <div
                      key={review._id}
                      className="flex flex-col gap-3 rounded-[24px] border border-slate-100 bg-[#fafafa] p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0e3558] text-sm font-black text-white">
                          {review.customerName?.charAt(0)?.toUpperCase() || "?"}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[#0e3558]">
                            {review.customerName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>

                        <StarDisplay rating={review.rating} size="text-sm" />
                      </div>

                      <p className="text-sm leading-7 text-slate-600">
                        {review.reviewText}
                      </p>

                      <div className="mt-auto flex items-center gap-2">
                        <span className="rounded-full bg-[#eaf2f9] px-2.5 py-1 text-[11px] font-semibold text-[#0e3558]">
                          Verified Buyer
                        </span>
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
                          {review.rating}/5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Product;