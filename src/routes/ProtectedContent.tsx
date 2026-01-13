import { Result } from "antd";
import { useUserContext } from "../context/UserContext";
import { usePermisosMenu } from "../hooks/usePermisosMenu";
import type { ReactNode } from "react";

interface Props {
  permiso: keyof ReturnType<typeof usePermisosMenu>;
  children: ReactNode;
}

export default function ProtectedContent({ permiso, children }: Props) {
  const { userContext } = useUserContext();

  if (!userContext) return null;

  const permisos = usePermisosMenu(userContext);

  if (!permisos[permiso]) {
    return (
      <Result
        status="403"
        title="Acceso denegado"
        subTitle="No tienes permisos para ver esta sección"
      />
    );
  }

  return <>{children}</>;
}
