import { Modal, Form, Row, Col, Input, Select, Button, TimePicker, DatePicker, message } from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { useEffect, useState, useRef } from "react";
import moment from "moment";
import { obtenerTiposSesion, obtenerSesionesPorModulo, type TipoSesion } from "../../servicios/ModuloService";

interface ModalSesionProps {
  visible: boolean;
  modo: "crear" | "editar";
  sesion?: any | null;
  idModulo: number;
  onCancel: () => void;
  onSave: (payload: any) => void;
}

const MODALIDADES = [
  { value: "sincronica", label: "Sincrónica" },
  { value: "asincronica", label: "Asincrónica" },
];

export default function ModalSesion({
  visible,
  modo,
  sesion,
  idModulo,
  onCancel,
  onSave,
}: ModalSesionProps) {
  const [form] = Form.useForm();
  
  const [listaTiposSesion, setListaTiposSesion] = useState<TipoSesion[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [esAsincronica, setEsAsincronica] = useState(false);
  const [fechasOcupadas, setFechasOcupadas] = useState<string[]>([]);
  
  const tiposCargadosRef = useRef(false);

  // 1. Cargar datos iniciales (Tipos y Fechas ocupadas)
  useEffect(() => {
    if (visible && !tiposCargadosRef.current) {
      const cargarDatos = async () => {
        setLoadingTipos(true);
        try {
            const tipos = await obtenerTiposSesion();
            setListaTiposSesion(tipos);

            const sesionesExistentes = await obtenerSesionesPorModulo(idModulo);
            const fechas = sesionesExistentes
                .filter(s => s.estado === true && (modo === 'crear' || s.id !== sesion?.id))
                .map(s => {
                    const fRaw = (s as any).fecha || (s as any).fechaSesion;
                    return fRaw ? moment(fRaw).format("YYYY-MM-DD") : null;
                })
                .filter(f => f !== null) as string[];

            setFechasOcupadas(fechas);
        } catch (error) {
            console.error("Error cargando datos iniciales:", error);
        } finally {
            setLoadingTipos(false);
            tiposCargadosRef.current = true;
        }
      };
      cargarDatos();
    }
  }, [visible, idModulo, modo, sesion]); // Agregué modo y sesion a dependencias para asegurar refresco

  // 2. Controlar valores del formulario al abrir
  useEffect(() => {
    if (!visible) return;

    // 🟢 LIMPIEZA ABSOLUTA AL ABRIR
    form.resetFields(); 

    if (modo === "editar" && sesion) {
      // --- MODO EDITAR: Llenar datos ---
      let modalidadValor = "sincronica";
      if (sesion.modalidad) modalidadValor = sesion.modalidad;
      else if (sesion.esAsincronica !== undefined) modalidadValor = sesion.esAsincronica ? "asincronica" : "sincronica";

      setEsAsincronica(modalidadValor === "asincronica");

      let tipoValor;
      if (sesion.idTipoSesion) tipoValor = sesion.idTipoSesion;
      else if (sesion.tipoSesion && listaTiposSesion.length > 0) {
        const t = listaTiposSesion.find(x => x.nombre.toLowerCase() === sesion.tipoSesion.toLowerCase());
        if (t) tipoValor = t.id;
      }

      form.setFieldsValue({
        nombre: sesion.nombre || sesion.nombreSesion,
        fecha: sesion.fecha ? moment(sesion.fecha) : null,
        horaInicio: sesion.horaInicio ? moment(sesion.horaInicio, "HH:mm") : null,
        horaFin: sesion.horaFin ? moment(sesion.horaFin, "HH:mm") : null,
        modalidad: modalidadValor,
        tipo: tipoValor,
      });
    } 
    else if (modo === "crear") {
      // --- MODO CREAR: Dejar todo limpio ---
      setEsAsincronica(false);
      // 🟢 CORRECCIÓN: Quitamos los valores por defecto de horas. Solo dejamos modalidad.
      form.setFieldsValue({
          modalidad: 'sincronica',
          fecha: null,
          horaInicio: null,
          horaFin: null,
          nombre: null,
          tipo: null
      });
    }
  }, [visible, modo, sesion, form, listaTiposSesion]);

  const handleCancel = () => {
    form.resetFields();
    setEsAsincronica(false);
    onCancel();
  };

  const handleModalidadChange = (value: string) => {
    const esAsync = value === "asincronica";
    setEsAsincronica(esAsync);
    
    if (esAsync) {
      const primerDomingo = moment().day(0); 
      form.setFieldsValue({
        fecha: primerDomingo,
        horaInicio: moment("00:00", "HH:mm"),
        horaFin: moment("00:00", "HH:mm"),
      });
    } else {
      // Al volver a sincrónica, limpiamos para que el usuario elija
      form.setFieldsValue({
        fecha: null,
        horaInicio: null,
        horaFin: null,
      });
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (!esAsincronica && !values.fecha) {
        message.error("Debe seleccionar una fecha");
        return;
      }

      const payload = {
        ...(modo === "editar" && sesion?.id ? { id: sesion.id } : {}),
        nombre: values.nombre,
        fecha: values.fecha ? values.fecha.format("YYYY-MM-DD") : moment().format("YYYY-MM-DD"),
        horaInicio: esAsincronica ? "00:00:00" : (values.horaInicio ? values.horaInicio.format("HH:mm:ss") : "00:00:00"),
        horaFin: esAsincronica ? "00:00:00" : (values.horaFin ? values.horaFin.format("HH:mm:ss") : "00:00:00"),
        modalidad: values.modalidad,
        tipo: values.tipo,
      };

      await onSave(payload);
      handleCancel();
    } catch (error: any) {
      console.error("Error validación:", error);
    }
  };

  const disabledDate = (current: moment.Moment) => {
    if (!current) return false;
    const fechaStr = current.format('YYYY-MM-DD');
    
    if (modo === "editar" && sesion?.fecha) {
        const fechaOriginal = moment(sesion.fecha).format("YYYY-MM-DD");
        if (fechaStr === fechaOriginal) return false;
    }
    
    return fechasOcupadas.includes(fechaStr);
  };

  return (
    <Modal
      open={visible}
      // 🟢 IMPORTANTE: destroyOnClose asegura que el componente se reinicie totalmente al cerrar
      destroyOnClose={true} 
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
                <strong>ℹ️ Modalidad Asincrónica:</strong> La fecha y horarios son referenciales.
              </div>
            </Col>
          </Row>
        )}

        {!esAsincronica && (
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Fecha de la sesión"
                name="fecha"
                validateTrigger={['onChange', 'onBlur']}
                rules={[
                    { required: true, message: "Debe seleccionar una fecha" },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value) return Promise.resolve();
                            const fechaStr = value.format('YYYY-MM-DD');
                            
                            if (modo === 'editar' && sesion?.fecha) {
                                const original = moment(sesion.fecha).format('YYYY-MM-DD');
                                if (fechaStr === original) return Promise.resolve();
                            }

                            if (fechasOcupadas.includes(fechaStr)) {
                                return Promise.reject(new Error("⚠️ Ya existe una sesión en esta fecha"));
                            }
                            return Promise.resolve();
                        },
                    }),
                ]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  placeholder="Seleccionar fecha"
                  style={{ width: "100%" }}
                  disabledDate={disabledDate} 
                  dateRender={(current) => {
                    const fechaStr = current.format('YYYY-MM-DD');
                    const estaOcupada = fechasOcupadas.includes(fechaStr);
                    
                    if (estaOcupada) {
                      return (
                        <div className="ant-picker-cell-inner" style={{ position: 'relative', color: '#ff4d4f', fontWeight: 'bold' }}>
                          {current.date()}
                          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', backgroundColor: '#ff4d4f' }} />
                        </div>
                      );
                    }
                    return <div className="ant-picker-cell-inner">{current.date()}</div>;
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        )}

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

        {!esAsincronica && (
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                padding: "12px",
                backgroundColor: "#fff2f0",
                border: "1px solid #ffccc7",
                borderRadius: "4px",
                fontSize: "12px",
                color: "#ff4d4f",
                textAlign: "center"
              }}
            >
              <strong>Nota:</strong> Las fechas en <span style={{color: '#ff4d4f', fontWeight: 'bold'}}>rojo</span> ya están ocupadas.
            </div>
          </div>
        )}

      </Form>
    </Modal>
  );
}