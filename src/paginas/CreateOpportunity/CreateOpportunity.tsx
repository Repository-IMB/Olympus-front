import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  DatePicker,
  Modal,
  message,
  Card,
  TimePicker,
  AutoComplete,
  Select,
} from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { CloseOutlined, CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/es";
import {
  insertarOportunidadHistorialRegistrado,
  obtenerLanzamientos,
  type ClientePotencial,
  type Lanzamiento,
} from "../../config/rutasApi";
import "./CreateOpportunity.css";
import axios from "axios";
import Cookies from "js-cookie";

dayjs.locale("es");
const { Option } = Select;

interface Asesor {
  idUsuario: number;
  idPersona: number;
  nombre: string;
  idRol: number;
}

const CreateOpportunity: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [lanzamientos, setLanzamientos] = useState<Lanzamiento[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loadingLanzamientos, setLoadingLanzamientos] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<dayjs.Dayjs | null>(null);
  const [selectedLanzamiento, setSelectedLanzamiento] = useState<string>("");
  const [selectedLanzamientoId, setSelectedLanzamientoId] = useState<
    number | null
  >(null);

  // 🟦 ASESORES
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [loadingAsesores, setLoadingAsesores] = useState<boolean>(false);
  const token = Cookies.get("token");

  const navigate = useNavigate();
  const location = useLocation();
  const client = (location.state as { client?: ClientePotencial })?.client;

  // ======================== CARGAR LANZAMIENTOS =========================
  useEffect(() => {
    const cargarLanzamientos = async () => {
      try {
        setLoadingLanzamientos(true);
        const data = await obtenerLanzamientos();
        setLanzamientos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error al cargar lanzamientos:", error);
        message.error("Error al cargar los lanzamientos");
        setLanzamientos([]);
      } finally {
        setLoadingLanzamientos(false);
      }
    };

    cargarLanzamientos();
  }, []);

  // ======================== CARGAR ASESORES =============================
  const obtenerAsesores = async () => {
    try {
      setLoadingAsesores(true);

      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:7020"
        }/api/CFGModUsuarios/ObtenerUsuariosPorRol/1`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data;
      if (data?.usuarios && Array.isArray(data.usuarios)) {
        const listaAsesores = data.usuarios.map((u: any) => ({
          idUsuario: u.id,
          idPersona: u.idPersona,
          nombre: u.nombre,
          idRol: u.idRol,
        }));
        setAsesores(listaAsesores);
      } else {
        setAsesores([]);
      }
    } catch (err: any) {
      message.error(err?.response?.data?.mensaje || "Error al cargar asesores");
      setAsesores([]);
    } finally {
      setLoadingAsesores(false);
    }
  };

  useEffect(() => {
    obtenerAsesores();
  }, []);

  // ======================== SUBMIT =============================
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const idPotencialCliente = client?.id || 0;

      if (!idPotencialCliente) {
        message.error("No se ha seleccionado un cliente válido");
        return;
      }

      if (!selectedLanzamientoId) {
        message.error("Por favor seleccione un lanzamiento válido");
        return;
      }

      if (!values.asesor) {
        message.error("Seleccione un asesor");
        return;
      }

      const fechaRecordatorio = dayjs(values.fecha).format(
        "YYYY-MM-DDTHH:mm:ss"
      );
      const horaRecordatorio = dayjs(values.hora).format("HH:mm");

      // ======> Aquí enviamos IdPersona (y mantenemos IdAsesor por compatibilidad)
      const payload = {
        IdPotencialCliente: idPotencialCliente,
        IdProducto: selectedLanzamientoId,
        CodigoLanzamiento: values.lanzamiento,
        Origen: "Manual",
        Estado: true,
        FechaRecordatorio: fechaRecordatorio,
        HoraRecordatorio: horaRecordatorio,
        UsuarioCreacion: "SYSTEM",
        UsuarioModificacion: "SYSTEM",
        IdPersona: values.asesor, //
        IdAsesor: values.asesor,  // <-- opcional: mantener por compatibilidad backend
      };

      await insertarOportunidadHistorialRegistrado(payload);

      message.success("Oportunidad creada exitosamente");
      form.resetFields();
      navigate("/leads/Opportunities");
    } catch (error: any) {
      console.error("Error al crear oportunidad:", error);
      message.error(
        error?.response?.data?.message || "Error al crear la oportunidad"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => navigate(-1);

  // ======================== LANZAMIENTOS FILTRADOS =============================
  const lanzamientosArray = Array.isArray(lanzamientos) ? lanzamientos : [];
  const filteredLanzamientos =
    searchText.trim() === ""
      ? lanzamientosArray
      : lanzamientosArray.filter((l) =>
          l?.codigoLanzamiento?.toLowerCase().includes(searchText.toLowerCase())
        );

  const lanzamientoOptions = filteredLanzamientos.map((l) => ({
    value: l.codigoLanzamiento,
    label: l.codigoLanzamiento,
  }));

  // ======================== UI =============================
  return (
    <div className="create-opportunity-page">
      <Modal
        open={true}
        onCancel={handleClose}
        footer={null}
        width={900}
        centered
        closeIcon={<CloseOutlined />}
        className="create-opportunity-modal"
      >
        <div className="create-opportunity-header">
          <h2 className="create-opportunity-title">Crear Oportunidad</h2>
        </div>

        {client && (
          <Card className="client-info-card">
            <div className="client-info-content">
              <h3 className="client-name">
                {client.persona.nombres} {client.persona.apellidos}
              </h3>
              <p className="client-phone">
                {client.persona.prefijoPaisCelular} {client.persona.celular}
              </p>
              <p className="client-email">{client.persona.correo}</p>
            </div>
            <div className="opportunities-badge">
              Información del Cliente Potencial
            </div>
          </Card>
        )}

        <Form
          form={form}
          layout="vertical"
          className="create-opportunity-form"
          requiredMark={false}
        >
          {/* ================= SELECT LANZAMIENTO ================= */}
          <Form.Item
            label={
              <span>
                Lanzamiento<span style={{ color: "#ff4d4f" }}>*</span>
              </span>
            }
            name="lanzamiento"
            rules={[{ required: true, message: "El campo Lanzamiento es requerido" }]}
          >
            <AutoComplete
              options={lanzamientoOptions}
              onSearch={setSearchText}
              value={searchText}
              placeholder="Buscar lanzamiento..."
              notFoundContent={
                loadingLanzamientos ? "Cargando..." : "No se encontraron lanzamientos"
              }
              filterOption={false}
              onChange={(value) => {
                setSearchText(value);
                setSelectedLanzamiento(value);
                form.setFieldsValue({ lanzamiento: value });

                const lanzamientoEncontrado = lanzamientos.find(
                  (l) => l.codigoLanzamiento === value
                );
                if (lanzamientoEncontrado) setSelectedLanzamientoId(lanzamientoEncontrado.id);
              }}
              onSelect={(value) => {
                setSearchText(value);
                setSelectedLanzamiento(value);
                form.setFieldsValue({ lanzamiento: value });

                const lanzamientoEncontrado = lanzamientos.find(
                  (l) => l.codigoLanzamiento === value
                );
                if (lanzamientoEncontrado) setSelectedLanzamientoId(lanzamientoEncontrado.id);
              }}
            />
          </Form.Item>

          {/* ================= SELECT ASESOR ================= */}
          <Form.Item
            label={
              <span>
                Asesor<span style={{ color: "#ff4d4f" }}>*</span>
              </span>
            }
            name="asesor"
            rules={[{ required: true, message: "Seleccione un asesor" }]}
          >
            <Select
              placeholder="Seleccione un asesor"
              loading={loadingAsesores}
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            >
              {asesores.map((a) => (
                // value = idPersona: enviamos el idPersona seleccionado al backend
                <Option key={a.idPersona} value={a.idPersona} label={a.nombre}>
                  {a.nombre}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* ================= FECHA Y HORA ================= */}
          <div className="date-time-row">
            <Form.Item
              label={
                <span>
                  Fecha<span style={{ color: "#ff4d4f" }}>*</span>
                </span>
              }
              name="fecha"
              rules={[{ required: true, message: "El campo Fecha es requerido" }]}
              className="date-field"
            >
              <DatePicker
                placeholder=""
                suffixIcon={<CalendarOutlined />}
                format="DD/MM/YYYY"
                onChange={(d) => setSelectedDate(d)}
              />
            </Form.Item>

            <Form.Item
              label={
                <span>
                  Hora<span style={{ color: "#ff4d4f" }}>*</span>
                </span>
              }
              name="hora"
              rules={[{ required: true, message: "El campo Hora es requerido" }]}
              className="time-field"
            >
              <TimePicker
                placeholder=""
                format="HH:mm"
                style={{ width: "100%" }}
                onChange={(t) => setSelectedTime(t)}
              />
            </Form.Item>
          </div>

          {/* ================= INFO PROGRAMACIÓN ================= */}
          <div className="scheduled-container">
            <div className="scheduled-label">
              {selectedDate && selectedTime
                ? `Programado para: ${
                    selectedDate.format("dddd").charAt(0).toUpperCase() +
                    selectedDate.format("dddd").slice(1)
                  }, ${selectedDate.format("DD [de] MMMM [de] YYYY")} a las ${selectedTime.format("HH:mm")} horas`
                : "Programado para: Seleccione fecha y hora"}
            </div>

            <div className="scheduled-text">
              {selectedLanzamiento || "Seleccione un lanzamiento"}
            </div>
          </div>

          <Button
            type="primary"
            block
            onClick={handleSubmit}
            className="create-opportunity-button"
            icon={<span className="plus-icon">+</span>}
            loading={loading}
          >
            Crear Oportunidad
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default CreateOpportunity;
