import api from "./api";

export interface AsignarModuloDTO {
  idProducto: number;
  idModulo: number;
  usuarioCreacion?: string;
}

export interface ModuloAsignadoDTO {
  id: number;
  idEstructuraCurricular: number;
  idModulo: number;
  orden: number | null;
  sesiones: number | null;
  duracionHoras: number | null;
  observaciones: string | null;
  estado: boolean;
  fechaCreacion: string;
  usuarioCreacion: string;
  moduloNombre: string;
  moduloCodigo: string | null;
}

export interface AsignarModuloResponse {
  codigo: string;
  mensaje: string;
  moduloAsignado: ModuloAsignadoDTO | null;
}

/** 🔹 Asignar módulo a producto */
export const asignarModuloAProducto = async (
  idProducto: number,
  idModulo: number
): Promise<AsignarModuloResponse> => {
  const payload: AsignarModuloDTO = {
    idProducto,
    idModulo,
    usuarioCreacion: "SYSTEM"
  };

  const response = await api.post(
    "/api/VTAModVentaEstructuraCurricularModulo/AsignarModulo",
    payload
  );

  return response.data;
};

/** 🔹 Desasignar módulo de producto */
export const desasignarModuloDeProducto = async (
  idEstructuraCurricularModulo: number
): Promise<{ codigo: string; mensaje: string }> => {
  const response = await api.delete(
    `/api/VTAModVentaEstructuraCurricularModulo/DesasignarModulo/${idEstructuraCurricularModulo}`
  );

  return response.data;
};

export const asignarDocenteAModulo = async (
  idEstructuraCurricularModulo: number,
  idDocente: number
): Promise<{ codigo: string; mensaje: string }> => {
  const payload = {
    idEstructuraCurricularModulo,
    idDocente
  };

  // Ajusta la URL si tu controlador tiene otro prefijo, pero basado en tu contexto es este:
  const response = await api.post(
    "/api/VTAModVentaEstructuraCurricularModulo/AsignarDocente",
    payload
  );

  return response.data;
};