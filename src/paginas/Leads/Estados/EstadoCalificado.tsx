import React, { useEffect, useState } from "react";
import { Typography, Row, Col, Space, Spin, message, Popconfirm } from "antd";
import type { OcurrenciaDTO } from "../../../modelos/Ocurrencia";
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
  userSelect: "none",
  minWidth: 92,
  textAlign: "center" as const,
  display: "inline-block",
  opacity: disabled ? 0.7 : 1,
});

  const token = getCookie("token");

  const getUserIdFromToken = () => {
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
  

function useMountedFlag() {
  const [mounted, setMounted] = useState(true);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  return mounted;
}

export default function EstadoCalificado({
  oportunidadId,
  usuario = "SYSTEM",
  onCreado,
  activo = true,
}: Props) {
  const [ocurrencias, setOcurrencias] = useState<OcurrenciaDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingId, setCreatingId] = useState<number | null>(null);
  const [callLoading, setCallLoading] = useState(false);
  const mounted = useMountedFlag();

  useEffect(() => {
    if (!oportunidadId && oportunidadId !== 0) return;
    setLoading(true);
    getOcurrenciasPermitidas(oportunidadId)
      .then((list) => {
        if (mounted) setOcurrencias(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error("getOcurrenciasPermitidas error", err);
        message.error(err?.message ?? "No se pudieron cargar ocurrencias");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oportunidadId]);

  const handleSelect = async (ocId: number) => {
    if (creatingId || !activo) return;
    setCreatingId(ocId);
    try {
      await crearHistorialConOcurrencia(oportunidadId, ocId, Number(getUserIdFromToken()));
      message.success("Cambio aplicado");
      emitHistorialChanged({
        motivo: "crearHistorialConOcurrencia",
        ocurrenciaId: ocId,
      });
      if (onCreado) onCreado();
      const list = await getOcurrenciasPermitidas(oportunidadId);
      if (mounted) setOcurrencias(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error("crearHistorialConOcurrencia error", err);
      message.error(err?.message ?? "Error al aplicar ocurrencia");
    } finally {
      if (mounted) setCreatingId(null);
    }
  };

  const incrementarLlamada = async (tipo: "C" | "N") => {
    if (callLoading || creatingId) return;
    setCallLoading(true);
    try {
      // POST a: /api/VTAModVentaHistorialEstado/{IdOportunidad}/IncrementarLlamadas
      const payload = { tipo, usuario };
      await api.post(
        `/api/VTAModVentaHistorialEstado/${oportunidadId}/IncrementarLlamadas`,
        payload
      );
      message.success(
        tipo === "C"
          ? "Marcador de 'Contestadas' incrementado"
          : "Marcador de 'No contestadas' incrementado"
      );
      emitHistorialChanged({ motivo: "incrementarLlamada", tipo });
      if (onCreado) onCreado();
    } catch (err: any) {
      console.error("incrementarLlamada error", err);
      const errMsg =
        err?.response?.data?.mensaje ??
        err?.message ??
        "Error al incrementar llamada";
      message.error(errMsg);
    } finally {
      if (mounted) setCallLoading(false);
    }
  };

  const findByName = (name: string) => {
    return ocurrencias.find(
      (o) => (o.nombre ?? "").toLowerCase() === name.toLowerCase()
    );
  };

  const renderActionBtn = (label: string, base: string, hover: string) => {
    const oc = findByName(label);
    const allowedBackend = !!oc?.allowed;
    const disabled = !activo || !allowedBackend || !!creatingId || callLoading;
    const id = oc?.id;

    const button = (
      <div
        key={label}
        role="button"
        aria-disabled={disabled}
        style={buttonStyle(disabled ? "#F0F0F0" : base, hover, disabled)}
        title={
          !oc
            ? "Ocurrencia no encontrada"
            : disabled
            ? "No permitido"
            : "Seleccionar"
        }
        onMouseEnter={(e) => {
          if (!disabled)
            (e.currentTarget as HTMLElement).style.background = hover;
        }}
        onMouseLeave={(e) => {
          if (!disabled)
            (e.currentTarget as HTMLElement).style.background = disabled
              ? "#F0F0F0"
              : base;
        }}
      >
        {label}
      </div>
    );

    if (disabled || !id) return button;

    return (
      <Popconfirm
        title="¿Está seguro de guardar este nuevo estado?"
        okText="Sí"
        cancelText="No"
        placement="top"
        onConfirm={() => handleSelect(id)}
      >
        {button}
      </Popconfirm>
    );
  };

  if (loading) return <Spin />;

  return (
    <div
      style={{
        background: "#F0F0F0",
        borderRadius: 12,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* === ¿Contestó? === */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 4 }}>
        <Text style={{ fontSize: 14, color: "#0D0C11" }}>¿Contestó?</Text>
        <Space>
          {(() => {
            const disabledYes = callLoading || !!creatingId || !activo;
            return (
              <div
                style={buttonStyle(
                  disabledYes ? "#F0F0F0" : "#BAD4FF",
                  "#9EC9FF",
                  disabledYes
                )}
                onMouseEnter={(e) => {
                  if (!disabledYes)
                    (e.currentTarget as HTMLElement).style.background =
                      "#9EC9FF";
                }}
                onMouseLeave={(e) => {
                  if (!disabledYes)
                    (e.currentTarget as HTMLElement).style.background =
                      "#BAD4FF";
                }}
                onClick={() => {
                  if (!disabledYes) incrementarLlamada("C");
                }}
                role="button"
                aria-disabled={disabledYes}
                title={
                  disabledYes
                    ? !activo
                      ? "No activo"
                      : "Procesando..."
                    : "Marcar llamada contestada"
                }
              >
                {callLoading ? <Spin size="small" /> : "Sí"}
              </div>
            );
          })()}

          {(() => {
            const disabledNo = callLoading || !!creatingId || !activo;
            return (
              <div
                style={buttonStyle(
                  disabledNo ? "#F0F0F0" : "#FFCDCD",
                  "#FFB2B2",
                  disabledNo
                )}
                onMouseEnter={(e) => {
                  if (!disabledNo)
                    (e.currentTarget as HTMLElement).style.background =
                      "#FFB2B2";
                }}
                onMouseLeave={(e) => {
                  if (!disabledNo)
                    (e.currentTarget as HTMLElement).style.background =
                      "#FFCDCD";
                }}
                onClick={() => {
                  if (!disabledNo) incrementarLlamada("N");
                }}
                role="button"
                aria-disabled={disabledNo}
                title={
                  disabledNo
                    ? !activo
                      ? "No activo"
                      : "Procesando..."
                    : "Marcar llamada no contestada"
                }
              >
                {callLoading ? <Spin size="small" /> : "No"}
              </div>
            );
          })()}
        </Space>
      </Row>

      {/* === Ocurrencia header === */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 6 }}>
        <Text style={{ fontSize: 14, color: "#0D0C11" }}>Ocurrencia:</Text>
        <Space>
          <div
            style={{
              width: 12,
              height: 12,
              background: "#5D5D5D",
              borderRadius: 2,
            }}
          />
          <Text style={{ fontSize: 11, color: "#5D5D5D" }}>
            Más información
          </Text>
        </Space>
      </Row>

      {/* === Etapas === */}
      <Row gutter={8}>
        {/* Columna Izquierda */}
        <Col span={12}>
          <Space direction="vertical" style={{ width: "100%" }} size={8}>
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 8,
                padding: 8,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Space wrap style={{ justifyContent: "center" }} size={8}>
                {renderActionBtn("Registrado", "#C9C9C9", "#BEBEBE")}
                {renderActionBtn("Calificado", "#C9C9C9", "#BEBEBE")}
                {renderActionBtn("Potencial", "#9CBDFD", "#86ACFB")}
                {renderActionBtn("Promesa", "#9CBDFD", "#86ACFB")}
              </Space>
            </div>

            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 8,
                padding: 8,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Space wrap style={{ justifyContent: "center" }} size={8}>
                {renderActionBtn("Corporativo", "#FFF6A3", "#FFF08A")}
                {renderActionBtn("Venta Cruzada", "#FFF6A3", "#FFF08A")}
                {renderActionBtn("Seguimiento", "#FFF6A3", "#FFF08A")}
              </Space>
            </div>
          </Space>
        </Col>

        {/* Columna Derecha */}
        <Col span={12}>
          <Space direction="vertical" style={{ width: "100%" }} size={8}>
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 8,
                padding: 8,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Space wrap style={{ justifyContent: "center" }} size={8}>
                {renderActionBtn("Cobranza", "#B8F3B8", "#A7E8A7")}
                {renderActionBtn("Convertido", "#B8F3B8", "#A7E8A7")}
              </Space>
            </div>

            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 8,
                padding: 8,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Space wrap style={{ justifyContent: "center" }} size={8}>
                {renderActionBtn("No calificado", "#F7B1B1", "#F29C9C")}
                {renderActionBtn("Perdido", "#F7B1B1", "#F29C9C")}
              </Space>
            </div>
          </Space>
        </Col>
      </Row>
    </div>
  );
}
