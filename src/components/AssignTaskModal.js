"use client";
import { useState, useEffect } from "react";
import { updateTask, getTeamMembers } from "@/services/api";
import { toast } from "sonner";

export default function AssignTaskModal({
  task,
  token,
  open,
  onClose,
  onSuccess,
}) {
  const [members, setMembers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    if (open && token && task?.teamId) {
      fetchMembers();
    }
  }, [open, token, task]);

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const data = await getTeamMembers(token, task.teamId);
      // Lọc bỏ chính mình
      setMembers(data.filter((m) => m.id !== task.userId));
    } catch (error) {
      toast.error("Không thể tải danh sách thành viên");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUser) {
      toast.warning("Vui lòng chọn người nhận task");
      return;
    }

    const selectedUserData = members.find((u) => u.id === selectedUser);

    setLoading(true);
    try {
      await updateTask(
        task.id,
        {
          assignedTo: selectedUser,
          assignedByName: selectedUserData?.name,
          assignedAt: Date.now(),
        },
        token,
      );
      toast.success(`Đã giao task cho ${selectedUserData?.name}`);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Không thể giao task");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">📨 Giao task</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Task được giao</p>
            <p className="font-medium text-gray-800">{task.title}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn người nhận trong nhóm
            </label>

            {loadingMembers ? (
              <div className="text-center py-4 text-gray-500">Đang tải...</div>
            ) : members.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Chưa có thành viên nào trong nhóm
              </div>
            ) : (
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn người nhận --</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Hủy
            </button>
            <button
              onClick={handleAssign}
              disabled={loading || !selectedUser || members.length === 0}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Đang giao..." : "📨 Giao task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
