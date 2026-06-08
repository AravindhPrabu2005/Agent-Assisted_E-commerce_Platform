import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import UserNavbar from "./UserNavbar";
import axiosInstance from "../../axiosInstance";

const PRICE_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const FALLBACK = "https://dummyimage.com/600x600/f3f4f6/9ca3af&text=No+Image";
const PAGE_SIZE = 24;

const ProductImage = React.memo(({ src, alt }) => {
  const [status, setStatus] = useState("loading");

  return (
    <div className="relative h-52 w-full overflow-hidden rounded-2xl bg-gray-100">
      {status === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}
      <img
        src={src || FALLBACK}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setStatus("loaded")}
        onError={(e) => {
          if (e.currentTarget.src !== FALLBACK) {
            e.currentTarget.src = FALLBACK;
          }
          setStatus("loaded");
        }}
        className={`h-52 w-full object-cover transition-opacity duration-300 ${
          status === "loaded" ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
});

const ProductCard = React.memo(({ product, formatPrice, getDiscountPercent }) => {
  const productId = product._id || product.productId || product.id;
  const discountPercent = getDiscountPercent(product.price, product.discountPrice);
  const inStock = (product.availabilityCount || 0) > 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-shadow duration-200 hover:shadow-md">
      <Link to={`/user/product/${productId}`} className="block p-4 pb-0">
        <div className="relative">
          <ProductImage src={product.imageUrl} alt={product.name} />

          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            {product.isFeatured && (
              <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Featured
              </span>
            )}
            {discountPercent > 0 && (
              <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                {discountPercent}% off
              </span>
            )}
          </div>

          <span
            className={`absolute bottom-2.5 right-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
              inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
            }`}
          >
            {inStock ? "In stock" : "Out of stock"}
          </span>
        </div>

        <div className="mt-3 pb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {product.brand || "Brand"}
          </p>

          <h3 className="mt-1 line-clamp-1 text-sm font-bold text-gray-900">
            {product.name}
          </h3>

          <p className="mt-1.5 line-clamp-2 min-h-[36px] text-xs leading-[18px] text-gray-500">
            {product.shortDescription || "No description available."}
          </p>

          <div className="mt-2.5 flex items-center gap-1">
            <span className="text-xs text-amber-400">★</span>
            <span className="text-xs font-semibold text-gray-700">
              {product.ratingAverage || 0}
            </span>
            <span className="text-xs text-gray-400">
              ({product.ratingCount || 0})
            </span>
          </div>

          <div className="mt-2.5">
            <p className="text-xl font-black text-gray-900">
              {formatPrice(product.discountPrice ?? product.price ?? 0)}
            </p>
            {product.discountPrice != null && product.discountPrice < product.price && (
              <p className="mt-0.5 text-xs text-gray-400 line-through">
                {formatPrice(product.price)}
              </p>
            )}
          </div>
        </div>
      </Link>

      <div className="mt-auto px-4 pb-4">
        <Link
          to={`/user/product/${productId}`}
          className="block w-full rounded-xl bg-orange-500 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors duration-150 hover:bg-orange-600 active:bg-orange-700"
        >
          View Product
        </Link>
      </div>
    </article>
  );
});

const ProductCardSkeleton = () => (
  <div className="flex flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
    <div className="h-52 animate-pulse rounded-2xl bg-gray-200" />
    <div className="mt-3 h-2.5 w-14 animate-pulse rounded bg-gray-200" />
    <div className="mt-2.5 h-4 w-full animate-pulse rounded bg-gray-200" />
    <div className="mt-2 h-3 w-full animate-pulse rounded bg-gray-200" />
    <div className="mt-1 h-3 w-3/4 animate-pulse rounded bg-gray-200" />
    <div className="mt-3 h-5 w-20 animate-pulse rounded bg-gray-200" />
    <div className="mt-auto pt-4">
      <div className="h-10 animate-pulse rounded-xl bg-gray-200" />
    </div>
  </div>
);

const RecommendationTable = React.memo(
  ({ title, loading, products, formatPrice, error, onRetry }) => (
    <aside className="self-start top-24 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 lg:sticky">
      <div className="mb-4 border-b border-gray-100 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-gray-900">{title}</h2>
            <p className="mt-0.5 text-xs text-gray-400">
              Suggestions based on your recent orders.
            </p>
          </div>

          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-gray-600 transition hover:border-orange-300 hover:text-orange-500"
          >
            Retry
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-gray-100 p-2.5">
              <div className="h-12 w-12 flex-shrink-0 animate-pulse rounded-xl bg-gray-200" />
              <div className="flex-1 space-y-2 py-0.5">
                <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-2.5 w-2/3 animate-pulse rounded bg-gray-200" />
                <div className="h-2.5 w-1/3 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-6 text-center">
          <h3 className="text-sm font-bold text-red-600">Failed to load recommendations</h3>
          <p className="mt-1 text-xs leading-5 text-red-400">{error}</p>
        </div>
      ) : products.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <div className="max-h-[500px] overflow-y-auto overscroll-contain">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-400">
                  <th className="px-3 py-2.5 font-semibold">Product</th>
                  <th className="px-3 py-2.5 font-semibold">Price</th>
                  <th className="px-3 py-2.5 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const productId = product._id || product.productId || product.id;

                  return (
                    <tr
                      key={productId}
                      className="border-b border-gray-100 align-top last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-start gap-2.5">
                          <img
                            src={product.imageUrl || FALLBACK}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK;
                            }}
                            className="h-11 w-11 flex-shrink-0 rounded-xl bg-gray-100 object-cover"
                          />
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-xs font-bold leading-snug text-gray-900">
                              {product.name}
                            </p>
                            <p className="mt-0.5 text-[10px] text-gray-400">
                              {product.brand || "Brand"}
                            </p>
                            <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-gray-400">
                              {product.recommendationReason ||
                                product.shortDescription ||
                                "Recommended for you"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs font-bold text-gray-900">
                        {formatPrice(product.discountPrice ?? product.price ?? 0)}
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          to={`/user/product/${productId}`}
                          className="inline-flex items-center rounded-lg bg-orange-500 px-2.5 py-1.5 text-[10px] font-semibold text-white transition-colors hover:bg-orange-600"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-orange-100">
            <svg
              className="h-5 w-5 text-orange-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-gray-900">No suggestions yet</h3>
          <p className="mt-1 text-xs leading-5 text-gray-400">
            Place a couple of orders to unlock smarter recommendations.
          </p>
        </div>
      )}
    </aside>
  )
);

const Home = () => {
  const userId = localStorage.getItem("userId");

  const [products, setProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recommendationTitle, setRecommendationTitle] = useState("Recommended for you");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");
  const [error, setError] = useState("");

  const recommendationAbortRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axiosInstance.get("/products");
        const productData = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.products)
          ? res.data.products
          : [];

        if (isMounted) {
          setProducts(productData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load products.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchRecommendations = useCallback(async () => {
    if (!userId) return;

    if (recommendationAbortRef.current) {
      recommendationAbortRef.current.abort();
    }

    const controller = new AbortController();
    recommendationAbortRef.current = controller;

    try {
      setRecommendationLoading(true);
      setRecommendationError("");

      const res = await axiosInstance.get(`/recommendations/home/${userId}`, {
        signal: controller.signal,
      });

      const items = Array.isArray(res.data?.products) ? res.data.products : [];

      setRecommendedProducts(items);
      setRecommendationTitle(res.data?.title || "Recommended for you");
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;

      setRecommendedProducts([]);
      setRecommendationError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Recommendations are not loading right now."
      );
    } finally {
      if (!controller.signal.aborted) {
        setRecommendationLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    fetchRecommendations();

    return () => {
      if (recommendationAbortRef.current) {
        recommendationAbortRef.current.abort();
      }
    };
  }, [fetchRecommendations]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, searchQuery]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products;

    if (selectedCategory !== "All") {
      list = list.filter(
        (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [products, selectedCategory, searchQuery]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );

  const formatPrice = useCallback((value) => {
    if (value == null) return "₹0";
    return PRICE_FORMATTER.format(value);
  }, []);

  const getDiscountPercent = useCallback((price, discountPrice) => {
    if (!price || !discountPrice || discountPrice >= price) return 0;
    return Math.round(((price - discountPrice) / price) * 100);
  }, []);

  const handleLoadMore = useCallback(() => {
    setVisibleCount((c) => c + PAGE_SIZE);
  }, []);

  return (
    <>
      <UserNavbar />

      <main className="min-h-screen bg-gray-50 px-4 py-6 lg:px-8 xl:px-10">
        <section className="mb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500">
                Browse
              </p>
              <h1 className="mt-0.5 text-2xl font-black tracking-tight text-gray-900">
                Products
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Explore the latest items. Click any product for full details.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products…"
                  className="w-48 rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-56"
                />
              </div>

              <div className="whitespace-nowrap rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-500">
                <span className="font-bold text-gray-900">{filteredProducts.length}</span>{" "}
                items
              </div>
            </div>
          </div>
        </section>

        <section className="mb-5">
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categories.map((category) => {
              const isActive = selectedCategory === category;

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
                    isActive
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-orange-300 hover:text-orange-500"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-red-600">Unable to load products</h2>
                <p className="mt-1 text-sm text-red-400">{error}</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-gray-100">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
                  <svg
                    className="h-6 w-6 text-orange-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">No products found</h2>
                <p className="mt-1.5 text-sm text-gray-400">
                  Try a different category or search term.
                </p>
                {(selectedCategory !== "All" || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedCategory("All");
                      setSearchQuery("");
                    }}
                    className="mt-4 rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {visibleProducts.map((product) => (
                    <ProductCard
                      key={product._id || product.productId || product.id}
                      product={product}
                      formatPrice={formatPrice}
                      getDiscountPercent={getDiscountPercent}
                    />
                  ))}
                </div>

                {visibleCount < filteredProducts.length && (
                  <div className="mt-8 flex flex-col items-center gap-2">
                    <p className="text-xs text-gray-400">
                      Showing {visibleProducts.length} of {filteredProducts.length} products
                    </p>
                    <button
                      onClick={handleLoadMore}
                      className="rounded-xl border border-gray-200 bg-white px-8 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-orange-400 hover:text-orange-500 active:bg-gray-50"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {userId && (
            <RecommendationTable
              title={recommendationTitle}
              loading={recommendationLoading}
              products={recommendedProducts}
              formatPrice={formatPrice}
              error={recommendationError}
              onRetry={fetchRecommendations}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default Home;