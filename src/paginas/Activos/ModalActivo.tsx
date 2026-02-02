import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Button,
  message,
  Spin,
} from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import api from "../../servicios/api";
import styles from "./ModalActivo.module.css";
import { jwtDecode } from "jwt-decode";
import { getCookie } from "../../utils/cookies";

const { Option } = Select;

/* =========================
   TYPES
========================= */

interface ModalActivoProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit?: () => void;
  activo?: ActivoEditar;
}

interface ActivoEditar {
  idActivo: number;
  nombre: string;
  idTipoActivo: number;
  idFabricante: number;
  idPais: number;
  ip?: string | null;
  numeroSerie?: string | null;
  imei?: string | null;
  modelo?: string | null;
  estado: string; // 👈 IMPORTANTE
}

interface ComboItem {
  id: number;
  nombre: string;
}

interface Pais {
  id: number;
  nombre: string;
}

export default function ModalActivo({
  visible,
  onCancel,
  onSubmit,
  activo,
}: ModalActivoProps) {
  const [form] = Form.useForm();
  const esEdicion = !!activo;

  const [loading, setLoading] = useState(false);
  const [loadingCombos, setLoadingCombos] = useState(false);

  const [tipos, setTipos] = useState<ComboItem[]>([]);
  const [fabricantes, setFabricantes] = useState<ComboItem[]>([]);
  const [paises, setPaises] = useState<Pais[]>([]);

  const token = getCookie("token");

  const getUserIdFromToken = () => {
    if (!token) return 0;
    try {
      const decoded: any = jwtDecode(token);
      return Number(
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ] ?? 0
      );
    } catch {
      return 0;
    }
  };

  const selectProps = {
    showSearch: true as const,
    optionFilterProp: "children" as const,
    virtual: false,
    listHeight: 260,
    dropdownStyle: { maxHeight: 260, overflow: "auto", zIndex: 2000 },
  };

  /* =========================
     LOAD COMBOS + DATA
  ========================= */

  useEffect(() => {
    if (!visible) return;

    const cargarCombos = async () => {
      try {
        setLoadingCombos(true);

        const [tiposRes, fabRes, paisRes] = await Promise.all([
          api.get("/api/VTAModActivos/tipos"),
          api.get("/api/VTAModActivos/fabricantes"),
          api.get("/api/VTAModVentaPais/ObtenerTodas"),
        ]);

        setTipos(tiposRes.data?.lista ?? []);
        setFabricantes(fabRes.data?.lista ?? []);
        setPaises(paisRes.data?.pais ?? []);

        if (activo) {
          // 👇 precargar TODO, incluido estado
          form.setFieldsValue({
            ...activo,
            estado: activo.estado,
          });
        } else {
          form.resetFields();
          form.setFieldsValue({ estado: "A" }); // 👈 default al crear
        }
      } catch {
        message.error("Error al cargar los combos");
      } finally {
        setLoadingCombos(false);
      }
    };

    cargarCombos();
  }, [visible, activo, form]);

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (esEdicion) {
        await api.put("/api/VTAModActivos/Actualizar", {
          ...values,
          idActivo: activo!.idActivo,
          estado: values.estado, // 👈 CLAVE
          usuarioModificacion: getUserIdFromToken(),
        });

        message.success("Activo actualizado correctamente");
      } else {
        await api.post("/api/VTAModActivos/Crear", {
          ...values,
          estado: "A",
          usuarioCreacion: getUserIdFromToken(),
        });

        message.success("Activo creado correctamente");
      }

      form.resetFields();
      onCancel();
      onSubmit?.();
    } catch (error: any) {
      if (error?.errorFields) return;

      message.error(
        error?.response?.data?.mensaje || "Error al guardar el activo"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={visible}
      title={esEdicion ? "Editar activo" : "Crear nuevo activo"}
      onCancel={onCancel}
      footer={null}
      width={600}
      className={styles.modal}
      destroyOnClose
    >
      {loadingCombos ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Form form={form} layout="vertical" className={styles.form}>
          {/* 👇 CAMPO OCULTO PERO OBLIGATORIO */}
          <Form.Item name="estado" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Tipo de activo"
            name="idTipoActivo"
            rules={[{ required: true }]}
          >
            <Select {...selectProps}>
              {tipos.map((t) => (
                <Option key={t.id} value={t.id}>
                  {t.nombre}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Nombre" name="nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="IP" name="ip">
            <Input />
          </Form.Item>

          <Form.Item label="Número de serie" name="numeroSerie">
            <Input />
          </Form.Item>

          <Form.Item label="IMEI" name="imei">
            <Input maxLength={15} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Fabricante"
                name="idFabricante"
                rules={[{ required: true }]}
              >
                <Select {...selectProps}>
                  {fabricantes.map((f) => (
                    <Option key={f.id} value={f.id}>
                      {f.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Modelo"
                name="modelo"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Sede"
            name="idPais"
            rules={[{ required: true }]}
          >
            <Select {...selectProps}>
              {paises.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.nombre}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Button
            type="primary"
            icon={esEdicion ? <EditOutlined /> : <PlusOutlined />}
            loading={loading}
            onClick={handleSubmit}
            block
          >
            {esEdicion ? "Guardar cambios" : "Agregar activo"}
          </Button>
        </Form>
      )}
    </Modal>
  );
}
