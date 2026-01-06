import { Card, Space, Typography, Tag, Spin, Alert, Select, DatePicker, TimePicker, Checkbox, Button, Form, message } from "antd";
import { useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import {
  WhatsAppOutlined,
  LinkedinOutlined,
  FacebookOutlined,
  PhoneOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import api from "../../servicios/api";
import HistorialInteracciones from "./HistorialInterraciones";
import { addHistorialChangedListener } from "../../utils/events";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/es";
import { getCookie } from "../../utils/cookies";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

dayjs.locale("es");

const { Text, Title } = Typography;
const { Option } = Select;

interface OportunidadDetalle {
  oportunidad: Array<{
    id: number;
    codigoLanzamiento: string;
    codigoLinkedin: string;
    fechaCreacion: string;
    totalOportunidadesPersona: number;
    origen: string | null;
    idPersonaAsignada?: number | null;
    personaAsignadaNombre?: string | null;
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

interface Asesor {
  idUsuario: number;
  idPersona: number;
  nombre: string;
  idRol: number;
}

export default function HistorialInteraccion() {
  const { id } = useParams<{ id: string }>();
  const [oportunidad, setOportunidad] = useState<OportunidadDetalle | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para reasignación
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [loadingAsesores, setLoadingAsesores] = useState<boolean>(true);
  const [asesorDestino, setAsesorDestino] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<Dayjs | null>(null);
  const [forzarReasignacion, setForzarReasignacion] = useState(true);
  const [loadingReasignacion, setLoadingReasignacion] = useState(false);
  const [userRole, setUserRole] = useState<number>(0);

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

  const token = getCookie("token");

  const getUserIdFromToken = () => {
    if (!token) return 0;
    try {
      const decoded: any = jwtDecode(token);
      const userId =
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ];
      return userId ? Number(userId) : 0;
    } catch (e) {
      console.error("Error decodificando token", e);
      return 0;
    }
  };

  const getUserRoleFromToken = () => {
    if (!token) return 0;
    try {
      const decoded: any = jwtDecode(token);
      const rolNombre =
        decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "";

      const rolesMap: Record<string, number> = {
        Asesor: 1,
        Supervisor: 2,
        Gerente: 3,
        Administrador: 4,
        Desarrollador: 5,
      };

      return rolesMap[rolNombre] ?? 0;
    } catch (e) {
      console.error("Error decodificando token", e);
      return 0;
    }
  };

  const obtenerAsesores = async () => {
    try {
      setLoadingAsesores(true);
      if (!token) throw new Error("No se encontró el token de autenticación");

      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:7020"
        }/api/CFGModUsuarios/ObtenerUsuariosPorRol/1`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data;
      if (data?.usuarios && Array.isArray(data.usuarios)) {
        const listaAsesores = data.usuarios.map((u: any) => ({
          idUsuario: u.id,
          idPersona: u.idPersona,
          nombre: u.nombre,
          idRol: u.idRol,
        }));
        setAsesores(listaAsesores);
      } else {
        setAsesores([]);
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.mensaje ||
        err?.message ||
        "Error al cargar asesores";
      message.error(errorMessage);
      setAsesores([]);
    } finally {
      setLoadingAsesores(false);
    }
  };

  const handleConfirmarReasignacion = async () => {
    if (!asesorDestino || !selectedDate || !selectedTime || !id) {
      message.warning("Debe completar todos los campos");
      return;
    }

    try {
      setLoadingReasignacion(true);

      const asesor = asesores.find((a) => a.idUsuario === asesorDestino);
      if (!asesor) {
        message.error("Asesor no encontrado");
        return;
      }

      const userId = getUserIdFromToken();
      if (!userId || userId === 0) {
        message.error("No se pudo obtener el ID de usuario del token");
        return;
      }

      // Fecha de recordatorio con hora formateada
      const fechaRecordatorioISO = selectedDate
        .hour(selectedTime.hour())
        .minute(selectedTime.minute())
        .second(0)
        .toISOString();

      const horaRecordatorio = selectedTime.format("HH:mm");

      // Crear interacción de recordatorio
      const payloadInteraccion = {
        id: 0,
        idOportunidad: Number(id),
        idTipo: 10,
        detalle:
          "Recordatorio inicial de reasignación de la oportunidad, generado automáticamente",
        celular: "",
        fechaRecordatorio: fechaRecordatorioISO,
        estado: true,
        fechaCreacion: new Date().toISOString(),
        usuarioCreacion: userId.toString(),
        fechaModificacion: new Date().toISOString(),
        usuarioModificacion: userId.toString(),
      };

      console.log("📤 Enviando interacción:", payloadInteraccion);

      try {
        await axios.post(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:7020"
          }/api/VTAModVentaHistorialInteraccion/Insertar`,
          payloadInteraccion,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("✅ Interacción creada exitosamente");
      } catch (interaccionError: any) {
        console.error("❌ Error al crear interacción:", interaccionError);
        throw new Error(
          `Error al crear interacción: ${
            interaccionError?.response?.data?.mensaje ||
            interaccionError?.message
          }`
        );
      }

      // Asignar asesor
      const payload = {
        IdOportunidades: [Number(id)],
        IdAsesor: asesor.idPersona,
        UsuarioModificacion: userId.toString(),
        FechaRecordatorio: fechaRecordatorioISO,
        HoraRecordatorio: horaRecordatorio,
      };

      console.log("📤 Enviando asignación:", payload);

      try {
        const response = await axios.post(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:7020"
          }/api/VTAModVentaOportunidad/AsignarAsesor`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("📥 Respuesta de asignación:", response.data);

        if (response.data.codigo === "SIN ERROR") {
          message.success("Asesor asignado correctamente");
          setAsesorDestino(null);
          setSelectedDate(null);
          setSelectedTime(null);
          setForzarReasignacion(true);

          // Esperar un momento antes de refrescar para que el backend actualice todos los registros
          setTimeout(() => {
            fetchDetalle();
            // Segundo intento después de 1 segundo adicional para asegurar la actualización
            setTimeout(() => {
              fetchDetalle();
            }, 1000);
          }, 500);
        } else {
          message.error(response.data.mensaje || "Error al asignar asesor");
        }
      } catch (asignacionError: any) {
        console.error("❌ Error al asignar asesor:", asignacionError);
        throw new Error(
          `Error al asignar asesor: ${
            asignacionError?.response?.data?.mensaje ||
            asignacionError?.message
          }`
        );
      }
    } catch (err: any) {
      console.error("❌ Error general:", err);
      message.error(err?.message || "Error al procesar la reasignación");
    } finally {
      setLoadingReasignacion(false);
    }
  };

  useEffect(() => {
    fetchDetalle();
    obtenerAsesores();
    setUserRole(getUserRoleFromToken());
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

  const personaAsignadaNombre = (
    oportunidadData.personaAsignadaNombre ?? ""
  ).trim();
  const personaAsignadaApellidos = (
    oportunidadData.personaAsignadaApellidos ?? ""
  ).trim();
  const nombreCompletoPersonaAsignada =
    personaAsignadaNombre || personaAsignadaApellidos
      ? `${personaAsignadaNombre} ${personaAsignadaApellidos}`.trim()
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
                {asignadoDisplay}
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

      {/* === Sección de Reasignación === Solo visible para roles superiores (no asesores) */}
      {userRole !== 1 && (
        <>
          <Title level={5} style={{ margin: "16px 0 12px 0", color: "#252C35" }}>
            Reasignación de Oportunidad
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
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                {/* Select de Asesor */}
                <div>
                  <Text
                    style={{
                      color: "#676767",
                      fontSize: 13,
                      fontWeight: 600,
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Asesor destino<span style={{ color: "#ff4d4f" }}>*</span>
                  </Text>
                  {loadingAsesores ? (
                    <Spin size="small" />
                  ) : (
                    <Select
                      showSearch
                      value={asesorDestino ?? undefined}
                      onChange={setAsesorDestino}
                      placeholder="Selecciona un asesor"
                      style={{ width: "100%" }}
                      size="middle"
                      virtual={false}
                      filterOption={(input, option) =>
                        (option?.children as unknown as string)
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      listHeight={200}
                    >
                      {asesores.map((a) => (
                        <Option key={a.idUsuario} value={a.idUsuario}>
                          {a.nombre}
                        </Option>
                      ))}
                    </Select>
                  )}
                </div>

                {/* Fecha y Hora */}
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: "#676767",
                        fontSize: 13,
                        fontWeight: 600,
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Fecha<span style={{ color: "#ff4d4f" }}>*</span>
                    </Text>
                    <DatePicker
                      value={selectedDate}
                      onChange={(d) => setSelectedDate(d)}
                      format="DD/MM/YYYY"
                      style={{ width: "100%" }}
                      suffixIcon={<CalendarOutlined />}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: "#676767",
                        fontSize: 13,
                        fontWeight: 600,
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Hora<span style={{ color: "#ff4d4f" }}>*</span>
                    </Text>
                    <TimePicker
                      value={selectedTime}
                      onChange={(t) => setSelectedTime(t)}
                      format="HH:mm"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                {/* Programado para */}
                <div
                  style={{
                    background: "#f0f2f5",
                    padding: "10px 14px",
                    borderRadius: 6,
                    fontSize: 13,
                  }}
                >
                  {selectedDate && selectedTime ? (
                    <>
                      <Text style={{ fontWeight: 600, color: "#0D0C11" }}>
                        Programado para:{" "}
                      </Text>
                      <Text style={{ color: "#0D0C11" }}>
                        {selectedDate.format("dddd").charAt(0).toUpperCase() +
                          selectedDate.format("dddd").slice(1)}
                        , {selectedDate.format("DD [de] MMMM [de] YYYY")} a las{" "}
                        {selectedTime.format("HH:mm")} horas
                      </Text>
                    </>
                  ) : (
                    <Text style={{ color: "#888" }}>
                      Programado para: seleccione fecha y hora
                    </Text>
                  )}
                </div>

                {/* Checkbox */}
                <Checkbox
                  checked={forzarReasignacion}
                  onChange={(e) => setForzarReasignacion(e.target.checked)}
                  style={{ fontSize: 13 }}
                >
                  Forzar reasignación incluso si la oportunidad ya tiene asesor
                  asignado
                </Checkbox>

                {/* Botón de confirmar */}
                <Button
                  type="primary"
                  block
                  size="large"
                  style={{
                    background: "#1677ff",
                    borderColor: "#1677ff",
                    fontWeight: 600,
                  }}
                  disabled={!asesorDestino || !selectedDate || !selectedTime}
                  loading={loadingReasignacion}
                  onClick={handleConfirmarReasignacion}
                >
                  Confirmar reasignación
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}

      <HistorialInteracciones />
    </div>
  );
}
