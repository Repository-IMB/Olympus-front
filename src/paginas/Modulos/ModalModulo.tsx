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
  message,
  Radio,
  Alert,
} from "antd";
import { useEffect, useState } from "react";
import moment, { type Moment } from "moment";
import type { IModulo, ISesion, ISesionHorario } from "../../interfaces/IModulo";

interface ModalModuloProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  moduloEditar?: IModulo | null;
  modoEdicion?: boolean;
}

const DIAS = [
  { key: "1", label: "L" },  // Lunes
  { key: "2", label: "M" },  // Martes
  { key: "3", label: "X" },  // Miércoles
  { key: "4", label: "J" },  // Jueves
  { key: "5", label: "V" },  // Viernes
  { key: "6", label: "S" },  // Sábado
  { key: "7", label: "D" },  // Domingo
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
      // 1. Clonamos y limpiamos segundos/milisegundos para precisión exacta
      const inicio = moment(horaInicio).second(0).millisecond(0);
      const fin = moment(horaFin).second(0).millisecond(0);

      // 2. Calculamos diferencia en minutos y pasamos a horas
      const diffHoras = fin.diff(inicio, "minute") / 60;
      
      // 3. Calculamos total
      const total = diffHoras > 0 ? diffHoras * Number(nroSesiones) : 0;

      form.setFieldsValue({
        duracionHoras: Number(total.toFixed(2)),
      });
    } else {
      form.setFieldsValue({ duracionHoras: 0 });
    }
  }, [horaInicio, horaFin, nroSesiones, form]);

  // Efecto para cargar datos cuando se edita
  useEffect(() => {
    if (visible && modoEdicion && moduloEditar) {
      console.log('=== DEBUG CARGA DE DATOS ===');
      console.log('moduloEditar completo:', JSON.stringify(moduloEditar, null, 2));
      console.log('fechaPresentacion:', moduloEditar.fechaPresentacion);
      console.log('sesionesHorarios:', moduloEditar.sesionesHorarios);

      // Extraer días desde sesionesHorarios
      const diasArray: string[] = [];
      let primeraHoraInicio: string | null = null;
      let primeraHoraFin: string | null = null;
      let horaInicioSabado: string | null = null;
      let horaFinSabado: string | null = null;

      if (moduloEditar.sesionesHorarios && moduloEditar.sesionesHorarios.length > 0) {
        moduloEditar.sesionesHorarios.forEach((horario: ISesionHorario) => {
          console.log('Procesando horario:', {
            diaSemana: horario.diaSemana,
            esAsincronica: horario.esAsincronica,
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin
          });

          if (!horario.esAsincronica && horario.diaSemana > 0) {
            const diaStr = String(horario.diaSemana);
            if (!diasArray.includes(diaStr)) {
              diasArray.push(diaStr);
            }

            if (horario.diaSemana === 6) {
              horaInicioSabado = horario.horaInicio;
              horaFinSabado = horario.horaFin;
            } else if (!primeraHoraInicio) {
              primeraHoraInicio = horario.horaInicio;
              primeraHoraFin = horario.horaFin;
            }
          }
        });
      }

      // Buscar horario asincrónico
      const horarioAsync = moduloEditar.sesionesHorarios?.find((h: ISesionHorario) => h.esAsincronica);
      console.log('Horario async encontrado:', horarioAsync);

      // Contar sesiones
      const sesionesSincronicas = moduloEditar.sesiones?.filter((s: ISesion) => s.idTipoSesion === 22) || [];
      const sesionesAsincronicas = moduloEditar.sesiones?.filter((s: ISesion) => s.idTipoSesion === 26) || [];

      const totalSesionesSincronicas = sesionesSincronicas.reduce((sum: number, s: ISesion) => sum + (s.numeroSesiones || 0), 0);
      const totalSesionesAsincronicas = sesionesAsincronicas.reduce((sum: number, s: ISesion) => sum + (s.numeroSesiones || 0), 0);

      console.log('Días extraídos:', diasArray);
      console.log('Sesiones síncronas:', totalSesionesSincronicas);
      console.log('Sesiones asíncronas:', totalSesionesAsincronicas);

      const valoresFormulario = {
        nombre: moduloEditar.nombre,
        codigo: moduloEditar.codigo || "",
        tituloCertificado: moduloEditar.tituloCertificado || "",
        descripcion: moduloEditar.descripcion || "",
        fechaPresentacion: moduloEditar.fechaPresentacion
          ? moment(moduloEditar.fechaPresentacion)
          : null,
        horaInicio: primeraHoraInicio
          ? moment(primeraHoraInicio, "HH:mm:ss")
          : null,
        horaFin: primeraHoraFin
          ? moment(primeraHoraFin, "HH:mm:ss")
          : null,
        horaInicioSabado: horaInicioSabado
          ? moment(horaInicioSabado, "HH:mm:ss")
          : null,
        horaFinSabado: horaFinSabado
          ? moment(horaFinSabado, "HH:mm:ss")
          : null,
        nroSesiones: totalSesionesSincronicas,
        duracionHoras: moduloEditar.duracionHoras || 0,
        nroSesionesAsync: totalSesionesAsincronicas,
        diaAsync: horarioAsync && horarioAsync.diaSemana > 0
          ? String(horarioAsync.diaSemana)
          : undefined,
        horaInicioAsync: horarioAsync?.horaInicio
          ? moment(horarioAsync.horaInicio, "HH:mm:ss")
          : null,
        horaFinAsync: horarioAsync?.horaFin
          ? moment(horarioAsync.horaFin, "HH:mm:ss")
          : null,
      };

      console.log('Valores a setear en formulario:', valoresFormulario);
      console.log('diaAsync calculado:', valoresFormulario.diaAsync);
      console.log('fechaPresentacion calculada:', valoresFormulario.fechaPresentacion);
      console.log('===========================');

      setDiasClase(diasArray);
      form.setFieldsValue(valoresFormulario);
    } else if (visible && !modoEdicion) {
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
        const mantenerSesiones =
          values.gestionSesiones === "mantener";

        const payload: any = {
          id: modoEdicion ? moduloEditar?.id : undefined,

          // ===== DATOS DEL MÓDULO =====
          nombre: values.nombre,
          codigo: values.codigo,
          descripcion: values.descripcion,
          tituloCertificado: values.tituloCertificado || "",
          duracionHoras: Number(values.duracionHoras || 0),

          // ===== CONTROL SESIONES =====
          preserveSessions: mantenerSesiones,

          // ===== SESIÓN DE PRESENTACIÓN (SINCRÓNICA) =====
          fechaPresentacion: values.fechaPresentacion
            ? moment(values.fechaPresentacion).format("YYYY-MM-DD")
            : null,

          // ===== SESIONES SINCRÓNICAS =====
          numeroSesiones: Number(values.nroSesiones || 0),
          diasClase: diasClase.join(","),
          estado: true,
        };

        // Fecha de presentación - IMPORTANTE: enviar string vacío si no hay fecha
        if (values.fechaPresentacion) {
          payload.fechaPresentacion = moment(values.fechaPresentacion).format("YYYY-MM-DD");
        } else {
          payload.fechaPresentacion = ""; // ⬅️ String vacío en lugar de omitir
        }

        // Horarios síncronos - REQUERIDOS
        if (values.horaInicio && values.horaFin) {
          payload.horaInicioSync = moment(values.horaInicio).format("HH:mm:ss");
          payload.horaFinSync = moment(values.horaFin).format("HH:mm:ss");
        } else {
          message.error("Debe seleccionar hora de inicio y fin");
          return;
        }

        // Horarios asincrónicos
        if (Number(values.nroSesionesAsync) > 0) {
          payload.diasAsync = "";
          payload.horaInicioAsync = values.horaInicioAsync
            ? moment(values.horaInicioAsync).format("HH:mm:ss")
            : "00:00:00";

          payload.horaFinAsync = values.horaFinAsync
            ? moment(values.horaFinAsync).format("HH:mm:ss")
            : "00:00:00";
        } else {
          // Si no hay sesiones async, enviar valores por defecto
          payload.horaInicioAsync = "00:00:00";
          payload.horaFinAsync = "00:00:00";
        }

        if (modoEdicion && moduloEditar?.id) {
          payload.id = moduloEditar.id;
        }

        console.log('=== PAYLOAD DESDE MODAL ===');
        console.log(JSON.stringify(payload, null, 2));
        console.log('===========================');

        onSubmit(payload);
      })
      .catch((err) => {
        console.error("Error validando formulario", err);
      });
  };

  // Validador personalizado para hora inicio < hora fin
  const validarHoraInicio = (_: any, value: Moment) => {
    if (!value) {
      return Promise.resolve();
    }
    const horaFinValue = form.getFieldValue("horaFin");
    if (horaFinValue && value.isAfter(horaFinValue)) {
      return Promise.reject(new Error("La hora de inicio debe ser menor que la hora de fin"));
    }
    return Promise.resolve();
  };

  const validarHoraFin = (_: any, value: Moment) => {
    if (!value) {
      return Promise.resolve();
    }
    const horaInicioValue = form.getFieldValue("horaInicio");
    if (horaInicioValue && value.isBefore(horaInicioValue)) {
      return Promise.reject(new Error("La hora de fin debe ser mayor que la hora de inicio"));
    }
    return Promise.resolve();
  };

  // Validador para hora inicio sábado < hora fin sábado
  const validarHoraInicioSabado = (_: any, value: Moment) => {
    if (!value) {
      return Promise.resolve();
    }
    const horaFinSabadoValue = form.getFieldValue("horaFinSabado");
    if (horaFinSabadoValue && value.isAfter(horaFinSabadoValue)) {
      return Promise.reject(new Error("La hora de inicio debe ser menor que la hora de fin"));
    }
    return Promise.resolve();
  };

  const validarHoraFinSabado = (_: any, value: Moment) => {
    if (!value) {
      return Promise.resolve();
    }
    const horaInicioSabadoValue = form.getFieldValue("horaInicioSabado");
    if (horaInicioSabadoValue && value.isBefore(horaInicioSabadoValue)) {
      return Promise.reject(new Error("La hora de fin debe ser mayor que la hora de inicio"));
    }
    return Promise.resolve();
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
                { pattern: /^[a-zA-Z0-9-]+$/, message: "Solo alfanumérico y guiones" },
              ]}
            >
              <Input placeholder="MOD-VENT-001" />
            </Form.Item>
          </Col>
        </Row>

        {/* 2do renglón */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="Título del certificado" name="tituloCertificado">
              <Input placeholder="Certificado en..." />
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
              <Input.TextArea rows={3} placeholder="Descripción del módulo" />
            </Form.Item>
          </Col>
        </Row>

        {/* ✅ RADIO BUTTONS PARA GESTIÓN DE SESIONES - Solo en modo edición */}
        {modoEdicion && (
          <>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Form.Item 
                  label="Gestión de sesiones" 
                  name="gestionSesiones"
                  initialValue="mantener"
                >
                  <Radio.Group>
                    <Space direction="vertical">
                      <Radio value="mantener">
                        <Space direction="vertical" size={0}>
                          <span><strong>Mantener sesiones existentes</strong></span>
                          <span style={{ fontSize: 12, color: '#666' }}>
                            Solo se actualizarán los datos básicos del módulo
                          </span>
                        </Space>
                      </Radio>
                      <Radio value="regenerar">
                        <Space direction="vertical" size={0}>
                          <span><strong>Regenerar sesiones y horarios</strong></span>
                          <span style={{ fontSize: 12, color: '#666' }}>
                            Se eliminarán las sesiones actuales y se crearán nuevas
                          </span>
                        </Space>
                      </Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            {/* Alerta de advertencia cuando se va a regenerar */}
            <Form.Item shouldUpdate>
              {() => {
                const value = form.getFieldValue("gestionSesiones");
                if (value === "regenerar") {
                  return (
                    <Alert
                      message="Atención"
                      description="Al regenerar las sesiones, se perderán todos los horarios y configuraciones actuales de las sesiones existentes."
                      type="warning"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  );
                }
                return null;
              }}
            </Form.Item>
          </>
        )}

        {/* 4to renglón */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Fecha de presentación"
              name="fechaPresentacion"
              rules={[{ required: true, message: "Seleccione fecha" }]}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label="Hora inicio"
              name="horaInicio"
              rules={[
                { required: true, message: "Seleccione hora" },
                { validator: validarHoraInicio }
              ]}
              dependencies={['horaFin']}
            >
              <TimePicker style={{ width: "100%" }} format="HH:mm" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label="Hora fin"
              name="horaFin"
              rules={[
                { required: true, message: "Seleccione hora" },
                { validator: validarHoraFin }
              ]}
              dependencies={['horaInicio']}
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
            <Form.Item label="Duración (horas)" name="duracionHoras">
              <InputNumber disabled style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Sesiones asincrónicas" name="nroSesionesAsync">
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
        {diasClase.includes("6") && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Hora inicio (Sábado)"
                name="horaInicioSabado"
                rules={[
                  { required: true, message: "Requerido" },
                  { validator: validarHoraInicioSabado }
                ]}
                dependencies={['horaFinSabado']}
              >
                <TimePicker style={{ width: "100%" }} format="HH:mm" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Hora fin (Sábado)"
                name="horaFinSabado"
                rules={[
                  { required: true, message: "Requerido" },
                  { validator: validarHoraFinSabado }
                ]}
                dependencies={['horaInicioSabado']}
              >
                <TimePicker style={{ width: "100%" }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>
        )}
      </Form>
    </Modal>
  );
}