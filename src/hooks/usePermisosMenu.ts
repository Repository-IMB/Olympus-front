import { useMemo } from "react";
import { getCookie } from "../utils/cookies"; 
import type { UserContextType } from "../context/UserContext";

export type PermisosMenu = {
  leads: boolean;
  asignacion: boolean;
  desarrollo: boolean;
  logistica: boolean;
  usuarios: boolean;
};

const ROLES = {
  ASESOR: 1,
  SUPERVISOR: 2,
  GERENTE: 3,       
  ADMINISTRADOR: 4, 
  DESARROLLADOR: 5,  
  ADMINISTRATIVO: 7, 
};

const AREAS = {
  DESARROLLO_PRODUCTO: 2,
};

export function usePermisosMenu(userContext: UserContextType | null): PermisosMenu {
  return useMemo(() => {
    // 1. OBTENER IDs
    const idRol = Number(getCookie("idRol") || userContext?.idRol || 0);
    const idArea = Number(getCookie("idAreaTrabajo") || userContext?.idAreaTrabajo || 0);

    // =======================================================
    // 1. ACCESO TOTAL (Admin y Dev)
    // =======================================================
    if (idRol === ROLES.ADMINISTRADOR || idRol === ROLES.DESARROLLADOR) {
      return { 
        leads: true, asignacion: true, desarrollo: true, logistica: true, usuarios: true 
      };
    }

    // =======================================================
    // 2. LÓGICA ESPECÍFICA: ÁREA DESARROLLO DE PRODUCTO (2)
    // =======================================================
    if (idArea === AREAS.DESARROLLO_PRODUCTO) {
      
      // CASO A: GERENTE DE DESARROLLO (Rol 3 en Área 2)
      // Solo ve su módulo y usuarios. Ocultamos el resto.
      if (idRol === ROLES.GERENTE) {
        return {
          leads: false,      
          asignacion: false, 
          desarrollo: true,  // ✅ SU ÁREA
          logistica: false,  
          usuarios: true,    // ✅ GESTIÓN DE PERSONAL
        };
      }

      // CASO B: ADMINISTRATIVO DE DESARROLLO (Rol 7 en Área 2)
      // Ve su módulo pero NO ve usuarios.
      if (idRol === ROLES.ADMINISTRATIVO) {
        return {
          leads: false,
          asignacion: false,
          desarrollo: true, // ✅ SU ÁREA
          logistica: false,
          usuarios: false,  // ❌ OCULTO (Lo que arreglamos antes)
        };
      }

      // CASO C: SUPERVISOR DE DESARROLLO (Rol 2 en Área 2)
      // Por defecto ve desarrollo y usuarios.
      return {
        leads: false,
        asignacion: false,
        desarrollo: true,
        logistica: false,
        usuarios: true,
      };
    }

    // =======================================================
    // 3. RESTO DE ÁREAS (Ventas, Logística, etc.)
    // =======================================================
    // Aquí el Gerente (3) cae en la lógica normal y ve todo.

    // Roles que ven Leads y Logística
    const esComercial = [ROLES.ASESOR, ROLES.SUPERVISOR, ROLES.GERENTE].includes(idRol);
    
    // Roles que gestionan Usuarios
    const gestionaUsuarios = [ROLES.SUPERVISOR, ROLES.GERENTE, ROLES.ADMINISTRATIVO].includes(idRol);

    return {
      leads: esComercial, 
      asignacion: esComercial && idRol !== ROLES.ASESOR, 
      desarrollo: false, 
      logistica: true,   
      usuarios: gestionaUsuarios,
    };

  }, [userContext]); 
}