// Interface for the Filter DTO (Request Body)
export interface PermisoFiltroDTO {
  page?: number;
  pageSize?: number;
  search?: string | null;
  idPais?: number | null;
  idSede?: number | null;
  carrera?: string | null;
  idTipoContrato?: number | null;
  idTipoJornada?: number | null;
  idAreaTrabajo?: number | null;
  fechaNacimientoDesde?: string | null;
  fechaNacimientoHasta?: string | null;
}

// Interface for the Data Item (Response Data)
export interface PermisoResumen {
  id: number;
  idPersonal: number;
  pais: string;
  dni: string;
  apellidos: string;
  nombres: string;
  celular: string;
  correo: string;
  sede: string | null;
  carrera: string | null;
  tipoContrato: string | null;
  tipoJornada: string | null;
  area: string | null;
  fechaNacimiento: string | null; // Date string
  tipoPermiso: string | null;
  fechaPermiso: string; // DateOnly string likely
  motivo: string;
  estadoSolicitud: number;

  // Metrics (single row)
  cantidadPermisos: number;
  diasAcumulados: number;
  horasAcumuladas: number;
  horasAcumuladasRecuperadas: number;

  estado: boolean;
}

// Interface for the API Response Wrapper
export interface PERModPermisoDTORPT {
  data: PermisoResumen[];
  total: number;
  codigo: string;
  mensaje: string;
}

// Old interface aliases for compatibility if needed (can be removed later)
export type Permiso = PermisoResumen;


// Interface for TipoPermiso dropdown options
export interface TipoPermiso {
  idTipoPermiso: number;
  nombre: string;
  codigo: string;
}

// Interface for the API Response for TipoPermiso
export interface TipoPermisoResponse {
  tiposPermiso: TipoPermiso[];
  codigo: string;
  mensaje: string;
}

// Interface for Creating a Permission (DTO matches SP params)
export interface CrearPermisoDTO {
  idPersonal: number;
  idTipoPermiso: number;
  motivo: string;
  modalidadGestion: string;
  fechaPermiso: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm:ss
  horaFin: string; // HH:mm:ss
  tratamientoHoras?: string;
  fechaRecuperacionInicio?: string; // YYYY-MM-DD
  fechaRecuperacionFin?: string; // YYYY-MM-DD
  horarioRecuperacion?: string;
  usuarioCreacion: string;
}
