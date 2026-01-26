import { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Row, Col, Button, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import api from "../../servicios/api";
import styles from "./ModalActivo.module.css";

const { Option } = Select;

interface ModalActivoProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit?: () => void;
}

export default function ModalActivo({
  visible,
  onCancel,
  onSubmit,
}: ModalActivoProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      form.resetFields();
    }
  }, [visible, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // TODO: Reemplazar con llamada real a la API
      // await api.post("/api/Activos/CrearActivo", values);
      
      console.log("Valores del formulario:", values);
      message.success("Activo creado exitosamente");
      form.resetFields();
      onCancel();
      if (onSubmit) onSubmit();
    } catch (error: any) {
      if (error?.errorFields) {
        // Errores de validación del formulario
        return;
      }
      message.error(
        error?.response?.data?.mensaje || "Error al crear el activo"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      open={visible}
      title="Crear nuevo activo"
      onCancel={handleCancel}
      footer={null}
      width={600}
      className={styles.modal}
    >
      <Form form={form} layout="vertical" className={styles.form}>
        <Form.Item
          label="Tipo de activo"
          name="tipo"
          rules={[{ required: true, message: "Seleccione el tipo de activo" }]}
        >
          <Select
            placeholder="Seleccionar tipo de activo"
            showSearch
            optionFilterProp="children"
          >
            <Option value="Laptop">Laptop</Option>
            <Option value="Celular">Celular</Option>
            <Option value="Tablet">Tablet</Option>
            <Option value="Monitor">Monitor</Option>
            <Option value="Teclado">Teclado</Option>
            <Option value="Mouse">Mouse</Option>
            <Option value="Otro">Otro</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="IP del activo"
          name="ip"
          rules={[
            {
              pattern: /^(\d{1,3}\.){3}\d{1,3}$/,
              message: "Ingrese una IP válida",
            },
          ]}
        >
          <Input placeholder="Ej: 162.248.143.12" />
        </Form.Item>

        <Form.Item
          label="Nombre del activo"
          name="nombre"
          rules={[{ required: true, message: "Ingrese el nombre del activo" }]}
        >
          <Input placeholder="Ej: MacBookPro" />
        </Form.Item>

        <Form.Item label="Número de serie" name="numeroSerie">
          <Input placeholder="Ingrese el número de serie" />
        </Form.Item>

        <Form.Item
          label="IMEI (Solo celulares)"
          name="imei"
          rules={[
            {
              pattern: /^\d{15}$/,
              message: "El IMEI debe tener 15 dígitos",
            },
          ]}
        >
          <Input placeholder="Ingrese el IMEI" maxLength={15} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Fabricante"
              name="fabricante"
              rules={[
                { required: true, message: "Ingrese el fabricante" },
              ]}
            >
              <Select
                placeholder="Seleccionar fabricante"
                showSearch
                optionFilterProp="children"
              >
                <Option value="Apple">Apple</Option>
                <Option value="Lenovo">Lenovo</Option>
                <Option value="HP">HP</Option>
                <Option value="Dell">Dell</Option>
                <Option value="Samsung">Samsung</Option>
                <Option value="Motorola">Motorola</Option>
                <Option value="Otro">Otro</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Modelo"
              name="modelo"
              rules={[{ required: true, message: "Ingrese el modelo" }]}
            >
              <Input placeholder="Ej: MacBookPro17" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Sede"
              name="sede"
              rules={[{ required: true, message: "Seleccione la sede" }]}
            >
              <Select
                placeholder="Seleccionar sede"
                showSearch
                optionFilterProp="children"
              >
                <Option value="Perú">Perú</Option>
                <Option value="Bolivia">Bolivia</Option>
                <Option value="Argentina">Argentina</Option>
                <Option value="Colombia">Colombia</Option>
                <Option value="Chile">Chile</Option>
                <Option value="Ecuador">Ecuador</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Estación"
              name="estacion"
              rules={[
                { required: true, message: "Ingrese el número de estación" },
                { type: "number", min: 1, message: "El valor debe ser mayor a 0" },
              ]}
            >
              <Input
                type="number"
                placeholder="Número de estación"
                min={1}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Estado"
          name="estado"
          rules={[{ required: true, message: "Seleccione el estado" }]}
        >
          <Select placeholder="Seleccionar estado">
            <Option value="Disponible">Disponible</Option>
            <Option value="Asignado">Asignado</Option>
            <Option value="En mantenimiento">En mantenimiento</Option>
            <Option value="Dado de baja">Dado de baja</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleSubmit}
            loading={loading}
            className={styles.submitButton}
            block
          >
            + Agregar evento al activo
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
