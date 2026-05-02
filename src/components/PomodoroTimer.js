// components/PomodoroTimer.js
"use client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const POMODORO = {
  FOCUS: 25 * 60,
  SHORT_BREAK: 5 * 60,
  LONG_BREAK: 15 * 60,
};

export default function PomodoroTimer({ taskId, taskTitle, onClose, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(POMODORO.FOCUS);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState("focus");
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef(null);

  // Reset timer khi mở lại
  useEffect(() => {
    setTimeLeft(POMODORO.FOCUS);
    setIsActive(false);
    setMode("focus");
    setSessions(0);
  }, [taskId]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isActive && intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const playSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 500);
    } catch (error) {
      console.log("Cannot play sound");
    }
  };

  const handleTimerComplete = () => {
    playSound();
    setIsActive(false);
    
    if (mode === "focus") {
      const newSessions = sessions + 1;
      setSessions(newSessions);
      toast.success(`🎉 Hoàn thành ${taskTitle}! ${newSessions} pomodoro đã xong`);
      
      if (newSessions % 4 === 0) {
        setMode("longBreak");
        setTimeLeft(POMODORO.LONG_BREAK);
        toast.info("☕ Nghỉ dài 15 phút! Tuyệt vời!");
      } else {
        setMode("shortBreak");
        setTimeLeft(POMODORO.SHORT_BREAK);
        toast.info("🌿 Nghỉ ngắn 5 phút!");
      }
      setIsActive(true);
      onComplete?.();
    } else {
      toast.info("🍅 Kết thúc nghỉ, bắt đầu focus nào!");
      setMode("focus");
      setTimeLeft(POMODORO.FOCUS);
      setIsActive(true);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercent = () => {
    const total = mode === "focus" ? POMODORO.FOCUS : mode === "shortBreak" ? POMODORO.SHORT_BREAK : POMODORO.LONG_BREAK;
    return ((total - timeLeft) / total) * 100;
  };

  const getModeColor = () => {
    switch (mode) {
      case "focus": return "text-red-500";
      case "shortBreak": return "text-green-500";
      case "longBreak": return "text-blue-500";
      default: return "text-gray-500";
    }
  };

  const getModeText = () => {
    switch (mode) {
      case "focus": return "🍅 Tập trung";
      case "shortBreak": return "🌿 Nghỉ ngắn";
      case "longBreak": return "☕ Nghỉ dài";
      default: return "Timer";
    }
  };

  const getModeBgColor = () => {
    switch (mode) {
      case "focus": return "bg-red-500";
      case "shortBreak": return "bg-green-500";
      case "longBreak": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const handleStart = () => {
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    if (mode === "focus") {
      setTimeLeft(POMODORO.FOCUS);
    } else if (mode === "shortBreak") {
      setTimeLeft(POMODORO.SHORT_BREAK);
    } else {
      setTimeLeft(POMODORO.LONG_BREAK);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl animate-fadeIn overflow-hidden mx-auto">
        <div className={`${getModeBgColor()} text-white px-4 sm:px-6 py-4`}>
          <div className="flex justify-between items-center">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base">{getModeText()}</h3>
              <p className="text-xs opacity-90 truncate">{taskTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition ml-2 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-8 text-center">
          <div className="relative inline-block">
            {/* SVG circle - kích thước responsive */}
            <svg className="w-40 h-40 sm:w-48 sm:h-48 transform -rotate-90">
              <circle cx="80" cy="80" r="72" stroke="#e5e7eb" strokeWidth="8" fill="none" />
              <circle
                cx="80"
                cy="80"
                r="72"
                stroke={mode === "focus" ? "#ef4444" : mode === "shortBreak" ? "#22c55e" : "#3b82f6"}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 72}`}
                strokeDashoffset={`${2 * Math.PI * 72 * (1 - getProgressPercent() / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl sm:text-5xl font-bold ${getModeColor()}`}>
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                {sessions} pomodoro
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-3 sm:gap-4 mt-6">
            {!isActive ? (
              <button
                onClick={handleStart}
                className="px-4 sm:px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm sm:text-base"
              >
                ▶ Bắt đầu
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="px-4 sm:px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition text-sm sm:text-base"
              >
                ⏸ Tạm dừng
              </button>
            )}
            <button
              onClick={handleReset}
              className="px-4 sm:px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm sm:text-base"
            >
              🔄 Reset
            </button>
          </div>

          <div className="mt-4 text-xs sm:text-sm text-gray-500">
            {mode === "focus" ? (
              <p className="px-2">🎯 Tập trung làm việc trong 25 phút</p>
            ) : mode === "shortBreak" ? (
              <p className="px-2">🌿 Nghỉ ngắn 5 phút, thư giãn nhẹ</p>
            ) : (
              <p className="px-2">☕ Nghỉ dài 15 phút, đi lại, uống nước</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}