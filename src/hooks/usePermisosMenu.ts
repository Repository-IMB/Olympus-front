import { useMemo } from "react";

export type PermisosMenu = {
  leads: boolean;
  asignacion: boolean;
  desarrollo: boolean;
  logistica: boolean;
  usuarios: boolean;
  recursosHumanos: boolean;
};

const normalizar = (valor?: string) =>
  valor?.trim().toLowerCase() ?? "";

const ROLES_CON_USUARIOS = ["supervisor"];

export function usePermisosMenu(userContext: any): PermisosMenu {
  return useMemo(() => {
    if (!userContext) {
      return {
        leads: false,
        asignacion: false,
        desarrollo: false,
        logistica: false,
        usuarios: false,
        recursosHumanos: false,
      };
    }

    const rol = normalizar(userContext.rol);
    const area = normalizar(userContext.areaCodigo);
    const accesoTotal = userContext.accesoTotal === true;

    // ================= ADMIN / DEV =================
    if (accesoTotal || rol === "administrador" || rol === "desarrollador") {
      return {
        leads: true,
        asignacion: true,
        desarrollo: true,
        logistica: true,
        usuarios: true,
        recursosHumanos: true,
      };
    }

    // ================= VENTAS =================
    if (["vta", "venta", "ventas"].includes(area)) {
      return {
        leads: true,
        asignacion: rol !== "asesor",
        desarrollo: false,
        logistica: false,
        usuarios: ROLES_CON_USUARIOS.includes(rol),
        recursosHumanos: false,
      };
    }

    // ================= DESARROLLO =================
    if (["dpr", "desarrollo"].includes(area)) {
      return {
        leads: false,
        asignacion: false,
        desarrollo: ["supervisor", "coordinador"].includes(rol),
        logistica: false,
        usuarios: ROLES_CON_USUARIOS.includes(rol),
        recursosHumanos: false,
      };
    }

    // ================= LOGÍSTICA =================
    if (["log", "logistica"].includes(area)) {
      return {
        leads: false,
        asignacion: false,
        desarrollo: false,
        logistica: true,
        usuarios: ROLES_CON_USUARIOS.includes(rol),
        recursosHumanos: false,
      };
    }

    // ================= RECURSOS HUMANOS =================
    if (["rrhh", "recursos humanos"].includes(area)) {
      return {
        leads: false,
        asignacion: false,
        desarrollo: false,
        logistica: false,
        usuarios: ROLES_CON_USUARIOS.includes(rol),
        recursosHumanos: true,
      };
    }

    // ================= DEFAULT =================
    return {
      leads: false,
      asignacion: false,
      desarrollo: false,
      logistica: false,
      usuarios: false,
      recursosHumanos: false,
    };
  }, [userContext]);
}
