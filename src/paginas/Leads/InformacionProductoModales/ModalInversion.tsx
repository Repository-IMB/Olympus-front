import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Select,
  Typography,
  Modal,
  message,
  Popconfirm,
} from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { getCookie } from "../../../utils/cookies";
import api from "../../../servicios/api";

const { Text, Title } = Typography;

interface Inversion {
  id: number;
  idProducto: number;
  idOportunidad: number;
  costoTotal: number;
  moneda: string;
  descuentoPorcentaje: number;
  descuentoMonto: number | null;
  costoOfrecido: number;
  estado: boolean;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  inversion?: Inversion | null;
  idProducto?: number;
  idOportunidad?: number;
  onSave?: () => Promise<void> | void;
  onDescuentoChange?: (descuento: number) => void;
}

interface JwtPayload {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"?: string;
}

const ModalInversion: React.FC<Props> = ({
  open,
  onClose,
  inversion,
  idProducto,
  idOportunidad,
  onSave,
  onDescuentoChange,
}) => {
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [inversionActual, setInversionActual] = useState<Inversion | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  useEffect(() => {
    if (inversion) {
      setDescuentoPorcentaje(inversion.descuentoPorcentaje);
      setInversionActual(inversion);
    } else {
      setDescuentoPorcentaje(5);
      setInversionActual(null);
    }
    setErrorModal(null);
  }, [inversion, open]);

  const costoTotal = inversionActual?.costoTotal || 0;
  const descuentoMonto = (costoTotal * descuentoPorcentaje) / 100;
  const costoFinal = costoTotal - descuentoMonto;

  const obtenerUsuarioDelToken = (): string => {
    const token = getCookie("token");
    if (!token) return "SYSTEM";

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const decoded: JwtPayload = JSON.parse(jsonPayload);
      return (
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
        ] || "SYSTEM"
      );
    } catch {
      return "SYSTEM";
    }
  };

  const guardarInversion = async () => {
    if (!idProducto || !idOportunidad) {
      setErrorModal("Faltan datos necesarios para guardar la inversión");
      return;
    }

    setLoading(true);
    setErrorModal(null);

    try {
      const usuario = obtenerUsuarioDelToken();

      const payload = {
        idProducto,
        idOportunidad,
        DescuentoPorcentaje: descuentoPorcentaje,
        UsuarioModificacion: usuario,
      };

      const response = await api.post(
        "/api/VTAModVentaInversion/ActualizarCostoOfrecido",
        payload
      );

      if (!response.data) {
        setErrorModal("No se recibió respuesta del servidor");
        return;
      }

      setInversionActual({
        ...response.data,
        descuentoPorcentaje:
          response.data.descuentoAplicado ??
          response.data.descuentoPorcentaje,
      });

      message.success("Inversión guardada correctamente");

      if (onSave) {
        await onSave();
      }

      onClose();
    } catch (error: any) {
      setErrorModal(
        error?.response?.data?.message ||
          "Error al guardar la inversión"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      closeIcon={<CloseOutlined />}
      styles={{
        body: {
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          fontSize: 13,
        },
      }}
    >
      <Title level={5} style={{ textAlign: "center", marginBottom: 8 }}>
        Inversión
      </Title>

      <Text>Costo total:</Text>
      <Input value={`$${costoTotal.toFixed(2)}`} readOnly />

      <Text>Descuento (%):</Text>
      <Input
        value={descuentoPorcentaje}
        placeholder="Ingrese porcentaje"
        inputMode="numeric"
        pattern="[0-9]*"
        onChange={(e) => {
          const value = e.target.value;

          if (value === "") {
            setDescuentoPorcentaje(0);
            onDescuentoChange?.(0);
            return;
          }

          if (!/^\d+$/.test(value)) return;

          const porcentaje = parseInt(value, 10);

          if (porcentaje > 100) return;

          setDescuentoPorcentaje(porcentaje);
          onDescuentoChange?.(porcentaje);
        }}
        suffix="%"
      />


      <Text>Total:</Text>
      <Input value={`$${costoFinal.toFixed(2)}`} readOnly />

      <div
        style={{
          background: "#f7f7f7",
          padding: 10,
          borderRadius: 6,
          textAlign: "center",
        }}
      >
        <Text>
          ${costoTotal.toFixed(2)} menos {descuentoPorcentaje}% de descuento
        </Text>
        <br />
        <Text strong>Total ${costoFinal.toFixed(2)}</Text>
      </div>

      {errorModal && (
        <div style={{ color: "#ff4d4f", marginTop: 8, textAlign: "center" }}>
          {errorModal}
        </div>
      )}

      <Popconfirm
        title="¿Está seguro de guardar este descuento?"
        okText="Sí"
        cancelText="No"
        onConfirm={guardarInversion}
      >
        <Button type="primary" block loading={loading}>
          Guardar
        </Button>
      </Popconfirm>
    </Modal>
  );
};

export default ModalInversion;
