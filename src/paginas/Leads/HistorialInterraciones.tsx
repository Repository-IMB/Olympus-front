import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Divider,
  Tooltip,
  Checkbox,
  Dropdown,
  DatePicker,
  message,
  TimePicker,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  CheckOutlined,
  EditOutlined,
  CommentOutlined,
  CloseOutlined,
  SendOutlined,
  FileTextOutlined,
  WhatsAppOutlined,
  CalendarOutlined,
  StopOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import api from "../../servicios/api";
import dayjs from "dayjs";
import { getCookie } from "../../utils/cookies";
import { jwtDecode } from "jwt-decode";
import styles from "./HistorialInterraciones.module.css";

const { Text, Title } = Typography;

type TipoInteraccion = "desuscrito" | "whatsapp" | "nota" | "recordatorio";

const colores: Record<TipoInteraccion, string> = {
  nota: "#FFF7B3",
  whatsapp: "#DBFFD2",
  recordatorio: "#DCDCDC",
  desuscrito: "#FFCDCD",
};

const mapTipos: Record<number, TipoInteraccion> = {
  7: "desuscrito",
  8: "whatsapp",
  9: "nota",
  10: "recordatorio",
};

const tiposConfig = [
  { id: "nota", nombre: "Nota", color: "#FFF7B3", icon: <FileTextOutlined /> },
  {
    id: "whatsapp",
    nombre: "WhatsApp",
    color: "#DBFFD2",
    icon: <WhatsAppOutlined />,
  },
  {
    id: "recordatorio",
    nombre: "Recordatorio",
    color: "#DCDCDC",
    icon: <CalendarOutlined />,
  },
  {
    id: "desuscrito",
    nombre: "Desuscrito",
    color: "#FFCDCD",
    icon: <StopOutlined />,
  },
];

// (no se usa, lo dejo tal como lo tenías)
const DESACTIVAR_URL = "/api/VTAModVentaHistorialInteraccion/Desactivar";

const HistorialInteracciones: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [tipoSeleccionado, setTipoSeleccionado] =
    useState<TipoInteraccion>("nota");
  const [nota, setNota] = useState<string>("");

  const [fechaRecordatorio, setFechaRecordatorio] = useState<any>(null);
  const [horaRecordatorio, setHoraRecordatorio] = useState<dayjs.Dayjs | null>(
    null
  );

  const [interacciones, setInteracciones] = useState<any[]>([]);
  const [filtrosActivos, setFiltrosActivos] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState<string>("");
  const [telefonoCliente, setTelefonoCliente] = useState<string | null>(null);

  const getUserIdFromToken = () => {
    const token = getCookie("token");
    if (!token) return 0;

    try {
      const decoded: any = jwtDecode(token);

      const id =
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ];

      return id ? Number(id) : 0;
    } catch (e) {
      console.error("Error decodificando token", e);
      return 0;
    }
  };

  
  // ======================================================
  // 📌 OBTENER TELÉFONO DEL CLIENTE
  // ======================================================
  const obtenerTelefonoCliente = useCallback(async (): Promise<string | null> => {
    if (!id) return null;

    try {
      const token = getCookie("token");
      const res = await api.get(
        `/api/VTAModVentaOportunidad/ObtenerPotencialPorOportunidad/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const persona = res.data?.persona;
      if (!persona) return null;

      const prefix = persona.prefijoPaisCelular
        ? String(persona.prefijoPaisCelular).replace(/\s+/g, "")
        : "";
      const phone = persona.celular
        ? String(persona.celular).replace(/\s+/g, "")
        : "";

      return prefix || phone ? `${prefix}${phone}` : null;
    } catch (error) {
      console.error("Error al obtener teléfono del cliente:", error);
      return null;
    }
  }, [id]);

  const cargarHistorial = useCallback(async (idTipo: number | null) => {
    try {
      const oportunidadId = id || "1";
      const params = idTipo !== null ? `?idTipo=${idTipo}` : "?idTipo=";

      const res = await api.get(
        `/api/VTAModVentaOportunidad/ObtenerHistorialInteraccionesOportunidad/${oportunidadId}${params}`
      );

      setInteracciones(res.data.historialInteraciones || []);
    } catch (error) {
      console.error("Error cargando historial:", error);
    }
  }, [id]);

  useEffect(() => {
    cargarHistorial(null);
    // Cargar el teléfono del cliente al montar el componente
    obtenerTelefonoCliente().then((telefono) => {
      if (telefono) {
        setTelefonoCliente(telefono);
      }
    });
  }, [id, cargarHistorial, obtenerTelefonoCliente]);

  // ======================================================
  // DESACTIVAR RECORDATORIO
  // ======================================================
  const handleDesactivarRecordatorio = async (item: any) => {
    try {
      if (item?.estado === false) return;

      await api.post(
        `/api/VTAModVentaOportunidad/DesactivarRecordatorio/${item.id}`
      );

      message.success("Recordatorio desactivado");
      cargarHistorial(null);
    } catch (error) {
      console.error("Error desactivando recordatorio:", error);
      message.error("No se pudo desactivar el recordatorio");
    }
  };

  // ======================================================
  // ✅ CONTADOR + BANDERA (máx 3 activos)
  // ======================================================
  const recordatoriosActivosCount = interacciones.filter(
    (i) => mapTipos[i.idTipo] === "recordatorio" && i.estado === true
  ).length;

  const limiteRecordatoriosAlcanzado = recordatoriosActivosCount >= 3;

  // ======================================================
  // 📌 ENVIAR MENSAJE / RECORDATORIO
  // ======================================================
  const handleEnviar = async () => {
    if (!nota.trim()) {
      message.warning("Debe ingresar un mensaje");
      return;
    }

    const oportunidadId = id ? parseInt(id) : 1;

    let fechaFinal = null;

    if (tipoSeleccionado === "recordatorio") {
      // ✅ VALIDACIÓN: NO DEJAR CREAR SI YA HAY 3 ACTIVOS
      if (limiteRecordatoriosAlcanzado) {
        return; // el aviso se muestra arriba en rojo
      }

      if (!fechaRecordatorio) {
        message.warning("Seleccione una fecha para el recordatorio");
        return;
      }
      if (!horaRecordatorio) {
        message.warning("Seleccione una hora para el recordatorio");
        return;
      }

      const fechaISO = dayjs(fechaRecordatorio)
        .hour(horaRecordatorio.hour())
        .minute(horaRecordatorio.minute())
        .second(0)
        .subtract(5, "hour")
        .toISOString();

      fechaFinal = fechaISO;
    }

    const payload = {
      id: 0,
      idOportunidad: oportunidadId,
      idTipo:
        tipoSeleccionado === "desuscrito"
          ? 7
          : tipoSeleccionado === "whatsapp"
          ? 8
          : tipoSeleccionado === "nota"
          ? 9
          : tipoSeleccionado === "recordatorio"
          ? 10
          : 9,
      detalle: nota,
      celular: "",
      fechaRecordatorio: fechaFinal,
      estado: true,
      fechaCreacion: dayjs().subtract(5, "hour").toISOString(),
      usuarioCreacion: Number(getUserIdFromToken()).toString(),
      fechaModificacion: dayjs().subtract(5, "hour").toISOString(),
      usuarioModificacion: Number(getUserIdFromToken()).toString(),
    };

    await api.post("/api/VTAModVentaHistorialInteraccion/Insertar", payload);

    // Guardar el mensaje antes de limpiarlo (necesario para WhatsApp)
    const mensajeParaWhatsApp = nota.trim();

    setNota("");
    setFechaRecordatorio(null);
    setHoraRecordatorio(null);

    cargarHistorial(null);

    // Solo abrir WhatsApp si el tipo seleccionado es "whatsapp"
    if (tipoSeleccionado === "whatsapp") {
      // Usar el teléfono en caché si está disponible, sino obtenerlo
      let numeroWhatsApp = telefonoCliente;
      
      if (!numeroWhatsApp) {
        numeroWhatsApp = await obtenerTelefonoCliente();
        if (numeroWhatsApp) {
          setTelefonoCliente(numeroWhatsApp);
        }
      }
      
      if (!numeroWhatsApp) {
        message.warning("No se pudo obtener el número de teléfono del cliente");
        return;
      }

      const mensajeCodificado = encodeURIComponent(mensajeParaWhatsApp);
      const urlWhatsApp = `https://web.whatsapp.com/send?phone=${numeroWhatsApp}&text=${mensajeCodificado}`;
      
      // Abrir en una nueva ventana/pestaña
      window.open(urlWhatsApp, "_blank");
    }
  };

  // ======================================================
  // 📌 LLAMAR POR WHATSAPP
  // ======================================================
  const handleLlamarWhatsApp = async () => {
    // Usar el teléfono en caché si está disponible, sino obtenerlo
    let numeroWhatsApp = telefonoCliente;
    
    if (!numeroWhatsApp) {
      numeroWhatsApp = await obtenerTelefonoCliente();
      if (numeroWhatsApp) {
        setTelefonoCliente(numeroWhatsApp);
      }
    }
    
    if (!numeroWhatsApp) {
      message.warning("No se pudo obtener el número de teléfono del cliente");
      return;
    }

    const urlWhatsApp = `https://web.whatsapp.com/send?phone=${numeroWhatsApp}`;
    window.open(urlWhatsApp, "_blank");
    message.info("Se abrió WhatsApp Web. Haz clic en el botón de llamada para iniciar la llamada.");
  };

  // ======================================================
  // 📌 FILTROS + BÚSQUEDA
  // ======================================================
  const interaccionesFiltradas = interacciones.filter((i) => {
    const tipo = mapTipos[i.idTipo] ?? "nota";

    const cumpleFiltro =
      filtrosActivos.length === 0 || filtrosActivos.includes(tipo);

    const cumpleBusqueda =
      busqueda.trim() === "" ||
      (i.detalle || "").toLowerCase().includes(busqueda.toLowerCase());

    return cumpleFiltro && cumpleBusqueda;
  });

  // ======================================================
  // 📌 MENÚ FILTROS
  // ======================================================
  const menuFiltros = (
    <Card
      style={{
        width: 240,
        borderRadius: 10,
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        background: "#fff",
      }}
      bodyStyle={{ padding: 12 }}
    >
      <Title level={5} style={{ textAlign: "center", margin: "0 0 8px" }}>
        Filtros de Interacción
      </Title>

      <Space direction="vertical" style={{ width: "100%" }} size={6}>
        {tiposConfig.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              background: t.color,
              borderRadius: 6,
              padding: "4px 8px",
              gap: 8,
            }}
          >
            <Checkbox
              checked={filtrosActivos.includes(t.id)}
              onChange={(e) => {
                const checked = e.target.checked;
                setFiltrosActivos((prev) =>
                  checked ? [...prev, t.id] : prev.filter((f) => f !== t.id)
                );
              }}
              style={{ margin: 0 }}
            />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{t.nombre}</span>
          </div>
        ))}
      </Space>

      <Divider style={{ margin: "8px 0" }} />

      <Space direction="vertical" style={{ width: "100%" }}>
        <Button type="primary" block style={{ background: "#005FF8" }}>
          Aplicar filtros
        </Button>
        <Button block onClick={() => setFiltrosActivos([])}>
          Limpiar filtros
        </Button>
      </Space>
    </Card>
  );

  // ======================================================
  // 📌 RENDER
  // ======================================================
  return (
    <div className={styles.container}>
      <Title level={5} style={{ marginBottom: 12 }}>
        Historial de Interacciones
      </Title>

      <Card
        className={styles.mainCard}
        bodyStyle={{
          padding: 6,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {/* === BARRA SUPERIOR === */}
        <div className={styles.topBar}>
          <Input
            placeholder="Buscar..."
            prefix={<SearchOutlined />}
            size="small"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={styles.searchInput}
          />

          <Dropdown
            trigger={["click"]}
            dropdownRender={() => menuFiltros}
            placement="bottomRight"
          >
            <Button
              icon={<FilterOutlined />}
              size="small"
              className={styles.filterButton}
            >
              Filtros
            </Button>
          </Dropdown>
        </div>

        <Divider style={{ margin: "4px 0" }} />

        {/* === AGREGAR INTERACCIÓN === */}
        <div className={styles.addSection}>
          <div className={styles.tipoButtonsContainer}>
            {tiposConfig.map((t) => (
              <Tooltip title={t.nombre} key={t.id}>
                <Button
                  shape="round"
                  size="small"
                  icon={t.icon}
                  onClick={() => setTipoSeleccionado(t.id as TipoInteraccion)}
                  style={{
                    background: t.color,
                    border: "none",
                    boxShadow:
                      tipoSeleccionado === t.id
                        ? "0 0 0 2px rgba(0,0,0,0.25) inset"
                        : "none",
                  }}
                />
              </Tooltip>
            ))}
          </div>

          {/* === TEXTO === */}
          <div className={styles.inputContainer}>
            <div
              className={styles.textAreaWrapper}
              style={{ background: colores[tipoSeleccionado] }}
            >
              <Input.TextArea
                placeholder="Escriba una nota"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                autoSize={{ minRows: 1, maxRows: 4 }}
                style={{
                  background: "transparent",
                  border: "none",
                  boxShadow: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  resize: "none",
                }}
              />
            </div>

            <Button
              type="primary"
              shape="round"
              size="middle"
              className={styles.sendButton}
              icon={<SendOutlined style={{ color: "#fff" }} />}
              onClick={handleEnviar}
            />
          </div>

          {/* === CONTROLES DE FECHA/HORA — SOLO SI ES RECORDATORIO === */}
          {tipoSeleccionado === "recordatorio" && (
            <div className={styles.dateTimeControls}>
              <DatePicker
                placeholder="Fecha"
                value={fechaRecordatorio}
                onChange={setFechaRecordatorio}
                className={styles.datePicker}
              />
              <TimePicker
                placeholder="Seleccionar hora"
                format="HH:mm"
                value={horaRecordatorio}
                showNow={true}
                placement="topLeft"
                getPopupContainer={() => document.body}
                onChange={(t) => {
                  setHoraRecordatorio(t);
                }}
              />
            </div>
          )}
        </div>

        <Divider style={{ margin: "4px 0" }} />

        {/* === LISTA === */}
        <Space direction="vertical" className={styles.listContainer} size={4}>
          {interaccionesFiltradas.length > 0 ? (
            interaccionesFiltradas
              .sort((a, b) => {
                // Ordenar de forma descendente (más reciente primero)
                const fechaA = new Date(a.fechaCreacion).getTime();
                const fechaB = new Date(b.fechaCreacion).getTime();
                return fechaB - fechaA;
              })
              .map((item) => {
              const tipo = mapTipos[item.idTipo] ?? "nota";
              const fechaCreacion = new Date(
                item.fechaCreacion
              ).toLocaleString();

              // Formateo fecha del recordatorio
              let fechaRecordatorioBonita: string | null = null;

              if (tipo === "recordatorio" && item.fechaRecordatorio) {
                const d = dayjs(item.fechaRecordatorio);

                const dias = [
                  "domingo",
                  "lunes",
                  "martes",
                  "miércoles",
                  "jueves",
                  "viernes",
                  "sábado",
                ];

                const meses = [
                  "enero",
                  "febrero",
                  "marzo",
                  "abril",
                  "mayo",
                  "junio",
                  "julio",
                  "agosto",
                  "septiembre",
                  "octubre",
                  "noviembre",
                  "diciembre",
                ];

                const nombreDia = dias[d.day()];
                const dia = d.date();
                const mes = meses[d.month()];
                const año = d.year();
                const hora = d.format("HH:mm");

                fechaRecordatorioBonita = `Recordatorio : ${nombreDia} ${dia} de ${mes} de ${año} – ${hora}`;
              }

              const recordatorioDesactivado =
                tipo === "recordatorio" && item?.estado === false;

              return (
                <Card
                  key={item.id}
                  size="small"
                  style={{
                    background: colores[tipo],
                    border: `1px solid ${colores[tipo]}`,
                    borderRadius: 6,
                    padding: 4,
                    opacity: recordatorioDesactivado ? 0.65 : 1,
                  }}
                  bodyStyle={{ padding: 4 }}
                >
                  {/* BOTÓN ARRIBA IZQUIERDA SOLO PARA RECORDATORIO */}
                  {tipo === "recordatorio" && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 2,
                      }}
                    >
                      {item.estado === true ? (
                        <>
                          {/* INDICADOR ACTIVO */}
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#389e0d",
                            }}
                          >
                            ACTIVO
                          </div>

                          {/* BOTÓN DESACTIVAR (SIN CONFIRMACIÓN) */}
                          <Button
                            size="small"
                            icon={<StopOutlined />}
                            onClick={() => handleDesactivarRecordatorio(item)}
                            style={{
                              borderRadius: 6,
                              fontSize: 11,
                              height: 22,
                              paddingInline: 8,
                            }}
                          >
                            Desactivar
                          </Button>
                        </>
                      ) : (
                        /* INDICADOR DESACTIVADO */
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#a61d24",
                          }}
                        >
                          DESACTIVADO
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ textAlign: "right" }}>
                    {tipo === "recordatorio" && fechaRecordatorioBonita && (
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#000",
                          marginBottom: 2,
                        }}
                      >
                        {fechaRecordatorioBonita}
                      </div>
                    )}

                    <Text
                      style={{
                        color: "#0D0C11",
                        fontSize: 11,
                        display: "block",
                        whiteSpace: "pre-line",
                      }}
                    >
                      {item.detalle}
                    </Text>

                    <Text style={{ fontSize: 10, color: "#5D5D5D" }}>
                      {fechaCreacion} – {item.nombrePersonal ?? "—"}
                    </Text>
                  </div>
                </Card>
              );
            })
          ) : (
            <Text
              style={{ fontSize: 12, color: "#5D5D5D", textAlign: "center" }}
            >
              No hay interacciones.
            </Text>
          )}
        </Space>

        <Divider style={{ margin: "6px 0" }} />

       
      </Card>
    </div>
  );
};

export default HistorialInteracciones;
