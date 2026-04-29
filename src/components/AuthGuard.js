// components/AuthGuard.js
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const { isAuthenticated, token, isLoading } = useAuthStore();

  useEffect(() => {
    // Chỉ kiểm tra sau khi hydrate (tránh lỗi SSR)
    if (!isLoading && !isAuthenticated && !token) {
      router.push("/login");
    }
  }, [isAuthenticated, token, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  if (!isAuthenticated && !token) {
    return null;
  }

  return <>{children}</>;
}