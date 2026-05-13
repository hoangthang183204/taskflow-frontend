"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import useAuthStore from "@/store/authStore";
import KanbanBoardWrapper from "@/components/KanbanBoardWrapper";
import SearchBar from "@/components/SearchBar";
import DashboardStats from "@/components/DashboardStats";
import TrashView from "@/components/TrashView";
import NotificationBell from "@/components/NotificationBell";

export default function BoardDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token, logout, isAuthenticated } = useAuthStore();

  const [board, setBoard] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [searchParams, setSearchParams] = useState({
    search: "",
    status: "",
    priority: "",
    assignedTo: "",
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
  });
  const [creating, setCreating] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [boardMembers, setBoardMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !token) {
      router.push("/login");
    }
  }, [isAuthenticated, token, router]);

  useEffect(() => {
    if (token && id) {
      fetchBoardInfo();
      fetchAllTasks();
      fetchBoardMembers();
    }
  }, [token, id]);

  const fetchBoardInfo = async () => {
    try {
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"}/api/board/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("Board không tồn tại");
        } else if (response.status === 403) {
          setError("Bạn không có quyền truy cập board này");
        } else {
          setError("Không thể tải board");
        }
        return;
      }

      const data = await response.json();
      const boardData = data.data || data;
      setBoard(boardData);
      setIsOwner(String(boardData.userId) === String(user?.id));
    } catch (error) {
      console.error("Lỗi fetch board:", error);
      setError("Không thể tải board");
    }
  };

  const fetchAllTasks = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"}/api/task?boardId=${id}&limit=100`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();

      let tasksData = [];
      if (Array.isArray(data)) {
        tasksData = data;
      } else if (data?.data && Array.isArray(data.data)) {
        tasksData = data.data;
      }

      const boardTasks = tasksData.filter(
        (task) => String(task.boardId) === String(id),
      );
      setAllTasks(boardTasks);
    } catch (err) {
      console.error("Lỗi load task:", err);
      setAllTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Dùng useMemo để lọc tasks - tránh vòng lặp vô hạn
  const filteredTasks = useMemo(() => {
    let result = [...allTasks];

    // Lọc theo status
    if (searchParams.status) {
      result = result.filter((task) => task.status === searchParams.status);
    }

    // Lọc theo priority
    if (searchParams.priority) {
      result = result.filter((task) => task.priority === searchParams.priority);
    }

    // Lọc theo assignedTo
    if (searchParams.assignedTo) {
      if (searchParams.assignedTo === "me") {
        result = result.filter((task) => task.assignedTo === user?.id);
      } else if (searchParams.assignedTo === "unassigned") {
        result = result.filter((task) => !task.assignedTo);
      } else {
        result = result.filter(
          (task) => task.assignedTo === searchParams.assignedTo,
        );
      }
    }

    // Tìm kiếm theo từ khóa (tiêu đề, mô tả, email)
    if (searchParams.search && searchParams.search.trim()) {
      const searchLower = searchParams.search.toLowerCase().trim();
      result = result.filter((task) => {
        if (task.title?.toLowerCase().includes(searchLower)) return true;
        if (task.description?.toLowerCase().includes(searchLower)) return true;
        if (task.assignedToEmail?.toLowerCase().includes(searchLower))
          return true;
        if (task.assignedByName?.toLowerCase().includes(searchLower))
          return true;
        return false;
      });
    }

    return result;
  }, [allTasks, searchParams, user?.id]);

  const fetchBoardMembers = async () => {
    if (!token || !id) return;
    try {
      setLoadingMembers(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"}/api/board/${id}/members`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        setBoardMembers([]);
        return;
      }

      const data = await response.json();
      setBoardMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi fetch members:", error);
      setBoardMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.warning("Vui lòng nhập email");
      return;
    }

    setInviting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"}/api/board/${id}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: inviteEmail.trim() }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Không thể mời thành viên");
      }

      const data = await response.json();
      toast.success(data.message || "Đã mời thành viên thành công!");
      setInviteEmail("");
      setShowInviteModal(false);
      fetchBoardMembers();
    } catch (error) {
      console.error("Lỗi mời member:", error);
      toast.error(error.message || "Không thể mời thành viên");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Bạn có chắc muốn xóa ${memberName} khỏi board này?`)) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"}/api/board/${id}/members/${memberId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        throw new Error("Không thể xóa thành viên");
      }

      toast.success(`Đã xóa ${memberName} khỏi board`);
      fetchBoardMembers();
    } catch (error) {
      console.error("Lỗi xóa member:", error);
      toast.error(error.message || "Không thể xóa thành viên");
    }
  };

  const handleTaskUpdate = async () => {
    await fetchAllTasks();
  };

  const handleSearch = (searchTerm) => {
    setSearchParams((prev) => ({ ...prev, search: searchTerm }));
  };

  const handleFilter = (filters) => {
    setSearchParams((prev) => ({ ...prev, ...filters }));
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.warning("Vui lòng nhập tiêu đề task");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"}/api/task`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: newTask.title.trim(),
            description: newTask.description.trim(),
            priority: newTask.priority,
            dueDate: newTask.dueDate || null,
            boardId: id,
            status: "todo",
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Tạo task thất bại");
      }

      toast.success("Đã tạo task mới!");
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
      });
      setShowCreateModal(false);
      await fetchAllTasks();
    } catch (error) {
      console.error("Lỗi tạo task:", error);
      toast.error(error.message || "Không thể tạo task");
    } finally {
      setCreating(false);
    }
  };

  const getTodayDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

  const getAvatarInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    return "U";
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
      logout();
      router.push("/");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="text-6xl mb-4">😢</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Lỗi</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={() => router.push("/board")}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          ← Quay lại danh sách board
        </button>
      </div>
    );
  }

  if (loading && allTasks.length === 0 && !board) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Đang tải board...</div>
      </div>
    );
  }

  if (!board) return null;

  const hasActiveFilters =
    searchParams.search ||
    searchParams.status ||
    searchParams.priority ||
    searchParams.assignedTo;

  const activeTasks = filteredTasks.filter((t) => !t.isDeleted);
  const trashedTasks = filteredTasks.filter((t) => t.isDeleted === true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/board")}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{board.icon || "📋"}</span>
                {/* Ẩn tên board trên mobile, chỉ hiển thị trên desktop */}
                <h1 className="text-xl md:text-2xl font-bold text-gray-800 hidden md:block">
                  {board.name}
                </h1>
                {board.userId === user?.id && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full hidden sm:inline-block">
                    Chủ board
                  </span>
                )}
              </div>
              <button
                onClick={() => router.push("/team")}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              ></button>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell tasks={allTasks} />

              {isOwner && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-1"
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
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Mời thành viên</span>
                </button>
              )}

              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-1"
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
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
                    {getAvatarInitial()}
                  </div>
                  <span className="hidden md:block text-sm text-gray-700">
                    {user?.name?.split(" ")[0]}
                  </span>
                  <svg
                    className={`w-3 h-3 text-gray-500 hidden md:block transition-transform ${showUserMenu ? "rotate-180" : ""}`}
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

                {(showUserMenu || isHover) && (
                  <div
                    className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg overflow-hidden z-20"
                    onMouseEnter={() => setIsHover(true)}
                    onMouseLeave={() => setIsHover(false)}
                  >
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowUserMenu(false)}
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
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-3">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
              <button
                onClick={() => {
                  setShowTrash(false);
                  setShowStats(false);
                }}
                className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 rounded-md text-sm font-medium transition ${
                  !showTrash && !showStats
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                📋 Tasks ({activeTasks.length})
              </button>
              <button
                onClick={() => {
                  setShowStats(true);
                  setShowTrash(false);
                }}
                className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 rounded-md text-sm font-medium transition ${
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
                className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 rounded-md text-sm font-medium transition ${
                  showTrash
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🗑️ Thùng rác ({trashedTasks.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!showStats && !showTrash && (
          <div className="mb-6">
            <SearchBar
              onSearch={handleSearch}
              onFilter={handleFilter}
              initialFilters={searchParams}
              boardMembers={boardMembers}
            />
          </div>
        )}

        {showStats ? (
          <DashboardStats tasks={allTasks} />
        ) : showTrash ? (
          <TrashView token={token} onTaskUpdate={handleTaskUpdate} />
        ) : activeTasks.length === 0 ? (
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
                ? "🔍 Không tìm thấy task nào phù hợp với bộ lọc"
                : `✨ Board "${board.name}" chưa có task nào`}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {hasActiveFilters
                ? "Hãy thử bộ lọc khác hoặc xóa bộ lọc"
                : "Hãy tạo task đầu tiên cho board này"}
            </p>
            {!hasActiveFilters && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm transition"
              >
                + Tạo task đầu tiên
              </button>
            )}
          </div>
        ) : (
          <KanbanBoardWrapper
            tasks={activeTasks}
            token={token}
            board={board}
            onTaskUpdate={handleTaskUpdate}
          />
        )}
      </main>

      {/* Modal tạo task */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  📝 Tạo task trong &quot;{board.name}&quot;
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề *
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tiêu đề task"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mô tả chi tiết..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Độ ưu tiên
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={(e) =>
                        setNewTask({ ...newTask, priority: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg p-2"
                    >
                      <option value="low">🟢 Thấp</option>
                      <option value="medium">🟡 Trung bình</option>
                      <option value="high">🔴 Cao</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hạn chót
                    </label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) =>
                        setNewTask({ ...newTask, dueDate: e.target.value })
                      }
                      min={getTodayDate()}
                      className="w-full border border-gray-300 rounded-lg p-2"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={creating || !newTask.title.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                >
                  {creating ? "Đang tạo..." : "Tạo task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal mời thành viên */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  👥 Mời thành viên vào board
                </h2>
                <button
                  onClick={() => setShowInviteModal(false)}
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email thành viên
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Người dùng phải có tài khoản trong hệ thống
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    📋 Thành viên hiện tại ({boardMembers.length})
                  </p>
                  {loadingMembers ? (
                    <p className="text-sm text-gray-400">Đang tải...</p>
                  ) : boardMembers.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      Chưa có thành viên nào
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {boardMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex justify-between items-center text-sm"
                        >
                          <div className="flex-1">
                            <span className="font-medium">{member.name}</span>
                            <span className="text-gray-500 ml-2">
                              ({member.email})
                            </span>
                            {member.role === "owner" && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                Chủ board
                              </span>
                            )}
                          </div>
                          {isOwner && member.role !== "owner" && (
                            <button
                              onClick={() =>
                                handleRemoveMember(member.id, member.name)
                              }
                              className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50"
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleInviteMember}
                  disabled={inviting || !inviteEmail.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                >
                  {inviting ? "Đang mời..." : "📨 Gửi lời mời"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
