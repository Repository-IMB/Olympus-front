import api from "./api";
import type {
  SpeechDTO,
  SpeechListaRespuesta,
  SpeechRespuestaGenerica,
  CrearSpeechRequest,
  ActualizarSpeechRequest,
} from "../modelos/Speech";

const BASE_URL = "/api/VTAModSpeech";

/**
 * Obtiene todos los speeches activos del sistema
 */
export const obtenerTodosSpeech = async (): Promise<SpeechListaRespuesta> => {
  const response = await api.get<SpeechListaRespuesta>(`${BASE_URL}/ObtenerTodos`);
  return response.data;
};

/**
 * Obtiene un speech por su ID
 */
export const obtenerSpeechPorId = async (id: number): Promise<SpeechDTO> => {
  const response = await api.get<SpeechDTO>(`${BASE_URL}/ObtenerPorId/${id}`);
  return response.data;
};

/**
 * Obtiene el speech del asesor autenticado para un producto específico
 * El idAsesor se obtiene automáticamente del token JWT en el backend
 * Este es el endpoint principal para el flujo de negocio
 */
export const obtenerSpeechPorProducto = async (
  idProducto: number
): Promise<SpeechDTO | null> => {
  try {
    const response = await api.get<SpeechDTO>(
      `${BASE_URL}/ObtenerPorProducto/${idProducto}`
    );
    return response.data;
  } catch (error: any) {
    // Si es 404, no existe speech para ese asesor y producto
    if (error?.response?.status === 404) {
      return null;
    }
    // Si es 401, el token es inválido o no contiene el ID del asesor
    if (error?.response?.status === 401) {
      console.error("Error de autenticación al obtener speech:", error);
      throw new Error("No se pudo obtener el ID del asesor del token");
    }
    throw error;
  }
};

/**
 * Crea un nuevo speech
 * El idAsesor se obtiene automáticamente del token JWT en el backend
 * Nota: Si se envía idAsesor en el body, será ignorado por el backend
 */
export const crearSpeech = async (
  data: CrearSpeechRequest
): Promise<SpeechRespuestaGenerica> => {
  try {
    const response = await api.post<SpeechRespuestaGenerica>(
      `${BASE_URL}/Crear`,
      data
    );
    return response.data;
  } catch (error: any) {
    // Si es 401, el token es inválido o no contiene el ID del asesor
    if (error?.response?.status === 401) {
      console.error("Error de autenticación al crear speech:", error);
      throw new Error("No se pudo obtener el ID del asesor del token");
    }
    throw error;
  }
};

/**
 * Actualiza un speech existente
 * El idAsesor se obtiene automáticamente del token JWT en el backend
 * Nota: Si se envía idAsesor en el body, será ignorado por el backend
 */
export const actualizarSpeech = async (
  data: ActualizarSpeechRequest
): Promise<SpeechRespuestaGenerica> => {
  try {
    const response = await api.put<SpeechRespuestaGenerica>(
      `${BASE_URL}/Actualizar`,
      data
    );
    return response.data;
  } catch (error: any) {
    // Si es 401, el token es inválido o no contiene el ID del asesor
    if (error?.response?.status === 401) {
      console.error("Error de autenticación al actualizar speech:", error);
      throw new Error("No se pudo obtener el ID del asesor del token");
    }
    throw error;
  }
};

/**
 * Elimina (lógicamente) un speech por ID
 */
export const eliminarSpeech = async (
  id: number
): Promise<SpeechRespuestaGenerica> => {
  const response = await api.delete<SpeechRespuestaGenerica>(
    `${BASE_URL}/Eliminar/${id}`
  );
  return response.data;
};
