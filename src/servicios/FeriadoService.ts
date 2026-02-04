import api from "./api";
import moment from "moment";
// Importamos usando 'type' para evitar el error de verbatimModuleSyntax
import type { FeriadoDTO, FeriadoVerificacionDTO } from "../interfaces/IFeriado";

export const verificarFeriado = async (
  fecha: string | Date, 
  paisISO?: string
): Promise<FeriadoVerificacionDTO> => {
  const fechaStr = moment(fecha).format("YYYY-MM-DD");
  
  const params: any = { fecha: fechaStr };
  if (paisISO) params.paisISO = paisISO;

  // 🟢 AGREGADO /api AL INICIO
  const response = await api.get<FeriadoVerificacionDTO>("/api/VTAModVentaFeriado/VerificarFecha", {
    params
  });
  return response.data;
};

export const obtenerFeriadosRango = async (
  fechaInicio: string | Date,
  fechaFin: string | Date,
  paisISO?: string | null
): Promise<FeriadoDTO[]> => {
  const iniStr = moment(fechaInicio).format("YYYY-MM-DD");
  const finStr = moment(fechaFin).format("YYYY-MM-DD");

  const params: any = { fechaInicio: iniStr, fechaFin: finStr };
  if (paisISO) params.paisISO = paisISO;

  // 🟢 AGREGADO /api AL INICIO
  const response = await api.get<FeriadoDTO[]>("/api/VTAModVentaFeriado/ObtenerRango", {
    params
  });
  return response.data;
};

export const esFeriadoSimple = async (
  fecha: string | Date, 
  paisISO?: string
): Promise<boolean> => {
  const fechaStr = moment(fecha).format("YYYY-MM-DD");
  
  const params: any = { fecha: fechaStr };
  if (paisISO) params.paisISO = paisISO;

  // 🟢 AGREGADO /api AL INICIO
  const response = await api.get<{ esFeriado: boolean }>("/api/VTAModVentaFeriado/EsFeriado", {
    params
  });
  return response.data.esFeriado;
};