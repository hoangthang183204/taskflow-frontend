// components/KanbanBoard.js
"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import useAuthStore from "@/store/authStore";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  MouseSensor,
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
import PendingOverlay from "./PendingOverlay";
import useBoardSocket from "@/hooks/useBoardSocket";
import { useOptimisticTasks } from "@/hooks/useOptimisticTasks";
import {
  IconEdit,
  IconUser,
  IconArchive,
  IconTrash,
  IconClock,
  IconCalendar,
  IconAlertTriangle,
  IconChevronDown,
  IconChevronLeft,
  IconPackage,
  IconCircle,
  IconCircleDot,
  IconCircleCheck,
  IconListChecks,
  IconPlus,
  IconRefresh,
  IconX,
} from "./Icons";

// ============================================================
// COLUMNS CONFIG — với gradient đẹp
// ============================================================
const columns = [
  {
    id: "todo",
    title: "To Do",
    color: "bg-white",
    headerColor: "bg-gradient-to-br from-slate-500 to-slate-600",
    dotColor: "bg-slate-400",
    Icon: IconCircle,
  },
  {
    id: "doing",
    title: "Doing",
    color: "bg-white",
    headerColor: "bg-gradient-to-br from-amber-500 to-orange-500",
    dotColor: "bg-amber-400",
    Icon: IconCircleDot,
  },
  {
    id: "done",
    title: "Done",
    color: "bg-white",
    headerColor: "bg-gradient-to-br from-emerald-500 to-green-600",
    dotColor: "bg-emerald-400",
    Icon: IconCircleCheck,
  },
];

const dedupById = (arr) => {
  const map = new Map();
  for (const item of arr) {
    const id = String(item.id);
    if (!map.has(id)) map.set(id, item);
  }
  return [...map.values()];
};

export default function KanbanBoard({ tasks, token, board, onTaskUpdate }) {
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  const wsDeletedRef = useRef(new Set());
  const wsArchivedRef = useRef(new Set());
  const wsRestoredRef = useRef(new Set());
  const tasksSignatureRef = useRef("");

  const {
    tasks: boardTasks,
    setTasks: setBoardTasks,
    isPending,
    markPending,
    unmarkPending,
    markRecentOptimistic,
    isRecentOptimistic,
    clearRecentOptimistic,
    shouldSkipSync,
    execute,
    updateTaskInPlace,
    moveTask,
    removeTask,
  } = useOptimisticTasks({ todo: [], doing: [], done: [] });

  // ✅ FIX: Ref cho shouldSkipSync để tránh re-render
  const shouldSkipSyncRef = useRef(shouldSkipSync);
  useEffect(() => {
    shouldSkipSyncRef.current = shouldSkipSync;
  }, [shouldSkipSync]);

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

  const [collapsed, setCollapsed] = useState({
    todo: false,
    doing: false,
    done: false,
  });

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTaskForAssign, setSelectedTaskForAssign] = useState(null);
  const [boardMembers, setBoardMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const isDraggingRef = useRef(false);
  const recentReorderRef = useRef(new Set());
  const scrollPositionsRef = useRef({ todo: 0, doing: 0, done: 0 });

  // ============================================================
  // SENSORS
  // ============================================================
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 8 },
    }),
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ============================================================
  // WEBSOCKET HANDLERS
  // ============================================================
  useBoardSocket({
    boardId: board?.id,
    token,
    onTaskCreated: (task) => {
      const id = String(task.id);
      wsDeletedRef.current.delete(id);
      wsArchivedRef.current.delete(id);
      wsRestoredRef.current.delete(id);

      setBoardTasks((prev) => {
        const next = {
          todo: [...prev.todo],
          doing: [...prev.doing],
          done: [...prev.done],
        };
        for (const col of ["todo", "doing", "done"]) {
          next[col] = next[col].filter((t) => String(t.id) !== id);
        }
        const status = task.status || "todo";
        if (next[status]) next[status].push(task);
        return next;
      });
    },

    onTaskUpdated: (task) => {
      const id = String(task.id);

      if (shouldSkipSyncRef.current(id)) return;
      if (isDraggingRef.current) return;
      if (recentReorderRef.current.has(id)) return;

      if (task.isArchived || task.archivedAt) {
        wsArchivedRef.current.add(id);

        setBoardTasks((prev) => {
          const next = { ...prev };
          for (const col of ["todo", "doing", "done"]) {
            next[col] = next[col].filter((t) => String(t.id) !== id);
          }
          return next;
        });

        setArchivedTasks((prev) => {
          if (prev.some((t) => String(t.id) === id)) return prev;
          return [...prev, task];
        });
        return;
      }

      setBoardTasks((prev) => {
        const next = { todo: [], doing: [], done: [] };
        for (const col of ["todo", "doing", "done"]) {
          next[col] = prev[col].filter((t) => String(t.id) !== id);
        }
        const status = task.status || "todo";
        if (next[status]) next[status].push(task);
        return next;
      });
    },

    onTaskDeleted: (id) => {
      const taskId = String(id);
      wsDeletedRef.current.add(taskId);

      setBoardTasks((prev) => {
        const next = {};
        for (const col of ["todo", "doing", "done"]) {
          next[col] = prev[col].filter((t) => String(t.id) !== taskId);
        }
        return next;
      });
    },

    onTaskRestored: (task) => {
      const id = String(task.id);
      wsDeletedRef.current.delete(id);
      wsArchivedRef.current.delete(id);
      wsRestoredRef.current.add(id);
      setTimeout(() => wsRestoredRef.current.delete(id), 5000);

      setArchivedTasks((prev) => prev.filter((t) => String(t.id) !== id));

      setBoardTasks((prev) => {
        const next = {
          todo: [...prev.todo],
          doing: [...prev.doing],
          done: [...prev.done],
        };
        for (const col of ["todo", "doing", "done"]) {
          next[col] = next[col].filter((t) => String(t.id) !== id);
        }
        const status = task.status || "todo";
        if (next[status]) next[status].push(task);
        return next;
      });
    },

    onTaskArchived: (task) => {
      const id = String(task.id);
      wsArchivedRef.current.add(id);
      wsRestoredRef.current.delete(id);

      setBoardTasks((prev) => {
        const next = {
          todo: [...prev.todo],
          doing: [...prev.doing],
          done: [...prev.done],
        };
        for (const col of ["todo", "doing", "done"]) {
          next[col] = next[col].filter((t) => String(t.id) !== id);
        }
        return next;
      });

      setArchivedTasks((prev) => {
        if (prev.some((t) => String(t.id) === id)) return prev;
        return [...prev, task];
      });
    },
  });

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setEditingTask(null);
  }, [tasks]);

  // ============================================================
  // SYNC tasks prop → state
  // ============================================================
  useEffect(() => {
    if (isDraggingRef.current) return;

    const signature = tasks
      .map((t) => `${t.id}:${t.updatedAt || t.createdAt}:${t.status}`)
      .sort()
      .join("|");

    if (tasksSignatureRef.current === signature) return;
    tasksSignatureRef.current = signature;

    const activeTasks = tasks.filter((t) => !t.isArchived && !t.archivedAt);
    const archived = tasks.filter((t) => t.isArchived || t.archivedAt);

    const propActiveIds = new Set(activeTasks.map((t) => String(t.id)));
    const propArchivedIds = new Set(archived.map((t) => String(t.id)));

    setBoardTasks((prev) => {
      const allTasksMap = new Map();

      for (const col of ["todo", "doing", "done"]) {
        for (const t of prev[col]) {
          const id = String(t.id);
          if (wsDeletedRef.current.has(id)) continue;
          if (wsArchivedRef.current.has(id)) continue;
          if (propArchivedIds.has(id)) continue;

          if (shouldSkipSyncRef.current(id)) {
            if (!allTasksMap.has(id)) allTasksMap.set(id, t);
            continue;
          }
          if (!allTasksMap.has(id)) allTasksMap.set(id, t);
        }
      }

      for (const t of activeTasks) {
        const id = String(t.id);
        if (wsDeletedRef.current.has(id)) continue;
        if (wsArchivedRef.current.has(id)) continue;
        if (shouldSkipSyncRef.current(id)) continue;

        if (allTasksMap.has(id)) {
          allTasksMap.set(id, t);
        } else {
          allTasksMap.set(id, t);
        }
      }

      const finalMap = new Map();
      for (const [id, task] of allTasksMap.entries()) {
        if (propActiveIds.has(id)) {
          finalMap.set(id, task);
        } else if (shouldSkipSyncRef.current(id)) {
          finalMap.set(id, task);
        } else if (wsRestoredRef.current.has(id)) {
          finalMap.set(id, task);
        }
      }

      const merged = { todo: [], doing: [], done: [] };
      const seen = new Set();

      for (const task of finalMap.values()) {
        const id = String(task.id);
        if (seen.has(id)) continue;
        seen.add(id);
        const status = task.status || "todo";
        if (merged[status]) merged[status].push(task);
        else merged.todo.push(task);
      }

      const prevSignature = `${prev.todo
        .map((t) => String(t.id))
        .join(",")}|${prev.doing.map((t) => String(t.id)).join(",")}|${prev.done
        .map((t) => String(t.id))
        .join(",")}`;
      const newSignature = `${merged.todo
        .map((t) => String(t.id))
        .join(",")}|${merged.doing
        .map((t) => String(t.id))
        .join(",")}|${merged.done.map((t) => String(t.id)).join(",")}`;

      if (prevSignature === newSignature) {
        const dataChanged =
          prev.todo.length !== merged.todo.length ||
          prev.doing.length !== merged.doing.length ||
          prev.done.length !== merged.done.length;
        if (!dataChanged) return prev;
      }

      return merged;
    });

    setArchivedTasks((prev) => {
      const map = new Map();

      for (const t of archived) {
        const id = String(t.id);
        if (wsDeletedRef.current.has(id)) continue;
        if (!map.has(id)) map.set(id, t);
      }

      const now = Date.now();
      for (const t of prev) {
        const id = String(t.id);
        if (map.has(id)) continue;
        if (wsDeletedRef.current.has(id)) continue;
        if (shouldSkipSyncRef.current(id)) {
          map.set(id, t);
          continue;
        }
        const archivedAt = t.archivedAt ? Number(t.archivedAt) : 0;
        if (archivedAt && now - archivedAt < 5000) {
          map.set(id, t);
        }
      }

      const result = [...map.values()];
      if (
        prev.length === result.length &&
        prev.every((t, i) => String(t.id) === String(result[i]?.id))
      ) {
        return prev;
      }
      return result;
    });

    for (const id of [...wsArchivedRef.current]) {
      if (propActiveIds.has(id)) {
        wsArchivedRef.current.delete(id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  useEffect(() => {
    if (board?.id && token) {
      fetchBoardMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board?.id, token]);

  // ============================================================
  // MEMBERS
  // ============================================================
  const fetchBoardMembers = async () => {
    if (!board?.id) return;
    try {
      setLoadingMembers(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"}/api/board/${board.id}/members/assignable`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        const members = data.data || data;
        setBoardMembers(Array.isArray(members) ? members : []);
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
  // ASSIGN TASK
  // ============================================================
  const handleAssignTask = async (taskId, userId, userName) => {
    setAssigning(true);
    markPending(taskId);
    markRecentOptimistic(taskId);

    await execute(
      updateTaskInPlace(taskId, () => ({
        assignedTo: userId,
        assignedByName: userName,
      })),
      () =>
        updateTask(
          taskId,
          { assignedTo: userId, assignedByName: userName },
          token
        ),
      {
        errorMessage: "Không thể gán task",
        onSuccess: () => {
          toast.success("Đã gán task cho thành viên");
          setShowAssignModal(false);
          setSelectedTaskForAssign(null);
        },
      }
    );

    unmarkPending(taskId);
    setAssigning(false);
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getPriorityBadge = (priority) => {
    const config = {
      low: {
        color: "bg-emerald-500",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-100",
        label: "Thấp",
      },
      medium: {
        color: "bg-amber-500",
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-100",
        label: "Trung",
      },
      high: {
        color: "bg-red-500",
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-100",
        label: "Cao",
      },
    };
    const c = config[priority] || config.medium;
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] ${c.bg} ${c.text} px-1.5 py-0.5 rounded-md font-medium border ${c.border}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
        {c.label}
      </span>
    );
  };

  const getDueDateWarning = (dueDate, status) => {
    if (status === "done" || !dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0)
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] text-red-500 font-medium">
          <IconAlertTriangle className="w-3 h-3" />
          Quá hạn
        </span>
      );
    if (daysLeft === 0)
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] text-orange-500 font-medium">
          <IconAlertTriangle className="w-3 h-3" />
          Hôm nay
        </span>
      );
    if (daysLeft <= 2)
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] text-yellow-600 font-medium">
          <IconAlertTriangle className="w-3 h-3" />
          {daysLeft}n
        </span>
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

    markPending(taskId);
    markRecentOptimistic(taskId);
    setEditingTask(null);

    await execute(
      updateTaskInPlace(taskId, () => ({
        title: editTitle.trim(),
        description: editDesc.trim(),
        dueDate: editDueDate || null,
        priority: editPriority,
      })),
      () =>
        updateTask(
          taskId,
          {
            title: editTitle.trim(),
            description: editDesc.trim(),
            dueDate: editDueDate || null,
            priority: editPriority,
          },
          token
        ),
      {
        errorMessage: "Không thể cập nhật task",
        onSuccess: () => toast.success("Cập nhật thành công"),
      }
    );

    unmarkPending(taskId);
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditTitle("");
    setEditDesc("");
    setEditDueDate("");
    setEditPriority("medium");
  };

  const handleSoftDelete = async (taskId) => {
    if (!window.confirm("Bạn có chắc muốn chuyển task này vào thùng rác?"))
      return;

    const taskIdStr = String(taskId);
    wsDeletedRef.current.add(taskIdStr);
    markPending(taskId);
    markRecentOptimistic(taskId);

    let taskSnapshot = null;
    for (const col of ["todo", "doing", "done"]) {
      const found = boardTasks[col].find((t) => String(t.id) === taskIdStr);
      if (found) {
        taskSnapshot = { ...found };
        break;
      }
    }

    const result = await execute(
      removeTask(taskId),
      () => softDeleteTask(taskId, token),
      {
        errorMessage: "Không thể xóa task",
        onError: () => {
          wsDeletedRef.current.delete(taskIdStr);
        },
      }
    );

    unmarkPending(taskId);

    if (result.success && taskSnapshot) {
      toast.success("Đã chuyển vào thùng rác", {
        action: {
          label: "Hoàn tác",
          onClick: async () => {
            try {
              const { restoreFromTrash } = await import("@/services/api");
              await restoreFromTrash(taskId, token);
              wsDeletedRef.current.delete(taskIdStr);
              clearRecentOptimistic(taskId);
              setBoardTasks((prev) => {
                const next = { ...prev };
                const status = taskSnapshot.status || "todo";
                next[status] = [...next[status], taskSnapshot];
                return next;
              });
              toast.success("Đã hoàn tác");
            } catch {
              toast.error("Không thể hoàn tác");
            }
          },
        },
        duration: 5000,
      });
    }
  };

  const handleArchive = async (taskId) => {
    let taskToArchive = null;
    for (const col of ["todo", "doing", "done"]) {
      const found = boardTasks[col].find((t) => String(t.id) === String(taskId));
      if (found) {
        taskToArchive = found;
        break;
      }
    }
    if (!taskToArchive) return;

    const taskIdStr = String(taskId);
    wsArchivedRef.current.add(taskIdStr);
    markPending(taskId);
    markRecentOptimistic(taskId);

    setArchivedTasks((prev) => {
      if (prev.some((t) => String(t.id) === taskIdStr)) return prev;
      return [
        ...prev,
        { ...taskToArchive, isArchived: true, archivedAt: Date.now() },
      ];
    });

    await execute(
      removeTask(taskId),
      () => archiveTask(taskId, token),
      {
        errorMessage: "Không thể lưu trữ task",
        onSuccess: () => toast.success("Đã chuyển vào kho lưu trữ"),
        onError: () => {
          wsArchivedRef.current.delete(taskIdStr);
          setArchivedTasks((prev) =>
            prev.filter((t) => String(t.id) !== taskIdStr)
          );
        },
      }
    );

    unmarkPending(taskId);
  };

  const handleRestore = async (taskId) => {
    const task = archivedTasks.find((t) => String(t.id) === String(taskId));
    if (!task) return;

    const taskIdStr = String(taskId);
    wsArchivedRef.current.delete(taskIdStr);
    wsDeletedRef.current.delete(taskIdStr);
    markPending(taskId);
    markRecentOptimistic(taskId);

    setArchivedTasks((prev) => prev.filter((t) => String(t.id) !== taskIdStr));

    await execute(
      (current) => {
        const next = {
          todo: [...current.todo],
          doing: [...current.doing],
          done: [...current.done],
        };
        for (const col of ["todo", "doing", "done"]) {
          next[col] = next[col].filter((t) => String(t.id) !== taskIdStr);
        }
        const status = task.status || "todo";
        if (next[status]) {
          next[status].push({ ...task, isArchived: false, archivedAt: null });
        }
        return next;
      },
      () => restoreFromArchive(taskId, token),
      {
        errorMessage: "Không thể khôi phục task",
        onSuccess: () => {
          toast.success("Đã khôi phục task");
          onTaskUpdate?.();
        },
        onError: () => {
          wsArchivedRef.current.add(taskIdStr);
          setArchivedTasks((prev) => [...prev, task]);
        },
      }
    );

    unmarkPending(taskId);
  };

  // ============================================================
  // DRAG & DROP
  // ============================================================
  const handleDragStart = (event) => {
    isDraggingRef.current = true;
    setActiveId(event.active.id);
    setIsDragging(true);
    document.body.classList.add("dragging-active");
  };

  const handleDragCancel = () => {
    isDraggingRef.current = false;
    setActiveId(null);
    setIsDragging(false);
    setDragOverColumnId(null);
    document.body.classList.remove("dragging-active");
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    isDraggingRef.current = false;
    setActiveId(null);
    setIsDragging(false);
    setDragOverColumnId(null);
    document.body.classList.remove("dragging-active");

    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    if (activeIdStr === overIdStr) return;

    let sourceColumn = null;
    let sourceIndex = -1;
    for (const col of ["todo", "doing", "done"]) {
      const idx = boardTasks[col].findIndex((t) => String(t.id) === activeIdStr);
      if (idx !== -1) {
        sourceColumn = col;
        sourceIndex = idx;
        break;
      }
    }
    if (!sourceColumn) return;

    const draggedTask = boardTasks[sourceColumn][sourceIndex];
    if (!draggedTask) return;

    let destColumn = null;
    let destIndex = -1;

    if (overIdStr.startsWith("column-")) {
      destColumn = overIdStr.replace("column-", "");
      destIndex = boardTasks[destColumn].length;
    } else {
      for (const col of ["todo", "doing", "done"]) {
        const idx = boardTasks[col].findIndex(
          (t) => String(t.id) === overIdStr
        );
        if (idx !== -1) {
          destColumn = col;
          destIndex = idx;
          break;
        }
      }
    }
    if (!destColumn) return;

    if (sourceColumn === destColumn && sourceIndex === destIndex) return;

    markPending(draggedTask.id);
    markRecentOptimistic(draggedTask.id);

    if (sourceColumn === destColumn) {
      recentReorderRef.current.add(activeIdStr);

      setBoardTasks((prev) => {
        const next = { ...prev };
        const list = [...next[sourceColumn]];
        const [removed] = list.splice(sourceIndex, 1);
        list.splice(destIndex, 0, removed);
        next[sourceColumn] = list;
        return next;
      });

      setLoading((prev) => ({ ...prev, [draggedTask.id]: true }));

      try {
        await updateTask(draggedTask.id, { order: destIndex }, token);
        markRecentOptimistic(draggedTask.id);
        setTimeout(() => {
          recentReorderRef.current.delete(activeIdStr);
        }, 5000);
      } catch (error) {
        setBoardTasks((prev) => {
          const next = { ...prev };
          const list = [...next[sourceColumn]];
          const currentIdx = list.findIndex(
            (t) => String(t.id) === activeIdStr
          );
          if (currentIdx !== -1) {
            const [removed] = list.splice(currentIdx, 1);
            list.splice(sourceIndex, 0, removed);
            next[sourceColumn] = list;
          }
          return next;
        });
        toast.error("Không thể sắp xếp lại");
        recentReorderRef.current.delete(activeIdStr);
      } finally {
        unmarkPending(draggedTask.id);
        setLoading((prev) => ({ ...prev, [draggedTask.id]: false }));
      }

      return;
    }

    setLoading((prev) => ({ ...prev, [draggedTask.id]: true }));

    setBoardTasks((prev) => {
      const next = {
        todo: [...prev.todo],
        doing: [...prev.doing],
        done: [...prev.done],
      };
      const [removed] = next[sourceColumn].splice(sourceIndex, 1);
      const updated = { ...removed, status: destColumn };
      next[destColumn].splice(destIndex, 0, updated);
      return next;
    });

    try {
      await updateTask(
        draggedTask.id,
        { status: destColumn, order: destIndex },
        token
      );

      toast.success(
        `Đã chuyển sang ${columns.find((c) => c.id === destColumn)?.title}`
      );
      setOpenColumn(destColumn);
      if (destColumn === "done") {
        setCompletedTaskId(draggedTask.id);
        setShowMoodPicker(true);
      }

      markRecentOptimistic(draggedTask.id);
    } catch (error) {
      setBoardTasks((prev) => {
        const next = {
          todo: [...prev.todo],
          doing: [...prev.doing],
          done: [...prev.done],
        };
        const idx = next[destColumn].findIndex(
          (t) => String(t.id) === activeIdStr
        );
        if (idx !== -1) {
          const [removed] = next[destColumn].splice(idx, 1);
          const reverted = { ...removed, status: sourceColumn };
          next[sourceColumn].splice(sourceIndex, 0, reverted);
        }
        return next;
      });
      toast.error("Không thể cập nhật trạng thái task");
    } finally {
      unmarkPending(draggedTask.id);
      setLoading((prev) => ({ ...prev, [draggedTask.id]: false }));
    }
  };

  // ============================================================
  // ✅ TASK CARD CONTENT — Redesigned
  // ============================================================
  const TaskCardContent = ({ task, isGhost = false }) => {
    const isEditing = editingTask === task.id;
    const isTaskLoading = loading[task.id];
    const isTaskPending = isPending(task.id);
    const isTodo = task.status === "todo";
    const isDoing = task.status === "doing";
    const isDone = task.status === "done";

    return (
      <div
        className={`group relative rounded-lg transition-all duration-200 ${
          isGhost
            ? "bg-white border-2 border-blue-400 shadow-2xl"
            : isTaskPending
            ? "bg-white border border-blue-200 opacity-70 shadow-[0_2px_8px_rgba(59,130,246,0.15)]"
            : "bg-white border border-gray-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-gray-300 hover:-translate-y-0.5"
        }`}
      >
        {!isGhost && <PendingOverlay show={isTaskPending} />}
        {isTaskLoading && !isTaskPending && !isGhost && (
          <div className="absolute right-2 top-2 z-10">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
          </div>
        )}

        <div className="p-3">
          {isEditing ? (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full border border-blue-500 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                placeholder="Tiêu đề task"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                rows="2"
                placeholder="Mô tả task"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">
                    Hạn chót
                  </label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    min={getTodayDate()}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">
                    Ưu tiên
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => saveEdit(task.id)}
                  className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600 transition"
                >
                  Lưu
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <>
              <h4
                className={`font-semibold text-gray-800 mb-1 text-[13px] leading-snug line-clamp-2 pr-6 ${
                  isDone ? "line-through text-gray-400 font-normal" : ""
                }`}
              >
                {task.title}
              </h4>

              {task.description && (
                <p
                  className={`text-[11px] text-gray-500 mb-2 line-clamp-2 leading-relaxed ${
                    isDone ? "text-gray-400" : ""
                  }`}
                >
                  {task.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-1.5">
                {task.assignedTo && (
                  <>
                    {task.assignedTo === currentUserId ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-md font-medium">
                        <IconUser className="w-3 h-3" />
                        Tôi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-violet-50 text-violet-700 border border-violet-100 px-1.5 py-0.5 rounded-md font-medium truncate max-w-[90px]">
                        <IconUser className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {task.assignedByName || "TV"}
                        </span>
                      </span>
                    )}
                  </>
                )}

                {task.userId === currentUserId && !task.assignedTo && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded-md font-medium">
                    <IconUser className="w-3 h-3" />
                    Tôi tạo
                  </span>
                )}

                {getPriorityBadge(task.priority)}

                {task.dueDate && !isDone && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500 font-medium">
                    <IconCalendar className="w-3 h-3" />
                    {new Date(task.dueDate).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                )}

                {getDueDateWarning(task.dueDate, task.status)}
              </div>
            </>
          )}
        </div>

        {/* ACTIONS */}
        {!isEditing && !isGhost && (
          <div className="flex border-t border-gray-100 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150">
            {!isDone && (
              <button
                onClick={() => openEditModal(task)}
                disabled={isTaskPending}
                className="flex-1 py-2 md:py-1.5 text-gray-400 hover:bg-gray-50 hover:text-amber-600 text-xs flex items-center justify-center disabled:opacity-50 transition-colors"
                title="Sửa"
              >
                <IconEdit className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </button>
            )}

            {isTodo && !isDone && boardMembers.length > 0 && (
              <button
                onClick={() => {
                  setSelectedTaskForAssign(task);
                  setShowAssignModal(true);
                }}
                disabled={isTaskPending}
                className="flex-1 py-2 md:py-1.5 text-gray-400 hover:bg-gray-50 hover:text-blue-600 text-xs flex items-center justify-center border-l border-gray-100 disabled:opacity-50 transition-colors"
                title="Giao cho"
              >
                <IconUser className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </button>
            )}

            {!isTodo && !task.isArchived && (
              <button
                onClick={() => handleArchive(task.id)}
                disabled={isTaskPending}
                className="flex-1 py-2 md:py-1.5 text-gray-400 hover:bg-gray-50 hover:text-violet-600 text-xs flex items-center justify-center border-l border-gray-100 disabled:opacity-50 transition-colors"
                title="Lưu trữ"
              >
                <IconArchive className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </button>
            )}

            {!isDoing && (
              <button
                onClick={() => handleSoftDelete(task.id)}
                disabled={isTaskPending}
                className="flex-1 py-2 md:py-1.5 text-gray-400 hover:bg-gray-50 hover:text-red-600 text-xs flex items-center justify-center border-l border-gray-100 disabled:opacity-50 transition-colors"
                title="Xóa"
              >
                <IconTrash className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </button>
            )}

            {isDoing && !isDone && (
              <button
                onClick={() => openTimer(task)}
                disabled={isTaskPending}
                className="flex-1 py-2 md:py-1.5 text-gray-400 hover:bg-gray-50 hover:text-blue-600 text-xs flex items-center justify-center border-l border-gray-100 disabled:opacity-50 transition-colors"
                title="Timer"
              >
                <IconClock className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // DESKTOP COLUMN — Redesigned
  // ============================================================
  const DesktopColumnContent = ({ columnId, tasks }) => {
    const { setNodeRef } = useDroppable({ id: `column-${columnId}` });
    const column = columns.find((c) => c.id === columnId);
    const ColumnIcon = column?.Icon || IconCircle;
    const isCollapsed = collapsed[columnId];

    const scrollRef = useRef(null);

    useLayoutEffect(() => {
      if (!scrollRef.current) return;
      const saved = scrollPositionsRef.current[columnId] || 0;
      if (saved > 0 && Math.abs(scrollRef.current.scrollTop - saved) > 1) {
        scrollRef.current.scrollTop = saved;
      }
    });

    const handleScroll = (e) => {
      scrollPositionsRef.current[columnId] = e.currentTarget.scrollTop;
    };

    if (isCollapsed) {
      return (
        <div
          className={`${column?.color} border border-gray-200/80 rounded-xl h-full w-11 flex flex-col items-center py-3 cursor-pointer transition-all hover:shadow-md hover:border-gray-300 shadow-sm`}
          onClick={() =>
            setCollapsed((prev) => ({ ...prev, [columnId]: false }))
          }
          title="Click để mở rộng"
        >
          <button
            className={`${column?.headerColor} text-white p-2 rounded-lg shadow-sm`}
          >
            <ColumnIcon className="w-4 h-4" />
          </button>
          <span
            className="mt-3 text-xs font-semibold text-gray-600"
            style={{ writingMode: "vertical-rl" }}
          >
            {column?.title} ({tasks.length})
          </span>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200/80 rounded-xl flex flex-col h-full overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {/* HEADER */}
        <div
          className={`${column?.headerColor} text-white px-3 py-2.5 flex justify-between items-center flex-shrink-0`}
        >
          <h3 className="font-semibold text-xs flex items-center gap-2">
            <ColumnIcon className="w-3.5 h-3.5" />
            {column?.title}
            <span className="bg-white/25 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
              {tasks.length}
            </span>
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((prev) => ({ ...prev, [columnId]: true }));
            }}
            className="text-white/70 hover:text-white transition p-0.5 rounded hover:bg-white/15"
            title="Thu gọn cột"
          >
            <IconChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* BODY */}
        <div
          ref={(node) => {
            setNodeRef(node);
            scrollRef.current = node;
          }}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 scrollbar-thin bg-[#fafbfc]"
          style={{ touchAction: "pan-y" }}
        >
          <SortableContext
            items={tasks.map((t) => String(t.id))}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {tasks.map((task) => (
                <SortableTaskCard
                  key={String(task.id)}
                  task={task}
                  isPending={isPending(task.id)}
                >
                  <TaskCardContent task={task} />
                </SortableTaskCard>
              ))}
              {tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-white border-2 border-dashed border-gray-200 flex items-center justify-center mb-3 shadow-sm">
                    <IconPlus className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">
                    Chưa có task nào
                  </p>
                  <p className="text-[10px] text-gray-300 mt-1">
                    Kéo thả task vào đây
                  </p>
                </div>
              )}
            </div>
          </SortableContext>
        </div>

        {/* FOOTER */}
        {columnId === "todo" && (
          <div className="flex-shrink-0 p-2 border-t border-gray-100 bg-white">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("openCreateTaskModal"));
              }}
              className="w-full text-left text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg px-2 py-2 transition flex items-center gap-2 group"
            >
              <div className="w-5 h-5 rounded-md bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
                <IconPlus className="w-3 h-3 text-gray-500 group-hover:text-gray-700" />
              </div>
              <span className="font-medium">Thêm task</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // MOBILE DROPPABLE
  // ============================================================
  const MobileDroppableColumn = ({ columnId, children }) => {
    const { setNodeRef, isOver } = useDroppable({ id: `column-${columnId}` });

    useEffect(() => {
      if (isOver) setDragOverColumnId(columnId);
    }, [isOver, columnId]);

    return (
      <div
        ref={setNodeRef}
        className={`transition-all duration-200 rounded-lg ${
          isOver ? "bg-blue-50 ring-2 ring-blue-400" : ""
        }`}
        style={{ minHeight: "80px", touchAction: "pan-y" }}
      >
        {children}
      </div>
    );
  };

  // ============================================================
  // GHOST CARD
  // ============================================================
  const renderGhostCard = (taskId, isMobileView = false) => {
    let task = null;
    for (const col of ["todo", "doing", "done"]) {
      const found = boardTasks[col].find((t) => String(t.id) === taskId);
      if (found) {
        task = found;
        break;
      }
    }
    if (!task) return null;

    return (
      <div
        className={`rotate-2 scale-105 ${
          isMobileView ? "w-[80vw] max-w-[280px]" : "w-[280px]"
        }`}
        style={{ transformOrigin: "center center" }}
      >
        <TaskCardContent task={task} isGhost={true} />
      </div>
    );
  };

  // ============================================================
  // MOBILE VIEW
  // ============================================================
  if (isMobile) {
    return (
      <>
        <div
          className="space-y-3 pb-20"
          style={{
            touchAction: "pan-y",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full bg-white border border-violet-200 text-violet-700 p-3 rounded-xl flex justify-between items-center text-xs font-medium shadow-sm hover:shadow-md transition-all"
          >
            <span className="inline-flex items-center gap-2">
              <IconPackage className="w-4 h-4" />
              Kho lưu trữ ({archivedTasks.length})
            </span>
            <IconChevronDown
              className={`w-4 h-4 transition-transform ${
                showArchived ? "rotate-180" : ""
              }`}
            />
          </button>

          {showArchived && archivedTasks.length > 0 && (
            <div className="bg-white border border-violet-100 rounded-xl p-2.5 shadow-sm">
              {dedupById(archivedTasks).map((task) => (
                <div
                  key={String(task.id)}
                  className="bg-gray-50 rounded-lg p-2.5 mb-2 last:mb-0 relative"
                >
                  <PendingOverlay show={isPending(task.id)} />
                  <h4 className="font-medium text-gray-800 text-xs">
                    {task.title}
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {task.description || "Không có mô tả"}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    {getPriorityBadge(task.priority)}
                    <button
                      onClick={() => handleRestore(task.id)}
                      disabled={isPending(task.id)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 disabled:opacity-50 inline-flex items-center gap-1 font-medium"
                    >
                      <IconRefresh className="w-3 h-3" />
                      Khôi phục
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {columns.map((column) => {
              const ColumnIcon = column.Icon;
              const shouldShowContent = isDragging || openColumn === column.id;

              return (
                <div
                  key={column.id}
                  className={`bg-white border border-gray-200/80 rounded-xl overflow-hidden mb-3 shadow-sm transition-all duration-200 ${
                    dragOverColumnId === column.id
                      ? "ring-2 ring-blue-400 shadow-lg"
                      : ""
                  }`}
                  style={{ touchAction: "pan-y" }}
                >
                  <button
                    onClick={() => {
                      if (!isDragging) {
                        setOpenColumn(
                          openColumn === column.id ? null : column.id
                        );
                      }
                    }}
                    className={`w-full ${column.headerColor} text-white px-3 py-2.5 flex justify-between items-center`}
                  >
                    <span className="font-semibold text-xs inline-flex items-center gap-2">
                      <ColumnIcon className="w-3.5 h-3.5" />
                      {column.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="bg-white/25 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                        {boardTasks[column.id].length}
                      </span>
                      {!isDragging && (
                        <IconChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            openColumn === column.id ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </div>
                  </button>

                  {shouldShowContent && (
                    <div
                      className="p-2.5 bg-[#fafbfc]"
                      style={{ touchAction: "pan-y" }}
                    >
                      <MobileDroppableColumn columnId={column.id}>
                        <SortableContext
                          items={boardTasks[column.id].map((t) => String(t.id))}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {boardTasks[column.id].length === 0 && (
                              <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-12 h-12 rounded-full bg-white border-2 border-dashed border-gray-200 flex items-center justify-center mb-2">
                                  <IconPlus className="w-5 h-5 text-gray-300" />
                                </div>
                                <p className="text-[11px] text-gray-400">
                                  Chưa có task nào
                                </p>
                              </div>
                            )}
                            {boardTasks[column.id].map((task) => (
                              <SortableTaskCard
                                key={String(task.id)}
                                task={task}
                                isPending={isPending(task.id)}
                              >
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

            <DragOverlay
              dropAnimation={{
                duration: 250,
                easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
              }}
            >
              {activeId ? renderGhostCard(activeId, true) : null}
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

        {showAssignModal && selectedTaskForAssign && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base font-bold text-gray-800 inline-flex items-center gap-2">
                    <IconUser className="w-4 h-4" />
                    Gán task
                  </h2>
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
                  >
                    <IconX className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                  {boardMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() =>
                        handleAssignTask(
                          selectedTaskForAssign.id,
                          member.id,
                          member.name
                        )
                      }
                      disabled={assigning}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 transition flex items-center gap-3 border border-gray-200 text-xs disabled:opacity-50"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-violet-500 rounded-full flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
                        {member.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 truncate">
                          {member.name}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {member.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-xs font-medium hover:bg-gray-200 transition"
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

  // ============================================================
  // DESKTOP VIEW
  // ============================================================
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="mb-3 flex justify-between items-center flex-shrink-0">
        <div className="text-xs text-gray-500 inline-flex items-center gap-1.5 font-medium">
          <IconListChecks className="w-3.5 h-3.5" />
          {boardTasks.todo.length +
            boardTasks.doing.length +
            boardTasks.done.length}{" "}
          task đang hoạt động
        </div>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium shadow-sm ${
            showArchived
              ? "bg-violet-500 text-white shadow-md"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          <IconPackage className="w-3.5 h-3.5" />
          Kho lưu trữ ({archivedTasks.length})
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          className="grid gap-4 flex-1 min-h-0 justify-center"
          style={{
            gridTemplateColumns: columns
              .map((c) => (collapsed[c.id] ? "44px" : "minmax(280px, 340px)"))
              .join(" "),
          }}
        >
          {columns.map((column) => (
            <div key={column.id} className="min-h-0 h-full">
              <DesktopColumnContent
                columnId={column.id}
                tasks={boardTasks[column.id]}
              />
            </div>
          ))}
        </div>

        <DragOverlay
          dropAnimation={{
            duration: 250,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
          }}
        >
          {activeId ? renderGhostCard(activeId, false) : null}
        </DragOverlay>
      </DndContext>

      {showArchived && archivedTasks.length > 0 && (
        <div className="mt-4 flex-shrink-0 max-h-[25vh] overflow-y-auto scrollbar-thin">
          <div className="bg-white border border-violet-100 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-violet-800 mb-3 inline-flex items-center gap-2">
              <IconPackage className="w-4 h-4" />
              Kho lưu trữ ({archivedTasks.length} task)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {dedupById(archivedTasks).map((task) => (
                <div
                  key={String(task.id)}
                  className="bg-gray-50 rounded-lg p-3 relative border border-gray-100"
                >
                  <PendingOverlay show={isPending(task.id)} />
                  <h4 className="font-medium text-gray-800 mb-1 text-xs">
                    {task.title}
                  </h4>
                  <p className="text-[10px] text-gray-500 mb-2 line-clamp-1">
                    {task.description || "Không có mô tả"}
                  </p>
                  <div className="flex justify-between items-center">
                    {getPriorityBadge(task.priority)}
                    <button
                      onClick={() => handleRestore(task.id)}
                      disabled={isPending(task.id)}
                      className="text-gray-400 hover:text-emerald-600 disabled:opacity-50 transition-colors"
                      title="Khôi phục"
                    >
                      <IconRefresh className="w-3.5 h-3.5" />
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

      {showAssignModal && selectedTaskForAssign && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-gray-800 inline-flex items-center gap-2">
                  <IconUser className="w-4 h-4" />
                  Gán task cho thành viên
                </h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 font-medium">
                  Task
                </p>
                <p className="font-medium text-gray-800 text-sm">
                  {selectedTaskForAssign.title}
                </p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                {loadingMembers ? (
                  <p className="text-center text-gray-500 py-4 text-xs">
                    Đang tải...
                  </p>
                ) : boardMembers.length === 0 ? (
                  <p className="text-center text-gray-500 py-4 text-xs">
                    Chưa có thành viên nào
                  </p>
                ) : (
                  boardMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() =>
                        handleAssignTask(
                          selectedTaskForAssign.id,
                          member.id,
                          member.name
                        )
                      }
                      disabled={assigning}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 transition flex items-center gap-3 border border-gray-200 text-xs disabled:opacity-50"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-violet-500 rounded-full flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
                        {member.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 truncate">
                          {member.name}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {member.email}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-xs font-medium hover:bg-gray-200 transition"
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