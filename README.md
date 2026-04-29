# TaskFlow - Quản lý công việc thông minh 🚀

## Giới thiệu
TaskFlow là ứng dụng quản lý công việc với giao diện Kanban, hỗ trợ nhập liệu bằng giọng nói, Pomodoro timer và thống kê chi tiết.

## Tính năng chính
- ✅ Đăng nhập/Đăng ký với JWT
- ✅ Quản lý task (Tạo, Sửa, Xóa, Lưu trữ)
- ✅ Kéo thả task giữa các cột (Todo/Doing/Done)
- ✅ Tìm kiếm và lọc task theo trạng thái/ưu tiên
- ✅ 🎤 Nhập liệu bằng giọng nói (tìm kiếm + tạo task)
- ✅ ⏱️ Pomodoro timer hỗ trợ tập trung làm việc
- ✅ 📊 Thống kê biểu đồ (tiến độ, xu hướng)
- ✅ 😊 Mood tracking sau khi hoàn thành task
- ✅ 🗑️ Thùng rác (soft delete & khôi phục)
- 📱 Responsive trên mọi thiết bị

## Công nghệ sử dụng
| Công nghệ | Mục đích |
|-----------|----------|
| Next.js 14 (App Router) | Framework chính |
| TailwindCSS | UI styling |
| Zustand | State management |
| Recharts | Biểu đồ thống kê |
| Web Speech API | Nhập liệu giọng nói |

## Cài đặt và chạy local

### Yêu cầu
- Node.js 18+
- Backend API (đang chạy)

### Các bước
```bash
# Clone repository
git clone https://github.com/yourusername/taskflow.git
cd taskflow

# Cài dependencies
npm install

# Tạo file .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

# Chạy development
npm run dev