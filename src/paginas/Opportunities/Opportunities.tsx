import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Layout,
  Table,
  Button,
  Tag,
  Spin,
  Alert,
  Tooltip,
  Select,
  Input,
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

const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;

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
  personaTelefono?: string;
  personalNombre: string;
  pais: string;
  totalMarcaciones?: number;
  recordatorios: string[];
  codigoLanzamiento?: string;
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [listaPaisesCompleta, setListaPaisesCompleta] = useState<string[]>([]);
  const [total, setTotal] = useState<number>(0);
  const didInit = useRef(false);

  // DATA
  const [allData, setAllData] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filterPaisSelect = (input: string, option?: any) => {
    if (!option?.children) return false;
    return option.children
      .toString()
      .toLowerCase()
      .includes(input.toLowerCase());
  };

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

  const [filterAsesor, setFilterAsesor] = useState(
    searchParams.get("asesor") || "Todos",
  );

  const [filterPais, setFilterPais] = useState<string>("Todos");

  const [filterCodigoLinkedin, setFilterCodigoLinkedin] = useState(
    searchParams.get("codigoLinkedin") || "Todos",
  );

  const [dateRange, setDateRange] = useState<
    [Moment | null, Moment | null] | null
  >(
    searchParams.get("fechaInicio") && searchParams.get("fechaFin")
      ? [
          moment(searchParams.get("fechaInicio")),
          moment(searchParams.get("fechaFin")),
        ]
      : null,
  );

  const [codigosLinkedin, setCodigosLinkedin] = useState<string[]>([]);
  const [loadingCodigosLinkedin, setLoadingCodigosLinkedin] = useState(false);
  const isSyncingFromUrl = useRef(false);

  useEffect(() => {
    isSyncingFromUrl.current = true;

    setCurrentPage(Number(searchParams.get("page")) || 1);
    setPageSize(Number(searchParams.get("pageSize")) || 10);
    setSearchText(searchParams.get("search") || "");
    setFilterEstado(searchParams.get("estado") || "Todos");
    setFilterAsesor(searchParams.get("asesor") || "Todos");

    const paisFromUrl = searchParams.get("pais");
    setFilterPais(paisFromUrl && paisFromUrl !== "" ? paisFromUrl : "Todos");

    setFilterCodigoLinkedin(searchParams.get("codigoLinkedin") || "Todos");

    if (searchParams.get("fechaInicio") && searchParams.get("fechaFin")) {
      setDateRange([
        moment(searchParams.get("fechaInicio")),
        moment(searchParams.get("fechaFin")),
      ]);
    } else {
      setDateRange(null);
    }
  }, [searchParams]);

  useEffect(() => {
    const lastId = sessionStorage.getItem("lastViewedLeadId");
    if (lastId) setHighlightedId(lastId);
    if (!didInit.current) {
      didInit.current = true;
      return;
    }
    if (isSyncingFromUrl.current) {
      isSyncingFromUrl.current = false;
      return;
    }
    setSearchParams({
      page: currentPage.toString(),
      pageSize: pageSize.toString(),
      search: searchText || "",
      estado: filterEstado !== "Todos" ? filterEstado : "",
      asesor: filterAsesor !== "Todos" ? filterAsesor : "",
      pais: filterPais !== "Todos" ? filterPais : "",
      codigoLinkedin:
        filterCodigoLinkedin !== "Todos" ? filterCodigoLinkedin : "",
      fechaInicio: dateRange?.[0]?.format("YYYY-MM-DD") ?? "",
      fechaFin: dateRange?.[1]?.format("YYYY-MM-DD") ?? "",
    });
  }, [
    currentPage,
    pageSize,
    searchText,
    filterEstado,
    filterAsesor,
    filterPais,
    filterCodigoLinkedin,
    dateRange,
  ]);

  // Efecto Scroll
  useEffect(() => {
    if (!loading && highlightedId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`row-${highlightedId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, highlightedId]);

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

      const res = await api.get("/api/CFGModUsuarios/ObtenerUsuariosPorRol/1");

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
      console.error(e);
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

  // Cargar lista COMPLETA de países (Truco Ninja)
  useEffect(() => {
    if (!idUsuario || !idRol) return;
    const cargarPaises = async () => {
      try {
        const res = await api.get(
          "/api/VTAModVentaOportunidad/ObtenerSalesProcess",
          {
            params: { idUsuario, idRol },
          },
        );
        const paisesSet = new Set<string>();
        const extraer = (lista: any[]) => {
          if (!lista) return;
          lista.forEach((item) => {
            if (
              item.nombrePais &&
              item.nombrePais !== "Sin País" &&
              item.nombrePais !== "-"
            ) {
              paisesSet.add(item.nombrePais);
            }
          });
        };
        if (res.data?.salesData) {
          Object.values(res.data.salesData).forEach((lista: any) =>
            extraer(lista),
          );
        }
        if (res.data?.otrosEstados) {
          Object.values(res.data.otrosEstados).forEach((lista: any) =>
            extraer(lista),
          );
        }
        setListaPaisesCompleta(Array.from(paisesSet).sort());
      } catch (e) {
        console.error("Error cargando lista de países", e);
      }
    };
    cargarPaises();
  }, [idUsuario, idRol]);

  // CARGA DE DATOS: Traemos TODO de una vez (PageSize grande)
  useEffect(() => {
    if (!idUsuario || !idRol) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Pedimos una página gigante para simular "Traer Todo" y filtrar en Front
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
              Pais: filterPais,
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
            pais: op.personaPaisNombre || "Sin país",
            codigoLanzamiento: op.codigoLanzamiento ?? "",
            recordatorios: op.recordatoriosJson
              ? JSON.parse(op.recordatoriosJson).map(
                  (r: any) => r.FechaRecordatorio,
                )
              : [],
          }),
        );

        setAllData(mapped);
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
    filterPais,
    dateRange,
  ]);

  const handleClick = (id: number) => {
    const returnUrl = `/leads/Opportunities?${searchParams.toString()}`;

    sessionStorage.setItem("lastViewedLeadId", id.toString());
    sessionStorage.setItem("leadsReturnTo", returnUrl);

    navigate({
      pathname: `/leads/oportunidades/${id}`,
      state: {
        returnTo: returnUrl,
      },
    });
  };

  const handleLimpiarFiltros = () => {
    setSearchText("");
    setFilterEstado("Todos");
    setFilterAsesor("Todos");
    setFilterPais("Todos");
    setDateRange(null);
    setCurrentPage(1); // Volver a la página 1 al limpiar
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
      sorter: (a, b) =>
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
      sorter: (a, b) => a.personaNombre.localeCompare(b.personaNombre),
    },
    {
      title: "País",
      dataIndex: "pais",
      key: "pais",
      sorter: (a, b) => a.pais.localeCompare(b.pais),
      render: (pais: string) => pais || "-",
    },
    {
      title: "Correo",
      dataIndex: "personaCorreo",
      key: "personaCorreo",
      render: (personaCorreo: string) => personaCorreo || "-",
    },
    {
      title: "Telefono",
      dataIndex: "personaTelefono",
      key: "personaTelefono",
      sorter: (a: Opportunity, b: Opportunity) =>
        (a.personaTelefono || "").localeCompare(b.personaTelefono || ""),
      render: (personaTelefono: string) => personaTelefono || "-",
    },
    {
      title: "Estado",
      dataIndex: "nombreEstado",
      key: "nombreEstado",
      sorter: (a, b) => a.nombreEstado.localeCompare(b.nombreEstado),
      render: (nombreEstado: string) => {
        let color = "green";
        if (
          ["Calificado", "Registrado", "Potencial", "Promesa"].includes(
            nombreEstado,
          )
        )
          color = "blue";
        else if (["No calificado", "Perdido"].includes(nombreEstado))
          color = "red";
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
      sorter: (a, b) => a.productoNombre.localeCompare(b.productoNombre),
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
      sorter: (a, b) => (a.totalMarcaciones ?? 0) - (b.totalMarcaciones ?? 0),
      render: (val) => <span>{typeof val === "number" ? val : "-"}</span>,
      align: "center",
      width: 140,
    },
    {
      title: "Recordatorio",
      key: "recordatorios",
      width: 240,
      render: (_, record) =>
        record.recordatorios.length === 0 ? (
          "-"
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {record.recordatorios.slice(0, 3).map((r, i) => (
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
      sorter: (a, b) =>
        (a.personalNombre || "").localeCompare(b.personalNombre || ""),
      render: (val) => val || "-",
    },
    {
      title: "Acciones",
      key: "actions",
      align: "center",
      render: (_, record) => (
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
            placeholder="Buscar por nombre, correo, programa, ID o cód. lanzamiento"
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
            showSearch
            value={filterPais}
            onChange={setFilterPais}
            placeholder="Seleccionar país"
            style={{ width: "200px", borderRadius: "6px" }}
            virtual={false}
            autoClearSearchValue={false}
            dropdownMatchSelectWidth={false}
            dropdownStyle={{ maxHeight: 260, overflow: "auto" }}
            filterOption={filterPaisSelect}
            optionFilterProp="children"
          >
            <Option value="Todos">Todos los países</Option>
            {listaPaisesCompleta.map((p) => (
              <Option key={p} value={p}>
                {p}
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
            dataSource={allData}
            rowKey="id"
            loading={loading}
            onRow={(record) => ({
              id: `row-${record.id}`,
              style:
                record.id.toString() === highlightedId
                  ? {
                      backgroundColor: "#e6f7ff",
                      transition: "background-color 0.5s ease",
                    }
                  : undefined,
              onClick: () => handleClick(record.id),
            })}
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
