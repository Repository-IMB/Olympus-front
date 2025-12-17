export interface Lead {
  fechaCreacion: string;
  id: number;
  codigoLanzamiento: string;
  codigoLinkedin: string;
  nombre: string;
  asesor: string;
  estado: string;
  origen: string;
  pais: string;
  fechaFormulario: string;
  correo?: string; // Opcional para compatibilidad con datos antiguos
}
