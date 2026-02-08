import api from "./api";
import type { TipoDTO, TipoFiltroDTO, TipoResponse } from "../interfaces/ITipo";

export interface MetodoPago {
    id: number;
    nombre: string;
    activo: boolean;
}

interface MetodoPagoResponse {
    metodoPagos: MetodoPago[];
}

export const obtenerTipos = async (categoria: string): Promise<TipoDTO[]> => {
    const filtro: TipoFiltroDTO = { categoria };
    const response = await api.post<TipoResponse>("/api/TIPModType/ObtenerTipos", filtro);
    return response.data.tipos;
};

export const obtenerMetodosPago = async (): Promise<MetodoPago[]> => {
    const response = await api.get<MetodoPagoResponse>("/api/VentaMetodoPago/activos");
    return response.data.metodoPagos;
};
