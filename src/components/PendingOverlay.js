// components/PendingOverlay.js
"use client";

export function PendingOverlay({ show, label = "Đang lưu..." }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-lg flex items-center justify-center z-10 pointer-events-none">
      <div className="flex items-center gap-2 text-xs text-blue-600 bg-white px-2 py-1 rounded-full shadow-sm border border-blue-100">
        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        {label}
      </div>
    </div>
  );
}

export default PendingOverlay;