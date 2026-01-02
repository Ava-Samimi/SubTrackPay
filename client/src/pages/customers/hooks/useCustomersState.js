import { useMemo, useState } from "react";

export function useCustomersState() {
  const [customers, setCustomers] = useState([]);
  const [subCounts, setSubCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // normal edit-mode selection
  const [editingId, setEditingId] = useState(null); // customerID (number) or null
  const isEditing = useMemo(() => editingId !== null, [editingId]);

  // ✅ list mode (multi-select)
  const [listMode, setListMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]); // array of customerID numbers
  const selectedCount = selectedIds.length;

  // Form fields (new schema)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [ccExpiration, setCcExpiration] = useState(""); // string input (YYYY-MM-DD or blank)

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.customerID === editingId) || null,
    [customers, editingId]
  );

  return {
    customers,
    setCustomers,
    subCounts,
    setSubCounts,
    loading,
    setLoading,
    error,
    setError,

    editingId,
    setEditingId,
    isEditing,
    selectedCustomer,

    // list mode
    listMode,
    setListMode,
    selectedIds,
    setSelectedIds,
    selectedCount,

    // form fields
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    ccExpiration,
    setCcExpiration,
  };
}
