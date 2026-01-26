import { useState, useEffect } from "react";
import { Modal, Form, Select, Button, message } from "antd";
import api from "../../servicios/api";
import styles from "./ModalAsignarResponsable.module.css";

const { Option } = Select;

interface ModalAsignarResponsableProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit?: () => void;
  activo: {
    nombre: string;
    ip: string;
    ubicacionSede: string;
    estacion: number;
  } | null;
}

export default function ModalAsignarResponsable({
  visible,
  onCancel,
  onSubmit,
  activo,
}: ModalAsignarResponsableProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sedes, setSedes] = useState<string[]>([]);
  const [personal, setPersonal] = useState<any[]>([]);
  const [loadingSedes, setLoadingSedes] = useState(false);
  const [loadingPersonal, setLoadingPersonal] = useState(false);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      cargarSedes();
      setPersonal([]);
    }
  }, [visible, form]);

  const cargarSedes = async () => {
    try {
      setLoadingSedes(true);
      // TODO: Reemplazar con llamada real a la API
      // const res = await api.get("/api/Activos/ObtenerSedes");
      // setSedes(res.data);
      
      // Datos de ejemplo
      setSedes(["Perú", "Bolivia", "Argentina", "Colombia", "Chile", "Ecuador"]);
    } catch (e) {
      console.error("Error cargando sedes", e);
      setSedes([]);
    } finally {
      setLoadingSedes(false);
    }
  };

  const cargarPersonal = async (sede: string) => {
    try {
      setLoadingPersonal(true);
      // TODO: Reemplazar con llamada real a la API
      // const res = await api.get(`/api/Activos/ObtenerPersonalPorSede/${sede}`);
      // setPersonal(res.data);
      
      // Datos de ejemplo
      const personalEjemplo = [
        { id: 1, nombre: "Jose Rafael Corzo Luis", correo: "rafael@example.com" },
        { id: 2, nombre: "María González", correo: "maria@example.com" },
        { id: 3, nombre: "Carlos Pérez", correo: "carlos@example.com" },
      ];
      setPersonal(personalEjemplo);
    } catch (e) {
      console.error("Error cargando personal", e);
      setPersonal([]);
    } finally {
      setLoadingPersonal(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // TODO: Reemplazar con llamada real a la API
      // await api.post("/api/Activos/AsignarResponsable", {
      //   idActivo: activo?.idActivo,
      //   idSede: values.sede,
      //   idPersonal: values.personal,
      // });

      console.log("Valores del formulario:", values);
      message.success("Responsable asignado exitosamente");
      form.resetFields();
      onCancel();
      if (onSubmit) onSubmit();
    } catch (error: any) {
      if (error?.errorFields) {
        // Errores de validación del formulario
        return;
      }
      message.error(
        error?.response?.data?.mensaje || "Error al asignar el responsable"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      open={visible}
      title="Asignación"
      onCancel={handleCancel}
      footer={null}
      width={500}
      className={styles.modal}
    >
      <Form form={form} layout="vertical" className={styles.form}>
        <Form.Item
          label="Sede"
          name="sede"
          rules={[{ required: true, message: "Seleccione la sede" }]}
        >
          <Select
            placeholder="Selecciona la sede"
            showSearch
            optionFilterProp="children"
            loading={loadingSedes}
            onChange={(value) => {
              form.setFieldsValue({ personal: undefined });
              if (value) {
                cargarPersonal(value);
              } else {
                setPersonal([]);
              }
            }}
          >
            {sedes.map((sede) => (
              <Option key={sede} value={sede}>
                {sede}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Personal responsable del activo"
          name="personal"
          rules={[
            {
              required: true,
              message: "Seleccione un personal",
            },
          ]}
        >
          <Select
            placeholder="Selecciona un personal"
            showSearch
            optionFilterProp="children"
            loading={loadingPersonal}
            disabled={!form.getFieldValue("sede")}
          >
            {personal.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.nombre}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {activo && (
          <div className={styles.previewSection}>
            <label className={styles.previewLabel}>
              Vista previa del activo
            </label>
            <div className={styles.previewBox}>
              <div className={styles.previewItem}>{activo.nombre}</div>
              <div className={styles.previewItem}>{activo.ip}</div>
              <div className={styles.previewItem}>
                {activo.ubicacionSede} - Estación {activo.estacion}
              </div>
            </div>
          </div>
        )}

        <div className={styles.submitContainer}>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            className={styles.submitButton}
            block
          >
            Confirmar asignacion
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
