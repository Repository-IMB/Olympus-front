import { Modal, Form, Input, Select, Radio, DatePicker, TimePicker, Checkbox, Row, Col, Divider } from "antd";
import type { RadioChangeEvent } from "antd";
import { useState } from "react";
import type { Moment } from "moment";
import moment from "moment";

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface NuevoPermisoModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: (values: NuevoPermisoFormValues) => void;
}

export interface NuevoPermisoFormValues {
  // Bloque 1: Identificación del Colaborador
  pais: string;
  dni: string;
  apellidos: string;
  nombres: string;
  jornadaLaboral: string;
  area: string;
  encargadoJefeDirecto: string;
  // Bloque 2: Detalle de la Solicitud
  tipoPermiso: string;
  motivoDetallado: string;
  modalidadGestion: string;
  // Bloque 3: Tiempos, Tratamiento y Evidencia
  fechaSolicitud: Moment;
  fechaPermiso: Moment;
  horasGestionInicio: Moment;
  horasGestionFin: Moment;
  tratamientoHoras?: string;
  horasRecuperables?: boolean;
  diasRecuperacion?: Moment;
  horarioRecuperacion?: string;
  // Bloque 4: Recuperación de Horas
  tieneHorasRecuperables?: boolean;
  diasRecuperacionMultiple?: [Moment | null, Moment | null] | null;
  horarioRecuperacionTexto?: string;
}

const paises = ["Panamá", "República Dominicana", "Colombia", "México", "Perú", "Chile"];

const jornadasLaborales = ["Turno Mañana", "Turno Tarde", "Tiempo Completo"];

const areas = [
  "Comercial",
  "Recursos Humanos",
  "Relaciones Públicas",
  "Desarrollo de Producto",
  "Legal",
  "Bienestar Académico",
  "Académico",
  "Administración",
  "Calidad",
  "Contabilidad",
  "Sistemas y Marketing",
];

const tiposPermiso = [
  "Salud (Colaborador)",
  "Salud (Familiar)",
  "Luto / Fallecimiento",
  "Trámites Personales",
  "Emergencia Familiar",
  "Estudios",
];

const modalidadesGestion = ["TRABAJO REMOTO", "AUSENCIA / PERMISO"];

export default function NuevoPermisoModal({ open, onCancel, onOk }: NuevoPermisoModalProps) {
  const [form] = Form.useForm();
  const [modalidadGestion, setModalidadGestion] = useState<string>();
  const [horasRecuperables, setHorasRecuperables] = useState(false);
  const [tieneHorasRecuperables, setTieneHorasRecuperables] = useState(false);

  const handleOk = () => {
    form.validateFields().then((values) => {
      onOk(values);
      form.resetFields();
      setModalidadGestion(undefined);
      setHorasRecuperables(false);
      setTieneHorasRecuperables(false);
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setModalidadGestion(undefined);
    setHorasRecuperables(false);
    setTieneHorasRecuperables(false);
    onCancel();
  };

  const handleModalidadChange = (e: RadioChangeEvent) => {
    setModalidadGestion(e.target.value);
  };

  return (
    <Modal
      title="Nuevo Permiso"
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      width={800}
      okText="Guardar"
      cancelText="Cancelar"
      okButtonProps={{ style: { backgroundColor: "#1f1f1f", borderColor: "#1f1f1f" } }}
    >
      <Form form={form} layout="vertical" initialValues={{ fechaSolicitud: moment() }}>
        {/* BLOQUE 1: Identificación del Colaborador */}
        <Divider orientation="left" style={{ borderColor: "#1f1f1f" }}>
          Identificación del Colaborador
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="pais"
              label="País"
              rules={[{ required: true, message: "Seleccione un país" }]}
            >
              <Select placeholder="Seleccione un país">
                {paises.map((pais) => (
                  <Option key={pais} value={pais}>
                    {pais}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="dni"
              label="DNI"
              rules={[{ required: true, message: "Ingrese el DNI" }]}
            >
              <Input placeholder="Ingrese DNI" type="number" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="apellidos"
              label="Apellidos"
              rules={[{ required: true, message: "Ingrese los apellidos" }]}
            >
              <Input placeholder="Ingrese apellidos" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="nombres"
              label="Nombres"
              rules={[{ required: true, message: "Ingrese los nombres" }]}
            >
              <Input placeholder="Ingrese nombres" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="jornadaLaboral"
              label="Jornada Laboral"
              rules={[{ required: true, message: "Seleccione una jornada" }]}
            >
              <Select placeholder="Seleccione jornada laboral">
                {jornadasLaborales.map((jornada) => (
                  <Option key={jornada} value={jornada}>
                    {jornada}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="area"
              label="Área"
              rules={[{ required: true, message: "Seleccione un área" }]}
            >
              <Select placeholder="Seleccione área">
                {areas.map((area) => (
                  <Option key={area} value={area}>
                    {area}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="encargadoJefeDirecto"
              label="Encargado / Jefe Directo"
              rules={[{ required: true, message: "Ingrese el nombre del encargado" }]}
            >
              <Input placeholder="Ingrese nombre del encargado o jefe directo" />
            </Form.Item>
          </Col>
        </Row>

        {/* BLOQUE 2: Detalle de la Solicitud */}
        <Divider orientation="left" style={{ borderColor: "#1f1f1f" }}>
          Detalle de la Solicitud
        </Divider>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="tipoPermiso"
              label="Tipo de Permiso"
              rules={[{ required: true, message: "Seleccione un tipo de permiso" }]}
            >
              <Select placeholder="Seleccione tipo de permiso">
                {tiposPermiso.map((tipo) => (
                  <Option key={tipo} value={tipo}>
                    {tipo}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="motivoDetallado"
              label="Motivo Detallado"
              rules={[{ required: true, message: "Ingrese el motivo detallado" }]}
            >
              <TextArea rows={3} placeholder="Describa el motivo del permiso" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="modalidadGestion"
              label="Modalidad de la Gestión"
              rules={[{ required: true, message: "Seleccione una modalidad" }]}
            >
              <Radio.Group onChange={handleModalidadChange}>
                {modalidadesGestion.map((modalidad) => (
                  <Radio key={modalidad} value={modalidad}>
                    {modalidad}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        {/* BLOQUE 3: Tiempos, Tratamiento y Evidencia */}
        <Divider orientation="left" style={{ borderColor: "#1f1f1f" }}>
          Tiempos, Tratamiento y Evidencia
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="fechaSolicitud"
              label="Fecha de Solicitud"
            >
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
                disabled
                placeholder="Fecha automática"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="fechaPermiso"
              label="Fecha de Permiso"
              rules={[{ required: true, message: "Seleccione la fecha del permiso" }]}
            >
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
                placeholder="Seleccione fecha"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="horasGestionInicio"
              label="Horas de Gestión (Inicio)"
              rules={[{ required: true, message: "Seleccione hora de inicio" }]}
            >
              <TimePicker
                format="HH:mm"
                style={{ width: "100%" }}
                placeholder="Ej: 08:00"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="horasGestionFin"
              label="Horas de Gestión (Fin)"
              rules={[{ required: true, message: "Seleccione hora de fin" }]}
            >
              <TimePicker
                format="HH:mm"
                style={{ width: "100%" }}
                placeholder="Ej: 11:00"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Solo visible si eligió "AUSENCIA / PERMISO" */}
        {modalidadGestion === "AUSENCIA / PERMISO" && (
          <>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="tratamientoHoras"
                  label="Tratamiento de las Horas"
                >
                  <Radio.Group>
                    <Radio value="descuento">Descuento de horas</Radio>
                    <Radio value="vacaciones">Cargo a vacaciones</Radio>
                    <Radio value="recuperables">Horas recuperables</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="horasRecuperables" valuePropName="checked">
                  <Checkbox onChange={(e) => setHorasRecuperables(e.target.checked)}>
                    Horas Recuperables
                  </Checkbox>
                </Form.Item>
              </Col>
            </Row>

            {/* Campos dinámicos si marca "Horas Recuperables" */}
            {horasRecuperables && (
              <>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="diasRecuperacion"
                      label="Día(s) de recuperación"
                    >
                      <DatePicker
                        format="DD/MM/YYYY"
                        style={{ width: "100%" }}
                        placeholder="Seleccione fecha de recuperación"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="horarioRecuperacion"
                      label="Horario de recuperación"
                    >
                      <Input placeholder="Ej: De 18:00 a 20:00" />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}
          </>
        )}

        {/* BLOQUE 4: Recuperación de Horas */}
        <Divider orientation="left" style={{ borderColor: "#1f1f1f" }}>
          Recuperación de Horas
        </Divider>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="tieneHorasRecuperables" valuePropName="checked">
              <Checkbox onChange={(e) => setTieneHorasRecuperables(e.target.checked)}>
                Horas Recuperables
              </Checkbox>
            </Form.Item>
          </Col>
        </Row>

        {tieneHorasRecuperables && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="diasRecuperacionMultiple"
                label="Día(s) de recuperación"
              >
                <RangePicker
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                  placeholder={["Fecha inicio", "Fecha fin"]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="horarioRecuperacionTexto"
                label="Horario de recuperación"
              >
                <Input placeholder="Ej: De 18:00 a 20:00" />
              </Form.Item>
            </Col>
          </Row>
        )}
      </Form>
    </Modal>
  );
}
