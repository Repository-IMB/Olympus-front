export interface Permiso {
  id: number;
  pais: string;
  dni: string;
  apellidos: string;
  nombres: string;
  celular: string;
  cantidadPermisos: number;
  diasAcumulados: number;
  horasAcumuladas: number;
  horasAcumuladasRecuperadas: number;
  correo: string;
  sede?: string;
  carrera?: string;
  tipoContrato?: string;
  tipoJornada?: string;
  area?: string;
  fechaNacimiento?: string;
  estado: boolean;
}
