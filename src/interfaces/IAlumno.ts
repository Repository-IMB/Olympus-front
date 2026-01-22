/**
 * Interface for Student data from API
 */
export interface IAlumno {
    idAlumno: number;
    nombreCompleto: string;
    pais: string;
    dni: string;
    cargo: string;
    correo: string;
    formularioEstado: boolean;
    pagoEstado: boolean;
    productos: string[];
    idProducto: number[];
    modulos: string[];
    idModulo: number[];
}

/**
 * API Response for paginated students
 */
export interface IAlumnosPaginadosResponse {
    alumnos: IAlumno[];
    totalRegistros: number;
    codigo: string;
    mensaje: string;
}

/**
 * Filters for fetching students
 */
export interface IAlumnosFiltros {
    idProducto?: number | null;
    idModulo?: number | null;
    idPais?: number | null;
    page?: number;
    pageSize?: number;
    search?: string | null;
    fechaInicio?: string | null;
}
