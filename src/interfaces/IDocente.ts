export interface Docente {
  id: number;
  idPersona: number;
  nombres: string;
  apellidos: string;
  prefijoPaisCelular: string;
  idPais: number;
  celular: string;
  correo: string;
  prefijoDocente: string;
  tituloProfesional: string;
  especialidad: string;
  logros: string;
  areaTrabajo: string;
  industria: string;
  estado: boolean;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion?: string;
  usuarioModificacion?: string | null;
}
