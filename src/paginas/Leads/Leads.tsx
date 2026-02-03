import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Spin, message, Alert, Button } from "antd";
import ClienteProductoCard from "./ClienteProducto";
import OportunidadPanel from "./OportunidadPanel";
import HistorialInteraccion from "./HistorialInteraccion";
import ModalLead from "./ModalLead";
import { getCookie } from "../../utils/cookies";
import api from "../../servicios/api";
import { jwtDecode } from "jwt-decode";
import styles from "./Leads.module.css";
import "./modals-mobile.css";
import "./enhancements.css";
import "./Estados/Estados.css";

interface TokenData {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
}

// ... (El componente VistaProceso se queda IGUAL) ...
function VistaProceso({
  oportunidadId,
}: {
  oportunidadId: string | undefined;
}) {
  return (
    <div className={styles.vistaProceso}>
      <Row gutter={[16, 16]} style={{ height: "100%" }}>
        <Col xs={24} md={6} lg={6} className={styles.leftColumn}>
          <div className={styles.clienteCard}>
            <ClienteProductoCard />
          </div>
        </Col>

        <Col xs={24} md={18} lg={18} className={styles.rightColumn}>
          <div className={styles.contentCard}>
            <div className={styles.oportunidadSection}>
              <OportunidadPanel oportunidadId={oportunidadId} />
            </div>

            <div className={styles.historialSection}>
              <HistorialInteraccion />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default function Leads() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [permitido, setPermitido] = useState(false);
  const [errorControlado, setErrorControlado] = useState<string | null>(null);

  const token = getCookie("token");

  // ... (Toda la lógica de useMemo y useEffect se queda IGUAL) ...
  const { idUsuario, idRol } = useMemo(() => {
    let idU = 0;
    let rNombre = "";
    let idR = 0;

    if (!token) return { idUsuario: 0, rolNombre: "", idRol: 0 };

    try {
      const decoded = jwtDecode<TokenData>(token);
      idU = parseInt(
        decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || "0"
      );
      rNombre = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "";

      const rolesMap: Record<string, number> = {
        Asesor: 1, Supervisor: 2, Gerente: 3, Administrador: 4, Desarrollador: 5,
      };
      idR = rolesMap[rNombre] ?? 0;
    } catch (e) {
      console.error("Error al decodificar token (useMemo)", e);
    }

    return { idUsuario: idU, rolNombre: rNombre, idRol: idR };
  }, [token]);

  useEffect(() => {
    const validarPermiso = async () => {
      try {
        if (!token) {
          message.error("Sesión no válida");
          navigate("/login");
          return;
        }

        if (!idUsuario || !idRol) {
          message.error("Sesión inválida o falta información de usuario");
          navigate("/login");
          return;
        }

        setLoading(true);
        setErrorControlado(null);

        // 1) Validar permisos
        const permisosRes = await api.get(
          `/api/SegModLogin/ObtenerPermisosDeOportunidad/${id}/${idUsuario}/${idRol}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const permisosData = permisosRes.data;
        if (permisosData?.codigo === "ERROR_CONTROLADO") {
          setErrorControlado(permisosData.mensaje);
          return;
        }

        // 2) Obtener ocurrencias
        const ocurrenciasRes = await api.get(
          `/api/VTAModVentaHistorialEstado/OcurrenciasPermitidas/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const ocurrenciasData = ocurrenciasRes.data;
        if (ocurrenciasData?.codigo === "ERROR_CONTROLADO") {
          setErrorControlado(ocurrenciasData.mensaje);
          return;
        }

        setPermitido(true);
      } catch (e: any) {
        console.error("Error validando permisos:", e);
        const apiMessage = e?.response?.data?.message ?? e?.message;
        message.error(apiMessage || "Error al validar acceso");
        navigate("/leads/Opportunities");
      } finally {
        setLoading(false);
      }
    };

    validarPermiso();
  }, [id, navigate, idUsuario, idRol, token]);

  if (loading)
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );

  if (errorControlado)
    return (
      <div className={styles.errorContainer}>
        <Alert type="error" message={errorControlado} />
        {/* Botón volver en caso de error también */}
        <Button style={{ marginTop: 16 }} onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );

  if (!permitido) return null;

  return (
    <div className={styles.mainContainer}>
      <div className={styles.contentWrapper}>
        <VistaProceso oportunidadId={id} />
      </div>

      <ModalLead open={false} onClose={() => {}} />
    </div>
  );
}