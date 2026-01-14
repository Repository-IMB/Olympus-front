import { useState, useEffect, useMemo } from "react";
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

const SalesCard = ({ 
  sale, 
  highlightedId 
}: { 
  sale: Opportunity; 
  highlightedId: string | null; 
}) => {
  const navigate = useNavigate();
  
  // Verificamos si este es el card que debe resaltarse
  const isHighlighted = highlightedId === sale.id.toString();

  const handleClick = () => {
    // Guardamos el ID para hacer scroll al volver
    sessionStorage.setItem("lastViewedLeadId", sale.id.toString());
    navigate(`/leads/oportunidades/${sale.id}`);
  };

  const getReminderColor = (fechaRecordatorio: string): string => {
    const now = new Date();
    const reminderDate = new Date(fechaRecordatorio);
    const timeDifference = reminderDate.getTime() - now.getTime();
    const hoursRemaining = timeDifference / (1000 * 60 * 60);

    if (hoursRemaining <= 0) return "#bfbfbf";
    if (hoursRemaining <= 5) return "#ff4d4f";
    if (hoursRemaining < 24) return "#ffd666";
    return "#1677ff";
  };

  const recordatoriosVisibles = useMemo(() => {
    return [...(sale.recordatorios || [])]
      .filter((r) => r?.fecha)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .slice(0, 3);
  }, [sale.recordatorios]);

  return (
    <Card
      id={`card-${sale.id}`}
      size="small"
      className="client-card"
      onClick={handleClick}
      style={{ 
        cursor: "pointer",
        border: isHighlighted ? "2px solid #1677ff" : "1px solid #f0f0f0",
        backgroundColor: isHighlighted ? "#e6f7ff" : "#ffffff",
        transition: "all 0.3s ease",
        transform: isHighlighted ? "scale(1.02)" : "scale(1)",
        boxShadow: isHighlighted ? "0 4px 12px rgba(22, 119, 255, 0.3)" : undefined
      }}
    >
      <div className="client-name" style={{ fontWeight: isHighlighted ? "bold" : "normal" }}>
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
};

const { Content } = Layout;

// =========================
// MAIN
// =========================

export default function SalesProcess() {
  const [activeFilter, setActiveFilter] = useState("todos");
  const [isSelectClientModalVisible, setIsSelectClientModalVisible] = useState(false);
  const navigate = useNavigate();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const [salesData, setSalesData] = useState<Record<string, Opportunity[]>>({
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
  });
  
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

  useEffect(() => {
    if (!idUsuario || !idRol) {
      setLoading(false);
      return;
    }

    const fetchSalesProcess = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/api/VTAModVentaOportunidad/ObtenerSalesProcess", { params: { idUsuario, idRol } });
        console.log("📦 RESPUESTA DEL BACKEND:", res.data);
        if (res.data.salesData && res.data.salesData.registrado && res.data.salesData.registrado.length > 0) {
            console.log("🕵️‍♂️ Primer cliente registrado:", res.data.salesData.registrado[0]);
            console.log("🌍 País detectado:", res.data.salesData.registrado[0].nombrePais);
        }
        setSalesData(res.data.salesData || {});
        setOtrosEstados(res.data.otrosEstados || {});
      } catch (e: any) {
        console.error("Error SalesProcess", e);
        setError(e?.response?.data?.mensaje ?? "Error al obtener SalesProcess");
      } finally {
        setLoading(false);
      }
    };
    fetchSalesProcess();
  }, [idUsuario, idRol]);

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

  const getFilteredData = () => activeFilter === "todos" ? Object.values(otrosEstados).flat() : otrosEstados[activeFilter as keyof typeof otrosEstados] || [];

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}><Spin size="large" /></div>;
  if (error) return <Alert message="Error" description={error} type="error" showIcon />;

  return (
    <Layout style={{ height: "100vh" }}>
      <Content style={{ padding: "20px", background: "#f5f5f5" }}>
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          {userRole !== "Asesor" && (
            <Button onClick={() => setIsSelectClientModalVisible(true)}>Agregar Oportunidad</Button>
          )}
          <Button type="primary" style={{ background: "#1f1f1f", borderColor: "#1f1f1f", borderRadius: "6px" }}>Vista de Proceso</Button>
          <Button style={{ borderRadius: "6px" }} onClick={() => navigate("/leads/Opportunities")}>Vista de Tabla</Button>
        </div>

        <SelectClient visible={isSelectClientModalVisible} onClose={() => setIsSelectClientModalVisible(false)} />

        <div className="content-wrapper">
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "600", marginBottom: "20px" }}>Proceso de Ventas</h1>
          <div className="sales-section">
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
            <div className="other-states-grid">
              {activeFilter === "todos" ? (
                Object.entries(otrosEstados).filter(([estado]) => estado !== "noCalificado" && estado !== "seguimiento").map(([estado, items]) => (
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