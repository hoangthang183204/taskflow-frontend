const features = [
  {
    id: 1,
    title: "Quản lý task thông minh",
    description:
      "Tạo, chỉnh sửa và sắp xếp công việc với giao diện kéo thả trực quan như Trello.",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
    color: "blue",
  },
  {
    id: 2,
    title: "Theo dõi tiến độ",
    description:
      "Cập nhật trạng thái To Do, Doing, Done theo thời gian thực cùng báo cáo thống kê.",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    color: "purple",
  },
  {
    id: 3,
    title: "Ưu tiên thông minh",
    description:
      "Phân loại công việc theo mức độ ưu tiên để bạn luôn tập trung vào việc quan trọng.",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
        />
      </svg>
    ),
    color: "green",
  },
  {
    id: 4,
    title: "Cộng tác nhóm",
    description:
      "Mời thành viên, giao task và cùng làm việc trong một không gian chung.",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
    color: "orange",
  },
  {
    id: 5,
    title: "Pomodoro Timer",
    description:
      "Tập trung làm việc theo phương pháp Pomodoro với timer tích hợp sẵn.",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    color: "red",
  },
  {
    id: 6,
    title: "Thông báo thông minh",
    description:
      "Nhận nhắc nhở khi task sắp đến hạn, không bao giờ bỏ lỡ deadline quan trọng.",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
    color: "yellow",
  },
];

const colorConfig = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
    hover: "group-hover:bg-blue-100",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
    hover: "group-hover:bg-purple-100",
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-100",
    hover: "group-hover:bg-green-100",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-100",
    hover: "group-hover:bg-orange-100",
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-100",
    hover: "group-hover:bg-red-100",
  },
  yellow: {
    bg: "bg-yellow-50",
    text: "text-yellow-600",
    border: "border-yellow-100",
    hover: "group-hover:bg-yellow-100",
  },
};

function FeatureCard({ feature }) {
  const config = colorConfig[feature.color];

  return (
    <div className="group relative bg-white p-6 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div
        className={`w-11 h-11 ${config.bg} ${config.text} rounded-xl flex items-center justify-center mb-4 ${config.hover} transition-colors`}
      >
        {feature.icon}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">
        {feature.title}
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28"
    >
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-4">
          <span className="text-xs font-medium text-blue-700">TÍNH NĂNG</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
          Mọi thứ bạn cần để{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            làm việc hiệu quả
          </span>
        </h2>
        <p className="text-base sm:text-lg text-gray-600">
          Được thiết kế cho cá nhân và đội nhóm — đơn giản, mạnh mẽ, dễ sử dụng.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
      </div>
    </section>
  );
}