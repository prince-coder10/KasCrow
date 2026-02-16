// src/api/client.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000/api/v1",
  withCredentials: true,
  timeout: 600000,
});

// Optional: response interceptor for logging (add tomorrow)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API Error:", err.response?.data || err.message);
    return Promise.reject(err);
  },
);
