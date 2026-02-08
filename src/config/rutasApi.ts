import type { OcurrenciaDTO } from "../modelos/Ocurrencia";
import api, { baseUrl } from "../servicios/api";

// Usuario
export const API_USUARIO_LOGIN = 'api/SegModLogin/login';
export const API_USUARIO_LOGOUT = 'api/auth/logout';
export const API_USUARIO_PERFIL = 'api/auth/perfil';

// Oportunidades
export const API_OPORTUNIDADES_LISTAR = '/oportunidades';
export const API_OPORTUNIDADES_DETALLE = (id: string | number) => `/oportunidades/${id}`;

// Otros
export async function getOcurrenciasPermitidas(oportunidadId: number): Promise<OcurrenciaDTO[]> {
  const res = await api.get(`/api/VTAModVentaHistorialEstado/OcurrenciasPermitidas/${oportunidadId}`);
  return res.data?.ocurrencias ?? res.data ?? [];
}

export async function crearHistorialConOcurrencia(oportunidadId: number, ocurrenciaId: number, usuario: number) {
  try {
    const res = await api.post(
      `/api/VTAModVentaHistorialEstado/CrearHistorialConOcurrencia/${oportunidadId}`,
      { ocurrenciaId, usuario }
    );
    return res.data;
  } catch (err: any) {
    console.error("crearHistorialConOcurrencia axios error", err?.response?.status, err?.response?.data);
    throw err;
  }
}

export interface Pais {
  id: number;
  nombre: string;
  prefijoCelularPais: number;
  digitoMaximo: number;
  digitoMinimo: number;
  estado: boolean;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
}

export async function obtenerPaises(): Promise<Pais[]> {
  try {
    const res = await api.get('/api/VTAModVentaPais/ObtenerTodas');
    return res.data?.pais ?? [];
  } catch (err: any) {
    console.error("obtenerPaises axios error", err?.response?.status, err?.response?.data);
    throw err;
  }
}

export async function insertarClientePotencial(data: {
  nombres: string;
  apellidos: string;
  pais: string;
  idPais: number;
  prefijoPaisCelular: string;
  celular: string;
  correo: string;
  areaTrabajo: string;
  industria: string;
}) {
  try {
    const payload = {
      persona: {
        idPais: data.idPais,
        pais: data.pais,
        nombres: data.nombres,
        apellidos: data.apellidos,
        prefijoPaisCelular: data.prefijoPaisCelular,
        celular: data.celular,
        correo: data.correo,
        areaTrabajo: data.areaTrabajo,
        industria: data.industria,
        estado: true
      }
    };
    const res = await api.post('/api/VTAModVentaPotencialCliente/Insertar', payload);
    return res.data;
  } catch (err: any) {
    console.error("insertarClientePotencial axios error", err?.response?.status, err?.response?.data);
    throw err;
  }
}

export async function insertarOportunidadHistorialRegistrado(data: {
  IdPotencialCliente: number;
  IdProducto: number;
  CodigoLanzamiento: string;
  Origen: string;
  Estado: boolean;
  FechaRecordatorio: string;
  HoraRecordatorio: string;
  UsuarioCreacion: string;
  UsuarioModificacion: string;
}) {
  try {
    const res = await api.post('/api/VTAModVentaOportunidad/InsertarOportunidadHistorialRegistrado', data);
    return res.data;
  } catch (err: any) {
    console.error("insertarOportunidadHistorialRegistrado axios error", err?.response?.status, err?.response?.data);
    throw err;
  }
}

export interface Persona {
  id: number;
  idPais: number | null;
  pais: string;
  nombres: string;
  apellidos: string;
  celular: string;
  prefijoPaisCelular: string;
  correo: string;
  areaTrabajo: string;
  industria: string;
  estado: boolean;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
}

export interface ClientePotencial {
  id: number;
  idPersona: number;
  desuscrito: boolean;
  estado: boolean;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
  persona: Persona;
}

export const obtenerClientesPotenciales = async (search?: string) => {
  try {
    const res = await api.get('/api/VTAModVentaPotencialCliente/ObtenerTodas', {
      params: {
        search: search || null,
      },
    });
    return res.data?.potencialClientes ?? [];
  } catch (err: any) {
    console.error("obtenerClientesPotenciales axios error", err?.response?.status, err?.response?.data);
    throw err;
  }
}

export async function obtenerPersonaPorId(id: number): Promise<Persona> {
  try {
    const res = await api.get(`/api/VTAModVentaPersona/ObtenerPorId/${id}`);
    return res.data;
  } catch (err: any) {
    console.error("obtenerPersonaPorId axios error", err?.response?.status, err?.response?.data);
    throw err;
  }
}

export interface Lanzamiento {
  id: number;
  codigoLanzamiento: string;
}

export async function obtenerLanzamientos(
  search: string | null = null,
  page: number = 1,
  pageSize: number = 10,
  estadoProductoId: number | null = null
): Promise<Lanzamiento[]> {
  try {
    const res = await api.get('/api/VTAModVentaProducto/ObtenerTodas', {
      params: {
        search,
        page,
        pageSize,
        estadoProductoId
      }
    });

    // La API devuelve un objeto con la propiedad "productos"
    const productos = res.data?.productos ?? [];

    if (!Array.isArray(productos)) {
      console.error('La respuesta no contiene un array de productos:', res.data);
      return [];
    }

    // Extraer códigos de lanzamiento únicos
    const lanzamientosUnicos = new Map<string, Lanzamiento>();

    productos.forEach((producto: any) => {
      if (producto.codigoLanzamiento) {
        if (!lanzamientosUnicos.has(producto.codigoLanzamiento)) {
          lanzamientosUnicos.set(producto.codigoLanzamiento, {
            id: producto.id,
            codigoLanzamiento: producto.codigoLanzamiento
          });
        }
      }
    });

    return Array.from(lanzamientosUnicos.values());
  } catch (err: any) {
    throw err;
  }
}
export default baseUrl;
