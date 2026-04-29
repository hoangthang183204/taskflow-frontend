// components/MoodStats.js
"use client";
import { useState, useEffect } from "react";

export default function MoodStats({ tasks }) {
  const [stats, setStats] = useState({
    happy: 0,
    neutral: 0,
    sad: 0,
    total: 0,
    recentMoods: [],
  });

  useEffect(() => {
    const tasksWithMood = tasks.filter(t => t.mood);
    const happy = tasksWithMood.filter(t => t.mood === "happy").length;
    const neutral = tasksWithMood.filter(t => t.mood === "neutral").length;
    const sad = tasksWithMood.filter(t => t.mood === "sad").length;
    
    const recentMoods = tasksWithMood
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
      .map(t => ({ title: t.title, mood: t.mood, updatedAt: t.updatedAt }));

    setStats({
      happy,
      neutral,
      sad,
      total: tasksWithMood.length,
      recentMoods,
    });
  }, [tasks]);

  const getMoodEmoji = (mood) => {
    switch (mood) {
      case "happy": return "😊";
      case "neutral": return "😐";
      case "sad": return "😢";
      default: return "❓";
    }
  };

  const getMoodColor = (mood) => {
    switch (mood) {
      case "happy": return "bg-green-100 text-green-700";
      case "neutral": return "bg-gray-100 text-gray-700";
      case "sad": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (stats.total === 0) {
    return (
      <div className="bg-white rounded-xl p-6 text-center">
        <div className="text-4xl mb-2">😊</div>
        <p className="text-gray-500">Chưa có dữ liệu cảm xúc</p>
        <p className="text-xs text-gray-400 mt-1">Hoàn thành task để chia sẻ cảm xúc</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span>😊</span> Cảm xúc khi làm việc
      </h3>
      
      {/* Stats Bars */}
      <div className="space-y-3 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-green-600">😊 Tuyệt vời</span>
            <span className="font-medium">{stats.happy} task</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(stats.happy / stats.total) * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">😐 Bình thường</span>
            <span className="font-medium">{stats.neutral} task</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${(stats.neutral / stats.total) * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-red-600">😢 Mệt mỏi</span>
            <span className="font-medium">{stats.sad} task</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(stats.sad / stats.total) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Overall Mood */}
      <div className="text-center p-4 bg-purple-50 rounded-lg mb-4">
        <div className="text-3xl mb-1">
          {stats.happy > stats.neutral && stats.happy > stats.sad && "😊"}
          {stats.neutral >= stats.happy && stats.neutral >= stats.sad && "😐"}
          {stats.sad > stats.happy && stats.sad > stats.neutral && "😢"}
        </div>
        <p className="text-sm text-gray-600">
          {stats.happy > stats.neutral && stats.happy > stats.sad && "Tinh thần làm việc rất tốt!"}
          {stats.neutral >= stats.happy && stats.neutral >= stats.sad && "Hãy cố gắng hơn nữa nhé!"}
          {stats.sad > stats.happy && stats.sad > stats.neutral && "Cần nghỉ ngơi và thư giãn!"}
        </p>
      </div>

      {/* Recent Moods */}
      {stats.recentMoods.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Gần đây</p>
          <div className="space-y-2">
            {stats.recentMoods.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
                <span className="text-gray-600 truncate max-w-[200px]">{item.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${getMoodColor(item.mood)}`}>
                  {getMoodEmoji(item.mood)} {item.mood === "happy" ? "Vui" : item.mood === "neutral" ? "Bth" : "Mệt"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}