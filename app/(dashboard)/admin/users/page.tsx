"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Users, Edit2, Trash2, Plus, Save, X, ChevronLeft } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getAllUsersWithBranches, updateUserRole, assignBranchesToUser, deleteUser, updateUserName } from "@/lib/user-management";
import { getBranches } from "@/lib/branches";
import type { Branch } from "@/types";

interface UserWithBranches {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: "admin" | "staff";
  branches: Array<{ id: string; name: string }>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithBranches[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    firstName: string;
    lastName: string;
    role: "admin" | "staff";
    branchIds: string[];
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [usersData, branchesData] = await Promise.all([
        getAllUsersWithBranches(),
        getBranches(),
      ]);
      setUsers(usersData);
      setBranches(branchesData);
      // Ensure spinner shows for at least 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(user: UserWithBranches) {
    setEditingId(user.id);
    setEditData({
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      role: user.role,
      branchIds: user.branches.map((b) => b.id),
    });
  }

  async function saveEdit(userId: string) {
    if (!editData) return;

    try {
      await Promise.all([
        updateUserName(userId, editData.firstName, editData.lastName),
        updateUserRole(userId, editData.role),
        assignBranchesToUser(userId, editData.branchIds),
      ]);

      setEditingId(null);
      setEditData(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteUser(userId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-16">
          <div className="text-gray-400">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {loading && <LoadingSpinner />}
      <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-4">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Admin
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage user roles and branch assignments
          </p>
        </div>
        <Link
          href="/admin/users/create"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create User
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Users className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 font-medium text-gray-600">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">
                    Role
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">
                    Branches
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) =>
                  editingId === user.id && editData ? (
                    <tr key={user.id} className="bg-blue-50">
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="First name"
                            value={editData.firstName}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                firstName: e.target.value,
                              })
                            }
                            className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Last name"
                            value={editData.lastName}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                lastName: e.target.value,
                              })
                            }
                            className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={editData.role}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              role: e.target.value as "admin" | "staff",
                            })
                          }
                          className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                        >
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {branches.map((branch) => (
                            <label
                              key={branch.id}
                              className="flex items-center gap-2 text-sm text-gray-900"
                            >
                              <input
                                type="checkbox"
                                checked={editData.branchIds.includes(
                                  branch.id
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditData({
                                      ...editData,
                                      branchIds: [
                                        ...editData.branchIds,
                                        branch.id,
                                      ],
                                    });
                                  } else {
                                    setEditData({
                                      ...editData,
                                      branchIds: editData.branchIds.filter(
                                        (id) => id !== branch.id
                                      ),
                                    });
                                  }
                                }}
                                className="rounded"
                              />
                              {branch.name}
                            </label>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(user.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
                          >
                            <Save className="w-3 h-3" />
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditData(null);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs font-medium rounded transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {user.first_name || user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : "No name"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {user.branches.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.branches.map((branch) => (
                              <span
                                key={branch.id}
                                className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                              >
                                {branch.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">No branches</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(user)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
