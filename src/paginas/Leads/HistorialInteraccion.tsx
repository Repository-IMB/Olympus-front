import { Card, Space, Typography, Tag, Spin, Alert } from "antd";
import { useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import {
  WhatsAppOutlined,
  LinkedinOutlined,
  FacebookOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import api from "../../servicios/api";
import HistorialInteracciones from "./HistorialInterraciones";
import { addHistorialChangedListener } from "../../utils/events";

const { Text, Title } = Typography;

interface OportunidadDetalle {
  oportunidad: Array<{
    id: number;
    codigoLanzamiento: string;
    codigoLinkedin: string;
    fechaCreacion: string;
    totalOportunidadesPersona: number;
    origen: string | null;
    idPersonaAsignada?: number | null;
    personalAsignadaNombre?: string | null;
    personaAsignadaApellidos?: string | null;
    personaAsignadaCorreo?: string | null;
    fechaFormulario: string;
  }>;
  historialActual: Array<{
    id: number;
    cantidadLlamadasContestadas: number;
    cantidadLlamadasNoContestadas: number;
    asesor: {
      nombres: string;
      apellidos: string;
    } | null;
    estadoReferencia: {
      nombre: string;
    } | null;
  }>;
}

export default function HistorialInteraccion() {
  const { id } = useParams<{ id: string }>();
  const [oportunidad, setOportunidad] = useState<OportunidadDetalle | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetalle = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(
        `/api/VTAModVentaOportunidad/ObtenerDetallePorId/${id}`
      );
      setOportunidad(res.data ?? null);
    } catch (err: any) {
      console.error("Error al obtener detalles:", err);
      setError("Error al obtener los datos de la oportunidad");
      setOportunidad(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetalle();
    const removeListener = addHistorialChangedListener(() => {
      fetchDetalle();
    });

    return () => {
      removeListener();
    };
  }, [fetchDetalle]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  if (
    !oportunidad ||
    !oportunidad.oportunidad ||
    oportunidad.oportunidad.length === 0
  ) {
    return (
      <Alert message="No se encontró la oportunidad" type="info" showIcon />
    );
  }

  const oportunidadData = oportunidad.oportunidad[0];
  const historialActualData =
    oportunidad.historialActual && oportunidad.historialActual.length > 0
      ? oportunidad.historialActual[0]
      : null;
  const codigoLinkedin = oportunidadData.codigoLinkedin || "-";
  const asesorNombre = historialActualData?.asesor?.nombres?.trim() ?? "";

  const asesorApellidos = historialActualData?.asesor?.apellidos?.trim() ?? "";

  const asesorCompleto =
    asesorNombre || asesorApellidos
      ? `${asesorNombre} ${asesorApellidos}`.trim()
      : null;
  const codigoLanzamiento = oportunidadData.codigoLanzamiento || "-";
  const fechaFormulario = oportunidadData.fechaFormulario || "-";
  const fechaCreacion = oportunidadData.fechaCreacion || "-";
  const estado = historialActualData?.estadoReferencia?.nombre || "Desconocido";
  const marcaciones = Number(
    historialActualData?.cantidadLlamadasNoContestadas ?? 0
  );

  const personalAsignadaNombre = (
    oportunidadData.personalAsignadaNombre ?? ""
  ).trim();
  const personaAsignadaApellidos = (
    oportunidadData.personaAsignadaApellidos ?? ""
  ).trim();
  const nombreCompletoPersonaAsignada =
    personalAsignadaNombre || personaAsignadaApellidos
      ? `${personalAsignadaNombre} ${personaAsignadaApellidos}`.trim()
      : null;

  const asignadoDisplay =
    asesorCompleto || nombreCompletoPersonaAsignada || "Sin asignar";
  const cantidadOportunidades = oportunidadData.totalOportunidadesPersona || 0;
  const origen = oportunidadData.origen || "WhatsApp";

  const formatearFecha = (fecha: string) => {
    if (!fecha || fecha === "-") return "-";
    const date = new Date(fecha);
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* === Título principal === */}
      <Title level={5} style={{ margin: 0, color: "#252C35" }}>
        Oportunidad actual
      </Title>

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Card
          style={{
            width: "100%",
            background: "#F0F0F0",
            borderRadius: 8,
            border: "1px solid #DCDCDC",
            boxShadow: "inset 1px 1px 4px rgba(0,0,0,0.25)",
            padding: 6,
          }}
          bodyStyle={{ padding: 0 }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 6,
              border: "1px solid #DCDCDC",
              padding: 8,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <Space size={4}>
              <Text style={{ color: "#676767", fontSize: 13, fontWeight: 300 }}>
                Código lanzamiento:
              </Text>
              <Text style={{ color: "#0D0C11", fontSize: 14 }}>
                {codigoLanzamiento}
              </Text>
            </Space>

            <Space size={4}>
              <Text style={{ color: "#676767", fontSize: 13, fontWeight: 300 }}>Código Linkedin:</Text>
              <Text style={{ color: "#0D0C11", fontSize: 14 }}>{codigoLinkedin}</Text>
            </Space>
            
            <Space size={4}>
              <Text style={{ color: "#676767", fontSize: 13, fontWeight: 300 }}>
                Fecha de formulario:
              </Text>
              <Text style={{ color: "#010101", fontSize: 14 }}>
                {formatearFecha(fechaFormulario)}
              </Text>
            </Space>

            <Space size={4}>
              <Text style={{ color: "#676767", fontSize: 13, fontWeight: 300 }}>
                Fecha de creación:
              </Text>
              <Text style={{ color: "rgba(0,0,0,0.85)", fontSize: 14 }}>
                {formatearFecha(fechaCreacion)}
              </Text>
            </Space>

            <Space size={4} align="center">
              <Text style={{ color: "#676767", fontSize: 13, fontWeight: 300 }}>
                Estado:
              </Text>
              <Tag
                style={{
                  background: "#BAD4FF",
                  color: "#000",
                  fontSize: 12,
                  borderRadius: 4,
                  padding: "0 10px",
                }}
              >
                {estado}
              </Tag>
            </Space>

            <Space size={4} align="center">
              <Text style={{ color: "#676767", fontSize: 13, fontWeight: 300 }}>
                Marcaciones:
              </Text>
              <Tag
                style={{
                  background: "#FFCDCD",
                  color: "#000",
                  fontSize: 12,
                  borderRadius: 4,
                  padding: "0 8px",
                }}
              >
                {marcaciones}
              </Tag>
            </Space>

            <Space size={4}>
              <Text style={{ color: "#676767", fontSize: 13, fontWeight: 300 }}>
                Asesor asignado:
              </Text>
              <Text style={{ color: "#0D0C11", fontSize: 14 }}>
                {nombreCompletoPersonaAsignada || asignadoDisplay || "Sin asignar"}
              </Text>
            </Space>

            <Space size={4}>
              <Text style={{ color: "#676767", fontSize: 13, fontWeight: 300 }}>
                Otras oportunidades:
              </Text>
              <Text style={{ color: "#005FF8", fontSize: 14, fontWeight: 500 }}>
                {cantidadOportunidades}
              </Text>
            </Space>

            <Space size={4} align="center">
              <Text style={{ color: "#676767", fontSize: 13, fontWeight: 300 }}>
                Origen:
              </Text>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {(() => {
                  const o = (origen ?? "").toString().toLowerCase();

                  if (o === "linkedin") {
                    return (
                      <div
                        style={{
                          borderRadius: 4,
                          padding: 1,
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            background: "#0077B5",
                            borderRadius: 4,
                            padding: "2px 6px",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <LinkedinOutlined
                            style={{ color: "#FFFFFF", fontSize: 12 }}
                          />
                          <Text
                            style={{
                              color: "#FFFFFF",
                              fontSize: 13,
                              fontWeight: 600,
                              margin: 0,
                            }}
                          >
                            LinkedIn
                          </Text>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      style={{
                        borderRadius: 4,
                        border: "1px solid #DCDCDC",
                        padding: "2px 6px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        background: "transparent",
                      }}
                    >
                      <PhoneOutlined
                        style={{ color: "#0D0C11", fontSize: 12 }}
                      />
                      <Text
                        style={{
                          color: "#0D0C11",
                          fontSize: 13,
                          fontWeight: 600,
                          margin: 0,
                        }}
                      >
                        Manual
                      </Text>
                    </div>
                  );
                })()}
              </div>
            </Space>

            {/* <Space size={4} align="center">
              <Text style={{ color: "#676767", fontSize: 13, fontWeight: 300 }}>Origen:</Text>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                
                <div
                  style={{
                    borderRadius: 4,
                    border: origen === "WhatsApp" || origen === "Whatsapp" ? "1px solid #0D0C11" : "none",
                    padding: 1,
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      background: "#25D366",
                      borderRadius: 4,
                      padding: "2px 6px",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <WhatsAppOutlined style={{ color: "#FFFFFF", fontSize: 12 }} />
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 600, margin: 0 }}>WhatsApp</Text>
                  </div>
                </div>

                
                <div
                  style={{
                    borderRadius: 4,
                    border: origen === "LinkedIn" || origen === "Linkedin" ? "1px solid #0D0C11" : "none",
                    padding: 1,
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      background: "#0077B5",
                      borderRadius: 4,
                      padding: "2px 6px",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <LinkedinOutlined style={{ color: "#FFFFFF", fontSize: 12 }} />
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 600, margin: 0 }}>LinkedIn</Text>
                  </div>
                </div>

                
                <div
                  style={{
                    borderRadius: 4,
                    border: origen === "Facebook" || origen === "Face" ? "1px solid #0D0C11" : "none",
                    padding: 1,
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      background: "#1877F2",
                      borderRadius: 4,
                      padding: "2px 6px",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <FacebookOutlined style={{ color: "#FFFFFF", fontSize: 12 }} />
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 600, margin: 0 }}>Face</Text>
                  </div>
                </div>

                
                <div
                  style={{
                    borderRadius: 4,
                    border: origen === "Manual" || origen === "Meta" ? "1px solid #0D0C11" : "1px solid #DCDCDC",
                    padding: "2px 6px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "transparent",
                  }}
                >
                  <PhoneOutlined style={{ color: "#0D0C11", fontSize: 12 }} />
                  <Text style={{ color: "#0D0C11", fontSize: 13, fontWeight: 600, margin: 0 }}>Manual</Text>
                </div>
              </div>
            </Space> */}
          </div>
        </Card>
      </div>

      <HistorialInteracciones />
    </div>
  );
}
