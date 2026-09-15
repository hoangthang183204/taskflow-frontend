// src/hooks/useLocallyRemoved.js
"use client";
import { useRef, useEffect } from "react";

const STORAGE_KEY = "taskflow_locally_removed";

// Load từ localStorage
const loadFromStorage = () => {
  if (typeof window === "undefined") return { archived: [], deleted: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { archived: [], deleted: [] };
    const parsed = JSON.parse(raw);
    return {
      archived: Array.isArray(parsed.archived) ? parsed.archived : [],
      deleted: Array.isArray(parsed.deleted) ? parsed.deleted : [],
    };
  } catch {
    return { archived: [], deleted: [] };
  }
};

// Save vào localStorage
const saveToStorage = (archivedSet, deletedSet) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        archived: [...archivedSet],
        deleted: [...deletedSet],
      }),
    );
  } catch {}
};

// ✅ Dispatch event để các component khác biết dữ liệu đã thay đổi
const dispatchUpdate = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("locally-removed-updated"));
  }
};

// ✅ Xóa 1 ID khỏi localStorage (dùng từ bên ngoài hook, ví dụ TrashView)
export const removeIdFromStorage = (id) => {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const archived = (parsed.archived || []).filter(
      (taskId) => String(taskId) !== String(id),
    );
    const deleted = (parsed.deleted || []).filter(
      (taskId) => String(taskId) !== String(id),
    );
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ archived, deleted }),
    );
    dispatchUpdate();
  } catch (err) {
    console.error("removeIdFromStorage error:", err);
  }
};

export default function useLocallyRemoved() {
  const archivedRef = useRef(new Set());
  const deletedRef = useRef(new Set());

  // Load từ localStorage khi mount
  useEffect(() => {
    const { archived, deleted } = loadFromStorage();
    archivedRef.current = new Set(archived.map(String));
    deletedRef.current = new Set(deleted.map(String));
  }, []);

  // ✅ Lắng nghe thay đổi từ tab khác (storage event)
  // ✅ Và từ cùng tab (custom event)
  useEffect(() => {
    const handleChange = () => {
      const { archived, deleted } = loadFromStorage();
      archivedRef.current = new Set(archived.map(String));
      deletedRef.current = new Set(deleted.map(String));
    };

    window.addEventListener("storage", handleChange);
    window.addEventListener("locally-removed-updated", handleChange);

    return () => {
      window.removeEventListener("storage", handleChange);
      window.removeEventListener("locally-removed-updated", handleChange);
    };
  }, []);

  const addArchived = (id) => {
    archivedRef.current.add(String(id));
    saveToStorage(archivedRef.current, deletedRef.current);
    dispatchUpdate();
  };

  const removeArchived = (id) => {
    archivedRef.current.delete(String(id));
    saveToStorage(archivedRef.current, deletedRef.current);
    dispatchUpdate();
  };

  const addDeleted = (id) => {
    deletedRef.current.add(String(id));
    saveToStorage(archivedRef.current, deletedRef.current);
    dispatchUpdate();
  };

  const removeDeleted = (id) => {
    deletedRef.current.delete(String(id));
    saveToStorage(archivedRef.current, deletedRef.current);
    dispatchUpdate();
  };

  const hasArchived = (id) => archivedRef.current.has(String(id));
  const hasDeleted = (id) => deletedRef.current.has(String(id));

  const clearAll = () => {
    archivedRef.current.clear();
    deletedRef.current.clear();
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      dispatchUpdate();
    }
  };

  return {
    archivedRef,
    deletedRef,
    addArchived,
    removeArchived,
    addDeleted,
    removeDeleted,
    hasArchived,
    hasDeleted,
    clearAll,
  };
}