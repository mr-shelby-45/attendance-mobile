import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Replace with your machine's local IP address (not localhost)
// Run `ipconfig` in your terminal to find it - look for IPv4 Address
const BASE_URL = "https://students-attendance-app-production.up.railway.app/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;