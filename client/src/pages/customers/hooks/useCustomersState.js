import { useMemo, useState } from "react";

export function useCustomersState() {
  const [customers, setCustomers] = useState([]);
  const [subCounts, setSubCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // normal edit-mode selection
  const [editingId, setEditingId] = useState(null);
  const isEditing = useMemo(() => editingId !== null, [editingId]);

  // ✅ list mode (multi-select)
  const [listMode, setListMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]); // array of customer ids
  const selectedCount = selectedIds.length;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === editingId) || null,
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

    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
  };
}
