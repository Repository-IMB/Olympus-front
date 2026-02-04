import api from "./api";
import type { IModulo } from "../interfaces/IModulo";
import type { ISesion } from "../interfaces/ISesion";

export type { IModulo };
export type { ISesion };

export const baseUrl: string = (import.meta.env.VITE_API_URL as string) || "http://localhost:7020";

export interface TipoSesion {
  id: number;
  nombre: string;
}

export const obtenerTiposSesion = async (): Promise<TipoSesion[]> => {
  try {
    const response = await api.get<TipoSesion[]>("/api/VTAModVentaSesion/ObtenerTiposSesion");
    return response.data;
  } catch (error) {
    console.error("Error al obtener tipos de sesión", error);
    return [];
  }
}

/** 🔹 Obtener todos los módulos con Paginación */
export const obtenerModulos = async (
  search: string = "", 
  page: number = 1, 
  pageSize: number = 10,
  producto: string = "", 
  fechaDesde: string = "", 
  fechaHasta: string = "",
  sortField: string = "Id",
  sortOrder: string = "DESC"
): Promise<any> => { 
  const response = await api.get("/api/VTAModVentaModulo/ObtenerTodas", {
    params: {
      search,
      page,
      pageSize,
      producto,
      fechaDesde,
      fechaHasta,
      sortField,
      sortOrder
    }
  });

  return response.data;
};

/** 🔹 Obtener módulo por ID */
export const obtenerModuloPorId = async (id: number): Promise<IModulo> => {
  const response = await api.get(`/api/VTAModVentaModulo/ObtenerPorId/${id}`);
  return response.data;
};

/** 🔹 Obtener módulos por producto */
export const obtenerModulosPorProducto = async (productoId: number): Promise<IModulo[]> => {
  const response = await api.get(`/api/VTAModVentaModulo/ObtenerModulosPorProducto/${productoId}`);
  return response.data;
};

/** 🔹 Crear módulo */
export const crearModulo = async (modulo: Partial<IModulo>): Promise<IModulo> => {
  const payload = {
    ...modulo,
    estado: true,
    fechaCreacion: new Date().toISOString(),
    usuarioCreacion: "SYSTEM",
  };

  const response = await api.post("/api/VTAModVentaModulo/Insertar", payload);
  return response.data;
};

/** 🔹 Actualizar módulo */
export const actualizarModulo = async (
  id: number,
  modulo: Partial<IModulo>,
  preserveSessions: boolean = false
): Promise<IModulo> => {
  // ⚠️ NO duplicar campos que ya vienen en 'modulo'
  const payload = {
    ...modulo,  // ⬅️ Esto ya incluye todo lo necesario
    id,         // ⬅️ Asegurar que el ID esté presente
    preserveSessions,
  };
  
  const response = await api.put("/api/VTAModVentaModulo/Actualizar", payload);
  return response.data;
};

// Definimos la interfaz
export interface ProductoAsociadoModulo {
  idProducto: number;
  nombre: string;
  codigoEdicion: string;
  edicionSesion: string;
  estadoProducto: string;
  orden: number;
}

// Función del servicio
export const obtenerProductosPorModulo = async (idModulo: number): Promise<ProductoAsociadoModulo[]> => {
  const response = await api.get(`/api/VTAModVentaModulo/ObtenerProductosAsociados/${idModulo}`);
  return response.data;
};

export const obtenerCodigosFiltroModulo = async (): Promise<string[]> => {
  try {
    const response = await api.get("/api/VTAModVentaModulo/ObtenerCodigosFiltro");
    return response.data;
  } catch (error) {
    console.error("Error obteniendo códigos de filtro:", error);
    return [];
  }
};

/** 🔹 Eliminar módulo (Baja lógica) */
export const eliminarModulo = async (id: number): Promise<void> => {
  try {
    const response = await api.delete(`/api/VTAModVentaModulo/Eliminar/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error al eliminar módulo:", error);
    throw error;
  }
};

/** 🔹 Asignar docente a módulo */
export const asignarDocenteAModulo = async (
  idModulo: number,
  idDocente: number | null // 🟢 CAMBIO 1: Permitir null para desasignar
): Promise<{ codigo: string; mensaje: string }> => {
  
  const payload = {
    IdModulo: idModulo,   // 🟢 CAMBIO 2: Mayúscula inicial (Igual al DTO C#)
    IdDocente: idDocente  // 🟢 Mayúscula inicial
  };

  const response = await api.post(
    "/api/VTAModVentaModulo/AsignarDocente",
    payload
  );

  return response.data;
};

/** 🔹 Obtener sesiones de un módulo */
export const obtenerSesionesPorModulo = async (idModulo: number): Promise<ISesion[]> => {
  try {
    // 🟢 URL Correcta apuntando al controlador de Módulos
    const response = await api.get(`/api/VTAModVentaModulo/ObtenerSesiones/${idModulo}`);
    
    // 🟢 Extraemos el array de la propiedad correcta
    const listaSesiones = response.data.sesiones || response.data.Sesiones || [];

    if (!Array.isArray(listaSesiones)) {
        console.warn("La respuesta no contiene un array de sesiones válido:", response.data);
        return [];
    }

    const sesiones = listaSesiones.map((sesion: any) => ({
      id: sesion.id,
      idModulo: sesion.idModulo,
      nombreSesion: sesion.nombreSesion || sesion.nombre,
      
      // Mapeo robusto de fechas
      fecha: sesion.fecha || sesion.fechaSesion || sesion.fechaClase,
      
      horaInicio: sesion.horaInicio,
      horaFin: sesion.horaFin,
      tipoSesion: sesion.tipoSesion || sesion.tipo,
      idTipoSesion: sesion.idTipoSesion, // Agregado por si acaso
      esAsincronica: sesion.esAsincronica,
      
      nombreDiaSemana: sesion.nombreDiaSemana,
      diaSemana: sesion.diaSemana, // Agregado por si acaso
      estado: sesion.estado,

      // 🟢 CORRECCIÓN: Agregar campos de auditoría requeridos por ISesion
      fechaCreacion: sesion.fechaCreacion,
      usuarioCreacion: sesion.usuarioCreacion,
      fechaModificacion: sesion.fechaModificacion,
      usuarioModificacion: sesion.usuarioModificacion
    }));
    
    return sesiones;
  } catch (error) {
    console.error("Error en obtenerSesionesPorModulo:", error);
    throw error;
  }
};

export const cancelarSesion = async (idSesion: number) => {
  try {
    const response = await api.post(`/api/VTAModVentaSesion/CancelarSesion/${idSesion}`);
    return response.data;
  } catch (error) {
    console.error("Error al cancelar sesión:", error);
    throw error;
  }
};

export const descargarPDFModulo = async (idModulo: number): Promise<void> => {
  try {
    const response = await api.get(`/api/VTAModVentaModulo/GenerarPDF/${idModulo}`, {
      responseType: 'blob',
    });

    // Crear un blob con el PDF
    const blob = new Blob([response.data], { type: 'application/pdf' });
    
    // Crear URL temporal
    const url = window.URL.createObjectURL(blob);
    
    // Crear elemento <a> temporal para descarga
    const link = document.createElement('a');
    link.href = url;
    
    // Intentar obtener el nombre del archivo del header Content-Disposition
    const contentDisposition = response.headers['content-disposition'];
    let fileName = `Modulo_${idModulo}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1];
      }
    }
    
    link.download = fileName;
    
    // Trigger descarga
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
  } catch (error: any) {
    console.error('Error al descargar PDF:', error);
    throw new Error(
      error?.response?.data?.message || 'Error al generar el PDF del módulo'
    );
  }
};