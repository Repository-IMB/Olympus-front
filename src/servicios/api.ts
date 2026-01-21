import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export const baseUrl: string =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:7020";

// 🔹 Helper: obtener ID de usuario desde el token
export const getUserIdFromToken = (): number => {
  const token = Cookies.get("token");
  if (!token) return 0;

  try {
    const decoded: any = jwtDecode(token);
    const id =
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ];

    return id ? Number(id) : 0;
  } catch (e) {
    console.error("Error decodificando token", e);
    return 0;
  }
};

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔹 Interceptor REQUEST: agrega Bearer desde cookies
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Interceptor RESPONSE: manejar 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Cookies.remove("token");
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
