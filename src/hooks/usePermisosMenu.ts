import { useMemo } from "react";

export type PermisosMenu = {
  leads: boolean;
  asignacion: boolean;
  desarrollo: boolean;
  logistica: boolean;
  usuarios: boolean;
  contabilidad: boolean;
  contabilidad_resumen: boolean;
  contabilidad_facturacion: boolean;
  contabilidad_reportes: boolean;
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
        contabilidad: false,
        contabilidad_resumen: false,
        contabilidad_facturacion: false,
        contabilidad_reportes: false,
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
        contabilidad: true,
        contabilidad_resumen: true,
        contabilidad_facturacion: true,
        contabilidad_reportes: true,
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
        contabilidad: false,
        contabilidad_resumen: false,
        contabilidad_facturacion: false,
        contabilidad_reportes: false,
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
        contabilidad: false,
        contabilidad_resumen: false,
        contabilidad_facturacion: false,
        contabilidad_reportes: false,
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
        contabilidad: false,
        contabilidad_resumen: false,
        contabilidad_facturacion: false,
        contabilidad_reportes: false,
      };
    }

    // ================= DEFAULT =================
    return {
      leads: false,
      asignacion: false,
      desarrollo: false,
      logistica: false,
      usuarios: false,
      contabilidad: false,
      contabilidad_resumen: false,
      contabilidad_facturacion: false,
      contabilidad_reportes: false,
    };
  }, [userContext]);
}
