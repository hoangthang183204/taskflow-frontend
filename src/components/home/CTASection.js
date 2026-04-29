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
    if (isLoggedIn) {
      router.push("/task");
    } else {
      router.push("/login");
    }
  };

  return (
    <div id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white transform hover:scale-105 transition-all duration-300 shadow-xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Sẵn sàng quản lý công việc của bạn?
        </h2>
        <p className="text-lg mb-6 opacity-90">
          Hàng ngàn người dùng đã tin tưởng TaskFlow
        </p>
        <button
          onClick={handleGetStarted}
          className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg transform hover:scale-105"
        >
          Bắt đầu miễn phí
        </button>
      </div>
    </div>
  );
}