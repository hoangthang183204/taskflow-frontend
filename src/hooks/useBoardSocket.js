// src/hooks/useBoardSocket.js
"use client";
import { useEffect, useRef } from "react";

let globalSocket = null;
let globalSocketConfig = { boardId: null, token: null };

export default function useBoardSocket({
  boardId,
  token,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onTaskRestored,
  onTaskArchived,
}) {
  const callbacksRef = useRef({
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
    onTaskRestored,
    onTaskArchived,
  });

  // ✅ Update callbacks — không reconnect
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
    if (!boardId || !token) {
      console.warn("⚠️  [Socket] Missing boardId or token — skip");
      return;
    }

    let cancelled = false;

    const connect = async () => {
      // ✅ Reuse
      if (
        globalSocket &&
        globalSocketConfig.boardId === boardId &&
        globalSocketConfig.token === token
      ) {
        console.log("♻️  [Socket] Reusing:", globalSocket.id);
        return;
      }

      // ✅ Cleanup cũ
      if (globalSocket) {
        globalSocket.removeAllListeners();
        globalSocket.disconnect();
        globalSocket = null;
      }

      const { io } = await import("socket.io-client");
      if (cancelled) return;

      const SOCKET_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

      console.log("🔌 [Socket] Connecting to:", SOCKET_URL);
      console.log("   token:", token ? `${token.slice(0, 20)}...` : "❌");
      console.log("   boardId:", boardId);

      const socket = io(SOCKET_URL, {
        transports: ["polling", "websocket"],
        query: { token, boardId }, // ✅ Gửi token qua query
        auth: { token, boardId }, // ✅ Fallback auth
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false,
        withCredentials: false,
      });

      globalSocket = socket;
      globalSocketConfig = { boardId, token };

      // ============================================================
      // CONNECT
      // ============================================================
      let errorLogged = false;

      socket.on("connect", () => {
        console.log("✅ [Socket] Connected:", socket.id);
        console.log("   Transport:", socket.io.engine.transport.name);
        errorLogged = false;

        // ✅ Emit join:board để chắc chắn
        socket.emit("join:board", { boardId }, (res) => {
          if (res?.success) {
            console.log("✅ [Socket] Confirmed joined board:", boardId);
          }
        });
      });

      socket.io.engine.on("upgrade", (transport) => {
        console.log("⬆️  [Socket] Upgraded to:", transport.name);
      });

      socket.on("joined", ({ boardId: bid }) => {
        console.log("✅ [Socket] Server confirmed joined:", bid);
      });

      socket.on("connect_error", (err) => {
        if (errorLogged) return;
        errorLogged = true;
        console.warn("⚠️  [Socket] Error:", err.message);
      });

      socket.on("disconnect", (reason) => {
        console.log("🔌 [Socket] Disconnected:", reason);
      });

      socket.on("reconnect", (attempt) => {
        console.log(`♻️  [Socket] Reconnected (attempt ${attempt})`);
        // ✅ Re-join room sau reconnect
        socket.emit("join:board", { boardId });
      });

      // ============================================================
      // TASK EVENTS
      // ============================================================
      socket.on("task:created", (task) => {
        console.log("📥 [Socket] task:created", task.id);
        callbacksRef.current.onTaskCreated?.(task);
      });

      socket.on("task:updated", (task) => {
        console.log("📥 [Socket] task:updated", task.id);
        callbacksRef.current.onTaskUpdated?.(task);
      });

      socket.on("task:deleted", ({ id }) => {
        console.log("📥 [Socket] task:deleted", id);
        callbacksRef.current.onTaskDeleted?.(id);
      });

      socket.on("task:restored", (task) => {
        console.log("📥 [Socket] task:restored", task.id);
        callbacksRef.current.onTaskRestored?.(task);
      });

      socket.on("task:archived", (task) => {
        console.log("📥 [Socket] task:archived", task.id);
        callbacksRef.current.onTaskArchived?.(task);
      });
    };

    connect();

    return () => {
      cancelled = true;
      // ✅ Không disconnect — giữ socket cho component khác
    };
  }, [boardId, token]);
}