// components/TrashView.js
"use client";
import { useState, useEffect } from "react";
import {
  getTrashTasks,
  restoreFromTrash,
  hardDeleteTask,
} from "@/services/api";
import { removeIdFromStorage } from "@/hooks/useLocallyRemoved";
import { toast } from "sonner";
import {
  IconRestore,
  IconTrash2,
  IconTrashEmpty,
  IconRefreshCw,
  IconCalendar,
  IconAlertTriangle,
  IconX,
} from "./Icons";

export default function TrashView({ token, onTaskUpdate }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });

  const markPending = (id) =>
    setPendingIds((prev) => new Set(prev).add(String(id)));

  const unmarkPending = (id) =>
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(String(id));
      return next;
    });

  const isPending = (id) => pendingIds.has(String(id));

  const fetchTrash = async (page = 1) => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await getTrashTasks(token, {
        page,
        limit: pagination.limit,
      });
      setTasks(response.data || []);
      setPagination({
        total: response.total || 0,
        page: response.page || 1,
        limit: response.limit || 12,
        totalPages: Math.ceil((response.total || 0) / (response.limit || 12)),
      });
    } catch (err) {
      console.error("Lỗi load thùng rác:", err);
      toast.error(err.message || "Lỗi load thùng rác");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, [token]);

  // ✅ Restore
  const handleRestore = async (id) => {
    const taskIdStr = String(id);
    const snapshotTasks = [...tasks];
    const snapshotTotal = pagination.total;

    markPending(id);
    setTasks((prev) => prev.filter((t) => String(t.id) !== taskIdStr));
    setPagination((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
    }));

    try {
      removeIdFromStorage(id);
      await restoreFromTrash(id, token);
      toast.success("Đã khôi phục task");
      onTaskUpdate?.();
    } catch (err) {
      console.error("Restore error:", err);
      setTasks(snapshotTasks);
      setPagination((prev) => ({ ...prev, total: snapshotTotal }));
      toast.error("Không thể khôi phục");
    } finally {
      unmarkPending(id);
    }
  };

  // ✅ Permanent delete với confirm dialog đẹp
  const handlePermanentDelete = (id) => {
    setConfirmDeleteId(id);
  };

  const confirmPermanentDelete = async () => {
    const id = confirmDeleteId;
    if (!id) return;
    setConfirmDeleteId(null);

    const taskIdStr = String(id);
    const snapshotTasks = [...tasks];
    const snapshotTotal = pagination.total;

    markPending(id);
    setTasks((prev) => prev.filter((t) => String(t.id) !== taskIdStr));
    setPagination((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
    }));

    try {
      await hardDeleteTask(id, token);
      removeIdFromStorage(id);
      toast.success("Đã xóa vĩnh viễn");
      onTaskUpdate?.();
    } catch (err) {
      console.error("Permanent delete error:", err);
      setTasks(snapshotTasks);
      setPagination((prev) => ({ ...prev, total: snapshotTotal }));
      toast.error("Không thể xóa vĩnh viễn");
    } finally {
      unmarkPending(id);
    }
  };

  // ✅ Priority badge dùng dot màu
  const getPriorityBadge = (priority) => {
    const config = {
      low: { color: "bg-green-500", bg: "bg-green-50", text: "text-green-700", label: "Thấp" },
      medium: { color: "bg-yellow-500", bg: "bg-yellow-50", text: "text-yellow-700", label: "Trung" },
      high: { color: "bg-red-500", bg: "bg-red-50", text: "text-red-700", label: "Cao" },
    };
    const c = config[priority] || config.medium;
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] ${c.bg} ${c.text} px-1.5 py-0.5 rounded font-medium`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
        {c.label}
      </span>
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Không rõ";
    try {
      const date = new Date(Number(timestamp));
      if (isNaN(date.getTime())) return "Không rõ";
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "Không rõ";
    }
  };

  const formatRelative = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = new Date(Number(timestamp));
      const diff = Date.now() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return "Hôm nay";
      if (days === 1) return "Hôm qua";
      if (days < 7) return `${days} ngày trước`;
      if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
      return `${Math.floor(days / 30)} tháng trước`;
    } catch {
      return "";
    }
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-red-500"></div>
        <p className="text-sm text-gray-500 mt-3">Đang tải thùng rác...</p>
      </div>
    );
  }

  // ============================================================
  // EMPTY STATE
  // ============================================================
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <IconTrashEmpty className="w-12 h-12 text-gray-300" />
        </div>
        <h3 className="text-base font-semibold text-gray-700 mb-1">
          Thùng rác trống
        </h3>
        <p className="text-sm text-gray-400 text-center max-w-sm">
          Các task đã xóa sẽ xuất hiện ở đây và có thể khôi phục trong vòng 30 ngày
        </p>
      </div>
    );
  }

  // ============================================================
  // MAIN VIEW
  // ============================================================
  return (
    <>
      <div className="space-y-4">
        {/* ============================================ */}
        {/* Header */}
        {/* ============================================ */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
              <IconTrash2 className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                Thùng rác
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                  {pagination.total}
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                Task sẽ tự động xóa vĩnh viễn sau 30 ngày
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchTrash(pagination.page)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 
              bg-white border border-gray-200 rounded-lg 
              hover:bg-gray-50 hover:text-gray-800 hover:border-gray-300 
              transition-colors"
            title="Làm mới"
          >
            <IconRefreshCw className="w-3.5 h-3.5" />
            Làm mới
          </button>
        </div>

        {/* ============================================ */}
        {/* Grid cards */}
        {/* ============================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tasks.map((task) => {
            const pending = isPending(task.id);

            return (
              <div
                key={task.id}
                className={`group bg-white rounded-lg border border-gray-200 
                  transition-all duration-150 relative overflow-hidden
                  ${pending ? "opacity-60 pointer-events-none" : "hover:border-gray-300 hover:shadow-md"}`}
              >
                {/* Pending overlay */}
                {pending && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-white px-2 py-1 rounded-full shadow-sm border border-gray-200">
                      <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Đang xử lý...
                    </div>
                  </div>
                )}

                {/* Body */}
                <div className="p-3">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-medium text-gray-800 text-sm line-clamp-2 leading-snug">
                      {task.title}
                    </h3>
                    <span
                      className="flex-shrink-0 text-[10px] text-gray-400 whitespace-nowrap"
                      title={formatDate(task.deletedAt)}
                    >
                      {formatRelative(task.deletedAt)}
                    </span>
                  </div>

                  {/* Description */}
                  {task.description ? (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-snug">
                      {task.description}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-300 italic mb-2">
                      Không có mô tả
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {getPriorityBadge(task.priority)}

                    {task.status && (
                      <span className="text-[10px] text-gray-400 capitalize">
                        {task.status === "todo"
                          ? "To Do"
                          : task.status === "doing"
                          ? "Doing"
                          : "Done"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex border-t border-gray-100">
                  <button
                    onClick={() => handleRestore(task.id)}
                    disabled={pending}
                    className="flex-1 py-2 text-xs font-medium text-green-600 
                      hover:bg-green-50 hover:text-green-700 
                      transition-colors flex items-center justify-center gap-1.5
                      disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Khôi phục task"
                  >
                    <IconRestore className="w-3.5 h-3.5" />
                    Khôi phục
                  </button>

                  <button
                    onClick={() => handlePermanentDelete(task.id)}
                    disabled={pending}
                    className="flex-1 py-2 text-xs font-medium text-red-500 
                      hover:bg-red-50 hover:text-red-600 
                      transition-colors flex items-center justify-center gap-1.5
                      border-l border-gray-100
                      disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Xóa vĩnh viễn"
                  >
                    <IconTrash2 className="w-3.5 h-3.5" />
                    Xóa vĩnh viễn
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ============================================ */}
        {/* Pagination */}
        {/* ============================================ */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => fetchTrash(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 
                bg-white border border-gray-200 rounded-lg 
                hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors"
            >
              ← Trước
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  const current = pagination.page;
                  return (
                    p === 1 ||
                    p === pagination.totalPages ||
                    Math.abs(p - current) <= 1
                  );
                })
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <span key={p} className="flex items-center">
                      {showEllipsis && (
                        <span className="px-2 text-xs text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => fetchTrash(p)}
                        className={`min-w-[28px] h-7 px-2 text-xs font-medium rounded-lg transition-colors ${
                          p === pagination.page
                            ? "bg-blue-500 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}
            </div>

            <button
              onClick={() => fetchTrash(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 
                bg-white border border-gray-200 rounded-lg 
                hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors"
            >
              Sau →
            </button>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* Confirm Delete Modal */}
      {/* ============================================ */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                  <IconAlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-800 mb-1">
                    Xóa vĩnh viễn?
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Task này sẽ bị xóa hoàn toàn và{" "}
                    <span className="font-medium text-gray-700">
                      không thể khôi phục
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 
                  hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmPermanentDelete}
                className="flex-1 py-2.5 text-sm font-medium text-white 
                  bg-red-500 hover:bg-red-600 
                  transition-colors border-l border-red-400
                  flex items-center justify-center gap-1.5"
              >
                <IconTrash2 className="w-4 h-4" />
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}