"use client";
import { useState, useEffect, useRef } from "react";
import { createTask } from "@/services/api";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import useToast from "@/hooks/useToast";
import VoiceInput from "@/components/VoiceInput";

export default function CreateTask() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const [task, setTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const titleInputRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    if (!isAuthenticated && !token) {
      router.push("/login");
    }
  }, [isAuthenticated, token, router]);

  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
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

  // Hàm parse priority từ text
  const parsePriority = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes("ưu tiên cao") || lowerText.includes("quan trọng") || 
        lowerText.includes("gấp") || lowerText.includes("cao") || 
        lowerText.includes("high") || lowerText.includes("khẩn")) {
      return "high";
    } else if (lowerText.includes("ưu tiên thấp") || lowerText.includes("không quan trọng") || 
               lowerText.includes("thấp") || lowerText.includes("low")) {
      return "low";
    }
    return null;
  };

  // Hàm parse date từ text
  const parseDate = (text) => {
    // Định dạng dd/mm hoặc dd/mm/yyyy
    let dateMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
    if (dateMatch) {
      const today = new Date();
      const year = dateMatch[3] || today.getFullYear();
      const month = dateMatch[2].padStart(2, '0');
      const day = dateMatch[1].padStart(2, '0');
      const dueDate = `${year}-${month}-${day}`;
      
      const dueDateObj = new Date(dueDate);
      const todayObj = new Date();
      todayObj.setHours(0, 0, 0, 0);
      
      if (dueDateObj >= todayObj) {
        return dueDate;
      }
      return null;
    }
    
    // Định dạng "ngày X tháng Y" hoặc "mùng X tháng Y"
    const vietnameseDateMatch = text.match(/(?:ngày|mùng)\s+(\d{1,2})\s+(?:tháng)\s+(\d{1,2})/);
    if (vietnameseDateMatch) {
      const today = new Date();
      const year = today.getFullYear();
      const month = vietnameseDateMatch[2].padStart(2, '0');
      const day = vietnameseDateMatch[1].padStart(2, '0');
      const dueDate = `${year}-${month}-${day}`;
      
      const dueDateObj = new Date(dueDate);
      const todayObj = new Date();
      todayObj.setHours(0, 0, 0, 0);
      
      if (dueDateObj >= todayObj) {
        return dueDate;
      }
      return null;
    }
    
    return null;
  };

  // Hàm tạo task từ giọng nói - TỰ ĐỘNG TẠO NGAY
  const handleCreateTaskByVoice = async (text) => {
    setIsProcessingVoice(true);
    
    console.log("📝 Text gốc:", text);
    
    // Trích xuất priority và dueDate TRƯỚC KHI xử lý title
    const priority = parsePriority(text);
    const dueDate = parseDate(text);
    
    console.log("🎯 Priority phát hiện:", priority);
    console.log("📅 Due date phát hiện:", dueDate);
    
    // Phân tích text để trích xuất thông tin
    let title = text;
    
    // Loại bỏ các từ khóa tạo task
    title = title.replace(/(tạo task|thêm task|thêm công việc|tạo công việc|tạo mới|thêm mới)/gi, '');
    
    // Loại bỏ các từ khóa priority
    const priorityKeywords = ["ưu tiên cao", "quan trọng", "gấp", "ưu tiên thấp", "không quan trọng", "cao", "thấp", "khẩn"];
    priorityKeywords.forEach(keyword => {
      title = title.replace(new RegExp(keyword, 'gi'), '');
    });
    
    // Loại bỏ các từ khóa ngày tháng
    const dateMatches = text.match(/(?:ngày|mùng)\s+\d{1,2}\s+tháng\s+\d{1,2}/gi) || [];
    const slashDates = text.match(/\d{1,2}\/\d{1,2}(?:\/\d{4})?/g) || [];
    [...dateMatches, ...slashDates].forEach(keyword => {
      title = title.replace(keyword, '');
    });
    
    // Loại bỏ cụm "hạ hoàn thành" nếu có
    title = title.replace(/(hạ hoàn thành)/gi, '');
    
    // Clean up title
    title = title.trim().replace(/\s+/g, ' ');
    
    // Nếu title quá ngắn hoặc rỗng, thử lấy nguyên câu
    if (!title || title.length < 2) {
      title = text;
    }
    
    // Giới hạn title không quá dài
    if (title.length > 100) {
      title = title.substring(0, 97) + "...";
    }
    
    // Chuẩn bị data cho task - KHÔNG CÓ MÔ TẢ TỰ ĐỘNG
    const taskData = {
      title: title,
      description: "",  // Để trống mô tả, không thêm dòng "Được tạo bằng giọng nói"
      priority: priority || "medium",
      dueDate: dueDate || null,
    };
    
    console.log("📦 Task data sẽ gửi:", taskData);
    
    // Hiển thị thông báo với priority đã chọn
    const priorityText = taskData.priority === 'high' ? '🔴 Cao' : (taskData.priority === 'low' ? '🟢 Thấp' : '🟡 Trung bình');
    toast.info(`🎤 Đang tạo task: "${taskData.title}" (${priorityText})...`);
    
    // Tự động tạo task
    await createTaskAPI(taskData);
    
    setIsProcessingVoice(false);
  };

  // API call để tạo task
  const createTaskAPI = async (taskData) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập lại");
      router.push("/login");
      return false;
    }

    try {
      setLoading(true);
      const response = await createTask(taskData, token);
      console.log("✅ Tạo task thành công:", response);
      toast.success(`✅ Đã tạo task: "${taskData.title}"`);
      
      // Chuyển hướng về trang task sau 1.5 giây
      setTimeout(() => {
        router.push("/task");
      }, 1500);
      
      return true;
    } catch (err) {
      console.error("❌ Lỗi tạo task:", err);
      toast.error(err.message || "Lỗi tạo task, vui lòng thử lại");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Xử lý kết quả từ VoiceInput - TỰ ĐỘNG TẠO TASK
  const handleVoiceResult = (text) => {
    if (!text || text.trim().length === 0) {
      toast.warning("Không nhận được giọng nói, vui lòng thử lại");
      return;
    }
    
    console.log("🎤 Nhận được giọng nói:", text);
    
    // Tạo task ngay lập tức cho mọi câu nói
    handleCreateTaskByVoice(text);
  };

  const handleCreate = async () => {
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

    const taskData = {
      title: task.title.trim(),
      description: task.description?.trim() || "",
      priority: task.priority,
      dueDate: task.dueDate || null,
    };

    await createTaskAPI(taskData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Tạo Task Mới
        </h1>

        <div className="space-y-4">
          {/* Tiêu đề với Voice Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                ref={titleInputRef}
                className="flex-1 w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                placeholder="Nhập tiêu đề task hoặc nhấn mic 🎙️ để nói..."
                value={task.title}
                onChange={(e) => setTask({ ...task, title: e.target.value })}
              />
              <VoiceInput 
                onResult={handleVoiceResult}
                onListeningChange={setIsListening}
                disabled={isProcessingVoice || loading}
              />
            </div>
            {isListening && (
              <p className="text-xs text-blue-500 mt-2 animate-pulse flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                🎤 Đang nghe... Hãy nói nội dung task
              </p>
            )}
            {isProcessingVoice && (
              <p className="text-xs text-yellow-500 mt-2 flex items-center gap-1">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                ⏳ Đang xử lý và tạo task...
              </p>
            )}
          </div>

          {/* Mô tả - Đã xóa mô tả tự động, user có thể nhập tay nếu muốn */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả (không bắt buộc)
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              placeholder="Nhập mô tả nếu cần..."
              rows="3"
              value={task.description}
              onChange={(e) =>
                setTask({ ...task, description: e.target.value })
              }
            />
          </div>

          {/* Độ ưu tiên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Độ ưu tiên
            </label>
            <select
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-400"
              value={task.priority}
              onChange={(e) => setTask({ ...task, priority: e.target.value })}
            >
              <option value="low">🟢 Thấp</option>
              <option value="medium">🟡 Trung bình</option>
              <option value="high">🔴 Cao</option>
            </select>
          </div>

          {/* Hạn chót */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hạn hoàn thành
            </label>
            <input
              type="date"
              className={`w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-400 transition ${
                errors.dueDate ? "border-red-500" : "border-gray-300"
              }`}
              min={getTodayDate()}
              value={task.dueDate}
              onChange={(e) => handleDueDateChange(e.target.value)}
            />
            {errors.dueDate && (
              <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>
            )}
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !task.title.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Đang tạo...
              </span>
            ) : (
              "Tạo Task"
            )}
          </button>

          <button
            onClick={() => router.push("/task")}
            className="w-full border border-gray-300 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition"
          >
            ← Quay lại danh sách
          </button>
        </div>
      </div>
    </div>
  );
}