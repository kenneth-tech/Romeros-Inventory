"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { getBranches } from "@/lib/branches";
import { getUserBranches } from "@/lib/user-management";
import type { Branch } from "@/types";

interface BranchContextValue {
  branches: Branch[];
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch) => void;
  loading: boolean;
  reload: () => Promise<void>;
}

const BranchContext = createContext<BranchContextValue | null>(null);

const STORAGE_KEY = "romeros_selected_branch_id";

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranchState] = useState<Branch | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      // First, try to get user's assigned branches
      let displayBranches: Branch[] = [];
      try {
        const userBranches = await getUserBranches();
        displayBranches = userBranches as Branch[];
      } catch {
        // If user branches fails, try to get all branches (for admins)
        try {
          displayBranches = await getBranches();
        } catch {
          // If both fail, stay empty
          displayBranches = [];
        }
      }
      
      setBranches(displayBranches);

      // Restore previously selected branch, or default to first
      const savedId =
        typeof window !== "undefined"
          ? localStorage.getItem(STORAGE_KEY)
          : null;

      const restored = savedId
        ? displayBranches.find((b) => b.id === savedId) ?? null
        : null;

      setSelectedBranchState(restored ?? displayBranches[0] ?? null);
    } catch {
      // silently fail; branch context just stays empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function setSelectedBranch(branch: Branch) {
    setSelectedBranchState(branch);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, branch.id);
    }
  }

  return (
    <BranchContext.Provider
      value={{ branches, selectedBranch, setSelectedBranch, loading, reload }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch(): BranchContextValue {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used inside BranchProvider");
  return ctx;
}
