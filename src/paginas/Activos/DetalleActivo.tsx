import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Layout,
  Card,
  Button,
  Spin,
  Alert,
  Row,
  Col,
  message,
  Modal,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import api from "../../servicios/api";
import styles from "./DetalleActivo.module.css";
import Timeline from "./Timeline";
import ModalAsignarResponsable from "./ModalAsignarResponsable";
import ModalActivo from "./ModalActivo";
import { getCookie } from "../../utils/cookies";
import moment from "moment";
import { jwtDecode } from "jwt-decode";
import type { Evento } from "./TipoActivos";
import { Input, Select, DatePicker, Form } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Content } = Layout;

const API_URL = import.meta.env.VITE_API_URL;

/* =========================
   INTERFACES
========================= */

interface ActivoDetalle {
  idActivo: number;
  nombre: string;
  idTipoActivo: number;
  nombreTipo: string;
  idFabricante: number;
  nombreFabricante: string;
  idPais: number;
  nombrePais: string;
  ip?: string | null;
  numeroSerie?: string | null;
  imei?: string | null;
  modelo?: string | null;
  idResponsable?: number | null;
  responsable: string;
  estacion: number;
  estado: string;
  fechaActualizacion: string;
  qrUrl?: string | null;
}

interface PersonalDetalle {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  celular: string;
  prefijoPaisCelular: string;
  pais: string;
  areaTrabajo: string;
}

/* =========================
   COMPONENT
========================= */

export default function DetalleActivo() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [activo, setActivo] = useState<ActivoDetalle | null>(null);
  const [personalDetalle, setPersonalDetalle] =
    useState<PersonalDetalle | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);

  const [qrVisible, setQrVisible] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalAsignarVisible, setModalAsignarVisible] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);

  // ==== NUEVO EVENTO ====
  const [tiposEvento, setTiposEvento] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [loadingTiposEvento, setLoadingTiposEvento] = useState(false);

  const [idTipoEvento, setIdTipoEvento] = useState<number | null>(null);
  const [detalleEvento, setDetalleEvento] = useState("");
  const [fechaEvento, setFechaEvento] = useState<moment.Moment | null>(
    moment(),
  );

  const token = getCookie("token");
  const isAuthenticated = !!token;

  const SELECT_PROPS = {
  showSearch: true,
  virtual: false,
  listHeight: 240,
  optionFilterProp: "children",
  getPopupContainer: () => document.body,
};

  /* =========================
     LOAD DATA
  ========================= */

  useEffect(() => {
    if (id) cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      const [activoRes, historialRes] = await Promise.all([
        api.get(`/api/VTAModActivos/ObtenerDetalle/${id}`),
        api.get(`/api/VTAModActivos/ObtenerPorActivo/${id}`),
      ]);

      setActivo(activoRes.data);
      setQrUrl(activoRes.data.qrUrl ?? null);

      const historial: Evento[] = (historialRes.data.historial || []).map(
        (h: any, i: number) => ({
          id: h.idHistorial ?? i + 1,
          tipo:
            h.tipoCambio === "Asignación"
              ? "assignment"
              : h.tipoCambio === "Actualización"
                ? "update"
                : "create",
          detalle: h.detalle ?? "—",
          fechaHora: h.fechaCambio,
          responsable: h.responsable ?? undefined,
        }),
      );

      setEventos(historial);

      if (activoRes.data.idResponsable) {
        cargarPersonal(activoRes.data.idResponsable);
      } else {
        setPersonalDetalle(null);
      }
    } catch (e: any) {
      setError("Error al cargar el detalle del activo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cargarTiposEvento = async () => {
      try {
        setLoadingTiposEvento(true);
        const res = await api.get("/api/VTAModActivos/tipoCambio");
        // 👉 ajusta el endpoint si el nombre real es otro
        setTiposEvento(res.data.lista ?? []);
      } finally {
        setLoadingTiposEvento(false);
      }
    };

    cargarTiposEvento();
  }, []);

  const handleAgregarEvento = async () => {
    try {
      if (!idTipoEvento || !fechaEvento || !activo) {
        message.warning("Complete los campos obligatorios");
        return;
      }

      await api.post("/api/VTAModActivos/InsertarHistorial", {
        IdActivo: activo.idActivo,
        IdTipoCambio: idTipoEvento,
        Observacion: detalleEvento,
        FechaCambio: fechaEvento.format("YYYY-MM-DDTHH:mm:ss"),
        UsuarioCambio: getUserIdFromToken(),
      });

      message.success("Evento agregado correctamente");

      // limpiar formulario
      setIdTipoEvento(null);
      setDetalleEvento("");
      setFechaEvento(moment());

      // refrescar historial
      cargarDatos();
    } catch {
      message.error("No se pudo agregar el evento");
    }
  };

  const cargarPersonal = async (idPersonal: number) => {
    try {
      setLoadingPersonal(true);
      const res = await api.get(
        `/api/VTAModVentaPersonal/ObtenerPorId/${idPersonal}`,
      );
      setPersonalDetalle(res.data);
    } finally {
      setLoadingPersonal(false);
    }
  };

  const getUserIdFromToken = () => {
    if (!token) return 0;
    try {
      const decoded: any = jwtDecode(token);
      return Number(
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ],
      );
    } catch {
      return 0;
    }
  };

  /* =========================
     QR
  ========================= */

  const handleImprimirQr = async () => {
    try {
      if (!activo) return;

      if (qrUrl) {
        setQrVisible(true);
        return;
      }

      const res = await api.post(
        `/api/VTAModActivos/GenerarQr/${activo.idActivo}`,
        { idUsuario: getUserIdFromToken() },
        { headers: { "Content-Type": "application/json" } },
      );

      setQrUrl(res.data.qrUrl);
      setQrVisible(true);
    } catch {
      message.error("No se pudo generar el código QR");
    }
  };

  const imprimirQr = () => {
    if (!qrUrl) return;

    const fullUrl = `${API_URL}${qrUrl}?t=${Date.now()}`;
    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>QR Activo</title>
          <style>
            body {
              display:flex;
              justify-content:center;
              align-items:center;
              height:100vh;
              margin:0;
            }
            img { width:300px; }
          </style>
        </head>
        <body>
          <img id="qrImg" src="${fullUrl}" />
          <script>
            const img = document.getElementById('qrImg');
            img.onload = function () {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);

    win.document.close();
  };

  /* =========================
     RENDER
  ========================= */

  if (loading) {
    return (
      <Layout>
        <Content className={styles.loadingCenter}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  if (error || !activo) {
    return (
      <Layout>
        <Content style={{ padding: 20 }}>
          <Alert type="error" message={error} />
        </Content>
      </Layout>
    );
  }

  return (
    <Content style={{ padding: 20 }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
        Volver
      </Button>

      <Card className={styles.mainCard}>
        <div className={styles.cardHeader}>
          <h2>{activo.nombre}</h2>

          {isAuthenticated && (
            <div className={styles.headerButtons}>
              <Button
                icon={<EditOutlined />}
                onClick={() => setModalEditarVisible(true)}
              >
                Editar
              </Button>

              <Button icon={<PrinterOutlined />} onClick={handleImprimirQr}>
                Imprimir código
              </Button>

              <Button onClick={() => setModalAsignarVisible(true)}>
                Asignar responsable
              </Button>
            </div>
          )}
        </div>

        <Row gutter={24}>
          <Col md={12}>
            <Card
              className={styles.subCard}
              title="🖥️ Detalles del activo"
              bordered
            >
              <div className={styles.detailGrid}>
                <div>
                  <b>ID:</b> {activo.idActivo}
                </div>
                <div>
                  <b>Tipo:</b> {activo.nombreTipo}
                </div>
                <div>
                  <b>Fabricante:</b> {activo.nombreFabricante}
                </div>
                <div>
                  <b>Modelo:</b> {activo.modelo || "-"}
                </div>
                <div>
                  <b>Estado:</b> {activo.estado}
                </div>
                <div>
                  <b>Última actualización:</b>{" "}
                  {moment(activo.fechaActualizacion).format("DD/MM/YYYY HH:mm")}
                </div>
              </div>
            </Card>
          </Col>

          <Col md={12}>
            <Card
              className={styles.subCard}
              title="👤 Responsable asignado"
              bordered
            >
              {loadingPersonal ? (
                <Spin />
              ) : personalDetalle ? (
                <div className={styles.detailGrid}>
                  <div>
                    <b>Nombre:</b> {personalDetalle.nombres}{" "}
                    {personalDetalle.apellidos}
                  </div>
                  <div>
                    <b>Correo:</b> {personalDetalle.correo}
                  </div>
                  <div>
                    <b>Área:</b> {personalDetalle.areaTrabajo}
                  </div>
                </div>
              ) : (
                <div className={styles.noResponsable}>
                  Sin responsable asignado
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={24} style={{ marginTop: 32 }}>
        {/* HISTORIAL */}
        <Col md={16}>
          <Card className={styles.timelineCard} title="🕒 Historial del activo">
            <Timeline eventos={eventos} />
          </Card>
        </Col>

        {/* FORMULARIO NUEVO EVENTO */}
        <Col md={8}>
          <Card title="➕ Agregar evento al activo">
            <Form layout="vertical">
              <Form.Item label="Tipo de evento">
                <Select
                  {...SELECT_PROPS}
                  placeholder="Seleccione un tipo"
                  allowClear
                  loading={loadingTiposEvento}
                  value={idTipoEvento}
                  onChange={(v) => setIdTipoEvento(v ?? null)}
                >
                  {tiposEvento.map((t) => (
                    <Select.Option key={t.id} value={t.id}>
                      {t.nombre}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="Detalle del evento">
                <Input.TextArea
                  rows={3}
                  placeholder="Detalle del evento"
                  value={detalleEvento}
                  onChange={(e) => setDetalleEvento(e.target.value)}
                />
              </Form.Item>

              <Form.Item label="Fecha y hora del evento">
                <DatePicker
                  showTime
                  style={{ width: "100%" }}
                  value={fechaEvento}
                  onChange={(d) => setFechaEvento(d)}
                  format="DD/MM/YYYY HH:mm"
                />
              </Form.Item>

              <Button
                type="primary"
                block
                icon={<PlusOutlined />}
                onClick={handleAgregarEvento}
              >
                Agregar evento al activo
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>

      <ModalAsignarResponsable
        visible={modalAsignarVisible}
        activo={activo}
        onCancel={() => setModalAsignarVisible(false)}
        onSubmit={cargarDatos}
      />

      <ModalActivo
        visible={modalEditarVisible}
        activo={activo}
        onCancel={() => setModalEditarVisible(false)}
        onSubmit={cargarDatos}
      />

      <Modal
        open={qrVisible}
        footer={null}
        onCancel={() => setQrVisible(false)}
        title="Código QR del activo"
        centered
      >
        {qrUrl && (
          <div style={{ textAlign: "center" }}>
            <img
              src={`${API_URL}${qrUrl}?t=${Date.now()}`}
              style={{ width: 260 }}
            />

            <div style={{ marginTop: 16 }}>
              <Button type="primary" onClick={imprimirQr}>
                Imprimir
              </Button>

              <a
                href={`${API_URL}${qrUrl}`}
                download={`activo_${activo.idActivo}.png`}
              >
                <Button style={{ marginLeft: 8 }}>Descargar</Button>
              </a>
            </div>
          </div>
        )}
      </Modal>
    </Content>
  );
}
