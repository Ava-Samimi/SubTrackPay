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

    // new fields
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    ccExpiration,
    setCcExpiration,
  } = state;

  function resetForm() {
    setEditingId(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setCcExpiration("");
  }

  // ✅ Toggle list mode ON/OFF
  function toggleListMode() {
    setListMode((prev) => {
      const next = !prev;

      // when entering/exiting list mode, clear multi-select + normal edit selection
      setSelectedIds([]);
      resetForm();

      return next;
    });
  }

  // ✅ Row click behavior for list mode (multi-select)
  function toggleRowSelection(customerID) {
    setSelectedIds((prev) => {
      if (prev.includes(customerID)) return prev.filter((id) => id !== customerID);
      return [...prev, customerID];
    });
  }

  /**
   * ✅ NORMAL ROW CLICK BEHAVIOR (edit mode)
   * Only used when listMode is OFF.
   */
  function selectCustomerRow(c) {
    setEditingId(c.customerID); // toggles edit mode
    setFirstName(c.firstName || "");
    setLastName(c.lastName || "");
    setEmail(c.email || "");
    setCcExpiration(c.ccExpiration ? String(c.ccExpiration).slice(0, 10) : ""); // YYYY-MM-DD
  }

  async function submitForm(e) {
    e.preventDefault();
    setError("");

    // If in list mode, ignore form submits (optional safety)
    if (listMode) return;

    try {
      const payload = normalizeCustomerPayload({ firstName, lastName, email, ccExpiration });

      if (isEditing) {
        const updated = await updateCustomer(editingId, payload);
        setCustomers(customers.map((x) => (x.customerID === updated.customerID ? updated : x)));
      } else {
        const created = await createCustomer(payload);
        setCustomers([created, ...customers]);
      }

      await loadAll(); // refresh subscription counts too
      resetForm();
    } catch (e2) {
      setError(e2?.message || "Failed to fetch");
    }
  }

  async function deleteSelected() {
    if (!editingId) return;
    setError("");

    // If in list mode, ignore deletes (optional safety)
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
