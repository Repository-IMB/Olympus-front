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
  idModulo?: number;
  
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
  
  // 🟢 IMPORTANTE: Estos son los que usa el cálculo de fechas
  diasClase?: string;       // Ej: "1,3,5"
  detalleHorarios?: string; // 🟢 AGREGADO: Ej: "1@18:00@20:00|3@..."
  
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
  fechaFin?: string;            // 🟢 El dato real del backend
  fechaFinPorSesiones?: string; // Dato legacy (opcional)
  
  // Alias de campos (para compatibilidad con el SP)
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