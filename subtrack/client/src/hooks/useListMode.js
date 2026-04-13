import { useMemo, useState } from "react";

export function useListMode() {
  const [listMode, setListMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const selectedCount = selectedIds.length;

  function toggleListMode() {
    setListMode((prev) => {
      const next = !prev;
      setSelectedIds([]); // reset selection whenever you toggle list mode
      return next;
    });
  }

  function toggleRowSelection(id) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }

  const isSelected = useMemo(() => {
    const set = new Set(selectedIds);
    return (id) => set.has(id);
  }, [selectedIds]);

  return {
    listMode,
    selectedIds,
    selectedCount,
    isSelected,
    toggleListMode,
    toggleRowSelection,
    setSelectedIds,
    setListMode,
  };
}
