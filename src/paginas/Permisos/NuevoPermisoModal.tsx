import { Modal, Form, Input, Select, Radio, DatePicker, TimePicker, Checkbox, Row, Col, Divider, Spin } from "antd";
import type { RadioChangeEvent } from "antd";
import { useState, useEffect } from "react";
import type { Moment } from "moment";
import moment from "moment";
import { obtenerPersonalOpciones, obtenerPersonalPorId } from "../../servicios/PersonalService";
import { obtenerTipoPermisoOpciones } from "../../servicios/PermisoService";
import type { Personal, PersonalOpcion } from "../../interfaces/IPersonal";
import type { TipoPermiso } from "../../interfaces/IPermiso";

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
  idPersonal: number;
  pais: string;
  dni: string;
  jornadaLaboral: string;
  area: string;
  encargadoJefeDirecto: string;
  // Bloque 2: Detalle de la Solicitud
  tipoPermiso: number;
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

// Removed hardcoded tiposPermiso

const modalidadesGestion = ["TRABAJO REMOTO", "AUSENCIA / PERMISO"];

export default function NuevoPermisoModal({ open, onCancel, onOk }: NuevoPermisoModalProps) {
  const [form] = Form.useForm();
  const [modalidadGestion, setModalidadGestion] = useState<string>();
  const [tratamientoHoras, setTratamientoHoras] = useState<string>();

  const [personalList, setPersonalList] = useState<PersonalOpcion[]>([]);
  const [fetchingPersonal, setFetchingPersonal] = useState(false);

  const [tiposPermisoList, setTiposPermisoList] = useState<TipoPermiso[]>([]);
  const [fetchingTiposPermiso, setFetchingTiposPermiso] = useState(false);

  useEffect(() => {
    if (open) {
      loadPersonal();
      loadTiposPermiso();
    }
  }, [open]);

  const loadTiposPermiso = async () => {
    setFetchingTiposPermiso(true);
    try {
      const response = await obtenerTipoPermisoOpciones();
      setTiposPermisoList(response.tiposPermiso);
    } catch (error) {
      console.error("Error cargando tipos de permiso:", error);
    } finally {
      setFetchingTiposPermiso(false);
    }
  };

  const loadPersonal = async (search = "") => {
    setFetchingPersonal(true);
    try {
      const data = await obtenerPersonalOpciones({ search });
      setPersonalList(data.personal);
    } catch (error) {
      console.error("Error cargando personal:", error);
    } finally {
      setFetchingPersonal(false);
    }
  };

  const handlePersonalSearch = (value: string) => {
    if (value.length > 2) {
      loadPersonal(value);
    }
  };

  const handlePersonalChange = async (id: number) => {
    try {
      // Find basic info in list or fetch detailed
      const detailed = await obtenerPersonalPorId(id);
      if (detailed) {
        form.setFieldsValue({
          pais: detailed.pais,
          dni: detailed.dni,
          area: detailed.areaTrabajo,
          jornadaLaboral: detailed.tipoJornada,
          encargadoJefeDirecto: detailed.jefeDirecto
        });
      }
    } catch (error) {
      console.error("Error obteniendo detalle personal:", error);
    }
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      onOk(values);
      form.resetFields();
      setModalidadGestion(undefined);
      setTratamientoHoras(undefined);
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setModalidadGestion(undefined);
    setTratamientoHoras(undefined);
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
          <Col span={24}>
            <Form.Item
              name="idPersonal"
              label="Seleccionar Personal"
              rules={[{ required: true, message: "Seleccione un colaborador" }]}
            >
              <Select
                showSearch
                placeholder="Buscar por nombre o DNI..."
                filterOption={false}
                onSearch={handlePersonalSearch}
                onChange={handlePersonalChange}
                allowClear
                notFoundContent={fetchingPersonal ? <Spin size="small" /> : null}
              >
                {personalList.map((p) => (
                  <Option key={p.idPersonal} value={p.idPersonal}>
                    {p.nombrePersonal}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

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
              <Select
                placeholder="Seleccione tipo de permiso"
                notFoundContent={fetchingTiposPermiso ? <Spin size="small" /> : null}
              >
                {tiposPermisoList.map((tipo) => (
                  <Option key={tipo.idTipoPermiso} value={tipo.idTipoPermiso}>
                    {tipo.nombre}
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
                  <Radio.Group onChange={(e) => setTratamientoHoras(e.target.value)}>
                    <Radio value="descuento">Descuento de horas</Radio>
                    <Radio value="vacaciones">Cargo a vacaciones</Radio>
                    <Radio value="recuperables">Horas recuperables</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {/* BLOQUE 4: Recuperación de Horas - Solo visible si eligió "Horas recuperables" */}
        {tratamientoHoras === "recuperables" && (
          <>
            <Divider orientation="left" style={{ borderColor: "#1f1f1f" }}>
              Recuperación de Horas
            </Divider>

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
          </>
        )}
      </Form>
    </Modal>
  );
}
