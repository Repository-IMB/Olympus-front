// Interfaz para Sesión según VTAModVentaSesionDTO del backend
export interface ISesion {
  id: number;
  nombreSesion: string;
  idModulo: number;
  idTipoSesion?: number | null;
  tipoSesion: string;
  horaInicio?: string | null; // TimeSpan convertido a string (HH:MM:SS)
  horaFin?: string | null;    // TimeSpan convertido a string (HH:MM:SS)
  diaSemana?: number | null;  // 1-7 (Lunes-Domingo)
  esAsincronica: boolean;
  fechaInicioModulo?: Date | string | null;
  nombreDiaSemana: string;
  estado: boolean;
  fechaCreacion: Date | string;
}
