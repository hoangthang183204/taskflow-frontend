// app/profile/page.js
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useAuthStore from "@/store/authStore";
import useToast from "@/hooks/useToast";
import { updateProfile, changePassword, deleteAccount } from "@/services/api";

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
  const router = useRouter();
  const toast = useToast();

  const { user, token, updateUser, logout, isAuthenticated, deleteAccount: storeDeleteAccount } = useAuthStore();

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

  const handleUpdateProfile = async () => {
    if (!token) return;
    try {
      setUpdating(true);
      await updateProfile(token, formData);
      const updatedUser = { ...user, name: formData.name, email: formData.email };
      updateUser(updatedUser);
      setEditing(false);
      toast.success("Cập nhật thông tin thành công!");
    } catch (error) {
      toast.error(error.message || "Không thể cập nhật");
    } finally {
      setUpdating(false);
    }
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
    try {
      setUpdating(true);
      await changePassword(token, {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-300 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/task")}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Cài đặt tài khoản
              </h1>
            </div>
            <button
              onClick={() => {
                if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
                  logout();
                  router.push("/");
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <h2 className="mt-3 text-xl font-semibold text-gray-800">{user?.name}</h2>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="font-semibold text-gray-800">Thông tin cá nhân</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Họ và tên
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  ) : (
                    <p className="text-gray-900 py-2.5">{user?.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Địa chỉ email
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  ) : (
                    <p className="text-gray-900 py-2.5">{user?.email}</p>
                  )}
                </div>
                <div className="pt-3">
                  {editing ? (
                    <div className="flex gap-3">
                      <button
                        onClick={handleUpdateProfile}
                        disabled={updating}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium transition disabled:opacity-50 shadow-sm"
                      >
                        {updating ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition"
                      >
                        Hủy bỏ
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditing(true)}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-xl font-medium transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Chỉnh sửa thông tin
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="font-semibold text-gray-800">Bảo mật</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    placeholder="•••••••• (tối thiểu 6 ký tự)"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={updating}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-medium transition disabled:opacity-50 shadow-sm mt-3"
                >
                  {updating ? "Đang xử lý..." : "Đổi mật khẩu"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone - Delete Account */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="font-semibold text-gray-800">Khu vực nguy hiểm</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <p className="font-medium text-gray-800">Xóa tài khoản</p>
                <p className="text-sm text-gray-500">
                  Sau khi xóa, tất cả dữ liệu (task, thông tin cá nhân) sẽ bị xóa vĩnh viễn và không thể khôi phục.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition border border-red-200"
              >
                Xóa tài khoản
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Xóa tài khoản</h3>
              </div>
              <p className="text-gray-600 mt-3">
                Hành động này sẽ xóa vĩnh viễn tài khoản của bạn cùng với tất cả task. 
                <span className="font-semibold text-red-600 block mt-2">Dữ liệu sẽ không thể khôi phục!</span>
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Để xác nhận, vui lòng gõ <span className="font-mono font-bold text-red-600">"XÓA TÀI KHOẢN"</span>
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="XÓA TÀI KHOẢN"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText !== "XÓA TÀI KHOẢN"}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Đang xóa..." : "Xóa tài khoản"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}