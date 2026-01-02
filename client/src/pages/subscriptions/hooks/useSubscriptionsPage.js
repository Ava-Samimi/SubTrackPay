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

function customerLabel(c) {
  const fn = (c?.firstName || "").trim();
  const ln = (c?.lastName || "").trim();
  const name = `${fn} ${ln}`.trim();
  return name || c?.email || "";
}

function packageLabel(p) {
  if (!p) return "";
  return `Pkg ${shortId(p.packageID)} • M ${p.monthlyCost} • A ${p.annualCost}`;
}

function toIntOrNaN(v) {
  const s = String(v ?? "").trim();
  if (!s) return NaN;
  const n = Number(s);
  if (!Number.isFinite(n)) return NaN;
  if (!Number.isInteger(n)) return NaN;
  return n;
}

export function useSubscriptionsPage() {
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [packages, setPackages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null); // subscriptionID (number)
  const isEditing = useMemo(() => editingId !== null, [editingId]);

  // ✅ stored IDs (what the API needs) — ints
  const [customerID, setCustomerID] = useState(null);
  const [packageID, setPackageID] = useState(null);

  // ✅ typed text shown in the input
  const [customerQuery, setCustomerQuery] = useState("");
  const [packageQuery, setPackageQuery] = useState("");

  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [status, setStatus] = useState("ACTIVE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");

  const selectedItem = useMemo(
    () => items.find((x) => x.subscriptionID === editingId) || null,
    [items, editingId]
  );

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.customerID === customerID) || null,
    [customers, customerID]
  );

  const selectedPackage = useMemo(
    () => packages.find((p) => p.packageID === packageID) || null,
    [packages, packageID]
  );

  const list = useListMode();

  const loadAllSubscriptions = useCallback(async () => {
    const data = await listSubscriptions();
    setItems(Array.isArray(data) ? data : []);
  }, []);

  const loadLookups = useCallback(async () => {
    const [cs, ps] = await Promise.all([listCustomers(), listPackages()]);
    setCustomers(Array.isArray(cs) ? cs : []);
    setPackages(Array.isArray(ps) ? ps : []);
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

    setCustomerID(null);
    setPackageID(null);
    setCustomerQuery("");
    setPackageQuery("");

    setBillingCycle("MONTHLY");
    setStatus("ACTIVE");
    setStartDate("");
    setEndDate("");
    setPrice("");
  }

  function selectRow(item) {
    setEditingId(item.subscriptionID);

    setCustomerID(item.customerID ?? null);
    setPackageID(item.packageID ?? null);

    // Prefer included objects from API (we set include in the backend)
    const c = item.customer || customers.find((x) => x.customerID === item.customerID);
    setCustomerQuery(c ? customerLabel(c) : "");

    const p = item.package || packages.find((x) => x.packageID === item.packageID);
    setPackageQuery(p ? packageLabel(p) : "");

    setBillingCycle(item.billingCycle || "MONTHLY");
    setStatus(item.status || "ACTIVE");
    setStartDate(dateToInput(item.startDate));
    setEndDate(dateToInput(item.endDate));
    setPrice(String(item.price ?? ""));
  }

  // ✅ when picking from autocomplete
  function pickCustomer(c) {
    setCustomerID(c.customerID);
    setCustomerQuery(customerLabel(c));
  }

  function pickPackage(p) {
    setPackageID(p.packageID);
    setPackageQuery(packageLabel(p));
  }

  // ✅ if user edits query manually after selecting, keep ID unless they clear
  function onCustomerQueryChange(txt) {
    setCustomerQuery(txt);
    if (!txt.trim()) setCustomerID(null);
  }

  function onPackageQueryChange(txt) {
    setPackageQuery(txt);
    if (!txt.trim()) setPackageID(null);
  }

  async function submit(e) {
    e.preventDefault();
    if (list.listMode) return;

    setError("");

    const priceInt = toIntOrNaN(price);

    const payload = {
      customerID,
      packageID,
      billingCycle,
      status, // required by schema
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      price: priceInt,
    };

    if (!payload.customerID) return setError("Pick a customer from the list.");
    if (!payload.packageID) return setError("Pick a package from the list.");
    if (Number.isNaN(payload.price)) return setError("price must be an integer");

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
    // keep your old behavior: only delete in edit mode (not list mode)
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
    price,
    setPrice,

    loadAll,
    resetForm,
    selectRow,
    submit,
    removeSelected,

    shortId,
    list,
  };
}
