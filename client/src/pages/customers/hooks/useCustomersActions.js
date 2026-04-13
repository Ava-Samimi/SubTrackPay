// client/src/pages/customers/hooks/useCustomersActions.js
import { createCustomer, updateCustomer, deleteCustomer } from "../customersApi.js";
import { normalizeCustomerPayload } from "./customersFormat.js";

/**
 * All handlers are here so you can tweak behavior one-by-one.
 */
export function useCustomersActions(state, loadAll) {
  const {
    customers,
    setCustomers,
    subCounts,
    setSubCounts,
    setError,

    editingId,
    setEditingId,
    isEditing,

    // list mode
    listMode,
    setListMode,
    selectedIds: _selectedIds, // intentionally unused for now
    setSelectedIds,

    // fields
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    postalCode,
    setPostalCode,
    ccExpiration,
    setCcExpiration,
  } = state;

  function resetForm() {
    setEditingId(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPostalCode("");
    setCcExpiration("");
  }

  function toggleListMode() {
    setListMode((prev) => {
      const next = !prev;
      setSelectedIds([]);
      resetForm();
      return next;
    });
  }

  function toggleRowSelection(customerID) {
    setSelectedIds((prev) => {
      if (prev.includes(customerID)) return prev.filter((id) => id !== customerID);
      return [...prev, customerID];
    });
  }

  function selectCustomerRow(c) {
    setEditingId(c.customerID);
    setFirstName(c.firstName || "");
    setLastName(c.lastName || "");
    setEmail(c.email || "");
    setPostalCode(c.postalCode || "");
    setCcExpiration(c.ccExpiration ? String(c.ccExpiration).slice(0, 10) : "");
  }

  async function submitForm(e) {
    e.preventDefault();
    setError("");

    if (listMode) return;

    try {
      // Option A: if user leaves postalCode blank, default it for testing
      const pc = (postalCode || "").trim() || "H2X 1Y4";

      const payload = normalizeCustomerPayload({
        firstName,
        lastName,
        email,
        ccExpiration,
        postalCode: pc,
      });

      // Ensure we never send empty strings for optional fields
      payload.email = (payload.email || "").trim() ? payload.email.trim() : null;
      payload.ccExpiration = payload.ccExpiration ? payload.ccExpiration : null;

      // Ensure postalCode is always present + trimmed
      payload.postalCode = pc;

      if (isEditing) {
        const updated = await updateCustomer(editingId, payload);
        setCustomers(customers.map((x) => (x.customerID === updated.customerID ? updated : x)));
      } else {
        const created = await createCustomer(payload);
        setCustomers([created, ...customers]);
      }

      await loadAll();
      resetForm();
    } catch (e2) {
      setError(e2?.message || "Failed to fetch");
    }
  }

  async function deleteSelected() {
    if (!editingId) return;
    setError("");

    if (listMode) return;

    try {
      await deleteCustomer(editingId);

      setCustomers(customers.filter((c) => c.customerID !== editingId));

      const copy = { ...subCounts };
      delete copy[editingId];
      setSubCounts(copy);

      resetForm();
    } catch (e) {
      setError(e?.message || "Failed to fetch");
    }
  }

  return {
    resetForm,
    toggleListMode,
    toggleRowSelection,
    selectCustomerRow,
    submitForm,
    deleteSelected,
  };
}
