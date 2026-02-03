import { useState, useEffect, useMemo, useRef, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ClipboardList, MapPin } from "lucide-react";
import { Button, Card, Badge, Layout, Spin, Alert } from "antd";
import SelectClient from "../SelectClient/SelectClient";
import "./SalesProcess.css";
import { getCookie } from "../../utils/cookies";
import { jwtDecode } from "jwt-decode";
import api from "../../servicios/api";

// =========================
// TYPES
// =========================

interface Recordatorio {
  idRecordatorio: number;
  fecha: string;
}

interface Opportunity {
  id: number;
  personaNombre: string;
  nombreEstado: string;
  nombreOcurrencia: string;
  productoNombre: string;
  fechaCreacion: string;
  // ✅ El dato ahora viene directo del Backend (DTO modificado)
  nombrePais?: string; 
  recordatorios: Recordatorio[];
}

interface TokenData {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
}

// =========================
// SALES CARD (LIMPIO Y RÁPIDO)
// =========================

// ✅ Función de color de recordatorio fuera del componente (se calcula una sola vez)
const getReminderColor = (fechaRecordatorio: string): string => {
  const now = Date.now();
  const reminderDate = new Date(fechaRecordatorio).getTime();
  const hoursRemaining = (reminderDate - now) / (1000 * 60 * 60);

  if (hoursRemaining <= 0) return "#bfbfbf"; // pasado
  if (hoursRemaining <= 5) return "#ff4d4f"; // rojo
  if (hoursRemaining < 24) return "#ffd666"; // amarillo
  return "#1677ff"; // azul
};

const SalesCard = memo(({ sale, highlightedId }: { sale: Opportunity; highlightedId: string | null }) => {
  const navigate = useNavigate();
  
  const isHighlighted = highlightedId === sale.id.toString();

  const handleClick = () => {
    sessionStorage.setItem("lastViewedLeadId", sale.id.toString());
    navigate(`/leads/oportunidades/${sale.id}`);
  };

  // ✅ MOSTRAR SIEMPRE hasta 3 (sin filtrar por activos) - optimizado
  const recordatoriosVisibles = useMemo(() => {
    if (!sale.recordatorios?.length) return [];
    return sale.recordatorios
      .filter((r) => r?.fecha)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .slice(0, 3);
  }, [sale.recordatorios]);

  return (
    <Card
      id={`card-${sale.id}`}
      size="small"
      className={`client-card ${isHighlighted ? "client-card-highlighted" : ""}`}
      onClick={handleClick}
      style={{ cursor: "pointer" }}
    >
      <div className="client-name">
        {sale.personaNombre}
      </div>

      <div className="client-price">{sale.productoNombre}</div>

      {/* ✅ RENDERING DIRECTO SIN PETICIONES EXTRA */}
      <div 
        className="client-country" 
        style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "6px", 
            color: "#64748b", 
            fontSize: "12px",
            marginTop: "4px",
            marginBottom: "4px"
        }}
      >
        <MapPin size={12} />
        <span>{sale.nombrePais || "Sin país"}</span>
      </div>

      <div className="client-date">
        <Calendar size={14} />{" "}
        <span>{new Date(sale.fechaCreacion).toLocaleDateString()}</span>
      </div>

      {recordatoriosVisibles.map((r) => (
        <div
          key={r.idRecordatorio}
          style={{
            marginTop: "8px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: getReminderColor(r.fecha),
            color: "#ffffff",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          <ClipboardList size={12} />
          <span>
            Recordatorio:{" "}
            {new Date(r.fecha).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}{" "}
            {new Date(r.fecha).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </span>
        </div>
      ))}
    </Card>
  );
});

SalesCard.displayName = 'SalesCard';

const { Content } = Layout;

// =========================
// MAIN
// =========================

export default function SalesProcess() {
  const [activeFilter, setActiveFilter] = useState("todos");
  const [isSelectClientModalVisible, setIsSelectClientModalVisible] =
    useState(false);

  // Función para obtener altura inicial según el tamaño de pantalla
  const getInitialHeight = () => {
    const width = window.innerWidth;
    if (width < 600) return 250; // Mobile
    if (width < 768) return 280; // Tablet vertical
    if (width < 1024) return 320; // Tablet horizontal
    return 350; // Desktop
  };

  // Estados para el redimensionamiento vertical
  const [salesSectionHeight, setSalesSectionHeight] = useState(getInitialHeight());
  const [isResizing, setIsResizing] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef({
    startY: 0,
    startHeight: 0,
    rafId: null as number | null,
    currentHeight: 0
  });

  const navigate = useNavigate();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  /* const [salesData, setSalesData] = useState<Record<string, Opportunity[]>>({
    registrado: [],
    calificado: [],
    potencial: [],
    promesa: [],
  });

  const [otrosEstados, setOtrosEstados] = useState<Record<string, Opportunity[]>>({
    coorporativo: [],
    ventaCruzada: [],
    seguimiento: [],
    perdido: [],
    noCalificado: [],
    cobranza: [],
    convertido: [],
  }); */
  
  // Estado para las oportunidades
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  const token = getCookie("token");

  // Recuperar ID para scroll
  useEffect(() => {
    const lastId = sessionStorage.getItem("lastViewedLeadId");
    if (lastId) setHighlightedId(lastId);
  }, []);

  // Efecto Scroll
  useEffect(() => {
    if (!loading && highlightedId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`card-${highlightedId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [loading, highlightedId, activeFilter]); 

  const { idUsuario, idRol } = useMemo(() => {
    let idU = 0;
    let rolN = "";
    let idR = 0;
    if (!token) return { idUsuario: 0, idRol: 0, rolNombre: "" };

    try {
      const decoded = jwtDecode<TokenData>(token);
      idU = parseInt(decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || "0");
      rolN = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "";

      const rolesMap: Record<string, number> = {
        Asesor: 1, Supervisor: 2, Gerente: 3, Administrador: 4, Desarrollador: 5,
      };
      idR = rolesMap[rolN] ?? 0;
    } catch (e) {
      console.error("Error al decodificar token", e);
    }
    console.log("🔍 USUARIO:", { idUsuario: idU, idRol: idR, tokenExists: !!token });
    return { idUsuario: idU, idRol: idR, rolNombre: rolN };
  }, [token]);

  useEffect(() => {
    const t = getCookie("token");
    if (!t) return;
    try {
      const decoded = jwtDecode<TokenData>(t);
      const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "";
      setUserRole(String(role));
    } catch (err) {
      console.error("Error decodificando token (rol):", err);
    }
  }, []);

  // =========================
  // FETCH + AGRUPAR RECORDATORIOS (OPTIMIZADO)
  // =========================
useEffect(() => {
  if (!idUsuario || !idRol) {
    setLoading(false);
    return;
  }

  const fetchSalesProcess = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 SalesProcess - Parámetros:", { idUsuario, idRol });

      const res = await api.get(
        "/api/VTAModVentaOportunidad/ObtenerOportunidadesPaginadas",
        {
          params: {
            idUsuario,
            idRol,
            page: 1,
            pageSize: 1000, // Traer muchos registros para vista de proceso
            search: null,
            estadoFiltro: null,
            asesorFiltro: null,
            fechaInicio: null,
            fechaFin: null
          }
        }
      );

      console.log("✅ SalesProcess - Respuesta completa:", res.data);
      console.log("📊 SalesProcess - Oportunidades recibidas:", res.data?.oportunidad);

        const raw = res.data?.oportunidad || [];

        console.log("📦 Total registros recibidos:", raw.length);

        // ✅ Mapear directamente - el endpoint paginado ya devuelve 1 registro por oportunidad
        const opportunitiesList: Opportunity[] = raw.map((op: any) => {
          // Parsear recordatorios del JSON
          let recordatorios: Recordatorio[] = [];

          if (op.recordatoriosJson) {
            try {
              const parsed = JSON.parse(op.recordatoriosJson);
              recordatorios = parsed.map((r: any) => ({
                idRecordatorio: r.IdRecordatorio ?? r.idRecordatorio ?? 0,
                fecha: r.FechaRecordatorio ?? r.fechaRecordatorio ?? "",
              }));

              // Ordenar por fecha
              recordatorios.sort(
                (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
              );
            } catch (e) {
              console.error("Error parseando recordatorios para oportunidad", op.id, e);
              recordatorios = [];
            }
          }

          // Si nombreOcurrencia no viene, usar un valor por defecto basado en nombreEstado
          let nombreOcurrencia = op.nombreOcurrencia ?? op.ocurrencia ?? "";

          if (!nombreOcurrencia) {
            // Inferir ocurrencia si no viene
            const estado = op.nombreEstado ?? "";
            if (estado === "Promesa") {
              nombreOcurrencia = "Normal"; // Valor por defecto para promesas normales
            }
          }

          return {
            id: Number(op.id ?? 0),
            personaNombre: op.personaNombre ?? "",
            nombreEstado: op.nombreEstado ?? "",
            nombreOcurrencia,
            productoNombre: op.productoNombre ?? "",
            fechaCreacion: op.fechaCreacion ?? "",
            recordatorios,
          };
        });

        console.log("✅ Oportunidades procesadas:", opportunitiesList.length);

        setOpportunities(opportunitiesList);
      } catch (e: any) {
        console.error("❌ Error al obtener oportunidades:", e);
        console.error("❌ Error response:", e?.response);
        console.error("❌ Error data:", e?.response?.data);
        setError(
          e?.response?.data?.message ??
          "Error al obtener SalesProcess"
      );
    } finally {
      setLoading(false);
    }
  }

    fetchSalesProcess();
    fetchSalesProcess();
  }, [idUsuario, idRol]);


  // =========================
  // RESPONSIVE: Ajustar altura al redimensionar ventana
  // =========================
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let maxHeight = 800;
      let minHeight = 200;

      // Ajustar límites según el tamaño de pantalla
      if (width < 600) {
        maxHeight = 500;
        minHeight = 250;
      } else if (width < 768) {
        maxHeight = 600;
        minHeight = 300;
      } else if (width < 1024) {
        maxHeight = 700;
        minHeight = 300;
      }

      // Ajustar altura actual si excede los nuevos límites
      setSalesSectionHeight(prev => Math.max(minHeight, Math.min(maxHeight, prev)));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // =========================
  // REDIMENSIONAMIENTO
  // =========================
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    resizeRef.current = {
      ...resizeRef.current,
      startY: clientY,
      startHeight: salesSectionHeight
    };
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();

      // Cancelar animación anterior si existe
      if (resizeRef.current.rafId !== null) {
        cancelAnimationFrame(resizeRef.current.rafId);
      }

      // Usar requestAnimationFrame para actualizar suavemente
      resizeRef.current.rafId = requestAnimationFrame(() => {
        if (!sectionRef.current) return;

        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        // Límites dinámicos según el ancho de pantalla
        const width = window.innerWidth;
        let maxHeight = 800;
        let minHeight = 200;

        if (width < 600) {
          maxHeight = 500;
          minHeight = 250;
        } else if (width < 768) {
          maxHeight = 600;
          minHeight = 300;
        } else if (width < 1024) {
          maxHeight = 700;
          minHeight = 300;
        }

        const delta = clientY - resizeRef.current.startY;
        const newHeight = Math.max(minHeight, Math.min(maxHeight, resizeRef.current.startHeight + delta));

        // Actualizar DOM directamente sin re-render
        sectionRef.current.style.height = `${newHeight}px`;
        resizeRef.current.currentHeight = newHeight;
      });
    };

    const handleEnd = () => {
      // Cancelar cualquier animación pendiente
      if (resizeRef.current.rafId !== null) {
        cancelAnimationFrame(resizeRef.current.rafId);
        resizeRef.current.rafId = null;
      }

      // Actualizar el estado React SOLO al final
      setSalesSectionHeight(resizeRef.current.currentHeight);

      setIsResizing(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    window.addEventListener("mousemove", handleMove, { passive: false });
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      // Limpiar en caso de desmontaje
      if (resizeRef.current.rafId !== null) {
        cancelAnimationFrame(resizeRef.current.rafId);
      }

      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isResizing]);

  // =========================
  // CATEGORIZAR (OPTIMIZADO)
  // =========================
  const categorizedData = useMemo(() => {
    const MAX_PER_CATEGORY = 100;

    const initialSalesData: { [key: string]: Opportunity[] } = {
      registrado: [],
      calificado: [],
      potencial: [],
      promesa: [],
    };

    const initialOtrosEstados: { [key: string]: Opportunity[] } = {
      coorporativo: [],
      ventaCruzada: [],
      seguimiento: [],
      perdido: [],
      noCalificado: [],
      cobranza: [],
      convertido: [],
    };

    // ✅ Comparador pre-calculado fuera del loop
    const sortByFechaDesc = (a: Opportunity, b: Opportunity) =>
      new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();

    // ✅ Categorizar y contar en un solo paso
    const counts: { [key: string]: number } = {
      registrado: 0, calificado: 0, potencial: 0, promesa: 0,
      coorporativo: 0, ventaCruzada: 0, seguimiento: 0, perdido: 0,
      noCalificado: 0, cobranza: 0, convertido: 0,
    };

    let sinClasificar = 0;

    for (const op of opportunities) {
      let targetArray: Opportunity[] | null = null;
      let targetKey: string | null = null;

      // Determinar categoría
      if (op.nombreEstado === "Registrado") {
        targetArray = initialSalesData.registrado;
        targetKey = "registrado";
      } else if (op.nombreEstado === "Potencial") {
        targetArray = initialSalesData.potencial;
        targetKey = "potencial";
      } else if (op.nombreEstado === "Promesa") {
        if (op.nombreOcurrencia === "Corporativo") {
          targetArray = initialOtrosEstados.coorporativo;
          targetKey = "coorporativo";
        } else {
          targetArray = initialSalesData.promesa;
          targetKey = "promesa";
        }
      } else if (op.nombreEstado === "Calificado") {
        targetArray = initialSalesData.calificado;
        targetKey = "calificado";
      } else if (op.nombreOcurrencia === "Cobranza") {
        targetArray = initialOtrosEstados.cobranza;
        targetKey = "cobranza";
      } else if (op.nombreOcurrencia === "No Calificado") {
        targetArray = initialOtrosEstados.noCalificado;
        targetKey = "noCalificado";
      } else if (op.nombreOcurrencia === "Venta cruzada") {
        targetArray = initialOtrosEstados.ventaCruzada;
        targetKey = "ventaCruzada";
      } else if (op.nombreOcurrencia === "Seguimiento") {
        targetArray = initialOtrosEstados.seguimiento;
        targetKey = "seguimiento";
      } else if (op.nombreOcurrencia === "Perdido") {
        targetArray = initialOtrosEstados.perdido;
        targetKey = "perdido";
      } else if (op.nombreOcurrencia === "Convertido") {
        targetArray = initialOtrosEstados.convertido;
        targetKey = "convertido";
      }

      // ✅ Agregar solo si no hemos alcanzado el límite
      if (targetArray && targetKey && counts[targetKey] < MAX_PER_CATEGORY) {
        targetArray.push(op);
        counts[targetKey]++;
    } else {
        // 🔴 AQUÍ ES DONDE SE RE-ASIGNA LA VARIABLE
        sinClasificar++; 
        
        // Log solo del primero para no llenar la consola
        if (sinClasificar === 1) {
             console.log("⚠️ PRIMER ITEM SIN CLASIFICAR:", { 
                Estado: op.nombreEstado, 
                Ocurrencia: op.nombreOcurrencia, 
                Nombre: op.personaNombre 
             });
        }
    }
    }

    // ✅ Ordenar y limitar solo las categorías que tienen datos
    for (const key in initialSalesData) {
      if (initialSalesData[key].length > 0) {
        initialSalesData[key] = initialSalesData[key]
          .sort(sortByFechaDesc)
          .slice(0, MAX_PER_CATEGORY);
      }
    }

    for (const key in initialOtrosEstados) {
      if (initialOtrosEstados[key].length > 0) {
        initialOtrosEstados[key] = initialOtrosEstados[key]
          .sort(sortByFechaDesc)
          .slice(0, MAX_PER_CATEGORY);
      }
    }
    console.log("📊 RESUMEN CATEGORÍAS:", counts);
    console.log("🗑️ TOTAL SIN CLASIFICAR:", sinClasificar);

    return { salesData: initialSalesData, otrosEstados: initialOtrosEstados };
  }, [opportunities]);

  const { salesData, otrosEstados } = categorizedData;

  const filters = useMemo(() => [
      { key: "todos", label: "Todos", count: Object.values(otrosEstados).flat().length },
      { key: "coorporativo", label: "Coorporativo", count: otrosEstados.coorporativo.length },
      { key: "ventaCruzada", label: "Venta Cruzada", count: otrosEstados.ventaCruzada.length },
      { key: "seguimiento", label: "Seguimiento", count: otrosEstados.seguimiento.length },
      { key: "perdido", label: "Perdido", count: otrosEstados.perdido.length },
      { key: "noCalificado", label: "No Calificado", count: otrosEstados.noCalificado.length },
      { key: "cobranza", label: "Cobranza", count: otrosEstados.cobranza.length },
      { key: "convertido", label: "Convertido", count: otrosEstados.convertido.length },
    ], [otrosEstados]);

  // ✅ Memorizar función de filtrado
  const getFilteredData = useCallback(() => {
    if (activeFilter === "todos") {
      return Object.values(otrosEstados).flat().slice(0, 100);
    }
    return otrosEstados[activeFilter as keyof typeof otrosEstados] || [];
  }, [activeFilter, otrosEstados]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}><Spin size="large" /></div>;
  if (error) return <Alert message="Error" description={error} type="error" showIcon />;

  return (
    <Layout style={{ height: "100vh" }}>
      <Content className="sales-process-content" style={{ padding: "20px" }}>
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          {userRole !== "Asesor" && (
            <Button style={{ borderRadius: "6px" }} onClick={() => setIsSelectClientModalVisible(true)}>Agregar Oportunidad</Button>
          )}
          <Button type="primary" style={{ background: "#1f1f1f", borderColor: "#1f1f1f", borderRadius: "6px" }}>Vista de Proceso</Button>
          <Button style={{ borderRadius: "6px" }} onClick={() => navigate("/leads/Opportunities")}>Vista de Tabla</Button>
        </div>

        <SelectClient visible={isSelectClientModalVisible} onClose={() => setIsSelectClientModalVisible(false)} />

        <div className="content-wrapper">
          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: "600",
              marginBottom: "20px",
            }}
          >
            Proceso de Ventas
          </h1>

          {/* Sección principal con altura redimensionable */}
          <div
            ref={sectionRef}
            className={`sales-section resizable-section ${isResizing ? 'is-resizing' : ''}`}
            style={{ height: `${salesSectionHeight}px` }}
          >
            <div className="stages-grid">
              {Object.entries(salesData).map(([stage, items]) => (
                <div key={stage} className={`stage-column ${stage}`}>
                  <div className="stage-header">
                    <span className="stage-title">{stage.charAt(0).toUpperCase() + stage.slice(1)}</span>
                    <Badge count={items.length} style={{ backgroundColor: "#1677ff" }} />
                  </div>
                  <div className={`card-list-container ${stage}`}>
                    {items.map((sale) => (
                      <SalesCard key={sale.id} sale={sale} highlightedId={highlightedId} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divisor de redimensionamiento */}
          <div
            className="resize-handle"
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
          >
            <div className="resize-handle-bar"></div>
          </div>

          {/* =========================
              SECCIÓN DE ABAJO (COMPLETA)
             ========================= */}
          <div className="sales-section">
            <div className="other-states-header">
              <h3>Otras Ocurrencias</h3>
              <span className="total-count">({getFilteredData().length})</span>
            </div>
            <div className="filters-container">
              <div className="filters">
                {filters.map((filtro) => (
                  <Button key={filtro.key} size="small" type={activeFilter === filtro.key ? "primary" : "default"} onClick={() => setActiveFilter(filtro.key)} className={`filter-btn ${activeFilter === filtro.key ? "active" : ""}`}>
                    {`${filtro.label} (${filtro.count})`}
                  </Button>
                ))}
              </div>
            </div>
            <div className={`other-states-grid ${activeFilter === "todos" ? "filter-todos-active" : ""}`}>
              {activeFilter === "todos" ? (
                Object.entries(otrosEstados)
                  .filter(
                    ([estado]) =>
                      estado !== "seguimiento" &&
                      estado !== "coorporativo" &&
                      estado !== "ventaCruzada"
                  )
                  .sort(([estadoA], [estadoB]) => {
                    // Definir el orden deseado
                    const orden = ["noCalificado", "perdido", "cobranza", "convertido"];
                    return orden.indexOf(estadoA) - orden.indexOf(estadoB);
                  })
                  .map(([estado, items]) => (
                    <div key={estado} className="other-state-column">
                      <div className="column-header">
                        <span>{estado.charAt(0).toUpperCase() + estado.slice(1)}</span>
                        <Badge count={items.length} style={{ backgroundColor: "#1677ff" }} />
                      </div>
                      <div className={`state-content ${estado}`}>
                        {items.length > 0 ? items.map((sale) => <SalesCard key={sale.id} sale={sale} highlightedId={highlightedId} />) : <div className="empty-box"></div>}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="other-state-column">
                  <div className="column-header">
                    <span>{activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}</span>
                    <Badge count={getFilteredData().length} style={{ backgroundColor: "#1677ff" }} />
                  </div>
                  <div className={`state-content ${activeFilter}`}>
                    {getFilteredData().length > 0 ? getFilteredData().map((sale) => <SalesCard key={sale.id} sale={sale} highlightedId={highlightedId} />) : <div className="empty-box"></div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
}