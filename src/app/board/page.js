"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMyBoards, createBoard, deleteBoard } from "@/services/api";
import useAuthStore from "@/store/authStore";
import { toast } from "sonner";
import NotificationBell from "@/components/NotificationBell";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
];
const ICONS = ["📋", "🎯", "💼", "🏠", "📚", "🎨", "⚽", "🍔", "✈️", "❤️"];

export default function BoardsPage() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoard, setNewBoard] = useState({
    name: "",
    description: "",
    color: COLORS[0],
    icon: ICONS[0],
  });
  const [creating, setCreating] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const { token, user, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchBoards();
  }, [token]);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const data = await getMyBoards(token);
      setBoards(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi fetch boards:", error);
      toast.error("Không thể tải danh sách board");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoard.name.trim()) {
      toast.warning("Vui lòng nhập tên board");
      return;
    }
    setCreating(true);
    try {
      const board = await createBoard(token, newBoard);
      toast.success(`Đã tạo board "${board.name || newBoard.name}"`);
      setShowCreateModal(false);
      setNewBoard({
        name: "",
        description: "",
        color: COLORS[0],
        icon: ICONS[0],
      });
      await fetchBoards();
    } catch (error) {
      console.error("Lỗi tạo board:", error);
      toast.error("Không thể tạo board");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBoard = async (boardId, boardName) => {
    if (!confirm(`Bạn có chắc muốn xóa board "${boardName}"?`)) return;
    try {
      await deleteBoard(token, boardId);
      toast.success("Đã xóa board");
      await fetchBoards();
    } catch (error) {
      toast.error("Không thể xóa board");
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TaskFlow
              </h1>
              <button
                onClick={() => router.push("/team")}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
              </button>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell tasks={[]} />

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
                <span className="hidden sm:inline">Tạo board</span>
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            📋 Bảng công việc
          </h1>
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500 text-lg">Chưa có board nào</p>
            <p className="text-gray-400 text-sm mt-2">
              Hãy tạo board đầu tiên để bắt đầu
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg transition"
            >
              + Tạo board ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {boards.map((board) => (
              <div
                key={board.id}
                onClick={() => router.push(`/board/${board.id}`)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
              >
                <div
                  className="h-2"
                  style={{ backgroundColor: board.color || COLORS[0] }}
                ></div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-4xl">{board.icon || ICONS[0]}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBoard(board.id, board.name);
                      }}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {board.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {board.description || "Không có mô tả"}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                    <span>
                      📅{" "}
                      {board.createdAt
                        ? new Date(board.createdAt).toLocaleDateString("vi-VN")
                        : "Mới tạo"}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-5 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 hover:border-blue-400"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl text-gray-400">
                +
              </div>
              <span className="text-gray-500">Tạo board mới</span>
            </button>
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  ➕ Tạo board mới
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
                    Tên board *
                  </label>
                  <input
                    type="text"
                    value={newBoard.name}
                    onChange={(e) =>
                      setNewBoard({ ...newBoard, name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg p-2"
                    placeholder="VD: Công việc, Học tập..."
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={newBoard.description}
                    onChange={(e) =>
                      setNewBoard({ ...newBoard, description: e.target.value })
                    }
                    rows="2"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    placeholder="Mô tả board..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Màu sắc
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewBoard({ ...newBoard, color })}
                        className={`w-8 h-8 rounded-full transition ${newBoard.color === color ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : ""}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Biểu tượng
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setNewBoard({ ...newBoard, icon })}
                        className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition ${newBoard.icon === icon ? "bg-blue-100 ring-2 ring-blue-500" : "bg-gray-100"}`}
                      >
                        {icon}
                      </button>
                    ))}
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
                  onClick={handleCreateBoard}
                  disabled={creating || !newBoard.name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                >
                  {creating ? "Đang tạo..." : "Tạo board"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
