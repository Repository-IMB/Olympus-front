import api from "./api";
import type {
    AsistenciaPersonal,
    IAsistenciaFiltros,
    IAsistenciaPaginadaResponse,
    IEstadoBotonesResponse,
} from "../interfaces/IAsistencia";

export type { AsistenciaPersonal, IAsistenciaFiltros, IAsistenciaPaginadaResponse };

/**
 * Fetches paginated attendance records from the API
 */
export const obtenerAsistenciaPaginado = async (
    filtros: IAsistenciaFiltros
): Promise<IAsistenciaPaginadaResponse> => {
    // Build request body
    const body: Record<string, any> = {
        fechaInicio: filtros.fechaInicio,
        fechaFin: filtros.fechaFin,
        page: filtros.page ?? 1,
        pageSize: filtros.pageSize ?? 10,
    };

    if (filtros.search) body.search = filtros.search;
    if (filtros.idArea != null && filtros.idArea !== 0) body.idArea = filtros.idArea;
    if (filtros.idSede != null && filtros.idSede !== 0) body.idSede = filtros.idSede;
    if (filtros.idTurno != null && filtros.idTurno !== 0) body.idTurno = filtros.idTurno;

    const response = await api.post("/api/ASTModAsistencia/ObtenerAsistenciaPaginado", body);

    // Map response to match frontend interface
    const data = response.data;

    // Transform backend response to frontend format
    const personal: AsistenciaPersonal[] = (data.personal || data.data || []).map((item: any) => ({
        id: item.idPersonal,
        pais: item.pais || "",
        dni: item.dni || "",
        apellidos: item.apellidos || "",
        nombres: item.nombres || "",
        tipoJornada: item.tipoJornada || "",
        correo: item.correo || "",
        sede: item.sede || "",
        area: item.area || "",
        totalHoras: item.totalHoras || 0,
        asistencia: item.asistencia || {},
    }));

    return {
        total: data.total || 0,
        personal,
        codigo: data.codigo || "SIN_ERROR",
        mensaje: data.mensaje,
    };
};

/**
 * Response from attendance marking endpoints
 */
export interface IMarcarAsistenciaResponse {
    codigo: string;
    mensaje?: string;
    status?: string;
    personal?: string;
    horaMarcada?: string;
    condicion?: string;
    horasExtra?: number;
}

/**
 * Clock In - Marcar Entrada
 */
const getTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Clock In - Marcar Entrada
 */
export const marcarEntrada = async (dni: string): Promise<IMarcarAsistenciaResponse> => {
    const response = await api.post("/api/ASTModAsistencia/MarcarIngreso", { dni, timeZone: getTimeZone() });
    return response.data;
};

/**
 * Start Lunch - Iniciar Almuerzo
 */
export const marcarInicioAlmuerzo = async (dni: string): Promise<IMarcarAsistenciaResponse> => {
    const response = await api.post("/api/ASTModAsistencia/MarcarInicioAlmuerzo", { dni, timeZone: getTimeZone() });
    return response.data;
};

/**
 * End Lunch - Fin Almuerzo
 */
export const marcarFinAlmuerzo = async (dni: string): Promise<IMarcarAsistenciaResponse> => {
    const response = await api.post("/api/ASTModAsistencia/MarcarFinAlmuerzo", { dni, timeZone: getTimeZone() });
    return response.data;
};

/**
 * Clock Out - Marcar Salida
 */
/**
 * Clock Out - Marcar Salida
 */
export const marcarSalida = async (dni: string): Promise<IMarcarAsistenciaResponse> => {
    const response = await api.post("/api/ASTModAsistencia/MarcarSalida", { dni, timeZone: getTimeZone() });
    return response.data;
};

/**
 * Response for button state check
 */


/**
 * Get Button State - Obtener Estado de Botones
 */
export const obtenerEstadoBotones = async (dni: string): Promise<IEstadoBotonesResponse> => {
    // Pass timezone as query param since it's a GET request
    const response = await api.get(`/api/ASTModAsistencia/ObtenerEstadoBotones/${dni}?timeZone=${encodeURIComponent(getTimeZone())}`);
    return response.data;
};
