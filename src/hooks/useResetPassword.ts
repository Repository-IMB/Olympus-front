import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../servicios/api";

export interface UsuarioRecuperacionDTO {
  nombre: string;
  correo: string;
  pais: string;
}

export function useResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [validandoToken, setValidandoToken] = useState(true);
  const [datosUsuario, setDatosUsuario] = useState<UsuarioRecuperacionDTO | null>(null);
  const [errorToken, setErrorToken] = useState<string | null>(null);
  const navigate = useNavigate();

  const validarToken = async (token: string) => {
    setValidandoToken(true);
    setErrorToken(null);
    try {
      const respuesta = await api.get(`api/SegModLogin/validar-token/${token}`);
      setDatosUsuario(respuesta.data);
    } catch (err: any) {
      console.error("Error al validar token:", err);
      const msg =
        err?.response?.data?.mensaje ??
        err?.response?.data?.message ??
        err?.message ??
        "El token no es válido o ha expirado";
      setErrorToken(msg);
    } finally {
      setValidandoToken(false);
    }
  };

  const cambiarPassword = async (token: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cargando) return;
    setError(null);
    setCargando(true);

    try {
      await api.post("api/SegModLogin/cambiar-password", { token, password });
      navigate("/login", {
        state: { message: "Contraseña actualizada exitosamente" },
      });
    } catch (err: any) {
      console.error("Error al cambiar contraseña:", err);
      const msg =
        err?.response?.data?.mensaje ??
        err?.response?.data?.message ??
        err?.message ??
        "Error al actualizar la contraseña";
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    cargando,
    validandoToken,
    datosUsuario,
    errorToken,
    validarToken,
    cambiarPassword,
  };
}
