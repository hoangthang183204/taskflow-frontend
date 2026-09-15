// src/hooks/useBoardSocket.js
"use client";
import { useEffect, useRef } from "react";

export default function useBoardSocket({
  boardId,
  token,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onTaskRestored,
  onTaskArchived,
}) {
  const socketRef = useRef(null);
  const callbacksRef = useRef({
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
    onTaskRestored,
    onTaskArchived,
  });

  useEffect(() => {
    callbacksRef.current = {
      onTaskCreated,
      onTaskUpdated,
      onTaskDeleted,
      onTaskRestored,
      onTaskArchived,
    };
  }, [
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
    onTaskRestored,
    onTaskArchived,
  ]);

  useEffect(() => {
    if (!boardId || !token) return;

    let cancelled = false;

    const connect = async () => {
      const { io } = await import("socket.io-client");
      if (cancelled) return;

      const socket = io(
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337",
        {
          transports: ["websocket"],
          query: { token, boardId },
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
        },
      );

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("✅ Socket connected:", socket.id);
      });

      socket.on("connect_error", (err) => {
        console.error("❌ Socket error:", err.message);
      });

      socket.on("task:created", (task) => {
        console.log("📥 task:created received:", task);
        callbacksRef.current.onTaskCreated?.(task);
      });

      socket.on("task:updated", (task) => {
        console.log("📥 task:updated received:", task);
        callbacksRef.current.onTaskUpdated?.(task);
      });

      socket.on("task:deleted", ({ id }) => {
        console.log("📥 task:deleted received:", id);
        callbacksRef.current.onTaskDeleted?.(id);
      });

      socket.on("task:restored", (task) => {
        console.log("📥 task:restored received:", task);
        callbacksRef.current.onTaskRestored?.(task);
      });

      socket.on("task:archived", (task) => {
        console.log("📥 task:archived received:", task);
        callbacksRef.current.onTaskArchived?.(task);
      });
    };

    connect();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [boardId, token]);
}