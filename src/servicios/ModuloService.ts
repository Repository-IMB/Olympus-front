import api from "./api";
import type { IModulo } from "../interfaces/IModulo";
import type { ISesion } from "../interfaces/ISesion";

export type { IModulo };
export type { ISesion };

export const baseUrl: string = (import.meta.env.VITE_API_URL as string) || "http://localhost:7020";

/** 🔹 Obtener todos los módulos con Paginación */
export const obtenerModulos = async (
  search: string = "", 
  page: number = 1, 
  pageSize: number = 10,
  producto: string = "", 
  fechaDesde: string = "", 
  fechaHasta: string = "",
  sortField: string = "Id",
  sortOrder: string = "DESC"
): Promise<any> => { 
  const response = await api.get("/api/VTAModVentaModulo/ObtenerTodas", {
    params: {
      search,
      page,
      pageSize,
      producto,
      fechaDesde,
      fechaHasta,
      sortField,
      sortOrder
    }
  });

  return response.data;
};

/** 🔹 Obtener módulo por ID */
export const obtenerModuloPorId = async (id: number): Promise<IModulo> => {
  const response = await api.get(`/api/VTAModVentaModulo/ObtenerPorId/${id}`);
  return response.data;
};

/** 🔹 Obtener módulos por producto */
export const obtenerModulosPorProducto = async (productoId: number): Promise<IModulo[]> => {
  const response = await api.get(`/api/VTAModVentaModulo/ObtenerModulosPorProducto/${productoId}`);
  return response.data;
};

/** 🔹 Crear módulo */
export const crearModulo = async (modulo: Partial<IModulo>): Promise<IModulo> => {
  const payload = {
    ...modulo,
    estado: true,
    fechaCreacion: new Date().toISOString(),
    usuarioCreacion: "SYSTEM",
  };

  const response = await api.post("/api/VTAModVentaModulo/Insertar", payload);
  return response.data;
};

/** 🔹 Actualizar módulo */
export const actualizarModulo = async (
  id: number,
  modulo: Partial<IModulo>,
  preserveSessions: boolean = false
): Promise<IModulo> => {
  // ⚠️ NO duplicar campos que ya vienen en 'modulo'
  const payload = {
    ...modulo,  // ⬅️ Esto ya incluye todo lo necesario
    id,         // ⬅️ Asegurar que el ID esté presente
    preserveSessions,
  };
  
  const response = await api.put("/api/VTAModVentaModulo/Actualizar", payload);
  return response.data;
};

// Definimos la interfaz
export interface ProductoAsociadoModulo {
  idProducto: number;
  nombre: string;
  codigoEdicion: string;
  edicionSesion: string;
  estadoProducto: string;
  orden: number;
}

// Función del servicio
export const obtenerProductosPorModulo = async (idModulo: number): Promise<ProductoAsociadoModulo[]> => {
  const response = await api.get(`/api/VTAModVentaModulo/ObtenerProductosAsociados/${idModulo}`);
  return response.data;
};

export const obtenerCodigosFiltroModulo = async (): Promise<string[]> => {
  try {
    const response = await api.get("/api/VTAModVentaModulo/ObtenerCodigosFiltro");
    return response.data;
  } catch (error) {
    console.error("Error obteniendo códigos de filtro:", error);
    return [];
  }
};

/** 🔹 Eliminar módulo */
/* Todavía no se usa
export const eliminarModulo = async (id: number): Promise<void> => {
  await api.delete(`/api/VTAModVentaModulo/Eliminar/${id}`);
};
*/

/** 🔹 Asignar docente a módulo */
export const asignarDocenteAModulo = async (
  idModulo: number,
  idDocente: number | null // 🟢 CAMBIO 1: Permitir null para desasignar
): Promise<{ codigo: string; mensaje: string }> => {
  
  const payload = {
    IdModulo: idModulo,   // 🟢 CAMBIO 2: Mayúscula inicial (Igual al DTO C#)
    IdDocente: idDocente  // 🟢 Mayúscula inicial
  };

  const response = await api.post(
    "/api/VTAModVentaModulo/AsignarDocente",
    payload
  );

  return response.data;
};

/** 🔹 Obtener sesiones de un módulo */
export const obtenerSesionesPorModulo = async (idModulo: number): Promise<ISesion[]> => {
  try {
    const response = await api.get(`/api/VTAModVentaModulo/ObtenerSesiones/${idModulo}`);
    
    // Validar que la respuesta tenga estructura correcta
    if (response.data && response.data.sesiones && Array.isArray(response.data.sesiones)) {
      return response.data.sesiones;
    }
    
    // Si no tiene la estructura esperada, retornar array vacío
    console.warn("Respuesta inesperada del endpoint de sesiones:", response.data);
    return [];
    
  } catch (error: any) {
    // Manejar errores 400 y otros
    if (error.response?.status === 400 && error.response?.data?.mensaje) {
      console.error("Error al obtener sesiones:", error.response.data.mensaje);
    }
    throw error;
  }
};