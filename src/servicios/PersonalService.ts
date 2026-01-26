import api from "./api";
import type { Personal, PersonalPaginadoResponse, PersonalFiltros } from "../interfaces/IPersonal";

/**
 * Fetches paginated personal data from the API
 */
export const obtenerPersonalPaginado = async (
    filtros: PersonalFiltros = {}
): Promise<PersonalPaginadoResponse> => {
    // Build request body with only non-null values
    const body: Record<string, any> = {};

    if (filtros.page != null) body.page = filtros.page;
    if (filtros.pageSize != null) body.pageSize = filtros.pageSize;
    if (filtros.search) body.search = filtros.search;
    if (filtros.pais) body.pais = filtros.pais;
    if (filtros.sede) body.sede = filtros.sede;
    if (filtros.carrera) body.carrera = filtros.carrera;
    if (filtros.fechaInicio) body.fechaInicio = filtros.fechaInicio;
    if (filtros.fechaFin) body.fechaFin = filtros.fechaFin;

    console.log("🔍 Personal Filtros recibidos:", filtros);
    console.log("📤 Personal Body enviado a API:", body);

    const response = await api.post("api/EMPModEmpleado/ObtenerPersonalPaginado", body);

    return response.data;
};

/**
 * Fetches single personal record by ID
 */
// export const obtenerPersonalPorId = async (id: number): Promise<Personal> => {
//     const response = await api.get(`/api/RRHHModPersonal/ObtenerPorId/${id}`);
//     return response.data?.personal ?? response.data;
// };
