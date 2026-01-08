import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ClipboardList } from "lucide-react";
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

// Oportunidad ya AGRUPADA (1 card por oportunidad)
interface Opportunity {
  id: number;
  personaNombre: string;
  nombreEstado: string;
  nombreOcurrencia: string;
  productoNombre: string;
  fechaCreacion: string;

  // ✅ NUEVO
  recordatorios: Recordatorio[];
}

interface TokenData {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
}

// =========================
// SALES CARD
// =========================

const SalesCard = ({ sale }: { sale: Opportunity }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/leads/oportunidades/${sale.id}`);
  };

  // Color basado en tiempo restante (si ya pasó -> gris)
  const getReminderColor = (fechaRecordatorio: string): string => {
    const now = new Date();
    const reminderDate = new Date(fechaRecordatorio);

    const timeDifference = reminderDate.getTime() - now.getTime();
    const hoursRemaining = timeDifference / (1000 * 60 * 60);

    if (hoursRemaining <= 0) return "#bfbfbf"; // pasado
    if (hoursRemaining <= 5) return "#ff4d4f"; // rojo
    if (hoursRemaining < 24) return "#ffd666"; // amarillo
    return "#1677ff"; // azul
  };

  // ✅ MOSTRAR SIEMPRE hasta 3 (sin filtrar por activos)
  const recordatoriosVisibles = useMemo(() => {
    return [...(sale.recordatorios || [])]
      .filter((r) => r?.fecha)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .slice(0, 3);
  }, [sale.recordatorios]);

  return (
    <Card
      size="small"
      className="client-card"
      onClick={handleClick}
      style={{ cursor: "pointer" }}
    >
      <div className="client-name">{sale.personaNombre}</div>

      {/* Usamos productoNombre como el "precio" o identificador del producto */}
      <div className="client-price">{sale.productoNombre}</div>

      <div className="client-date">
        <Calendar size={14} />{" "}
        <span>{new Date(sale.fechaCreacion).toLocaleDateString()}</span>
      </div>

      {/* ✅ 1 a 3 recordatorios dentro del mismo card */}
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
  const [isSelectClientModalVisible, setIsSelectClientModalVisible] =
    useState(false);

  const navigate = useNavigate();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  const token = getCookie("token");

  const { idUsuario, idRol } = useMemo(() => {
    let idU = 0;
    let rolN = "";
    let idR = 0;
    if (!token) return { idUsuario: 0, idRol: 0, rolNombre: "" };

    try {
      const decoded = jwtDecode<TokenData>(token);
      idU = parseInt(
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ] || "0"
      );
      rolN =
        decoded[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ] || "";

      const rolesMap: Record<string, number> = {
        Asesor: 1,
        Supervisor: 2,
        Gerente: 3,
        Administrador: 4,
        Desarrollador: 5,
      };
      idR = rolesMap[rolN] ?? 0;
    } catch (e) {
      console.error("Error al decodificar token (useMemo)", e);
    }

    return { idUsuario: idU, idRol: idR, rolNombre: rolN };
  }, [token]);

  // Rol para el botón "Agregar Oportunidad"
  useEffect(() => {
    const t = getCookie("token");
    if (!t) return;
    try {
      const decoded = jwtDecode<TokenData>(t);
      const role =
        decoded[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ] || "";
      setUserRole(String(role));
    } catch (err) {
      console.error("Error decodificando token (rol):", err);
    }
  }, []);

  // =========================
  // FETCH + AGRUPAR RECORDATORIOS
  // =========================
  useEffect(() => {
    if (!idUsuario || !idRol) {
      setOpportunities([]);
      setLoading(false);
      return;
    }

    const fetchOpportunities = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(
          "/api/VTAModVentaOportunidad/ObtenerTodasConRecordatorio",
          {
            params: {
              idUsuario,
              idRol,
              page: 1,
              pageSize: 100,
            },
          }
        );

        const raw = res.data?.oportunidad || [];
        // ✅ Agrupar por oportunidad para evitar duplicados
        const grouped: Record<number, Opportunity> = {};

        raw.forEach((row: any) => {
          const opportunityId = Number(row.idOportunidad ?? row.id ?? 0);
          if (!opportunityId) return;

          if (!grouped[opportunityId]) {
            grouped[opportunityId] = {
              id: opportunityId,
              personaNombre: row.personaNombre,
              nombreEstado: row.nombreEstado,
              nombreOcurrencia: row.nombreOcurrencia,
              productoNombre: row.productoNombre,
              fechaCreacion: row.fechaCreacion,
              recordatorios: [],
            };
          }

          // ✅ Mapeo tolerante (porque tu backend no siempre se llama igual)
          const idRec =
            row.idHistorialInteraccion ??
            row.idRecordatorio ??
            row.idReminder ??
            row.pnId ??
            row.pnIdHis ??
            row.idHis ??
            null;

          const fecRec =
            row.fechaRecordatorio ??
            row.dFechaRecordatorio ??
            row.fecha ??
            row.reminderDate ??
            row.dFecRec ??
            null;

          // Si viene recordatorio, lo agregamos (sin duplicarlo)
          if (idRec && fecRec) {
            const idR = Number(idRec);
            const fR = String(fecRec);

            const yaExiste = grouped[opportunityId].recordatorios.some(
              (r) => r.idRecordatorio === idR
            );

            if (!yaExiste) {
              grouped[opportunityId].recordatorios.push({
                idRecordatorio: idR,
                fecha: fR,
              });
            }
          }
        });

        // Opcional: ordenar recordatorios internos por fecha asc
        Object.values(grouped).forEach((op) => {
          op.recordatorios.sort(
            (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
          );
        });

        setOpportunities(Object.values(grouped));
      } catch (e: any) {
        console.error("Error al obtener oportunidades", e);
        setError(
          e?.response?.data?.message ??
            e.message ??
            "Error al obtener oportunidades"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, [idUsuario, idRol]);

  // =========================
  // CATEGORIZAR (igual que tu lógica)
  // =========================
  const categorizedData = useMemo(() => {
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

    opportunities.forEach((op) => {
      switch (op.nombreEstado) {
        case "Registrado":
          initialSalesData.registrado.push(op);
          break;
        case "Potencial":
          initialSalesData.potencial.push(op);
          break;
        case "Promesa":
          if (op?.nombreOcurrencia === "Corporativo") {
            initialOtrosEstados.coorporativo.push(op);
          } else {
            initialSalesData.promesa.push(op);
          }
          break;
        case "Calificado":
          initialSalesData.calificado.push(op);
          break;
        default:
          if (op.nombreOcurrencia === "Cobranza") {
            initialOtrosEstados.cobranza.push(op);
          } else if (op.nombreOcurrencia === "No Calificado") {
            initialOtrosEstados.noCalificado.push(op);
          } else if (op.nombreOcurrencia === "Venta cruzada") {
            initialOtrosEstados.ventaCruzada.push(op);
          } else if (op.nombreOcurrencia === "Seguimiento") {
            initialOtrosEstados.seguimiento.push(op);
          } else if (op.nombreOcurrencia === "Perdido") {
            initialOtrosEstados.perdido.push(op);
          } else if (op.nombreOcurrencia === "Convertido") {
            initialOtrosEstados.convertido.push(op);
          } else {
            console.warn(
              `Oportunidad con estado no mapeado: ${op.nombreEstado}`
            );
          }
          break;
      }
    });

    // Ordenar por fechaCreacion desc (igual que tu código)
    const sortByFechaDesc = (a: Opportunity, b: Opportunity) =>
      new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();

    Object.values(initialSalesData).forEach((arr) => {
      arr.sort(sortByFechaDesc);
      arr.splice(100);
    });

    Object.values(initialOtrosEstados).forEach((arr) => {
      arr.sort(sortByFechaDesc);
      arr.splice(100);
    });

    return { salesData: initialSalesData, otrosEstados: initialOtrosEstados };
  }, [opportunities]);

  const { salesData, otrosEstados } = categorizedData;

  // =========================
  // FILTROS (igual)
  // =========================
  const filters = useMemo(
    () => [
      {
        key: "todos",
        label: "Todos",
        count: Object.values(otrosEstados).flat().length,
      },
      {
        key: "coorporativo",
        label: "Coorporativo",
        count: otrosEstados.coorporativo.length,
      },
      {
        key: "ventaCruzada",
        label: "Venta Cruzada",
        count: otrosEstados.ventaCruzada.length,
      },
      {
        key: "seguimiento",
        label: "Seguimiento",
        count: otrosEstados.seguimiento.length,
      },
      { key: "perdido", label: "Perdido", count: otrosEstados.perdido.length },
      {
        key: "noCalificado",
        label: "No Calificado",
        count: otrosEstados.noCalificado.length,
      },
      {
        key: "cobranza",
        label: "Cobranza",
        count: otrosEstados.cobranza.length,
      },
      {
        key: "convertido",
        label: "Convertido",
        count: otrosEstados.convertido.length,
      },
    ],
    [otrosEstados]
  );

  const getFilteredData = () =>
    activeFilter === "todos"
      ? Object.values(otrosEstados).flat()
      : otrosEstados[activeFilter as keyof typeof otrosEstados] || [];

  // =========================
  // LOADING / ERROR (igual)
  // =========================
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  // =========================
  // RENDER COMPLETO (incluye sección de abajo)
  // =========================
  return (
    <Layout style={{ height: "100vh" }}>
      <Content style={{ padding: "20px", background: "#f5f5f5" }}>
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          {userRole !== "Asesor" && (
            <Button onClick={() => setIsSelectClientModalVisible(true)}>
              Agregar Oportunidad
            </Button>
          )}

          <Button
            type="primary"
            style={{
              background: "#1f1f1f",
              borderColor: "#1f1f1f",
              borderRadius: "6px",
            }}
          >
            Vista de Proceso
          </Button>

          <Button
            style={{ borderRadius: "6px" }}
            onClick={() => navigate("/leads/Opportunities")}
          >
            Vista de Tabla
          </Button>
        </div>

        <SelectClient
          visible={isSelectClientModalVisible}
          onClose={() => setIsSelectClientModalVisible(false)}
        />

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

          {/* Sección principal */}
          <div className="sales-section">
            <div className="stages-grid">
              {Object.entries(salesData).map(([stage, items]) => (
                <div key={stage} className={`stage-column ${stage}`}>
                  <div className="stage-header">
                    <span className="stage-title">
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </span>
                    <Badge
                      count={items.length}
                      style={{ backgroundColor: "#1677ff" }}
                    />
                  </div>

                  <div className={`card-list-container ${stage}`}>
                    {items.map((sale) => (
                      <SalesCard key={sale.id} sale={sale} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* =========================
              SECCIÓN DE ABAJO (COMPLETA)
             ========================= */}
          <div className="sales-section">
            <div className="other-states-header">
              <h3>Otras Ocurrencias</h3>
              <span className="total-count">({getFilteredData().length})</span>
            </div>

            {/* Botones de filtros */}
            <div className="filters-container">
              <div className="filters">
                {filters.map((filtro) => (
                  <Button
                    key={filtro.key}
                    size="small"
                    type={activeFilter === filtro.key ? "primary" : "default"}
                    onClick={() => setActiveFilter(filtro.key)}
                    className={`filter-btn ${
                      activeFilter === filtro.key ? "active" : ""
                    }`}
                  >
                    {`${filtro.label} (${filtro.count})`}
                  </Button>
                ))}
              </div>
            </div>

            {/* Contenedor dinámico según filtro */}
            <div className="other-states-grid">
              {activeFilter === "todos" ? (
                Object.entries(otrosEstados)
                  .filter(
                    ([estado]) =>
                      estado !== "noCalificado" && estado !== "seguimiento"
                  )
                  .map(([estado, items]) => (
                    <div key={estado} className="other-state-column">
                      <div className="column-header">
                        <span>
                          {estado.charAt(0).toUpperCase() + estado.slice(1)}
                        </span>
                        <Badge
                          count={items.length}
                          style={{ backgroundColor: "#1677ff" }}
                        />
                      </div>

                      <div className={`state-content ${estado}`}>
                        {items.length > 0 ? (
                          items.map((sale) => (
                            <SalesCard key={sale.id} sale={sale} />
                          ))
                        ) : (
                          <div className="empty-box"></div>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="other-state-column">
                  <div className="column-header">
                    <span>
                      {activeFilter.charAt(0).toUpperCase() +
                        activeFilter.slice(1)}
                    </span>
                    <Badge
                      count={getFilteredData().length}
                      style={{ backgroundColor: "#1677ff" }}
                    />
                  </div>

                  <div className={`state-content ${activeFilter}`}>
                    {getFilteredData().length > 0 ? (
                      getFilteredData().map((sale) => (
                        <SalesCard key={sale.id} sale={sale} />
                      ))
                    ) : (
                      <div className="empty-box"></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* ========================= */}
        </div>
      </Content>
    </Layout>
  );
}
