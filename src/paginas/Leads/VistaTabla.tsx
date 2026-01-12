import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import axios from "axios";
import Cookies from "js-cookie";

type Lead = {
  id: number;
  fechaISO: string;
  hora?: string;
  nombre: string;
  pais: string;
  etapa: string;
  programa: string;
  recordatorio?: string | null; // ISO string o null
};

const headerBg = "#0f1724";
const colMinWidth = 200;

const getReminderColor = (fechaRecordatorio?: string | null): string => {
  if (!fechaRecordatorio) return "#9ca3af";

  const now = new Date();
  const reminderDate = new Date(fechaRecordatorio);

  const diffMs = reminderDate.getTime() - now.getTime();
  const hoursRemaining = diffMs / (1000 * 60 * 60);

  if (hoursRemaining <= 0) return "#bfbfbf"; // pasado
  if (hoursRemaining <= 5) return "#ff4d4f"; // rojo
  if (hoursRemaining < 24) return "#ffd666"; // amarillo
  return "#1677ff"; // azul
};

export default function VistaTablaComponent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<Lead[]>([]); // <-- estado para los leads

  useEffect(() => {
    const obtenerOportunidades = async () => {
      try {
        setLoading(true);
        const token = Cookies.get("token");
        if (!token) {
          console.warn("⚠️ No se encontró el token en las cookies");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${
            import.meta.env.VITE_API_URL
          }/api/VTAModVentaOportunidad/ObtenerTodasConDetalle`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const oportunidadesRaw = response.data?.oportunidad ?? [];

        // Transformar al formato del componente VistaTablaComponent
        const oportunidadesFormateadas: Lead[] = oportunidadesRaw.map(
          (o: any) => {
            const fecha = new Date(o.fechaCreacion);
            const hora = fecha.toLocaleTimeString("es-PE", {
              hour: "2-digit",
              minute: "2-digit",
            });

            // etapa según idEstado (según lo que comentaste: 1=Pendiente, 2=Registrado)
            let etapa = "Sin estado";
            const idEstado = o.historialEstado?.idEstado;
            if (idEstado === 1) etapa = "Pendiente";
            else if (idEstado === 2) etapa = "Registrado";

            // Recordatorios: tomar el más próximo de tipo "Recordatorio"
            const recordatoriosDates = (o.historialInteraccion || [])
              .filter(
                (h: any) => h.tipo === "Recordatorio" && h.fechaRecordatorio
              )
              .map((h: any) => new Date(h.fechaRecordatorio))
              .sort((a: Date, b: Date) => a.getTime() - b.getTime());

            const hoy = new Date();
            const proximoRecordatorio =
              recordatoriosDates.find((r: Date) => r >= hoy) ||
              recordatoriosDates[recordatoriosDates.length - 1] ||
              null;

            return {
              id: o.id,
              fechaISO: o.fechaCreacion,
              hora,
              nombre: `${o.personaNombres ?? ""} ${
                o.personaApellidos ?? ""
              }`.trim(),
              pais: "Perú",
              etapa,
              programa: o.codigoLanzamiento ?? "-",
              recordatorio: proximoRecordatorio
                ? proximoRecordatorio.toISOString()
                : null,
            };
          }
        );

        setData(oportunidadesFormateadas);
        console.log("✅ Oportunidades mapeadas:", oportunidadesFormateadas);
      } catch (error) {
        console.error("Error al obtener oportunidades:", error);
      } finally {
        setLoading(false);
      }
    };

    obtenerOportunidades();
  }, []);

  type SortDir = "asc" | "desc" | null;
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const toggleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") setSortDir("desc");
    else {
      setSortKey(null);
      setSortDir(null);
    }
  };

  const formattedLongDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formattedShortDate = (iso?: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const etapaColor = (etapa: string) => {
    const e = etapa.toLowerCase();
    if (["pendiente", "no calificado", "perdido"].includes(e)) return "#ff4d4f";
    if (["cliente"].includes(e)) return "#52c41a";
    if (["registrado", "calificado", "potencial", "promesa"].includes(e))
      return "#1677ff";
    return "#9ca3af";
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    const copy = [...data];
    copy.sort((a, b) => {
      let av: any = (a as any)[sortKey as keyof Lead];
      let bv: any = (b as any)[sortKey as keyof Lead];
      if (sortKey === "fechaISO" || sortKey === "recordatorio") {
        av = new Date(av || 0).getTime();
        bv = new Date(bv || 0).getTime();
      } else {
        av = String(av ?? "").toLowerCase();
        bv = String(bv ?? "").toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [data, sortKey, sortDir]);

  const headerCell = (label: string, key: string) => {
    const active = sortKey === key;
    const arrow = active ? (sortDir === "asc" ? " ▲" : " ▼") : "";
    return (
      <div
        role="button"
        onClick={() => toggleSort(key)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
          fontWeight: 600,
          gap: 6,
          userSelect: "none",
          minWidth: colMinWidth,
        }}
      >
        <span style={{ fontSize: 13 }}>{label + arrow}</span>
        <FilterOutlined style={{ color: "#cbd5e1", fontSize: 14 }} />
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          Cargando oportunidades...
        </div>
      ) : (
        <>
          <h3 style={{ margin: "6px 8px", color: "#0f1724", fontWeight: 700 }}>
            Oportunidades
          </h3>

          {/* Contenedor con scroll interno */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              background: "#f9fafb",
              padding: 8,
              borderRadius: 8,
            }}
          >
            <div style={{ minWidth: `${colMinWidth * 6}px` }}>
              {/* CABECERA */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(6, minmax(${colMinWidth}px, 1fr))`,
                  background: headerBg,
                  color: "#fff",
                  borderRadius: 10,
                  padding: 10,
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                  position: "sticky",
                  top: 0,
                  zIndex: 5,
                }}
              >
                {headerCell("Fecha y Hora", "fechaISO")}
                {headerCell("Nombre Completo", "nombre")}
                {headerCell("País", "pais")}
                {headerCell("Etapa", "etapa")}
                {headerCell("Programa", "programa")}
                {headerCell("Recordatorio", "recordatorio")}
              </div>

              {/* FILAS */}
              {sortedData.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/leads/oportunidad/${item.id}`)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(6, minmax(${colMinWidth}px, 1fr))`,
                    alignItems: "center",
                    gap: 8,
                    background: "#fff",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 10,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 4px 10px rgba(0,0,0,0.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 1px 3px rgba(0,0,0,0.05)")
                  }
                >
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 13,
                        color: "#111827",
                      }}
                    >
                      <span>
                        {formattedLongDate(item.fechaISO)}
                        <CalendarOutlined
                          style={{ color: "#6b7280", marginLeft: 4 }}
                        />
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: "#374151",
                        fontSize: 13,
                      }}
                    >
                      <ClockCircleOutlined style={{ color: "#6b7280" }} />
                      <span>{item.hora ?? "00:00"}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      color: "#111827",
                      fontSize: 14,
                      textAlign: "center",
                    }}
                  >
                    {item.nombre}
                  </div>

                  <div
                    style={{
                      color: "#374151",
                      fontSize: 13,
                      textAlign: "center",
                    }}
                  >
                    {item.pais}
                  </div>

                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div
                      style={{
                        background: etapaColor(item.etapa),
                        color: "#fff",
                        padding: "8px 12px",
                        borderRadius: 999,
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: 13,
                        width: "100%",
                      }}
                    >
                      {item.etapa}
                    </div>
                  </div>

                  <div
                    style={{
                      color: "#374151",
                      fontSize: 13,
                      textAlign: "center",
                    }}
                  >
                    {item.programa}
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "6px 10px",
                      borderRadius: 6,
                      backgroundColor: getReminderColor(item.recordatorio),
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <CalendarOutlined style={{ fontSize: 12 }} />
                    {formattedShortDate(item.recordatorio)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
