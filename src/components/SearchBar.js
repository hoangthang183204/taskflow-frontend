// components/SearchBar.js
"use client";
import { useState, useEffect, useCallback } from "react";
import VoiceInput from "./VoiceInput"; // ✅ THÊM IMPORT
import { toast } from "sonner"; // ✅ THÊM IMPORT

export default function SearchBar({ onSearch, onFilter, initialFilters = {} }) {
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || "");
  const [filters, setFilters] = useState({
    status: initialFilters.status || "",
    priority: initialFilters.priority || "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isListening, setIsListening] = useState(false); // ✅ THÊM STATE

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({ status: "", priority: "" });
    onSearch("");
    onFilter({ status: "", priority: "" });
  };

  // ✅ HÀM XỬ LÝ VOICE SEARCH
  const handleVoiceResult = (text) => {
    setSearchTerm(text);
    onSearch(text);
    toast.info(`🔍 Tìm kiếm: "${text}"`);
  };

  const hasActiveFilters = filters.status || filters.priority || searchTerm;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={isListening ? "🎤 Đang nghe..." : "Tìm kiếm task theo tiêu đề hoặc mô tả..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
              isListening ? "border-red-400 bg-red-50" : "border-gray-300"
            }`}
          />
        </div>
        
        {/* ✅ THÊM NÚT VOICE INPUT */}
        <VoiceInput 
          onResult={handleVoiceResult}
          onListeningChange={setIsListening}
        />
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
            showFilters || hasActiveFilters ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Bộ lọc
        </button>
        
        {hasActiveFilters && (
          <button onClick={clearFilters} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition">
            Xóa bộ lọc
          </button>
        )}
      </div>

      {isListening && (
        <p className="text-xs text-blue-500 mt-2 animate-pulse">
          🎤 Đang nghe... Hãy nói từ khóa cần tìm
        </p>
      )}

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="todo">📋 To do</option>
              <option value="doing">🔄 Doing</option>
              <option value="done">✅ Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Độ ưu tiên</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="low">🟢 Thấp</option>
              <option value="medium">🟡 Trung bình</option>
              <option value="high">🔴 Cao</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}