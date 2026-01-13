"use client";
import React, { useEffect, useState } from "react";
import { Card, Row, Col, Select, Input, message, Button, Modal } from "antd";
import {
  ExclamationCircleOutlined,
  PlusCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import axios from "axios";
import Cookies from "js-cookie";
import CallProgressBar from "../../componentes/CallProgressBar";
import { jwtDecode } from "jwt-decode";

const { TextArea } = Input;

const colMinWidth = 120;
const idColWidth = 60;

// 🔹 Mapa de IDs a nombres de estado
const ESTADOS_MAP: Record<number, string> = {
  1: "Pendiente",
  2: "Registrado",
};

type HistorialEstado = {
  id: number;
  idOportunidad: number;
  IdPersonal: number;
  idMotivo: number;
  idEstado: number;
  observaciones: string;
  cantidadLlamadasContestadas: number;
  cantidadLlamadasNoContestadas: number;
  idMigracion: number;
  estado: boolean;
  fechaCreacion?: string | null;
};

export default function TablaEstadosReducida({
  idOportunidad,
}: {
  idOportunidad?: string;
}) {
  const [historial, setHistorial] = useState<HistorialEstado[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    idMotivo: 1,
    idEstado: 1,
    observaciones: "",
  });

  const token = Cookies.get("token");

  // 🔹 Obtener historial desde API
  const fetchHistorial = async () => {
    try {
      const res = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/api/VTAModVentaOportunidad/HistorialEstado/PorOportunidad/${idOportunidad}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setHistorial(res.data.historialEstado || []);
    } catch (err) {
      message.error("Error al obtener historial de estados");
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, [idOportunidad]);

  // 🔹 Cambiar entre expandido / contraído
  const toggleRow = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // 🔹 Obtener color según estado
  const etapaColor = (idEstado: number) => {
    const estado = ESTADOS_MAP[idEstado]?.toLowerCase() || "";
    if (["pendiente", "no calificado", "perdido"].includes(estado))
      return "#ff4d4f";
    if (["cliente"].includes(estado)) return "#52c41a";
    if (["registrado", "calificado", "potencial", "promesa"].includes(estado))
      return "#1677ff";
    return "#9ca3af";
  };

  // 🔹 Obtener ID de usuario desde el token
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

  // 🔹 POST - Agregar nuevo estado
  const handleGuardar = async () => {
    try {
      const body = {
        idOportunidad: Number(idOportunidad),
        IdPersonal: Number(getUserIdFromToken()),
        idMotivo: formData.idMotivo,
        idEstado: formData.idEstado,
        observaciones: formData.observaciones,
        cantidadLlamadasContestadas: 0,
        cantidadLlamadasNoContestadas: 0,
        idMigracion: 0,
        estado: true,
      };

      await axios.post(
        `${
          import.meta.env.VITE_API_URL
        }/api/VTAModVentaHistorialEstado/Insertar`,
        body,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      message.success("Estado agregado correctamente");
      setModalVisible(false);
      setFormData({ idMotivo: 1, idEstado: 1, observaciones: "" });
      fetchHistorial();
    } catch (err) {
      message.error("Error al agregar estado");
    }
  };

  // 🔹 PUT - Actualizar llamadas
  const actualizarLlamadas = async (
    item: HistorialEstado,
    nuevasContestadas: number,
    nuevasNoContestadas: number
  ) => {
    try {
      const body = {
        ...item,
        cantidadLlamadasContestadas: nuevasContestadas,
        cantidadLlamadasNoContestadas: nuevasNoContestadas,
      };

      await axios.put(
        `${
          import.meta.env.VITE_API_URL
        }/api/VTAModVentaHistorialEstado/Actualizar`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success("Historial actualizado");
      fetchHistorial();
    } catch (err) {
      message.error("Error al actualizar llamadas");
    }
  };

  return (
    <Col xs={24} md={15} lg={16}>
      <h4 style={{ marginBottom: 8, fontWeight: 700 }}>
        Historial de Estados ({historial.length})
      </h4>

      <Card
        style={{
          backgroundColor: "#f1f5f598",
          borderRadius: 12,
          padding: 2,
          minHeight: 100,
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            style={{
              backgroundColor: "#000",
              borderColor: "#000",
            }}
            onClick={() => setModalVisible(true)}
          >
            Agregar Estado
          </Button>
        </div>

        <div
          style={{
            flex: 1,
            overflow: "auto",
            background: "#f9fafb",
            padding: 8,
            borderRadius: 8,
          }}
        >
          <div style={{ minWidth: `${colMinWidth * 5}px` }}>
            {/* CABECERA */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `${idColWidth}px repeat(4, minmax(${colMinWidth}px, 1fr))`,
                background: "#0f1724",
                color: "#fff",
                borderRadius: 10,
                padding: 6,
                alignItems: "center",
                gap: 4,
                marginBottom: 6,
                position: "sticky",
                top: 0,
                zIndex: 5,
                fontSize: 12,
              }}
            >
              <div style={{ textAlign: "center" }}>ID</div>
              <div style={{ textAlign: "center" }}>Fecha de Creación</div>
              <div style={{ textAlign: "center" }}>Estado</div>
              <div style={{ textAlign: "center" }}>Marcación</div>
              <div style={{ textAlign: "center" }}>Asesor</div>
            </div>

            {/* FILAS */}
            {historial.length > 0 ? (
              historial.map((item) => {
                const isExpanded = expandedId === item.id;
                const estadoTexto = ESTADOS_MAP[item.idEstado] || "Desconocido";

                return (
                  <div key={item.id}>
                    <div
                      onClick={() => toggleRow(item.id)}
                      style={{
                        display: "grid",
                        gridTemplateColumns: `${idColWidth}px repeat(4, minmax(${colMinWidth}px, 1fr))`,
                        alignItems: "center",
                        gap: 4,
                        background: "#fff",
                        borderRadius: 8,
                        padding: 8,
                        marginBottom: 4,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: isExpanded ? 700 : 500,
                        border: isExpanded ? "2px solid #1677ff" : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ textAlign: "center" }}>{item.id}</div>
                      <div style={{ textAlign: "center" }}>
                        {item.fechaCreacion || "Sin fecha"}
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            background: etapaColor(item.idEstado),
                            color: "#fff",
                            padding: "4px 6px",
                            borderRadius: 999,
                            textAlign: "center",
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          {estadoTexto}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            background: "#1677ff",
                            borderRadius: 4,
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 600,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          {item.cantidadLlamadasContestadas}
                        </div>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            background: "#ff4d4f",
                            borderRadius: 4,
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 600,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          {item.cantidadLlamadasNoContestadas}
                        </div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        {item.IdPersonal || "-"}
                      </div>
                    </div>

                    {isExpanded && (
                      <Card
                        style={{
                          backgroundColor: "#f1f5f598",
                          borderRadius: 8,
                          padding: 8,
                          marginBottom: 8,
                        }}
                      >
                        <Row gutter={16}>
                          {/* IZQUIERDA */}
                          <Col xs={24} md={12}>
                            <div style={{ marginBottom: 8 }}>
                              <label style={{ fontWeight: 600, fontSize: 12 }}>
                                <ExclamationCircleOutlined
                                  style={{ marginRight: 4, color: "#1677ff" }}
                                />
                                Motivo
                              </label>
                              <Select
                                value={item.idMotivo || "Sin motivo"}
                                disabled
                                style={{ width: "100%", fontSize: 12 }}
                                options={[
                                  { value: "Sin motivo", label: "Sin motivo" },
                                ]}
                              />
                            </div>

                            <div>
                              <label style={{ fontWeight: 600, fontSize: 12 }}>
                                <ExclamationCircleOutlined
                                  style={{ marginRight: 4, color: "#1677ff" }}
                                />
                                Observación
                              </label>
                              <TextArea
                                rows={3}
                                style={{
                                  fontSize: 12,
                                  backgroundColor: "#fff",
                                  color: "#111827",
                                  cursor: "default",
                                }}
                                value={
                                  item.observaciones || "Sin observaciones"
                                }
                                disabled
                              />
                            </div>
                          </Col>

                          {/* DERECHA */}
                          <Col xs={24} md={12}>
                            <CallProgressBar
                              answered={item.cantidadLlamadasContestadas}
                              unanswered={item.cantidadLlamadasNoContestadas}
                              onUpdate={(a, n) =>
                                actualizarLlamadas(item, a, n)
                              }
                            />
                          </Col>
                        </Row>
                      </Card>
                    )}
                  </div>
                );
              })
            ) : (
              <p style={{ color: "#6b7280" }}>No hay historial registrado.</p>
            )}
          </div>
        </div>
      </Card>

      {/* 🔹 MODAL AGREGAR ESTADO */}
      <Modal
        open={modalVisible}
        footer={null}
        closable={false}
        centered
        width={400}
      >
        {/* Header personalizado */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 10,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            Agregar Estado
          </h3>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => setModalVisible(false)}
          />
        </div>

        {/* Campos */}
        <div style={{ padding: "16px 0" }}>
          <label style={{ fontWeight: 600, fontSize: 12 }}>Motivo</label>
          <Select
            value={formData.idMotivo}
            onChange={(value) => setFormData({ ...formData, idMotivo: value })}
            style={{ width: "100%", marginBottom: 12 }}
            options={[{ value: 1, label: "El cliente no responde" }]}
          />

          <label style={{ fontWeight: 600, fontSize: 12 }}>Estado</label>
          <Select
            value={formData.idEstado}
            onChange={(value) => setFormData({ ...formData, idEstado: value })}
            style={{ width: "100%", marginBottom: 12 }}
            options={[
              { value: 1, label: "Pendiente" },
              { value: 2, label: "Registrado" },
            ]}
          />

          <label style={{ fontWeight: 600, fontSize: 12 }}>Observaciones</label>
          <TextArea
            rows={3}
            value={formData.observaciones}
            onChange={(e) =>
              setFormData({ ...formData, observaciones: e.target.value })
            }
          />
        </div>

        {/* Línea + Botón Guardar */}
        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            marginTop: 10,
            paddingTop: 10,
          }}
        >
          <Button
            type="primary"
            block
            style={{
              background: "#1677ff",
              borderColor: "#1677ff",
              fontWeight: 600,
            }}
            onClick={handleGuardar}
          >
            Guardar
          </Button>
        </div>
      </Modal>
    </Col>
  );
}
