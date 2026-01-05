import api from "./api";
import type { IModulo } from "../interfaces/IModulo";

export type { IModulo };

export const baseUrl: string = (import.meta.env.VITE_API_URL as string) || "http://localhost:7020";

/** 🔹 Obtener todos los módulos */
export const obtenerModulos = async (): Promise<IModulo[]> => {
  const response = await api.get("/api/VTAModVentaModulo/ObtenerTodas");
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
  preserveSessions: boolean = false // ⬅️ Nuevo parámetro
): Promise<IModulo> => {
  const payload = {
    id,
    ...modulo,
    preserveSessions, // ⬅️ IMPORTANTE: Controla si se reemplazan las sesiones
    fechaModificacion: new Date().toISOString(),
    usuarioModificacion: "SYSTEM",
  };

  console.log('=== PAYLOAD COMPLETO ENVIADO AL PUT ===');
  console.log(JSON.stringify(payload, null, 2));
  console.log('=======================================');
  
  const response = await api.put("/api/VTAModVentaModulo/Actualizar", payload);
  return response.data;
};

/** 🔹 Eliminar módulo */
/* Todavía no se usa
export const eliminarModulo = async (id: number): Promise<void> => {
  await api.delete(`/api/VTAModVentaModulo/Eliminar/${id}`);
};
*/