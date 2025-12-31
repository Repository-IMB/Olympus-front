import { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  message,
  Space,
  Card,
  Alert,
  Spin,
  Row,
  Col,
  Divider,
} from "antd";
import axios from "axios";
import Cookies from "js-cookie";
import { EditOutlined } from "@ant-design/icons";
import { getCookie } from "../../utils/cookies";
import api from "../../servicios/api";

const { Option } = Select;

interface PotencialData {
  id?: number;
  idPersona?: number;
  desuscrito?: boolean;
  estado?: boolean;
  fechaCreacion?: string;
  usuarioCreacion?: string;
  fechaModificacion?: string;
  usuarioModificacion?: string;
  persona?: {
    id?: number;
    idPais?: number;
    pais?: string;
    nombres?: string;
    apellidos?: string;
    celular?: string;
    prefijoPaisCelular?: string;
    correo?: string;
    areaTrabajo?: string;
    industria?: string;
    estado?: boolean;
    fechaCreacion?: string;
    usuarioCreacion?: string;
    fechaModificacion?: string;
    usuarioModificacion?: string;
  };
}

interface Cliente {
  id: number;
  idPais: number;
  nombres: string;
  apellidos: string;
  celular: string;
  prefijoPaisCelular: string;
  correo: string;
  areaTrabajo: string;
  industria: string;
}

interface Props {
  id?: string;
  onUpdated: () => void;
  onCelularObtenido?: (celular: string) => void; // ✅ nueva prop
}

const paises: Record<number, string> = {
  1: "Angola",
  2: "Argentina",
  3: "Aruba",
  4: "Belice",
  5: "Bolivia",
  6: "Brasil",
  7: "Canada",
  8: "Chile",
  9: "Colombia",
  10: "Costa Rica",
  11: "Cuba",
  12: "Ecuador",
  13: "El Salvador",
  14: "España",
  15: "Estados Unidos",
  16: "Guatemala",
  17: "Guyana",
  18: "Haití",
  19: "Honduras",
  20: "Italia",
  21: "Kuwait",
  22: "México",
  23: "Nicaragua",
  24: "Panamá",
  25: "Paraguay",
  26: "Perú",
  27: "Puerto Rico",
  28: "República Dominicana",
  29: "Trinidad y Tobago",
  30: "United States",
  31: "Uruguay",
  32: "Venezuela",
};

export default function ModalEditarCliente({ id, onUpdated, onCelularObtenido }: Props) {
  console.log("🔷 CompCliente RENDERIZADO - Props recibidas:", { id, onUpdated, onCelularObtenido });

  const [visible, setVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [potencialData, setPotencialData] = useState<PotencialData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setVisible(Boolean(id));
  }, [id]);

  useEffect(() => {
    let mounted = true;
    const token = getCookie("token");

    if (!id) {
      setCliente(null);
      setPotencialData(null);
      setError(null);
      return;
    }

    // función async para traer datos
    const fetchPotencial = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("CompCliente - Haciendo petición a:", `/api/VTAModVentaOportunidad/ObtenerPotencialPorOportunidad/${id}`);

        const res = await api.get(`/api/VTAModVentaOportunidad/ObtenerPotencialPorOportunidad/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!mounted) return;

        console.log("CompCliente - Potencial Data recibida:", res.data);
        const data: PotencialData = res.data;
        setPotencialData(data);

        if (data.persona) {
          const clienteData: Cliente = {
            id: data.persona.id || 0,
            idPais: data.persona.idPais || 26,
            nombres: data.persona.nombres || "",
            apellidos: data.persona.apellidos || "",
            celular: data.persona.celular || "",
            prefijoPaisCelular: data.persona.prefijoPaisCelular || "",
            correo: data.persona.correo || "",
            areaTrabajo: data.persona.areaTrabajo || "",
            industria: data.persona.industria || "",
          };
          setCliente(clienteData);

          // setear valores en el formulario
          form.setFieldsValue({
            nombres: clienteData.nombres,
            apellidos: clienteData.apellidos,
            celular: clienteData.celular,
            prefijoPaisCelular: clienteData.prefijoPaisCelular,
            correo: clienteData.correo,
            areaTrabajo: clienteData.areaTrabajo,
            industria: clienteData.industria,
            idPais: clienteData.idPais,
          });

          if (clienteData.celular && clienteData.prefijoPaisCelular && onCelularObtenido) {
            const celularCompleto = `${clienteData.prefijoPaisCelular}${clienteData.celular}`;
            onCelularObtenido(celularCompleto);
          }
        } else {
          setCliente(null);
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error("CompCliente - Error en la petición:", err);
        console.error("CompCliente - Detalles del error:", err?.response?.data);
        setError(err?.response?.data?.message ?? "Error al obtener los datos del cliente");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetchPotencial();

    return () => {
      mounted = false;
    };
  }, [id, form, onCelularObtenido]);

  const handleOpen = () => {
    if (cliente) {
      form.setFieldsValue(cliente);
      setVisible(true);
    }
  };

  const handleClose = () => {
    setVisible(false);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        message.error("Token no encontrado");
        return;
      }

      const values = await form.validateFields();

      setLoading(true);
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/VTAModVentaPersona/Actualizar`,
        { ...cliente, ...values },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success("Cliente actualizado correctamente");
      handleClose();
      onUpdated();
    } catch (error) {
      console.error(error);
      message.error("Error al actualizar el cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>Información del Cliente:</h2>

      {loading ? (
        <Spin tip="Cargando información..." />
      ) : error ? (
        <Alert message={error} type="error" showIcon />
      ) : cliente ? (
        <Card bordered style={{ marginBottom: 16 }}>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <div>
              <strong>Nombre:</strong> {cliente.nombres}
            </div>
            <div>
              <strong>Apellidos:</strong> {cliente.apellidos}
            </div>
            <div>
              <strong>Teléfono:</strong> {cliente.celular}
            </div>
            <div>
              <strong>País:</strong> {paises[cliente.idPais] || "Desconocido"}
            </div>
            <div>
              <strong>Prefijo País:</strong> {cliente.prefijoPaisCelular || "-"}
            </div>
            <div>
              <strong>Correo:</strong> {cliente.correo || "-"}
            </div>
            <div>
              <strong>Área de trabajo:</strong> {cliente.areaTrabajo || "-"}
            </div>
            <div>
              <strong>Industria:</strong> {cliente.industria || "-"}
            </div>
            {potencialData && potencialData.desuscrito !== undefined && (
              <div>
                <strong>Desuscrito:</strong> {potencialData.desuscrito ? "Sí" : "No"}
              </div>
            )}
          </Space>
        </Card>
      ) : (
        <Alert message="No se encontró información del cliente" type="info" />
      )}

      <Button
        type="primary"
        icon={<EditOutlined />}
        onClick={handleOpen}
        block
        style={{ backgroundColor: "#000", borderColor: "#000" }}
      >
        Editar
      </Button>

      <Modal
        open={visible}
        onCancel={handleClose}
        footer={null}
        width={800}
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3 style={{ fontSize: "1rem", margin: 0, fontWeight: 600 }}>
              Editar Cliente
            </h3>
          </div>
        }
      >
        {cliente && (
          <Form
            form={form}
            layout="vertical"
            initialValues={cliente}
            style={{ marginTop: 10 }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="nombres"
                  label="Nombres"
                  rules={[{ required: true, message: "Ingrese los nombres" }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="apellidos"
                  label="Apellidos"
                  rules={[{ required: true, message: "Ingrese los apellidos" }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="celular"
                  label="Teléfono"
                  rules={[
                    { required: true, message: "Ingrese el número de teléfono" },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="idPais"
                  label="País"
                  rules={[{ required: true, message: "Seleccione un país" }]}
                >
                  <Select placeholder="Seleccione un país">
                    {Object.entries(paises).map(([id, nombre]) => (
                      <Option key={id} value={Number(id)}>
                        {nombre}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="correo"
              label="Correo"
              rules={[{ type: "email", message: "Correo inválido" }]}
            >
              <Input />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="industria" label="Industria">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="areaTrabajo" label="Área de trabajo">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ margin: "20px 0" }} />

            <Button
              type="primary"
              loading={loading}
              onClick={handleSubmit}
              block
              style={{
                backgroundColor: "#1677ff",
                height: 40,
                fontWeight: 500,
              }}
            >
              Guardar
            </Button>
          </Form>
        )}
      </Modal>
    </>
  );
}
