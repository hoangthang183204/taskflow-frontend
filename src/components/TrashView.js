// components/TrashView.js
"use client";
import { useState, useEffect } from "react";
import { getTrashTasks, restoreFromTrash, hardDeleteTask } from "@/services/api";
import { toast } from "sonner";

export default function TrashView({ token, onTaskUpdate }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10 });

  const fetchTrash = async (page = 1) => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await getTrashTasks(token, { page, limit: pagination.limit });
      setTasks(response.data || []);
      setPagination({
        total: response.total || 0,
        page: response.page || 1,
        limit: response.limit || 10,
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

  const handleRestore = async (id) => {
    try {
      await restoreFromTrash(id, token);
      toast.success("Đã khôi phục task");
      fetchTrash(pagination.page);
      onTaskUpdate?.();
    } catch (err) {
      toast.error("Không thể khôi phục");
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa vĩnh viễn task này? Hành động này không thể hoàn tác!")) return;
    
    try {
      await hardDeleteTask(id, token);
      toast.success("Đã xóa vĩnh viễn task");
      fetchTrash(pagination.page);
      onTaskUpdate?.();
    } catch (err) {
      toast.error("Không thể xóa vĩnh viễn");
    }
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">🟢 Thấp</span>,
      medium: <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">🟡 Trung</span>,
      high: <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">🔴 Cao</span>,
    };
    return badges[priority] || badges.medium;
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Đang tải thùng rác...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
        <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <p className="text-gray-500 text-lg">🗑️ Thùng rác trống</p>
        <p className="text-gray-400 text-sm mt-2">Các task đã xóa sẽ xuất hiện ở đây</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          🗑️ Thùng rác
          <span className="text-sm bg-gray-200 px-2 py-0.5 rounded-full">{pagination.total}</span>
        </h2>
        <button
          onClick={() => fetchTrash(1)}
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          🔄 Làm mới
        </button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map(task => (
          <div key={task.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 opacity-80 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-800 line-through">{task.title}</h3>
              <span className="text-xs text-gray-400">
                {task.deletedAt && new Date(task.deletedAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">{task.description || "📝 Không có mô tả"}</p>
            <div className="flex justify-between items-center">
              <div>{getPriorityBadge(task.priority)}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRestore(task.id)}
                  className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-green-50 transition"
                >
                  🔄 Khôi phục
                </button>
                <button
                  onClick={() => handlePermanentDelete(task.id)}
                  className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-red-50 transition"
                >
                  🔥 Xóa vv
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => fetchTrash(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            ← Trước
          </button>
          <span className="px-3 py-1 text-gray-600">
            Trang {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchTrash(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}