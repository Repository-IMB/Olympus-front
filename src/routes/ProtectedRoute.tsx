import { Navigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";
import { usePermisosMenu } from "../hooks/usePermisosMenu";
import { Spin } from "antd";
import type { ReactNode } from "react";

interface Props {
  permiso: keyof ReturnType<typeof usePermisosMenu>;
  children: ReactNode;
}

export default function ProtectedRoute({ permiso, children }: Props) {
  const { userContext } = useUserContext();

  // ⏳ AÚN CARGANDO CONTEXTO → NO BLOQUEAR
  if (!userContext) {
    return (
      <div style={{ height: "100%", display: "grid", placeItems: "center" }}>
        <Spin />
      </div>
    );
  }

  const permisos = usePermisosMenu(userContext);

  // ❌ NO TIENE PERMISO
  if (!permisos[permiso]) {
    return <Navigate to="/403" replace />;
  }

  // ✅ PERMITIDO
  return <>{children}</>;
}
