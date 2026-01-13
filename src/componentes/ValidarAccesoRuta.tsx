import { message } from "antd";
import { jwtDecode } from "jwt-decode";
import { getCookie } from "../utils/cookies";
import { permisosPorRuta } from "../utils/permisosPorRuta";

interface TokenData {
  [key: string]: any;
}

export function validarAccesoRuta(ruta: string, navigate: any) {
  const token = getCookie("token");

  if (!token) {
    message.error("Sesión no válida");
    navigate("/login");
    return { permitido: false, error: "No se encontró token" };
  }

  let idUsuario = 0;
  let idRol = 0;

  try {
    const decoded = jwtDecode<TokenData>(token);

    // --- obtener idUsuario ---
    idUsuario = parseInt(
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ] || "0"
    );

    // --- obtener nombre de rol ---
    const rolNombre =
      decoded[
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
      ] || "";

    const rolesMap: Record<string, number> = {
      Asesor: 1,
      Supervisor: 2,
      Gerente: 3,
      Administrador: 4,
      Desarrollador: 5,
    };

    idRol = rolesMap[rolNombre] ?? 0;
  } catch (e) {
    message.error("Error en la sesión");
    navigate("/login");
    return { permitido: false, error: "Token inválido" };
  }

  // --- validar acceso por ruta ---
  const rolesPermitidos = permisosPorRuta[ruta];

  if (!rolesPermitidos) {
    // console.warn(`⚠ Ruta "${ruta}" no configurada en permisosPorRuta`);
    return { permitido: true };
  }

  if (!rolesPermitidos.includes(idRol)) {
    return {
      permitido: false,
      error: "No tienes permiso para acceder a esta sección.",
    };
  }

  return {
    permitido: true,
    idUsuario,
    idRol,
  };
}
