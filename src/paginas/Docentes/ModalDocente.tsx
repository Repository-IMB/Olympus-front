import {
  Modal,
  Form,
  Input,
  Button,
  Row,
  Col,
  Popconfirm,
  Select,
  Spin,
} from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { useEffect } from "react";

interface ModalDocenteProps {
  open: boolean;
  modo: "crear" | "editar";
  docenteCompleto?: any | null;
  form: any;
  paises: any[];
  loadingPaises: boolean;
  paisSeleccionado: any | null;
  indicativo: string;
  onPaisChange: (value: string) => void;
  filterPais: (input: string, option: any) => boolean;
  onCancel: () => void;
  onSave: () => void;
  errorModal?: string | null;
}

export default function ModalDocente({
  open,
  modo,
  docenteCompleto,
  form,
  paises,
  loadingPaises,
  paisSeleccionado,
  indicativo,
  onPaisChange,
  filterPais,
  onCancel,
  onSave,
  errorModal,
}: ModalDocenteProps) {
  const esEdicion = modo === "editar";

  useEffect(() => {
    if (!open) return;

    // En modo crear, resetear el formulario
    // En modo edición, cargar los datos del docente completo
    if (!esEdicion) {
      form.resetFields();
    } else if (esEdicion && docenteCompleto && paises.length > 0) {
      // Buscar el país en la lista
      const pais = paises.find((p: any) => p.id === docenteCompleto.idPais);

      form.setFieldsValue({
        nombres: docenteCompleto.nombres,
        apellidos: docenteCompleto.apellidos,
        pais: pais?.nombre || "",
        telefono: docenteCompleto.celular,
        prefijo: docenteCompleto.prefijoDocente || "",
        tituloProfesional: docenteCompleto.tituloProfesional,
        especialidad: docenteCompleto.especialidad,
        logros: docenteCompleto.logros,
        correo: docenteCompleto.correo,
        areaTrabajo: docenteCompleto.areaTrabajo,
        industria: docenteCompleto.industria,
      });
    }
  }, [open, esEdicion, docenteCompleto, paises, form]);

  return (
    <Modal
      open={open}
      title={esEdicion ? "Editar Docente" : "Crear Nuevo Docente"}
      onCancel={onCancel}
      width={800}
      style={{ margin: "auto" }}
      footer={[
        <div key="footer" style={{ width: "100%" }}>
          {errorModal && (
            <div
              style={{
                color: "#ff4d4f",
                marginBottom: 12,
                textAlign: "left",
              }}
            >
              {errorModal}
            </div>
          )}

          <Popconfirm
            title={
              esEdicion
                ? "¿Está seguro de guardar los cambios?"
                : "¿Está seguro de crear este docente?"
            }
            okText="Sí"
            cancelText="No"
            onConfirm={onSave}
          >
            <Button type="primary" style={{ width: "100%" }} icon={esEdicion ? <EditOutlined /> : <PlusOutlined />}>
              {esEdicion ? "Guardar Cambios" : "Crear Nuevo Docente"}
            </Button>
          </Popconfirm>
        </div>,
      ]}
    >
      <Form form={form} layout="vertical">
        {/* FILA 1 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Nombres"
              name="nombres"
              rules={[{ required: true, message: "Debe ingresar un nombre" }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Apellidos"
              name="apellidos"
              rules={[{ required: true, message: "Debe ingresar un apellido" }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        {/* FILA 2 */}
        <Row gutter={16}>
          <Col span={10}>
            <Form.Item
              label="País"
              name="pais"
              rules={[{ required: true, message: "Seleccione un país" }]}
            >
              <Select
                showSearch
                placeholder="Seleccionar país"
                onSelect={onPaisChange}
                loading={loadingPaises}
                disabled={loadingPaises}
                virtual={false}
                autoClearSearchValue={false}
                dropdownMatchSelectWidth={false}
                dropdownStyle={{ maxHeight: 260, overflow: "auto" }}
                filterOption={filterPais}
                notFoundContent={
                  loadingPaises ? (
                    <Spin size="small" />
                  ) : (
                    "No hay países disponibles"
                  )
                }
              >
                {paises.map((pais) => (
                  <Select.Option key={pais.id} value={pais.nombre}>
                    {pais.nombre}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={4}>
            <Form.Item label="Ind.">
              <Input value={indicativo} disabled style={{ textAlign: "center" }} />
            </Form.Item>
          </Col>

          <Col span={10}>
            <Form.Item
              label="Teléfono"
              name="telefono"
              rules={[
                { required: true, message: "El teléfono es requerido" },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();

                    if (!/^\d+$/.test(value)) {
                      return Promise.reject(
                        "El teléfono debe contener solo números"
                      );
                    }

                    if (paisSeleccionado) {
                      const { digitoMinimo, digitoMaximo } = paisSeleccionado;
                      if (
                        value.length < digitoMinimo ||
                        value.length > digitoMaximo
                      ) {
                        return Promise.reject(
                          `Debe tener entre ${digitoMinimo} y ${digitoMaximo} dígitos`
                        );
                      }
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input
                inputMode="numeric"
                placeholder={
                  paisSeleccionado
                    ? `${paisSeleccionado.digitoMinimo}-${paisSeleccionado.digitoMaximo} dígitos`
                    : ""
                }
                onChange={(e) => {
                  const soloNumeros = e.target.value.replace(/\D/g, "");
                  const max = paisSeleccionado?.digitoMaximo;
                  const valorFinal = max
                    ? soloNumeros.slice(0, max)
                    : soloNumeros;

                  form.setFieldValue("telefono", valorFinal);
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* FILA 3 */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Prefijo"
              name="prefijo"
              rules={[{ required: true, message: "Debe ingresar un prefijo" }]}
            >
              <Input placeholder="Ing, Mag, Dr, etc." />
            </Form.Item>
          </Col>

          <Col span={16}>
            <Form.Item
              label="Título Profesional"
              name="tituloProfesional"
              rules={[{ required: true, message: "Debe ingresar un título profesional" }]}
            >
              <Input placeholder="Ej: Ing. de Sistemas, Lic. en Administración" />
            </Form.Item>
          </Col>
        </Row>

        {/* FILA 4 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Especialidad"
              name="especialidad"
              rules={[{ required: true, message: "Debe ingresar una especialidad" }]}
            >
              <Input placeholder="Ej: Machine Learning, Gestión Empresarial" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Logros"
              name="logros"
              rules={[{ required: true, message: "Debe ingresar los logros" }]}
            >
              <Input placeholder="Ej: 15 años de experiencia industrial" />
            </Form.Item>
          </Col>
        </Row>

        {/* FILA 5 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Correo"
              name="correo"
              rules={[
                { required: true },
                { type: "email", message: "Correo inválido" },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Área de trabajo"
              name="areaTrabajo"
              rules={[
                { required: true, message: "Debe ingresar un área de trabajo" },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Industria"
              name="industria"
              rules={[
                { required: true, message: "Debe ingresar una industria" },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
