import api from "./api";
import type {
  SpeechDTO,
  SpeechRespuestaGenerica,
  CrearSpeechRequest,
  ActualizarSpeechRequest,
} from "../modelos/Speech";

const BASE_URL = "/api/VTAModSpeech";

interface ObtenerIdPersonalResponse {
  idAsesor: number | null;
  codigo: string;
  mensaje: string;
}

export const obtenerIdPersonal = async (): Promise<number | null> => {
  try {
    const response = await api.get<ObtenerIdPersonalResponse>(
      `${BASE_URL}/ObtenerIdPersonal`
    );
    const { codigo, idPersonal, mensaje } = response.data;

    if (codigo === "SIN ERROR") {
      return idPersonal!;
    }

    if (codigo === "ERROR CONTROLADO") {
      console.warn("No se pudo obtener IdAsesor:", mensaje);
      return null;
    }

    // ERROR_CRITICO u otro
    throw new Error(mensaje || "Error inesperado al obtener IdAsesor");
  } catch (error: any) {
    console.error("Error al obtener IdAsesor:", error);

    throw new Error(
      error?.response?.data?.mensaje ||
        error?.message ||
        "Error de comunicación con el servidor"
    );
  }
};

/**
 * Obtiene el speech de un asesor para un producto específico
 * Requiere IdPersonal e idProducto como parámetros explícitos
 */
export const obtenerSpeechPorAsesorYProducto = async (
  IdPersonal: number,
  idProducto: number
): Promise<SpeechDTO | null> => {
  try {
    const response = await api.get<SpeechDTO>(
      `${BASE_URL}/ObtenerPorPersonalYProducto/${IdPersonal}/${idProducto}`
    );
    return response.data;
  } catch (error: any) {
    // Si es 404, no existe speech para ese asesor y producto
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Obtiene el speech del asesor autenticado para un producto específico
 * El IdPersonal se obtiene automáticamente del token JWT en el backend
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
 * El IdPersonal se obtiene automáticamente del token JWT en el backend
 * Nota: Si se envía IdPersonal en el body, será ignorado por el backend
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
 * El IdPersonal se obtiene automáticamente del token JWT en el backend
 * Nota: Si se envía IdPersonal en el body, será ignorado por el backend
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
