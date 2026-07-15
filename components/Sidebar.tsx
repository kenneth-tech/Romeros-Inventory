"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useBranch } from "@/context/BranchContext";
import { useRef } from "react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parts", label: "Parts", icon: Package },
  { href: "/stock", label: "Stock Movement", icon: ArrowLeftRight },
  { href: "/history", label: "History", icon: History },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/branches", label: "Branches", icon: Building2 },
  { href: "/profile", label: "Profile", icon: User },
];

const adminLinks = [
  { href: "/admin", label: "Admin", icon: Settings },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { branches, selectedBranch, setSelectedBranch, loading } = useBranch();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user profile to check if admin
  useEffect(() => {
    async function checkAdmin() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          setIsAdmin(profile?.role === "admin");
        }
      } catch (err) {
        console.error("Failed to check admin status:", err);
      } finally {
        setUserLoading(false);
      }
    }
    checkAdmin();
  }, []);

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
    <aside className="flex flex-col w-60 min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 text-white shrink-0 shadow-2xl">
      {/* Brand */}
      <div className="flex items-center justify-center px-5 py-6 border-b border-slate-700/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.jpg"
          alt="Cool Romeros"
          width={100}
          height={100}
          className="rounded-lg object-contain shadow-md"
        />
      </div>

      {/* Branch Selector */}
      <div className="px-3 py-4 border-b border-slate-700/50" ref={dropdownRef}>
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2.5 px-1 font-semibold">
          Current Branch
        </p>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center justify-between w-full px-3 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-all duration-200 shadow-sm hover:shadow-md"
          disabled={loading}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Building2 className="w-4 h-4 text-slate-300 shrink-0" />
            <span className="truncate font-medium">
              {loading
                ? "Loading…"
                : selectedBranch?.name ?? "No branches"}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-300 shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {dropdownOpen && branches.length > 0 && (
          <div className="mt-2 bg-slate-700 rounded-lg overflow-hidden border border-slate-600 shadow-lg z-50">
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setSelectedBranch(b);
                  setDropdownOpen(false);
                }}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-left transition-all ${
                  selectedBranch?.id === b.id
                    ? "bg-blue-600 text-white font-medium"
                    : "text-slate-300 hover:bg-slate-600"
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span className="truncate">{b.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1.5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
        {isAdmin && (
          <>
            <div className="h-px bg-slate-700/50 my-2"></div>
            {adminLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-slate-700/50">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-600/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-4.5 h-4.5 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

