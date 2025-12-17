import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Table,
  Button,
  Tag,
  Space,
  Spin,
  Alert,
  Tooltip,
  Input,
  Select,
  DatePicker,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  EditOutlined,
  FileTextOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import SelectClient from "../SelectClient/SelectClient";
import { getCookie } from "../../utils/cookies";
import { jwtDecode } from "jwt-decode";
import api from "../../servicios/api";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import styles from "./Opportunities.module.css";
import type { ColumnType } from "antd/es/table";

const { RangePicker } = DatePicker;
const { Option } = Select;

const { Content } = Layout;

interface TokenData {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
}

interface Opportunity {
  id: number;
  personaNombre: string;
  nombreEstado: string;
  productoNombre: string;
  fechaCreacion: string;
  personaCorreo: string;
  fechaRecordatorio: string | null;
  asesorNombre: string;
  totalMarcaciones?: number;
}

export default function OpportunitiesInterface() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSelectClientModalVisible, setIsSelectClientModalVisible] =
    useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("Todos");
  const [filterAsesor, setFilterAsesor] = useState<string>("Todos");
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const navigate = useNavigate();
  const { isMobile, isTablet } = useBreakpoint();

  const token = getCookie("token");

  const { idUsuario, idRol } = useMemo(() => {
    let idU = 0;
    let rNombre = "";
    let idR = 0;

    if (!token) return { idUsuario: 0, rolNombre: "", idRol: 0 };

    try {
      const decoded = jwtDecode<TokenData>(token);
      idU = parseInt(
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ] || "0"
      );
      rNombre =
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
      idR = rolesMap[rNombre] ?? 0;
    } catch (e) {
      console.error("Error al decodificar token (useMemo)", e);
    }

    return { idUsuario: idU, rolNombre: rNombre, idRol: idR };
  }, [token]);

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
            params: { idUsuario, idRol },
          }
        );

        const data = res.data;
        const items: Opportunity[] = data?.oportunidad ?? [];

        // ordenar por fecha creación descendente
        const sortedOpportunities = items.sort(
          (a: Opportunity, b: Opportunity) =>
            new Date(b.fechaCreacion).getTime() -
            new Date(a.fechaCreacion).getTime()
        );

        setOpportunities(sortedOpportunities);
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

  const handleClick = (id: number) => {
    navigate(`/leads/oportunidades/${id}`);
  };

  const handleLimpiarFiltros = () => {
    setSearchText("");
    setFilterEstado("Todos");
    setFilterAsesor("Todos");
    setDateRange(null);
  };

  // Obtener estados únicos
  const estadosUnicos = useMemo(() => {
    const estados = new Set<string>();
    opportunities.forEach((op) => {
      if (op.nombreEstado) {
        estados.add(op.nombreEstado);
      }
    });
    return Array.from(estados).sort();
  }, [opportunities]);

  const asesoresUnicos = useMemo(() => {
    const asesores = new Set<string>();
    opportunities.forEach((op) => {
      if (op.asesorNombre) {
        asesores.add(op.asesorNombre);
      }
    });
    return Array.from(asesores).sort();
  }, [opportunities]);

  // Filtrar oportunidades
  const opportunitiesFiltradas = useMemo(() => {
    let filtradas = [...opportunities];

    // Filtro por búsqueda de texto
    if (searchText.trim()) {
      const busqueda = searchText.toLowerCase().trim();
      filtradas = filtradas.filter((op) => {
        const nombreMatch = op.personaNombre.toLowerCase().includes(busqueda);
        const correoMatch = (op.personaCorreo || "")
          .toLowerCase()
          .includes(busqueda);
        const productoMatch = op.productoNombre
          .toLowerCase()
          .includes(busqueda);
        const idMatch = op.id.toString().includes(busqueda);
        return nombreMatch || correoMatch || productoMatch || idMatch;
      });
    }

    // Filtro por estado
    if (filterEstado !== "Todos") {
      filtradas = filtradas.filter((op) => op.nombreEstado === filterEstado);
    }

    if (filterAsesor !== "Todos") {
      filtradas = filtradas.filter((op) => op.asesorNombre === filterAsesor);
    }

    // Filtro por rango de fechas
    if (dateRange && dateRange[0] && dateRange[1]) {
      const fechaInicio = dateRange[0].startOf("day");
      const fechaFin = dateRange[1].endOf("day");
      filtradas = filtradas.filter((op) => {
        const fechaCreacion = dayjs(op.fechaCreacion);
        return (
          (fechaCreacion.isAfter(fechaInicio) ||
            fechaCreacion.isSame(fechaInicio, "day")) &&
          (fechaCreacion.isBefore(fechaFin) ||
            fechaCreacion.isSame(fechaFin, "day"))
        );
      });
    }

    return filtradas;
  }, [
    opportunities,
    searchText,
    filterEstado,
    filterAsesor,
    dateRange,
    asesoresUnicos,
  ]);

  // Columnas responsivas según el breakpoint
  const columns = useMemo(() => {
    const baseColumns: ColumnType<Opportunity>[] = [
      {
        title: "Fecha y Hora",
        dataIndex: "fechaCreacion",
        key: "fechaCreacion",
        sorter: (a: Opportunity, b: Opportunity) =>
          new Date(a.fechaCreacion).getTime() -
          new Date(b.fechaCreacion).getTime(),
        render: (fechaCreacion: string) => (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <CalendarOutlined style={{ color: "#8c8c8c", marginTop: "2px" }} />
            <div>
              <div style={{ color: "#000000", fontSize: "14px" }}>
                {new Date(fechaCreacion).toLocaleDateString()}
              </div>
              {!isMobile && (
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
                  {new Date(fechaCreacion).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        title: "Nombre Completo",
        dataIndex: "personaNombre",
        key: "personaNombre",
        sorter: (a: Opportunity, b: Opportunity) =>
          a.personaNombre.localeCompare(b.personaNombre),
      },
      {
        title: "Estado",
        dataIndex: "nombreEstado",
        key: "nombreEstado",
        sorter: (a: Opportunity, b: Opportunity) =>
          a.nombreEstado.localeCompare(b.nombreEstado),
        render: (nombreEstado: string) => {
          let color = "green";

          if (nombreEstado === "Calificado") {
            color = "blue";
          } else if (nombreEstado === "Registrado") {
            color = "blue";
          } else if (nombreEstado === "Promesa") {
            color = "gold";
          } else if (nombreEstado === "No calificado") {
            color = "red";
          }

          return (
            <Tag
              color={color}
              style={{ borderRadius: "12px", padding: "2px 12px" }}
            >
              {nombreEstado}
            </Tag>
          );
        },
      },
      {
        title: "Acciones",
        key: "actions",
        align: "center",
        fixed: isMobile ? undefined : "right",
        render: (_: any, record: Opportunity) => (
          <Space size="small">
            <Tooltip title="Ver Detalle">
              <Button
                type="primary"
                icon={<EyeOutlined />}
                size="small"
                style={{ backgroundColor: "#1f1f1f", borderColor: "#1f1f1f" }}
                onClick={() => handleClick(record.id)}
              />
            </Tooltip>
            {/* {!isMobile && (
              <Tooltip title="Editar">
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  size="small"
                  style={{ backgroundColor: "#1f1f1f", borderColor: "#1f1f1f" }}
                />
              </Tooltip>
            )} */}
          </Space>
        ),
      },
    ];

    // Columnas adicionales solo para tablet y desktop
    if (!isMobile) {
      baseColumns.splice(2, 0,
        {
          title: "Correo",
          dataIndex: "personaCorreo",
          key: "personaCorreo",
          sorter: (a: Opportunity, b: Opportunity) =>
            (a.personaCorreo || "").localeCompare(b.personaCorreo || ""),
          render: (personaCorreo: string) => <span>{personaCorreo || "-"}</span>,
        },
        {
          title: "Total Marcaciones",
          dataIndex: "totalMarcaciones",
          key: "totalMarcaciones",
          sorter: (a: Opportunity, b: Opportunity) =>
            (a.totalMarcaciones ?? 0) - (b.totalMarcaciones ?? 0),
          render: (totalMarcaciones: number) => (
            <span>{typeof totalMarcaciones === "number" ? totalMarcaciones : "-"}</span>
          ),
          align: "center",
          width: 140,
        }
      );

      // Recordatorio solo en desktop
      if (!isTablet) {
        baseColumns.splice(5, 0, {
          title: "Recordatorio",
          dataIndex: "fechaRecordatorio",
          key: "fechaRecordatorio",
          width: 220,
          sorter: (a: Opportunity, b: Opportunity) => {
            if (!a.fechaRecordatorio && !b.fechaRecordatorio) return 0;
            if (!a.fechaRecordatorio) return 1;
            if (!b.fechaRecordatorio) return -1;
            return (
              new Date(a.fechaRecordatorio).getTime() -
              new Date(b.fechaRecordatorio).getTime()
            );
          },
          render: (fechaRecordatorio: string | null) => {
            if (!fechaRecordatorio) return <span>-</span>;
            return (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "#1677ff",
                  color: "#ffffff",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                <FileTextOutlined style={{ fontSize: "12px" }} />
                <span>
                  {new Date(fechaRecordatorio).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}{" "}
                  {new Date(fechaRecordatorio).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </span>
              </div>
            );
          },
        });

        baseColumns.splice(6, 0, {
          title: "Asesor",
          dataIndex: "asesorNombre",
          key: "asesorNombre",
          sorter: (a: Opportunity, b: Opportunity) =>
            (a.asesorNombre || "").localeCompare(b.asesorNombre || ""),
          render: (asesorNombre: string) =>  <span>{asesorNombre || "-"}</span>,
        });
      }
    }

    return baseColumns;
  }, [isMobile, isTablet]);

  return (
    <Content className={styles.container}>
      {/* Action Buttons */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
        }}
      >
        {idRol !== 1 && (
          <Button
            style={{ borderRadius: "6px" }}
            onClick={() => setIsSelectClientModalVisible(true)}
          >
            Agregar Oportunidad
          </Button>
        )}
        <Button
          style={{ borderRadius: "6px" }}
          onClick={() => navigate("/leads/SalesProcess")}
        >
          Vista de Proceso
        </Button>
        <Button
          type="primary"
          style={{
            background: "#1f1f1f",
            borderColor: "#1f1f1f",
            borderRadius: "6px",
          }}
        >
          Vista de Tabla
        </Button>
      </div>

      <SelectClient
        visible={isSelectClientModalVisible}
        onClose={() => setIsSelectClientModalVisible(false)}
      />

      <div className={styles.card}>
        <h1 className={styles.title}>Oportunidades</h1>

        {/* Filtros */}
        <div className={styles.filters}>
          <Input
            placeholder="Buscar por nombre, correo, programa o ID"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={styles.searchInput}
            allowClear
          />
          <Select
            value={filterEstado}
            onChange={setFilterEstado}
            placeholder="Seleccionar estado"
            className={styles.filterSelect}
          >
            <Option value="Todos">Todos los estados</Option>
            {estadosUnicos.map((estado) => (
              <Option key={estado} value={estado}>
                {estado}
              </Option>
            ))}
          </Select>
          <Select
            value={filterAsesor}
            onChange={setFilterAsesor}
            placeholder="Seleccionar asesor"
            className={styles.filterSelect}
            disabled={asesoresUnicos.length === 0}
          >
            <Option value="Todos">Todos los asesores</Option>
            {asesoresUnicos.map((asesor) => (
              <Option key={asesor} value={asesor}>
                {asesor}
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
            className={styles.rangePicker}
          />
          <Button
            onClick={handleLimpiarFiltros}
            className={styles.clearButton}
          >
            Limpiar filtros
          </Button>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert message="Error" description={error} type="error" showIcon />
        ) : (
          <Table
            columns={columns}
            dataSource={opportunitiesFiltradas}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            className={styles.table}
            scroll={{ x: isMobile ? 800 : undefined }}
          />
        )}
      </div>
    </Content>
  );
}
