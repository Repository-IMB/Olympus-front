import api from "./api";
import type { Departamento } from "../interfaces/IDepartamento";

export type { Departamento };

/**
 * Obtiene todos los departamentos
 */

export async function obtenerDepartamentos(): Promise<Departamento[]> {
  try {
    const response = await api.get("/api/VTAModVentaDepartamento/ObtenerTodas");
    return response.data?.departamentos ?? response.data ?? [];
  } catch (err: any) {
    if (err?.response?.status === 401) {
      throw err;
    }
    throw err;
  }
}
/**
 * Crea un nuevo departamento
 */
export const crearDepartamento = async (departamento: {
  nombre: string;
  descripcion: string | null;
}): Promise<Departamento> => {
  try {
    const payload = {
      nombre: departamento.nombre,
      descripcion: departamento.descripcion,
      estado: true,
      fechaCreacion: new Date().toISOString(),
      usuarioCreacion: "SYSTEM",
    };

    const response = await api.post(
      "/api/VTAModVentaDepartamento/Insertar",
      payload
    );

    return response.data;
  } catch (error) {
    console.error("Error al crear departamento:", error);
    throw error;
  }
};


/**
 * Actualiza un departamento existente
 */
export const actualizarDepartamento = async (
  id: number, 
  departamento: { 
    nombre: string; 
    descripcion: string | null;
  },
  departamentoOriginal: Departamento
): Promise<Departamento> => {
  try {
    const payload = {
      id: id,
      nombre: departamento.nombre,
      descripcion: departamento.descripcion,
      estado: departamentoOriginal.estado,
      idMigracion: departamentoOriginal.idMigracion || 0,
      fechaCreacion: departamentoOriginal.fechaCreacion,
      usuarioCreacion: departamentoOriginal.usuarioCreacion,
      fechaModificacion: new Date().toISOString(),
      usuarioModificacion: "SYSTEM"
    };

    console.log('Actualizando departamento:', payload);

    const response = await api.put(
      "/api/VTAModVentaDepartamento/Actualizar",
      payload
    );

    console.log('✅ Respuesta exitosa:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error al actualizar departamento:', error);
    console.error('Detalles:', error.response?.data);
    throw error;
  }
};

/**
 * Elimina un departamento
 */
export const eliminarDepartamento = async (id: number): Promise<void> => {
  try {
    const response = await api.delete(
      `/api/VTAModVentaDepartamento/Eliminar/${id}`
    );
    
    return response.data;
  } catch (error: any) {
    console.error("Detalles:", error.response?.data);
    throw error;
  }
};

export const obtenerDepartamentoPorId = async (
  id: number
): Promise<Departamento> => {
  try {
    const response = await api.get<Departamento>(
      `/api/VTAModVentaDepartamento/ObtenerPorId/${id}`
    );

    return response.data;
  } catch (error: any) {
    console.error("Error al obtener departamento por ID:", error);
    console.error("Detalles:", error.response?.data);
    throw error;
  }
};