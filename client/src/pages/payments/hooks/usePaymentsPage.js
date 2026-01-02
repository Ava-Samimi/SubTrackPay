import { useEffect, useMemo, useState } from "react";
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

  const [editingId, setEditingId] = useState(null); // paymentID
  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const [subscriptionID, setSubscriptionID] = useState(""); // stored as string from <select>, convert on submit
  const [dueDate, setDueDate] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [status, setStatus] = useState("DUE");

  const selectedItem = useMemo(
    () => items.find((x) => x.paymentID === editingId) || null,
    [items, editingId]
  );

  const list = useListMode();

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [paymentsData, subsData] = await Promise.all([listPayments(), listSubscriptions()]);
      setItems(Array.isArray(paymentsData) ? paymentsData : []);
      setSubscriptions(Array.isArray(subsData) ? subsData : []);
    } catch (e) {
      setError(e?.message || "Failed to fetch");
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
    e.preventDefault();
    if (list.listMode) return;

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

  async function removeSelected() {
    if (!editingId || list.listMode) return;
    setError("");
    try {
      await deletePayment(editingId);
      await loadAll();
      resetForm();
    } catch (e) {
      setError(e?.message || "Failed to delete payment");
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

    subscriptionID,
    setSubscriptionID,
    dueDate,
    setDueDate,
    paidAt,
    setPaidAt,
    status,
    setStatus,

    loadAll,
    resetForm,
    selectRow,
    submit,
    removeSelected,
    shortId,
    list,
  };
}
