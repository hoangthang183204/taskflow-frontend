// components/SortableTaskCard.js
"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo } from "react";
import { IconGripVertical } from "./Icons";

function SortableTaskCard({ task, children, isPending = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(task.id),
    data: { type: "task", taskId: task.id, status: task.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    opacity: isDragging ? 0.3 : 1,
    touchAction: "pan-y",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      // ✅ QUAN TRỌNG: data-task-id để hook tìm
      data-task-id={String(task.id)}
      data-task-status={task.status}
      className="sortable-task-card relative group"
      data-dragging={isDragging ? "true" : "false"}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="drag-handle absolute top-1.5 right-1.5 z-30 
          p-1 rounded bg-white/90 border border-gray-200 shadow-sm 
          opacity-30 md:opacity-0 md:group-hover:opacity-100 
          transition-all duration-150 
          cursor-grab active:cursor-grabbing 
          hover:bg-white hover:border-gray-400 hover:shadow touch-none"
        style={{
          touchAction: "none",
          WebkitTapHighlightColor: "transparent",
        }}
        title="Kéo để di chuyển"
        type="button"
      >
        <IconGripVertical className="w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </button>

      {children}
    </div>
  );
}

export default memo(SortableTaskCard, (prev, next) => {
  return (
    prev.task.id === next.task.id &&
    prev.task.status === next.task.status &&
    prev.task.title === next.task.title &&
    prev.task.updatedAt === next.task.updatedAt &&
    prev.isPending === next.isPending
  );
});