import api from "./api";
import type { PermisoFiltroDTO, PermisoResumen, PERModPermisoDTORPT, TipoPermisoResponse, CrearPermisoDTO } from "../interfaces/IPermiso";

export const obtenerPermisosPaginados = async (
    filtros: PermisoFiltroDTO = {}
): Promise<PERModPermisoDTORPT> => {
    // Determine the base URL dynamically or use the configured one
    // Using simple POST as per AlumnoService example 
    const response = await api.post("/api/PERModPermiso/ObtenerPermisoPaginados", filtros);
    return response.data;
};

export const obtenerTipoPermisoOpciones = async (): Promise<TipoPermisoResponse> => {
    const response = await api.get("/api/PERModPermiso/ObtenerTipoPermisoOpciones");
    return response.data;
};

export const crearPermiso = async (datos: CrearPermisoDTO): Promise<PERModPermisoDTORPT> => {
    const response = await api.post("/api/PERModPermiso/Insertar", datos);
    return response.data;
};
