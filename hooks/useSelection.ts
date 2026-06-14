import { useState, useCallback } from 'react';

export function useSelection<T = string>(initialSelected: T[] = []) {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set(initialSelected));

  const toggleSelection = useCallback((id: T) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((ids: T[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: T) => selectedIds.has(id),
    [selectedIds]
  );

  const isAllSelected = useCallback(
    (ids: T[]) => ids.length > 0 && ids.every((id) => selectedIds.has(id)),
    [selectedIds]
  );

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    isAllSelected,
  };
}
