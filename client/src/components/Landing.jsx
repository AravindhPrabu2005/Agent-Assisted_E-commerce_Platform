import React from "react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900 font-sans">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-orange-500 text-lg font-extrabold text-white shadow-lg shadow-orange-200">
              eK
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-black">
              eKadai
            </h1>
          </div>

          <nav className="flex flex-wrap items-center gap-3 md:gap-4">
            <Link
              to="/login"
              className="px-3 py-2 text-lg font-medium text-[#3b2f69] transition hover:text-orange-500"
            >
              Log In
            </Link>

            <Link
              to="/signup"
              className="rounded-xl bg-orange-500 px-6 py-3 text-base font-semibold text-white shadow-md shadow-orange-200 transition hover:bg-orange-600"
            >
              Sign Up
            </Link>

            <Link
              to="/adminSignup"
              className="rounded-xl border border-slate-400 px-6 py-3 text-base font-semibold text-[#0e3558] transition hover:border-orange-400 hover:text-orange-500"
            >
              Sign Up as Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl grid-cols-1 items-center gap-12 px-5 py-10 md:px-8 lg:grid-cols-2 lg:gap-16 lg:px-12 lg:py-16">
        <section className="max-w-2xl">
          <h2 className="text-5xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            <span className="text-[#0e3558]">Welcome to </span>
            <span className="text-orange-500">eKadai</span>
          </h2>

          <p className="mt-6 max-w-xl text-lg leading-9 text-slate-500 md:text-xl">
            Discover fresh essentials, trending products, and trusted local sellers in one simple marketplace — fast, friendly, and built for everyday shopping.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/signup"
              className="rounded-xl bg-orange-500 px-8 py-4 text-center text-lg font-semibold text-white shadow-md shadow-orange-200 transition hover:bg-orange-600"
            >
              Sign Up
            </Link>

            <Link
              to="/login"
              className="rounded-xl border border-slate-400 px-8 py-4 text-center text-lg font-semibold text-[#0e3558] transition hover:border-orange-400 hover:text-orange-500"
            >
              Explore Products
            </Link>
          </div>
        </section>

        <section className="flex justify-center lg:justify-end">
          <div className="relative h-[420px] w-full max-w-[520px] overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-2xl shadow-slate-300/40">
            <div className="absolute inset-7 rounded-[28px] bg-[radial-gradient(circle_at_20%_20%,rgba(255,183,77,0.45),transparent_28%),radial-gradient(circle_at_75%_25%,rgba(34,197,94,0.18),transparent_22%),radial-gradient(circle_at_50%_75%,rgba(14,53,88,0.16),transparent_24%),linear-gradient(160deg,#fff7ee,#ffffff_52%,#f3f6f9_100%)]" />

            <div className="absolute right-5 top-6 w-44 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Daily deals
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-[#0e3558]">40%</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Off on groceries, gadgets, and home picks.
              </p>
            </div>

            <div className="absolute left-1/2 top-1/2 flex h-[260px] w-[280px] -translate-x-1/2 -translate-y-1/2 flex-col justify-between rounded-[24px] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/70">
              <div className="flex h-[150px] items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50">
                <div className="relative h-32 w-28 rounded-[20px] rounded-b-[28px] bg-gradient-to-b from-orange-400 to-orange-500 shadow-xl shadow-orange-200">
                  <div className="absolute left-1/2 top-[-18px] h-8 w-14 -translate-x-1/2 rounded-t-full border-[7px] border-b-0 border-[#0e3558]" />
                  <div className="grid h-full place-items-center text-3xl font-extrabold text-white">
                    eK
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xl font-bold text-[#0e3558]">
                  Everything your home needs
                </h4>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Groceries, fashion, electronics, and more with quick checkout and doorstep delivery.
                </p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-2xl font-extrabold text-orange-500">
                    From ₹99
                  </span>
                  <Link
                    to="/login"
                    className="rounded-xl bg-green-400 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-5 w-44 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Fast delivery
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-[#0e3558]">24h</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Quick dispatch for popular products near you.
              </p>
            </div>

            <div className="absolute bottom-24 right-6 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#0e3558] shadow-lg shadow-slate-200/60">
              Trusted by modern local shoppers
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;