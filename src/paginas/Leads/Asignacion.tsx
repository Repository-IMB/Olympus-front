import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Input,
  Select,
  Button,
  Modal,
  Checkbox,
  Spin,
  message,
  Table,
  Tag,
  DatePicker,
  Card,
  Space,
  Form,
  TimePicker,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  CloseOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { type Lead } from "../../config/leadsTableItems";
import estilos from "./Asignacion.module.css";
import estilosModal from "./ReasignacionMasiva.module.css";
import axios from "axios";
import Cookies from "js-cookie";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import { getCookie } from "../../utils/cookies";
import { jwtDecode } from "jwt-decode";

const { Option } = Select;
const { RangePicker } = DatePicker;

const STORAGE_KEY = "asignacion_filters";

interface OportunidadBackend {
  id: number;
  idPotencialCliente: number;
  personaNombre: string;
  idProducto: number;
  productoNombre: string;
  idAsesor: number;
  asesorNombre: string;
  personaCorreo: string;
  codigoLanzamiento: string;
  codigoLinkedin: string;
  totalOportunidadesPersona: number;
  origen: string | null;
  idHistorialEstado: number;
  idEstado: number;
  nombreEstado: string;
  idHistorialInteraccion: number;
  fechaRecordatorio: string | null;
  personaPaisId: number;
  personaPaisNombre: string;
  estado: boolean;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  fechaFormulario: string;
  usuarioModificacion: string;
  totalMarcaciones?: number;
  recordatorios?: string[];
}

interface Asesor {
  idUsuario: number;
  idPersona: number;
  nombre: string;
  idRol: number;
}
interface SkippedSource {
  id: number;
  formName: string;
  motivo: string;
  createdDate?: string | null;
}

interface OportunidadConRecordatorios extends OportunidadBackend {
  totalMarcaciones: number;
  recordatorios: string[]; // ISO strings
}

const loadFiltersFromStorage = (): {
  searchText: string;
  filterEstado: string;
  filterOrigen: string;
  filterPais: string;
  filterAsesor: string;
  filterCodigoLanzamiento: string;
  filterCodigoLinkedin: string;
  dateRange: [Dayjs | null, Dayjs | null] | null;
} => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        searchText: parsed.searchText || "",
        filterEstado: parsed.filterEstado || "Todos",
        filterOrigen: parsed.filterOrigen || "Todos",
        filterPais: parsed.filterPais || "Todos",
        filterAsesor: parsed.filterAsesor || "Todos",
        filterCodigoLanzamiento: parsed.filterCodigoLanzamiento || "Todos",
        filterCodigoLinkedin: parsed.filterCodigoLinkedin || "Todos",
        dateRange: parsed.dateRange
          ? ([
              parsed.dateRange[0] ? dayjs(parsed.dateRange[0]) : null,
              parsed.dateRange[1] ? dayjs(parsed.dateRange[1]) : null,
            ] as [Dayjs | null, Dayjs | null])
          : null,
      };
    }
  } catch (e) {
    console.error("Error al cargar filtros desde localStorage", e);
  }
  return {
    searchText: "",
    filterEstado: "Todos",
    filterOrigen: "Todos",
    filterPais: "Todos",
    filterAsesor: "Todos",
    filterCodigoLanzamiento: "Todos",
    filterCodigoLinkedin: "Todos",
    dateRange: null,
  };
};

const saveFiltersToStorage = (
  searchText: string,
  filterEstado: string,
  filterOrigen: string,
  filterPais: string,
  filterAsesor: string,
  filterCodigoLanzamiento: string,
  filterCodigoLinkedin: string,
  dateRange: [Dayjs | null, Dayjs | null] | null
) => {
  try {
    const toSave = {
      searchText,
      filterEstado,
      filterOrigen,
      filterPais,
      filterAsesor,
      filterCodigoLanzamiento,
      filterCodigoLinkedin,
      dateRange: dateRange
        ? [
            dateRange[0]?.toISOString() || null,
            dateRange[1]?.toISOString() || null,
          ]
        : null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error("Error al guardar filtros en localStorage", e);
  }
};

export default function Asignacion() {
  const [selectedRows, setSelectedRows] = useState<Lead[]>([]);
  
  // Cargar filtros desde localStorage al inicializar
  const initialFilters = loadFiltersFromStorage();
  const [searchText, setSearchText] = useState(initialFilters.searchText);
  const [filterEstado, setFilterEstado] = useState(initialFilters.filterEstado);
  const [filterOrigen, setFilterOrigen] = useState(initialFilters.filterOrigen);
  const [filterPais, setFilterPais] = useState(initialFilters.filterPais);
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(initialFilters.dateRange);
  const [filterAsesor, setFilterAsesor] = useState(initialFilters.filterAsesor);
  const [modalOpen, setModalOpen] = useState(false);
  const [asesorDestino, setAsesorDestino] = useState<number | null>(null);
  const [forzarReasignacion, setForzarReasignacion] = useState(true);
  const [oportunidades, setOportunidades] = useState<OportunidadBackend[]>([]);
  const [filterCodigoLanzamiento, setFilterCodigoLanzamiento] = useState<string>(initialFilters.filterCodigoLanzamiento);
  const [filterCodigoLinkedin, setFilterCodigoLinkedin] = useState<string>(initialFilters.filterCodigoLinkedin);
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAsesores, setLoadingAsesores] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importRange, setImportRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    filasProcesadas: number;
    filasSaltadas: number;
    filasEnRango: number;
    skippedSources: SkippedSource[];
    mensaje: string;
  } | null>(null);

  // 🔹 Fecha y hora de reasignación
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<Dayjs | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const navigate = useNavigate();
const token = getCookie("token");

const getUserIdFromToken = () => {
  if (!token) return 0;

  try {
    const decoded: any = jwtDecode(token);

    const id =
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ];

    return id ? Number(id) : 0;
  } catch (e) {
    // console.error("Error decodificando token", e);
    return 0;
  }
};

  const handleClick = (id: number) => {
    navigate(`/leads/oportunidades/${id}`);
  };

  const handleReasignarMasivo = () => {
    if (selectedRows.length > 0) setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setAsesorDestino(null);
    setForzarReasignacion(true);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleConfirmarAsignacion = async () => {
    if (
      !asesorDestino ||
      selectedRows.length === 0 ||
      !selectedDate ||
      !selectedTime
    ) {
      return;
    }

    const hayConAsesor = selectedRows.some(
      (r) => (r.asesor ?? "").trim() !== ""
    );

    if (hayConAsesor && !forzarReasignacion) {
      return;
    }

    try {
      setLoading(true);

      const asesor = asesores.find((a) => a.idUsuario === asesorDestino);
      if (!asesor) throw new Error("Asesor no encontrado");

      // Fecha de recordatorio con hora formateada
      const fechaRecordatorioISO = selectedDate
        .hour(selectedTime.hour())
        .minute(selectedTime.minute())
        .second(0)
        .toISOString();

      const horaRecordatorio = selectedTime.format("HH:mm");

      for (const row of selectedRows) {
        const payloadInteraccion = {
          id: 0,
          idOportunidad: row.id,
          idTipo: 10,
          detalle:
            "Recordatorio inicial de creación de la oportunidad, generado automáticamente",
          celular: "",
          fechaRecordatorio: fechaRecordatorioISO,
          estado: true,
          fechaCreacion: new Date().toISOString(),
          usuarioCreacion: Number(getUserIdFromToken()).toString(),
          fechaModificacion: new Date().toISOString(),
          usuarioModificacion: Number(getUserIdFromToken()).toString(),
        };

        await axios.post(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:7020"
          }/api/VTAModVentaHistorialInteraccion/Insertar`,
          payloadInteraccion,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      const payload = {
        IdOportunidades: selectedRows.map((r) => r.id),
        IdAsesor: asesor.idPersona,
        UsuarioModificacion: Number(getUserIdFromToken()).toString(),
        FechaRecordatorio: fechaRecordatorioISO,
        HoraRecordatorio: horaRecordatorio,
      };

      const response = await axios.post(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:7020"
        }/api/VTAModVentaOportunidad/AsignarAsesor`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.codigo === "SIN ERROR") {
        message.success("Asesor asignado correctamente");
        setSelectedRows([]);
        handleCloseModal();
        obtenerOportunidades();
      } else {
        message.error(response.data.mensaje || "Error al asignar asesor");
      }
    } catch (err: any) {
      message.error(
        err?.response?.data?.mensaje ||
          err?.message ||
          "Error al asignar asesor"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarLeads = () => {
    setImportModalOpen(true);
    setImportRange(null);
    setImportResult(null);
  };

  const closeImportModal = () => {
    setImportModalOpen(false);
    setImportRange(null);
    setImportResult(null);
  };

  const ejecutarImportacion = async () => {
    try {
      setImportLoading(true);
      setImportResult(null);

      if (!token) throw new Error("No se encontró el token de autenticación");

      const fechaInicioIso =
        importRange && importRange[0] ? importRange[0].toISOString() : null;
      const fechaFinIso =
        importRange && importRange[1] ? importRange[1].toISOString() : null;

      const payload = {
        FechaInicio: fechaInicioIso,
        FechaFin: fechaFinIso,
      };

      const url = `${
        import.meta.env.VITE_API_URL || "http://localhost:7020"
      }/api/VTAModVentaOportunidad/ImportarProcesadoLinkedin`;

      const response = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data ?? {};

      const filasProcesadas =
        data?.filasProcesadas ?? data?.FilasProcesadas ?? 0;
      const filasSaltadas = data?.filasSaltadas ?? data?.FilasSaltadas ?? 0;
      const filasEnRango = data?.filasEnRango ?? data?.FilasEnRango ?? 0;
      const skipped = Array.isArray(
        data?.skippedSources ?? data?.SkippedSources
      )
        ? data?.skippedSources ?? data?.SkippedSources
        : [];

      const skippedMapped: SkippedSource[] = skipped.map((s: any) => ({
        id: s.id ?? s.Id ?? 0,
        formName: s.formName ?? s.FormName ?? "",
        motivo: s.motivo ?? s.Motivo ?? "",
        createdDate: s.createdDate ?? s.CreatedDate ?? null,
      }));

      setImportResult({
        filasProcesadas,
        filasSaltadas,
        filasEnRango,
        skippedSources: skippedMapped,
        mensaje:
          data?.respuesta?.mensaje ??
          data?.Respuesta?.Mensaje ??
          data?.mensaje ??
          "",
      });

      // if ((data?.respuesta?.codigo ?? data?.Respuesta?.Codigo ?? "1") === "0") {
      //   message.success("Importación finalizada correctamente.");
      //   obtenerOportunidades();
      // } else {
      //   console.log(
      //     data?.respuesta?.mensaje ??
      //       data?.Respuesta?.Mensaje ??
      //       data?.mensaje ??
      //       "Importación finalizada con advertencias."
      //   );
      // }
    } catch (err: any) {
      console.error("Error al importar:", err);
      // message.error(
      //   err?.response?.data?.mensaje ||
      //     err?.message ||
      //     "Error al ejecutar importación"
      // );
    } finally {
      setImportLoading(false);
    }
  };
  const handleLimpiarFiltros = () => {
    setSearchText("");
    setFilterEstado("Todos");
    setFilterOrigen("Todos");
    setFilterPais("Todos");
    setFilterAsesor("Todos");
    setFilterCodigoLanzamiento("Todos");
    setFilterCodigoLinkedin("Todos");
    setDateRange(null);
    // Limpiar localStorage también
    localStorage.removeItem(STORAGE_KEY);
  };

  const obtenerOportunidades = async () => {
    try {
      setLoading(true);
      if (!token) throw new Error("No se encontró el token de autenticación");

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:7020"}/api/VTAModVentaOportunidad/ObtenerTodasConRecordatorio`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data;
      if (data && Array.isArray(data.oportunidad)) {
        const raw = data.oportunidad as any[];

        const map = new Map<number, OportunidadConRecordatorios>();

        raw.forEach((op) => {
          if (!map.has(op.id)) {
            const base: Partial<OportunidadConRecordatorios> = {
              ...op,
              totalMarcaciones: Number(op.totalMarcaciones ?? 0),
              recordatorios: [],
            };
            map.set(op.id, base as OportunidadConRecordatorios);
          } else {
            const existing = map.get(op.id)!;
            const nm = Number(op.totalMarcaciones ?? 0);
            if (!isNaN(nm) && nm > (existing.totalMarcaciones ?? 0)) {
              existing.totalMarcaciones = nm;
            }
          }

          if (op.fechaRecordatorio) {
            const entry = map.get(op.id)!;
            entry.recordatorios.push(op.fechaRecordatorio);
          }
        });

        const agrupadas = Array.from(map.values()).map((o) => {
          const filtered = (o.recordatorios ?? []).filter(Boolean);
          filtered.sort((a, b) => new Date(a).getTime() - new Date(b).getTime()); // ascendente
          return { ...o, recordatorios: filtered };
        });

        agrupadas.sort((a, b) => {
          const fa = new Date(a.fechaCreacion ?? 0).getTime();
          const fb = new Date(b.fechaCreacion ?? 0).getTime();
          return fb - fa;
        });

        setOportunidades(agrupadas);
      } else {
        setOportunidades([]);
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.mensaje || err?.message || "Error al cargar las oportunidades";
      setError(errorMessage);
      message.error(errorMessage);
      setOportunidades([]);
    } finally {
      setLoading(false);
    }
  };

  const obtenerAsesores = async () => {
    try {
      setLoadingAsesores(true);
      if (!token) throw new Error("No se encontró el token de autenticación");

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
      const errorMessage =
        err?.response?.data?.mensaje ||
        err?.message ||
        "Error al cargar asesores";
      setError(errorMessage);
      message.error(errorMessage);
      setAsesores([]);
    } finally {
      setLoadingAsesores(false);
    }
  };

  const getReminderColor = (fechaRecordatorio: string): string => {
    const now = new Date();
    const reminderDate = new Date(fechaRecordatorio);
    const diffMs = reminderDate.getTime() - now.getTime();
    const hoursRemaining = diffMs / (1000 * 60 * 60);

    if (hoursRemaining <= 0) return "#bfbfbf"; // pasado
    if (hoursRemaining <= 5) return "#ff4d4f"; // rojo
    if (hoursRemaining < 24) return "#ffd666"; // amarillo
    return "#1677ff"; // azul
  };

  // Guardar filtros en localStorage cuando cambien
  useEffect(() => {
    saveFiltersToStorage(
      searchText,
      filterEstado,
      filterOrigen,
      filterPais,
      filterAsesor,
      filterCodigoLanzamiento,
      filterCodigoLinkedin,
      dateRange
    );
  }, [searchText, filterEstado, filterOrigen, filterPais, filterAsesor, filterCodigoLanzamiento, filterCodigoLinkedin, dateRange]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filterEstado, filterOrigen, filterPais, filterAsesor, dateRange, oportunidades,filterCodigoLanzamiento,filterCodigoLinkedin,]);

  useEffect(() => {
    obtenerOportunidades();
    obtenerAsesores();
  }, []);

  const leadsMapeados = useMemo(
    () =>
      oportunidades.map((o) => ({
        id: o.id,
        codigoLanzamiento: o.codigoLanzamiento || "-",
        codigoLinkedin: o.codigoLinkedin || "-",
        nombre: o.personaNombre || "-",
        asesor: o.asesorNombre || "-",
        estado: o.nombreEstado || "-",
        origen: o.origen || "-",
        pais: o.personaPaisNombre || "-",
        fechaCreacion: o.fechaCreacion,
        fechaFormulario: o.fechaFormulario,
        totalMarcaciones: o.totalMarcaciones ?? 0,
        recordatorios: o.recordatorios ?? [],
      })),
    [oportunidades]
  );

  const estadosUnicos = useMemo(() => {
    const estados = new Set<string>();
    oportunidades.forEach((op) => {
      if (op.nombreEstado) {
        estados.add(op.nombreEstado);
      }
    });
    return Array.from(estados).sort();
  }, [oportunidades]);

  const origenesUnicos = useMemo(() => {
    const origenes = new Set<string>();
    leadsMapeados.forEach((lead) => {
      if (lead.origen && lead.origen !== "-") {
        origenes.add(lead.origen);
      }
    });
    return Array.from(origenes).sort();
  }, [leadsMapeados]);

  const codigoLanzamientoUnicos = useMemo(() => {
    const setcodigoLanzamiento = new Set<string>();
    leadsMapeados.forEach((lead) => {
      if (lead.codigoLanzamiento && lead.codigoLanzamiento !== "-") {
        setcodigoLanzamiento.add(lead.codigoLanzamiento);
      }
    });
    return Array.from(setcodigoLanzamiento).sort();
  }, [leadsMapeados]);

  const codigosLinkedinUnicos = useMemo(() => {
  const setCodigosLinkedin = new Set<string>();
  leadsMapeados.forEach((lead) => {
    if (lead.codigoLinkedin && lead.codigoLinkedin !== "-") {
      setCodigosLinkedin.add(lead.codigoLinkedin);
    }
  });
  return Array.from(setCodigosLinkedin).sort();
  }, [leadsMapeados]);

  const asesoresUnicos = useMemo(() => {
  const setAsesores = new Set<string>();
  leadsMapeados.forEach((lead) => {
    if (lead.asesor && lead.asesor !== "-" && lead.asesor.toUpperCase() !== "SIN ASESOR") {
      setAsesores.add(lead.asesor);
    }
  });
  return Array.from(setAsesores).sort();
  }, [leadsMapeados]);

  const paisesUnicos = useMemo(() => {
    const paises = new Set<string>();
    leadsMapeados.forEach((lead) => {
      if (lead.pais && lead.pais !== "-") {
        paises.add(lead.pais);
      }
    });
    return Array.from(paises).sort();
  }, [leadsMapeados]);

  

  const leadsFiltrados = useMemo(() => {
    let filtrados = [...leadsMapeados];

    if (searchText.trim()) {
      const busqueda = searchText.toLowerCase();
      filtrados = filtrados.filter(
        (l) =>
          l.nombre.toLowerCase().includes(busqueda) ||
          l.origen.toLowerCase().includes(busqueda) ||
          l.codigoLanzamiento.toLowerCase().includes(busqueda) ||
          l.codigoLinkedin.toLowerCase().includes(busqueda) ||
          l.id.toString().includes(busqueda)
      );
    }

    if (filterCodigoLanzamiento !== "Todos") {
      filtrados = filtrados.filter((lead) => lead.codigoLanzamiento === filterCodigoLanzamiento);
    }
    
    if (filterCodigoLinkedin !== "Todos") {
      filtrados = filtrados.filter((lead) => lead.codigoLinkedin === filterCodigoLinkedin);
    }

    if (filterEstado !== "Todos") {
      filtrados = filtrados.filter((lead) => lead.estado === filterEstado);
    }

    if (filterOrigen !== "Todos") {
      filtrados = filtrados.filter((lead) => lead.origen === filterOrigen);
    }

    if (filterPais !== "Todos") {
      filtrados = filtrados.filter((lead) => lead.pais === filterPais);
    }
    if (filterAsesor !== "Todos") {
      filtrados = filtrados.filter((lead) => lead.asesor === filterAsesor);
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      const fechaInicio = dateRange[0].startOf("day");
      const fechaFin = dateRange[1].endOf("day");
      filtrados = filtrados.filter((lead) => {
        const fechaCreacion = dayjs(lead.fechaFormulario);
        return (
          (fechaCreacion.isAfter(fechaInicio) ||
            fechaCreacion.isSame(fechaInicio, "day")) &&
          (fechaCreacion.isBefore(fechaFin) ||
            fechaCreacion.isSame(fechaFin, "day"))
        );
      });
    }

    return filtrados;
  }, [
    leadsMapeados,
    searchText,
    filterEstado,
    filterCodigoLanzamiento,
    filterCodigoLinkedin,
    filterOrigen,
    filterPais,
    filterAsesor,
    dateRange,
  ]);

  const columns: ColumnsType<Lead> = useMemo(
    () => [
      {
        title: "IdLead",
        dataIndex: "id",
        key: "id",
        sorter: (a, b) => a.id - b.id,
      },
      {
        title: "Código Lanzamiento",
        dataIndex: "codigoLanzamiento",
        key: "codigoLanzamiento",
        sorter: (a, b) =>
          (a.codigoLanzamiento || "").localeCompare(b.codigoLanzamiento || ""),
      },
      {
        title: "Código Linkedin",
        dataIndex: "codigoLinkedin",
        key: "codigoLinkedin",
        sorter: (a, b) =>
          (a.codigoLinkedin || "").localeCompare(b.codigoLinkedin || ""),
      },
      {
        title: "Nombre",
        dataIndex: "nombre",
        key: "nombre",
        sorter: (a, b) => (a.nombre || "").localeCompare(b.nombre || ""),
      },
      {
        title: "Asesor",
        dataIndex: "asesor",
        key: "asesor",
        sorter: (a, b) => (a.asesor || "").localeCompare(b.asesor || ""),
      },
      {
        title: "Estado",
        dataIndex: "estado",
        key: "estado",
        sorter: (a, b) => (a.estado || "").localeCompare(b.estado || ""),
        render: (estado: string) => {
          let color = "green";

          if (estado === "Calificado") {
            color = "blue";
          } else if (estado === "Registrado") {
            color = "blue";
          } else if (estado === "Promesa") {
            color = "gold";
          } else if (estado === "No calificado" || estado === "Perdido") {
            color = "red";
          } else if (estado === "Matriculado" || estado === "Cliente") {
            color = "green";
          } else if (estado === "Pendiente") {
            color = "orange";
          }

          return (
            <Tag
              color={color}
              style={{ borderRadius: "12px", padding: "2px 12px" }}
            >
              {estado}
            </Tag>
          );
        },
      },
      {
        title: "Origen",
        dataIndex: "origen",
        key: "origen",
        sorter: (a, b) => (a.origen || "").localeCompare(b.origen || ""),
      },
      {
        title: "País",
        dataIndex: "pais",
        key: "pais",
        sorter: (a, b) => (a.pais || "").localeCompare(b.pais || ""),
      },
      {
        title: "Total Marcaciones",
        dataIndex: "totalMarcaciones",
        key: "totalMarcaciones",
        sorter: (a: Lead, b: Lead) =>
          (a.totalMarcaciones ?? 0) - (b.totalMarcaciones ?? 0),
        render: (totalMarcaciones: number) => (
          <span>{typeof totalMarcaciones === "number" ? totalMarcaciones : "-"}</span>
        ),
        align: "center",
        width: 140,
      },
      {
        title: "Recordatorio",
        key: "recordatorios",
        width: 240,
        render: (_: any, record: Lead) =>
          !record.recordatorios || record.recordatorios.length === 0 ? (
            "-"
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {record.recordatorios
                .filter(Boolean)
                .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime())
                .slice(0, 3)
                .map((r: string, i: number) => (
                  <div
                    key={i}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: getReminderColor(r),
                      color: "#ffffff",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    <FileTextOutlined style={{ fontSize: "12px" }} />
                    {new Date(r).toLocaleDateString("es-ES")}{" "}
                    {new Date(r).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </div>
                ))}
            </div>
          ),
      },

      {
        title: "Fecha Creación",
        dataIndex: "fechaCreacion",
        key: "fechaCreacion",
        sorter: (a, b) =>
          new Date(a.fechaCreacion ?? "").getTime() -
          new Date(b.fechaCreacion ?? "").getTime(),
        render: (fechaCreacion: string | null) => {
          if (!fechaCreacion) return "-";
          const d = new Date(fechaCreacion);
          return (
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}
            >
              <CalendarOutlined
                style={{ color: "#8c8c8c", marginTop: "2px" }}
              />
              <div>
                <div style={{ color: "#000000", fontSize: "14px" }}>
                  {d.toLocaleDateString()}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#8c8c8c",
                    fontSize: "13px",
                  }}
                >
                  <ClockCircleOutlined style={{ fontSize: "12px" }} />
                  {d.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        },
      },
      // Columna existente: Fecha Formulario ahora usa fechaFormulario mapeado desde la API
      {
        title: "Fecha Formulario",
        dataIndex: "fechaFormulario",
        key: "fechaFormulario",
        sorter: (a, b) =>
          new Date(a.fechaFormulario ?? "").getTime() -
          new Date(b.fechaFormulario ?? "").getTime(),
        render: (fechaFormulario: string | null) => {
          if (!fechaFormulario) return "-";
          const d = new Date(fechaFormulario);
          return (
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}
            >
              <CalendarOutlined
                style={{ color: "#8c8c8c", marginTop: "2px" }}
              />
              <div>
                <div style={{ color: "#000000", fontSize: "14px" }}>
                  {d.toLocaleDateString()}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#8c8c8c",
                    fontSize: "13px",
                  }}
                >
                  <ClockCircleOutlined style={{ fontSize: "12px" }} />
                  {d.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        title: "Acciones",
        key: "actions",
        align: "center",
        render: (_: any, record: Lead) => (
          <Tooltip title="Ver Detalle">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              style={{ backgroundColor: "#1f1f1f", borderColor: "#1f1f1f" }}
              onClick={() => handleClick(record.id)}
            />
          </Tooltip>
        ),
      },
    ],
    []
  );

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys: selectedRows.map((row) => row.id),
      onChange: (_selectedRowKeys: React.Key[], selectedRowsData: Lead[]) => {
        setSelectedRows(selectedRowsData);
      },
      getCheckboxProps: (record: Lead) => ({
        name: record.id.toString(),
      }),
    }),
    [selectedRows]
  );

  const hayOportunidadesConAsesor = selectedRows.some(
    (l) => (l.asesor ?? "").trim() !== ""
  );

  const botonDeshabilitado =
    !asesorDestino ||
    !selectedDate ||
    !selectedTime ||
    (!forzarReasignacion && hayOportunidadesConAsesor);

  return (
    <div className={estilos.container}>
      <div className={estilos.contentWrapper}>
        <div className={estilos.header}>
          <h1 className={estilos.title}>Oportunidades</h1>
        </div>

        {/* Barra de búsqueda y botones - Arriba */}
        <div className={estilos.toolbar}>
          <div className={estilos.searchBar}>
            <Input
              placeholder="Buscar por nombre, telefono, email u origen."
              prefix={<SearchOutlined />}
              className={estilos.searchInput}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className={estilos.actions}>
            <Button
              type="primary"
              className={estilos.btnReasignar}
              disabled={selectedRows.length === 0}
              onClick={handleReasignarMasivo}
            >
              Reasignar masivo
            </Button>
            <Button
              className={estilos.btnLimpiar}
              onClick={handleLimpiarFiltros}
            >
              Limpiar filtros
            </Button>
            <Button
              type="default"
              className={estilos.btnAgregar}
              icon={<PlusOutlined />}
              onClick={handleAgregarLeads}
            >
              Agregar Nuevos Leads
            </Button>
          </div>
        </div>

        {/* Filtros - Abajo */}
        <div className={estilos.filtersRow}>
            <Select
              showSearch
              value={filterAsesor}
              onChange={setFilterAsesor}
              placeholder="Seleccionar asesor"
              listHeight={200}
              virtual={false}
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
            <Option value="Todos">Todos los asesores</Option>
            <Option value="SIN ASESOR">SIN ASESOR</Option>
            {asesoresUnicos.map((a) => (
              <Option key={a} value={a}>
                {a}
              </Option>
            ))}
          </Select>
          <Select
            showSearch
            value={filterCodigoLinkedin}
            onChange={setFilterCodigoLinkedin}
            className={estilos.filterSelect}
            placeholder="Seleccionar codigo Linkedin"
            virtual={false}
            filterOption={(input, option) =>
              (option?.children as unknown as string)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            <Option value="Todos">Todos codigos Linkedin</Option>
            {codigosLinkedinUnicos.map((codigoLinkedin) => (
              <Option key={codigoLinkedin} value={codigoLinkedin}>
                {codigoLinkedin}
              </Option>
            ))}
          </Select>
          
          <Select
            showSearch
            value={filterCodigoLanzamiento}
            onChange={setFilterCodigoLanzamiento}
            className={estilos.filterSelect}
            placeholder="Seleccionar codigo lanzamiento"
            virtual={false}
            filterOption={(input, option) =>
              (option?.children as unknown as string)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            <Option value="Todos">Todos codigos lanzamiento</Option>
            {codigoLanzamientoUnicos.map((codigoLanzamiento) => (
              <Option key={codigoLanzamiento} value={codigoLanzamiento}>
                {codigoLanzamiento}
              </Option>
            ))}
          </Select>
          <Select
            value={filterEstado}
            onChange={setFilterEstado}
            className={estilos.filterSelect}
            placeholder="Seleccionar estado"
          >
            <Option value="Todos">Todos los estados</Option>
            {estadosUnicos.map((estado) => (
              <Option key={estado} value={estado}>
                {estado}
              </Option>
            ))}
          </Select>
          <Select
            value={filterOrigen}
            onChange={setFilterOrigen}
            className={estilos.filterSelect}
            placeholder="Seleccionar origen"
          >
            <Option value="Todos">Todos los orígenes</Option>
            {origenesUnicos.map((origen) => (
              <Option key={origen} value={origen}>
                {origen}
              </Option>
            ))}
          </Select>
          <Select
            showSearch
            value={filterPais}
            onChange={setFilterPais}
            className={estilos.filterSelect}
            placeholder="Seleccionar país"
            filterOption={(input, option) =>
              (option?.children as unknown as string)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            <Option value="Todos">Todos los países</Option>
            {paisesUnicos.map((pais) => (
              <Option key={pais} value={pais}>
                {pais}
              </Option>
            ))}
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates) =>
              setDateRange(dates as [Dayjs | null, Dayjs | null] | null)
            }
            format="DD/MM/YYYY"
            placeholder={["Fecha inicio", "Fecha fin"]}
            className={estilos.dateRangePicker}
          />
        </div>

        <div className={estilos.tableWrapper}>
          {loading ? (
            <Spin size="large" />
          ) : error ? (
            <div style={{ color: "#ff4d4f" }}>{error}</div>
          ) : (
            <>
              <Table
                columns={columns}
                dataSource={leadsFiltrados}
                rowKey="id"
                rowSelection={rowSelection}
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50", "100"],
                  onChange: (page, newPageSize) => {
                    setCurrentPage(page);
                    if (typeof newPageSize === "number") setPageSize(newPageSize);
                  },
                  showTotal: (total, range) => `${range[0]}-${range[1]} de ${total}`,
                  hideOnSinglePage: true
                }}
              />
              {selectedRows.length > 0 && (
                <div className={estilos.selectionInfo}>
                  {selectedRows.length} Oportunidades seleccionadas
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
        centered
        closeIcon={<CloseOutlined />}
        className={estilosModal.modal}
      >
        <div className={estilosModal.modalContent}>
          <h2 className={estilosModal.title}>Reasignación Masiva</h2>

          {/* === ALCANCE === */}
          <div className={estilosModal.section}>
            <label className={estilosModal.label}>Alcance:</label>
            <div className={estilosModal.leadsCount}>
              {selectedRows.length}{" "}
              {selectedRows.length === 1
                ? "oportunidad seleccionada"
                : "oportunidades seleccionadas"}
            </div>
          </div>

          {/* === SELECT ASESOR === */}
          <div className={estilosModal.section}>
            <label className={estilosModal.label}>Asesor destino</label>

            {loadingAsesores ? (
              <Spin />
            ) : (
              <Select
                showSearch
                value={asesorDestino ?? undefined}
                onChange={setAsesorDestino}
                placeholder="Selecciona un asesor"
                className={estilosModal.select}
                size="large"
                virtual={false}
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                listHeight={200}
              >
                {asesores.map((a) => (
                  <Option key={a.idUsuario} value={a.idUsuario}>
                    {a.nombre}
                  </Option>
                ))}
              </Select>
            )}
          </div>

          {/* === FECHA Y HORA === */}
          <Form layout="vertical" style={{ marginTop: 10 }}>
            <div style={{ display: "flex", gap: 16 }}>
              <Form.Item
                label={
                  <span>
                    Fecha<span style={{ color: "#ff4d4f" }}>*</span>
                  </span>
                }
                style={{ flex: 1 }}
              >
                <DatePicker
                  value={selectedDate}
                  onChange={(d) => setSelectedDate(d)}
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                  suffixIcon={<CalendarOutlined />}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Hora<span style={{ color: "#ff4d4f" }}>*</span>
                  </span>
                }
                style={{ flex: 1 }}
              >
                <TimePicker
                  value={selectedTime}
                  onChange={(t) => setSelectedTime(t)}
                  format="HH:mm"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </div>
          </Form>

          {/* === PROGRAMADO PARA === */}
          <div
            style={{
              marginTop: 6,
              background: "#f0f2f5",
              padding: "10px 14px",
              borderRadius: 6,
              fontSize: 14,
            }}
          >
            {selectedDate && selectedTime ? (
              <>
                <b>Programado para:</b>{" "}
                {selectedDate.format("dddd").charAt(0).toUpperCase() +
                  selectedDate.format("dddd").slice(1)}
                , {selectedDate.format("DD [de] MMMM [de] YYYY")} a las{" "}
                {selectedTime.format("HH:mm")} horas
              </>
            ) : (
              <span style={{ color: "#888" }}>
                Programado para: seleccione fecha y hora
              </span>
            )}
          </div>

          {/* === CHECKBOX === */}
          <div className={estilosModal.section}>
            <Checkbox
              checked={forzarReasignacion}
              onChange={(e) => setForzarReasignacion(e.target.checked)}
            >
              Forzar reasignación incluso si lead ya tiene asesor asignado
            </Checkbox>
          </div>

          {/* === TARJETAS DE OPORTUNIDADES === */}
          {selectedRows.length > 0 && (
            <div
              style={{
                maxHeight: 240,
                overflowY: "auto",
                marginTop: 12,
                paddingRight: 6,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {selectedRows.map((op) => (
                <Card
                  key={op.id}
                  hoverable
                  style={{
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                  }}
                  bodyStyle={{ padding: 12 }}
                >
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ width: "100%" }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      {op.nombre}
                    </div>
                    <div style={{ color: "#555" }}>
                      <b>Código:</b> {op.codigoLanzamiento}
                    </div>
                    <div>
                      <b>Origen:</b> {op.origen} {" | "} <b>País:</b> {op.pais}
                    </div>
                    <div>
                      <b>Asesor actual:</b>{" "}
                      {op.asesor?.trim() ? op.asesor : "Sin asignar"}
                    </div>

                    <Tag
                      color="blue"
                      style={{
                        borderRadius: 6,
                        padding: "2px 10px",
                        width: "fit-content",
                      }}
                    >
                      {op.estado}
                    </Tag>

                    <div style={{ fontSize: 13, color: "#666" }}>
                      <b>Fecha:</b>{" "}
                      {new Date(op.fechaFormulario).toLocaleDateString("es-ES")}{" "}
                      {new Date(op.fechaFormulario).toLocaleTimeString(
                        "es-ES",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                  </Space>
                </Card>
              ))}
            </div>
          )}

          {/* === ERROR INLINE === */}
          {!forzarReasignacion && hayOportunidadesConAsesor && (
            <div
              style={{
                marginTop: 16,
                color: "#c62828",
                background: "#ffebee",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #ffcdd2",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Algunas oportunidades ya tienen asesor asignado. Activa la opción
              “Forzar reasignación”.
            </div>
          )}

          {/* === BOTÓN CONFIRMAR === */}
          <Button
            type="primary"
            block
            size="large"
            style={{ marginTop: 16 }}
            disabled={botonDeshabilitado}
            onClick={handleConfirmarAsignacion}
          >
            Confirmar reasignación
          </Button>
        </div>
      </Modal>

      {/* Importar Procesado Linkedin*/}
      <Modal
        open={importModalOpen}
        onCancel={closeImportModal}
        footer={null}
        width={600}
        centered
        closeIcon={<CloseOutlined />}
        className={estilosModal.modal}
      >
        <div className={estilosModal.modalContent}>
          <h2 className={estilosModal.title}>
            Importar Procesado desde LinkedIn
          </h2>

          {/* Rango de fecha */}
          <div className={estilosModal.section}>
            <label className={estilosModal.label}>
              Rango de fecha (fecha de subida al CRM):
            </label>
            <RangePicker
              showTime
              value={importRange}
              onChange={(dates) =>
                setImportRange(dates as [Dayjs | null, Dayjs | null] | null)
              }
              format="DD/MM/YYYY HH:mm"
              style={{ width: "100%" }}
              placeholder={["Fecha inicio", "Fecha fin"]}
              className={estilosModal.input}
            />
          </div>

          <div className={estilosModal.section}>
            <Button
              onClick={() => {
                setImportRange(null);
                setImportResult(null);
              }}
              size="large"
            >
              Limpiar
            </Button>
          </div>

          {/* Estado / spinner y resultados */}
          {importLoading && (
            <div style={{ textAlign: "center", padding: 16 }}>
              <Spin /> Ejecutando importación...
            </div>
          )}

          {importResult && (
            <>
              <Card style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  <div>
                    <strong>Filas procesadas:</strong>{" "}
                    {importResult.filasProcesadas}
                  </div>
                  <div>
                    <strong>Filas saltadas:</strong>{" "}
                    {importResult.filasSaltadas}
                  </div>
                  <div>
                    <strong>Filas en rango:</strong> {importResult.filasEnRango}
                  </div>
                  {importResult.mensaje && (
                    <div style={{ width: "100%", marginTop: 8 }}>
                      <strong>Mensaje:</strong> {importResult.mensaje}
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}

          {/* Botón principal: ocupa todo el ancho y centrado como en el otro modal */}
          <Button
            type="primary"
            block
            size="large"
            onClick={ejecutarImportacion}
            loading={importLoading}
            disabled={importLoading}
            style={{ marginBottom: 8 }}
          >
            Ejecutar importación
          </Button>
        </div>
      </Modal>
    </div>
  );
}
