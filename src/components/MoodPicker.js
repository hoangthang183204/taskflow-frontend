// components/MoodPicker.js
"use client";
import { useState } from "react";
import { updateTask } from "@/services/api";
import { toast } from "sonner";

const moods = [
  { id: "happy", emoji: "😊", label: "Tuyệt vời", color: "bg-green-100 hover:bg-green-200", textColor: "text-green-700" },
  { id: "neutral", emoji: "😐", label: "Bình thường", color: "bg-gray-100 hover:bg-gray-200", textColor: "text-gray-700" },
  { id: "sad", emoji: "😢", label: "Mệt mỏi", color: "bg-red-100 hover:bg-red-200", textColor: "text-red-700" },
];

export default function MoodPicker({ taskId, token, onClose, onSuccess }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedMood) {
      toast.warning("Vui lòng chọn cảm xúc của bạn");
      return;
    }

    setLoading(true);
    try {
      await updateTask(
        taskId,
        {
          mood: selectedMood,
          moodNote: note || null,
        },
        token,
      );
      toast.success("Cảm ơn bạn đã chia sẻ cảm xúc! 🎉");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Không thể lưu cảm xúc");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    toast.info("Bạn có thể chia sẻ cảm xúc sau");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-fadeIn overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 text-white">
          <h3 className="text-lg font-semibold">Hôm nay bạn thế nào? 😊</h3>
          <p className="text-sm opacity-90 mt-1">Chia sẻ cảm xúc khi hoàn thành task</p>
        </div>

        {/* Mood Selection */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {moods.map((mood) => (
              <button
                key={mood.id}
                onClick={() => setSelectedMood(mood.id)}
                className={`p-4 rounded-xl text-center transition-all transform hover:scale-105 ${
                  selectedMood === mood.id
                    ? `${mood.color} ring-2 ring-offset-2 ring-purple-500`
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="text-4xl mb-2">{mood.emoji}</div>
                <div className={`text-sm font-medium ${selectedMood === mood.id ? mood.textColor : "text-gray-600"}`}>
                  {mood.label}
                </div>
              </button>
            ))}
          </div>

          {/* Optional Note */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú thêm (không bắt buộc)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Làm việc rất tập trung, hài lòng với kết quả..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows="2"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Bỏ qua
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedMood}
              className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang lưu..." : "Gửi cảm xúc 💝"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}