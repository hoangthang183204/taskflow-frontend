// src/hooks/useNotifications.js
"use client";
import { useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "notification_last_shown";
const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 giờ

/**
 * Hook xử lý notifications cho task
 */
export function useNotifications(tasks) {
  const hasShownToastRef = useRef(false);

  // ============================================================
  // TÍNH NOTIFICATIONS
  // ============================================================
  const notifications = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const list = [];

    for (const task of tasks) {
      if (!task.dueDate || task.status === "done" || task.isArchived)
        continue;

      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const daysLeft = Math.round(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      let type = null;
      let message = "";
      let severity = 0;

      if (daysLeft < 0) {
        type = "overdue";
        severity = 4;
        message = `Quá hạn ${Math.abs(daysLeft)} ngày`;
      } else if (daysLeft === 0) {
        type = "today";
        severity = 3;
        message = "Hết hạn hôm nay";
      } else if (daysLeft === 1) {
        type = "tomorrow";
        severity = 2;
        message = "Hết hạn vào ngày mai";
      } else if (daysLeft <= 2) {
        type = "soon";
        severity = 1;
        message = `Còn ${daysLeft} ngày`;
      } else {
        continue;
      }

      list.push({
        id: task.id,
        taskId: task.id,
        title: task.title,
        description: task.description,
        message,
        dueDate: task.dueDate,
        priority: task.priority || "medium",
        status: task.status,
        type,
        severity,
        daysLeft,
      });
    }

    // SORT: severity → priority → dueDate
    const priorityWeight = { high: 3, medium: 2, low: 1 };

    list.sort((a, b) => {
      if (a.severity !== b.severity) return b.severity - a.severity;

      const aP = priorityWeight[a.priority] || 0;
      const bP = priorityWeight[b.priority] || 0;
      if (aP !== bP) return bP - aP;

      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    return list;
  }, [tasks]);

  // ============================================================
  // STATS
  // ============================================================
  const stats = useMemo(() => {
    return {
      total: notifications.length,
      overdue: notifications.filter((n) => n.type === "overdue").length,
      today: notifications.filter((n) => n.type === "today").length,
      soon: notifications.filter(
        (n) => n.type === "tomorrow" || n.type === "soon"
      ).length,
    };
  }, [notifications]);

  // ============================================================
  // TOAST (cooldown 4h)
  // ============================================================
  useEffect(() => {
    if (hasShownToastRef.current) return;
    if (notifications.length === 0) return;

    const lastShown = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();
    if (lastShown && now - Number(lastShown) < COOLDOWN_MS) {
      return;
    }

    const urgent = notifications.filter(
      (n) => n.type === "overdue" || n.type === "today"
    );
    if (urgent.length === 0) return;

    hasShownToastRef.current = true;

    const timer = setTimeout(() => {
      toast.warning(`Bạn có ${urgent.length} task cần xử lý ngay`, {
        duration: 6000,
        position: "top-center",
        description: "Mở chuông thông báo để xem chi tiết",
        action: {
          label: "Xem",
          onClick: () => {
            window.dispatchEvent(new CustomEvent("openNotifications"));
          },
        },
      });
      localStorage.setItem(STORAGE_KEY, String(now));
    }, 1000);

    return () => clearTimeout(timer);
  }, [notifications]);

  return { notifications, stats };
}

export default useNotifications;