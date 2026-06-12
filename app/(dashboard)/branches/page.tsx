"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, Pencil, Trash2, MapPin } from "lucide-react";
import {
  getBranches,
  addBranch,
  updateBranch,
  deleteBranch,
  type BranchInput,
} from "@/lib/branches";
import { useBranch } from "@/context/BranchContext";
import type { Branch } from "@/types";

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function BranchesPage() {
  const { reload: reloadContext } = useBranch();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchInput>({ name: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getBranches();
      setBranches(data);
    } catch {
      setError("Failed to load branches.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditingBranch(null);
    setForm({ name: "", address: "" });
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(b: Branch) {
    setEditingBranch(b);
    setForm({ name: b.name, address: b.address });
    setFormError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingBranch(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, form);
      } else {
        await addBranch(form);
      }
      setShowForm(false);
      await load();
      await reloadContext();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save branch.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await deleteBranch(id);
      setConfirmDeleteId(null);
      await load();
      await reloadContext();
    } catch {
      setError("Failed to delete branch. Make sure it has no parts or movements.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your store locations
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          Add Branch
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">
            {editingBranch ? "Edit Branch" : "New Branch"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Branch Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClass}
                placeholder="e.g. Makati Branch"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className={inputClass}
                placeholder="e.g. 123 Ayala Ave, Makati City"
              />
            </div>
            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? "Saving…" : editingBranch ? "Update" : "Add Branch"}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Branch list */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-12">Loading…</p>
        ) : branches.length === 0 ? (
          <div className="text-center py-16 px-6">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No branches yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Add your first branch to start managing inventory per location.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {branches.map((b) => (
              <li key={b.id} className="flex items-center gap-4 px-5 py-4">
                <div className="bg-blue-50 rounded-lg p-2 shrink-0">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{b.name}</p>
                  {b.address && (
                    <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {b.address}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {confirmDeleteId === b.id ? (
                    <>
                      <span className="text-xs text-red-600 mr-1">Delete?</span>
                      <button
                        onClick={() => handleDelete(b.id)}
                        disabled={deleting}
                        className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-medium rounded-md transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-md transition-colors"
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => openEdit(b)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(b.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
