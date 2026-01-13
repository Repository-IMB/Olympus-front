import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <Result
      status="403"
      title="Acceso denegado"
      subTitle="No tienes permisos para acceder a esta sección."
      extra={
        <Button type="primary" onClick={() => navigate(-1)}>
          Volver
        </Button>
      }
    />
  );
}
