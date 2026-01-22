import api from "./api";
import type { IAlumno, IAlumnosPaginadosResponse, IAlumnosFiltros } from "../interfaces/IAlumno";

export type { IAlumno, IAlumnosPaginadosResponse, IAlumnosFiltros };

/**
 * Fetches paginated students from the API
 */
export const obtenerAlumnosPaginados = async (
    filtros: IAlumnosFiltros = {}
): Promise<IAlumnosPaginadosResponse> => {
    // Build request body with only non-null values
    const body: Record<string, any> = {};

    if (filtros.idProducto != null) body.idProducto = filtros.idProducto;
    if (filtros.idModulo != null) body.idModulo = filtros.idModulo;
    if (filtros.idPais != null) body.idPais = filtros.idPais;
    if (filtros.page != null) body.page = filtros.page;
    if (filtros.pageSize != null) body.pageSize = filtros.pageSize;
    if (filtros.search) body.search = filtros.search;
    if (filtros.fechaInicio) body.fechaInicio = filtros.fechaInicio;

    const response = await api.post("/api/ALMModAlumno/ObtenerAlumnosPaginados", body);

    return response.data;
};

/**
 * Fetches a single student by ID
 */
export const obtenerAlumnoPorId = async (id: number): Promise<IAlumno> => {
    const response = await api.get(`/api/ALMModAlumno/ObtenerPorId/${id}`);
    return response.data?.alumno ?? response.data;
};

/**
 * Deletes a student by ID
 */
export const eliminarAlumno = async (id: number): Promise<void> => {
    await api.patch(`/api/ALMModAlumno/Eliminar/${id}`);
};
