// services/api.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

const fetchAPI = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

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

// ==================== TASK APIs ====================
export const getTasks = async (token, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
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

// ✅ SỬA: đổi tên từ archivetasks thành archiveTask (cho đúng với component)
export const archiveTask = async (id, token) => {
  const result = await fetchAPI(`/api/task/${id}/archive`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  return result;
};

// ✅ SỬA: đổi tên từ restoreFromArchive (giữ nguyên)
export const restoreFromArchive = async (id, token) => {
  const result = await fetchAPI(`/api/task/${id}/restore`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  return result;
};

// ✅ SỬA: đổi tên từ softDeletetasks thành softDeleteTask
export const softDeleteTask = async (id, token) => {
  const result = await fetchAPI(`/api/task/${id}/soft`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return result;
};

// ✅ SỬA: đổi tên từ hardDeletetasks thành hardDeleteTask
export const hardDeleteTask = async (id, token) => {
  const result = await fetchAPI(`/api/task/${id}/hard`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return result;
};

// ✅ SỬA: đổi tên từ restoreFromTrash (giữ nguyên)
export const restoreFromTrash = async (id, token) => {
  const result = await fetchAPI(`/api/task/${id}/restore`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  return result;
};

// ✅ SỬA: đổi tên từ getTrashtaskss thành getTrashTasks
export const getTrashTasks = async (token, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/api/task/trash${queryString ? `?${queryString}` : ""}`;
  const result = await fetchAPI(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return result;
};

export const deleteAccount = async (token) => {
  const result = await fetchAPI("/api/auth/delete", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return result;
};


