export interface Vacacion {
  id: number;
  pais: string;
  dni: string;
  apellidos: string;
  nombres: string;
  celular: string;
  vacaciones: number;
  primera: string;
  segunda: string;
  tercera: string;
  cuarta: string;
  correo: string;
  sede?: string;
  carrera?: string;
  tipoContrato?: string;
  tipoJornada?: string;
  area?: string;
  fechaNacimiento?: string;
  estado: boolean;
}
