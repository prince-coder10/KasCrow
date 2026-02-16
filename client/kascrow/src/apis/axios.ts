// src/api/client.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "https://api-kascrow.onrender.com/api/v1", //http://localhost:3000/api/v1
  withCredentials: true,
});

// Optional: response interceptor for logging (add tomorrow)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API Error:", err.response?.data || err.message);
    return Promise.reject(err);
  },
);
