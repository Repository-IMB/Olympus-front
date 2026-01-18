import React, { useEffect, useState } from "react";
import { Typography, Row, Col, Space, Spin, message, Select, Popconfirm } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import type { OcurrenciaDTO } from "../../../modelos/Ocurrencia";
import { crearHistorialConOcurrencia, getOcurrenciasPermitidas } from "../../../config/rutasApi";
import api from "../../../servicios/api";
import { emitHistorialChanged } from "../../../utils/events";
import { getCookie } from "../../../utils/cookies";
import { jwtDecode } from "jwt-decode";

const { Text } = Typography;
const { Option } = Select as any;

type Props = {
  oportunidadId: number;
  usuario?: string;
  onCreado?: () => void;
  activo?: boolean;
};

const buttonStyle = (baseColor: string, hoverColor: string, disabled = false): React.CSSProperties => ({
  background: disabled ? "#F0F0F0" : baseColor,
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

function useMountedFlag() {
  const [mounted, setMounted] = useState(true);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
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
      

export default function EstadoPromesa({ oportunidadId, usuario = "SYSTEM", onCreado, activo = true }: Props) {
  const [ocurrencias, setOcurrencias] = useState<OcurrenciaDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingId, setCreatingId] = useState<number | null>(null);
  const [callLoading, setCallLoading] = useState(false);
  const [mode, setMode] = useState<"default" | "general" | "corporativo">("default");
  const [originName, setOriginName] = useState<string | null>(null);
  const mounted = useMountedFlag();

  useEffect(() => {
    if ((!oportunidadId && oportunidadId !== 0) || !mounted) return;
    setLoading(true);

    Promise.all([
      getOcurrenciasPermitidas(oportunidadId).catch(err => { throw { step: "ocurrencias", err }; }),
      api.get(`/api/VTAModVentaOportunidad/HistorialEstado/PorOportunidad/${oportunidadId}`)
        .then((r: any) => r.data)
        .catch(() => null)
    ])
      .then(([ocs, histResp]) => {
        if (!mounted) return;
        const list = Array.isArray(ocs) ? ocs : [];
        setOcurrencias(list);

        const rawList: any[] =
          histResp?.historialEstados ??
          histResp?.historialEstado ??
          histResp?.HistorialEstado ??
          histResp?.Historiales ??
          histResp?.data ??
          histResp?.historial ??
          [];

        if (Array.isArray(rawList) && rawList.length > 0) {
          const last = rawList[0];

          const idOc =
            last?.IdOcurrencia ??
            last?.idOcurrencia ??
            last?.IdOcurrencia ??
            last?.idOcurrencia ??
            null;

          const found = list.find(o => o.id === idOc || o.id === Number(idOc));
          const nameFromList = found?.nombre ?? (found as any)?.Nombre ?? null;

          const fallbackNames: Record<number, string> = {
            1: "Registrado",
            2: "Calificado",
            3: "Potencial",
            4: "Promesa",
            5: "Cobranza",
            6: "Convertido",
            7: "Perdido",
            8: "No Calificado",
            9: "Corporativo",
            10: "Venta cruzada",
            11: "Seguimiento"
          };
          const resolvedName = nameFromList ?? (idOc ? fallbackNames[Number(idOc)] ?? null : null);

          setOriginName(resolvedName);

          if (resolvedName) {
            const low = resolvedName.toLowerCase();
            if (["registrado", "calificado", "potencial"].includes(low)) {
              setMode("general");
            } else if (low === "corporativo" || low === "coorporativo") {
              setMode("corporativo");
            } else {
              setMode("default");
            }
          } else {
            setMode("default");
          }
        } else {
          setOriginName(null);
          setMode("default");
        }
      })
      .catch((err) => {
        console.error("Error cargando EstadoPromesa:", err);
        message.error(err?.err?.message ?? err?.message ?? "No se pudieron cargar datos");
        getOcurrenciasPermitidas(oportunidadId)
          .then(list => { if (mounted) setOcurrencias(Array.isArray(list) ? list : []); })
          .catch(() => {});
      })
      .finally(() => { if (mounted) setLoading(false); });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oportunidadId, mounted]);
  
  const incrementarLlamada = async (tipo: "C" | "N") => {
    if (callLoading || creatingId || !activo) return;
    setCallLoading(true);
    try {
      // POST a: /api/VTAModVentaHistorialEstado/{IdOportunidad}/IncrementarLlamadas
      const payload = { tipo, usuario };
      await api.post(`/api/VTAModVentaHistorialEstado/${oportunidadId}/IncrementarLlamadas`, payload);
      message.success(tipo === "C" ? "Marcador de 'Contestadas' incrementado" : "Marcador de 'No contestadas' incrementado");
      emitHistorialChanged({ motivo: "incrementarLlamada", tipo });
      if (onCreado) onCreado();
    } catch (err: any) {
      console.error("incrementarLlamada error", err);
      const errMsg = err?.response?.data?.mensaje ?? err?.message ?? "Error al incrementar llamada";
      message.error(errMsg);
    } finally {
      if (mounted) setCallLoading(false);
    }
  };

  const handleSelect = async (ocId: number) => {
    if (creatingId || !activo) return;
    setCreatingId(ocId);
    try {
      await crearHistorialConOcurrencia(oportunidadId, ocId, Number(getUserIdFromToken()));
      message.success("Cambio aplicado");
      emitHistorialChanged({ motivo: "crearHistorialConOcurrencia", ocurrenciaId: ocId });
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

  const findByName = (name: string) => {
    return ocurrencias.find(o => (o.nombre ?? (o as any).Nombre ?? "").toLowerCase() === name.toLowerCase());
  };

  const renderActionBtn = (
    label: string,
    base: string,
    hover: string,
    options?: { forceDisabled?: boolean; forceEnabled?: boolean }
  ) => {
    const oc = findByName(label);
    const id = oc?.id ?? (oc as any)?.Id;
    const allowedBackend = !!oc?.allowed;

    // UI rule default (si quieres añadir reglas de UI extra usa isAllowedUI)
    const nombre = ((oc?.nombre ?? (oc as any)?.Nombre ?? "") as string).toString().toLowerCase();
    const isCorpButton = ["corporativo", "venta cruzada", "venta cruzada", "seguimiento"].includes(nombre);
    if (options?.forceDisabled) {
      const disabled = true;
      return (
        <div
          key={label}
          role="button"
          aria-disabled={true}
          style={{ ...buttonStyle("#F0F0F0", hover, true) }}
          title={oc ? "No permitido" : "Ocurrencia no encontrada"}
        >
          {label}
        </div>
      );
    }
    if (options?.forceEnabled) {
      const disabled = false;
      return (
        <div
          key={label}
          role="button"
          aria-disabled={false}
          onClick={() => { if (id && !creatingId) handleSelect(id); }}
          onMouseEnter={(e) => { if (!creatingId) (e.currentTarget as HTMLElement).style.background = hover; }}
          onMouseLeave={(e) => { if (e.currentTarget) (e.currentTarget as HTMLElement).style.background = base; }}
          style={{ ...buttonStyle(base, hover, false) }}
          title={!oc ? "Ocurrencia no encontrada" : "Seleccionar"}
        >
          {label}
        </div>
      );
    }

    const allowedFinal = !!activo && allowedBackend && !creatingId;
    const disabled = !allowedFinal || callLoading;

    const onMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!disabled) (e.currentTarget as HTMLElement).style.background = hover;
    };
    const onMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.currentTarget) (e.currentTarget as HTMLElement).style.background = disabled ? "#F0F0F0" : base;
    };

    return (
      <div
        key={label}
        role="button"
        aria-disabled={disabled}
        onClick={() => { if (!disabled && id) handleSelect(id); }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ ...buttonStyle(disabled ? "#F0F0F0" : base, hover, disabled) }}
        title={!oc ? "Ocurrencia no encontrada" : (disabled ? "No permitido" : "Seleccionar")}
      >
        {label}
      </div>
    );
  };

  // UI rules
  const isAllowedUI = (oc?: OcurrenciaDTO) => {
    if (!oc) return false;
    const nombre = (oc?.nombre ?? (oc as any).Nombre ?? "").toString().toLowerCase();

    if (mode === "corporativo") {
      return ["corporativo", "venta cruzada", "seguimiento", "cobranza", "convertido"].includes(nombre);
    }

    if (mode === "general") {
      return nombre !== "registrado" && nombre !== "promesa";
    }

    return !!(oc as any).allowed;
  };

  if (loading) return <Spin />;

  if (mode === "corporativo") {
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
        <Row gutter={8}>
          <Col span={12}>
            <Space direction="vertical" style={{ width: "100%" }} size={8}>
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 8,
                  padding: 10,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Space wrap style={{ justifyContent: "center" }} size={10}>
                  {renderActionBtn("Corporativo", "#FFF6A3", "#FFF08A", { forceDisabled: true })}
                  {renderActionBtn("Venta Cruzada", "#FFF6A3", "#FFF08A", { forceDisabled: true })}
                  {renderActionBtn("Seguimiento", "#FFF6A3", "#FFF08A", { forceDisabled: true })}
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
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Space wrap style={{ justifyContent: "center" }} size={10}>
                  {renderActionBtn("Cobranza", "#B8F3B8", "#A7E8A7")}
                  {renderActionBtn("Convertido", "#B8F3B8", "#A7E8A7")}
                </Space>
              </div>
            </Space>
          </Col>
        </Row>

        {/* Info adicional */}
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
            En esta etapa se pueden registrar oportunidades corporativas, ventas cruzadas o seguimientos.
          </Text>
        </div>

        {/* Panel Corporativo */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <Text strong style={{ color: "#0D0C11" }}>Corporativo</Text>

          <Row gutter={8} align="middle">
            <Col span={10}>
              <Text style={{ color: "#0D0C11", fontSize: 13 }}>Selecciona un producto</Text>
            </Col>
            <Col span={14}>
              <Select
                className="no-toggle"
                placeholder="Seleccione..."
                style={{ width: "100%" }}
                options={[
                  { value: "powerbi", label: "Power BI" },
                  { value: "excel", label: "Excel Empresarial" },
                  { value: "gestion", label: "Gestión de proyectos" },
                ]}
                disabled={!activo}
              />
            </Col>
          </Row>

          <Row gutter={8} align="middle">
            <Col span={10}>
              <Text style={{ color: "#0D0C11", fontSize: 13 }}>Selecciona fase</Text>
            </Col>
            <Col span={14}>
              <Select
                className="no-toggle"
                placeholder="Seleccione..."
                style={{ width: "100%" }}
                options={[
                  { value: "contacto", label: "Contacto inicial" },
                  { value: "cotizacion", label: "Cotización" },
                  { value: "negociacion", label: "Negociación" },
                ]}
                disabled={!activo}
              />
            </Col>
          </Row>

          <Row gutter={8} align="middle">
            <Col span={10}>
              <Text style={{ color: "#0D0C11", fontSize: 13 }}>Selecciona empresa</Text>
            </Col>
            <Col span={14}>
              <Select
                className="no-toggle"
                placeholder="Seleccione..."
                style={{ width: "100%" }}
                options={[
                  { value: "acme", label: "ACME Corp." },
                  { value: "globex", label: "Globex" },
                  { value: "initech", label: "Initech" },
                ]}
                disabled={!activo}
              />
            </Col>
          </Row>

          <Row gutter={8} align="middle">
            <Col span={10}>
              <Text style={{ color: "#0D0C11", fontSize: 13 }}>Selecciona cantidad</Text>
            </Col>
            <Col span={14}>
              <Select
                className="no-toggle"
                placeholder="Seleccione..."
                style={{ width: "100%" }}
                options={[
                  { value: "1-5", label: "1 a 5" },
                  { value: "6-10", label: "6 a 10" },
                  { value: "10+", label: "Más de 10" },
                ]}
                disabled={!activo}
              />
            </Col>
          </Row>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#F0F0F0",
        borderRadius: 12,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <Row justify="space-between" align="middle">
        <Text style={{ fontSize: 14, color: "#0D0C11" }}>¿Contestó?</Text>
        <Space>
          {(() => {
            const disabledYes = callLoading || !!creatingId || !activo;
            return (
              <div
                style={buttonStyle(disabledYes ? "#F0F0F0" : "#BAD4FF", "#9EC9FF", disabledYes)}
                onMouseEnter={(e) => { if (!disabledYes) (e.currentTarget as HTMLElement).style.background = "#9EC9FF"; }}
                onMouseLeave={(e) => { if (!disabledYes) (e.currentTarget as HTMLElement).style.background = "#BAD4FF"; }}
                onClick={() => { if (!disabledYes) incrementarLlamada("C"); }}
                role="button"
                aria-disabled={disabledYes}
                title={disabledYes ? (!activo ? "No activo" : "Procesando...") : "Marcar llamada contestada"}
              >
                {callLoading ? <Spin size="small" /> : "Sí"}
              </div>
            );
          })()}

          {(() => {
            const disabledNo = callLoading || !!creatingId || !activo;
            return (
              <div
                style={buttonStyle(disabledNo ? "#F0F0F0" : "#FFCDCD", "#FFB2B2", disabledNo)}
                onMouseEnter={(e) => { if (!disabledNo) (e.currentTarget as HTMLElement).style.background = "#FFB2B2"; }}
                onMouseLeave={(e) => { if (!disabledNo) (e.currentTarget as HTMLElement).style.background = "#FFCDCD"; }}
                onClick={() => { if (!disabledNo) incrementarLlamada("N"); }}
                role="button"
                aria-disabled={disabledNo}
                title={disabledNo ? (!activo ? "No activo" : "Procesando...") : "Marcar llamada no contestada"}
              >
                {callLoading ? <Spin size="small" /> : "No"}
              </div>
            );
          })()}
        </Space>
      </Row>


      <Row justify="space-between" align="middle" style={{ marginTop: 6 }}>
        <Text style={{ fontSize: 14, color: "#0D0C11" }}>Ocurrencia:</Text>
        <Space>
          <div style={{ width: 12, height: 12, background: "#5D5D5D", borderRadius: 2 }} />
          <Text style={{ fontSize: 11, color: "#5D5D5D" }}>Más información</Text>
          {originName && <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>Origen: {originName}</Text>}
        </Space>
      </Row>

      <Row gutter={8} style={{ marginTop: 8 }}>
        <Col span={12}>
          <Space direction="vertical" style={{ width: "100%" }} size={8}>
            <div style={{ background: "#FFFFFF", borderRadius: 8, padding: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", justifyContent: "center" }}>
              <Space wrap style={{ justifyContent: "center" }} size={8}>
                {renderActionBtn("Registrado", "#C9C9C9", "#BEBEBE")}
                {renderActionBtn("Calificado", "#9CBDFD", "#86ACFB")}
                {renderActionBtn("Potencial", "#9CBDFD", "#86ACFB")}
                {renderActionBtn("Promesa", "#9CBDFD", "#86ACFB")}
              </Space>
            </div>

            <div style={{ background: "#FFFFFF", borderRadius: 8, padding: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", justifyContent: "center" }}>
              <Space wrap style={{ justifyContent: "center" }} size={8}>
                {renderActionBtn("Corporativo", "#FFF6A3", "#FFF08A")}
                {renderActionBtn("Venta cruzada", "#FFF6A3", "#FFF08A")}
                {renderActionBtn("Seguimiento", "#FFF6A3", "#FFF08A")}
              </Space>
            </div>
          </Space>
        </Col>

        <Col span={12}>
          <Space direction="vertical" style={{ width: "100%" }} size={8}>
            <div style={{ background: "#FFFFFF", borderRadius: 8, padding: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", justifyContent: "center" }}>
              <Space wrap style={{ justifyContent: "center" }} size={8}>
                {renderActionBtn("Cobranza", "#B8F3B8", "#A7E8A7")}
                {renderActionBtn("Convertido", "#B8F3B8", "#A7E8A7")}
              </Space>
            </div>

            <div style={{ background: "#FFFFFF", borderRadius: 8, padding: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", justifyContent: "center" }}>
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
