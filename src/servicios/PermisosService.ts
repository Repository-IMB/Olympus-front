import axios from 'axios';
import { getCookie } from '../utils/cookies';

// Usamos el puerto 7020 que me mostraste en tu consola
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7020';

export interface ContextoUsuarioDTO {
  idUsuario: number;
  idPersonal?: number;
  rol: string;          // ej: "Administrativo"
  idAreaTrabajo?: number; 
  areaCodigo?: string;  // ej: "dpr"
  areaNombre?: string;  
  accesoTotal: boolean;
}

export const permisosService = {
  /**
   * Obtiene el contexto completo (Área, Rol, Permisos)
   * Acepta tokenManual porque al momento del login la cookie aun no se guardó.
   */
  async obtenerContexto(idUsuario: number, tokenManual?: string): Promise<ContextoUsuarioDTO | null> {
    try {
      const token = tokenManual || getCookie('token');
      
      // Llamada al endpoint que ya tenías en C#
      const response = await axios.get(
        `${API_URL}/api/CFGModPermisos/contexto/${idUsuario}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data; // Retorna el objeto directo
    } catch (error) {
      console.error('Error al obtener contexto de permisos:', error);
      return null;
    }
  },

  /**
   * Valida si el usuario tiene acceso a un formulario específico
   */
  async validarAccesoFormulario(idUsuario: number, codigoFormulario: string): Promise<boolean> {
    try {
      const token = getCookie('token');
      const response = await axios.post(
        `${API_URL}/api/CFGModPermisos/validar-permiso`,
        { IdUsuario: idUsuario, CodigoFormulario: codigoFormulario },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.TienePermiso === true;
    } catch (error) {
      console.error('Error al validar permiso:', error);
      return false;
    }
  },
};