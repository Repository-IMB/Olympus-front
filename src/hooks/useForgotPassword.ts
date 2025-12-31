import { useState } from "react";
import api from "../servicios/api";

export function useForgotPassword() {
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);

  const solicitarRecuperacion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cargando) return;
    setError(null);
    setExito(false);
    setCargando(true);

    try {
      await api.post("api/SegModLogin/solicitar-recuperacion", { correo });
      setExito(true);
    } catch (err: any) {
      console.error("Error al solicitar recuperación:", err);
      const msg =
        err?.response?.data?.mensaje ??
        err?.response?.data?.message ??
        err?.message ??
        "Error al solicitar recuperación de contraseña";
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  return {
    correo,
    setCorreo,
    error,
    cargando,
    exito,
    solicitarRecuperacion,
  };
}
