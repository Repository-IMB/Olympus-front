export interface FeriadoDTO {
  id: number;
  nombre: string;
  fecha: string; // Recibirás ISO string del back
  paisISO: string;
  pais: string;
  anio: number;
  esRecurrente: boolean;
  estado: boolean;
}

export interface FeriadoVerificacionDTO {
  esFeriado: boolean;
  feriados: FeriadoDTO[];
}

// Helper para los códigos de país (opcional, pero útil para selects)
export const PAISES_LATAM = [
  { code: "MULTI", name: "Global / Varios" },
  { code: "AR", name: "Argentina" },
  { code: "BO", name: "Bolivia" },
  { code: "BR", name: "Brasil" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "EC", name: "Ecuador" },
  { code: "ES", name: "España" },
  { code: "MX", name: "México" },
  { code: "PE", name: "Perú" },
  { code: "PY", name: "Paraguay" },
  { code: "US", name: "Estados Unidos" },
  { code: "UY", name: "Uruguay" },
  { code: "VE", name: "Venezuela" },
];