import { Modal, Form, Row, Col, Input, Select, Button, TimePicker, Space, message } from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { useEffect, useState, useRef } from "react";
import moment from "moment";
import { obtenerTiposSesion, type TipoSesion } from "../../servicios/ModuloService";

interface ModalSesionProps {
  visible: boolean;
  modo: "crear" | "editar";
  sesion?: any | null; 
  onCancel: () => void;
  onSave: (payload: any) => void;
}

const DIAS_BOTONES = [
  { value: 1, label: "L" },
  { value: 2, label: "M" },
  { value: 3, label: "X" },
  { value: 4, label: "J" },
  { value: 5, label: "V" },
  { value: 6, label: "S" },
  { value: 0, label: "D" },
];

const MODALIDADES = [
  { value: "sincronica", label: "Sincrónica" },
  { value: "asincronica", label: "Asincrónica" },
];

export default function ModalSesion({
  visible,
  modo,
  sesion,
  onCancel,
  onSave,
}: ModalSesionProps) {
  const [form] = Form.useForm();
  
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
  const [listaTiposSesion, setListaTiposSesion] = useState<TipoSesion[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [esAsincronica, setEsAsincronica] = useState(false);
  const tiposCargadosRef = useRef(false);

  // Primer useEffect - Cargar tipos de sesión
  useEffect(() => {
    if (visible && !tiposCargadosRef.current) {
      const cargarTipos = async () => {
        setLoadingTipos(true);
        const datos = await obtenerTiposSesion();
        setListaTiposSesion(datos);
        tiposCargadosRef.current = true;
        setLoadingTipos(false);
      };
      cargarTipos();
    }
  }, [visible]);

  // Segundo useEffect - Setear valores del formulario
  useEffect(() => {
    if (!visible) return;

    // Esperar a que los tipos estén cargados antes de setear valores
    if (modo === "editar" && sesion && listaTiposSesion.length > 0) {
      // Lógica de mapeo corregida (Backend -> Frontend)
      let modalidadValor = "sincronica";
      if (sesion.modalidad) {
        modalidadValor = sesion.modalidad;
      } else if (sesion.esAsincronica !== undefined) {
        modalidadValor = sesion.esAsincronica ? "asincronica" : "sincronica";
      }

      setEsAsincronica(modalidadValor === "asincronica");
      setDiaSeleccionado(sesion.diaSemana);

      // 🟢 SOLUCIÓN: Buscar el ID del tipo basándose en el nombre
      let tipoValor;
      
      if (sesion.idTipoSesion !== undefined && sesion.idTipoSesion !== null) {
        // Si viene el ID, usarlo directamente
        tipoValor = sesion.idTipoSesion;
      } else if (sesion.tipoSesion) {
        // Si no viene el ID pero sí el nombre, buscarlo en la lista
        const tipoEncontrado = listaTiposSesion.find(
          t => t.nombre.toLowerCase() === sesion.tipoSesion.toLowerCase()
        );
        tipoValor = tipoEncontrado ? tipoEncontrado.id : undefined;
        
        console.log("🔍 Buscando tipo por nombre:", sesion.tipoSesion);
        console.log("🔍 Tipo encontrado:", tipoEncontrado);
      } else if (sesion.tipo !== undefined && sesion.tipo !== null) {
        tipoValor = sesion.tipo;
      }

      console.log("🔍 DEBUG - Sesión:", sesion);
      console.log("🔍 DEBUG - Tipo final a setear:", tipoValor);
      console.log("🔍 DEBUG - Lista tipos disponibles:", listaTiposSesion);

      form.setFieldsValue({
        nombre: sesion.nombre || sesion.nombreSesion, 
        diaSemana: sesion.diaSemana,
        horaInicio: sesion.horaInicio ? moment(sesion.horaInicio, "HH:mm") : null,
        horaFin: sesion.horaFin ? moment(sesion.horaFin, "HH:mm") : null,
        modalidad: modalidadValor,
        tipo: tipoValor,
      });
    } else if (modo === "crear") {
      // Limpiar formulario
      form.resetFields();
      setDiaSeleccionado(null);
      setEsAsincronica(false);
    }
  }, [visible, modo, sesion, form, listaTiposSesion]);

  const handleCancel = () => {
    form.resetFields();
    setDiaSeleccionado(null);
    setEsAsincronica(false);
    onCancel();
  };

  // Manejar cambio de modalidad
  const handleModalidadChange = (value: string) => {
    const esAsync = value === "asincronica";
    setEsAsincronica(esAsync);
    
    // Si es asincrónica, asignar valores por defecto: Domingo (0) y 00:00
    if (esAsync) {
      setDiaSeleccionado(0); // Domingo
      form.setFieldsValue({
        diaSemana: 0,
        horaInicio: moment("00:00", "HH:mm"),
        horaFin: moment("00:00", "HH:mm"),
      });
    } else {
      // Si vuelve a sincrónica, limpiar los campos
      setDiaSeleccionado(null);
      form.setFieldsValue({
        diaSemana: null,
        horaInicio: null,
        horaFin: null,
      });
    }
  };

  const handleSave = async () => {
    try {
        const values = await form.validateFields();

        // Validación del día (solo si es sincrónica)
        if (!esAsincronica && (diaSeleccionado === null || values.diaSemana === undefined || values.diaSemana === null)) {
        message.error("Debe seleccionar un día de la semana");
        return;
        }

        // 🟢 Si es asincrónica, forzar valores por defecto
        const payload = {
        ...(modo === "editar" && sesion?.id ? { id: sesion.id } : {}),
        nombre: values.nombre,
        diaSemana: esAsincronica ? 0 : values.diaSemana, // 🟢 Si es async → 0 (Domingo)
        horaInicio: esAsincronica ? "00:00:00" : (values.horaInicio ? values.horaInicio.format("HH:mm:ss") : "00:00:00"),
        horaFin: esAsincronica ? "00:00:00" : (values.horaFin ? values.horaFin.format("HH:mm:ss") : "00:00:00"),
        modalidad: values.modalidad,
        tipo: values.tipo,
        };

        console.log("📤 Payload a enviar:", payload);

        await onSave(payload);
        handleCancel();
    } catch (error: any) {
        console.error("Error validación:", error);
    }
    };
  const handleDiaClick = (valorDia: number) => {
    // Solo permitir selección manual si NO es asincrónica
    if (!esAsincronica) {
      setDiaSeleccionado(valorDia);
      form.setFieldsValue({ diaSemana: valorDia });
    }
  };

  return (
    <Modal
      open={visible}
      title={modo === "editar" ? "Editar Sesión" : "Crear nueva sesión"}
      onCancel={handleCancel}
      width={600}
      footer={
        <Button
          type="primary"
          block
          size="large"
          icon={modo === "editar" ? <EditOutlined /> : <PlusOutlined />}
          onClick={handleSave}
          style={{ backgroundColor: '#1677ff' }}
        >
          {modo === "editar" ? "Guardar cambios" : "Crear sesión"}
        </Button>
      }
    >
      <Form form={form} layout="vertical">
        
        {/* Renglón 1: Nombre */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Nombre de la sesión"
              name="nombre"
              rules={[
                { required: true, message: "Campo requerido" },
                {
                  pattern: /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ.,-]+$/,
                  message: "Caracteres no permitidos",
                },
              ]}
            >
              <Input placeholder="Ej: Clase 1, Taller de Marketing" />
            </Form.Item>
          </Col>
        </Row>

        {/* Renglón 1.5: Modalidad */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Modalidad"
              name="modalidad"
              rules={[{ required: true, message: "Requerido" }]}
            >
              <Select 
                placeholder="Seleccionar"
                onChange={handleModalidadChange}
              >
                {MODALIDADES.map((mod) => (
                  <Select.Option key={mod.value} value={mod.value}>
                    {mod.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Mostrar nota si es asincrónica */}
        {esAsincronica && (
          <Row gutter={16}>
            <Col span={24}>
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#e6f7ff",
                  borderLeft: "3px solid #1890ff",
                  borderRadius: "4px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "#0050b3",
                }}
              >
                <strong>ℹ️ Modalidad Asincrónica:</strong> Se asignará automáticamente día Domingo y horario 00:00.
              </div>
            </Col>
          </Row>
        )}

        {/* Renglón 2: Selector de Días */}
        {!esAsincronica && (
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="diaSemana" style={{ display: 'none' }}>
                  <Input />
              </Form.Item>

              <Form.Item 
                  label="Día de la semana" 
                  required 
                  help={diaSeleccionado === null ? "Seleccione un día" : ""}
                  validateStatus={diaSeleccionado === null ? "" : "success"}
              >
                <Space size="middle">
                  {DIAS_BOTONES.map((d) => (
                    <Button
                      key={d.value}
                      type={diaSeleccionado === d.value ? "primary" : "default"}
                      onClick={() => handleDiaClick(d.value)}
                      shape="circle"
                      style={{ minWidth: '40px' }}
                    >
                      {d.label}
                    </Button>
                  ))}
                </Space>
              </Form.Item>
            </Col>
          </Row>
        )}

        {/* Renglón 3: Horarios */}
        {!esAsincronica && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Hora de inicio"
                name="horaInicio"
                rules={[{ required: true, message: "Requerido" }]}
              >
                <TimePicker
                  format="HH:mm"
                  placeholder="00:00"
                  style={{ width: "100%" }}
                  minuteStep={15}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Hora de fin"
                name="horaFin"
                dependencies={['horaInicio']}
                rules={[
                  { required: true, message: "Requerido" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const horaInicio = getFieldValue("horaInicio");
                      if (!value || !horaInicio) return Promise.resolve();
                      if (value.isAfter(horaInicio)) return Promise.resolve();
                      return Promise.reject(new Error("Debe ser posterior al inicio"));
                    },
                  }),
                ]}
              >
                <TimePicker
                  format="HH:mm"
                  placeholder="00:00"
                  style={{ width: "100%" }}
                  minuteStep={15}
                />
              </Form.Item>
            </Col>
          </Row>
        )}

        {/* Renglón 4: Tipo de sesión */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Tipo de sesión"
              name="tipo"
              rules={[{ required: true, message: "Requerido" }]}
            >
              <Select 
                placeholder="Seleccionar" 
                loading={loadingTipos}
                showSearch
                optionFilterProp="children"
              >
                {listaTiposSesion.map((tipo) => (
                  <Select.Option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Nota informativa */}
        {!esAsincronica && (
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                padding: "12px",
                backgroundColor: "#f5f5f5",
                borderRadius: "4px",
                fontSize: "12px",
                color: "#8c8c8c",
                textAlign: "center"
              }}
            >
              <strong>Nota:</strong> Verifique que el día coincida con el cronograma general.
            </div>
          </div>
        )}

      </Form>
    </Modal>
  );
}