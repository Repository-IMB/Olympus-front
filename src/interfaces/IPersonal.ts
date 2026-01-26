export interface Personal {
  idPersonal: number;
  pais: string;
  dni: string;
  apellidos: string;
  nombres: string;
  fechaNacimiento: string | null;
  correo: string;
  celular: string;
  direccion: string;
  distrito: string;
  carrera: string;
  nombreSede: string;
}

export interface PersonalPaginadoResponse {
  personal: Personal[];
  totalRegistros: number;
  codigo: string;
  mensaje: string;
}

export interface PersonalFiltros {
  search?: string;
  pais?: string;
  sede?: string;
  carrera?: string;
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
  pageSize?: number;
}
