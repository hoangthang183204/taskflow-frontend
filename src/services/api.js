// services/api.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

// ============================================================
// ✅ FETCH WRAPPER — Xử lý Rate Limit 429 + Auth 401
// ============================================================
const fetchAPI = async (endpoint, options = {}) => {
  // Tự động lấy token
  const getToken = () => {
    if (typeof window === "undefined") return null;

    let token = localStorage.getItem("token");
    if (!token) {
      const cookies = document.cookie.split("; ");
      const tokenCookie = cookies.find((row) => row.startsWith("token="));
      if (tokenCookie) {
        token = tokenCookie.split("=")[1];
        localStorage.setItem("token", token);
      }
    }
    return token;
  };

  const token = getToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  // ✅ Parse JSON an toàn (phòng khi response không phải JSON)
  const data = await response.json().catch(() => ({}));

  // ============================================================
  // ✅ RATE LIMIT (429) — Hiện toast cảnh báo
  // ============================================================
  if (response.status === 429) {
    const retryAfter = data.retryAfter || 60;

    if (typeof window !== "undefined") {
      const { toast } = await import("sonner");
      const minutes = Math.ceil(retryAfter / 60);

      toast.error("Quá nhiều yêu cầu", {
        description:
          retryAfter > 60
            ? `Vui lòng thử lại sau ${minutes} phút`
            : `Vui lòng thử lại sau ${retryAfter} giây`,
        duration: Math.min(retryAfter * 1000, 10000),
      });
    }

    throw new Error(data.message || "RATE_LIMIT_EXCEEDED");
  }

  // ============================================================
  // ✅ AUTH (401) — Auto logout nếu token hết hạn
  // ============================================================
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      const { toast } = await import("sonner");

      if (data.code === "TOKEN_EXPIRED") {
        toast.error("Phiên đăng nhập hết hạn", {
          description: "Vui lòng đăng nhập lại",
        });
      }

      // Auto logout cho cả NO_TOKEN và TOKEN_EXPIRED
      if (data.code === "TOKEN_EXPIRED" || data.code === "NO_TOKEN") {
        localStorage.removeItem("token");

        // Chỉ redirect nếu chưa ở trang login
        if (!window.location.pathname.includes("/login")) {
          setTimeout(() => {
            window.location.href = "/login";
          }, 1000);
        }
      }
    }

    throw new Error(data.message || "UNAUTHORIZED");
  }

  // ============================================================
  // ✅ OTHER ERRORS
  // ============================================================
  if (!response.ok) {
    throw new Error(data.message || "API Error");
  }

  return data;
};

// ==================== AUTH APIs ====================
export const register = async (userData) => {
  const result = await fetchAPI("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
  return result.data;
};

export const login = async (credentials) => {
  const result = await fetchAPI("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  return result.data;
};

export const getCurrentUser = async (token) => {
  const result = await fetchAPI("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return result.data;
};

export const updateProfile = async (token, userData) => {
  const result = await fetchAPI("/api/auth/profile", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(userData),
  });
  return result.data;
};

export const changePassword = async (token, passwordData) => {
  const result = await fetchAPI("/api/auth/change-password", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(passwordData),
  });
  return result;
};

export const deleteAccount = async (token) => {
  const result = await fetchAPI("/api/auth/delete", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return result;
};

// ==================== TASK APIs ====================
export const getTasks = async (token, params = {}) => {
  const cleanParams = {};
  if (params.page) cleanParams.page = params.page;
  if (params.limit) cleanParams.limit = params.limit;
  if (params.search) cleanParams.search = params.search;
  if (params.status) cleanParams.status = params.status;
  if (params.priority) cleanParams.priority = params.priority;
  if (params.boardId) cleanParams.boardId = params.boardId;
  if (params.teamId) cleanParams.teamId = params.teamId;

  const queryString = new URLSearchParams(cleanParams).toString();
  const endpoint = `/api/task${queryString ? `?${queryString}` : ""}`;

  const result = await fetchAPI(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return result;
};

export const createTask = async (taskData, token) => {
  const result = await fetchAPI("/api/task", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(taskData),
  });
  return result.data;
};

export const updateTask = async (id, taskData, token) => {
  const result = await fetchAPI(`/api/task/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(taskData),
  });
  return result.data;
};

export const deleteTask = async (id, token) => {
  const result = await fetchAPI(`/api/task/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return result;
};

export const archiveTask = async (id, token) => {
  const result = await fetchAPI(`/api/task/${id}/archive`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  return result;
};

export const restoreFromArchive = async (id, token) => {
  const result = await fetchAPI(`/api/task/${id}/restore`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  return result;
};

export const softDeleteTask = async (id, token) => {
  const result = await fetchAPI(`/api/task/${id}/soft`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return result;
};

export const hardDeleteTask = async (id, token) => {
  const result = await fetchAPI(`/api/task/${id}/hard`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return result;
};

export const restoreFromTrash = async (id, token) => {
  const result = await fetchAPI(`/api/task/${id}/restore`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  return result;
};

export const getTrashTasks = async (token, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/api/task/trash${queryString ? `?${queryString}` : ""}`;
  const result = await fetchAPI(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return result;
};

// ==================== BOARD APIs ====================
export const getMyBoards = async (token) => {
  const result = await fetchAPI("/api/board", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (result?.data && Array.isArray(result.data)) {
    return result.data;
  }
  if (Array.isArray(result)) {
    return result;
  }
  if (result?.boards && Array.isArray(result.boards)) {
    return result.boards;
  }
  return [];
};

export const createBoard = async (token, boardData) => {
  const result = await fetchAPI("/api/board", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(boardData),
  });
  return result.data || result;
};

export const getBoardDetail = async (token, boardId) => {
  const result = await fetchAPI(`/api/board/${boardId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return result.data || result;
};

export const updateBoard = async (token, boardId, boardData) => {
  const result = await fetchAPI(`/api/board/${boardId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(boardData),
  });
  return result.data || result;
};

export const deleteBoard = async (token, boardId) => {
  const result = await fetchAPI(`/api/board/${boardId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return result;
};

// ==================== BOARD MEMBER APIs ====================
export const getBoardMembers = async (token, boardId) => {
  const result = await fetchAPI(`/api/board/${boardId}/members`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return result.data || result;
};

export const getAssignableMembers = async (token, boardId) => {
  const result = await fetchAPI(`/api/board/${boardId}/members/assignable`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return result.data || result;
};

export const addBoardMember = async (token, boardId, email, role = "member") => {
  const result = await fetchAPI(`/api/board/${boardId}/members`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ email, role }),
  });
  return result.data || result;
};

export const removeBoardMember = async (token, boardId, userId) => {
  const result = await fetchAPI(`/api/board/${boardId}/members/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return result;
};