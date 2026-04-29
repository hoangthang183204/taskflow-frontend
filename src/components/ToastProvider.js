// components/ToastProvider.js
"use client";

import { Toaster } from "sonner";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      expand={false}
      duration={3000}
      toastOptions={{
        style: {
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "12px 16px",
        },
        success: {
          style: {
            borderLeft: "4px solid #22c55e",
          },
        },
        error: {
          style: {
            borderLeft: "4px solid #ef4444",
          },
        },
        warning: {
          style: {
            borderLeft: "4px solid #f59e0b",
          },
        },
        info: {
          style: {
            borderLeft: "4px solid #3b82f6",
          },
        },
      }}
    />
  );
}