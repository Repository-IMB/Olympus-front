import { Navigate } from "react-router-dom";
import type { PermisosMenu } from "../hooks/usePermisosMenu";
import type { JSX } from "react";

interface Props {
  permiso: keyof PermisosMenu;
  permisos: PermisosMenu;
  children: JSX.Element;
}

export default function RouteGuard({ permiso, permisos, children }: Props) {
  if (!permisos[permiso]) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
