import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true,
});

export const searchUsersByEmail = async (email) => {
  const { data } = await api.get("/users/search", { params: { email } });
  return data.users || [];
};

export const getUserProfile = async (userId) => {
  const { data } = await api.get(`/users/${userId}`);
  return data.user;
};

export const getConversations = async () => {
  const { data } = await api.get("/users/conversations");
  return data.conversations || [];
};

export const getMessageHistory = async (userId) => {
  const { data } = await api.get(`/users/${userId}/messages`);
  return data.messages || [];
};

export const getConversationMessages = async (userId, params = {}) => {
  const { data } = await api.get(`/messages/conversation/${userId}`, { params });
  return data.messages || [];
};

export const getUnreadCounts = async () => {
  const { data } = await api.get("/messages/unread/count");
  return {
    unreadCounts: data.unreadCounts || {},
    totalUnread: data.totalUnread || 0,
  };
};

export const markConversationAsRead = async (conversationId) => {
  const { data } = await api.put(`/messages/read/${conversationId}`);
  return data;
};

export const getCurrentProfile = async () => {
  const { data } = await api.get("/users/profile");
  return data.user;
};

export const updateCurrentProfile = async (profile) => {
  const { data } = await api.put("/users/profile", profile);
  return data.user;
};

export const uploadProfilePicture = async (file) => {
  const formData = new FormData();
  formData.append("profilePicture", file);
  const { data } = await api.post("/users/profile/picture", formData);
  return data.user;
};

export const removeProfilePicture = async () => {
  const { data } = await api.delete("/users/profile/picture");
  return data.user;
};

export const uploadChatAttachment = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/messages/attachment", formData);
  return data.attachment;
};

export default api;
