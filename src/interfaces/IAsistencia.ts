/**
 * Personal attendance record for display in table
 */
export interface AsistenciaPersonal {
  id: number;
  pais: string;
  dni: string;
  apellidos: string;
  nombres: string;
  tipoJornada: string;
  correo: string;
  sede: string;
  area: string;
  fechaNacimiento?: string;
  totalHoras: number;
  // Attendance record by date (key: YYYY-MM-DD, value: hours worked or null)
  asistencia: Record<string, number | null>;
}

export type TipoVista = "mes" | "semana" | "rango" | "historico";

/**
 * Filters for fetching attendance records
 */
export interface IAsistenciaFiltros {
  search?: string;
  idArea?: number | null;
  idSede?: number | null;
  idTurno?: number | null;
  fechaInicio: string;  // YYYY-MM-DD
  fechaFin: string;     // YYYY-MM-DD
  page?: number;
  pageSize?: number;
}

/**
 * API Response for paginated attendance
 */
export interface IAsistenciaPaginadaResponse {
  total: number;
  personal: AsistenciaPersonal[];
  codigo: string;
  mensaje?: string;
}
