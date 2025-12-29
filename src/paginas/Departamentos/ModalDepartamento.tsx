import {
  Modal,
  Form,
  Input,
  Button,
  Row,
  Col,
  Popconfirm,
} from "antd";
import { useEffect, useState } from "react";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";

interface ModalDepartamentoProps {
  open: boolean;
  onCancel: () => void;
  onSave: (departamento: any) => void;
  departamento?: any;
  modo?: "crear" | "editar";
  errorModal?: string | null;
}

export default function ModalDepartamento({
  open,
  onCancel,
  onSave,
  departamento,
  modo = "crear",
  errorModal,
}: ModalDepartamentoProps) {
  const [form] = Form.useForm();
  const [botonDeshabilitado, setBotonDeshabilitado] = useState(true);

  const esEdicion = modo === "editar";

  useEffect(() => {
    if (open) {
      if (esEdicion && departamento) {
        form.setFieldsValue({
          nombreDepartamento: departamento.nombre,
          descripcion: departamento.descripcion,
        });

        // En edición, si los datos son válidos, habilitamos el botón
        setBotonDeshabilitado(false);
      } else {
        form.resetFields();
        setBotonDeshabilitado(true);
      }
    }
  }, [open, esEdicion, departamento, form]);

  const handleGuardar = async () => {
    try {
      const values = await form.validateFields();

      const departamentoData = {
        nombre: values.nombreDepartamento,
        descripcion: values.descripcion ?? null,
      };

      onSave(departamentoData);
      form.resetFields();
      setBotonDeshabilitado(true);
    } catch {
      // Los errores de validación ya están manejados por el Form
    }
  };

  const handleCancelar = () => {
    form.resetFields();
    setBotonDeshabilitado(true);
    onCancel();
  };

  return (
    <Modal
      open={open}
      title={esEdicion ? "Editar Departamento" : "Crear Nuevo Departamento"}
      onCancel={handleCancelar}
      width={600}
      style={{ margin: "auto" }}
      footer={[
        <div key="footer" style={{ width: "100%" }}>
          {errorModal && (
            <div
              style={{
                color: "#ff4d4f",
                marginBottom: 12,
                textAlign: "left",
              }}
            >
              {errorModal}
            </div>
          )}

          <Popconfirm
            title={
              esEdicion
                ? "¿Está seguro de guardar los cambios?"
                : "¿Está seguro de crear este departamento?"
            }
            okText="Sí"
            cancelText="No"
            onConfirm={handleGuardar}
            disabled={botonDeshabilitado}
          >
            <Button
              type="primary"
              icon={esEdicion ? <EditOutlined /> : <PlusOutlined />}
              block
              disabled={botonDeshabilitado}
            >
              {esEdicion ? "Guardar Cambios" : "Crear Nuevo Departamento"}
            </Button>
          </Popconfirm>
        </div>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFieldsChange={() => {
          const tieneErrores = form
            .getFieldsError(["nombreDepartamento"])
            .some(({ errors }) => errors.length > 0);

          const nombreTocado = form.isFieldTouched("nombreDepartamento");

          setBotonDeshabilitado(!nombreTocado || tieneErrores);
        }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Nombre de Departamento"
              name="nombreDepartamento"
              rules={[
                {
                  required: true,
                  message: "Ingrese el nombre del departamento",
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="Descripción" name="descripcion">
              <Input.TextArea rows={4} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
