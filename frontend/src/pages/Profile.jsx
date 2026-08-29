import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  UserCircle,
  Mail,
  Shield,
  Save,
} from "lucide-react";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");

  const handleSave = () => {
    alert("Profile updated successfully");
  };

  return (
    <div className="min-h-screen bg-[#f7faf7]">

      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between">

            <button
              onClick={() => setLocation("/dashboard")}
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Dashboard
            </button>

            <div className="flex items-center gap-2">
              <UserCircle className="w-6 h-6 text-primary" />
              <span className="text-xl font-black text-gray-900">
                My Profile
              </span>
            </div>

          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-10">

          {/* Profile heading */}
          <div className="flex items-center gap-4 mb-8">

            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <UserCircle className="w-9 h-9 text-primary" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-gray-900">
                Profile Information
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                Manage your account information.
              </p>
            </div>

          </div>

          {/* Name */}
          <div className="mb-6">

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Name
            </label>

            <div className="relative">

              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-200"
              />

            </div>

          </div>

          {/* Email */}
          <div className="mb-6">

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>

            <div className="relative">

              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              <input
                type="email"
                value={email}
                disabled
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
              />

            </div>

          </div>

          {/* Role */}
          <div className="mb-8">

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Account Type
            </label>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">

              <Shield className="w-5 h-5 text-primary" />

              <span className="capitalize text-gray-700">
                {user?.role || "User"}
              </span>

            </div>

          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>

        </div>

      </main>
    </div>
  );
}