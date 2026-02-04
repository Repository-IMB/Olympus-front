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
    telefono: string;
    formularioEstado: boolean;
    areaTrabajo: string;
    industria: string;
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

/**
 * Payload for creating a new student
 */
export interface IAlumnoInsertar {
    idProducto: number;
    idModulo: number | null;
    nombres: string;
    apellidos: string;
    dni: string;
    fechaNacimiento: string | null;
    idPais: number;
    correo: string;
    celular: string;
    prefijoCelular: string;
    prefijo: string | null;
    idTipoIngles: number | null;
    idTipoTec: number | null;
    idTipoFacturacion: number | null;
    areaFormacion: string;
    cargo: string;
    empresa: string | null;
    industria: string;
    razonSocial: string | null;
    numeroFactura: string | null;
    estadoFormulario: boolean;
    estadoPago: boolean;
    usuarioAlumno: string | null;
    passwordAlumno: string | null;
    usuarioCreacion: string;
}
