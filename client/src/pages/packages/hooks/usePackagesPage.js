import { useEffect, useMemo, useState } from "react";
import { useListMode } from "../../../hooks/useListMode.js";
import { listPackages, createPackage, updatePackage, deletePackage } from "../packagesApi.js";

function shortId(id) {
  return String(id || "").slice(0, 4);
}

function toIntOrNull(v) {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return NaN;
  // enforce integer costs (schema is Int)
  if (!Number.isInteger(n)) return NaN;
  return n;
}

export function usePackagesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null); // string id for safety with listMode
  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const [monthlyCost, setMonthlyCost] = useState("");
  const [annualCost, setAnnualCost] = useState("");

  // list mode hook (internal object)
  const list = useListMode();

  // ✅ flatten list-mode API to match CustomersPage style
  const listMode = list.listMode;
  const selectedIds = list.selectedIds || [];
  const selectedCount = list.selectedCount ?? selectedIds.length;

  const toggleListMode = list.toggleListMode;
  const toggleRowSelection = list.toggleRowSelection;

  const selectedItem = useMemo(() => {
    if (editingId == null) return null;
    return items.find((x) => String(x.packageID) === String(editingId)) || null;
  }, [items, editingId]);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const data = await listPackages();
      const next = Array.isArray(data) ? data : [];
      setItems(next);

      // Optional: if data changed, keep selection sane
      // If your useListMode exposes clearSelection, this helps avoid "ghost" selections.
      // Comment this out if you want selection to persist across refreshes.
      list.clearSelection?.();
    } catch (e) {
      setError(e?.message || "Failed to fetch packages");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setEditingId(null);
    setMonthlyCost("");
    setAnnualCost("");
  }

  function selectRow(item) {
    setEditingId(item?.packageID != null ? String(item.packageID) : null);
    setMonthlyCost(item?.monthlyCost == null ? "" : String(item.monthlyCost));
    setAnnualCost(item?.annualCost == null ? "" : String(item.annualCost));
  }

  async function submit(e) {
    e?.preventDefault?.();
    if (listMode) return; // no editing while in list mode

    setError("");

    const payload = {
      monthlyCost: toIntOrNull(monthlyCost),
      annualCost: toIntOrNull(annualCost),
    };

    if (Number.isNaN(payload.monthlyCost) || Number.isNaN(payload.annualCost)) {
      return setError("monthlyCost and annualCost must be valid integers");
    }
    if (payload.monthlyCost == null || payload.annualCost == null) {
      return setError("monthlyCost and annualCost are required");
    }
    if (payload.monthlyCost < 0 || payload.annualCost < 0) {
      return setError("monthlyCost and annualCost must be non-negative");
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
      setError(e?.message || "Failed to delete package (it may be in use)");
    }
  }

  // Bulk delete (list mode) OR single delete fallback (edit mode)
  async function removeSelected() {
    if (!listMode) {
      // backward compatible: page may call removeSelected while not in list mode
      return removeCurrent();
    }

    if (selectedIds.length === 0) return setError("No packages selected");

    setError("");
    try {
      // delete all (don’t stop at first failure)
      const results = await Promise.allSettled(selectedIds.map((id) => deletePackage(id)));

      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        setError(`Failed to delete ${failed.length} package(s) (some may be in use)`);
      }

      await loadAll();
      list.clearSelection?.();
    } catch (e) {
      setError(e?.message || "Failed to delete selected packages (some may be in use)");
    }
  }

  return {
    // data
    items,
    loading,
    error,
    editingId,
    isEditing,
    selectedItem,

    // form
    monthlyCost,
    setMonthlyCost,
    annualCost,
    setAnnualCost,

    // actions
    loadAll,
    resetForm,
    selectRow,
    submit,

    // ✅ customers-like list-mode API (top-level)
    listMode,
    selectedIds,
    selectedCount,
    toggleListMode,
    toggleRowSelection,

    // delete
    removeSelected, // works in both modes
    removeCurrent, // optional

    // utils
    shortId,

    // keep original list object too (in case other code uses it)
    list,
  };
}
