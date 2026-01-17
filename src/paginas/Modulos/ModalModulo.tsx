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

  // Observamos los valores para cálculos y lógica de visualización
  const horaInicio = Form.useWatch("horaInicio", form);
  const horaFin = Form.useWatch("horaFin", form);
  const nroSesiones = Form.useWatch("nroSesiones", form);
  const gestionSesiones = Form.useWatch("gestionSesiones", form);

  // Lógica para mostrar/ocultar campos
  // Se muestran si: NO es edición (creación) O si es edición y eligió "regenerar"
  const mostrarProgramacion = !modoEdicion || gestionSesiones === "regenerar";

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
      // Solo resetear si estamos viendo los campos, para evitar sobrescribir datos ocultos innecesariamente
      if (mostrarProgramacion) {
          form.setFieldsValue({ duracionHoras: 0 });
      }
    }
  }, [horaInicio, horaFin, nroSesiones, form, mostrarProgramacion]);

  // Efecto para cargar datos cuando se edita
  useEffect(() => {
    if (visible && modoEdicion && moduloEditar) {
      // ... (Lógica de extracción de datos existente igual que antes) ...
      // Extraer días desde sesionesHorarios
      const diasArray: string[] = [];
      let primeraHoraInicio: string | null = null;
      let primeraHoraFin: string | null = null;
      let horaInicioSabado: string | null = null;
      let horaFinSabado: string | null = null;

      if (moduloEditar.sesionesHorarios && moduloEditar.sesionesHorarios.length > 0) {
        moduloEditar.sesionesHorarios.forEach((horario: ISesionHorario) => {
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

      // Contar sesiones
      const sesionesSincronicas = moduloEditar.sesiones?.filter((s: ISesion) => s.idTipoSesion === 22) || [];
      const sesionesAsincronicas = moduloEditar.sesiones?.filter((s: ISesion) => s.idTipoSesion === 26) || [];

      const totalSesionesSincronicas = sesionesSincronicas.reduce((sum: number, s: ISesion) => sum + (s.numeroSesiones || 0), 0);
      const totalSesionesAsincronicas = sesionesAsincronicas.reduce((sum: number, s: ISesion) => sum + (s.numeroSesiones || 0), 0);

      const valoresFormulario = {
        nombre: moduloEditar.nombre,
        codigo: moduloEditar.codigo || "",
        tituloCertificado: moduloEditar.tituloCertificado || "",
        descripcion: moduloEditar.descripcion || "",
        // Default a mantener cuando se abre editar
        gestionSesiones: "mantener", 
        fechaPresentacion: moduloEditar.fechaPresentacion
          ? moment(moduloEditar.fechaPresentacion)
          : null,
        fechaInicio: moduloEditar.fechaInicio ? moment(moduloEditar.fechaInicio) : null,
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
        const mantenerSesiones = values.gestionSesiones === "mantener";
        const esEdicionMantener = modoEdicion && mantenerSesiones && moduloEditar;

        // 1. Validaciones previas
        if (!mantenerSesiones) {
             if (!values.horaInicio || !values.horaFin) {
                 message.error("Debe seleccionar hora de inicio y fin para las sesiones síncronas");
                 return;
             }
             if (diasClase.length === 0) {
                 message.error("Debe seleccionar al menos un día de clase");
                 return;
             }
        }

        // 2. Preparar Payload Base
        const payload: any = {
          id: modoEdicion ? moduloEditar?.id : undefined,
          nombre: values.nombre,
          codigo: values.codigo,
          descripcion: values.descripcion,
          tituloCertificado: values.tituloCertificado || "",
          preserveSessions: mantenerSesiones,
          estado: true,
        };

        // =================================================================================
        // LÓGICA DE PROGRAMACIÓN
        // =================================================================================
        
        if (esEdicionMantener) {
            // 🟠 CASO A: MANTENER (Lógica existente - respeta lo que ya está en BD)
            console.log("🔒 MODO MANTENER");

            payload.duracionHoras = moduloEditar.duracionHoras || 0;
            payload.fechaPresentacion = moduloEditar.fechaPresentacion 
                ? moment(moduloEditar.fechaPresentacion).format("YYYY-MM-DD") 
                : null;
              payload.fechaInicio = moduloEditar.fechaInicio 
                ? moment(moduloEditar.fechaInicio).format("YYYY-MM-DD") 
                : null;

            // Recalcular totales originales
            const sesionesSinc = moduloEditar.sesiones?.filter((s: ISesion) => s.idTipoSesion === 22) || [];
            const sesionesAsync = moduloEditar.sesiones?.filter((s: ISesion) => s.idTipoSesion === 26) || [];
            const sesionesPres = moduloEditar.sesiones?.filter((s: ISesion) => s.idTipoSesion === 27) || [];
            
            const totalSync = sesionesSinc.reduce((sum: number, s: ISesion) => sum + (s.numeroSesiones || 0), 0);
            const totalAsync = sesionesAsync.reduce((sum: number, s: ISesion) => sum + (s.numeroSesiones || 0), 0);
            const totalPres = sesionesPres.reduce((sum: number, s: ISesion) => sum + (s.numeroSesiones || 0), 0);

            // Aquí sumamos todo porque estamos leyendo lo que YA existe para no perder datos
            payload.numeroSesiones = totalSync + totalAsync + totalPres; 
            payload.numeroSesionesAsincronicas = totalAsync;
            payload.numeroSesionesPresentacion = totalPres;

            // Horarios Originales...
            let horaInicioSync = "00:00:00";
            let horaFinSync = "00:00:00";
            const diasOriginales: string[] = [];
            if (moduloEditar.sesionesHorarios) {
                moduloEditar.sesionesHorarios.forEach(h => {
                    if (!h.esAsincronica && h.diaSemana > 0) {
                        if (!diasOriginales.includes(String(h.diaSemana))) diasOriginales.push(String(h.diaSemana));
                        if (horaInicioSync === "00:00:00") {
                            horaInicioSync = h.horaInicio || "00:00:00";
                            horaFinSync = h.horaFin || "00:00:00";
                        }
                    }
                });
            }
            payload.diasClase = diasOriginales.join(",");
            payload.horaInicioSync = horaInicioSync;
            payload.horaFinSync = horaFinSync;

            const horarioAsync = moduloEditar.sesionesHorarios?.find(h => h.esAsincronica);
            payload.horaInicioAsync = horarioAsync?.horaInicio || "00:00:00";
            payload.horaFinAsync = horarioAsync?.horaFin || "00:00:00";

        } else {
            // 🟢 CASO B: REGENERAR O NUEVO (LÓGICA CORREGIDA)
            
            // 1. INPUT DEL USUARIO = TOTAL ABSOLUTO
            const inputTotal = Number(values.nroSesiones || 0);
            const inputAsync = Number(values.nroSesionesAsync || 0);

            // 2. DETECTAR PRESENTACIÓN
            let inputPres = 0;
            if (values.fechaPresentacion && moment(values.fechaPresentacion).isValid()) {
                 inputPres = 1;
                 payload.fechaPresentacion = moment(values.fechaPresentacion).format("YYYY-MM-DD");
            } else {
                 payload.fechaPresentacion = null;
            }

            if (values.fechaInicio && moment(values.fechaInicio).isValid()) {
                payload.fechaInicio = moment(values.fechaInicio).format("YYYY-MM-DD");
            }

            // 3. ASIGNACIÓN DIRECTA
            // No sumamos nada. El usuario ingresó el Total y nosotros le decimos al SP cómo desglosarlo.
            payload.numeroSesiones = inputTotal; 
            payload.numeroSesionesAsincronicas = inputAsync;
            payload.numeroSesionesPresentacion = inputPres;

            payload.duracionHoras = Number(values.duracionHoras || 0);

            // 4. DATOS SÍNCRONOS
            payload.diasClase = diasClase.join(",");
            payload.horaInicioSync = values.horaInicio ? moment(values.horaInicio).format("HH:mm:ss") : "00:00:00";
            payload.horaFinSync = values.horaFin ? moment(values.horaFin).format("HH:mm:ss") : "00:00:00";

            // 5. DATOS ASÍNCRONOS
            if (inputAsync > 0) {
                payload.diasAsync = ""; 
                payload.horaInicioAsync = values.horaInicioAsync ? moment(values.horaInicioAsync).format("HH:mm:ss") : "00:00:00";
                payload.horaFinAsync = values.horaFinAsync ? moment(values.horaFinAsync).format("HH:mm:ss") : "00:00:00";
            } else {
                payload.horaInicioAsync = "00:00:00";
                payload.horaFinAsync = "00:00:00";
            }
        }

        if (modoEdicion && moduloEditar?.id) {
          payload.id = moduloEditar.id;
        }

        console.log('=== PAYLOAD A ENVIAR ===', payload);
        onSubmit(payload);
      })
      .catch((err) => {
        console.error("Error form", err);
        message.error("Verifique los campos requeridos.");
      });
  };

  // Validadores (se mantienen igual)
  const validarHoraInicio = (_: any, value: Moment) => {
    if (!value) return Promise.resolve();
    const horaFinValue = form.getFieldValue("horaFin");
    if (horaFinValue && value.isAfter(horaFinValue)) {
      return Promise.reject(new Error("La hora de inicio debe ser menor que la hora de fin"));
    }
    return Promise.resolve();
  };

  const validarHoraFin = (_: any, value: Moment) => {
    if (!value) return Promise.resolve();
    const horaInicioValue = form.getFieldValue("horaInicio");
    if (horaInicioValue && value.isBefore(horaInicioValue)) {
      return Promise.reject(new Error("La hora de fin debe ser mayor que la hora de inicio"));
    }
    return Promise.resolve();
  };

  const validarHoraInicioSabado = (_: any, value: Moment) => {
    if (!value) return Promise.resolve();
    const horaFinSabadoValue = form.getFieldValue("horaFinSabado");
    if (horaFinSabadoValue && value.isAfter(horaFinSabadoValue)) {
      return Promise.reject(new Error("La hora de inicio debe ser menor que la hora de fin"));
    }
    return Promise.resolve();
  };

  const validarHoraFinSabado = (_: any, value: Moment) => {
    if (!value) return Promise.resolve();
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
        {/* 1er renglón (Siempre visible) */}
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

        {/* 2do renglón (Siempre visible) */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="Título del certificado" name="tituloCertificado">
              <Input placeholder="Certificado en..." />
            </Form.Item>
          </Col>
        </Row>

        {/* 3er renglón (Siempre visible) */}
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

        {/* RADIO BUTTONS PARA GESTIÓN DE SESIONES - Solo en modo edición */}
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
        {mostrarProgramacion && (
          <>
            {/* 4to renglón */}
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Fecha de presentación"
                  name="fechaPresentacion"
                >
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item 
                    label="Fecha de Inicio" 
                    name="fechaInicio" 
                    rules={[{ required: true, message: "Seleccione fecha de inicio" }]}
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
          </>
        )}
      </Form>
    </Modal>
  );
}