"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  
  const { isAuthenticated, token, logout } = useAuthStore();
  const isLoggedIn = isAuthenticated && !!token;

  const handleDashboard = () => {
    router.push("/board");  // ✅ SỬA: /task -> /board
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
      logout();
      router.push("/");
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TaskFlow
              </div>
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex space-x-8">
                <a href="#features" className="text-gray-700 hover:text-blue-600 transition">Tính năng</a>
                <a href="#about" className="text-gray-700 hover:text-blue-600 transition">Giới thiệu</a>
                <a href="#contact" className="text-gray-700 hover:text-blue-600 transition">Liên hệ</a>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <button
                  onClick={handleDashboard}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
                >
                  Boards  {/* ✅ SỬA: Dashboard -> Boards */}
                </button>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-blue-600 px-4 py-2 transition">
                  Đăng nhập
                </Link>
                <Link href="/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition shadow-md">
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              <a href="#features" className="text-gray-700 hover:text-blue-600 px-4 py-2">Tính năng</a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 px-4 py-2">Giới thiệu</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 px-4 py-2">Liên hệ</a>
              <div className="pt-2 border-t border-gray-200">
                {isLoggedIn ? (
                  <div className="flex flex-col gap-2">
                    <button onClick={handleDashboard} className="w-full bg-blue-600 text-white px-5 py-2 rounded-lg">
                      Boards
                    </button>
                    <button onClick={handleLogout} className="w-full text-red-600 border border-red-600 px-5 py-2 rounded-lg">
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Link href="/login" className="flex-1 text-center text-gray-700 border border-gray-300 px-4 py-2 rounded-lg">
                      Đăng nhập
                    </Link>
                    <Link href="/register" className="flex-1 text-center bg-blue-600 text-white px-4 py-2 rounded-lg">
                      Đăng ký
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}