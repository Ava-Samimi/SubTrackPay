import { useEffect, useMemo, useState } from "react";
import { useListMode } from "../../../hooks/useListMode.js";
import { listPackages, createPackage, updatePackage, deletePackage } from "../packagesApi.js";

function shortId(id) {
  return String(id || "").slice(0, 4);
}

function toNumOrNull(v) {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export function usePackagesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const [name, setName] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [annualPrice, setAnnualPrice] = useState("");

  const list = useListMode();

  const selectedItem = useMemo(() => {
    if (editingId == null) return null;
    return items.find((x) => String(x.id) === String(editingId)) || null;
  }, [items, editingId]);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const data = await listPackages();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Failed to fetch packages");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function resetForm() {
    setEditingId(null);
    setName("");
    setMonthlyPrice("");
    setAnnualPrice("");
  }

  function selectRow(item) {
    // normalize id to string to avoid number/string mismatch bugs
    setEditingId(item?.id != null ? String(item.id) : null);
    setName(item?.name || "");
    setMonthlyPrice(item?.monthlyPrice == null ? "" : String(item.monthlyPrice));
    setAnnualPrice(item?.annualPrice == null ? "" : String(item.annualPrice));
  }

  async function submit(e) {
    e?.preventDefault?.();
    if (list.listMode) return; // keep your rule: no editing while in list mode

    setError("");

    const payload = {
      name: String(name || "").trim(),
      monthlyPrice: toNumOrNull(monthlyPrice),
      annualPrice: toNumOrNull(annualPrice),
    };

    if (!payload.name) return setError("name is required");
    if (Number.isNaN(payload.monthlyPrice) || Number.isNaN(payload.annualPrice)) {
      return setError("monthlyPrice and annualPrice must be valid numbers");
    }

    // If your DB requires both prices, enforce it here:
    if (payload.monthlyPrice == null || payload.annualPrice == null) {
      return setError("monthlyPrice and annualPrice are required");
    }

    try {
      if (isEditing) {
        await updatePackage(editingId, payload);
      } else {
        await createPackage(payload);
      }
      await loadAll();
      resetForm();
    } catch (e2) {
      setError(e2?.message || "Failed to save package");
    }
  }

  // Single delete (edit mode)
  async function removeCurrent() {
    if (!editingId) return;
    setError("");
    try {
      await deletePackage(editingId);
      await loadAll();
      resetForm();
    } catch (e) {
      setError(e?.message || "Failed to delete package");
    }
  }

  // Bulk delete (list mode)
  async function removeSelected() {
    if (!list.listMode) {
      // keep backward compatibility with your page calling removeSelected from edit mode
      return removeCurrent();
    }

    const ids = list.selectedIds || [];
    if (ids.length === 0) return setError("No packages selected");

    setError("");
    try {
      // simplest: fire sequentially (safe + predictable)
      for (const id of ids) {
        await deletePackage(id);
      }
      await loadAll();
      list.clearSelection?.(); // if your hook has it
    } catch (e) {
      setError(e?.message || "Failed to delete selected packages");
    }
  }

  return {
    items,
    loading,
    error,
    editingId,
    isEditing,
    selectedItem,
    name,
    setName,
    monthlyPrice,
    setMonthlyPrice,
    annualPrice,
    setAnnualPrice,
    loadAll,
    resetForm,
    selectRow,
    submit,
    removeSelected,  // now works in both modes
    removeCurrent,   // optional if you want to call directly
    shortId,
    list,
  };
}
