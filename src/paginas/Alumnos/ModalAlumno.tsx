import {
  Modal,
  Form,
  Input,
  Button,
  Row,
  Col,
  Checkbox,
  Select,
  Popconfirm,
  Spin
} from "antd";
import { useEffect, useState } from "react";
import { obtenerPaises, type Pais } from "../../config/rutasApi";
import estilos from "./Alumnos.module.css";
import { PlusOutlined, EditOutlined } from '@ant-design/icons';

interface ModalAlumnoProps {
  open: boolean;
  onCancel: () => void;
  onSave: (alumno: any) => void;
  alumno?: any;
  modo?: 'crear' | 'editar';
}

export default function ModalAlumno({
  open,
  onCancel,
  onSave,
  alumno,
  modo = 'crear'
}: ModalAlumnoProps) {
  const [form] = Form.useForm();
  const [paises, setPaises] = useState<Pais[]>([]);
  const [loadingPaises, setLoadingPaises] = useState(true);
  const [paisSeleccionado, setPaisSeleccionado] = useState<Pais | null>(null);
  const [indicativo, setIndicativo] = useState("");

  const esEdicion = modo === 'editar';

  useEffect(() => {
    const cargarPaises = async () => {
      setLoadingPaises(true);
      const data = await obtenerPaises();
      const activos = data.filter(p => p.estado);
      setPaises(activos);

      if (esEdicion && alumno) {
        const paisAlumno = activos.find(p => p.nombre === alumno.pais);
        if (paisAlumno) {
          setPaisSeleccionado(paisAlumno);
          setIndicativo(`+${paisAlumno.prefijoCelularPais}`);
        }
        
        form.setFieldsValue({
          nombre: alumno.nombre,
          apellido: alumno.apellido,
          pais: alumno.pais,
          ind: alumno.ind || `+${paisAlumno?.prefijoCelularPais}`,
          telefono: alumno.telefono,
          prefijo: alumno.prefijo,
          correo: alumno.correo,
          documento: alumno.documento,
          areaTrabajo: alumno.areaTrabajo,
          industria: alumno.industria,
          cargo: alumno.cargo,
          codigoCurso: alumno.codigoCurso,
          pagoRegistrado: alumno.pagoRegistrado,
          formularioRegistrado: alumno.formularioRegistrado,
        });
      } else {
        const peru = activos.find(p => p.nombre === "Perú");
        if (peru) {
          setPaisSeleccionado(peru);
          setIndicativo(`+${peru.prefijoCelularPais}`);
          form.setFieldsValue({
            pais: peru.nombre,
            ind: `+${peru.prefijoCelularPais}`,
          });
        }
      }

      setLoadingPaises(false);
    };

    if (open) cargarPaises();
  }, [open, form, alumno, esEdicion]);

  const handleGuardar = async () => {
    const values = await form.validateFields();
    onSave(values);
    form.resetFields();
  };

  const handleCancelar = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      open={open}
      title={esEdicion ? "Editar alumno" : "Crear nuevo alumno"}
      onCancel={handleCancelar}
      width={900}
      footer={[
        <Popconfirm
          key="guardar"
          title={esEdicion ? "¿Guardar cambios?" : "¿Crear nuevo alumno?"}
          onConfirm={handleGuardar}
        >
          <Button 
            type="primary" 
            className={`${estilos.btnNuevo} ${estilos.modalBtnFull}`}
            icon={esEdicion ? <EditOutlined /> : <PlusOutlined />}
          >
            {esEdicion ? "Guardar cambios" : "Crear alumno"}
          </Button>
        </Popconfirm>,
      ]}
    >
      <Form form={form} layout="vertical">
        {/* 1er renglón: Nombre y Apellido */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="nombre" label="Nombres" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="apellido" label="Apellidos" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>

        {/* 2do renglón: País, Ind., Teléfono */}
        <Row gutter={16}>
          <Col span={10}>
            <Form.Item name="pais" label="País" rules={[{ required: true }]}>
              <Select
                loading={loadingPaises}
                onChange={(nombre) => {
                  const p = paises.find(x => x.nombre === nombre);
                  if (p) {
                    setPaisSeleccionado(p);
                    setIndicativo(`+${p.prefijoCelularPais}`);
                  }
                }}
                notFoundContent={loadingPaises ? <Spin size="small" /> : null}
              >
                {paises.map(p => (
                  <Select.Option key={p.id} value={p.nombre}>
                    {p.nombre}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={4}>
            <Form.Item label="Ind.">
              <Input value={indicativo} disabled />
            </Form.Item>
          </Col>

          <Col span={10}>
            <Form.Item name="telefono" label="Teléfono" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>

        {/* 3er renglón: Prefijo, Correo, Documento de Identidad */}
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="prefijo" label="Prefijo">
              <Input placeholder="Ing., Mag., Dr., etc" />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item 
              name="correo" 
              label="Correo" 
              rules={[
                { required: true, message: 'Por favor ingrese un correo' },
                { type: "email", message: 'Por favor ingrese un correo válido' }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item 
              name="documento" 
              label="Documento de identidad"
              rules={[
                { required: true, message: 'Por favor ingrese el documento' },
                { pattern: /^\d+$/, message: 'Solo se permiten números' }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        {/* 4to renglón: Área de trabajo, Industria, Cargo */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="areaTrabajo" 
            label="Área de trabajo"
            rules={[
                { required: true, message: 'Por favor ingrese un área de trabajo' }
              ]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="industria" 
            label="Industria"
            rules={[
                { required: true, message: 'Por favor ingrese una industria' }
              ]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="cargo" 
            label="Cargo"
            rules={[
                { required: true, message: 'Por favor ingrese el cargo' }
              ]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>

        {/* 5to renglón: Código del curso */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item 
              name="codigoCurso" 
              label="Código del curso"
              rules={[{ required: true, message: 'Por favor ingrese el código del curso' }]}
            >
              <Input/>
            </Form.Item>
          </Col>
        </Row>

        {/* 6to renglón: Checkbox pago registrado */}
        <Form.Item name="pagoRegistrado" valuePropName="checked">
          <Checkbox>Se registró su pago</Checkbox>
        </Form.Item>

        {/* 7mo renglón: Checkbox formulario registrado */}
        <Form.Item name="formularioRegistrado" valuePropName="checked">
          <Checkbox>Se registró su formulario</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}