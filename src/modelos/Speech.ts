// Interfaces para el módulo Speech

export interface SpeechDTO {
  id: number;
  idPersonal: number;
  idProducto: number;
  texto: string;
  estado: boolean;
  fechaCreacion: string;
  usuarioCreacion?: string;
  fechaModificacion?: string;
  usuarioModificacion?: string;
  PersonalNombre?: string;
  productoNombre?: string;
}

export interface SpeechRespuestaGenerica {
  codigo: "SIN_ERROR" | "ERROR_CONTROLADO" | "ERROR_CRITICO";
  mensaje: string;
}

/**
 * Request para crear un nuevo speech
 * Requiere idPersonal explícitamente en el body
 */
export interface CrearSpeechRequest {
  idPersonal: number;
  idProducto: number;
  texto: string;
  usuarioCreacion?: string;
}

/**
 * Request para actualizar un speech existente
 * Nota: idPersonal se obtiene automáticamente del token JWT en el backend
 */
export interface ActualizarSpeechRequest {
  id: number;
  idProducto: number;
  texto: string;
  usuarioModificacion?: string;
}

