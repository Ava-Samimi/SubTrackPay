// client/src/pages/Analytics/hooks/useAnalyticsState.js
import { useMemo, useState } from "react";

export function useAnalyticsState() {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // normal edit-mode selection
  const [editingId, setEditingId] = useState(null); // analysisID (number) or null
  const isEditing = useMemo(() => editingId !== null, [editingId]);

  // ✅ list mode (multi-select)
  const [listMode, setListMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]); // array of analysisID numbers
  const selectedCount = selectedIds.length;

  // Form fields (Analytics table)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameOfJSONFile, setNameOfJSONFile] = useState("");

  const selectedAnalysis = useMemo(
    () => analytics.find((a) => a.analysisID === editingId) || null,
    [analytics, editingId]
  );

  return {
    analytics,
    setAnalytics,
    loading,
    setLoading,
    error,
    setError,

    editingId,
    setEditingId,
    isEditing,
    selectedAnalysis,

    // list mode
    listMode,
    setListMode,
    selectedIds,
    setSelectedIds,
    selectedCount,

    // form fields
    name,
    setName,
    description,
    setDescription,
    nameOfJSONFile,
    setNameOfJSONFile,
  };
}
