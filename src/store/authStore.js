// store/authStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        if (typeof document !== "undefined") {
          document.cookie = `token=${token}; path=/; max-age=86400`;
        }
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        if (typeof document !== "undefined") {
          document.cookie =
            "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (user) => {
        set({ user });
      },

      deleteAccount: () => {
        if (typeof document !== "undefined") {
          document.cookie =
            "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        }
        localStorage.removeItem("auth-storage");
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
    },
  ),
);

// Khôi phục token từ cookie khi khởi động
if (typeof window !== "undefined") {
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  };

  const token = getCookie("token");
  if (token) {
    // Nếu có token trong cookie, có thể fetch user info
    fetch("http://localhost:1337/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          useAuthStore.getState().login(data.data, token);
        }
      })
      .catch(() => {});
  }
}

export default useAuthStore;
