import { Navigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";
import { usePermisosMenu } from "../hooks/usePermisosMenu";
import { Spin } from "antd";
import { getCookie } from "../utils/cookies"; // 🟢 IMPORTANTE: Importa esto
import type { ReactNode } from "react";

interface Props {
  permiso: keyof ReturnType<typeof usePermisosMenu>;
  children: ReactNode;
}

export default function ProtectedRoute({ permiso, children }: Props) {
  const { userContext } = useUserContext();
  
  // 1. Verificar Token físico en el navegador
  const token = getCookie("token");

  // 2. Verificar estado del contexto
  // A veces el contexto existe {} pero el rol es 0 o undefined mientras carga
  const idRol = Number(userContext?.idRol || 0);
  
  // 🟢 LA SOLUCIÓN:
  // Si hay Token (logueado) PERO el rol en el contexto sigue siendo 0 (cargando),
  // mostramos el Spin y NO dejamos que pase a la validación de abajo.
  const contextoIncompleto = token && idRol === 0;

  if (!userContext || contextoIncompleto) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <Spin size="large" tip="Validando permisos..." />
      </div>
    );
  }

  // 3. Calcular permisos (Ahora sí con datos reales)
  const permisos = usePermisosMenu(userContext);

  // 4. Validación Final
  if (!permisos[permiso]) {
    // Si llegamos acá es porque YA cargó el usuario y DE VERDAD no tiene permiso
    return <Navigate to="/403" replace />;
  }

  // ✅ PERMITIDO
  return <>{children}</>;
}