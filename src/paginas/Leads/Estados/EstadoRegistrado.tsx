import React, { useEffect, useRef, useState } from "react";
import { Row, Col, Space, Typography, Spin, message, Popconfirm } from "antd";
import {
  crearHistorialConOcurrencia,
  getOcurrenciasPermitidas,
} from "../../../config/rutasApi";
import api from "../../../servicios/api";
import { emitHistorialChanged } from "../../../utils/events";
import { getCookie } from "../../../utils/cookies";
import { jwtDecode } from "jwt-decode";

const { Text } = Typography;

type Props = {
  oportunidadId: number;
  usuario?: string;
  onCreado?: () => void;
  activo?: boolean;
  cantidadContestadas?: number | string | undefined;
  cantidadNoContestadas?: number | string | undefined;
};

const buttonStyle = (
  baseColor: string,
  hoverColor: string,
  disabled = false
): React.CSSProperties => ({
  background: baseColor,
  color: "#0D0C11",
  border: "none",
  borderRadius: 6,
  padding: "6px 10px",
  fontSize: 13,
  fontWeight: 600,
  cursor: disabled ? "not-allowed" : "pointer",
  boxShadow: "0 1.5px 4px rgba(0, 0, 0, 0.12)",
  transition: "all 0.14s ease",
  minWidth: 92,
  textAlign: "center" as const,
  userSelect: "none",
  display: "inline-block",
});

function useMountedRef() {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return mounted;
}

const getUserIdFromToken = () => {
  const token = getCookie("token");
  if (!token) return 0;

  try {
    const decoded: any = jwtDecode(token);

    const id =
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ];

    return id ? Number(id) : 0;
  } catch (e) {
    console.error("Error decodificando token", e);
    return 0;
  }
};

export default function EstadoRegistrado({
  oportunidadId,
  usuario = "SYSTEM",
  onCreado,
  activo = true,
  cantidadContestadas,
  cantidadNoContestadas,
}: Props) {
  const [ocurrencias, setOcurrencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingId, setCreatingId] = useState<number | null>(null);
  const [callLoading, setCallLoading] = useState(false);

  const mountedRef = useMountedRef();

  useEffect(() => {
    if (!oportunidadId) return;

    setLoading(true);
    getOcurrenciasPermitidas(oportunidadId)
      .then((list) => {
        if (!mountedRef.current) return;
        setOcurrencias(Array.isArray(list) ? list : []);
      })
      .catch(() => message.error("No se pudieron cargar ocurrencias"))
      .finally(() => mountedRef.current && setLoading(false));
  }, [oportunidadId]);

  const handleSelect = async (ocId: number) => {
    if (creatingId || !activo) return;

    setCreatingId(ocId);

    try {
      await crearHistorialConOcurrencia(
        oportunidadId,
        ocId,
        Number(getUserIdFromToken())
      );

      emitHistorialChanged({
        motivo: "crearHistorialConOcurrencia",
        ocurrenciaId: ocId,
      });

      onCreado?.();
    } catch {
      message.error("Error al aplicar ocurrencia");
    } finally {
      mountedRef.current && setCreatingId(null);
    }
  };

  const findByName = (name: string) =>
    ocurrencias.find(
      (o) =>
        (o.nombre ?? o.Nombre ?? "").toString().toLowerCase() ===
        name.toLowerCase()
    );

  const renderActionBtn = (
    label: string,
    baseColor: string,
    hoverColor: string
  ) => {
    const oc = findByName(label);
    const allowed = activo && oc?.allowed && creatingId !== oc?.id;
    const disabled = !allowed || callLoading;
    const id = oc?.id;

    const button = (
      <div
        role="button"
        aria-disabled={disabled}
        style={{
          ...buttonStyle(
            disabled ? "#F0F0F0" : baseColor,
            hoverColor,
            disabled
          ),
          opacity: disabled ? 0.7 : 1,
        }}
        title={
          !oc
            ? "Ocurrencia no encontrada"
            : disabled
            ? "No permitido"
            : "Seleccionar"
        }
      >
        {creatingId === id ? "..." : label}
      </div>
    );

    if (disabled || !id) {
      return <div key={label}>{button}</div>;
    }

    return (
      <Popconfirm
        key={label}
        title="¿Esta seguro de guardar este nuevo estado?"
        okText="Sí"
        cancelText="No"
        placement="top"
        onConfirm={() => handleSelect(id)}
        getPopupContainer={() => document.body}
      >
        {button}
      </Popconfirm>
    );
  };

  const incrementarLlamada = async (tipo: "C" | "N") => {
    if (callLoading || creatingId || !activo) return;

    setCallLoading(true);

    try {
      const payload = { tipo, usuario };

      // Ejecuta el SP que incrementa el contador en backend
      const res = await api.post(
        `/api/VTAModVentaHistorialEstado/${oportunidadId}/IncrementarLlamadas`,
        payload
      );

      const mensaje = res.data?.mensaje ?? "";

      // Extraer ResultadoSP si viene en el mensaje (ej: "ResultadoSP=4; HistorialId=95")
      const match = mensaje.match(/ResultadoSP=(\d+)/);
      const resultado = match ? parseInt(match[1], 10) : 0;

      // --- Lógica idéntica a tu ejemplo:
      // Si es NO y el SP devolvió ResultadoSP=4 → aplicar automáticamente "No Calificado"
      if (tipo === "N" && resultado === 4) {
        const ocNoCalificado = ocurrencias.find(
          (o) =>
            (o.nombre ?? o.Nombre ?? "").toString().toLowerCase() ===
            "no calificado"
        );

        if (ocNoCalificado) {
          await handleSelect(ocNoCalificado.id);
        }
      }

      emitHistorialChanged({ motivo: "incrementarLlamada", tipo });
      onCreado?.();
    } catch (err: any) {
      message.error(err?.response?.data?.mensaje ?? "Error al incrementar");
    } finally {
      mountedRef.current && setCallLoading(false);
    }
  };

  if (loading) return <Spin />;

  // Coerción segura (idéntico enfoque que en tu snippet)
  const answered = Number(cantidadContestadas ?? 0) || 0;
  const unanswered = Number(cantidadNoContestadas ?? 0) || 0;

  // === Aquí aplicamos exactamente la lógica que solicitaste ===
  // - Si hay contestadas (>0) renderizamos la UI como en tu ejemplo (dos columnas),
  //   y dentro de la segunda columna mostramos también el bloque "No Calificado / Perdido" (stacked).
  // - Si NO hay contestadas pero SÍ hay no-contestadas (>0), mostramos únicamente el bloque
  //   "No Calificado / Perdido" ocupando todo el ancho (span=24).
  const hayContestadas = answered > 0;
  const hayNoContestadas = unanswered > 0;

  return (
    <div
      style={{
        background: "#F0F0F0",
        borderRadius: 12,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* SIEMPRE SE MUESTRA */}
      <Row justify="space-between" align="middle">
        <Text style={{ fontSize: 14 }}>¿Contestó?</Text>
        <Space>
          <div
            style={buttonStyle("#BAD4FF", "#9EC9FF", callLoading)}
            onClick={() => incrementarLlamada("C")}
          >
            Sí
          </div>

          <div
            style={buttonStyle("#FFCDCD", "#FFB2B2", callLoading)}
            onClick={() => incrementarLlamada("N")}
          >
            No
          </div>
        </Space>
      </Row>

      {/* Si hay contestadas mostramos exactamente la estructura que pusiste en el snippet */}
      {hayContestadas && (
        <>
          <Row justify="space-between" align="middle">
            <Text style={{ fontSize: 14 }}>Ocurrencia:</Text>
          </Row>

          <Row gutter={8}>
            <Col span={12}>
              <Space direction="vertical" style={{ width: "100%" }} size={8}>
                <div
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 8,
                    padding: 10,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Space wrap size={10}>
                    {renderActionBtn("Registrado", "#C9C9C9", "#BEBEBE")}
                    {renderActionBtn("Calificado", "#9CBDFD", "#86ACFB")}
                    {renderActionBtn("Potencial", "#9CBDFD", "#86ACFB")}
                    {renderActionBtn("Promesa", "#9CBDFD", "#86ACFB")}
                  </Space>
                </div>
              </Space>
            </Col>

            <Col span={12}>
              <Space direction="vertical" style={{ width: "100%" }} size={8}>
                <div
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 8,
                    padding: 10,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Space wrap size={10}>
                    {renderActionBtn("Cobranza", "#B8F3B8", "#A7E8A7")}
                    {renderActionBtn("Convertido", "#B8F3B8", "#A7E8A7")}
                  </Space>
                </div>

                {/* --- Aquí está el bloque "No Calificado / Perdido" exactamente como en tu snippet --- */}
                <div
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 8,
                    padding: 10,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Space wrap size={10}>
                    {renderActionBtn("No Calificado", "#F7B1B1", "#F29C9C")}
                    {renderActionBtn("Perdido", "#F7B1B1", "#F29C9C")}
                  </Space>
                </div>
              </Space>
            </Col>
          </Row>
        </>
      )}

      {/* Si NO hay contestadas pero SÍ hay no-contestadas, mostrar solo el bloque negativo (span=24) */}
      {!hayContestadas && hayNoContestadas && (
        <>
          <Row justify="space-between" align="middle">
            <Text style={{ fontSize: 14 }}>Ocurrencia:</Text>
          </Row>

          <Row gutter={8}>
            <Col span={24}>
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 8,
                  padding: 10,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Space wrap size={10}>
                  {renderActionBtn("No Calificado", "#F7B1B1", "#F29C9C")}
                  {renderActionBtn("Perdido", "#F7B1B1", "#F29C9C")}
                </Space>
              </div>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
