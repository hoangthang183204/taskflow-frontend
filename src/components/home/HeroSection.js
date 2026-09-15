"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HeroSection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleGetStarted = () => {
    router.push(isLoggedIn ? "/board" : "/login");
  };

  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-gray-700">
              Đang hoạt động · 1000+ người dùng
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6 leading-[1.1]">
            Quản lý công việc{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              đơn giản & hiệu quả
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            TaskFlow giúp bạn tổ chức công việc, theo dõi tiến độ và đạt
            được mục tiêu — một cách dễ dàng hơn bao giờ hết.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-6 py-3.5 bg-gray-900 text-white rounded-xl text-base font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {isLoggedIn ? "Đến Boards" : "Bắt đầu miễn phí"}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto px-6 py-3.5 bg-white text-gray-700 border border-gray-200 rounded-xl text-base font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Xem demo
            </a>
          </div>

          {/* Mockup */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl rounded-3xl" />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-3 py-1 bg-white rounded-md text-[10px] text-gray-500 border border-gray-200">
                    taskflow.app/board
                  </div>
                </div>
              </div>

              {/* Kanban mockup */}
              <div className="p-4 sm:p-6 bg-gray-50 grid grid-cols-3 gap-3">
                {/* To Do */}
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-5 h-5 rounded bg-gray-400" />
                    <span className="text-xs font-semibold text-gray-700">
                      To Do
                    </span>
                    <span className="ml-auto text-[10px] bg-gray-100 text-gray-600 px-1.5 rounded-full">
                      3
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-gray-50 rounded-md p-2 border border-gray-100"
                      >
                        <div className="h-2 bg-gray-200 rounded mb-1.5" />
                        <div className="h-2 bg-gray-200 rounded w-2/3" />
                        <div className="flex gap-1 mt-2">
                          <div className="h-3 w-8 bg-yellow-100 rounded" />
                          <div className="h-3 w-6 bg-gray-100 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Doing */}
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-5 h-5 rounded bg-yellow-400" />
                    <span className="text-xs font-semibold text-gray-700">
                      Doing
                    </span>
                    <span className="ml-auto text-[10px] bg-yellow-100 text-yellow-700 px-1.5 rounded-full">
                      2
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="bg-yellow-50/50 rounded-md p-2 border border-yellow-100"
                      >
                        <div className="h-2 bg-gray-200 rounded mb-1.5" />
                        <div className="h-2 bg-gray-200 rounded w-3/4" />
                        <div className="flex gap-1 mt-2">
                          <div className="h-3 w-8 bg-red-100 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Done */}
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-5 h-5 rounded bg-green-500" />
                    <span className="text-xs font-semibold text-gray-700">
                      Done
                    </span>
                    <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-1.5 rounded-full">
                      4
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="bg-green-50/50 rounded-md p-2 border border-green-100 opacity-60"
                      >
                        <div className="h-2 bg-gray-300 rounded mb-1.5 line-through" />
                        <div className="h-2 bg-gray-300 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}