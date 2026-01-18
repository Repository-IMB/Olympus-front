import { Modal, Form, Row, Col, Input, Select, Button, Popconfirm, Collapse, Space, InputNumber } from "antd";
import { PlusOutlined, DeleteOutlined, UpOutlined, DownOutlined, EditOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import type { Producto, TipoEstadoProducto } from "../../interfaces/IProducto";

interface ModalProductoProps {
  visible: boolean;
  modo: "crear" | "editar";
  producto?: Producto | null;
  onCancel: () => void;
  onSave: (payload: Partial<Producto>) => void;
  departamentos: Array<{ id: number; nombre: string }>;
  tiposEstadoProducto: TipoEstadoProducto[];
}

export default function ModalProducto({
  visible,
  modo,
  producto,
  onCancel,
  onSave,
  departamentos = [],
  tiposEstadoProducto = [],
}: ModalProductoProps) {
  const [form] = Form.useForm();
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState<string[]>([]);
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [inputEstadistica, setInputEstadistica] = useState("");
  const [inputObjetivo, setInputObjetivo] = useState("");

  useEffect(() => {
    console.log("ModalProducto recibió departamentos:", departamentos);
  }, [departamentos]);

  useEffect(() => {
    console.log("ModalProducto recibió tiposEstadoProducto:", tiposEstadoProducto);
  }, [tiposEstadoProducto]);

  useEffect(() => {
    if (!visible) return;

    if (modo === "editar" && producto) {
      form.setFieldsValue({
        nombre: producto.nombre,
        codigoLanzamiento: producto.codigoLanzamiento,
        datosImportantes: producto.datosImportantes || "",
        costoBase: producto.costoBase,
        idDepartamento: producto.idDepartamento,
        modalidad: producto.modalidad,
        estadoProductoTipoId: producto.estadoProductoTipoId,
        frasePrograma: producto.frasePrograma || "",
        linkExcel: producto.linkExcel || "",
        linkPagWeb: producto.linkPagWeb || "",
        brochure: producto.brochure || "",
        horasAsincronicas: producto.horasAsincronicas || 0,
        horasSincronicas: producto.horasSincronicas || 0,
      });
      // Cargar estadísticas y objetivos desde producto si existen
      if (producto.estadisticas && Array.isArray(producto.estadisticas)) {
        setEstadisticas(producto.estadisticas.map(e => e.texto));
      }
      if (producto.objetivos && Array.isArray(producto.objetivos)) {
        setObjetivos(producto.objetivos.map(o => o.texto));
      }
    } else {
      form.resetFields();
      setEstadisticas([]);
      setObjetivos([]);
    }
  }, [visible, modo, producto, form]);

  const handleCancel = () => {
    form.resetFields();
    setErrorModal(null);
    setEstadisticas([]);
    setObjetivos([]);
    setInputEstadistica("");
    setInputObjetivo("");
    onCancel();
  };

  // Validador de URL
  const validarURL = (_: any, value: string) => {
    if (!value) return Promise.resolve();
    try {
      new URL(value);
      return Promise.resolve();
    } catch {
      return Promise.reject(new Error("Debe ser una URL válida"));
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const payload: Partial<Producto> = {
        ...(modo === "editar" && producto?.id ? { id: producto.id } : {}),
        nombre: values.nombre,
        codigoLanzamiento: values.codigoLanzamiento,
        datosImportantes: values.datosImportantes?.trim() || null,
        costoBase: values.costoBase,
        idDepartamento: values.idDepartamento,
        modalidad: values.modalidad,
        estadoProductoTipoId: values.estadoProductoTipoId,
        frasePrograma: values.frasePrograma?.trim() || null,
        linkExcel: values.linkExcel || "",
        linkPagWeb: values.linkPagWeb || "",
        brochure: values.brochure || "",
        horasAsincronicas: values.horasAsincronicas || 0,
        horasSincronicas: values.horasSincronicas || 0,
        // Incluir estadísticas y objetivos con índices como orden
        estadisticas: estadisticas.map((texto, idx) => ({
          texto,
          orden: idx + 1,
          estado: true,
          ...(modo === "editar" && producto?.id ? { id: undefined } : {}),
        })),
        objetivos: objetivos.map((texto, idx) => ({
          texto,
          orden: idx + 1,
          estado: true,
          ...(modo === "editar" && producto?.id ? { id: undefined } : {}),
        })),
      };

      await onSave(payload);
      handleCancel();
    } catch (error: any) {
      if (error?.errorFields) return;
      setErrorModal("Ocurrió un error al guardar el producto");
    }
  };

  const handleAgregarEstadistica = () => {
    if (inputEstadistica.trim()) {
      setEstadisticas([...estadisticas, inputEstadistica]);
      setInputEstadistica("");
    }
  };

  const handleEliminarEstadistica = (index: number) => {
    setEstadisticas(estadisticas.filter((_, i) => i !== index));
  };

  const handleMoverEstadisticaArriba = (index: number) => {
    if (index > 0) {
      const newEst = [...estadisticas];
      [newEst[index - 1], newEst[index]] = [newEst[index], newEst[index - 1]];
      setEstadisticas(newEst);
    }
  };

  const handleMoverEstadisticaAbajo = (index: number) => {
    if (index < estadisticas.length - 1) {
      const newEst = [...estadisticas];
      [newEst[index + 1], newEst[index]] = [newEst[index], newEst[index + 1]];
      setEstadisticas(newEst);
    }
  };

  const handleAgregarObjetivo = () => {
    if (inputObjetivo.trim()) {
      setObjetivos([...objetivos, inputObjetivo]);
      setInputObjetivo("");
    }
  };

  const handleEliminarObjetivo = (index: number) => {
    setObjetivos(objetivos.filter((_, i) => i !== index));
  };

  const handleMoverObjetivoArriba = (index: number) => {
    if (index > 0) {
      const newObj = [...objetivos];
      [newObj[index - 1], newObj[index]] = [newObj[index], newObj[index - 1]];
      setObjetivos(newObj);
    }
  };

  const handleMoverObjetivoAbajo = (index: number) => {
    if (index < objetivos.length - 1) {
      const newObj = [...objetivos];
      [newObj[index + 1], newObj[index]] = [newObj[index], newObj[index + 1]];
      setObjetivos(newObj);
    }
  };

  return (
    <Modal
      open={visible}
      title={modo === "editar" ? "Editar Producto" : "Crear nuevo producto"}
      onCancel={handleCancel}
      width={900}
      footer={[
        <div key="footer" style={{ textAlign: "center" }}>
          {errorModal && (
            <div style={{ color: "#ff4d4f", marginBottom: 8 }}>
              {errorModal}
            </div>
          )}
          <Popconfirm
            title={
              modo === "editar"
                ? "¿Guardar cambios?"
                : "¿Crear producto?"
            }
            onConfirm={handleSave}
          >
            <Button type="primary" style={{ width: "100%" }} icon={modo === "editar" ? <EditOutlined /> : <PlusOutlined />}>
              {modo === "editar" ? "Guardar cambios" : "Crear nuevo producto"}
            </Button>
          </Popconfirm>
        </div>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          {/* COLUMNA IZQUIERDA */}
          <Col span={12}>
            {/* Nombre y Código alineados */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Nombre"
                  name="nombre"
                  rules={[{ required: true, message: "Campo requerido" }]}
                >
                  <Input placeholder="Nombre del producto" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Código del producto"
                  name="codigoLanzamiento"
                  rules={[{ required: true, message: "Campo requerido" }]}
                >
                  <Input placeholder="Código" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Descripción"
              name="datosImportantes"
            >
              <Input.TextArea rows={3} placeholder="Descripción del producto" />
            </Form.Item>

            <Form.Item
              label="Costo base del producto"
              name="costoBase"
              rules={[{ required: true, message: "Campo requerido" }]}
            >
              <InputNumber min={0} precision={2} step={0.01} style={{ width: "100%" }} placeholder="0" />
            </Form.Item>

            <Form.Item
              label="Departamento"
              name="idDepartamento"
              rules={[{ required: true, message: "Campo requerido" }]}
            >
              <Select placeholder="Selecciona un departamento">
                {departamentos.map((d) => (
                  <Select.Option key={d.id} value={d.id}>
                    {d.nombre}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Modalidad"
              name="modalidad"
              rules={[{ required: true, message: "Campo requerido" }]}
            >
              <Input placeholder="Ej: Híbrido, Presencial, Online" />
            </Form.Item>

            <Form.Item
              label="Estado del producto"
              name="estadoProductoTipoId"
              rules={[{ required: true, message: "Campo requerido" }]}
            >
              <Select placeholder="Selecciona un estado">
                {tiposEstadoProducto.map((tipo) => (
                  <Select.Option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </Select.Option>
                ))}
                {/* Si estamos editando y el estadoProductoTipoNombre existe pero no está en la lista, agregar como opción */}
                {modo === "editar" && producto?.estadoProductoTipoNombre &&
                  !tiposEstadoProducto.some(t => t.id === producto.estadoProductoTipoId) && (
                    <Select.Option value={producto.estadoProductoTipoId}>
                      {producto.estadoProductoTipoNombre}
                    </Select.Option>
                  )}
              </Select>
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Link de brochure"
                  name="brochure"
                  rules={[
                    { required: true, message: "Campo requerido" },
                    { validator: validarURL }
                  ]}
                >
                  <Input placeholder="URL del brochure" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Link de Excel"
                  name="linkExcel"
                  rules={[
                    { required: true, message: "Campo requerido" },
                    { validator: validarURL }
                  ]}
                >
                  <Input placeholder="URL del archivo Excel" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Link de pag. web"
                  name="linkPagWeb"
                  rules={[
                    { required: true, message: "Campo requerido" },
                    { validator: validarURL }
                  ]}
                >
                  <Input placeholder="URL de la página web" />
                </Form.Item>
              </Col>
            </Row>
          </Col>

          {/* COLUMNA DERECHA */}
          <Col span={12}>
            <Form.Item
              label="Frase relacionada al programa"
              name="frasePrograma"
            >
              <Input.TextArea rows={3} placeholder="Frase o eslogan del programa" />
            </Form.Item>

            {/* ESTADÍSTICAS */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: "normal", marginBottom: 8, display: "block" }}>Estadísticas relacionadas</label>
              <Row gutter={8}>
                <Col span={20}>
                  <Input
                    value={inputEstadistica}
                    onChange={(e) => setInputEstadistica(e.target.value)}
                    placeholder="Escribe la estadística"
                    onPressEnter={handleAgregarEstadistica}
                  />
                </Col>
                <Col span={4}>
                  <Button
                    type="default"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={handleAgregarEstadistica}
                    style={{ border: "1px solid #000", backgroundColor: "#fff", width: "100%" }}
                  />
                </Col>
              </Row>
              <Collapse>
                <Collapse.Panel header="Estadísticas" key="1">
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {estadisticas.map((est, index) => (
                      <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                        <span style={{ flex: 1 }}>{index + 1}. {est}</span>
                        <Space size={4}>
                          <Button
                            type="text"
                            size="small"
                            icon={<UpOutlined />}
                            onClick={() => handleMoverEstadisticaArriba(index)}
                            disabled={index === 0}
                            style={{ border: "1px solid #000", color: "#000" }}
                          />
                          <Button
                            type="text"
                            size="small"
                            icon={<DownOutlined />}
                            onClick={() => handleMoverEstadisticaAbajo(index)}
                            disabled={index === estadisticas.length - 1}
                            style={{ border: "1px solid #000", color: "#000" }}
                          />
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleEliminarEstadistica(index)}
                            style={{ border: "1px solid #000", color: "#000" }}
                          />
                        </Space>
                      </div>
                    ))}
                    {estadisticas.length === 0 && (
                      <p style={{ color: "#999" }}>Sin estadísticas agregadas</p>
                    )}
                  </Space>
                </Collapse.Panel>
              </Collapse>
            </div>

            {/* OBJETIVOS */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: "normal", marginBottom: 8, display: "block" }}>Objetivos del taller</label>
              <Row gutter={8}>
                <Col span={20}>
                  <Input
                    value={inputObjetivo}
                    onChange={(e) => setInputObjetivo(e.target.value)}
                    placeholder="Escribe el objetivo"
                    onPressEnter={handleAgregarObjetivo}
                  />
                </Col>
                <Col span={4}>
                  <Button
                    type="default"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={handleAgregarObjetivo}
                    style={{ border: "1px solid #000", backgroundColor: "#fff", width: "100%" }}
                  />
                </Col>
              </Row>
              <Collapse>
                <Collapse.Panel header="Objetivos" key="1">
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {objetivos.map((obj, index) => (
                      <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                        <span style={{ flex: 1 }}>{index + 1}. {obj}</span>
                        <Space size={4}>
                          <Button
                            type="text"
                            size="small"
                            icon={<UpOutlined />}
                            onClick={() => handleMoverObjetivoArriba(index)}
                            disabled={index === 0}
                            style={{ border: "1px solid #000", color: "#000" }}
                          />
                          <Button
                            type="text"
                            size="small"
                            icon={<DownOutlined />}
                            onClick={() => handleMoverObjetivoAbajo(index)}
                            disabled={index === objetivos.length - 1}
                            style={{ border: "1px solid #000", color: "#000" }}
                          />
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleEliminarObjetivo(index)}
                            style={{ border: "1px solid #000", color: "#000" }}
                          />
                        </Space>
                      </div>
                    ))}
                    {objetivos.length === 0 && (
                      <p style={{ color: "#999" }}>Sin objetivos agregados</p>
                    )}
                  </Space>
                </Collapse.Panel>
              </Collapse>
            </div>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}