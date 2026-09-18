"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useAuthStore from "@/store/authStore";
import useToast from "@/hooks/useToast";
import { updateProfile, changePassword, deleteAccount } from "@/services/api";
import {
  IconChevronLeft,
  IconEdit,
  IconUser,
  IconLock,
  IconAlertTriangle,
  IconLogout,
  IconCheck,
  IconX,
  IconTrash,
  IconLoader,
} from "@/components/Icons";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [updating, setUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const router = useRouter();
  const toast = useToast();

  const {
    user,
    token,
    updateUser,
    logout,
    isAuthenticated,
    deleteAccount: storeDeleteAccount,
  } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push("/login");
      return;
    }
    if (user) {
      setFormData({ name: user.name || "", email: user.email || "" });
    }
    setLoading(false);
  }, [isAuthenticated, token, user, router]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleUpdateProfile = async () => {
    if (!token) return;
    if (!formData.name.trim()) {
      toast.warning("Họ và tên không được để trống");
      return;
    }
    try {
      setUpdating(true);
      await updateProfile(token, formData);
      const updatedUser = {
        ...user,
        name: formData.name,
        email: formData.email,
      };
      updateUser(updatedUser);
      setEditing(false);
      toast.success("Cập nhật thông tin thành công!");
    } catch (error) {
      toast.error(error.message || "Không thể cập nhật");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setFormData({ name: user.name || "", email: user.email || "" });
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.warning("Mật khẩu mới không khớp");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.warning("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (!passwordData.oldPassword) {
      toast.warning("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    try {
      setUpdating(true);
      await changePassword(token, {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error.message || "Không thể đổi mật khẩu");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "XÓA TÀI KHOẢN") {
      toast.warning('Vui lòng gõ "XÓA TÀI KHOẢN" để xác nhận');
      return;
    }
    setIsDeleting(true);
    try {
      await deleteAccount(token);
      storeDeleteAccount();
      toast.success("Tài khoản đã được xóa thành công!");
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      toast.error("Không thể xóa tài khoản: " + error.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmText("");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
      logout();
      router.push("/");
    }
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex justify-between items-center gap-3">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push("/board")}
                className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
                title="Quay lại"
              >
                <IconChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg
                    className="w-4 h-4 text-white"
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
                </div>
                <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  Cài đặt tài khoản
                </h1>
              </div>
            </div>

            {/* Right: Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0"
            >
              <IconLogout className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================ */}
      {/* CONTENT */}
      {/* ============================================ */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ===== Profile Card ===== */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-md">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                {/* Status dot */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
              </div>

              {/* Name + Email */}
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {user?.name || "Người dùng"}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">
                  {user?.email || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Grid 2 cột ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ============================================ */}
          {/* CARD: Thông tin cá nhân */}
          {/* ============================================ */}
          <section className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <IconUser className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                Thông tin cá nhân
              </h3>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Họ và tên
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    placeholder="Nhập họ tên"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2 font-medium">
                    {user?.name || "—"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Địa chỉ email
                </label>
                {editing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    placeholder="Nhập email"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2 font-medium">
                    {user?.email || "—"}
                  </p>
                )}
              </div>

              <div className="pt-2">
                {editing ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={updating}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50 shadow-sm text-sm flex items-center justify-center gap-1.5"
                    >
                      {updating ? (
                        <>
                          <IconLoader className="w-4 h-4 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <IconCheck className="w-4 h-4" />
                          Lưu thay đổi
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={updating}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium transition disabled:opacity-50 text-sm flex items-center justify-center gap-1.5"
                    >
                      <IconX className="w-4 h-4" />
                      Hủy bỏ
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-lg font-medium transition shadow-sm flex items-center justify-center gap-2 text-sm"
                  >
                    <IconEdit className="w-4 h-4" />
                    Chỉnh sửa thông tin
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ============================================ */}
          {/* CARD: Bảo mật */}
          {/* ============================================ */}
          <section className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <IconLock className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                Bảo mật
              </h3>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <PasswordInput
                label="Mật khẩu hiện tại"
                value={passwordData.oldPassword}
                onChange={(v) =>
                  setPasswordData({ ...passwordData, oldPassword: v })
                }
                show={showPassword.old}
                onToggle={() =>
                  setShowPassword({ ...showPassword, old: !showPassword.old })
                }
              />

              <PasswordInput
                label="Mật khẩu mới"
                placeholder="Tối thiểu 6 ký tự"
                value={passwordData.newPassword}
                onChange={(v) =>
                  setPasswordData({ ...passwordData, newPassword: v })
                }
                show={showPassword.new}
                onToggle={() =>
                  setShowPassword({ ...showPassword, new: !showPassword.new })
                }
              />

              <PasswordInput
                label="Xác nhận mật khẩu mới"
                value={passwordData.confirmPassword}
                onChange={(v) =>
                  setPasswordData({ ...passwordData, confirmPassword: v })
                }
                show={showPassword.confirm}
                onToggle={() =>
                  setShowPassword({
                    ...showPassword,
                    confirm: !showPassword.confirm,
                  })
                }
              />

              <button
                onClick={handleChangePassword}
                disabled={updating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50 shadow-sm text-sm flex items-center justify-center gap-1.5 mt-2"
              >
                {updating ? (
                  <>
                    <IconLoader className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <IconLock className="w-4 h-4" />
                    Đổi mật khẩu
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        {/* ============================================ */}
        {/* CARD: Danger Zone */}
        {/* ============================================ */}
        <section className="mt-6 bg-white rounded-2xl border border-red-200/60 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-red-100 bg-red-50/50 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <IconAlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <h3 className="font-semibold text-red-900 text-sm sm:text-base">
              Khu vực nguy hiểm
            </h3>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm">
                  Xóa tài khoản
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Sau khi xóa, tất cả dữ liệu (task, thông tin cá nhân) sẽ bị
                  xóa vĩnh viễn và không thể khôi phục.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 rounded-lg font-medium transition border border-red-200 text-sm whitespace-nowrap flex-shrink-0 flex items-center justify-center gap-1.5"
              >
                <IconTrash className="w-4 h-4" />
                Xóa tài khoản
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ============================================ */}
      {/* DELETE MODAL */}
      {/* ============================================ */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => {
            if (!isDeleting) {
              setShowDeleteModal(false);
              setDeleteConfirmText("");
            }
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <IconAlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Xóa tài khoản
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1.5 leading-relaxed">
                    Hành động này sẽ xóa vĩnh viễn tài khoản của bạn cùng với
                    tất cả task.{" "}
                    <span className="font-semibold text-red-600">
                      Dữ liệu sẽ không thể khôi phục!
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Để xác nhận, vui lòng gõ{" "}
                  <span className="font-mono font-bold text-red-600">
                    "XÓA TÀI KHOẢN"
                  </span>
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="XÓA TÀI KHOẢN"
                  disabled={isDeleting}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50 text-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText !== "XÓA TÀI KHOẢN"}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-1.5"
                >
                  {isDeleting ? (
                    <>
                      <IconLoader className="w-4 h-4 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <IconTrash className="w-4 h-4" />
                      Xóa tài khoản
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PASSWORD INPUT COMPONENT
// ============================================================
function PasswordInput({
  label,
  value,
  onChange,
  placeholder = "••••••••",
  show,
  onToggle,
  disabled,
}) {
  return (
    <div>
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full border border-gray-300 rounded-lg pl-3.5 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition disabled:opacity-50"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition"
          title={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {show ? (
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
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
          ) : (
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
