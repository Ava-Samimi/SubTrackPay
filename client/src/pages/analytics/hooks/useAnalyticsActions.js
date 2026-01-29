// client/src/pages/AnalyticsPage/hooks/useAnalyticsActions.js
import { createAnalytics, updateAnalytics, deleteAnalytics } from "../analyticsApi.js";
import { normalizeAnalyticsPayload } from "./analyticsFormat.js";

/**
 * All handlers are here so you can tweak behavior one-by-one.
 */
export function useAnalyticsActions(state, loadAll) {
  const {
    analytics,
    setAnalytics,
    setError,

    editingId, // should hold analysisID
    setEditingId,
    isEditing,

    // list mode
    listMode,
    setListMode,
    selectedIds: _selectedIds, // intentionally unused for now
    setSelectedIds,

    // new fields (Analytics table)
    name,
    setName,
    description,
    setDescription,
    nameOfJSONFile,
    setNameOfJSONFile,
  } = state;

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setNameOfJSONFile("");
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
  function toggleRowSelection(analysisID) {
    setSelectedIds((prev) => {
      if (prev.includes(analysisID)) return prev.filter((id) => id !== analysisID);
      return [...prev, analysisID];
    });
  }

  /**
   * ✅ NORMAL ROW CLICK BEHAVIOR (edit mode)
   * Only used when listMode is OFF.
   */
  function selectAnalyticsRow(a) {
    setEditingId(a.analysisID); // toggles edit mode
    setName(a.name || "");
    setDescription(a.description || "");
    setNameOfJSONFile(a.name_of_JSON_file || a.nameOfJSONFile || "");
  }

  async function submitForm(e) {
    e.preventDefault();
    setError("");

    // If in list mode, ignore form submits (optional safety)
    if (listMode) return;

    try {
      const payload = normalizeAnalyticsPayload({
        name,
        description,
        name_of_JSON_file: nameOfJSONFile,
      });

      if (isEditing) {
        const updated = await updateAnalytics(editingId, payload);
        setAnalytics(
          analytics.map((x) => (x.analysisID === updated.analysisID ? updated : x))
        );
      } else {
        const created = await createAnalytics(payload);
        setAnalytics([created, ...analytics]);
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

    // If in list mode, ignore deletes (optional safety)
    if (listMode) return;

    try {
      await deleteAnalytics(editingId);
      setAnalytics(analytics.filter((a) => a.analysisID !== editingId));
      resetForm();
    } catch (e) {
      setError(e?.message || "Failed to fetch");
    }
  }

  return {
    resetForm,
    toggleListMode,
    toggleRowSelection,
    selectAnalyticsRow,
    submitForm,
    deleteSelected,
  };
}
