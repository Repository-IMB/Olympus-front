export interface Departamento {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  idMigracion: number | null;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string | null;
  usuarioModificacion: string | null;
}
