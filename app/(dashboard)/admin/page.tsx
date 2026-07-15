"use client";

import Link from "next/link";
import { Users, Settings, BarChart3 } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage system settings, users, and access controls
        </p>
      </div>

      {/* Admin Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Management */}
        <Link href="/admin/users">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                User Management
              </h2>
            </div>
            <p className="text-sm text-gray-600">
              Manage user roles, branch assignments, and permissions
            </p>
          </div>
        </Link>

        {/* Settings */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer opacity-50 pointer-events-none">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Settings className="w-6 h-6 text-gray-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              System Settings
            </h2>
          </div>
          <p className="text-sm text-gray-600">
            Configure system-wide settings and preferences (Coming soon)
          </p>
        </div>

        {/* Reports */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer opacity-50 pointer-events-none">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Admin Reports
            </h2>
          </div>
          <p className="text-sm text-gray-600">
            View system reports and analytics (Coming soon)
          </p>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <h3 className="font-semibold text-blue-900 mb-2">Admin Capabilities</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Create and manage user accounts</li>
          <li>Assign admin or staff roles to users</li>
          <li>Control which branches each user can access</li>
          <li>View all inventory and transaction data</li>
          <li>Generate system reports</li>
        </ul>
      </div>
    </div>
  );
}
