// components/NotificationBell.js
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconBell,
  IconBellRing,
  IconAlertOctagon,
  IconAlertCircle,
  IconAlertTriangle,
  IconClock,
  IconCalendar,
  IconCheckCircle,
  IconX,
  IconChevronRight,
} from "./Icons";
import { useNotifications } from "@/hooks/useNotifications";
import { useScrollToTask } from "@/hooks/useScrollToTask";

export default function NotificationBell({
  tasks,
  onOpenTask, // ✅ Callback optional để parent mở EditModal
}) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem("dismissed_notifications");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const dropdownRef = useRef(null);

  // ✅ Hook scroll đến task
  const { scrollToTask } = useScrollToTask();

  // ✅ Hook notifications
  const { notifications: rawNotifications, stats } = useNotifications(tasks);

  const notifications = rawNotifications.filter(
    (n) => !dismissedIds.has(String(n.id))
  );

  // ============================================================
  // DETECT MOBILE
  // ============================================================
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ============================================================
  // LẮNG NGHE EVENT "openNotifications"
  // ============================================================
  useEffect(() => {
    const handleOpen = () => setShowNotifications(true);
    window.addEventListener("openNotifications", handleOpen);
    return () => window.removeEventListener("openNotifications", handleOpen);
  }, []);

  // ============================================================
  // CLICK OUTSIDE → ĐÓNG
  // ============================================================
  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showNotifications]);

  // ============================================================
  // ✅ XỬ LÝ CLICK NOTIFICATION
  // ============================================================
  const handleNotificationClick = (notif) => {
    console.log("🎯 [Notif click]", notif);

    // 1. Đóng dropdown
    setShowNotifications(false);

    // 2. Kiểm tra task có tồn tại không
    const taskExists = tasks.some(
      (t) => String(t.id) === String(notif.taskId)
    );

    if (!taskExists) {
      toast.error("Không tìm thấy task", {
        description: "Task có thể đã bị xóa hoặc chuyển sang board khác",
      });
      return;
    }

    // 3. Kiểm tra task có đang bị ẩn không (filter, archived, trash)
    const task = tasks.find((t) => String(t.id) === String(notif.taskId));

    if (task.isArchived) {
      toast.info("Task đã được lưu trữ", {
        description: "Mở kho lưu trữ để xem task này",
        action: {
          label: "Mở kho",
          onClick: () => {
            // Trigger mở archive panel (nếu có)
            window.dispatchEvent(
              new CustomEvent("openArchivePanel")
            );
          },
        },
      });
      return;
    }

    if (task.isDeleted) {
      toast.info("Task đã bị xóa", {
        description: "Task đang ở trong thùng rác",
      });
      return;
    }

    // 4. Task có đang hiển thị trên board không?
    const visibleEl = document.querySelector(
      `[data-task-id="${notif.taskId}"]`
    );

    if (!visibleEl) {
      // Task bị ẩn do filter hoặc thuộc cột collapsed
      toast.info("Task đang bị ẩn", {
        description: "Có thể do bộ lọc hoặc cột đang thu gọn",
        action: {
          label: "Xóa bộ lọc",
          onClick: () => {
            // Trigger clear filter
            window.dispatchEvent(new CustomEvent("clearFilters"));
          },
        },
      });
      return;
    }

    // 5. ✅ Scroll đến task + highlight
    scrollToTask(notif.taskId, {
      highlightDuration: 2000,
      onNotFound: () => {
        // Fallback: mở EditModal
        if (onOpenTask) {
          onOpenTask(task);
        }
      },
    });

    // 6. ✅ Dismiss notification sau khi click
    handleDismiss(notif.id);
  };

  // ============================================================
  // ✅ XỬ LÝ CLICK ICON "MỞ RỘNG"
  // ============================================================
  const handleOpenTaskDetail = (notif, e) => {
    e.stopPropagation();
    setShowNotifications(false);

    const task = tasks.find((t) => String(t.id) === String(notif.taskId));
    if (!task) {
      toast.error("Không tìm thấy task");
      return;
    }

    // Mở EditModal
    if (onOpenTask) {
      onOpenTask(task);
    } else {
      // Fallback: scroll + highlight
      scrollToTask(notif.taskId);
    }
  };

  // ============================================================
  // DISMISS
  // ============================================================
  const handleDismiss = (id) => {
    setDismissedIds((prev) => {
      const next = new Set(prev).add(String(id));
      try {
        localStorage.setItem(
          "dismissed_notifications",
          JSON.stringify([...next])
        );
      } catch {}
      return next;
    });
  };

  const handleDismissAll = () => {
    const ids = notifications.map((n) => String(n.id));
    setDismissedIds((prev) => {
      const next = new Set([...prev, ...ids]);
      try {
        localStorage.setItem(
          "dismissed_notifications",
          JSON.stringify([...next])
        );
      } catch {}
      return next;
    });
    setShowNotifications(false);
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const getTypeConfig = (type) => {
    switch (type) {
      case "overdue":
        return {
          Icon: IconAlertOctagon,
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
        };
      case "today":
        return {
          Icon: IconAlertCircle,
          color: "text-orange-600",
          bg: "bg-orange-50",
          border: "border-orange-200",
        };
      case "tomorrow":
        return {
          Icon: IconAlertTriangle,
          color: "text-yellow-600",
          bg: "bg-yellow-50",
          border: "border-yellow-200",
        };
      case "soon":
        return {
          Icon: IconClock,
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-200",
        };
      default:
        return {
          Icon: IconAlertCircle,
          color: "text-gray-600",
          bg: "bg-gray-50",
          border: "border-gray-200",
        };
    }
  };

  const getPriorityDot = (priority) => {
    const config = {
      high: "bg-red-500",
      medium: "bg-yellow-500",
      low: "bg-green-500",
    };
    return config[priority] || config.medium;
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // ============================================================
  // BELL BUTTON
  // ============================================================
  const BellButton = () => (
    <button
      onClick={() => setShowNotifications(!showNotifications)}
      className={`relative p-2 rounded-lg transition-colors ${
        showNotifications ? "bg-gray-100" : "hover:bg-gray-100"
      }`}
      title="Thông báo"
      aria-label={`Thông báo${
        notifications.length > 0 ? ` (${notifications.length})` : ""
      }`}
    >
      {notifications.length > 0 ? (
        <IconBellRing className="w-5 h-5 text-gray-700" />
      ) : (
        <IconBell className="w-5 h-5 text-gray-500" />
      )}

      {notifications.length > 0 && (
        <span
          className={`absolute -top-0.5 -right-0.5 flex items-center justify-center 
            min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full ${
              stats.overdue > 0 || stats.today > 0
                ? "bg-red-500"
                : "bg-orange-500"
            }`}
        >
          {notifications.length > 99 ? "99+" : notifications.length}
        </span>
      )}
    </button>
  );

  // ============================================================
  // NOTIFICATION ITEM — CÓ CLICK
  // ============================================================
  const NotificationItem = ({ notif }) => {
    const config = getTypeConfig(notif.type);
    const TypeIcon = config.Icon;
    const isUrgent = notif.type === "overdue" || notif.type === "today";

    return (
      <div
        onClick={() => handleNotificationClick(notif)}
        className={`group p-3 hover:bg-gray-50 transition-colors relative cursor-pointer ${
          isUrgent ? "bg-red-50/30" : ""
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleNotificationClick(notif);
          }
        }}
        title="Click để xem task"
      >
        <div className="flex items-start gap-2.5">
          {/* Icon */}
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}
          >
            <TypeIcon className={`w-4 h-4 ${config.color}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-xs text-gray-800 line-clamp-1 leading-snug">
                {notif.title}
              </h4>

              {/* ✅ Actions: Mở rộng + Dismiss */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={(e) => handleOpenTaskDetail(notif, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity 
                    p-1 rounded hover:bg-blue-100"
                  title="Mở chi tiết task"
                >
                  <IconChevronRight className="w-3 h-3 text-blue-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss(notif.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity 
                    p-1 rounded hover:bg-gray-200"
                  title="Bỏ qua"
                >
                  <IconX className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>

            {notif.description && (
              <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                {notif.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-[10px] font-medium ${config.color}`}>
                {notif.message}
              </span>

              <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${getPriorityDot(
                    notif.priority
                  )}`}
                />
                {notif.priority === "high"
                  ? "Cao"
                  : notif.priority === "medium"
                  ? "Trung"
                  : "Thấp"}
              </span>

              <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400">
                <IconCalendar className="w-2.5 h-2.5" />
                {formatDate(notif.dueDate)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // DROPDOWN CONTENT
  // ============================================================
  const DropdownContent = () => (
    <>
      <div className="px-3 py-2.5 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-gray-800">Thông báo</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {notifications.length > 0
                ? `${notifications.length} task cần chú ý`
                : "Không có thông báo mới"}
            </p>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={handleDismissAll}
              className="text-[10px] text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {stats.overdue > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-medium">
                <IconAlertOctagon className="w-2.5 h-2.5" />
                {stats.overdue} quá hạn
              </span>
            )}
            {stats.today > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                <IconAlertCircle className="w-2.5 h-2.5" />
                {stats.today} hôm nay
              </span>
            )}
            {stats.soon > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                <IconClock className="w-2.5 h-2.5" />
                {stats.soon} sắp tới
              </span>
            )}
          </div>
        )}
      </div>

      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto scrollbar-thin">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-2">
              <IconCheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">Tuyệt vời!</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Không có task nào sắp đến hạn
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <NotificationItem key={notif.id} notif={notif} />
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
          <p className="text-[10px] text-gray-400 text-center">
            Click vào task để đến vị trí trên board
          </p>
        </div>
      )}
    </>
  );

  // ============================================================
  // MOBILE VIEW
  // ============================================================
  if (isMobile) {
    return (
      <div className="relative inline-block">
        <BellButton />

        {showNotifications && (
          <div
            ref={dropdownRef}
            className="fixed left-1/2 top-16 z-[9999] -translate-x-1/2 
              w-[calc(100vw-24px)] max-w-sm 
              bg-white rounded-xl shadow-2xl border border-gray-200 
              overflow-hidden"
          >
            <DropdownContent />
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // DESKTOP VIEW
  // ============================================================
  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <BellButton />

      {showNotifications && (
        <div
          className="absolute right-0 mt-2 w-80 
            bg-white rounded-xl shadow-2xl border border-gray-200 
            overflow-hidden z-[9999]"
        >
          <DropdownContent />
        </div>
      )}
    </div>
  );
}