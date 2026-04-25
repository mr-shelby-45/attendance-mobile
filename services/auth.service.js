import * as SecureStore from "expo-secure-store";
import api from "./api";

export const registerStudent = async (data) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

export const loginStudent = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  const { token, student } = response.data;

  // Save token and student info securely on the device
  await SecureStore.setItemAsync("token", token);
  await SecureStore.setItemAsync("student", JSON.stringify(student));

  return { token, student };
};

export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (email, otp, newPassword) => {
  const response = await api.post("/auth/reset-password", { email, otp, newPassword });
  return response.data;
};

export const logoutStudent = async () => {
  await SecureStore.deleteItemAsync("token");
  await SecureStore.deleteItemAsync("student");
};

export const getStoredStudent = async () => {
  const student = await SecureStore.getItemAsync("student");
  return student ? JSON.parse(student) : null;
};