import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import UserNavbar from "./UserNavbar";
import axiosInstance from "../../axiosInstance";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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

        setProducts(productData);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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

  const formatPrice = (value) => {
    if (value === undefined || value === null) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getDiscountPercent = (price, discountPrice) => {
    if (!price || !discountPrice || discountPrice >= price) return 0;
    return Math.round(((price - discountPrice) / price) * 100);
  };

  return (
    <>
      <UserNavbar />

      <main className="min-h-screen bg-[#f8f8f8] px-6 py-8 lg:px-10">
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
              <span className="font-bold text-[#0e3558]">
                {filteredProducts.length}
              </span>
            </div>
          </div>
        </section>

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
          <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[28px] bg-white p-4 shadow-sm"
              >
                <div className="h-56 animate-pulse rounded-2xl bg-slate-200"></div>
                <div className="mt-4 h-3 w-20 animate-pulse rounded bg-slate-200"></div>
                <div className="mt-3 h-5 animate-pulse rounded bg-slate-200"></div>
                <div className="mt-3 h-4 animate-pulse rounded bg-slate-200"></div>
                <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-slate-200"></div>
                <div className="mt-5 h-10 animate-pulse rounded-2xl bg-slate-200"></div>
              </div>
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
            <h2 className="text-2xl font-bold text-[#0e3558]">
              No products found
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              Try another category or add products from the admin panel.
            </p>
          </section>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const discountPercent = getDiscountPercent(
                product.price,
                product.discountPrice
              );

              return (
                <div
                  key={product._id}
                  className="group overflow-hidden rounded-[28px] bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <Link
                    to={`/user/home`}
                    className="block"
                  >
                    <div className="relative overflow-hidden rounded-[24px] bg-[#f4f6f8]">
                      <img
                        src={
                          product.imageUrl ||
                          "https://dummyimage.com/600x600/e5e7eb/111827&text=No+Image"
                        }
                        alt={product.name}
                        className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                      />

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
                          {(product.availabilityCount || 0) > 0
                            ? "In stock"
                            : "Out of stock"}
                        </span>
                      </div>

                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-black text-[#0e3558]">
                            {formatPrice(
                              product.discountPrice || product.price || 0
                            )}
                          </p>

                          {product.discountPrice &&
                            product.discountPrice < product.price && (
                              <p className="text-sm text-slate-400 line-through">
                                {formatPrice(product.price)}
                              </p>
                            )}
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link
                    to={`/user/product/${product._id}`}
                    className="mt-5 block w-full rounded-2xl bg-orange-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-orange-600"
                  >
                    View Product
                  </Link>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </>
  );
};

export default Home;