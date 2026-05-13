# TaskFlow - Frontend

## Giới thiệu

TaskFlow là ứng dụng quản lý công việc với giao diện Kanban trực quan. Frontend được xây dựng bằng Next.js 16, hỗ trợ kéo thả task, nhập liệu bằng giọng nói, Pomodoro timer và thống kê chi tiết.

## Tính năng chính

- Đăng nhập và đăng ký với JWT
- Quản lý task: tạo, sửa, xóa, lưu trữ, khôi phục
- Kéo thả task giữa các cột: To Do, Doing, Done
- Tìm kiếm và lọc task theo trạng thái và độ ưu tiên
- Nhập liệu bằng giọng nói: tìm kiếm và tạo task
- Pomodoro timer hỗ trợ tập trung làm việc
- Thống kê biểu đồ: tiến độ công việc
- Mood tracking sau khi hoàn thành task
- Thùng rác: xóa mềm và khôi phục task
- Thông báo task sắp hết hạn
- Responsive trên mọi thiết bị

## Công nghệ sử dụng

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Next.js | 16.2.3 | Framework chính |
| TailwindCSS | 4.0.0 | UI styling |
| dnd-kit | 6.3.1 | Kéo thả task |
| Zustand | 5.0.3 | State management |
| Sonner | 2.0.3 | Toast notification |
| Recharts | 2.15.0 | Biểu đồ thống kê |
| Web Speech API | - | Nhập giọng nói |

## Cấu trúc thư mục
taskmanagementnext/
├── app/
│ ├── login/ # Trang đăng nhập
│ ├── register/ # Trang đăng ký
│ ├── task/
│ │ ├── page.js # Dashboard Kanban
│ │ └── create/ # Tạo task mới
│ └── profile/ # Trang cá nhân
├── components/
│ ├── KanbanBoard.js # Board kéo thả
│ ├── NotificationBell.js # Chuông thông báo
│ ├── VoiceInput.js # Nhập giọng nói
│ ├── SearchBar.js # Tìm kiếm và lọc
│ ├── DashboardStats.js # Thống kê
│ ├── TrashView.js # Thùng rác
│ ├── MoodPicker.js # Chọn cảm xúc
│ └── PomodoroTimer.js # Timer làm việc
├── services/
│ └── api.js # Gọi API backend
├── store/
│ └── authStore.js # Quản lý xác thực
├── public/ # Tài nguyên tĩnh
└── .env.local # Biến môi trường


## Yêu cầu hệ thống

- Node.js 20 trở lên
- Backend TaskFlow đang chạy

## Cài đặt

```bash
# Clone repository
git clone https://github.com/hoangthang183204/taskflow-frontend.git
cd taskflow-frontend

# Cài dependencies
npm install

# Tạo file .env.local
cp .env.local.example .env.local

# Chạy development
npm run dev

NEXT_PUBLIC_API_URL=http://localhost:1337

# Build image
docker build -t taskflow-frontend .

# Chạy container
docker run -p 3000:3000 --env-file .env.local taskflow-frontend