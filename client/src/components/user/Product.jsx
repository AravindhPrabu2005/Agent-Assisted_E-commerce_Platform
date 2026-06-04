import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import UserNavbar from "./UserNavbar";
import axiosInstance from "../../axiosInstance";

const Product = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");

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

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const testimonials = [
    {
      id: 1,
      name: "Rahul K",
      role: "Verified Buyer",
      rating: 5,
      comment:
        "Excellent product quality and the delivery was smooth. The product matched the description exactly.",
    },
    {
      id: 2,
      name: "Sneha M",
      role: "Verified Buyer",
      rating: 4,
      comment:
        "Very happy with the purchase. Packaging was neat, and the product feels premium for the price.",
    },
    {
      id: 3,
      name: "Arjun S",
      role: "Verified Buyer",
      rating: 5,
      comment:
        "The ordering experience was simple and the product works perfectly. Would definitely recommend it.",
    },
  ];

  const formatPrice = (value) => {
    if (value === undefined || value === null) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
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
    return [
      product.imageUrl ||
        "https://dummyimage.com/800x800/e5e7eb/111827&text=No+Image",
      product.imageUrl ||
        "https://dummyimage.com/800x800/e5e7eb/111827&text=No+Image",
      product.imageUrl ||
        "https://dummyimage.com/800x800/e5e7eb/111827&text=No+Image",
    ];
  }, [product]);

  const handleOrderNow = () => {
    navigate("/order", { state: { product } });
  };

  const handleAddToCart = () => {
    const existingCart = JSON.parse(localStorage.getItem("cartItems") || "[]");

    const alreadyExists = existingCart.find((item) => item._id === product._id);

    let updatedCart;
    if (alreadyExists) {
      updatedCart = existingCart;
    } else {
      updatedCart = [...existingCart, { ...product, quantity: 1 }];
    }

    localStorage.setItem("cartItems", JSON.stringify(updatedCart));
    localStorage.setItem("cartCount", updatedCart.length.toString());
    window.dispatchEvent(new Event("storage"));
    alert("Product added to cart");
  };

  const handleAddToWishlist = () => {
    const existingWishlist = JSON.parse(
      localStorage.getItem("wishlistItems") || "[]"
    );

    const alreadyExists = existingWishlist.find(
      (item) => item._id === product._id
    );

    let updatedWishlist;
    if (alreadyExists) {
      updatedWishlist = existingWishlist;
    } else {
      updatedWishlist = [...existingWishlist, product];
    }

    localStorage.setItem("wishlistItems", JSON.stringify(updatedWishlist));
    localStorage.setItem("wishlistCount", updatedWishlist.length.toString());
    window.dispatchEvent(new Event("storage"));
    alert("Product added to wishlist");
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
                  <span className="text-base font-bold text-amber-500">
                    ★ {product.ratingAverage || 0}
                  </span>
                  <span className="text-sm text-slate-400">
                    ({product.ratingCount || 0} reviews)
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
                  className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  Add to Cart
                </button>

                <button
                  onClick={handleAddToWishlist}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-400 hover:text-orange-500"
                >
                  Wishlist
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
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-[#0e3558]">
                  What customers say
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Static testimonials for now. We can connect real reviews later.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {testimonials.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[28px] border border-slate-200 bg-[#fafafa] p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#0e3558]">
                        {item.name}
                      </h3>
                      <p className="text-sm text-slate-400">{item.role}</p>
                    </div>

                    <span className="text-sm font-bold text-amber-500">
                      {"★".repeat(item.rating)}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {item.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Product;