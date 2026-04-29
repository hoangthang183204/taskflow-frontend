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
    if (isLoggedIn) {
      router.push("/task");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Quản lý công việc{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            đơn giản & hiệu quả
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          TaskFlow giúp bạn tổ chức công việc, theo dõi tiến độ và đạt được mục tiêu
          một cách dễ dàng hơn bao giờ hết.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={handleGetStarted}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg transform hover:scale-105"
          >
            {isLoggedIn ? "Đến Dashboard" : "Bắt đầu ngay"}
          </button>
          <a
            href="#features"
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition transform hover:scale-105"
          >
            Tìm hiểu thêm
          </a>
        </div>
      </div>
    </div>
  );
}