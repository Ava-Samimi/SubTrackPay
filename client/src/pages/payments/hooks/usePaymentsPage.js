import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useListMode } from "../../../hooks/useListMode.js";
import { listPayments, createPayment, updatePayment, deletePayment } from "../paymentsApi.js";
import { listSubscriptions } from "../../subscriptions/subscriptionsApi.js";

function shortId(id) {
  return String(id || "").slice(0, 4);
}

function dateToInput(d) {
  if (!d) return "";
  return String(d).slice(0, 10);
}

function toIntOrNaN(v) {
  const s = String(v ?? "").trim();
  if (!s) return NaN;
  const n = Number(s);
  if (!Number.isFinite(n)) return NaN;
  if (!Number.isInteger(n)) return NaN;
  return n;
}

export function usePaymentsPage() {
  const [items, setItems] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null); // paymentID (number)
  const isEditing = useMemo(() => editingId !== null, [editingId]);

  // form
  const [subscriptionID, setSubscriptionID] = useState(""); // from <select>, convert on submit
  const [dueDate, setDueDate] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [status, setStatus] = useState("DUE");

  const selectedItem = useMemo(
    () => items.find((x) => x.paymentID === editingId) || null,
    [items, editingId]
  );

  // list mode
  const list = useListMode();

  // ✅ prevent effect loops: keep clearSelection in a ref
  const clearSelectionRef = useRef(null);
  useEffect(() => {
    clearSelectionRef.current = list.clearSelection || null;
  }, [list.clearSelection]);

  // ✅ flatten list-mode exports (Customers-style)
  const listMode = list.listMode;
  const selectedIds = list.selectedIds || [];
  const selectedCount = list.selectedCount ?? selectedIds.length;
  const toggleListMode = list.toggleListMode;
  const toggleRowSelection = list.toggleRowSelection;

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [paymentsData, subsData] = await Promise.all([listPayments(), listSubscriptions()]);
      setItems(Array.isArray(paymentsData) ? paymentsData : []);
      setSubscriptions(Array.isArray(subsData) ? subsData : []);

      // Optional: clear list selection after refresh
      clearSelectionRef.current?.();
    } catch (e) {
      setError(e?.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function resetForm() {
    setEditingId(null);
    setSubscriptionID("");
    setDueDate("");
    setPaidAt("");
    setStatus("DUE");
  }

  function selectRow(item) {
    setEditingId(item.paymentID);
    setSubscriptionID(item.subscriptionID != null ? String(item.subscriptionID) : "");
    setDueDate(dateToInput(item.dueDate));
    setPaidAt(dateToInput(item.paidAt));
    setStatus(item.status || "DUE");
  }

  async function submit(e) {
    e?.preventDefault?.();
    if (listMode) return;

    setError("");

    const subIdInt = toIntOrNaN(subscriptionID);

    const payload = {
      subscriptionID: subIdInt,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      paidAt: paidAt ? new Date(paidAt).toISOString() : null,
      status,
    };

    if (Number.isNaN(payload.subscriptionID)) return setError("subscriptionID is required");
    if (!dueDate) return setError("dueDate is required");

    try {
      if (isEditing) await updatePayment(editingId, payload);
      else await createPayment(payload);

      await loadAll();
      resetForm();
    } catch (e2) {
      setError(e2?.message || "Failed to save payment");
    }
  }

  // ✅ Delete: edit-mode single delete OR list-mode bulk delete
  async function removeSelected() {
    setError("");

    try {
      if (!listMode) {
        if (!editingId) return;
        await deletePayment(editingId);
        await loadAll();
        resetForm();
        return;
      }

      if (selectedIds.length === 0) return setError("No payments selected");

      const results = await Promise.allSettled(selectedIds.map((id) => deletePayment(id)));

      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) setError(`Failed to delete ${failed.length} payment(s)`);

      await loadAll();
      clearSelectionRef.current?.();
    } catch (e) {
      setError(e?.message || "Failed to delete payment(s)");
    }
  }

  return {
    items,
    subscriptions,
    loading,
    error,

    editingId,
    isEditing,
    selectedItem,

    // form
    subscriptionID,
    setSubscriptionID,
    dueDate,
    setDueDate,
    paidAt,
    setPaidAt,
    status,
    setStatus,

    // actions
    loadAll,
    resetForm,
    selectRow,
    submit,
    removeSelected,

    // ✅ Customers-style list-mode exports
    listMode,
    selectedIds,
    selectedCount,
    toggleListMode,
    toggleRowSelection,

    shortId,

    // keep list object for backward compatibility
    list,
  };
}
