import api from "./api";
import type { Docente } from "../interfaces/IDocente";

export type { Docente };

export const baseUrl: string = (import.meta.env.VITE_API_URL as string) || "http://localhost:7020";

/** 🔹 Obtener todos los docentes */

export const obtenerDocentes = async (): Promise<Docente[]> => {
  const response = await api.get("/api/VTAModVentaDocente/ObtenerTodas");
  return response.data.docentes;
};

/** 🔹 Obtener docente por ID */

export const obtenerDocentePorId = async (id: number): Promise<Docente> => {
  const response = await api.get(`/api/VTAModVentaDocente/ObtenerPorId/${id}`);
  return response.data;
};

/** 🔹 Crear docente */

export const crearDocente = async (docente: any): Promise<Docente> => {
  const payload = {
    ...docente,
    estado: true,
    fechaCreacion: new Date().toISOString(),
    usuarioCreacion: "SYSTEM",
  };

  const response = await api.post(
    "/api/VTAModVentaDocente/Insertar",
    payload
  );

  return response.data;
};

/** 🔹 Actualizar docente */

export const actualizarDocente = async (
  id: number,
  docente: any,
  docenteOriginal: Docente
): Promise<Docente> => {
  const payload = {
    ...docenteOriginal,
    ...docente,
    id,
    fechaModificacion: new Date().toISOString(),
    usuarioModificacion: "SYSTEM",
  };

  const response = await api.put(
    "/api/VTAModVentaDocente/Actualizar",
    payload
  );

  return response.data;
};

/** 🔹 Eliminar docente (Baja Lógica) */
export const eliminarDocente = async (id: number): Promise<void> => {
  await api.delete(`/api/VTAModVentaDocente/Eliminar/${id}`);
};
