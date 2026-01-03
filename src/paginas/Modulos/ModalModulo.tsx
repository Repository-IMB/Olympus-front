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
  message
} from "antd";
import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
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

const DIAS_COMPLETOS = [
  { key: "1", label: "Lunes" },
  { key: "2", label: "Martes" },
  { key: "3", label: "Miércoles" },
  { key: "4", label: "Jueves" },
  { key: "5", label: "Viernes" },
  { key: "6", label: "Sábado" },
  { key: "7", label: "Domingo" },
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
          ? dayjs(moduloEditar.fechaPresentacion) 
          : null,
        horaInicio: primeraHoraInicio 
          ? dayjs(primeraHoraInicio, "HH:mm:ss") 
          : null,
        horaFin: primeraHoraFin 
          ? dayjs(primeraHoraFin, "HH:mm:ss") 
          : null,
        horaInicioSabado: horaInicioSabado 
          ? dayjs(horaInicioSabado, "HH:mm:ss") 
          : null,
        horaFinSabado: horaFinSabado 
          ? dayjs(horaFinSabado, "HH:mm:ss") 
          : null,
        nroSesiones: totalSesionesSincronicas,
        duracionHoras: moduloEditar.duracionHoras || 0,
        nroSesionesAsync: totalSesionesAsincronicas,
        diaAsync: horarioAsync && horarioAsync.diaSemana > 0 
          ? String(horarioAsync.diaSemana) 
          : undefined,
        horaInicioAsync: horarioAsync?.horaInicio 
          ? dayjs(horarioAsync.horaInicio, "HH:mm:ss") 
          : null,
        horaFinAsync: horarioAsync?.horaFin 
          ? dayjs(horarioAsync.horaFin, "HH:mm:ss") 
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
    if (diasClase.length === 0) {
      message.error("Seleccione al menos un día de clase");
      return;
    }

    form
      .validateFields()
      .then((values) => {
        const payload: any = {
          nombre: values.nombre,
          codigo: values.codigo || "",
          descripcion: values.descripcion || "",
          duracionHoras: Number(values.duracionHoras) || 0,
          tituloCertificado: values.tituloCertificado || "",
          numeroSesiones: Number(values.nroSesiones) || 0,
          numeroSesionesAsincronicas: Number(values.nroSesionesAsync) || 0,
          diasClase: diasClase.join(","),
          estado: true,
          preserveSessions: false,
        };

        // Fecha de presentación - IMPORTANTE: enviar string vacío si no hay fecha
        if (values.fechaPresentacion) {
          payload.fechaPresentacion = dayjs(values.fechaPresentacion).format("YYYY-MM-DD");
        } else {
          payload.fechaPresentacion = ""; // ⬅️ String vacío en lugar de omitir
        }

        // Horarios síncronos - REQUERIDOS
        if (values.horaInicio && values.horaFin) {
          payload.horaInicioSync = dayjs(values.horaInicio).format("HH:mm:ss");
          payload.horaFinSync = dayjs(values.horaFin).format("HH:mm:ss");
        } else {
          message.error("Debe seleccionar hora de inicio y fin");
          return;
        }

        // Horarios asincrónicos
        if (Number(values.nroSesionesAsync) > 0) {
          // Validar campos requeridos
          if (!values.diaAsync) {
            message.error("Debe seleccionar el día de la clase asincrónica");
            return;
          }
          
          // IMPORTANTE: Usar "DiasAsync" en lugar de "diaAsync"
          payload.diasAsync = String(values.diaAsync); // ⬅️ Puede ser que el backend espere "diasAsync" como string
          payload.horaInicioAsync = values.horaInicioAsync 
            ? dayjs(values.horaInicioAsync).format("HH:mm:ss")
            : "00:00:00";
          
          payload.horaFinAsync = values.horaFinAsync 
            ? dayjs(values.horaFinAsync).format("HH:mm:ss")
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
            (form.getFieldValue("nroSesionesAsync") || 0) > 0 && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Día clase asincrónica"
                    name="diaAsync"
                    rules={[{ required: true, message: "Seleccione día" }]}
                  >
                    <Select placeholder="Seleccione día">
                      {DIAS_COMPLETOS.map((d) => (
                        <Select.Option key={d.key} value={d.key}>
                          {d.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Hora inicio asincrónica"
                    name="horaInicioAsync"
                  >
                    <TimePicker style={{ width: "100%" }} format="HH:mm" />
                  </Form.Item>
                </Col>
              </Row>
            )
          }
        </Form.Item>

        <Form.Item shouldUpdate>
          {() =>
            (form.getFieldValue("nroSesionesAsync") || 0) > 0 && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Hora fin asincrónica"
                    name="horaFinAsync"
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