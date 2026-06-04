import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";

export default function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axiosInstance.post("/login", {
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        localStorage.clear();

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("isAdmin", String(response.data.user.isAdmin));
        localStorage.setItem("role", response.data.user.role);
        localStorage.setItem("userId", response.data.user.id);
        localStorage.setItem("userEmail", response.data.user.email);
        localStorage.setItem("userName", response.data.user.name);

        if (response.data.user.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/user/home");
        }
      } else {
        alert("Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      alert(error.response?.data?.error || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 py-10">
      <div className="mx-auto flex min-h-[85vh] max-w-6xl overflow-hidden rounded-[32px] border border-white/60 bg-white/60 shadow-2xl shadow-slate-300/30 backdrop-blur-sm">
        <div className="hidden w-1/2 flex-col justify-between bg-[#0e3558] p-10 text-white lg:flex">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-orange-500 text-lg font-extrabold text-white">
                eK
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">eKadai</h1>
            </div>
            <p className="text-sm uppercase tracking-[0.28em] text-orange-200">
              Welcome back
            </p>
            <h2 className="mt-6 text-5xl font-extrabold leading-tight">
              Sign in and continue shopping
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-200">
              Access your account to browse products, manage orders, or control
              your store dashboard.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
            <p className="text-sm text-slate-200">
              One login for customers and admins. We’ll route users to the
              correct dashboard automatically.
            </p>
          </div>
        </div>

        <div className="flex w-full items-center justify-center p-6 sm:p-10 lg:w-1/2">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-orange-500 text-lg font-extrabold text-white">
                  eK
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-black">
                  eKadai
                </h1>
              </div>
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-500">
              Login
            </p>
            <h2 className="mt-3 text-4xl font-extrabold text-[#0e3558]">
              Access your account
            </h2>
            <p className="mt-3 text-slate-500">
              Enter your credentials to continue.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-orange-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
              >
                Login
              </button>
            </form>

            <div className="mt-6 space-y-2 text-center text-slate-500">
              <p>
                Don’t have a user account?{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-orange-500 hover:text-orange-600"
                >
                  Sign up
                </Link>
              </p>
              <p>
                Want to sell on eKadai?{" "}
                <Link
                  to="/adminSignup"
                  className="font-semibold text-[#0e3558] hover:text-orange-500"
                >
                  Register as Admin
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}