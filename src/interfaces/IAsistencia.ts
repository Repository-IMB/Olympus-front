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
  // Registro de asistencia por fecha (clave: fecha en formato YYYY-MM-DD, valor: horas trabajadas o null si no asistió)
  asistencia: Record<string, number | null>;
}

export type TipoVista = "mes" | "semana" | "rango" | "historico";
