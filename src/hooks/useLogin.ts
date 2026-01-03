import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../servicios/api";
import { iniciarSesion } from "../servicios/AutenticacionServicio";

export function useLogin() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const navigate = (() => {
    try {
      return useNavigate();
    } catch (e) {
      console.warn("useNavigate no disponible:", e);
      return null as any;
    }
  })();

  function parseJwt(token: string) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload) as Record<string, any>;
    } catch (e) {
      return null;
    }
  }

  function setTokenCookie(token: string) {
    const payload = parseJwt(token);
    let maxAgeSeconds: number | undefined;
    if (payload && typeof payload.exp === "number") {
      const nowSec = Math.floor(Date.now() / 1000);
      maxAgeSeconds = payload.exp - nowSec;
      if (!maxAgeSeconds || maxAgeSeconds <= 0) {
        maxAgeSeconds = undefined;
      }
    }

    if (!maxAgeSeconds) maxAgeSeconds = 60 * 60 * 5;

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    const sameSite = "; SameSite=Lax";
    const cookie = `token=${token}; path=/; max-age=${maxAgeSeconds}${secure}${sameSite}`;
    document.cookie = cookie;
  }

  const manejarLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cargando) return;
    setError(null);
    setCargando(true);

    try {
      const res = await iniciarSesion({ correo, password });
      const token =
        (res && (res as any).token) ??
        (res as any).data?.token ??
        (res as any).Token ??
        (res as any).token;

      if (!token) {
        const msg = (res as any)?.mensaje ?? "No se recibió token";
        console.warn("No se obtuvo token del backend:", res);
        setError(msg);
        setCargando(false);
        return;
      }

      localStorage.setItem("token", token);
      try {
        setTokenCookie(token);
      } catch (cookieErr) {
      }
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      try {
        if (navigate) {
          navigate("/leads/SalesProcess", { replace: true });
        } else {
          window.location.href = "/leads/SalesProcess";
        }
      } catch (navErr) {
        // console.error("Error en navigate:", navErr);
        window.location.href = "/leads/SalesProcess";
      }
    } catch (err: any) {
      // console.error("Error en manejarLogin:", err);
      const msg =
        err?.response?.data?.mensaje ??
        err?.response?.data?.message ??
        err?.message ??
        "Error al iniciar sesión";
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  return {
    correo,
    password,
    setCorreo,
    setPassword,
    error,
    cargando,
    manejarLogin,
  };
}
