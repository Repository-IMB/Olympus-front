import React, { useEffect, useState } from "react";
import { Typography, Row, Space, message, Spin } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import type { OcurrenciaDTO } from "../../../modelos/Ocurrencia";
import { crearHistorialConOcurrencia, getOcurrenciasPermitidas } from "../../../config/rutasApi";
import { getCookie } from "../../../utils/cookies";
import { jwtDecode } from "jwt-decode";

const { Text } = Typography;

const buttonStyle = (baseColor: string, hoverColor: string, disabled = false): React.CSSProperties => ({
  background: disabled ? "#F5F5F5" : baseColor,
  color: "#0D0C11",
  border: "none",
  borderRadius: 6,
  padding: "4px 12px",
  fontSize: 12,
  fontWeight: 500,
  cursor: disabled ? "not-allowed" : "pointer",
  boxShadow: disabled ? "none" : "0 1.5px 4px rgba(0, 0, 0, 0.15)",
  transition: "all 0.2s ease",
  userSelect: "none",
  minWidth: 90,
  textAlign: "center" as const,
  display: "inline-block",
});

type Props = {
  oportunidadId: number;
  usuario?: string;
  onCreado?: () => void;
  activo?: boolean;
};

  const token = getCookie("token");

export default function EstadoNoCalificado({ oportunidadId, usuario = "SYSTEM", onCreado, activo = true }: Props) {
  const [ocurrencias, setOcurrencias] = useState<OcurrenciaDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingId, setCreatingId] = useState<number | null>(null);

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

  useEffect(() => {
    let mounted = true;
    if (!oportunidadId && oportunidadId !== 0) return;

    setLoading(true);
    getOcurrenciasPermitidas(oportunidadId)
      .then(list => { if (mounted) setOcurrencias(Array.isArray(list) ? list : []); })
      .catch(err => {
        console.error("getOcurrenciasPermitidas error", err);
        message.error(err?.message ?? "No se pudieron cargar las ocurrencias");
        if (mounted) setOcurrencias([]);
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [oportunidadId]);

  const handleSelect = async (ocId: number) => {
    if (creatingId || !activo) return;
    setCreatingId(ocId);
    try {
      await crearHistorialConOcurrencia(oportunidadId, ocId, Number(getUserIdFromToken()));
      message.success("Cambio aplicado");
      const list = await getOcurrenciasPermitidas(oportunidadId);
      setOcurrencias(Array.isArray(list) ? list : []);
      if (onCreado) onCreado();
    } catch (err: any) {
      console.error("crearHistorialConOcurrencia error", err);
      message.error(err?.message ?? "Error al aplicar la ocurrencia");
    } finally {
      setCreatingId(null);
    }
  };

  const findByName = (name: string) =>
  ocurrencias.find(o => (((o.nombre ?? (o as any).Nombre) ?? "").toString().toLowerCase()) === name.toLowerCase());

  if (loading) return <Spin />;

  const ocNoCalificado = findByName("No Calificado") ?? findByName("No calificado");
  const ocPerdido = findByName("Perdido");

  const allowedNoCalificado = activo && !!ocNoCalificado?.allowed && creatingId !== ocNoCalificado?.id;
  const allowedPerdido = activo && !!ocPerdido?.allowed && creatingId !== ocPerdido?.id;

  return (
    <div
      style={{
        background: "#F5F5F5",
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* === Ocurrencia === */}
      <Row justify="space-between" align="middle">
        <Text style={{ fontSize: 14, color: "#0D0C11" }}>Ocurrencia:</Text>
        <Space>
          <div
            style={buttonStyle(ocNoCalificado ? (ocNoCalificado.allowed ? "#F7B1B1" : "#F0F0F0") : "#F7B1B1", "#F29C9C", !allowedNoCalificado)}
            onMouseEnter={(e) => { if (allowedNoCalificado) (e.currentTarget as HTMLElement).style.background = "#F29C9C"; }}
            onMouseLeave={(e) => { if (allowedNoCalificado) (e.currentTarget as HTMLElement).style.background = "#F7B1B1"; }}
            onClick={() => { if (allowedNoCalificado && ocNoCalificado) handleSelect(ocNoCalificado.id); }}
            aria-disabled={!allowedNoCalificado}
            role="button"
          >
            {creatingId === ocNoCalificado?.id ? "..." : (ocNoCalificado?.nombre ?? "No calificado")}
          </div>
          
          <div
            style={buttonStyle(ocPerdido ? (ocPerdido.allowed ? "#F7B1B1" : "#F0F0F0") : "#F7B1B1", "#F29C9C", !allowedPerdido)}
            onMouseEnter={(e) => { if (allowedPerdido) (e.currentTarget as HTMLElement).style.background = "#F29C9C"; }}
            onMouseLeave={(e) => { if (allowedPerdido) (e.currentTarget as HTMLElement).style.background = "#F7B1B1"; }}
            onClick={() => { if (allowedPerdido && ocPerdido) handleSelect(ocPerdido.id); }}
            aria-disabled={!allowedPerdido}
            role="button"
          >
            {creatingId === ocPerdido?.id ? "..." : (ocPerdido?.nombre ?? "Perdido")}
          </div>
        </Space>
      </Row>

      {/* === Info adicional === */}
      <div
        style={{
          background: "#ECECEC",
          borderRadius: 10,
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <InfoCircleOutlined style={{ color: "#5D5D5D" }} />
        <Text style={{ fontSize: 12, color: "#5D5D5D" }}>
          El cliente no calificó para continuar el proceso o decidió no seguir con la oferta.
        </Text>
      </div>
    </div>
  );
}
