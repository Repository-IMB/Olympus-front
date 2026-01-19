import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Table,
  Button,
  Tag,
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
  FileTextOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import moment, { type Moment } from "moment";
import SelectClient from "../SelectClient/SelectClient";
import { getCookie } from "../../utils/cookies";
import { jwtDecode } from "jwt-decode";
import api from "../../servicios/api";
import styles from "./Opportunities.module.css";
import type { ColumnsType } from "antd/es/table";
import { useSearchParams } from "react-router-dom";

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
  codigoLinkedin?: string;
  fechaCreacion: string;
  personaCorreo: string;
  personalNombre: string;
  totalMarcaciones?: number;
  recordatorios: string[];
}

interface Asesor {
  idUsuario: number;
  idPersonal: number;
  nombre: string;
}

const getReminderColor = (fechaRecordatorio: string): string => {
  const now = new Date().getTime();
  const recordatorioTime = new Date(fechaRecordatorio).getTime();

  const diffMs = now - recordatorioTime;
  const diffHours = diffMs / (1000 * 60 * 60);

  // 🔵 AÚN NO SE DESACTIVA (futuro)
  if (diffHours < 0) {
    const hoursRemaining = Math.abs(diffHours);

    if (hoursRemaining <= 5) return "#ff4d4f"; // rojo (por vencer)
    if (hoursRemaining < 24) return "#ffd666"; // amarillo
    return "#1677ff"; // azul
  }

  // 0 a 1 hora DESPUÉS de desactivarse
  if (diffHours >= 0 && diffHours < 1) {
    return "#ff4d4f"; // rojo
  }

  // 1 a 25 horas DESPUÉS de desactivarse
  if (diffHours >= 1 && diffHours <= 25) {
    return "#bfbfbf"; // plomo
  }

  // Más de 25 horas
  return "#bfbfbf";
};

export default function OpportunitiesInterface() {
  const [isSelectClientModalVisible, setIsSelectClientModalVisible] =
    useState(false);

  const navigate = useNavigate();

  const token = getCookie("token");

  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const [data, setData] = useState<Opportunity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterAsesor, setFilterAsesor] = useState<string>("Todos");
  const [dateRange, setDateRange] = useState<
    [Moment | null, Moment | null] | null
  >(null);

  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1,
  );

  const [pageSize, setPageSize] = useState(
    Number(searchParams.get("pageSize")) || 10,
  );

  const [searchText, setSearchText] = useState(
    searchParams.get("search") || "",
  );

  const [filterEstado, setFilterEstado] = useState(
    searchParams.get("estado") || "Todos",
  );

  const [filterCodigoLinkedin, setFilterCodigoLinkedin] =
    useState<string>("Todos");

  const [codigosLinkedin, setCodigosLinkedin] = useState<string[]>([]);
  const [loadingCodigosLinkedin, setLoadingCodigosLinkedin] = useState(false);

  useEffect(() => {
    setSearchParams({
      page: currentPage.toString(),
      pageSize: pageSize.toString(),
      search: searchText || "",
      estado: filterEstado !== "Todos" ? filterEstado : "",
    });
  }, [currentPage, pageSize, searchText, filterEstado]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [loadingAsesores, setLoadingAsesores] = useState(false);

  const obtenerAsesores = async () => {
    try {
      setLoadingAsesores(true);

      const res = await api.get("api/CFGModUsuarios/ObtenerUsuariosPorRol/1");

      if (res.data?.usuarios) {
        const lista = res.data.usuarios.map((u: any) => ({
          idUsuario: u.id,
          idPersonal: u.idPersonal,
          nombre: u.nombre,
        }));

        setAsesores(lista);
      }
    } catch (e) {
      console.error("Error cargando asesores", e);
      setAsesores([]);
    } finally {
      setLoadingAsesores(false);
    }
  };

  useEffect(() => {
    obtenerAsesores();
  }, []);

  const asesoresUnicos = useMemo(() => {
    const set = new Set<string>();
    asesores.forEach((a) => {
      if (a.nombre) set.add(a.nombre);
    });
    return Array.from(set).sort();
  }, [asesores]);

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
        ] || "0",
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

  const cargarCodigosLinkedin = async () => {
    try {
      setLoadingCodigosLinkedin(true);

      const res = await api.get(
        "/api/VTAModVentaProducto/ObtenerCodigosUnicos",
      );

      setCodigosLinkedin(res.data.codigosLinkedin ?? []);
    } catch (e) {
      console.error("Error cargando códigos LinkedIn", e);
      setCodigosLinkedin([]);
    } finally {
      setLoadingCodigosLinkedin(false);
    }
  };

  useEffect(() => {
    cargarCodigosLinkedin();
  }, []);

  useEffect(() => {
    if (!idUsuario || !idRol) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await api.get(
          "/api/VTAModVentaOportunidad/ObtenerOportunidadesPaginadas",
          {
            params: {
              idUsuario,
              idRol,
              page: currentPage,
              pageSize,
              search: searchText || null,
              estadoFiltro: filterEstado !== "Todos" ? filterEstado : null,
              asesorFiltro: filterAsesor !== "Todos" ? filterAsesor : null,
              codigoLinkedinFiltro:
                filterCodigoLinkedin !== "Todos" ? filterCodigoLinkedin : null,
              fechaInicio: dateRange?.[0]?.format("YYYY-MM-DD") ?? null,
              fechaFin: dateRange?.[1]?.format("YYYY-MM-DD") ?? null,
            },
          },
        );

        const mapped: Opportunity[] = (res.data.oportunidad ?? []).map(
          (op: any) => ({
            id: op.id,
            personaNombre: op.personaNombre ?? "",
            personaTelefono: op.personaTelefono ?? "",
            nombreEstado: op.nombreEstado ?? "",
            productoNombre: op.productoNombre ?? "",
            codigoLinkedin: op.codigoLinkedin ?? "-",
            fechaCreacion: op.fechaCreacion,
            personaCorreo: op.personaCorreo ?? "",
            personalNombre: op.personalNombre ?? "",
            totalMarcaciones: op.totalOportunidadesPersona ?? 0,

            recordatorios: op.recordatoriosJson
              ? JSON.parse(op.recordatoriosJson).map(
                  (r: any) => r.FechaRecordatorio,
                )
              : [],
          }),
        );

        setData(mapped);
        setTotal(res.data.total ?? 0);
      } catch (e: any) {
        setError(
          e?.response?.data?.mensaje ??
            e?.message ??
            "Error al obtener oportunidades",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    idUsuario,
    idRol,
    currentPage,
    pageSize,
    searchText,
    filterEstado,
    filterAsesor,
    filterCodigoLinkedin,
    dateRange,
  ]);

  const handleClick = (id: number) => {
    console.log(id);
    navigate(`/leads/oportunidades/${id}`);
  };

  const handleLimpiarFiltros = () => {
    setSearchText("");
    setFilterEstado("Todos");
    setFilterAsesor("Todos");
    setDateRange(null);
  };

  const estadosUnicos = [
    "Registrado",
    "Calificado",
    "Potencial",
    "Promesa",
    "Perdido",
    "Convertido",
    "Cobranza",
    "No Calificado",
  ];

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
      title: "Telefono",
      dataIndex: "personaTelefono",
      key: "personaTelefono",
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
        } else if (nombreEstado === "Potencial") {
          color = "blue";
        } else if (nombreEstado === "Promesa") {
          color = "blue";
        } else if (nombreEstado === "No calificado") {
          color = "red";
        } else if (nombreEstado === "Perdido") {
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
      title: "Código LinkedIn",
      dataIndex: "codigoLinkedin",
      key: "codigoLinkedin",
      sorter: (a: Opportunity, b: Opportunity) =>
        (a.codigoLinkedin || "").localeCompare(b.codigoLinkedin || ""),
      render: (codigo: string) =>
        codigo && codigo !== "-" ? <Tag color="geekblue">{codigo}</Tag> : "-",
      width: 160,
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
      align: "center",
      render: (_: any, record: Opportunity) => (
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
  ];

  return (
    <Content style={{ padding: "20px", background: "#f5f5f5" }}>
      {/* Action Buttons */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "right",
          alignContent: "right",
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
            showSearch
            virtual={false}
            listHeight={220}
            optionFilterProp="children"
          >
            <Option value="Todos">Todos los estados</Option>
            {estadosUnicos.map((estado) => (
              <Option key={estado} value={estado}>
                {estado}
              </Option>
            ))}
          </Select>
          <Select
            showSearch
            value={filterAsesor}
            onChange={setFilterAsesor}
            placeholder="Seleccionar asesor"
            style={{ width: "200px", borderRadius: "6px" }}
            disabled={asesoresUnicos.length === 0}
            virtual={false}
            listHeight={220}
            optionFilterProp="children"
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
            value={filterCodigoLinkedin}
            onChange={setFilterCodigoLinkedin}
            placeholder="Código LinkedIn"
            style={{ width: "200px", borderRadius: "6px" }}
            loading={loadingCodigosLinkedin}
            showSearch
            virtual={false}
            listHeight={220}
            optionFilterProp="children"
          >
            <Option value="Todos">Todos códigos LinkedIn</Option>

            {codigosLinkedin.map((codigo) => (
              <Option key={codigo} value={codigo}>
                {codigo}
              </Option>
            ))}
          </Select>

          <RangePicker
            value={dateRange}
            onChange={(dates) =>
              setDateRange(dates as [Moment | null, Moment | null] | null)
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
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              onChange: (page, size) => {
                setCurrentPage(page);
                if (size) setPageSize(size);
              },
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} de ${total}`,
            }}
          />
        )}
      </div>
    </Content>
  );
}
