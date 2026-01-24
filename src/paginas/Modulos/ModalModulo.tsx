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

  // Observamos los valores para cálculos
  const fechaInicio = Form.useWatch("fechaInicio", form); // Fundamental para saber qué días caen
  const horaInicio = Form.useWatch("horaInicio", form);
  const horaFin = Form.useWatch("horaFin", form);
  const horaInicioSabado = Form.useWatch("horaInicioSabado", form);
  const horaFinSabado = Form.useWatch("horaFinSabado", form);
  const nroSesiones = Form.useWatch("nroSesiones", form);
  const gestionSesiones = Form.useWatch("gestionSesiones", form);

  const mostrarProgramacion = !modoEdicion || gestionSesiones === "regenerar";

  // ==============================================================================
  // 🟢 CÁLCULO DE HORAS (Soporte para sábados con horario diferente)
  // ==============================================================================
  useEffect(() => {
    // Si no se muestran los campos, no recalculamos para no pisar datos ocultos
    if (!mostrarProgramacion) return;

    // Validación mínima: Horarios semana y Nro sesiones son obligatorios para empezar
    if (!horaInicio || !horaFin || !nroSesiones) {
      form.setFieldsValue({ duracionHoras: 0 });
      return;
    }

    // 1. Calcular duración de una sesión "Semana" (L-V + D)
    const inicioSemana = moment(horaInicio).second(0).millisecond(0);
    const finSemana = moment(horaFin).second(0).millisecond(0);
    const duracionSemana = Math.max(0, finSemana.diff(inicioSemana, "minute") / 60);

    // 2. Calcular duración de sesión "Sábado"
    let duracionSabado = duracionSemana; // Por defecto igual
    const tieneSabado = diasClase.includes("6");

    if (tieneSabado && horaInicioSabado && horaFinSabado) {
      const inicioSab = moment(horaInicioSabado).second(0).millisecond(0);
      const finSab = moment(horaFinSabado).second(0).millisecond(0);
      duracionSabado = Math.max(0, finSab.diff(inicioSab, "minute") / 60);
    }

    // 3. Lógica de conteo
    let totalHoras = 0;
    const duracionesSonIguales = Math.abs(duracionSemana - duracionSabado) < 0.01;

    // CASO A: Cálculo simple
    // Si NO hay sábados O si los sábados duran lo mismo que la semana, multiplicamos directo.
    if (!tieneSabado || duracionesSonIguales) {
      totalHoras = duracionSemana * Number(nroSesiones);
    } 
    // CASO B: Cálculo complejo (Calendario simulado)
    // Si hay sábados con horario distinto, necesitamos iterar fecha por fecha.
    else {
      if (fechaInicio) {
        let sesionesContadas = 0;
        let sabadosContados = 0;
        
        // Clonamos fecha inicio para no alterar el valor del form
        const fechaIteracion = moment(fechaInicio);

        // Convertimos tus keys ("1","2"...) a enteros de Moment (1=Lun...6=Sab, 0=Dom)
        // Nota: Tu array DIAS usa "7" para Domingo, Moment usa 0.
        const diasValidosMoment = diasClase.map(d => d === "7" ? 0 : parseInt(d));

        // Bucle de seguridad (max 1000 iteraciones) para evitar colgar el navegador
        let seguridad = 0;
        while (sesionesContadas < Number(nroSesiones) && seguridad < 1000) {
          const diaSemanaActual = fechaIteracion.day(); // 0-6

          if (diasValidosMoment.includes(diaSemanaActual)) {
            sesionesContadas++;
            if (diaSemanaActual === 6) {
              sabadosContados++; // Encontré un sábado
            }
          }
          // Avanzar al día siguiente
          fechaIteracion.add(1, 'days');
          seguridad++;
        }

        // Fórmula final: (Total - Sábados) * DuracionSemana + Sábados * DuracionSábado
        const sesionesSemana = Number(nroSesiones) - sabadosContados;
        totalHoras = (sesionesSemana * duracionSemana) + (sabadosContados * duracionSabado);
      } else {
        // Fallback: Si el usuario aun no puso fecha inicio, usamos el cálculo simple temporalmente
        totalHoras = duracionSemana * Number(nroSesiones);
      }
    }

    form.setFieldsValue({
      duracionHoras: Number(totalHoras.toFixed(2)),
    });

  }, [
    horaInicio, 
    horaFin, 
    horaInicioSabado, 
    horaFinSabado, 
    nroSesiones, 
    fechaInicio, // Dependencia clave nueva
    diasClase,   // Dependencia clave nueva
    form, 
    mostrarProgramacion
  ]);

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
            // 🟢 CASO B: REGENERAR O NUEVO (CORREGIDO AQUI)
            
            const inputSync = Number(values.nroSesiones || 0); // Lo que el usuario ve como "Sesiones" (Sincrónicas)
            const inputAsync = Number(values.nroSesionesAsync || 0); // Asincrónicas

            let inputPres = 0;

            if (values.fechaInicio && moment(values.fechaInicio).isValid()) {
                payload.fechaInicio = moment(values.fechaInicio).format("YYYY-MM-DD");
            }

            // ⚠️ CORRECCIÓN CLAVE: Enviamos la SUMA TOTAL al backend en 'numeroSesiones'
            // El backend usa esto como Total. Si le mandas solo Sync, restará Async y te dará menos sesiones.
            payload.numeroSesiones = inputSync + inputAsync + inputPres; 
            
            payload.numeroSesionesAsincronicas = inputAsync;
            payload.numeroSesionesPresentacion = inputPres;

            payload.duracionHoras = Number(values.duracionHoras || 0);

            // DATOS SÍNCRONOS
            payload.diasClase = diasClase.join(",");
            payload.horaInicioSync = values.horaInicio ? moment(values.horaInicio).format("HH:mm:ss") : "00:00:00";
            payload.horaFinSync = values.horaFin ? moment(values.horaFin).format("HH:mm:ss") : "00:00:00";

            // DATOS SÁBADO (Si aplica)
            if (diasClase.includes("6")) {
                 payload.horaInicioSabado = values.horaInicioSabado ? moment(values.horaInicioSabado).format("HH:mm:ss") : "00:00:00";
                 payload.horaFinSabado = values.horaFinSabado ? moment(values.horaFinSabado).format("HH:mm:ss") : "00:00:00";
            }

            // DATOS ASÍNCRONOS
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