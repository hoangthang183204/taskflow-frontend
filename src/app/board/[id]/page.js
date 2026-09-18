"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import useAuthStore from "@/store/authStore";
import KanbanBoardWrapper from "@/components/KanbanBoardWrapper";
import SearchBar from "@/components/SearchBar";
import DashboardStats from "@/components/DashboardStats";
import TrashView from "@/components/TrashView";
import NotificationBell from "@/components/NotificationBell";
import EditTaskModal from "@/components/EditTaskModal";

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

  const [openTaskFromNotif, setOpenTaskFromNotif] = useState(null);
  const [trashCount, setTrashCount] = useState(0);

  const fetchTimeoutRef = useRef(null);

  // ============================================================
  // EFFECTS
  // ============================================================
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
      fetchTrashCount();
    }
  }, [token, id]);

  // ✅ [FIX] Tự động fetch lại dữ liệu mới nhất khi quay về tab Tasks
  useEffect(() => {
    if (!showStats && !showTrash && token && id) {
      fetchAllTasks();
      fetchTrashCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showStats, showTrash]);

  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const handleClearFilters = () => {
      setSearchParams({
        search: "",
        status: "",
        priority: "",
        assignedTo: "",
      });
      setShowStats(false);
      setShowTrash(false);
      toast.success("Đã xóa bộ lọc");
    };

    window.addEventListener("clearFilters", handleClearFilters);
    return () => window.removeEventListener("clearFilters", handleClearFilters);
  }, []);

  // ============================================================
  // FETCHERS
  // ============================================================
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
        if (response.status === 404) setError("Board không tồn tại");
        else if (response.status === 403)
          setError("Bạn không có quyền truy cập board này");
        else setError("Không thể tải board");
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
      if (Array.isArray(data)) tasksData = data;
      else if (data?.data && Array.isArray(data.data)) tasksData = data.data;

      const boardTasks = tasksData.filter(
        (task) => String(task.boardId) === String(id),
      );

      setAllTasks((prev) => {
        if (prev.length === boardTasks.length) {
          const same = prev.every((prevTask, i) => {
            const newTask = boardTasks[i];
            return (
              String(prevTask.id) === String(newTask.id) &&
              prevTask.status === newTask.status &&
              prevTask.title === newTask.title &&
              prevTask.description === newTask.description &&
              prevTask.priority === newTask.priority &&
              prevTask.dueDate === newTask.dueDate &&
              prevTask.assignedTo === newTask.assignedTo &&
              prevTask.updatedAt === newTask.updatedAt
            );
          });
          if (same) return prev;
        }
        return boardTasks;
      });
    } catch (err) {
      console.error("Lỗi load task:", err);
      setAllTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrashCount = async () => {
    if (!token || !id) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"}/api/task/trash?boardId=${id}&limit=100`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        let total = 0;
        let allTrash = [];

        if (Array.isArray(data)) {
          allTrash = data;
          total = allTrash.length;
        } else if (data?.data && Array.isArray(data.data)) {
          allTrash = data.data;
          total = data.total ?? allTrash.length;
        } else {
          total = data.total ?? 0;
        }

        if (allTrash.length > 0) {
          const boardTrash = allTrash.filter(
            (t) => String(t.boardId) === String(id),
          );
          if (boardTrash.length !== allTrash.length) {
            total = boardTrash.length;
          }
        }

        setTrashCount(total);
      }
    } catch (err) {
      console.error("Lỗi fetch trash count:", err);
    }
  };

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

      if (data.success && Array.isArray(data.data)) {
        setBoardMembers(data.data);
      } else if (Array.isArray(data)) {
        setBoardMembers(data);
      } else {
        setBoardMembers([]);
      }
    } catch (error) {
      console.error("Lỗi fetch members:", error);
      setBoardMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // ============================================================
  // FILTERED TASKS
  // ============================================================
  const filteredTasks = useMemo(() => {
    let result = [...allTasks];

    if (searchParams.status) {
      result = result.filter((task) => task.status === searchParams.status);
    }

    if (searchParams.priority) {
      result = result.filter((task) => task.priority === searchParams.priority);
    }

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

  // ============================================================
  // HANDLERS
  // ============================================================
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

      if (!response.ok) throw new Error("Không thể xóa thành viên");

      toast.success(`Đã xóa ${memberName} khỏi board`);
      fetchBoardMembers();
    } catch (error) {
      console.error("Lỗi xóa member:", error);
      toast.error(error.message || "Không thể xóa thành viên");
    }
  };

  // ✅ [FIX] Chỉ fetch khi đang ở tab Tasks, tăng timer lên 1000ms
  const handleTaskUpdate = () => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      // Chỉ fetch khi đang ở tab Tasks (không phải Stats/Trash)
      if (!showStats && !showTrash) {
        fetchAllTasks();
        fetchTrashCount();
      }
      fetchTimeoutRef.current = null;
    }, 1000);
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

  const handleOpenTaskFromNotif = (task) => {
    setOpenTaskFromNotif(task);
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

  // ============================================================
  // ERROR / LOADING
  // ============================================================
  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#fafbfc]">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Có lỗi xảy ra</h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button
          onClick={() => router.push("/board")}
          className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium"
        >
          ← Quay lại danh sách board
        </button>
      </div>
    );
  }

  if (loading && allTasks.length === 0 && !board) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fafbfc]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Đang tải board...</p>
        </div>
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

  return (
    <div className="h-screen h-dvh flex flex-col bg-[#fafbfc] overflow-hidden">
      {/* ==========================================================
          HEADER
          ========================================================== */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 z-10">
        {/* ===== Row 1: Board info + Actions ===== */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
            {/* LEFT: Back + Board name */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={() => router.push("/board")}
                className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
                title="Quay lại danh sách boards"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl sm:text-3xl leading-none">
                    {board.icon || "📋"}
                  </span>
                </div>
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  {board.name}
                </h1>
                {board.userId === user?.id && (
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100 flex-shrink-0">
                    <svg
                      className="w-2.5 h-2.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    Chủ board
                  </span>
                )}
              </div>
            </div>

            {/* RIGHT: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <NotificationBell
                tasks={allTasks}
                onOpenTask={handleOpenTaskFromNotif}
              />

              <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1" />

              {isOwner && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 rounded-lg transition-colors flex-shrink-0"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  Mời thành viên
                </button>
              )}

              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors shadow-sm flex-shrink-0"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="hidden sm:inline">Task mới</span>
              </button>

              <div className="relative ml-1">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-0.5 pr-1.5 hover:bg-gray-100 rounded-full transition focus:outline-none"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-[11px] sm:text-xs font-semibold shadow-sm flex-shrink-0">
                    {getAvatarInitial()}
                  </div>
                  <svg
                    className={`w-3 h-3 text-gray-400 transition-transform hidden sm:block ${
                      showUserMenu ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {(showUserMenu || isHover) && (
                  <div
                    className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-200/80 overflow-hidden z-20"
                    onMouseEnter={() => setIsHover(true)}
                    onMouseLeave={() => setIsHover(false)}
                  >
                    <div className="px-3 py-2.5 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {user?.name}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg
                          className="w-3.5 h-3.5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Tài khoản
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition text-left"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Row 2: Tabs căn giữa ===== */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-0.5 sm:gap-1 -mb-px overflow-x-auto scrollbar-thin justify-center">
            {[
              {
                id: "tasks",
                label: "Tasks",
                count: activeTasks.length,
                active: !showStats && !showTrash,
                onClick: () => {
                  setShowStats(false);
                  setShowTrash(false);
                },
                icon: (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                ),
              },
              {
                id: "stats",
                label: "Thống kê",
                active: showStats,
                onClick: () => {
                  setShowStats(true);
                  setShowTrash(false);
                },
                icon: (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                ),
              },
              {
                id: "trash",
                label: "Thùng rác",
                count: trashCount,
                active: showTrash,
                onClick: () => {
                  setShowTrash(true);
                  setShowStats(false);
                },
                icon: (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                ),
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={tab.onClick}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  tab.active
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      tab.active
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ==========================================================
          MAIN
          ========================================================== */}
      <main className="flex-1 min-h-0 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col">
        {!showStats && !showTrash && (
          <div className="flex-shrink-0 mb-4">
            <SearchBar
              onSearch={handleSearch}
              onFilter={handleFilter}
              initialFilters={searchParams}
              boardMembers={boardMembers}
            />
          </div>
        )}

        <div
          className={`flex-1 min-h-0 scrollbar-thin ${
            showStats || showTrash
              ? "overflow-y-auto"
              : "overflow-y-auto md:overflow-visible"
          }`}
        >
          {/* ✅ [FIX] Luôn render KanbanBoard, chỉ ẩn bằng CSS để giữ state */}
          <div className={showStats || showTrash ? "hidden" : "h-full min-h-0"}>
            <KanbanBoardWrapper
              tasks={activeTasks}
              token={token}
              board={board}
              onTaskUpdate={handleTaskUpdate}
            />
          </div>

          {/* Stats và Trash chỉ render khi cần */}
          {showStats && <DashboardStats tasks={allTasks} />}
          {showTrash && <TrashView token={token} onTaskUpdate={handleTaskUpdate} />}
        </div>
      </main>

      {/* ==========================================================
          MODALS
          ========================================================== */}

      {/* EditTaskModal từ notification */}
      {openTaskFromNotif && (
        <EditTaskModal
          task={openTaskFromNotif}
          token={token}
          open={true}
          onClose={() => setOpenTaskFromNotif(null)}
          onSuccess={() => {
            setOpenTaskFromNotif(null);
            fetchAllTasks();
          }}
        />
      )}

      {/* ============================================ */}
      {/* MODAL: Tạo task — Redesigned */}
      {/* ============================================ */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Tạo task mới
                  </h2>
                  <p className="text-[10px] text-gray-500 truncate">
                    trong "{board.name}"
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition flex-shrink-0"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  placeholder="Ví dụ: Hoàn thành báo cáo..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Mô tả
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                  placeholder="Mô tả chi tiết task..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Độ ưu tiên
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  >
                    <option value="low">🟢 Thấp</option>
                    <option value="medium">🟡 Trung bình</option>
                    <option value="high">🔴 Cao</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Hạn chót
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                    min={getTodayDate()}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateTask}
                disabled={creating || !newTask.title.trim()}
                className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {creating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Tạo task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL: Mời thành viên — Redesigned */}
      {/* ============================================ */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Mời thành viên
                  </h2>
                  <p className="text-[10px] text-gray-500 truncate">
                    Thêm người vào board "{board.name}"
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition flex-shrink-0"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Email thành viên
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  autoFocus
                />
                <p className="text-[10px] text-gray-500 mt-1.5">
                  Người dùng phải có tài khoản trong hệ thống
                </p>
              </div>

              {/* Members list */}
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-700">
                    Thành viên hiện tại
                  </p>
                  <span className="text-[10px] px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full font-medium">
                    {boardMembers.length}
                  </span>
                </div>

                {loadingMembers ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
                  </div>
                ) : boardMembers.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">
                    Chưa có thành viên nào
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                    {boardMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex justify-between items-center py-2 px-2 rounded-lg hover:bg-white transition group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                            {member.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-medium text-gray-800 truncate">
                                {member.name}
                              </p>
                              {member.role === "owner" && (
                                <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                                  Chủ
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 truncate">
                              {member.email}
                            </p>
                          </div>
                        </div>
                        {isOwner && member.role !== "owner" && (
                          <button
                            onClick={() =>
                              handleRemoveMember(member.id, member.name)
                            }
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded flex-shrink-0"
                            title="Xóa thành viên"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleInviteMember}
                disabled={inviting || !inviteEmail.trim()}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {inviting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang mời...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    Gửi lời mời
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}