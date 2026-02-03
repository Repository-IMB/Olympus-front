export interface Personal {
  id: number;
  pais: string;
  dni: string;
  apellidos: string;
  nombres: string;
  fechaNacimiento: string;
  correo: string;
  celular: string;
  direccion: string;
  distrito: string;
  carrera: string;
  sede: string;
  tipoContrato?: string;
  tipoJornada?: string;
  area?: string;
  estado: boolean;
}
