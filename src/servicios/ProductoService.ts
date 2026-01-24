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

/* =========================
   ELIMINAR
========================= */
/* export const eliminarProducto = async (id: number): Promise<void> => {
  await api.delete(
    `/api/VTAModVentaProducto/Eliminar/${id}`
  );
}; */

