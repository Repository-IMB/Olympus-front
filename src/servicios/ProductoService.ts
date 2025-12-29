import api from "./api";
import type { Estadistica, Objetivo, TipoEstadoProducto, Producto } from "../interfaces/IProducto";

export type { Estadistica, Objetivo, TipoEstadoProducto, Producto };

export const baseUrl: string =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:7020";

/* =========================
   OBTENER TODOS
========================= */
export const obtenerProductos = async (): Promise<Producto[]> => {
  const response = await api.get(
    "/api/VTAModVentaProducto/ObtenerTodas"
  );

  return response.data?.productos ?? [];
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
  const response = await api.get(
    `/api/VTAModVentaProducto/ObtenerPorId/${id}`
  );

  return response.data;
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
/* TODAVIA NO SE USA
export const eliminarProducto = async (id: number): Promise<void> => {
  await api.delete(
    `/api/VTAModVentaProducto/Eliminar/${id}`
  );
};
*/
