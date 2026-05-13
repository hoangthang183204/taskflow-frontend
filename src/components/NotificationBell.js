"use client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export default function NotificationBell({ tasks }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hasShownToastRef = useRef(false); // 🔥 Thêm ref để tránh toast trùng

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Kiểm tra task sắp hết hạn
  useEffect(() => {
    const checkDueDates = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const notificationsList = [];
      
      tasks.forEach(task => {
        if (!task.dueDate || task.status === "done" || task.isArchived) return;
        
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysLeft < 0) {
          notificationsList.push({
            id: task.id,
            title: task.title,
            message: `💀 Quá hạn ${Math.abs(daysLeft)} ngày!`,
            dueDate: task.dueDate,
            priority: task.priority,
            type: "overdue"
          });
        } else if (daysLeft === 0) {
          notificationsList.push({
            id: task.id,
            title: task.title,
            message: `🔴 Hết hạn HÔM NAY!`,
            dueDate: task.dueDate,
            priority: task.priority,
            type: "today"
          });
        } else if (daysLeft === 1) {
          notificationsList.push({
            id: task.id,
            title: task.title,
            message: `⚠️ Sắp hết hạn vào ngày mai!`,
            dueDate: task.dueDate,
            priority: task.priority,
            type: "tomorrow"
          });
        } else if (daysLeft <= 2) {
          notificationsList.push({
            id: task.id,
            title: task.title,
            message: `⏰ Còn ${daysLeft} ngày nữa!`,
            dueDate: task.dueDate,
            priority: task.priority,
            type: "soon"
          });
        }
      });
      
      const sorted = notificationsList.sort((a, b) => {
        const order = { overdue: 0, today: 1, tomorrow: 2, soon: 3 };
        return order[a.type] - order[b.type];
      });
      
      setNotifications(sorted);
      
      const lastNotified = localStorage.getItem("lastNotifiedDate");
      const todayStr = today.toISOString().split("T")[0];
      
      if (sorted.length > 0 && lastNotified !== todayStr && tasks.length > 0 && !hasShownToastRef.current) {
        hasShownToastRef.current = true;
        setTimeout(() => {
          toast.warning(`⚠️ Bạn có ${sorted.length} task sắp đến hạn!`, {
            duration: 5000,
            position: "top-center",
          });
        }, 500);
      }
      
      if (tasks.length === 0) {
        hasShownToastRef.current = false;
      }
    };
    
    if (tasks.length > 0) {
      checkDueDates();
    }
  }, [tasks]);

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    if (hasNewNotifications) {
      setHasNewNotifications(false);
      localStorage.setItem("lastNotifiedDate", new Date().toISOString().split("T")[0]);
      hasShownToastRef.current = false; // Reset ref
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case "high": return "border-red-500 bg-red-50";
      case "medium": return "border-yellow-500 bg-yellow-50";
      default: return "border-green-500 bg-green-50";
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case "overdue": return "💀";
      case "today": return "🔴";
      case "tomorrow": return "⚠️";
      default: return "⏰";
    }
  };

  // Mobile: dropdown canh giữa
  if (isMobile) {
    return (
      <div className="relative inline-block">
        <button
          onClick={handleBellClick}
          className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          
          {notifications.length > 0 && (
            <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white rounded-full ${
              hasNewNotifications ? "bg-red-500 animate-pulse" : "bg-orange-500"
            }`}>
              {notifications.length}
            </span>
          )}
        </button>

        {showNotifications && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
            <div className="fixed left-1/2 top-14 z-50 -translate-x-1/2 w-[calc(100%-32px)] max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                <h3 className="font-semibold text-gray-800">📅 Thông báo</h3>
                <p className="text-xs text-gray-500">{notifications.length} task sắp hết hạn</p>
              </div>
              
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">🎉 Không có thông báo</div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="p-3 hover:bg-gray-50">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{getTypeIcon(notif.type)}</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-800">{notif.title}</div>
                          <div className="text-xs text-red-500 mt-0.5">{notif.message}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            📅 {new Date(notif.dueDate).toLocaleDateString("vi-VN")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Desktop View
  return (
    <div className="relative inline-block">
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        
        {notifications.length > 0 && (
          <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white rounded-full ${
            hasNewNotifications ? "bg-red-500 animate-pulse" : "bg-orange-500"
          }`}>
            {notifications.length}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
          <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <h3 className="font-semibold text-gray-800">📅 Thông báo</h3>
            <p className="text-xs text-gray-500">{notifications.length} task sắp hết hạn</p>
          </div>
          
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">🎉 Không có thông báo</div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{getTypeIcon(notif.type)}</span>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-800">{notif.title}</div>
                      <div className="text-xs text-red-500 mt-0.5">{notif.message}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        📅 {new Date(notif.dueDate).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}