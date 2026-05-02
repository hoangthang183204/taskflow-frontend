// components/KanbanBoard.js
"use client";
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
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
import MoodPicker from "./MoodPicker"; // ✅ THÊM IMPORT

const columns = [
  {
    id: "todo",
    title: "📋 To Do",
    color: "bg-gray-100",
    headerColor: "bg-gray-500",
    icon: "",
  },
  {
    id: "doing",
    title: "🔄 Doing",
    color: "bg-yellow-50",
    headerColor: "bg-yellow-500",
    icon: "",
  },
  {
    id: "done",
    title: "✅ Done",
    color: "bg-green-50",
    headerColor: "bg-green-500",
    icon: "",
  },
];

export default function KanbanBoard({ tasks, token, onTaskUpdate }) {
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
  const [showMoodPicker, setShowMoodPicker] = useState(false); // ✅ THÊM STATE
  const [completedTaskId, setCompletedTaskId] = useState(null); // ✅ THÊM STATE

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const startEditing = (task) => {
    if (task.status === "done") {
      toast.info("Task đã hoàn thành, không thể sửa");
      return;
    }
    setEditingTask(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description || "");
    setEditDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    setEditPriority(task.priority || "medium");
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

  const handleDragEnd = async (result) => {
    console.log("🔍 DRAG ENDED:", result);
    console.log("source:", result.source);
    console.log("destination:", result.destination);
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;
    const taskId = draggableId;
    const draggedTask = boardTasks[sourceColumn][source.index];
    if (!draggedTask) return;

    const newBoardTasks = { ...boardTasks };
    newBoardTasks[sourceColumn] = [...newBoardTasks[sourceColumn]];
    newBoardTasks[sourceColumn].splice(source.index, 1);
    newBoardTasks[destColumn] = [...newBoardTasks[destColumn]];
    newBoardTasks[destColumn].splice(destination.index, 0, draggedTask);
    setBoardTasks(newBoardTasks);

    if (sourceColumn !== destColumn) {
      setLoading((prev) => ({ ...prev, [taskId]: true }));
      try {
        await updateTask(taskId, { status: destColumn }, token);
        toast.success(
          `Đã chuyển task sang ${columns.find((c) => c.id === destColumn)?.title}`,
        );

        // ✅ NẾU CHUYỂN SANG "DONE", HIỂN THỊ MOODPICKER
        if (destColumn === "done") {
          setCompletedTaskId(taskId);
          setShowMoodPicker(true);
        }

        onTaskUpdate?.();
      } catch (error) {
        toast.error("Không thể cập nhật trạng thái task");
        setBoardTasks(boardTasks);
      } finally {
        setLoading((prev) => ({ ...prev, [taskId]: false }));
      }
    }
  };

  const TaskCard = ({ task, showArchive = true }) => {
    const isEditing = editingTask === task.id;
    const isTaskLoading = loading[task.id];

    return (
      <div className="bg-white rounded-lg shadow-sm mb-3">
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
                  task.status === "done" ? "line-through text-gray-400" : ""
                }`}
              >
                {task.title}
              </h4>
              <p
                className={`text-xs text-gray-500 mb-2 line-clamp-2 ${
                  task.status === "done" ? "text-gray-400" : ""
                }`}
              >
                {task.description || "📝 Không có mô tả"}
              </p>
            </>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
            <div className="flex gap-2">{getPriorityBadge(task.priority)}</div>
            <div className="flex items-center gap-2">
              {task.dueDate && task.status !== "done" && (
                <span className="text-xs text-gray-500">
                  📅 {new Date(task.dueDate).toLocaleDateString("vi-VN")}
                </span>
              )}
              {getDueDateWarning(task.dueDate, task.status)}
            </div>
          </div>
        </div>
        {!isEditing && (
          <div className="flex border-t border-gray-100">
            {task.status !== "done" && (
              <button
                onClick={() => openEditModal(task)}
                className="flex-1 py-2 text-yellow-600 hover:bg-yellow-50 text-sm flex items-center justify-center gap-1"
              >
                ✏️ Sửa
              </button>
            )}
            {showArchive && (
              <button
                onClick={() => handleArchive(task.id)}
                className={`flex-1 py-2 text-purple-600 hover:bg-purple-50 text-sm flex items-center justify-center gap-1 ${
                  task.status !== "done" ? "border-l border-gray-100" : ""
                }`}
              >
                📦 Lưu trữ
              </button>
            )}
            <button
              onClick={() => handleSoftDelete(task.id)}
              className="flex-1 py-2 text-orange-600 hover:bg-orange-50 text-sm flex items-center justify-center gap-1 border-l border-gray-100"
            >
              🗑️ Xóa
            </button>
            {task.status !== "done" && (
              <button
                onClick={() => openTimer(task)}
                className="flex-1 py-2 text-purple-600 hover:bg-purple-50 text-sm flex items-center justify-center gap-1"
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Timer
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Mobile view (accordion)
  if (isMobile) {
    return (
      <div className="space-y-4">
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
              <TaskCard key={task.id} task={task} showArchive={false} />
            ))}
          </div>
        )}
        {columns.map((column) => (
          <div
            key={column.id}
            className={`${column.color} rounded-xl overflow-hidden`}
          >
            <button
              onClick={() =>
                setOpenColumn(openColumn === column.id ? null : column.id)
              }
              className={`w-full ${column.headerColor} text-white p-4 flex justify-between items-center`}
            >
              <span>
                <span className="text-xl">{column.icon}</span> {column.title}
              </span>
              <div className="flex items-center gap-3">
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                  {boardTasks[column.id].length}
                </span>
                <svg
                  className={`w-5 h-5 transition-transform ${openColumn === column.id ? "rotate-180" : ""}`}
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
              </div>
            </button>
            {openColumn === column.id && (
              <div className="p-3">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}>
                        {boardTasks[column.id].map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={String(task.id)}
                            index={index}
                            isDragDisabled={editingTask === task.id}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`mb-3 ${snapshot.isDragging ? "dragging" : ""}`}
                                style={provided.draggableProps.style}
                              >
                                <TaskCard task={task} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Desktop view
  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${showArchived ? "bg-purple-500 text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
        >
          📦 Kho lưu trữ ({archivedTasks.length})
          <svg
            className={`w-4 h-4 transition-transform ${showArchived ? "rotate-180" : ""}`}
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
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <div
              key={column.id}
              className={`${column.color} rounded-xl p-4 flex flex-col max-h-[calc(100vh-12rem)]`}
            >
              <div
                className={`${column.headerColor} text-white p-3 rounded-lg mb-4 flex justify-between items-center flex-shrink-0`}
              >
                <h3 className="font-semibold">
                  {column.icon} {column.title}
                </h3>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                  {boardTasks[column.id].length}
                </span>
              </div>
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto transition-colors rounded-lg p-2 ${snapshot.isDraggingOver ? "bg-white/50" : ""}`}
                    style={{ maxHeight: "calc(100vh - 250px)" }}
                  >
                    {boardTasks[column.id].map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                        isDragDisabled={editingTask === task.id}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="mb-3 draggable-item"
                          >
                            <TaskCard task={task} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
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
          onClose={() => {
            setTimerTask(null);
          }}
          onComplete={() => {
            onTaskUpdate?.();
          }}
        />
      )}

      {/* ✅ MOOD PICKER MODAL */}
      {showMoodPicker && (
        <MoodPicker
          taskId={completedTaskId}
          token={token}
          onClose={() => {
            setShowMoodPicker(false);
            setCompletedTaskId(null);
          }}
          onSuccess={() => {
            onTaskUpdate?.();
          }}
        />
      )}
    </div>
  );
}
