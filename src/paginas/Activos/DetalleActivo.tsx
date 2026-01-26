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
  Form,
  Input,
  Select,
  DatePicker,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  PrinterOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import api from "../../servicios/api";
import styles from "./DetalleActivo.module.css";
import Timeline from "./Timeline";
import ModalAsignarResponsable from "./ModalAsignarResponsable";
import { getCookie } from "../../utils/cookies";

const { Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;

interface Activo {
  idActivo: number;
  nombre: string;
  tipo: string;
  ip: string;
  numeroSerie: string;
  imei: string;
  fabricante: string;
  modelo: string;
  ubicacionSede: string;
  estacion: number;
  estado: string;
  responsable: string;
  fechaActualizacion: string;
}

interface Responsable {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  pais: string;
  documento: string;
  areaTrabajo: string;
  rol: string;
}

interface Evento {
  id: number;
  tipo: string;
  detalle: string;
  fechaHora: string;
  color: string;
}

export default function DetalleActivo() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [activo, setActivo] = useState<Activo | null>(null);
  const [responsable, setResponsable] = useState<Responsable | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingEvento, setLoadingEvento] = useState(false);
  const [modalAsignarVisible, setModalAsignarVisible] = useState(false);

  // Detectar si el usuario está autenticado
  const token = getCookie("token");
  const isAuthenticated = !!token;

  useEffect(() => {
    if (id) {
      cargarDatos();
    }
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      // TODO: Reemplazar con llamada real a la API
      // const res = await api.get(`/api/Activos/ObtenerDetalleActivo/${id}`);
      
      // Datos de ejemplo
      const activoEjemplo: Activo = {
        idActivo: 9675345,
        nombre: "MacBookPro",
        tipo: "Laptop",
        ip: "162.248.143.12",
        numeroSerie: "162.248.143.12",
        imei: "",
        fabricante: "Apple",
        modelo: "MacBookPro17",
        ubicacionSede: "Perú",
        estacion: 1,
        estado: "Asignado",
        responsable: "Rafael Corzo",
        fechaActualizacion: "2025-09-24T23:00:00",
      };

      const responsableEjemplo: Responsable = {
        nombres: "Jose Rafael",
        apellidos: "Corzo Luis",
        correo: "abdielsingh8@gmail.com",
        telefono: "50765494432",
        pais: "Peru",
        documento: "12345678",
        areaTrabajo: "Ejemplo",
        rol: "Ejemplo",
      };

      const eventosEjemplo: Evento[] = [
        {
          id: 1,
          tipo: "create",
          detalle: "Create a services site",
          fechaHora: "2015-09-01T10:00:00",
          color: "blue",
        },
        {
          id: 2,
          tipo: "solve",
          detalle: "Solve initial network problems",
          fechaHora: "2015-09-01T11:00:00",
          color: "green",
        },
        {
          id: 3,
          tipo: "description",
          detalle: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
          fechaHora: "2015-09-01T12:00:00",
          color: "default",
        },
        {
          id: 4,
          tipo: "network",
          detalle: "Network problems being solved",
          fechaHora: "2015-09-01T13:00:00",
          color: "red",
        },
        {
          id: 5,
          tipo: "create",
          detalle: "Create a services site",
          fechaHora: "2015-09-01T14:00:00",
          color: "blue",
        },
        {
          id: 6,
          tipo: "testing",
          detalle: "Technical testing",
          fechaHora: "2015-09-01T15:00:00",
          color: "default",
        },
      ];

      setActivo(activoEjemplo);
      setResponsable(responsableEjemplo);
      setEventos(eventosEjemplo);
    } catch (e: any) {
      setError(
        e?.response?.data?.mensaje ??
          e?.message ??
          "Error al cargar los datos del activo"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarEvento = async (values: any) => {
    try {
      setLoadingEvento(true);
      // TODO: Reemplazar con llamada real a la API
      // await api.post(`/api/Activos/AgregarEvento/${id}`, values);
      
      const nuevoEvento: Evento = {
        id: eventos.length + 1,
        tipo: values.tipoEvento,
        detalle: values.detalleEvento,
        fechaHora: values.fechaHora.format("YYYY-MM-DDTHH:mm:ss"),
        color: "blue",
      };

      setEventos([nuevoEvento, ...eventos]);
      form.resetFields();
      message.success("Evento agregado exitosamente");
    } catch (e: any) {
      message.error(
        e?.response?.data?.mensaje ?? "Error al agregar el evento"
      );
    } finally {
      setLoadingEvento(false);
    }
  };

  // Si no está autenticado, usar Layout completo sin MainLayout
  const Wrapper = isAuthenticated ? Content : Layout;

  if (loading) {
    return (
      <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
        <Content style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
            }}
          >
            <Spin size="large" />
          </div>
        </Content>
      </Layout>
    );
  }

  if (error || !activo) {
    return (
      <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
        <Content style={{ padding: "20px" }}>
          {isAuthenticated && (
            <Button
              icon={<ArrowLeftOutlined />}
              style={{ marginBottom: 16 }}
              onClick={() => navigate(-1)}
            >
              Volver
            </Button>
          )}
          <Alert message="Error" description={error || "Activo no encontrado"} type="error" showIcon />
        </Content>
      </Layout>
    );
  }

  // Si no está autenticado, usar Layout completo; si está autenticado, solo Content
  if (!isAuthenticated) {
    return (
      <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
        <Content style={{ padding: "20px" }}>
          {/* Card principal con detalles */}
          <Card className={styles.mainCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.activoTitle}>{activo.nombre}</h2>
            </div>

            <Row gutter={24} className={styles.detailsRow}>
              {/* Detalles del activo */}
              <Col xs={24} md={12}>
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Detalles del activo</h3>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>IdActivo:</span>
                      <span className={styles.detailValue}>{activo.idActivo}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Tipo:</span>
                      <span className={styles.detailValue}>{activo.tipo}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>IP:</span>
                      <span className={styles.detailValue}>{activo.ip}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Fabricante:</span>
                      <span className={styles.detailValue}>{activo.fabricante}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Modelo:</span>
                      <span className={styles.detailValue}>{activo.modelo}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Sede:</span>
                      <span className={styles.detailValue}>{activo.ubicacionSede}</span>
                    </div>
                  </div>
                </div>
              </Col>

              {/* Detalles del responsable */}
              <Col xs={24} md={12}>
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>
                    Detalles del responsable actual
                  </h3>
                  {responsable ? (
                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Nombres:</span>
                        <span className={styles.detailValue}>
                          {responsable.nombres}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Apellidos:</span>
                        <span className={styles.detailValue}>
                          {responsable.apellidos}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Correo:</span>
                        <span className={styles.detailValue}>
                          {responsable.correo}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Teléfono:</span>
                        <span className={styles.detailValue}>
                          {responsable.telefono}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>País:</span>
                        <span className={styles.detailValue}>
                          {responsable.pais}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>
                          Documento de identidad:
                        </span>
                        <span className={styles.detailValue}>
                          {responsable.documento}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Área de trabajo:</span>
                        <span className={styles.detailValue}>
                          {responsable.areaTrabajo}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Rol:</span>
                        <span className={styles.detailValue}>{responsable.rol}</span>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.noResponsable}>
                      No hay responsable asignado
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </Card>

          {/* Historial del activo - Ancho completo */}
          <Card className={styles.historyCard}>
            <h3 className={styles.historyTitle}>
              Historial del activo ({eventos.length})
            </h3>
            <Timeline eventos={eventos} />
          </Card>
        </Content>
      </Layout>
    );
  }

  // Vista autenticada (con todos los botones y formularios)
  return (
    <Content style={{ padding: "20px", background: "#f5f5f5" }}>
      <Button
        icon={<ArrowLeftOutlined />}
        style={{ marginBottom: 16 }}
        onClick={() => navigate(-1)}
      >
        Volver
      </Button>

      {/* Card principal con detalles */}
      <Card className={styles.mainCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.activoTitle}>{activo.nombre}</h2>
          {isAuthenticated && (
            <div className={styles.headerButtons}>
              <Button
                icon={<EditOutlined />}
                className={styles.actionButton}
                onClick={() => {
                  // TODO: Implementar edición
                  message.info("Función de edición próximamente");
                }}
              >
                Editar
              </Button>
              <Button
                icon={<PrinterOutlined />}
                className={styles.actionButton}
                onClick={() => {
                  // TODO: Implementar impresión
                  message.info("Función de impresión próximamente");
                }}
              >
                Imprimir codigo
              </Button>
              <Button
                className={styles.assignButton}
                onClick={() => setModalAsignarVisible(true)}
              >
                Asignar nuevo responsable del activo
              </Button>
            </div>
          )}
        </div>

        <Row gutter={24} className={styles.detailsRow}>
          {/* Detalles del activo */}
          <Col xs={24} md={12}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Detalles del activo</h3>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>IdActivo:</span>
                  <span className={styles.detailValue}>{activo.idActivo}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Tipo:</span>
                  <span className={styles.detailValue}>{activo.tipo}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>IP:</span>
                  <span className={styles.detailValue}>{activo.ip}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Fabricante:</span>
                  <span className={styles.detailValue}>{activo.fabricante}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Modelo:</span>
                  <span className={styles.detailValue}>{activo.modelo}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Sede:</span>
                  <span className={styles.detailValue}>{activo.ubicacionSede}</span>
                </div>
              </div>
            </div>
          </Col>

          {/* Detalles del responsable */}
          <Col xs={24} md={12}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                Detalles del responsable actual
              </h3>
              {responsable ? (
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Nombres:</span>
                    <span className={styles.detailValue}>
                      {responsable.nombres}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Apellidos:</span>
                    <span className={styles.detailValue}>
                      {responsable.apellidos}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Correo:</span>
                    <span className={styles.detailValue}>
                      {responsable.correo}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Teléfono:</span>
                    <span className={styles.detailValue}>
                      {responsable.telefono}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>País:</span>
                    <span className={styles.detailValue}>
                      {responsable.pais}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      Documento de identidad:
                    </span>
                    <span className={styles.detailValue}>
                      {responsable.documento}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Área de trabajo:</span>
                    <span className={styles.detailValue}>
                      {responsable.areaTrabajo}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Rol:</span>
                    <span className={styles.detailValue}>{responsable.rol}</span>
                  </div>
                </div>
              ) : (
                <div className={styles.noResponsable}>
                  No hay responsable asignado
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      {/* Historial y formulario en dos columnas */}
      <Row gutter={24}>
        {/* Historial del activo - Izquierda (o ancho completo si no está autenticado) */}
        <Col xs={24} lg={isAuthenticated ? 14 : 24}>
          <Card className={styles.historyCard}>
            <h3 className={styles.historyTitle}>
              Historial del activo ({eventos.length})
            </h3>
            <Timeline eventos={eventos} />
          </Card>
        </Col>

        {/* Formulario para agregar evento - Derecha (solo si está autenticado) */}
        {isAuthenticated && (
          <Col xs={24} lg={10}>
            <Card className={styles.formCard}>
              <h3 className={styles.formTitle}>Agregar evento al activo</h3>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleAgregarEvento}
                className={styles.eventForm}
              >
                <Form.Item
                  label="Tipo de evento"
                  name="tipoEvento"
                  rules={[
                    { required: true, message: "Seleccione el tipo de evento" },
                  ]}
                >
                  <Select placeholder="Seleccionar tipo">
                    <Option value="create">Crear</Option>
                    <Option value="update">Actualizar</Option>
                    <Option value="maintenance">Mantenimiento</Option>
                    <Option value="assignment">Asignación</Option>
                    <Option value="other">Otro</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Detalle del evento"
                  name="detalleEvento"
                  rules={[
                    { required: true, message: "Ingrese el detalle del evento" },
                  ]}
                >
                  <TextArea
                    rows={4}
                    placeholder="Ingrese los detalles del evento"
                  />
                </Form.Item>

                <Form.Item
                  label="Fecha y hora del evento"
                  name="fechaHora"
                  rules={[
                    { required: true, message: "Seleccione la fecha y hora" },
                  ]}
                >
                  <DatePicker
                    showTime
                    format="DD/MM/YYYY HH:mm"
                    style={{ width: "100%" }}
                    placeholder="Seleccionar fecha y hora"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    htmlType="submit"
                    loading={loadingEvento}
                    className={styles.submitButton}
                    block
                  >
                    + Agregar evento al activo
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        )}
      </Row>

      {/* Modal de asignación (solo si está autenticado) */}
      {isAuthenticated && (
        <ModalAsignarResponsable
          visible={modalAsignarVisible}
          onCancel={() => setModalAsignarVisible(false)}
          onSubmit={() => {
            setModalAsignarVisible(false);
            cargarDatos(); // Recargar datos después de asignar
          }}
          activo={activo}
        />
      )}
    </Content>
  );
}
