"use client";
import { useEffect, useState } from "react";
import { updateTask, getTasks } from "@/services/api";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

export default function UpdateTask() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;  // ← CÁCH NÀY ĐƠN GIẢN HƠN
  
  const [token, setToken] = useState(null);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errors, setErrors] = useState({});

  console.log("UpdateTask page loaded, id:", id); // Debug

  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDueDateChange = (value) => {
    setTask({ ...task, dueDate: value });
    
    if (value) {
      const dueDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        setErrors({ dueDate: "Hạn chót không được chọn trong quá khứ" });
      } else {
        setErrors({});
      }
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }
    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    const fetchTask = async () => {
      if (!token || !id) {
        console.log("No token or id:", { token, id });
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching task with id:", id);
        
        const response = await getTasks(token, { limit: 100 });
        const found = response.data?.find((t) => t.id === id);

        if (!found) {
          toast.error("Không tìm thấy task");
          router.push("/task");
          return;
        }

        setTask({
          ...found,
          dueDate: found.dueDate ? found.dueDate.split("T")[0] : "",
        });
        console.log("Task loaded:", found);
      } catch (error) {
        console.error("Lỗi fetch task:", error);
        toast.error("Lỗi tải task: " + error.message);
        router.push("/task");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchTask();
    }
  }, [id, token, router]);

  const handleUpdate = async () => {
    if (!task) return;

    if (!task.title.trim()) {
      toast.warning("Vui lòng nhập tiêu đề task");
      return;
    }

    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        toast.warning("Hạn chót không được chọn trong quá khứ");
        return;
      }
    }

    try {
      setUpdating(true);
      
      const updateData = {
        title: task.title.trim(),
        description: task.description?.trim() || "",
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate || null,
      };
      
      await updateTask(id, updateData, token);
      toast.success("Cập nhật thành công! 🎉");
      router.push("/task");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      toast.error("Lỗi cập nhật: " + (err.message || "Vui lòng thử lại"));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl text-gray-600">Đang tải...</div>
    </div>
  );
  
  if (!task) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl text-red-600">Không tìm thấy task</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Cập Nhật Task
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              value={task.title || ""}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              value={task.description || ""}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Độ ưu tiên
            </label>
            <select
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400"
              value={task.priority || "medium"}
              onChange={(e) => setTask({ ...task, priority: e.target.value })}
            >
              <option value="low">🟢 Thấp</option>
              <option value="medium">🟡 Trung bình</option>
              <option value="high">🔴 Cao</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hạn chót
            </label>
            <input
              type="date"
              className={`w-full border rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 transition ${
                errors.dueDate ? "border-red-500" : "border-gray-300"
              }`}
              min={getTodayDate()}
              value={task.dueDate || ""}
              onChange={(e) => handleDueDateChange(e.target.value)}
            />
            {errors.dueDate && (
              <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400"
              value={task.status || "todo"}
              onChange={(e) => setTask({ ...task, status: e.target.value })}
            >
              <option value="todo">📋 To do</option>
              <option value="doing">🔄 Doing</option>
              <option value="done">✅ Done</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleUpdate}
              disabled={updating || !task.title?.trim()}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? "Đang lưu..." : "💾 Lưu Cập Nhật"}
            </button>

            <button
              onClick={() => router.push("/task")}
              className="flex-1 border border-gray-300 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition"
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}