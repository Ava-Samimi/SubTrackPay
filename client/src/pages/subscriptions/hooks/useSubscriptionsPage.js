import { useCallback, useEffect, useMemo, useState } from "react";
import { useListMode } from "../../../hooks/useListMode.js";
import {
  listSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  listCustomers,
  listPackages,
} from "../subscriptionsApi.js";

function shortId(id) {
  return String(id || "").slice(0, 4);
}

function dateToInput(d) {
  if (!d) return "";
  return String(d).slice(0, 10);
}

export function useSubscriptionsPage() {
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [packages, setPackages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const isEditing = useMemo(() => editingId !== null, [editingId]);

  // ✅ stored IDs (what the API needs)
  const [customerId, setCustomerId] = useState("");
  const [packageId, setPackageId] = useState("");

  // ✅ typed text shown in the input
  const [customerQuery, setCustomerQuery] = useState("");
  const [packageQuery, setPackageQuery] = useState("");

  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [status, setStatus] = useState("ACTIVE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priceCents, setPriceCents] = useState("");

  const selectedItem = useMemo(
    () => items.find((x) => x.id === editingId) || null,
    [items, editingId]
  );

  // for showing "current selection" label even if query changes
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId) || null,
    [customers, customerId]
  );
  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === packageId) || null,
    [packages, packageId]
  );

  const list = useListMode();

  const loadAllSubscriptions = useCallback(async () => {
    const data = await listSubscriptions();
    setItems(data);
  }, []);

  const loadLookups = useCallback(async () => {
    const [cs, ps] = await Promise.all([listCustomers(), listPackages()]);
    setCustomers(cs);
    setPackages(ps);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadLookups(), loadAllSubscriptions()]);
    } catch (e) {
      setError(e?.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [loadLookups, loadAllSubscriptions]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function resetForm() {
    setEditingId(null);

    setCustomerId("");
    setPackageId("");
    setCustomerQuery("");
    setPackageQuery("");

    setBillingCycle("MONTHLY");
    setStatus("ACTIVE");
    setStartDate("");
    setEndDate("");
    setPriceCents("");
  }

  function selectRow(item) {
    setEditingId(item.id);

    setCustomerId(item.customerId || "");
    setPackageId(item.packageId || "");

    // set queries to friendly labels
    const c = customers.find((x) => x.id === item.customerId);
    setCustomerQuery(c ? c.name || c.email || "" : "");

    const p = packages.find((x) => x.id === item.packageId);
    setPackageQuery(p ? p.name || "" : "");

    setBillingCycle(item.billingCycle || "MONTHLY");
    setStatus(item.status || "ACTIVE");
    setStartDate(dateToInput(item.startDate));
    setEndDate(dateToInput(item.endDate));
    setPriceCents(String(item.priceCents ?? ""));
  }

  // ✅ when picking from autocomplete
  function pickCustomer(c) {
    setCustomerId(c.id);
    setCustomerQuery(c.name || c.email || "");
  }
  function pickPackage(p) {
    setPackageId(p.id);
    setPackageQuery(p.name || "");
  }

  // ✅ if user edits query manually after selecting, keep ID unless they clear
  function onCustomerQueryChange(txt) {
    setCustomerQuery(txt);
    if (!txt.trim()) setCustomerId("");
  }
  function onPackageQueryChange(txt) {
    setPackageQuery(txt);
    if (!txt.trim()) setPackageId("");
  }

  async function submit(e) {
    e.preventDefault();
    if (list.listMode) return;

    setError("");

    const payload = {
      customerId: String(customerId || "").trim(),
      packageId: String(packageId || "").trim(),
      billingCycle,
      status,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      priceCents: Number(priceCents),
    };

    if (!payload.customerId) return setError("Pick a customer from the list.");
    if (!payload.packageId) return setError("Pick a package from the list.");
    if (Number.isNaN(payload.priceCents)) return setError("priceCents must be a number");

    try {
      if (isEditing) await updateSubscription(editingId, payload);
      else await createSubscription(payload);

      await loadAllSubscriptions();
      resetForm();
    } catch (e2) {
      setError(e2?.message || "Failed to fetch");
    }
  }

  async function removeSelected() {
    if (!editingId || list.listMode) return;
    setError("");
    try {
      await deleteSubscription(editingId);
      await loadAllSubscriptions();
      resetForm();
    } catch (e) {
      setError(e?.message || "Failed to fetch");
    }
  }

  return {
    items,
    customers,
    packages,
    loading,
    error,

    editingId,
    isEditing,
    selectedItem,

    customerId,
    packageId,

    customerQuery,
    packageQuery,
    onCustomerQueryChange,
    onPackageQueryChange,
    pickCustomer,
    pickPackage,

    selectedCustomer,
    selectedPackage,

    billingCycle,
    setBillingCycle,
    status,
    setStatus,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    priceCents,
    setPriceCents,

    loadAll,
    resetForm,
    selectRow,
    submit,
    removeSelected,

    shortId,
    list,
  };
}
