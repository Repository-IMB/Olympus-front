export type Evento = {
  id: number;
  tipo: "create" | "update" | "assignment";
  detalle: string;
  fechaHora: string;
  responsable?: string;
};
