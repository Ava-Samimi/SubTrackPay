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

  const list = useListMode();

  const selectedItem = useMemo(() => {
    if (editingId == null) return null;
    return items.find((x) => String(x.packageID) === String(editingId)) || null;
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
    if (list.listMode) return; // keep your rule: no editing while in list mode

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
      for (const id of ids) {
        await deletePackage(id);
      }
      await loadAll();
      list.clearSelection?.();
    } catch (e) {
      setError(e?.message || "Failed to delete selected packages (some may be in use)");
    }
  }

  return {
    items,
    loading,
    error,
    editingId,
    isEditing,
    selectedItem,

    monthlyCost,
    setMonthlyCost,
    annualCost,
    setAnnualCost,

    loadAll,
    resetForm,
    selectRow,
    submit,

    removeSelected, // works in both modes
    removeCurrent,  // optional
    shortId,
    list,
  };
}
