import React, { useState, useMemo, useRef, useEffect } from "react";
import { Card, Divider, Space, Typography, Row, Col, Spin } from "antd";
import { RightOutlined } from "@ant-design/icons";
import { getCookie } from "../../utils/cookies";
import ModalHorarios from "./InformacionProductoModales/ModalHorarios";
import ModalDocentes from "./InformacionProductoModales/ModalDocentes";
import api from "../../servicios/api";
import styles from "./InformacionProducto.module.css";

const { Text, Title } = Typography;

type ModalKey = null | "horarios" | "docentes";

interface Horario {
  id: number;
  idProducto: number;
  productoNombre: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  detalle: string;
  orden: number;
  estado: boolean;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
}

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

interface Producto {
  id: number;
  nombre: string;
  codigoLanzamiento: string;
  fechaInicio: string;
  fechaFin: string;
  fechaPresentacion: string | null;
  datosImportantes: string;
  estado: boolean;
  costoBase: number | null;
  brochure: string | null;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
}

interface Estructura {
  id: number;
  idProducto: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  idMigracion: number | null;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
}

interface Modulo {
  id: number;
  nombre: string;
  codigo: string | null;
  descripcion: string;
  duracionHoras: number;
  estado: boolean;
  idMigracion: number | null;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
}

interface EstructuraModulo {
  id: number;
  idEstructuraCurricular: number;
  idModulo: number;
  modulo: Modulo;
  orden: number;
  sesiones: number;
  duracionHoras: number;
  observaciones: string | null;
  idDocente: number | null;
  idPersonaDocente: number | null;
  docenteNombre: string | null;
}

interface Certificado {
  id: number;
  idProducto: number;
  idCertificado: number;
  nombreCertificado: string;
  estado: boolean;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
}

interface MetodoPago {
  id: number;
  idProducto: number;
  idMetodoPago: number;
  nombreMetodoPago: string;
  activo: boolean;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
}

interface Beneficio {
  id: number;
  idProducto: number;
  descripcion: string;
  orden: number | null;
  estado: boolean;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
}

interface DocentePorModulo {
  id: number;
  idEstructuraCurricular: number;
  idModulo: number;
  modulo: Modulo | null;
  orden: number | null;
  sesiones: number | null;
  duracionHoras: number | null;
  observaciones: string | null;
  idDocente: number;
  idPersonaDocente: number;
  docenteNombre: string;
}

interface ProductoDetalleResponse {
  producto: Producto;
  horarios: Horario[];
  inversiones: Inversion[];
  estructuras: Estructura[];
  estructuraModulos: EstructuraModulo[];
  productoCertificados: Certificado[];
  metodosPago: MetodoPago[];
  beneficios: Beneficio[];
  docentesPorModulo: DocentePorModulo[];
}

interface InformacionProductoProps {
  oportunidadId?: string;
}

const InformacionProducto: React.FC<InformacionProductoProps> = ({ oportunidadId }) => {
  const [openModal, setOpenModal] = useState<ModalKey>(null);
  const [productoData, setProductoData] = useState<Producto | null>(null);
  const [horariosData, setHorariosData] = useState<Horario[]>([]);
  const [inversionesData, setInversionesData] = useState<Inversion[]>([]);
  const [estructurasData, setEstructurasData] = useState<Estructura[]>([]);
  const [estructuraModulosData, setEstructuraModulosData] = useState<EstructuraModulo[]>([]);
  const [certificadosData, setCertificadosData] = useState<Certificado[]>([]);
  const [metodosPagoData, setMetodosPagoData] = useState<MetodoPago[]>([]);
  const [beneficiosData, setBeneficiosData] = useState<Beneficio[]>([]);
  const [docentesData, setDocentesData] = useState<DocentePorModulo[]>([]);
  const [docentesSeleccionados, setDocentesSeleccionados] = useState<DocentePorModulo[]>([]);
  const [docentesInicializados, setDocentesInicializados] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tabSeleccionado, setTabSeleccionado] = useState(0);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const tabs = ["Producto actual", "Speech", "Ver brochure"];


  // Función para formatear fechas de ISO a DD-MM-YYYY
  const formatearFecha = (fechaISO: string | null): string => {
    if (!fechaISO || fechaISO === "0001-01-01T00:00:00") return "-";
    try {
      const fecha = new Date(fechaISO);
      const dia = String(fecha.getDate()).padStart(2, "0");
      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
      const año = fecha.getFullYear();
      return `${dia}-${mes}-${año}`;
    } catch {
      return "-";
    }
  };

  // Función para cargar los datos del producto
  const cargarDatosProducto = async (mantenerDocentesSeleccionados: boolean = false) => {
    if (!oportunidadId) {
      // console.warn("⚠️ No hay ID de oportunidad disponible para InformacionProducto");
      return;
    }

    const token = getCookie("token");
    setLoading(true);

    // Solo resetear docentes si no se debe mantener la selección
    if (!mantenerDocentesSeleccionados) {
      setDocentesInicializados(false);
      setDocentesSeleccionados([]);
    }

    try {
      const res = await api.get<ProductoDetalleResponse>(`/api/VTAModVentaProducto/DetallePorOportunidad/${oportunidadId}`, {
        headers: { Authorization: `Bearer ${token}` }, // opcional si tu interceptor ya lo añade
      });
      setProductoData(res.data.producto);
      setHorariosData(res.data.horarios || []);
      setInversionesData(res.data.inversiones || []);

      try {
        const inversiones = res.data.inversiones || [];
        if (inversiones.length > 0 && oportunidadId) {
          const costoOfrecido = Number(inversiones[0].costoOfrecido ?? NaN);
          if (Number.isFinite(costoOfrecido)) {
            window.dispatchEvent(
              new CustomEvent("costoOfrecidoActualizado", {
                detail: { oportunidadId: String(oportunidadId), costoOfrecido },
              })
            );
          }
        }
      } catch (err) {
        // console.debug("no fue posible dispatch evento costoOfrecidoActualizado", err);
      }

      setEstructurasData(res.data.estructuras || []);
      setEstructuraModulosData(res.data.estructuraModulos || []);
      setCertificadosData(res.data.productoCertificados || []);
      setMetodosPagoData(res.data.metodosPago || []);
      setBeneficiosData(res.data.beneficios || []);
      setDocentesData(res.data.docentesPorModulo || []);
    } catch (err: any) {
      // console.error("❌ Error al obtener datos del producto:", err?.response?.data ?? err.message);
    } finally {
      setLoading(false);
    }
  };


  // Fetch de datos del producto
  useEffect(() => {
    cargarDatosProducto();
  }, [oportunidadId]);

  // Escuchar evento de actualización de descuento desde EstadoMatriculado/Cobranza
  useEffect(() => {
    const handleDescuentoActualizado = (event: CustomEvent<{ oportunidadId: string; costoOfrecido: number }>) => {
      // Solo recargar si el evento es para esta oportunidad
      if (event.detail.oportunidadId === String(oportunidadId)) {
        cargarDatosProducto(true); // Mantener docentes seleccionados
      }
    };

    window.addEventListener("descuentoActualizado", handleDescuentoActualizado as EventListener);

    return () => {
      window.removeEventListener("descuentoActualizado", handleDescuentoActualizado as EventListener);
    };
  }, [oportunidadId]);


  // Manejar clic en tabs
  const handleTabClick = (index: number) => {
    setTabSeleccionado(index);

    // Si se selecciona "Speech" (índice 1), emitir evento para mostrar speech
    if (index === 1) {
      window.dispatchEvent(
        new CustomEvent("mostrarSpeech", {
          detail: { productoId: productoData?.id },
        })
      );
    }
    // Si se selecciona "Ver brochure" (índice 2) y hay URL de brochure, emitir evento
    else if (index === 2 && productoData?.brochure) {
      window.dispatchEvent(
        new CustomEvent("mostrarBrochure", {
          detail: { brochureUrl: productoData.brochure },
        })
      );
    } else {
      // Si se selecciona otro tab, ocultar el brochure y speech
      window.dispatchEvent(
        new CustomEvent("ocultarBrochure", {
          detail: {},
        })
      );
      window.dispatchEvent(
        new CustomEvent("ocultarSpeech", {
          detail: {},
        })
      );
    }
  };

  const detalles: Array<[string, string]> = [
    ["Nombre producto:", productoData?.nombre || "-"],
    ["Código Lanzamiento:", productoData?.codigoLanzamiento || "-"],
    ["Fecha de inicio:", formatearFecha(productoData?.fechaInicio || null)],
    ["Fecha presentación:", formatearFecha(productoData?.fechaPresentacion || null)],
  ];

  // Función para formatear hora de HH:mm:ss a HH:mm am/pm
  const formatearHora = (horaStr: string): string => {
    if (!horaStr) return "-";
    try {
      const [horas, minutos] = horaStr.split(":");
      const hora = parseInt(horas, 10);
      const ampm = hora >= 12 ? "pm" : "am";
      const hora12 = hora > 12 ? hora - 12 : hora === 0 ? 12 : hora;
      return `${hora12}:${minutos}${ampm}`;
    } catch {
      return horaStr;
    }
  };

  // Generar preview de horarios
  const previewHorarios = useMemo(() => {
    if (horariosData.length === 0) {
      return {
        dias: "Sin horarios",
        horas: ""
      };
    }

    // Formato de días
    let diasTexto = "";
    if (horariosData.length === 1) {
      diasTexto = horariosData[0].dia;
    } else if (horariosData.length > 1) {
      // Si son días consecutivos como Lunes-Viernes, mostrar rango
      const dias = horariosData.map(h => h.dia);
      const esConsecutivo = dias.includes("Lunes") && dias.includes("Martes") && dias.includes("Miércoles")
        && dias.includes("Jueves") && dias.includes("Viernes");

      if (esConsecutivo && horariosData.length === 5) {
        diasTexto = "Lunes a Viernes";
      } else {
        diasTexto = dias.join(", ");
      }
    }

    const horaInicio = formatearHora(horariosData[0].horaInicio);
    const horaFin = formatearHora(horariosData[0].horaFin);

    return {
      dias: diasTexto,
      horas: `${horaInicio} -> ${horaFin}`
    };
  }, [horariosData]);

  // Generar preview de inversión
  const previewInversion = useMemo(() => {
    if (inversionesData.length === 0) {
      return null;
    }

    const inversion = inversionesData[0];
    const costoBase = inversion.costoTotal;
    const porcentajeDescuento = inversion.descuentoPorcentaje;
    const costoConDescuento = inversion.costoOfrecido;
    const tieneDescuento = porcentajeDescuento > 0;

    return {
      costoBase,
      porcentajeDescuento,
      costoConDescuento,
      moneda: inversion.moneda,
      tieneDescuento
    };
  }, [inversionesData]);

  // Generar preview de docentes (lista única de docentes)
  const previewDocentes = useMemo(() => {
    if (docentesData.length === 0) {
      return [];
    }

    // Obtener docentes únicos por idDocente
    const docentesUnicos = docentesData.reduce((acc, docente) => {
      if (!acc.find(d => d.idDocente === docente.idDocente)) {
        acc.push(docente);
      }
      return acc;
    }, [] as DocentePorModulo[]);

    return docentesUnicos;
  }, [docentesData]);

  // Inicializar docentes seleccionados cuando se cargan los datos (solo la primera vez)
  useEffect(() => {
    if (previewDocentes.length > 0 && !docentesInicializados) {
      // Seleccionar los primeros 3 docentes por defecto
      setDocentesSeleccionados(previewDocentes.slice(0, 3));
      setDocentesInicializados(true);
    }
  }, [previewDocentes, docentesInicializados]);

  // Manejar el guardado de docentes seleccionados desde el modal
  const handleSaveDocentes = (docentes: any[]) => {
    setDocentesSeleccionados(docentes as DocentePorModulo[]);
  };

  // Docentes a mostrar en la vista previa
  const docentesParaMostrar = docentesSeleccionados;

  const closeModal = () => {
    setOpenModal(null);
  };

  const clickableBoxStyle: React.CSSProperties = useMemo(
    () => ({
      borderRadius: 6,
      border: "1px solid #DCDCDC",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 12px",
      background: "#fff",
      transition: "background 0.15s ease",
    }),
    []
  );

  const arrowStyle: React.CSSProperties = {
    color: "#A3A3A3",
    fontSize: 13,
    marginLeft: 8,
    flexShrink: 0,
  };

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const handleScroll = () => {};
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={styles.container}>
      <Title level={5} className={styles.title}>
        Información del Producto
      </Title>

      {/* === Contenedor plomo === */}
      <div className={styles.outerContainer}>
        {/* === Tabs === */}
        <Row gutter={6} className={styles.tabsRow}>
          {tabs.map((tab, i) => (
            <Col flex={1} key={tab}>
              <div
                onClick={() => handleTabClick(i)}
                style={{
                  backgroundColor: i === tabSeleccionado ? "#252C35" : "#FFFFFF",
                  textAlign: "center",
                  borderRadius: 8,
                  boxShadow: "1px 1px 2px rgba(0,0,0,0.12)",
                  border: i === tabSeleccionado ? "none" : "1px solid #EAEAEA",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  padding: "6px 8px",
                }}
                onMouseEnter={(e) => {
                  if (i !== tabSeleccionado) {
                    e.currentTarget.style.backgroundColor = "#F5F5F5";
                  }
                }}
                onMouseLeave={(e) => {
                  if (i !== tabSeleccionado) {
                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                  }
                }}
              >
                <Text
                  style={{
                    color: i === tabSeleccionado ? "#FFFFFF" : "#0D0C11",
                    fontSize: 13,
                  }}
                >
                  {tab}
                </Text>
              </div>
            </Col>
          ))}
        </Row>

        {/* === Contenido blanco === */}
        <Card
          ref={cardRef}
          className={styles.contentCard}
          bodyStyle={{ padding: 12 }}
        >
          {/* === Spinner de carga === */}
          {loading ? (
            <div className={styles.loadingContainer}>
              <Spin size="large" />
            </div>
          ) : (
            /* === Contenido de Producto actual === */
            <div>
              <Space direction="vertical" style={{ width: "100%" }} size={4}>
              {detalles.map(([label, value]) => (
                <div key={label}>
                  <Row justify="start" align="middle" gutter={6}>
                    <Col>
                      <Text type="secondary">{label}</Text>
                    </Col>
                    <Col>
                      <Text strong>{value}</Text>
                    </Col>
                  </Row>
                  <Divider style={{ margin: "4px 0" }} />
                </div>
              ))}

              {/* === Horarios === */}
              <Row align="top" gutter={6}>
                <Col>
                  <Text type="secondary">Horarios:</Text>
                </Col>
                <Col flex={1}>
                  <div
                    onClick={() => setOpenModal("horarios")}
                    style={clickableBoxStyle}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F7F7F7")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#FFFFFF")
                    }
                  >
                    <div style={{ lineHeight: "1.5" }}>
                      {horariosData.length === 0 ? (
                        <Text style={{ fontSize: 13 }}>Sin horarios</Text>
                      ) : (
                        <>
                          <Text style={{ fontSize: 13, display: "block" }}>
                            {previewHorarios.dias}
                          </Text>
                          <Text style={{ fontSize: 13, display: "block" }}>
                            {previewHorarios.horas} PE
                          </Text>
                        </>
                      )}
                    </div>
                    <RightOutlined style={arrowStyle} />
                  </div>
                </Col>
              </Row>

              <Divider style={{ margin: "4px 0" }} />

              {/* === Inversión === */}
              <Row align="top" gutter={6}>
                <Col>
                  <Text type="secondary">Inversión:</Text>
                </Col>
                <Col flex={1}>
                  {previewInversion ? (
                    <div style={{ lineHeight: "1.5" }}>
                      <Text style={{ fontSize: 13, display: "block", color: "#595959" }}>
                        Costo base: {previewInversion.moneda} {Math.round(previewInversion.costoBase)}
                      </Text>
                      <Text style={{ fontSize: 13, display: "block", color: previewInversion.tieneDescuento ? "#52c41a" : "#000", fontWeight: 500 }}>
                        Costo ofrecido: {previewInversion.moneda} {Math.round(previewInversion.costoConDescuento)}
                        {previewInversion.tieneDescuento && ` (${previewInversion.porcentajeDescuento}% desc.)`}
                      </Text>
                    </div>
                  ) : (
                    <Text style={{ fontSize: 13 }}>Sin inversión definida</Text>
                  )}
                </Col>
              </Row>

              <Divider style={{ margin: "4px 0" }} />

              {/* === Curricular === */}
              <Row align="top" gutter={6}>
                <Col>
                  <Text type="secondary">Estructura curricular:</Text>
                </Col>
                <Col flex={1}>
                  {estructurasData.length > 0 ? (
                    <div>
                      <Text style={{ fontSize: 13 }}>
                        {estructurasData[0].nombre}
                      </Text>
                      {estructuraModulosData.length > 0 && (
                        <div style={{ marginTop: 6 }}>
                          {estructuraModulosData.map((modulo, index) => (
                            <div key={modulo.id || index} style={{ marginBottom: 4 }}>
                              <Text style={{ fontSize: 12, color: "#595959" }}>
                                • {modulo.modulo.nombre}
                              </Text>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Text style={{ fontSize: 13 }}>Sin estructura curricular</Text>
                  )}
                </Col>
              </Row>

              <Divider style={{ margin: "4px 0" }} />

              {/* === Docentes === */}
              <Row align="top" gutter={6}>
                <Col>
                  <Text type="secondary">Docentes:</Text>
                </Col>
                <Col flex={1}>
                  <div
                    onClick={() => setOpenModal("docentes")}
                    style={clickableBoxStyle}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F7F7F7")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#FFFFFF")
                    }
                  >
                    <div style={{ lineHeight: "1.5" }}>
                      {docentesParaMostrar.length === 0 ? (
                        <Text style={{ fontSize: 13 }}>Sin docentes</Text>
                      ) : (
                        docentesParaMostrar.map((docente, index) => (
                          <Text key={docente.idDocente} style={{ fontSize: 13, display: "block" }}>
                            {docente.docenteNombre}
                            {index < docentesParaMostrar.length - 1 && <br />}
                          </Text>
                        ))
                      )}
                    </div>
                    <RightOutlined style={arrowStyle} />
                  </div>
                </Col>
              </Row>

              <Divider style={{ margin: "4px 0" }} />

              {/* === Certificado === */}
              <Row align="top" gutter={6}>
                <Col>
                  <Text type="secondary">Certificado:</Text>
                </Col>
                <Col flex={1}>
                  {certificadosData.length > 0 ? (
                    <div>
                      {certificadosData.map((certificado, index) => (
                        <Text key={certificado.id} style={{ fontSize: 13, display: "block" }}>
                          {certificado.nombreCertificado}
                          {index < certificadosData.length - 1 && <br />}
                        </Text>
                      ))}
                    </div>
                  ) : (
                    <Text style={{ fontSize: 13 }}>Sin certificados</Text>
                  )}
                </Col>
              </Row>

              <Divider style={{ margin: "4px 0" }} />

              {/* === Método Pago === */}
              <Row align="top" gutter={6}>
                <Col>
                  <Text type="secondary">Método de pago:</Text>
                </Col>
                <Col flex={1}>
                  {metodosPagoData.length > 0 ? (
                    <Text style={{ fontSize: 13 }}>
                      {metodosPagoData.map(mp => mp.nombreMetodoPago).join(" – ")}
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 13 }}>Sin métodos de pago</Text>
                  )}
                </Col>
              </Row>

              <Divider style={{ margin: "4px 0" }} />

              {/* === Beneficios === */}
              <Row align="top" gutter={6}>
                <Col>
                  <Text type="secondary">Beneficios:</Text>
                </Col>
                <Col flex={1}>
                  {beneficiosData.length > 0 ? (
                    <Text style={{ fontSize: 13 }}>
                      {beneficiosData.map(b => b.descripcion).join(" – ")}
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 13 }}>Sin beneficios</Text>
                  )}
                </Col>
              </Row>

              <Divider style={{ margin: "4px 0" }} />

              {/* === Datos importantes === */}
              <Row align="top" gutter={6}>
                <Col>
                  <Text type="secondary">Datos importantes:</Text>
                </Col>
                <Col flex={1}>
                  <Text style={{ fontSize: 13 }}>
                    Sesiones en vivo; incluye materiales y grabaciones.
                  </Text>
                </Col>
              </Row>
            </Space>
            </div>
          )}
        </Card>
      </div>

      {/* === Modales === */}
      <ModalHorarios
        open={openModal === "horarios"}
        onClose={closeModal}
        fechaInicio={productoData?.fechaInicio}
        fechaFin={productoData?.fechaFin}
        horarios={horariosData}
      />
      <ModalDocentes
        open={openModal === "docentes"}
        onClose={closeModal}
        docentes={previewDocentes}
        onSave={handleSaveDocentes}
      />
    </div>
  );
};

export default InformacionProducto;
