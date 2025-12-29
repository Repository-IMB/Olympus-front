import {
  Modal,
  Form,
  Input,
  Row,
  Col,
  DatePicker,
  TimePicker,
  InputNumber,
  Select,
  Space,
  Button,
} from "antd";
import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";

interface Modulo {
  id: number;
  modulo: string;
  codigosProducto: string[];
  diasClase: string[];
  fechaCreacion: string;
  activo: boolean;
}

interface ModalModuloProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  moduloEditar?: Modulo | null;
  modoEdicion?: boolean;
}

const DIAS = [
  { key: "D", label: "D" },
  { key: "L", label: "L" },
  { key: "M", label: "M" },
  { key: "X", label: "X" },
  { key: "J", label: "J" },
  { key: "V", label: "V" },
  { key: "S", label: "S" },
];

const DIAS_comp = [
  { key: "Lunes", label: "Lunes" },
  { key: "Martes", label: "Martes" },
  { key: "Miércoles", label: "Miércoles" },
  { key: "Jueves", label: "Jueves" },
  { key: "Viernes", label: "Viernes" },
  { key: "Sábado", label: "Sábado" },
  { key: "Domingo", label: "Domingo" },
];

export default function ModalModulo({
  visible,
  onCancel,
  onSubmit,
  moduloEditar = null,
  modoEdicion = false,
}: ModalModuloProps) {
  const [form] = Form.useForm();
  const [diasClase, setDiasClase] = useState<string[]>([]);

  const horaInicio = Form.useWatch("horaInicio", form);
  const horaFin = Form.useWatch("horaFin", form);
  const nroSesiones = Form.useWatch("nroSesiones", form);

  // Efecto para calcular horas sincrónicas automáticamente
  useEffect(() => {
    if (horaInicio && horaFin && nroSesiones) {
      const diffHoras = dayjs(horaFin).diff(dayjs(horaInicio), "minute") / 60;
      const total = diffHoras > 0 ? diffHoras * nroSesiones : 0;

      form.setFieldsValue({
        horasSync: Number(total.toFixed(2)),
      });
    } else {
      form.setFieldsValue({ horasSync: 0 });
    }
  }, [horaInicio, horaFin, nroSesiones, form]);

  // Efecto para cargar datos cuando se edita
  useEffect(() => {
    if (visible && modoEdicion && moduloEditar) {
      setDiasClase(moduloEditar.diasClase);

      form.setFieldsValue({
        nombre: moduloEditar.modulo,
        codigo: moduloEditar.codigosProducto[0],
        diasClase: moduloEditar.diasClase,
        tituloCertificado: "",
        descripcion: "",
        fechaPresentacion: null,
        horaInicio: null,
        horaFin: null,
        nroSesiones: 0,
        horasSync: 0,
        horasAsync: 0,
        horaInicioSabado: null,
        horaFinSabado: null,
        diaAsync: undefined,
        horaAsync: null,
      });
    } else if (visible && !modoEdicion) {
      // Limpiar formulario en modo creación
      form.resetFields();
      setDiasClase([]);
    }
  }, [visible, modoEdicion, moduloEditar, form]);

  const toggleDia = (dia: string) => {
    setDiasClase((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const handleCancel = () => {
    form.resetFields();
    setDiasClase([]);
    onCancel();
  };

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        const payload = {
          ...values,
          diasClase,
        };
        onSubmit(payload);
        form.resetFields();
        setDiasClase([]);
      })
      .catch((error) => {
        console.error("Error de validación:", error);
      });
  };

  return (
    <Modal
      open={visible}
      title={modoEdicion ? "Editar Módulo" : "Crear nuevo módulo"}
      width={900}
      onCancel={handleCancel}
      onOk={handleSubmit}
      okText={modoEdicion ? "Guardar cambios" : "Crear módulo"}
    >
      <Form form={form} layout="vertical">
        {/* 1er renglón */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Nombre"
              name="nombre"
              rules={[{ required: true, message: "Ingrese nombre" }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Código del módulo"
              name="codigo"
              rules={[
                { required: true, message: "Ingrese código" },
                { pattern: /^[a-zA-Z0-9]+$/, message: "Solo alfanumérico" },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        {/* 2do renglón */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="Título del certificado" name="tituloCertificado">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        {/* 3er renglón */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Descripción"
              name="descripcion"
              rules={[{ required: true, message: "Ingrese descripción" }]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>

        {/* 4to renglón */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Fecha de presentación"
              name="fechaPresentacion"
              rules={[{ required: true, message: "Seleccione fecha" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label="Hora inicio"
              name="horaInicio"
              rules={[{ required: true, message: "Seleccione hora" }]}
            >
              <TimePicker style={{ width: "100%" }} format="HH:mm" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label="Hora fin"
              name="horaFin"
              rules={[{ required: true, message: "Seleccione hora" }]}
            >
              <TimePicker style={{ width: "100%" }} format="HH:mm" />
            </Form.Item>
          </Col>
        </Row>

        {/* 5to renglón */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Nro de sesiones"
              name="nroSesiones"
              rules={[{ required: true, message: "Ingrese número" }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Horas sincrónicas" name="horasSync">
              <InputNumber disabled style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Horas asincrónicas" name="horasAsync">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        {/* 6to renglón - Días de clase */}
        <Row>
          <Col span={24}>
            <Form.Item
              label="Días de clase"
              required
              validateStatus={diasClase.length === 0 ? "error" : ""}
              help={diasClase.length === 0 ? "Seleccione al menos un día" : ""}
            >
              <Space>
                {DIAS.map((d) => (
                  <Button
                    key={d.key}
                    type={diasClase.includes(d.key) ? "primary" : "default"}
                    onClick={() => toggleDia(d.key)}
                  >
                    {d.label}
                  </Button>
                ))}
              </Space>
            </Form.Item>
          </Col>
        </Row>

        {/* 7mo renglón - Horarios especiales para sábado */}
        {diasClase.includes("S") && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Hora inicio (Sábado)"
                name="horaInicioSabado"
                rules={[{ required: true, message: "Requerido" }]}
              >
                <TimePicker style={{ width: "100%" }} format="HH:mm" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Hora fin (Sábado)"
                name="horaFinSabado"
                rules={[{ required: true, message: "Requerido" }]}
              >
                <TimePicker style={{ width: "100%" }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>
        )}

        {/* Clases asincrónicas */}
        <Form.Item shouldUpdate>
          {() =>
            form.getFieldValue("horasAsync") > 0 && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Día clase asincrónica"
                    name="diaAsync"
                    rules={[{ required: true, message: "Seleccione día" }]}
                  >
                    <Select placeholder="Seleccione día">
                      {DIAS_comp.map((d) => (
                        <Select.Option key={d.key} value={d.key}>
                          {d.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Hora clase asincrónica"
                    name="horaAsync"
                    rules={[{ required: true, message: "Seleccione hora" }]}
                  >
                    <TimePicker style={{ width: "100%" }} format="HH:mm" />
                  </Form.Item>
                </Col>
              </Row>
            )
          }
        </Form.Item>
      </Form>
    </Modal>
  );
}