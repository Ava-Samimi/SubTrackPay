import { useEffect, useMemo, useState } from "react";
import { useListMode } from "../../../hooks/useListMode.js";
import { listPayments, createPayment, updatePayment, deletePayment } from "../paymentsApi.js";
import { listSubscriptions } from "../../subscriptions/subscriptionsApi.js"; // ✅ ADD

function shortId(id) {
  return String(id || "").slice(0, 4);
}

export function usePaymentsPage() {
  const [items, setItems] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]); // ✅ ADD

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const [subscriptionId, setSubscriptionId] = useState("");
  const [amountCents, setAmountCents] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [status, setStatus] = useState("DUE");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const selectedItem = useMemo(
    () => items.find((x) => x.id === editingId) || null,
    [items, editingId]
  );

  const list = useListMode();

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      // ✅ Load BOTH payments and subscriptions (so dropdown can be populated)
      const [paymentsData, subsData] = await Promise.all([
        listPayments(),
        listSubscriptions(),
      ]);

      setItems(paymentsData);
      setSubscriptions(Array.isArray(subsData) ? subsData : []);
    } catch (e) {
      setError(e?.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function resetForm() {
    setEditingId(null);
    setSubscriptionId("");
    setAmountCents("");
    setDueDate("");
    setPaidAt("");
    setStatus("DUE");
    setPeriodStart("");
    setPeriodEnd("");
  }

  function selectRow(item) {
    setEditingId(item.id);
    setSubscriptionId(item.subscriptionId || "");
    setAmountCents(String(item.amountCents ?? ""));
    setDueDate(item.dueDate ? String(item.dueDate).slice(0, 10) : "");
    setPaidAt(item.paidAt ? String(item.paidAt).slice(0, 10) : "");
    setStatus(item.status || "DUE");
    setPeriodStart(item.periodStart ? String(item.periodStart).slice(0, 10) : "");
    setPeriodEnd(item.periodEnd ? String(item.periodEnd).slice(0, 10) : "");
  }

  async function submit(e) {
    e.preventDefault();
    if (list.listMode) return;

    setError("");
    const payload = {
      subscriptionId: String(subscriptionId || "").trim(),
      amountCents: Number(amountCents),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      paidAt: paidAt ? new Date(paidAt).toISOString() : null,
      status,
      periodStart: periodStart ? new Date(periodStart).toISOString() : undefined,
      periodEnd: periodEnd ? new Date(periodEnd).toISOString() : undefined,
    };

    if (!payload.subscriptionId) return setError("subscriptionId is required");
    if (Number.isNaN(payload.amountCents)) return setError("amountCents must be a number");
    if (!dueDate) return setError("dueDate is required");
    if (!periodStart) return setError("periodStart is required");
    if (!periodEnd) return setError("periodEnd is required");

    try {
      if (isEditing) await updatePayment(editingId, payload);
      else await createPayment(payload);

      await loadAll();
      resetForm();
    } catch (e2) {
      setError(e2?.message || "Failed to fetch");
    }
  }

  async function removeSelected() {
    if (!editingId || list.listMode) return;
    setError("");
    try {
      await deletePayment(editingId);
      await loadAll();
      resetForm();
    } catch (e) {
      setError(e?.message || "Failed to fetch");
    }
  }

  return {
    items,
    subscriptions, // ✅ EXPOSE TO PAGE
    loading,
    error,
    editingId,
    isEditing,
    selectedItem,

    subscriptionId,
    setSubscriptionId,
    amountCents,
    setAmountCents,
    dueDate,
    setDueDate,
    paidAt,
    setPaidAt,
    status,
    setStatus,
    periodStart,
    setPeriodStart,
    periodEnd,
    setPeriodEnd,

    loadAll,
    resetForm,
    selectRow,
    submit,
    removeSelected,
    shortId,
    list,
  };
}
