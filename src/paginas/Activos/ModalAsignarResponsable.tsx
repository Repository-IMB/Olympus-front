import { useState, useEffect } from "react";
import { Modal, Form, Select, Button, message, Spin } from "antd";
import api from "../../servicios/api";
import styles from "./ModalAsignarResponsable.module.css";
import { getCookie } from "../../utils/cookies";
import { jwtDecode } from "jwt-decode";

const { Option } = Select;

/* =========================
   TYPES
========================= */

interface ModalAsignarResponsableProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit?: () => void;
  activo: {
    idActivo: number;
    nombre: string;
    ip?: string | null;
    ubicacionSede: string;
    estacion: number;
  } | null;
}

interface Pais {
  id: number;
  nombre: string;
}

interface Personal {
  id: number;
  nombre: string;
}

/* =========================
   COMPONENT
========================= */

export default function ModalAsignarResponsable({
  visible,
  onCancel,
  onSubmit,
  activo,
}: ModalAsignarResponsableProps) {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [loadingPaises, setLoadingPaises] = useState(false);
  const [loadingPersonal, setLoadingPersonal] = useState(false);

  const [paises, setPaises] = useState<Pais[]>([]);
  const [personal, setPersonal] = useState<Personal[]>([]);

  /* =========================
     USER FROM TOKEN
  ========================= */

  const token = getCookie("token");

  const getUserIdFromToken = (): number => {
    if (!token) return 0;
    try {
      const decoded: any = jwtDecode(token);
      return Number(
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ]
      );
    } catch {
      return 0;
    }
  };

  /* =========================
     SELECT SCROLL FIX
  ========================= */

  const selectProps = {
    showSearch: true as const,
    optionFilterProp: "children" as const,
    virtual: false, // 👈 CLAVE PARA EL SCROLL
    listHeight: 260,
    dropdownStyle: {
      maxHeight: 260,
      overflow: "auto",
      zIndex: 2000,
    },
  };

  /* =========================
     LOAD ON OPEN
  ========================= */

  useEffect(() => {
    if (!visible) return;

    form.resetFields();
    setPersonal([]);
    cargarPaises();
  }, [visible]);

  /* =========================
     LOAD PAÍSES
  ========================= */

  const cargarPaises = async () => {
    try {
      setLoadingPaises(true);

      const res = await api.get(
        "/api/VTAModVentaPais/ObtenerTodas"
      );

      setPaises(res.data?.pais ?? []);
    } catch {
      message.error("Error al cargar países");
      setPaises([]);
    } finally {
      setLoadingPaises(false);
    }
  };

  /* =========================
     LOAD PERSONAL POR PAÍS
  ========================= */

  const cargarPersonalPorPais = async (idPais: number) => {
    try {
      setLoadingPersonal(true);

      const res = await api.get(
        `/api/VTAModActivos/ObtenerPersonalPorPais/${idPais}`
      );

      setPersonal(res.data?.lista ?? []);
    } catch {
      message.error("Error al cargar personal");
      setPersonal([]);
    } finally {
      setLoadingPersonal(false);
    }
  };

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await api.post("/api/VTAModActivos/AsignarResponsable", {
        idActivo: activo?.idActivo,
        idPersonal: values.idPersonal,
        usuarioCambio: getUserIdFromToken(),
      });

      message.success("Responsable asignado correctamente");
      form.resetFields();
      onCancel();
      onSubmit?.();
    } catch (error: any) {
      if (error?.errorFields) return;

      message.error(
        error?.response?.data?.mensaje ||
          "Error al asignar responsable"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <Modal
      open={visible}
      title="Asignar responsable"
      onCancel={onCancel}
      footer={null}
      width={520}
      className={styles.modal}
      destroyOnClose
      style={{ top: 20 }}
    >
      <Form form={form} layout="vertical" className={styles.form}>
        {/* ===================== */}
        {/* PAÍS */}
        {/* ===================== */}
        <Form.Item
          label="País / Sede"
          name="idPais"
          rules={[{ required: true, message: "Seleccione el país" }]}
        >
          <Select
            {...selectProps}
            placeholder="Seleccionar país"
            loading={loadingPaises}
            onChange={(idPais) => {
              form.setFieldsValue({ idPersonal: undefined });
              cargarPersonalPorPais(idPais);
            }}
          >
            {paises.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.nombre}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* ===================== */}
        {/* PERSONAL */}
        {/* ===================== */}
        <Form.Item
          label="Personal responsable"
          name="idPersonal"
          rules={[
            { required: true, message: "Seleccione un responsable" },
          ]}
        >
          <Select
            {...selectProps}
            placeholder="Seleccionar personal"
            loading={loadingPersonal}
            disabled={!form.getFieldValue("idPais")}
          >
            {personal.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.nombre}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* ===================== */}
        {/* PREVIEW */}
        {/* ===================== */}
        {activo && (
          <div className={styles.previewSection}>
            <label className={styles.previewLabel}>
              Vista previa del activo
            </label>
            <div className={styles.previewBox}>
              <div>{activo.nombre}</div>
              <div>{activo.ip || "-"}</div>
              <div>
                {activo.ubicacionSede} – Estación {activo.estacion}
              </div>
            </div>
          </div>
        )}

        {/* ===================== */}
        {/* ACTION */}
        {/* ===================== */}
        <Button
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          className={styles.submitButton}
          block
        >
          Confirmar asignación
        </Button>
      </Form>
    </Modal>
  );
}
