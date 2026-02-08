export interface TipoDTO {
    id: number;
    nombre: string;
    descripcion?: string;
    categoria?: string;
}

export interface TipoResponse {
    tipos: TipoDTO[];
    codigo: string;
    mensaje: string;
}

export interface TipoFiltroDTO {
    categoria: string;
}
