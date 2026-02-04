import type { IModulo } from "./IModulo";

export interface Estadistica {
  id?: number;
  texto: string;
  orden: number;
  estado: boolean;
}

export interface Objetivo {
  id?: number;
  texto: string;
  orden: number;
  estado: boolean;
}

export interface TipoEstadoProducto {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  estado: boolean;
}

export interface Producto {
  id: number;
  nombre: string;
  codigoLanzamiento: string;

  fechaInicio: string;
  fechaPresentacion: string;
  fechaFin: string | null;

  datosImportantes: string;
  estado: boolean;
  costoBase: number;

  codigoLinkedin: string;
  brochure: string;

  estadoProductoTipoId: number | null;
  estadoProductoTipoNombre: string;

  idDepartamento: number | null;
  departamentoNombre: string;

  personalNombre?: string;
  personalEmail?: string;

  modalidad: string;

  linkExcel: string;
  linkPagWeb: string;

  frasePrograma: string;

  personalCreacion?: number | null;

  horasAsincronicas: number;
  horasSincronicas: number;

  idMigracion: number | null;

  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string | null;
  usuarioModificacion: string | null;
  modulos?: IModulo[];

  estadisticas?: Estadistica[];
  objetivos?: Objetivo[];
}

export interface ProductoOption {
  idProducto: number;
  nombre: string;
  codigoLanzamiento: string;
}

export interface ProductoOptionsResponse {
  productos: ProductoOption[];
}

export interface ProductoFiltros {
  search?: string;
}
