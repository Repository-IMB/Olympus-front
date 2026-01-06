import React, { useEffect, useState } from "react";
import { CalendarOutlined, FileTextOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";

type Lead = {
  id: number;
  nombre: string;
  pais: string;
  programa: string;
  fechaISO: string;
  hora?: string;
  etapa: string;
  recordatorios?: { fecha: string; hora?: string }[];
};

const etapasProceso = ["Registrado", "Calificado", "Potencial", "Promesa"];
const etapasOtros = ["Pendiente", "Cliente", "No calificado", "Perdido"];

const colorLinea = (etapa: string) => {
  const e = etapa.toLowerCase();
  if (["pendiente", "no calificado", "perdido"].includes(e)) return "#ef4444";
  if (["cliente"].includes(e)) return "#22c55e";
  return "#3b82f6";
};

export default function VistaLeads() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [filtroOtros, setFiltroOtros] = useState<string>("Todos");
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const obtenerOportunidades = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) {
          console.warn("⚠️ No se encontró el token en las cookies");
          return;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/VTAModVentaOportunidad/ObtenerTodasConDetalle`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const oportunidadesRaw = response.data?.oportunidad ?? [];

        const oportunidadesFormateadas: Lead[] = oportunidadesRaw.map((o: any) => {
          const fecha = new Date(o.fechaCreacion);
          const hora = fecha.toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
          });

          // === Etapa según idEstado
          let etapa = "Sin estado";
          const idEstado = o.historialEstado?.idEstado;
          if (idEstado === 1) etapa = "Pendiente";
          else if (idEstado === 2) etapa = "Registrado";
          else if (idEstado === 3) etapa = "Calificado";
          else if (idEstado === 4) etapa = "Potencial";
          else if (idEstado === 5) etapa = "Promesa";
          else if (idEstado === 6) etapa = "Cliente";
          else if (idEstado === 7) etapa = "No calificado";
          else if (idEstado === 8) etapa = "Perdido";

          // === Recordatorios (TODOS los de tipo "Recordatorio")
          const recordatorios = (o.historialInteraccion || [])
            .filter((h: any) => h.tipo === "Recordatorio" && h.fechaRecordatorio)
            .map((h: any) => {
              const d = new Date(h.fechaRecordatorio);
              return {
                fecha: d.toISOString(),
                hora: d.toLocaleTimeString("es-PE", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              };
            })
            .sort(
              (a: { fecha: string | number | Date; }, b: { fecha: string | number | Date; }) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
            );

          return {
            id: o.id,
            nombre: `${o.personaNombres ?? ""} ${o.personaApellidos ?? ""}`.trim(),
            pais: "Perú",
            programa: o.codigoLanzamiento ?? "-",
            fechaISO: o.fechaCreacion,
            hora,
            etapa,
            recordatorios,
          };
        });

        setLeads(oportunidadesFormateadas);
      } catch (error) {
        console.error("Error al obtener leads:", error);
      }
    };

    obtenerOportunidades();
  }, []);

  // === Reutilizamos el render que ya tienes ===
  const getLeadsByEtapa = (etapa: string) =>
    leads
      .filter((l) => l.etapa.toLowerCase() === etapa.toLowerCase())
      .sort((a, b) => new Date(b.fechaISO).getTime() - new Date(a.fechaISO).getTime());

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  };

  const RenderEtapas = (etapas: string[], filtro?: string) => {
    const etapasFiltradas =
      filtro && filtro !== "Todos" ? [filtro] : etapas;

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 16,
        }}
      >
        {etapasFiltradas.map((etapa) => {
          const leadsEtapa = getLeadsByEtapa(etapa);
          const color = colorLinea(etapa);

          return (
            <div
              key={etapa}
              style={{
                background: "#f9fafb",
                borderRadius: 10,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                maxHeight: isMobile ? 300 : 420,
              }}
            >
              {/* === Título + contador === */}
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#1e293b",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 14,
                  }}
                >
                  <span>{etapa}</span>
                  <span
                    style={{
                      background: "#e2e8f0",
                      borderRadius: 999,
                      padding: "2px 8px",
                      fontSize: 12,
                      color: "#334155",
                    }}
                  >
                    {leadsEtapa.length}
                  </span>
                </div>
                <div
                  style={{
                    height: 3,
                    background: color,
                    borderRadius: 999,
                    marginTop: 4,
                    width: "100%",
                  }}
                />
              </div>

              {/* === Cards de leads === */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  overflowY: "auto",
                  paddingRight: 4,
                }}
              >
                {leadsEtapa.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#9ca3af",
                      fontSize: 13,
                      padding: 16,
                    }}
                  >
                    Sin leads asignados
                  </div>
                ) : (
                  leadsEtapa.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() =>
                        navigate(`/leads/oportunidad/${lead.id}`)
                      }
                      style={{
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        padding: 10,
                        cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.boxShadow =
                          "0 4px 10px rgba(0,0,0,0.08)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.boxShadow =
                          "0 1px 3px rgba(0,0,0,0.05)")
                      }
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#0f172a",
                          fontSize: 14,
                        }}
                      >
                        {lead.nombre}
                      </div>
                      <div style={{ color: "#475569", fontSize: 13 }}>
                        {lead.pais}
                      </div>
                      <div style={{ color: "#475569", fontSize: 13 }}>
                        {lead.programa}
                      </div>
                      <div
                        style={{
                          color: "#334155",
                          fontSize: 13,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <CalendarOutlined /> {formatDate(lead.fechaISO)}{" "}
                        {lead.hora && `(${lead.hora})`}
                      </div>

                      {lead.recordatorios &&
                        lead.recordatorios.length > 0 && (
                          <div
                            style={{
                              marginTop: 8,
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            {lead.recordatorios.map((rec, idx) => (
                              <div
                                key={idx}
                                style={{
                                  background: "#3b82f6",
                                  color: "#fff",
                                  borderRadius: 6,
                                  padding: "4px 8px",
                                  fontSize: 12,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <FileTextOutlined />
                                Recordatorio: {formatDate(rec.fecha)}{" "}
                                {rec.hora && `(${rec.hora})`}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      {/* === PROCESO DE VENTA === */}
      <div
        style={{
          flex: 1,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          padding: 16,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Proceso de venta</h3>
        {RenderEtapas(etapasProceso)}
      </div>

      {/* === OTROS ESTADOS === */}
      <div
        style={{
          marginTop: 12,
          flex: 1,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          padding: 16,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Otros estados</h3>

        {/* === Filtros === */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {["Todos", ...etapasOtros].map((etapa) => {
            const count =
              etapa === "Todos"
                ? etapasOtros.reduce(
                    (acc, e) => acc + getLeadsByEtapa(e).length,
                    0
                  )
                : getLeadsByEtapa(etapa).length;

            const active = filtroOtros === etapa;

            return (
              <button
                key={etapa}
                onClick={() => setFiltroOtros(etapa)}
                style={{
                  background: active ? "#000" : "#f1f5f9",
                  color: active ? "#fff" : "#000",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {etapa} ({count})
              </button>
            );
          })}
        </div>

        {RenderEtapas(etapasOtros, filtroOtros)}
      </div>
    </div>
  );
}