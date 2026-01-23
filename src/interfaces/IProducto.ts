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

  modalidad: string;

  linkExcel: string;
  linkPagWeb: string;

  frasePrograma: string;

  horasAsincronicas: number;
  horasSincronicas: number;

  idMigracion: number | null;

  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string | null;
  usuarioModificacion: string | null;

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
