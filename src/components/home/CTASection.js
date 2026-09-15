"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CTASection() {
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
    <section
      id="about"
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28"
    >
      <div className="relative bg-gray-900 rounded-3xl overflow-hidden">
        {/* Grid pattern background */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Gradient blobs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />

        <div className="relative px-6 py-16 sm:px-12 sm:py-20 lg:px-20 lg:py-24 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Sẵn sàng quản lý công việc{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              hiệu quả hơn?
            </span>
          </h2>
          <p className="text-base sm:text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            Tham gia cùng hàng ngàn người dùng đã tin tưởng TaskFlow để tổ chức
            công việc mỗi ngày.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 rounded-xl text-base font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
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
              className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white border border-white/20 rounded-xl text-base font-semibold hover:bg-white/20 backdrop-blur-sm transition-all flex items-center justify-center gap-2"
            >
              Tìm hiểu thêm
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
            {[
              "Miễn phí mãi mãi",
              "Không cần thẻ tín dụng",
              "Hủy bất cứ lúc nào",
            ].map((text) => (
              <div
                key={text}
                className="flex items-center gap-2 text-sm text-gray-400"
              >
                <svg
                  className="w-4 h-4 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}