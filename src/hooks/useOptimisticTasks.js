// hooks/useOptimisticTasks.js
"use client";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Hook quản lý optimistic updates cho danh sách tasks
 * - Deep clone snapshot trước khi update
 * - Rollback nếu API fail
 * - Pending state per-task
 * - Recent optimistic grace period 30s (tránh bị ghi đè)
 */
export function useOptimisticTasks(
  initialTasks = { todo: [], doing: [], done: [] }
) {
  const [tasks, setTasks] = useState(initialTasks);
  const [pendingIds, setPendingIds] = useState(new Set());
  const snapshotRef = useRef(null);

  // ✅ Track task vừa thao tác — grace period 30s
  const recentOptimisticRef = useRef(new Map());

  // ============================================================
  // PENDING MANAGEMENT
  // ============================================================
  const markPending = useCallback((id) => {
    setPendingIds((prev) => new Set(prev).add(String(id)));
  }, []);

  const unmarkPending = useCallback((id) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(String(id));
      return next;
    });
  }, []);

  const isPending = useCallback(
    (id) => pendingIds.has(String(id)),
    [pendingIds]
  );

  // ============================================================
  // RECENT OPTIMISTIC — Grace period 30s
  // ============================================================
  const markRecentOptimistic = useCallback((id) => {
    recentOptimisticRef.current.set(String(id), Date.now());
  }, []);

  const isRecentOptimistic = useCallback((id, graceMs = 30000) => {
    const key = String(id);
    const ts = recentOptimisticRef.current.get(key);
    if (!ts) return false;
    if (Date.now() - ts > graceMs) {
      recentOptimisticRef.current.delete(key);
      return false;
    }
    return true;
  }, []);

  const clearRecentOptimistic = useCallback((id) => {
    recentOptimisticRef.current.delete(String(id));
  }, []);

  const shouldSkipSync = useCallback(
    (id) => isPending(id) || isRecentOptimistic(id),
    [isPending, isRecentOptimistic]
  );

  // ============================================================
  // EXECUTE OPTIMISTIC UPDATE
  // ============================================================
  const execute = useCallback(
    async (optimisticUpdate, apiCall, options = {}) => {
      const { onSuccess, onError, errorMessage = "Có lỗi xảy ra" } = options;

      setTasks((current) => {
        snapshotRef.current = {
          todo: current.todo.map((t) => ({ ...t })),
          doing: current.doing.map((t) => ({ ...t })),
          done: current.done.map((t) => ({ ...t })),
        };
        return optimisticUpdate(current);
      });

      try {
        const serverData = await apiCall();
        if (onSuccess) onSuccess(serverData, setTasks);
        return { success: true, data: serverData };
      } catch (error) {
        if (snapshotRef.current) {
          setTasks(snapshotRef.current);
        }
        toast.error(error?.message || errorMessage);
        if (onError) onError(error);
        return { success: false, error };
      } finally {
        snapshotRef.current = null;
      }
    },
    []
  );

  // ============================================================
  // HELPERS
  // ============================================================
  const updateTaskInPlace = useCallback((taskId, updater) => {
    return (current) => {
      const next = { todo: [], doing: [], done: [] };
      for (const col of ["todo", "doing", "done"]) {
        next[col] = current[col].map((t) =>
          String(t.id) === String(taskId) ? { ...t, ...updater(t) } : t
        );
      }
      return next;
    };
  }, []);

  const moveTask = useCallback((taskId, fromCol, toCol, toIndex = null) => {
    return (current) => {
      const next = {
        todo: [...current.todo],
        doing: [...current.doing],
        done: [...current.done],
      };
      const idx = next[fromCol].findIndex(
        (t) => String(t.id) === String(taskId)
      );
      if (idx === -1) return current;
      const [removed] = next[fromCol].splice(idx, 1);
      const updated = { ...removed, status: toCol };
      const insertAt = toIndex ?? next[toCol].length;
      next[toCol].splice(insertAt, 0, updated);
      return next;
    };
  }, []);

  const removeTask = useCallback((taskId) => {
    return (current) => {
      const next = { todo: [], doing: [], done: [] };
      for (const col of ["todo", "doing", "done"]) {
        next[col] = current[col].filter(
          (t) => String(t.id) !== String(taskId)
        );
      }
      return next;
    };
  }, []);

  const addTask = useCallback((task, column = "todo") => {
    return (current) => {
      const next = { ...current };
      next[column] = [...next[column], task];
      return next;
    };
  }, []);

  return {
    tasks,
    setTasks,
    isPending,
    markPending,
    unmarkPending,
    markRecentOptimistic,
    isRecentOptimistic,
    clearRecentOptimistic,
    shouldSkipSync,
    execute,
    updateTaskInPlace,
    moveTask,
    removeTask,
    addTask,
  };
}

export default useOptimisticTasks;