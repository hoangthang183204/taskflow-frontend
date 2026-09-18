// components/DashboardStats.js
"use client";
import { useState, useEffect } from "react";
import MoodStats from "./MoodStats";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

// ============================================================
// COLORS
// ============================================================
const STATUS_COLORS = ["#94a3b8", "#f59e0b", "#10b981"];
const PRIORITY_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

// ============================================================
// CUSTOM TOOLTIP
// ============================================================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
      {label && (
        <p className="text-xs font-semibold text-gray-900 mb-1">{label}</p>
      )}
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color || entry.fill }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-semibold text-gray-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// SUMMARY CARD
// ============================================================
function SummaryCard({ label, value, subValue, icon, color }) {
  const colorConfig = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      iconBg: "bg-blue-100",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      iconBg: "bg-emerald-100",
    },
    red: {
      bg: "bg-red-50",
      text: "text-red-600",
      iconBg: "bg-red-100",
    },
    violet: {
      bg: "bg-violet-50",
      text: "text-violet-600",
      iconBg: "bg-violet-100",
    },
  };

  const c = colorConfig[color] || colorConfig.blue;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-md hover:border-gray-300 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 ${c.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}
        >
          {icon}
        </div>
      </div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
      {subValue && (
        <p className={`text-xs font-medium ${c.text} mt-1`}>{subValue}</p>
      )}
    </div>
  );
}

// ============================================================
// CHART CARD
// ============================================================
function ChartCard({ title, accentColor, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: accentColor }}
        />
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================
export default function DashboardStats({ tasks }) {
  const [stats, setStats] = useState({
    statusData: [],
    priorityData: [],
    weeklyData: [],
    monthlyData: [],
    completionRate: 0,
    overdueCount: 0,
    totalTasks: 0,
  });

  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    // 1. Status count
    const statusCount = {
      todo: tasks.filter((t) => t.status === "todo").length,
      doing: tasks.filter((t) => t.status === "doing").length,
      done: tasks.filter((t) => t.status === "done").length,
    };
    const statusData = [
      { name: "To Do", value: statusCount.todo },
      { name: "Doing", value: statusCount.doing },
      { name: "Done", value: statusCount.done },
    ];

    // 2. Priority count
    const priorityCount = {
      low: tasks.filter((t) => t.priority === "low").length,
      medium: tasks.filter((t) => t.priority === "medium").length,
      high: tasks.filter((t) => t.priority === "high").length,
    };
    const priorityData = [
      { name: "Thấp", value: priorityCount.low },
      { name: "Trung bình", value: priorityCount.medium },
      { name: "Cao", value: priorityCount.high },
    ];

    // 3. Weekly
    const weeklyStats = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("vi-VN", { weekday: "short" });
      weeklyStats[dateStr] = { completed: 0, created: 0 };
    }

    tasks.forEach((task) => {
      const createdDate = new Date(task.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 6) {
        const dateStr = createdDate.toLocaleDateString("vi-VN", {
          weekday: "short",
        });
        if (weeklyStats[dateStr]) {
          weeklyStats[dateStr].created++;
          if (task.status === "done") weeklyStats[dateStr].completed++;
        }
      }
    });

    const weeklyData = Object.entries(weeklyStats).map(([day, data]) => ({
      day,
      "Tạo mới": data.created,
      "Hoàn thành": data.completed,
    }));

    // 4. Monthly
    const monthlyStats = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString("vi-VN", { month: "short" });
      monthlyStats[monthStr] = { completed: 0, created: 0 };
    }

    tasks.forEach((task) => {
      const createdDate = new Date(task.createdAt);
      const now = new Date();
      const monthDiff =
        (now.getFullYear() - createdDate.getFullYear()) * 12 +
        (now.getMonth() - createdDate.getMonth());
      if (monthDiff <= 5) {
        const monthStr = createdDate.toLocaleDateString("vi-VN", {
          month: "short",
        });
        if (monthlyStats[monthStr]) {
          monthlyStats[monthStr].created++;
          if (task.status === "done") monthlyStats[monthStr].completed++;
        }
      }
    });

    const monthlyData = Object.entries(monthlyStats).map(([month, data]) => ({
      month,
      "Tạo mới": data.created,
      "Hoàn thành": data.completed,
    }));

    // 5. Rate + Overdue
    const completionRate =
      statusCount.done === 0
        ? 0
        : Math.round((statusCount.done / tasks.length) * 100);

    const overdueCount = tasks.filter((t) => {
      if (!t.dueDate || t.status === "done") return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    setStats({
      statusData,
      priorityData,
      weeklyData,
      monthlyData,
      completionRate,
      overdueCount,
      totalTasks: tasks.length,
    });
  }, [tasks]);

  // ============================================================
  // EMPTY STATE
  // ============================================================
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-20 h-20 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
          <svg
            className="w-10 h-10 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Chưa có dữ liệu thống kê
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Tạo task đầu tiên để xem báo cáo và phân tích hiệu suất
        </p>
      </div>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-5 pb-8">
      {/* ===== Summary Cards ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard
          label="Tổng tasks"
          value={stats.totalTasks}
          color="blue"
          icon={
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
        />
        <SummaryCard
          label="Hoàn thành"
          value={
            stats.statusData.find((s) => s.name === "Done")?.value || 0
          }
          subValue={`${stats.completionRate}% hoàn thành`}
          color="emerald"
          icon={
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <SummaryCard
          label="Quá hạn"
          value={stats.overdueCount}
          subValue={stats.overdueCount > 0 ? "Cần xử lý" : "Đúng tiến độ"}
          color="red"
          icon={
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          }
        />
        <SummaryCard
          label="Đang làm"
          value={
            stats.statusData.find((s) => s.name === "Doing")?.value || 0
          }
          color="violet"
          icon={
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600"
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
          }
        />
      </div>

      {/* ===== Charts Grid ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Pie Chart — Status */}
        <ChartCard title="Phân bố theo trạng thái" accentColor="#3b82f6">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stats.statusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
                style={{ fontSize: 11, fontWeight: 500 }}
              >
                {stats.statusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pie Chart — Priority */}
        <ChartCard title="Phân bố theo độ ưu tiên" accentColor="#f59e0b">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stats.priorityData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
                style={{ fontSize: 11, fontWeight: 500 }}
              >
                {stats.priorityData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bar Chart — Weekly */}
        <ChartCard title="Hoạt động trong tuần" accentColor="#10b981">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={stats.weeklyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar
                dataKey="Tạo mới"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="Hoàn thành"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Line Chart — Monthly */}
        <ChartCard title="Xu hướng hàng tháng" accentColor="#8b5cf6">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={stats.monthlyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="Tạo mới"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="Hoàn thành"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ===== Progress Bar ===== */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
          <h3 className="text-sm font-semibold text-gray-900">
            Tiến độ tổng thể
          </h3>
        </div>

        <div className="space-y-4">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-500 font-medium">Hoàn thành</span>
              <span className="font-bold text-emerald-600">
                {stats.completionRate}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-green-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>

          {/* Stats breakdown */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center p-3 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1">Chưa làm</p>
              <p className="text-lg font-bold text-gray-700">
                {stats.statusData.find((s) => s.name === "To Do")?.value || 0}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-100">
              <p className="text-xs text-amber-600 font-medium mb-1">
                Đang làm
              </p>
              <p className="text-lg font-bold text-amber-600">
                {stats.statusData.find((s) => s.name === "Doing")?.value || 0}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
              <p className="text-xs text-emerald-600 font-medium mb-1">
                Đã xong
              </p>
              <p className="text-lg font-bold text-emerald-600">
                {stats.statusData.find((s) => s.name === "Done")?.value || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Mood Stats ===== */}
      <MoodStats tasks={tasks} />
    </div>
  );
}