import api from "./api";
import type { Estadistica, Objetivo, TipoEstadoProducto, Producto } from "../interfaces/IProducto";

export type { Estadistica, Objetivo, TipoEstadoProducto, Producto };

export interface PersonalCombo {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
}

export const baseUrl: string =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:7020";

export const obtenerProductos = async (
  search: string = "",
  page: number = 1,
  pageSize: number = 10,
  estadoProductoId: number | null = null,
  idDepartamento: number | null = null,
  idResponsable: number | null = null,
  sortField: string = "Nombre",
  sortOrder: string = "ASC"
) => {
  
  const endpoint = "/api/VTAModVentaProducto/ObtenerTodas";

  const response = await api.get(endpoint, {
    params: {
      search,
      page,
      pageSize,
      estadoProductoId: estadoProductoId,
      idDepartamento,
      idResponsable, 
      sortField,
      sortOrder
    },
  });
  return response.data; 
};

export const obtenerPersonalDesarrollo = async (): Promise<PersonalCombo[]> => {
  try {
    const response = await api.get("/api/VTAModVentaProducto/ObtenerPersonalDesarrollo");
    return response.data;
  } catch (error) {
    console.error("Error obteniendo personal:", error);
    return [];
  }
};

/* =========================
   OBTENER TIPOS ESTADO PRODUCTO
========================= */
export const obtenerTiposEstadoProducto = async (): Promise<TipoEstadoProducto[]> => {
  try {
    const response = await api.get(
      "/api/VTAModVentaDocente/ObtenerTiposEstadoProducto"
    );

    console.log("Respuesta completa de obtenerTiposEstadoProducto:", response);
    console.log("response.data:", response.data);
    console.log("response.data?.tipos:", response.data?.tipos);
    return response.data?.tipos ?? [];
  } catch (error) {
    console.error("Error obteniendo tipos estado producto:", error);
    return [];
  }
};

/* =========================
   OBTENER POR ID
========================= */
export const obtenerProductoPorId = async (
  id: number
): Promise<Producto> => {
  
  try {
    const response = await api.get(
      `/api/VTAModVentaProducto/ObtenerPorId/${id}`
    );
    
    // Intenta diferentes estructuras posibles
    const producto = response.data?.producto 
      || response.data?.data 
      || response.data;
    
    // Verifica si el producto existe (id mayor a 0)
    if (!producto || producto.id === 0 || !producto.id) {
      throw new Error(`No se encontró el producto con ID ${id}. El backend devolvió un producto vacío.`);
    }
    
    return producto;
  } catch (error: any) {
    console.error("🔴 ProductoService: error en obtenerProductoPorId:", error);
    throw error;
  }
};

/* =========================
   CREAR
========================= */
export const crearProducto = async (producto: any): Promise<Producto> => {
  const payload = {
    ...producto,
    estado: true,
    fechaCreacion: new Date().toISOString(),
    usuarioCreacion: "SYSTEM",
  };

  const response = await api.post(
    "/api/VTAModVentaProducto/Insertar",
    payload
  );

  return response.data;
};

/* =========================
   ACTUALIZAR 
========================= */
export const actualizarProducto = async (
  id: number,
  producto: any,
  productoOriginal: Producto
): Promise<Producto> => {
  const payload = {
    ...productoOriginal,
    ...producto,
    id,
    fechaModificacion: new Date().toISOString(),
    usuarioModificacion: "SYSTEM",
    // Incluir arrays de estadísticas y objetivos si vienen en el producto
    ...(producto.estadisticas && { estadisticas: producto.estadisticas }),
    ...(producto.objetivos && { objetivos: producto.objetivos }),
  };

  const response = await api.put(
    "/api/VTAModVentaProducto/Actualizar",
    payload
  );

  return response.data;
};

export const descargarPDFProducto = async (id: number): Promise<void> => {
  try {
    // Llamada al endpoint que acabamos de crear
    const response = await api.get(`/api/VTAModVentaProducto/GenerarPDF/${id}`, {
      responseType: 'blob', 
    });

    // Crear URL temporal del blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Intentamos sacar el nombre del archivo del header o generamos uno genérico
    const contentDisposition = response.headers['content-disposition'];
    let fileName = `Producto_${id}.pdf`;
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
    }

    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    
    // Limpieza
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error: any) {
    // Si el backend devuelve un error (JSON) dentro del Blob, intentamos leerlo
    if (error.response && error.response.data instanceof Blob) {
        const errorBlob = error.response.data;
        const text = await errorBlob.text();
        try {
            const errorJson = JSON.parse(text);
            console.error("🔥 ERROR BACKEND:", errorJson);
            throw new Error(errorJson.message || errorJson.error || "Error al generar PDF");
        } catch {
            throw error;
        }
    }
    console.error("Error al descargar PDF:", error);
    throw error;
  }
};

export const sincronizarCalendarioProducto = async (idProducto: number, emailResponsable: string, timeZone: string) => {
  const params = new URLSearchParams({
    idProducto: idProducto.toString(),
    emailResponsable: emailResponsable,
    timeZone: timeZone
  })
  const url = `/api/VTAModVentaProducto/SincronizarCalendario`; 
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Si usas fetch nativo:
  const token = localStorage.getItem("token"); // O donde guardes tu token
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Si tu back pide auth
    },
    body: JSON.stringify({ 
        idProducto, 
        emailResponsable,
        timeZone: userTimeZone 
    })
  });

  if (!response.ok) {
     const errorText = await response.text();
     try {
         const errorJson = JSON.parse(errorText);
         throw new Error(errorJson.mensaje || "Error al sincronizar");
     } catch {
         throw new Error(errorText || "Error al sincronizar");
     }
  }

  return await response.json();
};

/* =========================
   ELIMINAR
========================= */
/* export const eliminarProducto = async (id: number): Promise<void> => {
  await api.delete(
    `/api/VTAModVentaProducto/Eliminar/${id}`
  );
}; */

