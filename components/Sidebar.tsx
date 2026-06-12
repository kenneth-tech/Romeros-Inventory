"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  FileBarChart,
  LogOut,
  Building2,
  ChevronDown,
  History,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useBranch } from "@/context/BranchContext";
import { useState, useRef, useEffect } from "react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parts", label: "Parts", icon: Package },
  { href: "/stock", label: "Stock Movement", icon: ArrowLeftRight },
  { href: "/history", label: "History", icon: History },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/branches", label: "Branches", icon: Building2 },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { branches, selectedBranch, setSelectedBranch, loading } = useBranch();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-gray-900 text-white shrink-0">
      {/* Brand */}
      <div className="flex items-center justify-center px-5 py-4 border-b border-gray-700">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.jpg"
          alt="Cool Romeros"
          width={100}
          height={100}
          className="rounded-lg object-contain"
        />
      </div>

      {/* Branch Selector */}
      <div className="px-3 py-3 border-b border-gray-700" ref={dropdownRef}>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 px-1">
          Branch
        </p>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center justify-between w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white transition-colors"
          disabled={loading}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">
              {loading
                ? "Loading…"
                : selectedBranch?.name ?? "No branches yet"}
            </span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {dropdownOpen && branches.length > 0 && (
          <div className="mt-1 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-lg z-50">
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setSelectedBranch(b);
                  setDropdownOpen(false);
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors ${
                  selectedBranch?.id === b.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{b.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

