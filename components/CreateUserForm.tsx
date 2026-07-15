"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import type { Branch } from "@/types";

interface CreateUserFormProps {
  branches: Branch[];
  onSuccess?: () => void;
}

export default function CreateUserForm({ branches, onSuccess }: CreateUserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "staff" as "admin" | "staff",
    branchIds: [] as string[],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      if (checked) {
        setFormData((prev) => ({
          ...prev,
          branchIds: [...prev.branchIds, value],
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          branchIds: prev.branchIds.filter((id) => id !== value),
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError("All fields are required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.branchIds.length === 0) {
      setError("Please select at least one branch");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          branchIds: formData.branchIds,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to create user");
        return;
      }

      setSuccess(true);
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        role: "staff",
        branchIds: [],
      });

      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-md w-full">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New User</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          User created successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
              disabled={isLoading}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Branches */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assign Branches
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
            {branches.map((branch) => (
              <label key={branch.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="branch"
                  value={branch.id}
                  checked={formData.branchIds.includes(branch.id)}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{branch.name}</span>
              </label>
            ))}
          </div>
          {formData.branchIds.length === 0 && (
            <p className="text-xs text-red-600 mt-1">At least one branch must be selected</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {isLoading ? "Creating..." : "Create User"}
        </button>
      </form>
    </div>
  );
}
