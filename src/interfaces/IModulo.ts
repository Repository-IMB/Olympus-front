// Interfaz para Sesión
export interface ISesion {
  id: number;
  idEstructuraCurricularModulo: number;
  nombre: string;
  numeroSesiones: number;
  idTipoSesion: number;
  tipoSesionNombre: string;
  idModulo: number;
  estado: boolean;
  idMigracion?: number | null;
  fechaCreacion: string;
  fechaInicio?: string;
  usuarioCreacion: string;
  fechaModificacion?: string | null;
  usuarioModificacion?: string | null;
}

// Interfaz para Horario de Sesión
export interface ISesionHorario {
  id: number;
  idSesion: number;
  diaSemana: number;
  horaInicio: string | null;
  horaFin: string | null;
  esAsincronica: boolean;
  estado: boolean;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion?: string | null;
  usuarioModificacion?: string | null;
}

export interface IModulo {
  // Campos básicos
  id?: number;
  nombre: string;
  codigo?: string | null;
  descripcion?: string;
  duracionHoras?: number;
  tituloCertificado?: string;
  estado?: boolean;
  
  // Campos de auditoría
  fechaCreacion?: string;
  usuarioCreacion?: string;
  fechaModificacion?: string;
  usuarioModificacion?: string | null;
  
  // Campos de programación
  fechaPresentacion?: string;
  horaInicioSync?: string;
  horaFinSync?: string;
  numeroSesiones?: number;
  numeroSesionesAsincronicas?: number;
  diasClase?: string;
  diasSemana?: string;
  
  // Campos de relación con producto
  productosCodigoLanzamiento?: string;
  productoId?: number;
  productoNombre?: string;
  
  // Campos de estructura curricular
  estructuraCurricularId?: number;
  estructuraCurricularNombre?: string;
  estructuraCurricularDescripcion?: string;
  estructuraCurricularModuloId?: number;
  orden?: number;
  sesiones?: ISesion[];
  observaciones?: string;
  sesionesSincronicas?: number;
  
  // Campos de docente
  idDocente?: number;
  docenteNombre?: string;
  
  // Campos de fechas calculadas
  fechaInicio?: string;
  fechaFinPorSesiones?: string;
  
  // Alias de campos (para compatibilidad)
  moduloId?: number;
  moduloNombre?: string;
  moduloCodigo?: string | null;
  moduloDescripcion?: string;
  moduloDuracionHoras?: number;
  
  // Relaciones con sesiones y horarios
  sesionesHorarios?: ISesionHorario[];
  horasAsincronicas?: number;
  horasSincronicas?: number;
  preserveSessions?: boolean | null;
}