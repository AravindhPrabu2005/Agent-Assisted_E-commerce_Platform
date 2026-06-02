import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";

export default function AdminSignupPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    companyName: "",
    gstNo: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/admin/register", formData);
      alert(response.data.message);
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        companyName: "",
        gstNo: "",
      });
      navigate("/login");
    } catch (error) {
      console.error("Error registering admin:", error);
      alert(error.response?.data?.error || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 py-10">
      <div className="mx-auto flex min-h-[90vh] max-w-7xl overflow-hidden rounded-[32px] border border-white/60 bg-white/60 shadow-2xl shadow-slate-300/30 backdrop-blur-sm">
        <div className="hidden w-1/2 flex-col justify-between bg-[#0e3558] p-10 text-white lg:flex">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-orange-500 text-lg font-extrabold text-white">
                eK
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">eKadai</h1>
            </div>
            <p className="max-w-md text-sm uppercase tracking-[0.28em] text-orange-200">
              Seller onboarding
            </p>
            <h2 className="mt-6 text-5xl font-extrabold leading-tight">
              Build your store on eKadai
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-200">
              Register as an admin or seller to manage products, track orders, and grow your business on the platform.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
            <p className="text-sm text-slate-200">
              Add your company and GST details to onboard your business account properly.
            </p>
          </div>
        </div>

        <div className="flex w-full items-center justify-center p-6 sm:p-10 lg:w-1/2">
          <div className="w-full max-w-xl">
            <div className="mb-8 lg:hidden">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-orange-500 text-lg font-extrabold text-white">
                  eK
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-black">eKadai</h1>
              </div>
              <h2 className="text-3xl font-extrabold text-[#0e3558]">Admin Sign Up</h2>
            </div>

            <div className="hidden lg:block">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-500">
                Admin Registration
              </p>
              <h2 className="mt-3 text-4xl font-extrabold text-[#0e3558]">
                Create seller account
              </h2>
              <p className="mt-3 text-slate-500">
                Enter business details to register as an admin.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  placeholder="Enter company name"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  GST Number
                </label>
                <input
                  type="text"
                  name="gstNo"
                  placeholder="Enter GST number"
                  value={formData.gstNo}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Address
                </label>
                <textarea
                  name="address"
                  placeholder="Enter business address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#0e3558]">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-orange-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
                >
                  Sign Up as Admin
                </button>
              </div>
            </form>

            <p className="mt-6 text-center text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-orange-500 hover:text-orange-600">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}