import { useEffect, useState } from "react";
import {
  Card,
  Button,
  Input,
  Modal,
  Form,
  Divider,
  Row,
  Col,
  message,
} from "antd";
import { PlusCircleOutlined, FileOutlined } from "@ant-design/icons";
import axios from "axios";
import Cookies from "js-cookie";

const ControlOportunidades = ({ idOportunidad }: { idOportunidad?: string }) => {
  const [controles, setControles] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const token = Cookies.get("token");

  // 🔹 Obtener controles por ID de oportunidad
  const fetchControles = async () => {
    if (!idOportunidad) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/VTAModVentaOportunidad/ControlOportunidad/PorOportunidad/${Number(
          idOportunidad
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setControles(res.data.controlOportunidad || []);
    } catch (err: any) {
      // console.error("❌ Error al obtener controles:", err);
    }
  };

  useEffect(() => {
    if (idOportunidad) fetchControles();
  }, [idOportunidad]);

  // 🔹 Abrir / Cerrar modal
  const handleOpen = () => setVisible(true);
  const handleClose = () => {
    form.resetFields();
    setVisible(false);
  };

  // 🔹 Guardar nuevo control
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const body = {
        idOportunidad: Number(idOportunidad),
        nombre: values.nombre,
        url: values.url,
        detalle: values.detalle,
        idMigracion: 0,
        estado: true, // siempre true, no se muestra
      };
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/VTAModVentaControlOportunidad/Insertar`,
        body,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      message.success("Control agregado correctamente");
      handleClose();
      await fetchControles();
    } catch (err: any) {
      // console.error("❌ Error al guardar el control:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card
        style={{
          backgroundColor: "#f1f5f598",
          borderRadius: 12,
          padding: 12,
          marginTop: 16,
        }}
      >
        {/* Botón Agregar Control */}
        <div style={{ marginBottom: 12 }}>
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            onClick={handleOpen}
            style={{ backgroundColor: "#000", borderColor: "#000" }}
          >
            Agregar Control
          </Button>
        </div>

        {/* Lista de controles */}
        {controles.length > 0 ? (
          controles.map((c: any) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <label style={{ fontWeight: 600, color: "#111827" }}>
                {c.nombre}
              </label>
              <Input
                prefix={<FileOutlined style={{ color: "#1677ff" }} />}
                value={c.url}
                disabled
                style={{
                  color: "#111827",
                  backgroundColor: "#fff",
                  cursor: "not-allowed",
                }}
              />
            </div>
          ))
        ) : (
          <p style={{ color: "#6b7280" }}>No hay controles registrados.</p>
        )}
      </Card>

      {/* Modal Agregar Control */}
      <Modal
        open={visible}
        onCancel={handleClose}
        footer={null}
        width={600}
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ fontSize: "1rem", margin: 0, fontWeight: 600 }}>
              Agregar Control
            </h3>
          </div>
        }
      >
        {/* Línea separadora debajo del título */}
        <Divider style={{ margin: "10px 0 20px 0" }} />

        <Form form={form} layout="vertical" style={{ marginTop: 0 }}>
          {/* 🔹 Nombre y Detalle en una misma línea */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nombre"
                label="Nombre del control"
                rules={[
                  { required: true, message: "Ingrese el nombre del control" },
                ]}
              >
                <Input placeholder="Ej. Brochure del producto" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="detalle" label="Detalle">
                <Input placeholder="Descripción breve" />
              </Form.Item>
            </Col>
          </Row>

          {/* 🔹 URL en una línea completa */}
          <Form.Item
            name="url"
            label="URL"
            rules={[{ required: true, message: "Ingrese la URL del control" }]}
          >
            <Input placeholder="https://ejemplo.com/archivo.pdf" />
          </Form.Item>

          {/* Línea separadora antes del botón */}
          <Divider style={{ margin: "10px 0 20px 0" }} />

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
      </Modal>
    </>
  );
};

export default ControlOportunidades;
