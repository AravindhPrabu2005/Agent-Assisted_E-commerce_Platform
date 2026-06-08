import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import UserNavbar from "./UserNavbar";
import axiosInstance from "../../axiosInstance";

const PRICE_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const ProductImage = React.memo(({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const fallback =
    "https://dummyimage.com/600x600/e5e7eb/111827&text=No+Image";

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-[24px] bg-[#f4f6f8]">
      {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-200" />}
      <img
        src={src || fallback}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          e.currentTarget.src = fallback;
          setLoaded(true);
        }}
        className={`h-56 w-full object-cover transition duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
});

const ProductCard = React.memo(({ product, formatPrice, getDiscountPercent }) => {
  const productId = product._id || product.productId || product.id;
  const discountPercent = getDiscountPercent(product.price, product.discountPrice);

  return (
    <article className="overflow-hidden rounded-[28px] bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
      <Link to={`/user/product/${productId}`} className="block">
        <div className="relative">
          <ProductImage src={product.imageUrl} alt={product.name} />

          <div className="absolute left-3 top-3 flex gap-2">
            {product.isFeatured && (
              <span className="rounded-full bg-[#0e3558] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                Featured
              </span>
            )}

            {discountPercent > 0 && (
              <span className="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                {discountPercent}% off
              </span>
            )}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {product.brand || "Brand"}
          </p>

          <h3 className="mt-2 line-clamp-1 text-lg font-bold text-[#0e3558]">
            {product.name}
          </h3>

          <p className="mt-2 line-clamp-2 min-h-[42px] text-sm leading-6 text-slate-500">
            {product.shortDescription || "No description available."}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-amber-500">
                ★ {product.ratingAverage || 0}
              </span>
              <span className="text-xs text-slate-400">
                ({product.ratingCount || 0})
              </span>
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                (product.availabilityCount || 0) > 0
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {(product.availabilityCount || 0) > 0 ? "In stock" : "Out of stock"}
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-2xl font-black text-[#0e3558]">
                {formatPrice(product.discountPrice || product.price || 0)}
              </p>

              {product.discountPrice && product.discountPrice < product.price && (
                <p className="text-sm text-slate-400 line-through">
                  {formatPrice(product.price)}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>

      <Link
        to={`/user/product/${productId}`}
        className="mt-5 block w-full rounded-2xl bg-orange-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-orange-600"
      >
        View Product
      </Link>
    </article>
  );
});

const ProductCardSkeleton = () => (
  <div className="overflow-hidden rounded-[28px] bg-white p-4 shadow-sm">
    <div className="h-56 animate-pulse rounded-2xl bg-slate-200"></div>
    <div className="mt-4 h-3 w-20 animate-pulse rounded bg-slate-200"></div>
    <div className="mt-3 h-5 animate-pulse rounded bg-slate-200"></div>
    <div className="mt-3 h-4 animate-pulse rounded bg-slate-200"></div>
    <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-slate-200"></div>
    <div className="mt-5 h-10 animate-pulse rounded-2xl bg-slate-200"></div>
  </div>
);

const RecommendationTable = React.memo(
  ({ title, loading, products, formatPrice }) => {
    return (
      <aside className="top-24 h-fit rounded-[28px] bg-white p-5 shadow-sm lg:sticky">
        <div className="mb-4">
          <h2 className="text-xl font-black text-[#0e3558]">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Suggestions based on your recent orders.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[56px_1fr] gap-3 rounded-2xl border border-slate-100 p-3"
              >
                <div className="h-14 w-14 animate-pulse rounded-xl bg-slate-200"></div>
                <div>
                  <div className="h-4 animate-pulse rounded bg-slate-200"></div>
                  <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-200"></div>
                  <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-slate-200"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="max-h-[520px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.16em] text-slate-500">
                    <th className="px-3 py-3 font-semibold">Product</th>
                    <th className="px-3 py-3 font-semibold">Price</th>
                    <th className="px-3 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const productId = product._id || product.productId || product.id;

                    return (
                      <tr
                        key={productId}
                        className="border-b border-slate-100 align-top last:border-b-0"
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-start gap-3">
                            <img
                              src={
                                product.imageUrl ||
                                "https://dummyimage.com/120x120/e5e7eb/111827&text=No+Image"
                              }
                              alt={product.name}
                              loading="lazy"
                              decoding="async"
                              className="h-14 w-14 rounded-xl bg-slate-100 object-cover"
                            />
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-bold text-[#0e3558]">
                                {product.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {product.brand || "Brand"}
                              </p>
                              <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                                {product.recommendationReason ||
                                  product.shortDescription ||
                                  "Recommended for you"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm font-bold text-[#0e3558]">
                          {formatPrice(product.discountPrice || product.price || 0)}
                        </td>
                        <td className="px-3 py-3">
                          <Link
                            to={`/user/product/${productId}`}
                            className="inline-flex rounded-xl bg-orange-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-600"
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
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <h3 className="text-base font-bold text-[#0e3558]">
              No personalized suggestions yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Place a couple of orders to unlock smarter recommendations.
            </p>
          </div>
        )}
      </aside>
    );
  }
);

const Home = () => {
  const userId = localStorage.getItem("userId");

  const [products, setProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recommendationTitle, setRecommendationTitle] = useState("Recommended for you");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    let isMounted = true;

    const fetchRecommendations = async () => {
      if (!userId) return;

      try {
        setRecommendationLoading(true);

        const res = await axiosInstance.get(`/recommendations/home/${userId}`);

        const items = Array.isArray(res.data?.products) ? res.data.products : [];

        if (isMounted) {
          setRecommendedProducts(items);
          setRecommendationTitle(res.data?.title || "Recommended for you");
        }
      } catch {
        if (isMounted) {
          setRecommendedProducts([]);
        }
      } finally {
        if (isMounted) {
          setRecommendationLoading(false);
        }
      }
    };

    fetchRecommendations();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const categories = useMemo(() => {
    const categorySet = new Set(
      products.map((product) => product.category).filter(Boolean)
    );
    return ["All", ...Array.from(categorySet)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") return products;
    return products.filter(
      (product) =>
        product.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [products, selectedCategory]);

  const formatPrice = useCallback((value) => {
    if (value === undefined || value === null) return "₹0";
    return PRICE_FORMATTER.format(value);
  }, []);

  const getDiscountPercent = useCallback((price, discountPrice) => {
    if (!price || !discountPrice || discountPrice >= price) return 0;
    return Math.round(((price - discountPrice) / price) * 100);
  }, []);

  const visibleProducts = useMemo(() => filteredProducts.slice(0, 24), [filteredProducts]);

  return (
    <>
      <UserNavbar />

      <main className="min-h-screen bg-[#f8f8f8] px-4 py-6 lg:px-8 xl:px-10">
        <section className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[#0e3558]">
                Products
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Explore the latest items and open any product for full details.
              </p>
            </div>

            <div className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-500 shadow-sm">
              Total Products:{" "}
              <span className="font-bold text-[#0e3558]">{filteredProducts.length}</span>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <section className="mb-8">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {categories.map((category) => {
                  const isActive = selectedCategory === category;

                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                        isActive
                          ? "bg-[#0e3558] text-white shadow-md"
                          : "bg-white text-slate-600 shadow-sm hover:text-orange-500"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </section>

            {loading ? (
              <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </section>
            ) : error ? (
              <section className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-10 text-center">
                <h2 className="text-xl font-bold text-red-600">
                  Unable to load products
                </h2>
                <p className="mt-2 text-sm text-red-500">{error}</p>
              </section>
            ) : filteredProducts.length === 0 ? (
              <section className="rounded-[28px] bg-white px-6 py-14 text-center shadow-sm">
                <h2 className="text-2xl font-bold text-[#0e3558]">No products found</h2>
                <p className="mt-3 text-sm text-slate-500">
                  Try another category or add products from the admin panel.
                </p>
              </section>
            ) : (
              <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product._id || product.productId || product.id}
                    product={product}
                    formatPrice={formatPrice}
                    getDiscountPercent={getDiscountPercent}
                  />
                ))}
              </section>
            )}

            {!loading && !error && filteredProducts.length > visibleProducts.length && (
              <section className="mt-6 rounded-[24px] bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
                Showing {visibleProducts.length} of {filteredProducts.length} products for
                smoother loading.
              </section>
            )}
          </div>

          {userId && (
            <RecommendationTable
              title={recommendationTitle}
              loading={recommendationLoading}
              products={recommendedProducts}
              formatPrice={formatPrice}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default Home;