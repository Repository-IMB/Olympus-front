export interface Contrato {
  id: number;
  pais: string;
  dni: string;
  apellidos: string;
  nombres: string;
  celular: string;
  tipoContrato: string;
  tipoJornada: string;
  turnoTrabajo: string;
  area: string;
  sede: string;
  fechaIngreso: string;
  inicioContrato: string;
  finContrato: string;
  tiempoServicio: string;
  mesesTrabajados: number;
  fechaSalida: string;
  motivoSalida: string;
  correo: string;
  carrera?: string;
  estado: boolean;
}
