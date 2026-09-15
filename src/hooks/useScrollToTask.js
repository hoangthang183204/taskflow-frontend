// src/hooks/useScrollToTask.js
"use client";
import { useCallback } from "react";
import { toast } from "sonner";

/**
 * Hook scroll đến task trong board
 */
export function useScrollToTask({ onExpandColumn } = {}) {
  const scrollToTask = useCallback(
    (taskId, options = {}) => {
      if (!taskId) return false;

      const { delay = 100, highlightDuration = 2000, onNotFound } = options;

      setTimeout(() => {
        const el = document.querySelector(`[data-task-id="${taskId}"]`);

        if (!el) {
          if (onExpandColumn) {
            onExpandColumn(taskId);
            setTimeout(() => {
              const retryEl = document.querySelector(
                `[data-task-id="${taskId}"]`
              );
              if (retryEl) {
                doScroll(retryEl, highlightDuration);
              } else {
                handleNotFound(taskId, onNotFound);
              }
            }, 300);
          } else {
            handleNotFound(taskId, onNotFound);
          }
          return;
        }

        doScroll(el, highlightDuration);
      }, delay);

      return true;
    },
    [onExpandColumn]
  );

  return { scrollToTask };
}

function doScroll(el, highlightDuration) {
  el.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest",
  });

  el.classList.add("task-highlighted");

  const ring = document.createElement("div");
  ring.className = "task-highlight-ring";
  el.style.position = "relative";
  el.appendChild(ring);

  setTimeout(() => {
    el.classList.remove("task-highlighted");
    ring.remove();
  }, highlightDuration);
}

function handleNotFound(taskId, onNotFound) {
  if (onNotFound) {
    onNotFound(taskId);
  } else {
    toast.error("Không tìm thấy task trong board này", {
      description: "Task có thể đã bị xóa hoặc ở board khác",
    });
  }
}

export default useScrollToTask;