// client/src/pages/packages/hooks/usePackagesPage.js
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
  if (!Number.isInteger(n)) return NaN;
  return n;
}

function toTrimmedStringOrNull(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
}

export function usePackagesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null); // string id for safety with listMode
  const isEditing = useMemo(() => editingId !== null, [editingId]);

  // ✅ NEW: name
  const [name, setName] = useState("");

  const [monthlyCost, setMonthlyCost] = useState("");
  const [annualCost, setAnnualCost] = useState("");

  const list = useListMode();

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
    setName("");
    setMonthlyCost("");
    setAnnualCost("");
  }

  function selectRow(item) {
    setEditingId(item?.packageID != null ? String(item.packageID) : null);

    // ✅ load name from API (your model is `name`)
    setName(item?.name == null ? "" : String(item.name));

    setMonthlyCost(item?.monthlyCost == null ? "" : String(item.monthlyCost));
    setAnnualCost(item?.annualCost == null ? "" : String(item.annualCost));
  }

  async function submit(e) {
    e?.preventDefault?.();
    if (listMode) return;

    setError("");

    const nm = toTrimmedStringOrNull(name);
    if (!nm) return setError("name is required");

    const payload = {
      name: nm,
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

  async function removeSelected() {
    if (!listMode) {
      return removeCurrent();
    }

    if (selectedIds.length === 0) return setError("No packages selected");

    setError("");
    try {
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
    name,
    setName,
    monthlyCost,
    setMonthlyCost,
    annualCost,
    setAnnualCost,

    // actions
    loadAll,
    resetForm,
    selectRow,
    submit,

    // list-mode API
    listMode,
    selectedIds,
    selectedCount,
    toggleListMode,
    toggleRowSelection,

    // delete
    removeSelected,
    removeCurrent,

    // utils
    shortId,

    list,
  };
}
