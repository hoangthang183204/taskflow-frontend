// store/authStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true, // Thêm loading state

      // Đăng nhập
      login: (user, token) => {
        if (typeof document !== "undefined") {
          // Set cookie cho middleware
          document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
        }
        set({ user, token, isAuthenticated: true, isLoading: false });
      },

      // Đăng xuất
      logout: () => {
        if (typeof document !== "undefined") {
          // Xóa cookie
          document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
          // Xóa localStorage
          localStorage.removeItem("auth-storage");
        }
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      },

      // Cập nhật thông tin user
      updateUser: (user) => {
        set({ user });
      },

      // Xóa tài khoản
      deleteAccount: () => {
        if (typeof document !== "undefined") {
          document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
          localStorage.removeItem("auth-storage");
        }
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      },

      // Set loading
      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      // Khôi phục session từ cookie
      restoreSession: async () => {
        if (typeof window === "undefined") return;
        
        const getCookie = (name) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop().split(";").shift();
          return null;
        };

        const token = getCookie("token");
        
        if (!token) {
          set({ isLoading: false });
          return;
        }

        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          const data = await response.json();
          
          if (data.success && data.data) {
            set({ 
              user: data.data, 
              token: token, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            // Token không hợp lệ, xóa cookie
            document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          }
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  ),
);

// Tự động khôi phục session khi app khởi động
if (typeof window !== "undefined") {
  // Đợi một chút để store được khởi tạo
  setTimeout(() => {
    const store = useAuthStore.getState();
    if (!store.isAuthenticated && !store.isLoading) {
      store.restoreSession();
    }
  }, 0);
}

export default useAuthStore;