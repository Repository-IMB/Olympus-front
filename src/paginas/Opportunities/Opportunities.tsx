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
import styles from "./Opportunities.module.css";
import type { ColumnsType } from "antd/es/table";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Content } = Layout;

interface TokenData {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
}

/** ⬇️ SOLO SE AGREGA recordatorios */
interface Opportunity {
  id: number;
  personaNombre: string;
  nombreEstado: string;
  productoNombre: string;
  fechaCreacion: string;
  personaCorreo: string;
  personalNombre: string;
  totalMarcaciones?: number;
  recordatorios: string[];
}

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

  const token = getCookie("token");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    setCurrentPage(1);
  }, [searchText, filterEstado, filterAsesor, dateRange, opportunities]);

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
          { params: { idUsuario, idRol } }
        );

        const raw: any[] = res.data?.oportunidad ?? [];
        const map = new Map<number, Opportunity>();

        raw.forEach((op) => {
          if (!map.has(op.id)) {
            map.set(op.id, {
              id: op.id,
              personaNombre: op.personaNombre,
              nombreEstado: op.nombreEstado,
              productoNombre: op.productoNombre,
              fechaCreacion: op.fechaCreacion,
              personaCorreo: op.personaCorreo,
              personalNombre: op.personalNombre,
              totalMarcaciones: Number(op.totalMarcaciones ?? 0),
              recordatorios: [],
            });
          }

          if (op.fechaRecordatorio) {
            map.get(op.id)!.recordatorios.push(op.fechaRecordatorio);
          }
        });

        const agrupadas = Array.from(map.values()).sort(
          (a, b) =>
            new Date(b.fechaCreacion).getTime() -
            new Date(a.fechaCreacion).getTime()
        );

        setOpportunities(agrupadas);
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

  const estadosUnicos = useMemo(() => {
    const estados = new Set<string>();
    opportunities.forEach((op) => {
      if (op.nombreEstado) estados.add(op.nombreEstado);
    });
    return Array.from(estados).sort();
  }, [opportunities]);

  const asesoresUnicos = useMemo(() => {
    const asesores = new Set<string>();
    opportunities.forEach((op) => {
      if (op.personalNombre) asesores.add(op.personalNombre);
    });
    return Array.from(asesores).sort();
  }, [opportunities]);

  const opportunitiesFiltradas = useMemo(() => {
    let filtradas = [...opportunities];

    if (searchText.trim()) {
      const busqueda = searchText.toLowerCase().trim();
      filtradas = filtradas.filter((op) => {
        return (
          op.personaNombre.toLowerCase().includes(busqueda) ||
          (op.personaCorreo || "").toLowerCase().includes(busqueda) ||
          op.productoNombre.toLowerCase().includes(busqueda) ||
          op.id.toString().includes(busqueda)
        );
      });
    }

    if (filterEstado !== "Todos") {
      filtradas = filtradas.filter((op) => op.nombreEstado === filterEstado);
    }

    if (filterAsesor !== "Todos") {
      filtradas = filtradas.filter((op) => op.personalNombre === filterAsesor);
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      const inicio = dateRange[0].startOf("day");
      const fin = dateRange[1].endOf("day");

      filtradas = filtradas.filter((op) => {
        const f = dayjs(op.fechaCreacion);
        return (
          (f.isAfter(inicio) || f.isSame(inicio, "day")) &&
          (f.isBefore(fin) || f.isSame(fin, "day"))
        );
      });
    }

    return filtradas;
  }, [opportunities, searchText, filterEstado, filterAsesor, dateRange]);

  const columns: ColumnsType<Opportunity> = [
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
      title: "Correo",
      dataIndex: "personaCorreo",
      key: "personaCorreo",
      sorter: (a: Opportunity, b: Opportunity) =>
        (a.personaCorreo || "").localeCompare(b.personaCorreo || ""),
      render: (personaCorreo: string) => personaCorreo || "-",
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
      title: "Programa",
      dataIndex: "productoNombre",
      key: "productoNombre",
      sorter: (a: Opportunity, b: Opportunity) =>
        a.productoNombre.localeCompare(b.productoNombre),
    },
    {
      title: "Total Marcaciones",
      dataIndex: "totalMarcaciones",
      key: "totalMarcaciones",
      sorter: (a: Opportunity, b: Opportunity) =>
        (a.totalMarcaciones ?? 0) - (b.totalMarcaciones ?? 0),
      render: (totalMarcaciones: number) => (
        <span>
          {typeof totalMarcaciones === "number" ? totalMarcaciones : "-"}
        </span>
      ),

      align: "center",
      width: 140,
    },
    {
      title: "Recordatorio",
      key: "recordatorios",
      width: 240,
      render: (_: any, record: Opportunity) =>
        record.recordatorios.length === 0 ? (
          "-"
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {record.recordatorios
              .filter(Boolean)
              .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
              .slice(0, 3)
              .map((r, i) => (
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
      title: "Asesor",
      dataIndex: "personalNombre",
      key: "personalNombre",
      sorter: (a: Opportunity, b: Opportunity) =>
        (a.personalNombre || "").localeCompare(b.personalNombre || ""),
      render: (personalNombre: string) => personalNombre || "-",
    },
    {
      title: "Acciones",
      key: "actions",
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
          <Tooltip title="Editar">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              style={{ backgroundColor: "#1f1f1f", borderColor: "#1f1f1f" }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Content style={{ padding: "20px", background: "#f5f5f5" }}>
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
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
          }}
        >
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
            style={{ width: "200px", borderRadius: "6px" }}
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
            style={{ width: "200px", borderRadius: "6px" }}
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
            style={{ borderRadius: "6px" }}
          />
          <Button onClick={handleLimpiarFiltros} className={styles.clearButton}>
            Limpiar filtros
          </Button>
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50vh",
            }}
          >
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert message="Error" description={error} type="error" showIcon />
        ) : (
        <Table
          columns={columns}
          dataSource={opportunitiesFiltradas}
          rowKey="id"
          className={styles.table}
          scroll={{ x: isMobile ? 800 : undefined }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"], // deben ser strings
            onChange: (page: number, newPageSize?: number) => {
              setCurrentPage(page);
              if (typeof newPageSize === "number") setPageSize(newPageSize);
            },
            // Opcionales útiles:
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total}`,
            hideOnSinglePage: true
          }}
        />
        )}
      </div>
    </Content>
  );
}
