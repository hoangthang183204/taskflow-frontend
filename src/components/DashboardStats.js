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
  AreaChart,
  Area,
} from "recharts";

// Màu sắc cho các biểu đồ
const COLORS = {
  todo: "#9ca3af", // gray
  doing: "#f59e0b", // yellow
  done: "#10b981", // green
  low: "#22c55e",
  medium: "#eab308",
  high: "#ef4444",
};

const STATUS_COLORS = ["#9ca3af", "#f59e0b", "#10b981"];
const PRIORITY_COLORS = ["#22c55e", "#eab308", "#ef4444"];

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

    // 1. Thống kê theo status
    const statusCount = {
      todo: tasks.filter((t) => t.status === "todo").length,
      doing: tasks.filter((t) => t.status === "doing").length,
      done: tasks.filter((t) => t.status === "done").length,
    };
    const statusData = [
      { name: "To Do", value: statusCount.todo, color: COLORS.todo },
      { name: "Doing", value: statusCount.doing, color: COLORS.doing },
      { name: "Done", value: statusCount.done, color: COLORS.done },
    ];

    // 2. Thống kê theo priority
    const priorityCount = {
      low: tasks.filter((t) => t.priority === "low").length,
      medium: tasks.filter((t) => t.priority === "medium").length,
      high: tasks.filter((t) => t.priority === "high").length,
    };
    const priorityData = [
      { name: "Thấp", value: priorityCount.low, color: COLORS.low },
      { name: "Trung bình", value: priorityCount.medium, color: COLORS.medium },
      { name: "Cao", value: priorityCount.high, color: COLORS.high },
    ];

    // 3. Thống kê theo tuần (7 ngày gần nhất)
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
          if (task.status === "done") {
            weeklyStats[dateStr].completed++;
          }
        }
      }
    });

    const weeklyData = Object.entries(weeklyStats).map(([day, data]) => ({
      day,
      "Tạo mới": data.created,
      "Hoàn thành": data.completed,
    }));

    // 4. Thống kê theo tháng (6 tháng gần nhất)
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
          if (task.status === "done") {
            monthlyStats[monthStr].completed++;
          }
        }
      }
    });

    const monthlyData = Object.entries(monthlyStats).map(([month, data]) => ({
      month,
      "Tạo mới": data.created,
      "Hoàn thành": data.completed,
    }));

    // 5. Tỷ lệ hoàn thành
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

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-gray-500">Chưa có dữ liệu để hiển thị thống kê</p>
        <p className="text-gray-400 text-sm mt-2">
          Hãy tạo task đầu tiên để xem báo cáo
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 text-white">
          <p className="text-sm opacity-90">Tổng tasks</p>
          <p className="text-3xl font-bold">{stats.totalTasks}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-4 text-white">
          <p className="text-sm opacity-90">Hoàn thành</p>
          <p className="text-3xl font-bold">
            {stats.statusData.find((s) => s.name === "Done")?.value || 0}
          </p>
          <p className="text-xs opacity-80">{stats.completionRate}%</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-4 text-white">
          <p className="text-sm opacity-90">Quá hạn</p>
          <p className="text-3xl font-bold">{stats.overdueCount}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-4 text-white">
          <p className="text-sm opacity-90">Đang làm</p>
          <p className="text-3xl font-bold">
            {stats.statusData.find((s) => s.name === "Doing")?.value || 0}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Status */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Phân bố theo trạng thái
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {stats.statusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Priority */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Phân bố theo độ ưu tiên
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.priorityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {stats.priorityData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Weekly */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Hoạt động trong tuần
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Tạo mới" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Hoàn thành" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart - Monthly */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            Xu hướng hàng tháng
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Tạo mới"
                stroke="#3b82f6"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Hoàn thành"
                stroke="#10b981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          Tiến độ tổng thể
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Hoàn thành</span>
            <span className="font-semibold text-green-600">
              {stats.completionRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 text-center text-sm">
            <div>
              <p className="text-gray-500">Chưa làm</p>
              <p className="font-semibold text-gray-700">
                {stats.statusData.find((s) => s.name === "To Do")?.value || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Đang làm</p>
              <p className="font-semibold text-yellow-600">
                {stats.statusData.find((s) => s.name === "Doing")?.value || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Đã xong</p>
              <p className="font-semibold text-green-600">
                {stats.statusData.find((s) => s.name === "Done")?.value || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
      <MoodStats tasks={tasks} />
    </div>
  );
}
