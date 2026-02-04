import api from "./api";
import type { Personal, PersonalPaginadoResponse, PersonalFiltros, PersonalOpcionesResponse } from "../interfaces/IPersonal";
import type { PersonalDetalle } from "../interfaces/IPersonal";

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

    const response = await api.post("/api/EMPModEmpleado/ObtenerPersonalPaginado", body);

    return response.data;
};

/**
 * Fetches detailed personal data by ID
 */
export const obtenerPersonalPorId = async (id: number): Promise<PersonalDetalle> => {

    const response = await api.get(`/api/EMPModEmpleado/ObtenerPersonalPorId/${id}`);
    return response.data;
};

export const obtenerPersonalOpciones = async (
    filtros: PersonalFiltros = {}
): Promise<PersonalOpcionesResponse> => {
    const body: Record<string, any> = {};
    if (filtros.search) body.search = filtros.search;

    const response = await api.post("/api/EMPModEmpleado/ObtenerPersonalOpciones", body);

    return response.data;
};