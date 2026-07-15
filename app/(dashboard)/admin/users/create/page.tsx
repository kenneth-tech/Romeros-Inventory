"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getBranches } from "@/lib/branches";
import CreateUserForm from "@/components/CreateUserForm";
import type { Branch } from "@/types";

export default function CreateUserPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBranches() {
      try {
        const data = await getBranches();
        setBranches(data);
      } catch (error) {
        console.error("Failed to load branches:", error);
      } finally {
        setLoading(false);
      }
    }
    loadBranches();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/users"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Users
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New User Account</h1>
          <p className="text-gray-600 mt-1">Add a new user to the system</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading branches...</div>
          </div>
        ) : (
          <CreateUserForm branches={branches} onSuccess={() => {}} />
        )}
      </div>
    </div>
  );
}
