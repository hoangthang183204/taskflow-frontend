"use client";
import KanbanBoardWrapper from "@/components/KanbanBoardWrapper";
import { useEffect, useState, useRef } from "react";
import { getTasks, deleteTask, getTrashTasks } from "@/services/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import useAuthStore from "@/store/authStore";
import SearchBar from "@/components/SearchBar";
import DashboardStats from "@/components/DashboardStats";
import TrashView from "@/components/TrashView";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [trashCount, setTrashCount] = useState(0);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
  });
  const [searchParams, setSearchParams] = useState({
    search: "",
    status: "",
    priority: "",
  });
  const router = useRouter();
  const isFirstRender = useRef(true);

  const { user, token, logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated && !token) {
      router.push("/login");
    }
  }, [isAuthenticated, token, router, isHydrated]);

  const fetchTasks = async (page = 1) => {
    if (!token) return;
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
      };
      if (searchParams.search) params.search = searchParams.search;
      if (searchParams.status) params.status = searchParams.status;
      if (searchParams.priority) params.priority = searchParams.priority;
      const response = await getTasks(token, params);
      setTasks(response.data || []);
      setPagination({
        total: response.total || 0,
        page: response.page || 1,
        limit: response.limit || 10,
      });
    } catch (err) {
      console.error("Lỗi load task:", err);
      setTasks([]);
      if (err.message === "Unauthorized" || err.message === "Invalid token") {
        logout();
        toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại");
        router.push("/login");
      } else {
        toast.error(err.message || "Lỗi load task");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTrashCount = async () => {
    if (!token) return;
    try {
      const response = await getTrashTasks(token, { page: 1, limit: 1 });
      setTrashCount(response.total || 0);
    } catch (err) {
      console.error("Lỗi lấy số lượng thùng rác:", err);
    }
  };

  const handleTaskUpdate = () => {
    fetchTasks(pagination.page);
    fetchTrashCount();
  };

  useEffect(() => {
    if (token) {
      if (!isFirstRender.current) {
        setPagination((prev) => ({ ...prev, page: 1 }));
      }
      fetchTasks(1);
      fetchTrashCount();
      isFirstRender.current = false;
    }
  }, [token, searchParams.search, searchParams.status, searchParams.priority]);

  useEffect(() => {
    if (token && pagination.page > 1) {
      fetchTasks(pagination.page);
    }
  }, [pagination.page]);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xoá task này?");
    if (!confirmDelete) return;
    try {
      await deleteTask(id, token);
      toast.success("Xoá task thành công");
      handleTaskUpdate();
    } catch (err) {
      toast.error(err.message || "Xoá thất bại");
    }
  };

  const handleSearch = (searchTerm) => {
    setSearchParams((prev) => ({ ...prev, search: searchTerm }));
  };

  const handleFilter = (filters) => {
    setSearchParams((prev) => ({ ...prev, ...filters }));
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
      logout();
      toast.success("Đã đăng xuất");
      router.push("/");
    }
  };

  const getAvatarInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return "U";
  };

  const goToNextPage = () => {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    if (pagination.page < totalPages) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const goToPrevPage = () => {
    if (pagination.page > 1) {
      setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const hasActiveFilters =
    searchParams.search || searchParams.status || searchParams.priority;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Header - ĐÃ SỬA LỖI LỆCH */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Logo bên trái */}
            <div className="flex items-center gap-4">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TaskFlow
              </h1>
            </div>

            {/* Tabs Navigation - ở giữa */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => {
                  setShowTrash(false);
                  setShowStats(false);
                }}
                className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition ${
                  !showTrash && !showStats
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                📋 Tasks
              </button>
              <button
                onClick={() => {
                  setShowStats(true);
                  setShowTrash(false);
                }}
                className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition ${
                  showStats
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                📊 Thống kê
              </button>
              <button
                onClick={() => {
                  setShowTrash(true);
                  setShowStats(false);
                }}
                className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition ${
                  showTrash
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🗑️ Thùng rác
                {trashCount > 0 && (
                  <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                    {trashCount}
                  </span>
                )}
              </button>
            </div>

            {/* Nút và Avatar bên phải */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/task/create")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition shadow-sm flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="hidden sm:inline">Task mới</span>
                <span className="sm:hidden">+</span>
              </button>

              <div className="relative group">
                <button className="flex items-center gap-2 focus:outline-none">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
                    {getAvatarInitial()}
                  </div>
                  <span className="hidden md:block text-sm text-gray-700">
                    {user?.name?.split(" ")[0]}
                  </span>
                  <svg
                    className="w-3 h-3 text-gray-500 hidden md:block"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Tài khoản
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Bar - Chỉ hiển thị khi không ở tab thống kê */}
        {!showStats && !showTrash && (
          <div className="mb-6">
            <SearchBar
              onSearch={handleSearch}
              onFilter={handleFilter}
              initialFilters={searchParams}
            />
          </div>
        )}

        {/* Content */}
        {showStats ? (
          <DashboardStats tasks={tasks} />
        ) : showTrash ? (
          <TrashView token={token} onTaskUpdate={handleTaskUpdate} />
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">
              {hasActiveFilters
                ? "🔍 Không tìm thấy task nào"
                : "✨ Chưa có task nào"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {hasActiveFilters
                ? "Hãy thử bộ lọc khác"
                : "Bắt đầu bằng cách tạo task đầu tiên"}
            </p>
            {!hasActiveFilters && (
              <button
                onClick={() => router.push("/task/create")}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm transition"
              >
                + Tạo task ngay
              </button>
            )}
          </div>
        ) : (
          <KanbanBoardWrapper
            tasks={tasks}
            token={token}
            onTaskUpdate={handleTaskUpdate}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && !showTrash && !showStats && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={goToPrevPage}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 bg-gray-500 text-white rounded-lg disabled:opacity-50 hover:bg-gray-600 transition text-sm"
            >
              ← Trước
            </button>
            <span className="px-3 py-1.5 text-gray-700 text-sm">
              Trang {pagination.page} / {totalPages}
            </span>
            <button
              onClick={goToNextPage}
              disabled={pagination.page >= totalPages}
              className="px-3 py-1.5 bg-gray-500 text-white rounded-lg disabled:opacity-50 hover:bg-gray-600 transition text-sm"
            >
              Sau →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}