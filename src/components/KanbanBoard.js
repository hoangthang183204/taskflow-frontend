"use client";
import { useState, useEffect } from "react";
import useAuthStore from "@/store/authStore";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  updateTask,
  deleteTask,
  archiveTask,
  restoreFromArchive,
  softDeleteTask,
} from "@/services/api";
import { toast } from "sonner";
import EditTaskModal from "./EditTaskModal";
import PomodoroTimer from "./PomodoroTimer";
import MoodPicker from "./MoodPicker";
import SortableTaskCard from "./SortableTaskCard";

const columns = [
  {
    id: "todo",
    title: "To Do",
    color: "bg-gray-100",
    headerColor: "bg-gray-500",
  },
  {
    id: "doing",
    title: "Doing",
    color: "bg-yellow-50",
    headerColor: "bg-yellow-500",
  },
  {
    id: "done",
    title: "Done",
    color: "bg-green-50",
    headerColor: "bg-green-500",
  },
];

export default function KanbanBoard({ tasks, token, board, onTaskUpdate }) {
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  const [boardTasks, setBoardTasks] = useState({
    todo: [],
    doing: [],
    done: [],
  });
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState({});
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [isMobile, setIsMobile] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [openColumn, setOpenColumn] = useState(null);
  const [timerTask, setTimerTask] = useState(null);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [completedTaskId, setCompletedTaskId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverColumnId, setDragOverColumnId] = useState(null);

  // State cho gán task
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTaskForAssign, setSelectedTaskForAssign] = useState(null);
  const [boardMembers, setBoardMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setEditingTask(null);
  }, [tasks]);

  useEffect(() => {
    const activeTasks = tasks.filter((t) => !t.isArchived);
    const archived = tasks.filter((t) => t.isArchived);
    setBoardTasks({
      todo: activeTasks.filter((t) => t.status === "todo"),
      doing: activeTasks.filter((t) => t.status === "doing"),
      done: activeTasks.filter((t) => t.status === "done"),
    });
    setArchivedTasks(archived);
  }, [tasks]);

  // Lấy danh sách thành viên trong board để gán task
  useEffect(() => {
    if (board?.id && token) {
      fetchBoardMembers();
    }
  }, [board?.id, token]);

  const fetchBoardMembers = async () => {
    if (!board?.id) return;
    try {
      setLoadingMembers(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"}/api/board/${board.id}/members/assignable`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        const members = data.data || data;
        setBoardMembers(Array.isArray(members) ? members : []);
        console.log("✅ Board members loaded:", members); // Debug
      } else {
        console.error("API error:", response.status);
        setBoardMembers([]);
      }
    } catch (error) {
      console.error("Lỗi fetch members:", error);
      setBoardMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Gán task cho thành viên
  const handleAssignTask = async (taskId, userId, userName) => {
    setAssigning(true);
    try {
      await updateTask(
        taskId,
        { assignedTo: userId, assignedByName: userName },
        token,
      );
      toast.success("Đã gán task cho thành viên");
      onTaskUpdate?.();
      setShowAssignModal(false);
      setSelectedTaskForAssign(null);
    } catch (error) {
      toast.error(error.message || "Không thể gán task");
    } finally {
      setAssigning(false);
    }
  };

  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
          🟢 Thấp
        </span>
      ),
      medium: (
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
          🟡 Trung
        </span>
      ),
      high: (
        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
          🔴 Cao
        </span>
      ),
    };
    return badges[priority] || badges.medium;
  };

  const getDueDateWarning = (dueDate, status) => {
    if (status === "done" || !dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0)
      return <span className="text-xs text-red-500">⚠️ Quá hạn</span>;
    if (daysLeft === 0)
      return <span className="text-xs text-orange-500">⚠️ Hôm nay</span>;
    if (daysLeft <= 2)
      return (
        <span className="text-xs text-yellow-500">⚠️ Còn {daysLeft} ngày</span>
      );
    return null;
  };

  const openEditModal = (task) => {
    if (task.status === "done") {
      toast.info("Task đã hoàn thành, không thể sửa");
      return;
    }
    setSelectedTask(task);
    setModalOpen(true);
  };

  const openTimer = (task) => {
    setTimerTask(task);
  };

  const saveEdit = async (taskId) => {
    if (!editTitle.trim()) {
      toast.warning("Tiêu đề không được để trống");
      return;
    }

    setLoading((prev) => ({ ...prev, [taskId]: true }));
    try {
      await updateTask(
        taskId,
        {
          title: editTitle.trim(),
          description: editDesc.trim(),
          dueDate: editDueDate || null,
          priority: editPriority,
        },
        token,
      );
      toast.success("Cập nhật thành công");
      setEditingTask(null);
      onTaskUpdate?.();
    } catch (error) {
      toast.error("Không thể cập nhật");
    } finally {
      setLoading((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditTitle("");
    setEditDesc("");
    setEditDueDate("");
    setEditPriority("medium");
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Bạn có chắc muốn xóa task này vĩnh viễn?")) return;
    try {
      await deleteTask(taskId, token);
      toast.success("Xóa task thành công");
      onTaskUpdate?.();
    } catch (error) {
      toast.error("Không thể xóa task");
    }
  };

  const handleSoftDelete = async (taskId) => {
    if (!window.confirm("Bạn có chắc muốn chuyển task này vào thùng rác?"))
      return;
    try {
      await softDeleteTask(taskId, token);
      toast.success("Đã chuyển vào thùng rác");
      onTaskUpdate?.();
    } catch (error) {
      toast.error("Không thể xóa task");
    }
  };

  const handleArchive = async (taskId) => {
    try {
      await archiveTask(taskId, token);
      toast.success("Đã chuyển vào kho lưu trữ");
      onTaskUpdate?.();
    } catch (error) {
      toast.error("Không thể lưu trữ task");
    }
  };

  const handleRestore = async (taskId) => {
    try {
      await restoreFromArchive(taskId, token);
      toast.success("Đã khôi phục task");
      onTaskUpdate?.();
    } catch (error) {
      toast.error("Không thể khôi phục task");
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);
    setDragOverColumnId(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    let sourceColumn = null;
    let destColumn = null;
    let sourceIndex = -1;
    let destIndex = -1;

    for (const col of ["todo", "doing", "done"]) {
      const idx = boardTasks[col].findIndex((t) => String(t.id) === activeId);
      if (idx !== -1) {
        sourceColumn = col;
        sourceIndex = idx;
        break;
      }
    }

    if (overId.startsWith("column-")) {
      destColumn = overId.replace("column-", "");
      destIndex = boardTasks[destColumn].length;
    } else {
      for (const col of ["todo", "doing", "done"]) {
        const idx = boardTasks[col].findIndex((t) => String(t.id) === overId);
        if (idx !== -1) {
          destColumn = col;
          destIndex = idx;
          break;
        }
      }
    }

    if (!sourceColumn || !destColumn) return;

    const draggedTask = boardTasks[sourceColumn][sourceIndex];
    if (!draggedTask) return;

    const newBoardTasks = { ...boardTasks };
    const [removed] = newBoardTasks[sourceColumn].splice(sourceIndex, 1);

    if (sourceColumn === destColumn) {
      newBoardTasks[destColumn].splice(destIndex, 0, removed);
    } else {
      newBoardTasks[destColumn].splice(destIndex, 0, {
        ...removed,
        status: destColumn,
      });
    }

    setBoardTasks(newBoardTasks);

    if (sourceColumn !== destColumn) {
      setLoading((prev) => ({ ...prev, [draggedTask.id]: true }));
      try {
        await updateTask(draggedTask.id, { status: destColumn }, token);
        toast.success(
          `Đã chuyển task sang ${columns.find((c) => c.id === destColumn)?.title}`,
        );

        setOpenColumn(destColumn);

        if (destColumn === "done") {
          setCompletedTaskId(draggedTask.id);
          setShowMoodPicker(true);
        }

        onTaskUpdate?.();
      } catch (error) {
        toast.error("Không thể cập nhật trạng thái task");
        setBoardTasks(boardTasks);
      } finally {
        setLoading((prev) => ({ ...prev, [draggedTask.id]: false }));
      }
    }
  };

  const TaskCardContent = ({ task }) => {
    const isEditing = editingTask === task.id;
    const isTaskLoading = loading[task.id];
    const isTodo = task.status === "todo";
    const isDoing = task.status === "doing";
    const isDone = task.status === "done";

    return (
      <div className="bg-white rounded-lg shadow-sm mb-3 relative">
        {isTaskLoading && (
          <div className="absolute right-2 top-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
        <div className="p-3">
          {isEditing ? (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full border border-blue-500 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tiêu đề task"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Mô tả task"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    Hạn chót
                  </label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    min={getTodayDate()}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    Độ ưu tiên
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">🟢 Thấp</option>
                    <option value="medium">🟡 Trung bình</option>
                    <option value="high">🔴 Cao</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => saveEdit(task.id)}
                  className="flex-1 px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition"
                >
                  ✅ Lưu
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex-1 px-3 py-1 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400 transition"
                >
                  ❌ Hủy
                </button>
              </div>
            </div>
          ) : (
            <>
              <h4
                className={`font-semibold text-gray-800 mb-1 text-sm line-clamp-2 ${
                  isDone ? "line-through text-gray-400" : ""
                }`}
              >
                {task.title}
              </h4>
              <p
                className={`text-xs text-gray-500 mb-2 line-clamp-2 ${
                  isDone ? "text-gray-400" : ""
                }`}
              >
                {task.description || "📝 Không có mô tả"}
              </p>

              {/* Hiển thị người được gán */}
              {task.assignedTo && (
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  {task.assignedTo === currentUserId ? (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                      📨 Giao cho tôi
                    </span>
                  ) : (
                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                      👤 Giao cho: {task.assignedByName || "Thành viên"}
                    </span>
                  )}
                </div>
              )}

              {/* Badge người tạo */}
              {task.userId === currentUserId && !task.assignedTo && (
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                    📝 Tôi tạo
                  </span>
                </div>
              )}
            </>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
            <div className="flex gap-2">{getPriorityBadge(task.priority)}</div>
            <div className="flex items-center gap-2">
              {task.dueDate && !isDone && (
                <span className="text-xs text-gray-500">
                  📅 {new Date(task.dueDate).toLocaleDateString("vi-VN")}
                </span>
              )}
              {getDueDateWarning(task.dueDate, task.status)}
            </div>
          </div>
        </div>
        {!isEditing && (
          <div className="flex border-t border-gray-100 flex-wrap">
            {/* Nút Sửa - hiển thị cho task chưa hoàn thành */}
            {!isDone && (
              <button
                onClick={() => openEditModal(task)}
                className="flex-1 py-2 text-yellow-600 hover:bg-yellow-50 text-sm flex items-center justify-center gap-1"
              >
                ✏️ Sửa
              </button>
            )}

            {isTodo && !isDone && (
              <button
                onClick={() => {
                  setSelectedTaskForAssign(task);
                  setShowAssignModal(true);
                }}
                className="flex-1 py-2 text-blue-600 hover:bg-blue-50 text-sm flex items-center justify-center gap-1 border-l border-gray-100"
              >
                👤 Gán
              </button>
            )}

            {/* Nút Lưu trữ - CHỈ hiển thị ở DOING và DONE (bỏ ở TODO) */}
            {!isTodo && !task.isArchived && (
              <button
                onClick={() => handleArchive(task.id)}
                className={`flex-1 py-2 text-purple-600 hover:bg-purple-50 text-sm flex items-center justify-center gap-1 ${
                  !isDone ? "border-l border-gray-100" : ""
                }`}
              >
                📦 Lưu trữ
              </button>
            )}

            {/* Nút Xóa - CHỈ hiển thị ở TODO và DONE (bỏ ở DOING) */}
            {!isDoing && (
              <button
                onClick={() => handleSoftDelete(task.id)}
                className="flex-1 py-2 text-orange-600 hover:bg-orange-50 text-sm flex items-center justify-center gap-1 border-l border-gray-100"
              >
                🗑️ Xóa
              </button>
            )}

            {/* Nút Timer - CHỈ hiển thị ở DOING */}
            {isDoing && !isDone && (
              <button
                onClick={() => openTimer(task)}
                className="flex-1 py-2 text-blue-600 hover:bg-blue-50 text-sm flex items-center justify-center gap-1 border-l border-gray-100"
              >
                ⏱️ Timer
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const DesktopColumnContent = ({ columnId, tasks }) => {
    const { setNodeRef } = useDroppable({
      id: `column-${columnId}`,
    });

    const column = columns.find((c) => c.id === columnId);
    const icon =
      columnId === "todo" ? "📋" : columnId === "doing" ? "🔄" : "✅";

    return (
      <div
        ref={setNodeRef}
        className={`${column?.color} rounded-xl p-4 flex flex-col`}
      >
        <div
          className={`${column?.headerColor} text-white p-3 rounded-lg mb-4 flex justify-between items-center flex-shrink-0`}
        >
          <h3 className="font-semibold">
            {icon} {column?.title}
          </h3>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
            {tasks.length}
          </span>
        </div>
        <SortableContext
          items={tasks.map((t) => String(t.id))}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex-1 rounded-lg p-2 space-y-2">
            {tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task}>
                <TaskCardContent task={task} />
              </SortableTaskCard>
            ))}
            {tasks.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-8 border-2 border-dashed border-gray-300 rounded-lg">
                📌 Kéo task vào đây
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    );
  };

  // Mobile Droppable Column Component
  const MobileDroppableColumn = ({ columnId, children }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: `column-${columnId}`,
    });

    useEffect(() => {
      if (isOver) {
        setDragOverColumnId(columnId);
      }
    }, [isOver, columnId]);

    return (
      <div
        ref={setNodeRef}
        className={`transition-all duration-200 rounded-lg ${
          isOver ? "bg-blue-100 ring-2 ring-blue-500" : ""
        }`}
        style={{ minHeight: "100px" }}
      >
        {children}
      </div>
    );
  };

  // Mobile View
  if (isMobile) {
    return (
      <>
        <div className="space-y-4 pb-20">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full bg-purple-100 text-purple-700 p-3 rounded-lg flex justify-between items-center"
          >
            <span>📦 Kho lưu trữ ({archivedTasks.length})</span>
            <svg
              className={`w-5 h-5 transition-transform ${showArchived ? "rotate-180" : ""}`}
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

          {showArchived && archivedTasks.length > 0 && (
            <div className="bg-purple-50 rounded-xl p-3">
              {archivedTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-lg shadow-sm p-3 mb-2"
                >
                  <h4 className="font-semibold text-gray-800">{task.title}</h4>
                  <p className="text-xs text-gray-500">
                    {task.description || "📝 Không có mô tả"}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    {getPriorityBadge(task.priority)}
                    <button
                      onClick={() => handleRestore(task.id)}
                      className="text-sm text-green-600 hover:text-green-700"
                    >
                      🔄 Khôi phục
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(event) => {
              setIsDragging(true);
              setActiveId(event.active.id);
            }}
            onDragEnd={handleDragEnd}
            onDragCancel={() => {
              setIsDragging(false);
              setDragOverColumnId(null);
            }}
          >
            {columns.map((column) => {
              const icon =
                column.id === "todo"
                  ? "📋"
                  : column.id === "doing"
                    ? "🔄"
                    : "✅";
              const shouldShowContent = isDragging || openColumn === column.id;

              return (
                <div
                  key={column.id}
                  className={`${column.color} rounded-xl overflow-hidden mb-4 transition-all duration-200 ${
                    dragOverColumnId === column.id
                      ? "ring-2 ring-blue-500 shadow-lg"
                      : ""
                  }`}
                >
                  <button
                    onClick={() => {
                      if (!isDragging) {
                        setOpenColumn(
                          openColumn === column.id ? null : column.id,
                        );
                      }
                    }}
                    className={`w-full ${column.headerColor} text-white p-4 flex justify-between items-center`}
                  >
                    <span className="font-semibold text-base">
                      <span className="text-xl mr-1">{icon}</span>
                      {column.title}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm font-medium">
                        {boardTasks[column.id].length}
                      </span>
                      {!isDragging && (
                        <svg
                          className={`w-5 h-5 transition-transform duration-200 ${
                            openColumn === column.id ? "rotate-180" : ""
                          }`}
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
                      )}
                    </div>
                  </button>

                  {shouldShowContent && (
                    <div className="p-3">
                      <MobileDroppableColumn columnId={column.id}>
                        <SortableContext
                          items={boardTasks[column.id].map((t) => String(t.id))}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {boardTasks[column.id].length === 0 && (
                              <div className="text-center text-gray-400 text-sm py-6 border-2 border-dashed border-gray-300 rounded-lg bg-white/50">
                                📌 Kéo task vào đây
                              </div>
                            )}
                            {boardTasks[column.id].map((task) => (
                              <SortableTaskCard key={task.id} task={task}>
                                <TaskCardContent task={task} />
                              </SortableTaskCard>
                            ))}
                          </div>
                        </SortableContext>
                      </MobileDroppableColumn>
                    </div>
                  )}
                </div>
              );
            })}

            <DragOverlay>
              {activeId ? (
                <div className="bg-white rounded-xl shadow-2xl p-4 opacity-95 cursor-grabbing w-[85vw] border-2 border-blue-400">
                  {(() => {
                    let task = null;
                    for (const col of ["todo", "doing", "done"]) {
                      const found = boardTasks[col].find(
                        (t) => String(t.id) === activeId,
                      );
                      if (found) {
                        task = found;
                        break;
                      }
                    }
                    if (task) {
                      return (
                        <div>
                          <h4 className="font-semibold text-gray-800 text-base">
                            {task.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {task.description || "📝 Không có mô tả"}
                          </p>
                          <div className="mt-2">
                            {getPriorityBadge(task.priority)}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        <EditTaskModal
          task={selectedTask}
          token={token}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedTask(null);
          }}
          onSuccess={onTaskUpdate}
        />

        {timerTask && (
          <PomodoroTimer
            taskId={timerTask.id}
            taskTitle={timerTask.title}
            onClose={() => setTimerTask(null)}
            onComplete={() => onTaskUpdate?.()}
          />
        )}

        {showMoodPicker && (
          <MoodPicker
            taskId={completedTaskId}
            token={token}
            onClose={() => {
              setShowMoodPicker(false);
              setCompletedTaskId(null);
            }}
            onSuccess={() => onTaskUpdate?.()}
          />
        )}

        {/* Modal gán task mobile */}
        {showAssignModal && selectedTaskForAssign && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    👤 Gán task cho thành viên
                  </h2>
                  <button
                    onClick={() => setShowAssignModal(false)}
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

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Task được gán</p>
                  <p className="font-medium text-gray-800">
                    {selectedTaskForAssign.title}
                  </p>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {loadingMembers ? (
                    <p className="text-center text-gray-500 py-4">
                      Đang tải...
                    </p>
                  ) : boardMembers.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      Chưa có thành viên nào trong board
                    </p>
                  ) : (
                    boardMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() =>
                          handleAssignTask(
                            selectedTaskForAssign.id,
                            member.id,
                            member.name,
                          )
                        }
                        disabled={assigning}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition flex items-center gap-3 border"
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {member.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {member.email}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 rounded-lg"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop View
  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
            showArchived
              ? "bg-purple-500 text-white shadow-md"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          📦 Kho lưu trữ ({archivedTasks.length})
          <svg
            className={`w-5 h-5 transition-transform ${showArchived ? "rotate-180" : ""}`}
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
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => setActiveId(event.active.id)}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <div key={column.id}>
              <DesktopColumnContent
                columnId={column.id}
                tasks={boardTasks[column.id]}
              />
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeId ? (
            <div className="bg-white rounded-lg shadow-lg p-3 opacity-90 cursor-grabbing">
              {(() => {
                let task = null;
                for (const col of ["todo", "doing", "done"]) {
                  const found = boardTasks[col].find(
                    (t) => String(t.id) === activeId,
                  );
                  if (found) {
                    task = found;
                    break;
                  }
                }
                if (task) {
                  return (
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">
                        {task.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {task.description || "📝 Không có mô tả"}
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {showArchived && archivedTasks.length > 0 && (
        <div className="mt-8">
          <div className="bg-purple-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-purple-800 mb-4">
              📦 Kho lưu trữ ({archivedTasks.length} task)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {archivedTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-lg shadow-sm p-3"
                >
                  <h4 className="font-semibold text-gray-800 mb-1">
                    {task.title}
                  </h4>
                  <p className="text-xs text-gray-500 mb-2">
                    {task.description || "📝 Không có mô tả"}
                  </p>
                  <div className="flex justify-between items-center">
                    {getPriorityBadge(task.priority)}
                    <button
                      onClick={() => handleRestore(task.id)}
                      className="text-sm text-green-600 hover:text-green-700"
                    >
                      🔄 Khôi phục
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <EditTaskModal
        task={selectedTask}
        token={token}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedTask(null);
        }}
        onSuccess={onTaskUpdate}
      />

      {timerTask && (
        <PomodoroTimer
          taskId={timerTask.id}
          taskTitle={timerTask.title}
          onClose={() => setTimerTask(null)}
          onComplete={() => onTaskUpdate?.()}
        />
      )}

      {showMoodPicker && (
        <MoodPicker
          taskId={completedTaskId}
          token={token}
          onClose={() => {
            setShowMoodPicker(false);
            setCompletedTaskId(null);
          }}
          onSuccess={() => onTaskUpdate?.()}
        />
      )}

      {/* Modal gán task desktop */}
      {showAssignModal && selectedTaskForAssign && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  👤 Gán task cho thành viên
                </h2>
                <button
                  onClick={() => setShowAssignModal(false)}
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

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Task được gán</p>
                <p className="font-medium text-gray-800">
                  {selectedTaskForAssign.title}
                </p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {loadingMembers ? (
                  <p className="text-center text-gray-500 py-4">Đang tải...</p>
                ) : boardMembers.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    Chưa có thành viên nào trong board
                  </p>
                ) : (
                  boardMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() =>
                        handleAssignTask(
                          selectedTaskForAssign.id,
                          member.id,
                          member.name,
                        )
                      }
                      disabled={assigning}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition flex items-center gap-3 border"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {member.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {member.name}
                        </p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
