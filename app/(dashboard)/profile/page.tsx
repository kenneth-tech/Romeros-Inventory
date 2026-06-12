"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { UserProfile } from "@/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState({ first_name: "", last_name: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      setEmail(user.email || "");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData as UserProfile);
        setFormData({
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setSuccess(true);
      if (profile) {
        setProfile({
          ...profile,
          first_name: formData.first_name,
          last_name: formData.last_name,
        });
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  const fullName = `${formData.first_name} ${formData.last_name}`.trim();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header with Full Name */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {fullName || "Welcome!"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{email}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          Profile updated successfully!
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Email cannot be changed
            </p>
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              First Name
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) =>
                setFormData({ ...formData, first_name: e.target.value })
              }
              placeholder="Enter your first name"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Last Name
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) =>
                setFormData({ ...formData, last_name: e.target.value })
              }
              placeholder="Enter your last name"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Role
            </label>
            <div className="px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 text-sm capitalize">
              {profile?.role || "staff"}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Role is set by administrators
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> You can edit your first and last names. Your
          email and role are managed by administrators.
        </p>
      </div>
    </div>
  );
}
