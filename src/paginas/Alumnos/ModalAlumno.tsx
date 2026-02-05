import {
  Modal,
  Form,
  Input,
  Button,
  Row,
  Col,
  Select,
  Popconfirm,
  Spin,
  Space,
  List
} from "antd";
import { useEffect, useState } from "react";
import { obtenerPaises, type Pais } from "../../config/rutasApi";
import estilos from "./Alumnos.module.css";
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface ModalAlumnoProps {
  open: boolean;
  onCancel: () => void;
  onSave: (alumno: any) => void;
  alumno?: any;
  modo?: 'crear' | 'editar';
  productos?: { id: number; nombre: string }[];
}

export default function ModalAlumno({
  open,
  onCancel,
  onSave,
  alumno,
  modo = 'crear',
  productos = []
}: ModalAlumnoProps) {
  const [form] = Form.useForm();
  const [paises, setPaises] = useState<Pais[]>([]);
  const [loadingPaises, setLoadingPaises] = useState(true);
  const [paisSeleccionado, setPaisSeleccionado] = useState<Pais | null>(null);
  const [indicativo, setIndicativo] = useState("");

  // State for multiple products
  const [productosSeleccionados, setProductosSeleccionados] = useState<{ id: number; nombre: string }[]>([]);
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState<number | null>(null);

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
        });

        // Initialize selected products
        if (alumno.productos && alumno.idProducto) {
          const prods = alumno.idProducto.map((id: number, index: number) => ({
            id: id,
            nombre: alumno.productos[index] || "Desconocido"
          }));
          // Also try to match with available products to get correct names if possible
          const enrichedProds = prods.map((p: any) => {
            const found = productos.find(prod => prod.id === p.id);
            return found ? found : p;
          });
          setProductosSeleccionados(enrichedProds);
        } else if (alumno.codigoCurso) {
          // Fallback for legitimate legacy single product or if mapping was different
          const found = productos.find(p => p.id === alumno.codigoCurso);
          if (found) {
            setProductosSeleccionados([found]);
          }
        }

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
        setProductosSeleccionados([]);
      }

      setLoadingPaises(false);
    };

    if (open) cargarPaises();
  }, [open, form, alumno, esEdicion]);

  const handleGuardar = async () => {
    const values = await form.validateFields();

    // Add selected products IDs to values
    const payload = {
      ...values,
      productosIds: productosSeleccionados.map(p => p.id)
    };

    if (productosSeleccionados.length === 0) {
      // You might want to show an error if at least one product is required
      // But for now let's proceed, or you can use form validation for a hidden field
      return;
    }

    onSave(payload);
    form.resetFields();
    setProductosSeleccionados([]);
    setProductoSeleccionadoId(null);
  };

  const handleCancelar = () => {
    form.resetFields();
    setProductosSeleccionados([]);
    setProductoSeleccionadoId(null);
    onCancel();
  };

  const handleAgregarProducto = () => {
    if (productoSeleccionadoId) {
      const existe = productosSeleccionados.some(p => p.id === productoSeleccionadoId);
      if (!existe) {
        const prod = productos.find(p => p.id === productoSeleccionadoId);
        if (prod) {
          setProductosSeleccionados([...productosSeleccionados, prod]);
        }
      }
      setProductoSeleccionadoId(null);
    }
  };

  const handleEliminarProducto = (id: number) => {
    setProductosSeleccionados(productosSeleccionados.filter(p => p.id !== id));
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
            <Form.Item label="Curso / Producto" required>
              <div style={{ marginBottom: 16 }}>
                <Row gutter={8}>
                  <Col span={20}>
                    <Select
                      placeholder="Seleccione un curso"
                      value={productoSeleccionadoId}
                      onChange={(val) => setProductoSeleccionadoId(val)}
                    >
                      {productos.map((prod) => (
                        <Select.Option key={prod.id} value={prod.id}>
                          {prod.nombre}
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={4}>
                    <Button
                      type="default"
                      icon={<PlusOutlined />}
                      onClick={handleAgregarProducto}
                      disabled={!productoSeleccionadoId}
                      style={{ width: "100%" }}
                    />
                  </Col>
                </Row>

                {productosSeleccionados.length > 0 && (
                  <div style={{ marginTop: 10, border: '1px solid #f0f0f0', borderRadius: 4, padding: 8 }}>
                    <List
                      size="small"
                      dataSource={productosSeleccionados}
                      renderItem={item => (
                        <List.Item
                          actions={[
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleEliminarProducto(item.id)}
                            />
                          ]}
                        >
                          {item.nombre}
                        </List.Item>
                      )}
                    />
                  </div>
                )}
                {productosSeleccionados.length === 0 && (
                  <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: 5 }}>
                    Debe seleccionar al menos un producto
                  </div>
                )}
              </div>
            </Form.Item>
          </Col>
        </Row>

        {/* 6to renglón: Checkbox pago registrado */}
        {/* <Form.Item name="pagoRegistrado" valuePropName="checked">
          <Checkbox>Se registró su pago</Checkbox>
        </Form.Item> */}

        {/* 7mo renglón: Checkbox formulario registrado */}
        {/* <Form.Item name="formularioRegistrado" valuePropName="checked">
          <Checkbox>Se registró su formulario</Checkbox>
        </Form.Item> */}
      </Form>
    </Modal>
  );
}