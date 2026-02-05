import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Spin,
  message,
  Select,
  DatePicker,
  Tag,
  Button,
  Alert,
  Badge,
} from "antd";
import { getCookie } from "../../utils/cookies";
import api from "../../servicios/api";
import { jwtDecode } from "jwt-decode";
import type { ColumnsType } from "antd/es/table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { UpOutlined, DownOutlined } from "@ant-design/icons";
import { obtenerPaises, type Pais } from "../../config/rutasApi";

// ✅ OJO: AntD v5 usa dayjs por defecto. Si tu proyecto aún usa moment, igual funciona,
// pero los typings de Moment suelen causar lío. Por eso usamos any aquí para el RangePicker.
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface TokenData {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
}

interface DashboardItem {
  personal_Id: number;
  personal_Nombre: string;
  leadsAsignados: number;
  leadsProcesados: number;
  convertidos: number;
  enCobranza: number;
  porcentajeConversion: number;
  diasActivos: number;
  totalLlamadas: number;
  llamadasPorDia: number;
  leadsAsignadosPorDia: number;
}

interface DashboardResumenGeneral {
  totalLeads: number;
  totalConvertidos: number;
  totalCobranza: number;
  porcentajeGlobalConversion: number;
}

interface DashboardProductoVenta {
  codigoLanzamiento: string;
  nombre: string;
  totalOportunidades: number;
  esTop: boolean;
}

interface Asesor {
  idPersonal: number; // OJO: tu select manda "idUsuario del personal" según tu comentario
  nombre: string;
}

const getCategoria = (item: DashboardItem) => {
  if (item.llamadasPorDia >= 30)
    return { nivel: "TOP", label: "Top performer", color: "green" as const };

  if (item.llamadasPorDia >= 20)
    return {
      nivel: "BUENO",
      label: "Buen rendimiento",
      color: "gold" as const,
    };

  if (item.llamadasPorDia >= 10)
    return {
      nivel: "BAJO",
      label: "Bajo rendimiento",
      color: "orange" as const,
    };

  return { nivel: "CRITICO", label: "Crítico", color: "red" as const };
};

function safeNumber(v: any, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export default function Dashboard() {
  const token = getCookie("token") ?? "";

  // =========================
  // JWT
  // =========================
  const { idUsuario, idRol } = useMemo(() => {
    if (!token) return { idUsuario: 0, idRol: 0 };

    try {
      const decoded = jwtDecode<TokenData>(token);

      const rolesMap: Record<string, number> = {
        Asesor: 1,
        Supervisor: 2,
        Gerente: 3,
        Administrador: 4,
        Desarrollador: 5,
      };

      const idU = safeNumber(
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ],
        0,
      );

      const rolNombre =
        decoded[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ] || "";

      const idR = rolesMap[rolNombre] ?? 0;

      return { idUsuario: idU, idRol: idR };
    } catch (e) {
      console.error("Error decodificando token", e);
      return { idUsuario: 0, idRol: 0 };
    }
  }, [token]);

  // =========================
  // STATE
  // =========================
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAsesores, setLoadingAsesores] = useState<boolean>(true);

  const [data, setData] = useState<DashboardItem[]>([]);
  const [asesores, setAsesores] = useState<Asesor[]>([]);

  //“Todos” como string estable (no uses null dentro de Select)
  const [asesorFiltro, setAsesorFiltro] = useState<string>("ALL");

  const [fechaHistorial, setFechaHistorial] = useState<[any, any] | null>(null);
  const [fechaFormulario, setFechaFormulario] = useState<[any, any] | null>(
    null,
  );

  const fechaInicioHistorial =
    fechaHistorial?.[0]?.format("YYYY-MM-DD") ?? null;
  const fechaFinHistorial = fechaHistorial?.[1]?.format("YYYY-MM-DD") ?? null;

  const fechaInicioFormulario =
    fechaFormulario?.[0]?.format("YYYY-MM-DD") ?? null;
  const fechaFinFormulario = fechaFormulario?.[1]?.format("YYYY-MM-DD") ?? null;

  const [error, setError] = useState<string | null>(null);

  const [resumenBackend, setResumenBackend] =
    useState<DashboardResumenGeneral | null>(null);

  const [productos, setProductos] = useState<DashboardProductoVenta[]>([]);

  const [paises, setPaises] = useState<Pais[]>([]);
  const [paisFiltro, setPaisFiltro] = useState<string>("ALL");
  const [loadingPaises, setLoadingPaises] = useState(false);

  const ALERTAS_PAGE_SIZE = 6;
  const [alertasPage, setAlertasPage] = useState(0);
  const isHistorialDisabled = Boolean(fechaFormulario);
  const isFormularioDisabled = Boolean(fechaHistorial);
  const exportarPDF = () => {
    if (!data || data.length === 0) {
      message.warning("No hay datos para exportar");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(16);
    doc.text("Dashboard de Rendimiento Comercial", 14, 15);

    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 22);

    /* =====================
     RESUMEN
  ===================== */
    if (resumen) {
      autoTable(doc, {
        startY: 30,
        theme: "grid",
        styles: { fontSize: 9 },
        head: [
          ["Total", "Prom. llamadas/día", "Top", "Buenos", "Bajo", "Críticos"],
        ],
        body: [
          [
            resumen.total,
            resumen.promedioLlamadas,
            resumen.top,
            resumen.bueno,
            resumen.bajo,
            resumen.critico,
          ],
        ],
      });
    }

    /* =====================
     TABLA PRINCIPAL
  ===================== */
    autoTable(doc, {
      startY: (doc as any).lastAutoTable?.finalY + 10 || 40,
      theme: "striped",
      styles: { fontSize: 8 },
      head: [
        [
          "Asesor",
          "Leads Asignados",
          "Leads Procesados",
          "% Sin procesar",
          "Convertidos",
          "Cobranza",
          "% Conv.",
          "Días activos",
          "Total llamadas",
          "Llamadas/día",
          "Nivel",
        ],
      ],
      body: data.map((d) => {
        const sinProcesar =
          d.leadsAsignados === 0
            ? 0
            : ((d.leadsAsignados - d.leadsProcesados) / d.leadsAsignados) * 100;

        const categoria = getCategoria(d);

        return [
          d.personal_Nombre,
          d.leadsAsignados,
          d.leadsProcesados,
          `${sinProcesar.toFixed(2)}%`,
          d.convertidos,
          d.enCobranza,
          `${d.porcentajeConversion.toFixed(2)}%`,
          d.diasActivos,
          d.totalLlamadas,
          d.llamadasPorDia.toFixed(2),
          categoria.label,
        ];
      }),
    });

    /* =====================
     ALERTAS CRÍTICAS
  ===================== */
    if (alertasCriticas.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        theme: "grid",
        styles: { fontSize: 9 },
        head: [["Alertas críticas"]],
        body: alertasCriticas.map((a) => [
          `${a.personal_Nombre} – ${a.llamadasPorDia.toFixed(2)} llamadas/día`,
        ]),
      });
    }

    doc.save("dashboard-rendimiento.pdf");
  };

  // =========================
  // DERIVADOS
  // =========================
  const dataGrafico = useMemo(
    () =>
      [...data].sort(
        (a, b) => (b.llamadasPorDia ?? 0) - (a.llamadasPorDia ?? 0),
      ),
    [data],
  );

  const alertasCriticas = useMemo(
    () => data.filter((d) => getCategoria(d).nivel === "CRITICO"),
    [data],
  );

  const resumen = useMemo(() => {
    if (!data.length) return null;

    const total = data.length;
    const promedioLlamadas =
      data.reduce((s, d) => s + (Number(d.llamadasPorDia) || 0), 0) / total;

    const conteo = { top: 0, bueno: 0, bajo: 0, critico: 0 };

    data.forEach((d) => {
      const c = getCategoria(d).nivel;
      if (c === "TOP") conteo.top++;
      else if (c === "BUENO") conteo.bueno++;
      else if (c === "BAJO") conteo.bajo++;
      else conteo.critico++;
    });

    return {
      total,
      promedioLlamadas: Number.isFinite(promedioLlamadas)
        ? promedioLlamadas.toFixed(2)
        : "0.00",
      ...conteo,
    };
  }, [data]);

  useEffect(() => {
    setAlertasPage(0);
  }, [alertasCriticas]);

  // =========================
  // API: ASESORES
  // =========================
  useEffect(() => {
    const obtenerAsesores = async () => {
      try {
        setLoadingAsesores(true);
        if (!token) {
          setAsesores([]);
          return;
        }

        const res = await api.get(
          "/api/CFGModUsuarios/ObtenerUsuariosPorRol/1",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const list: Asesor[] =
          res.data?.usuarios?.map((u: any) => ({
            // ⚠️ tu comentario: "el idpersonal que manda es el idusuario del personal"
            // entonces aquí guardamos ID = u.id (usuario) si es lo que realmente manda el endpoint.
            // Si tu endpoint ya devuelve idPersonal real, cambia a u.idPersonal.
            idPersonal: safeNumber(u.id ?? u.idUsuario ?? u.idPersonal, 0),
            nombre: String(u.nombre ?? "").trim(),
          })) ?? [];

        setAsesores(list.filter((x) => x.idPersonal > 0 && x.nombre));
      } catch (e: any) {
        console.error("Error cargando asesores", e);
        setAsesores([]);
      } finally {
        setLoadingAsesores(false);
      }
    };

    obtenerAsesores();
  }, [token]);

  const cargarPaises = async () => {
    try {
      setLoadingPaises(true);
      const data = await obtenerPaises();
      setPaises(data);
    } catch (err) {
      console.error("Error cargando países", err);
      message.error("Error al cargar países");
    } finally {
      setLoadingPaises(false);
    }
  };

  useEffect(() => {
    cargarPaises();
  }, []);

  // =========================
  // API: DASHBOARD
  // =========================
  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        setError(null);

        if (!token) {
          setLoading(false);
          setData([]);
          setError("Sesión no válida (sin token).");
          return;
        }

        if (!idUsuario || !idRol) {
          setLoading(false);
          setData([]);
          setError("Sesión inválida (sin idUsuario / idRol).");
          return;
        }

        setLoading(true);

        const personalFiltro = asesorFiltro === "ALL" ? null : asesorFiltro;
        const res = await api.post(
          "/api/CFGModDashboard/ObtenerRendimientoPersonal",
          {
            idUsuario,
            idRol,
            paisFiltro: paisFiltro === "ALL" ? null : paisFiltro,
            personalFiltro, // <-- string o null
            fechaInicioHistorial,
            fechaFinHistorial,

            fechaInicioFormulario,
            fechaFinFormulario,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const raw = res.data?.datos ?? [];
        const mapped: DashboardItem[] = raw.map((x: any) => ({
          personal_Id: safeNumber(
            x.personal_Id ?? x.personalId ?? x.personal_id,
            0,
          ),
          personal_Nombre: String(
            x.personal_Nombre ?? x.personalNombre ?? x.personal_nombre ?? "",
          ).trim(),
          leadsAsignados: safeNumber(x.leadsAsignados, 0),
          leadsProcesados: safeNumber(x.leadsProcesados, 0),
          convertidos: safeNumber(x.convertidos, 0),
          enCobranza: safeNumber(x.enCobranza, 0),
          porcentajeConversion: safeNumber(x.porcentajeConversion, 0),
          diasActivos: safeNumber(x.diasActivos, 0),
          totalLlamadas: safeNumber(x.totalLlamadas, 0),
          llamadasPorDia: safeNumber(x.llamadasPorDia, 0),
          leadsAsignadosPorDia: safeNumber(x.leadsAsignadosPorDia, 0),
        }));

        setData(mapped);
        setResumenBackend(res.data?.resumen ?? null);
        const productosRaw = res.data?.productos ?? [];

        const maxVendidos = Math.max(
          ...productosRaw.map((p: any) => safeNumber(p.totalOportunidades, 0)),
          0,
        );

        const productosMapped: DashboardProductoVenta[] = productosRaw.map(
          (p: any) => ({
            codigoLanzamiento: p.codigoLanzamiento,
            nombre: p.nombre,
            totalOportunidades: safeNumber(p.totalOportunidades, 0),
            esTop:
              safeNumber(p.totalOportunidades, 0) === maxVendidos &&
              maxVendidos > 0,
          }),
        );

        setProductos(productosMapped);
      } catch (e: any) {
        console.error("Error cargando dashboard", e);
        const msg =
          e?.response?.data?.mensaje ||
          e?.message ||
          "Error al cargar dashboard";
        setError(msg);
        message.error(msg);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    cargarDashboard();
  }, [
    token,
    idUsuario,
    idRol,
    asesorFiltro,
    paisFiltro,
    fechaInicioHistorial,
    fechaFinHistorial,
    fechaInicioFormulario,
    fechaFinFormulario,
  ]);

  // =========================
  // TABLA
  // =========================
  const columns: ColumnsType<DashboardItem> = [
    {
      title: "Asesor",
      dataIndex: "personal_Nombre",
      key: "personal_Nombre",
      sorter: (a, b) =>
        (a.personal_Nombre || "").localeCompare(b.personal_Nombre || ""),
    },
    {
      title: "Leads asignados",
      dataIndex: "leadsAsignados",
      align: "center",
      sorter: (a, b) => (a.leadsAsignados ?? 0) - (b.leadsAsignados ?? 0),
    },
    {
      title: "Leads procesados",
      dataIndex: "leadsProcesados",
      align: "center",
      sorter: (a, b) => (a.leadsProcesados ?? 0) - (b.leadsProcesados ?? 0),
    },
    {
      title: "Convertidos",
      dataIndex: "convertidos",
      align: "center",
      sorter: (a, b) => a.convertidos - b.convertidos,
    },
    {
      title: "Cobranza",
      dataIndex: "enCobranza",
      align: "center",
      sorter: (a, b) => a.enCobranza - b.enCobranza,
    },
    {
      title: "% Conversión",
      dataIndex: "porcentajeConversion",
      align: "center",
      render: (v: number) => `${Number(v ?? 0).toFixed(2)}%`,
      sorter: (a, b) => a.porcentajeConversion - b.porcentajeConversion,
    },
    {
      title: "Días activos",
      dataIndex: "diasActivos",
      align: "center",
      sorter: (a, b) => (a.diasActivos ?? 0) - (b.diasActivos ?? 0),
    },
    {
      title: "Total llamadas",
      dataIndex: "totalLlamadas",
      align: "center",
      sorter: (a, b) => (a.totalLlamadas ?? 0) - (b.totalLlamadas ?? 0),
    },
    {
      title: "Llamadas / día",
      dataIndex: "llamadasPorDia",
      align: "center",
      sorter: (a, b) => (a.llamadasPorDia ?? 0) - (b.llamadasPorDia ?? 0),
      render: (v: any) => Number(v ?? 0).toFixed(2),
    },
    {
      title: "Nivel",
      align: "center",
      key: "nivel",
      render: (_, r) => {
        const c = getCategoria(r);
        return <Tag color={c.color}>{c.label}</Tag>;
      },
    },
  ];

  // =========================
  // MINI “GRÁFICA” SIN RECHARTS
  // (porque te daba error de módulo)
  // =========================
  const maxLlamadas = useMemo(() => {
    const max = Math.max(...dataGrafico.map((d) => d.llamadasPorDia ?? 0), 0);
    return max > 0 ? max : 1;
  }, [dataGrafico]);

  const alertasVisibles = useMemo(() => {
    const start = alertasPage * ALERTAS_PAGE_SIZE;
    return alertasCriticas.slice(start, start + ALERTAS_PAGE_SIZE);
  }, [alertasCriticas, alertasPage]);

  // =========================
  // RENDER
  // =========================
  return (
    <>
      <Title level={3}>Dashboard de Rendimiento</Title>

      <Row>
        {/* FILTROS */}
        <Col span={24}>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              {/* PAÍS */}
              <Col xs={24} md={6}>
                <div className="filterLabel">País</div>
                <Select
                  value={paisFiltro}
                  loading={loadingPaises}
                  onChange={(v) => setPaisFiltro(String(v))}
                  style={{ width: "100%" }}
                  showSearch
                  optionFilterProp="children"
                  getPopupContainer={() => document.body}
                  listHeight={260}
                  virtual={false}
                >
                  <Select.Option value="ALL">Todos</Select.Option>
                  {paises.map((p) => (
                    <Select.Option key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </Select.Option>
                  ))}
                </Select>
              </Col>

              {/* ASESOR */}
              <Col xs={24} md={6}>
                <div className="filterLabel">Asesor</div>
                <Select
                  value={asesorFiltro}
                  loading={loadingAsesores}
                  onChange={(v) => setAsesorFiltro(String(v))}
                  style={{ width: "100%" }}
                  showSearch
                  optionFilterProp="children"
                  getPopupContainer={() => document.body}
                  listHeight={260}
                  virtual={false}
                >
                  <Select.Option value="ALL">Todos</Select.Option>
                  {asesores.map((a) => (
                    <Select.Option
                      key={a.idPersonal}
                      value={String(a.idPersonal)}
                    >
                      {a.nombre}
                    </Select.Option>
                  ))}
                </Select>
              </Col>

              {/* FECHA HISTORIAL */}
              <Col xs={24} md={6}>
                <div className="filterLabel">Fecha historial de estado</div>
                <RangePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  value={fechaHistorial}
                  disabled={isHistorialDisabled}
                  onChange={(v) => {
                    setFechaHistorial(v);
                    if (v) setFechaFormulario(null);
                  }}
                  allowClear
                />
              </Col>

              {/* FECHA FORMULARIO */}
              <Col xs={24} md={6}>
                <div className="filterLabel">Fecha de formulario</div>
                <RangePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  value={fechaFormulario}
                  disabled={isFormularioDisabled}
                  onChange={(v) => {
                    setFechaFormulario(v);
                    if (v) setFechaHistorial(null);
                  }}
                  allowClear
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
      {error && (
        <Alert
          style={{ marginBottom: 12 }}
          type="error"
          showIcon
          message="No se pudo cargar el dashboard"
          description={error}
        />
      )}

      {alertasCriticas.length > 0 && (
        <Card
          title={
            <>
              ⚠️ Alertas críticas{" "}
              <Badge
                count={alertasCriticas.length}
                style={{ backgroundColor: "#ff4d4f" }}
              />
            </>
          }
          style={{
            marginBottom: 16,
            borderLeft: "6px solid #ff4d4f",
          }}
        >
          <Row gutter={[16, 16]}>
            {alertasVisibles.map((a) => {
              const s =
                a.llamadasPorDia < 5
                  ? { bg: "#fff1f0", tag: "error", label: "Crítico severo" }
                  : {
                      bg: "#fff7e6",
                      tag: "warning",
                      label: "Crítico moderado",
                    };

              return (
                <Col xs={24} md={12} lg={8} key={a.personal_Id}>
                  <Card
                    size="small"
                    bordered={false}
                    style={{
                      background: s.bg,
                      borderRadius: 8,
                    }}
                  >
                    <Title level={5} style={{ marginBottom: 4 }}>
                      {a.personal_Nombre}
                    </Title>

                    <Text type="secondary">Llamadas promedio</Text>

                    <Title level={4} style={{ margin: 0 }}>
                      {Number(a.llamadasPorDia).toFixed(2)}
                    </Title>

                    <Tag color={s.tag} style={{ marginTop: 8 }}>
                      {s.label}
                    </Tag>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* CONTROLES */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 16,
              gap: 12,
            }}
          >
            <Button
              icon={<UpOutlined />}
              disabled={alertasPage === 0}
              onClick={() => setAlertasPage((p) => Math.max(p - 1, 0))}
              type="default"
            >
              Ver menos
            </Button>

            <Button
              icon={<DownOutlined />}
              disabled={
                (alertasPage + 1) * ALERTAS_PAGE_SIZE >= alertasCriticas.length
              }
              onClick={() => setAlertasPage((p) => p + 1)}
              type="primary"
              ghost
            >
              Ver más
            </Button>
          </div>
        </Card>
      )}

      {/* RESUMEN */}
      {resumen && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} md={6}>
            <Card>
              <Title level={5}>Total asesores</Title>
              <Title level={3}>{resumen.total}</Title>
            </Card>
          </Col>

          <Col xs={12} md={6}>
            <Card>
              <Title level={5}>Prom. llamadas / día</Title>
              <Title level={3}>{resumen.promedioLlamadas}</Title>
            </Card>
          </Col>

          <Col xs={12} md={6}>
            <Card>
              <Title level={5}>Top performers</Title>
              <Title level={3} style={{ color: "#389e0d" }}>
                {resumen.top}
              </Title>
            </Card>
          </Col>

          <Col xs={12} md={6}>
            <Card>
              <Title level={5}>Críticos</Title>
              <Title level={3} style={{ color: "#cf1322" }}>
                {resumen.critico}
              </Title>
            </Card>
          </Col>
        </Row>
      )}
      {resumenBackend && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} md={6}>
            <Card>
              <Title level={5}>Total Leads</Title>
              <Title level={3}>{resumenBackend.totalLeads}</Title>
            </Card>
          </Col>

          <Col xs={12} md={6}>
            <Card>
              <Title level={5}>Convertidos</Title>
              <Title level={3} style={{ color: "#389e0d" }}>
                {resumenBackend.totalConvertidos}
              </Title>
            </Card>
          </Col>

          <Col xs={12} md={6}>
            <Card>
              <Title level={5}>Cobranza</Title>
              <Title level={3} style={{ color: "#fa8c16" }}>
                {resumenBackend.totalCobranza}
              </Title>
            </Card>
          </Col>

          <Col xs={12} md={6}>
            <Card>
              <Title level={5}>% Conversión Global</Title>
              <Title level={3}>
                {resumenBackend.porcentajeGlobalConversion.toFixed(2)}%
              </Title>
            </Card>
          </Col>
        </Row>
      )}
      {productos.length > 0 && (
        <Card
          title="Productos (Convertidos + Cobranza)"
          style={{ marginTop: 16 }}
        >
          <Table
            rowKey="codigoLanzamiento"
            dataSource={productos}
            pagination={{
              pageSize: 5,
              showSizeChanger: false,
            }}
            columns={[
              {
                title: "Producto",
                dataIndex: "nombre",
                ellipsis: true,
              },
              {
                title: "Código",
                dataIndex: "codigoLanzamiento",
                width: 160,
              },
              {
                title: "Total",
                dataIndex: "totalOportunidades",
                align: "center",
                sorter: (a, b) => a.totalOportunidades - b.totalOportunidades,
              },
              {
                title: "Ranking",
                align: "center",
                render: (_, r) =>
                  r.esTop ? (
                    <Tag color="green">Más vendido</Tag>
                  ) : (
                    <Tag color="default">—</Tag>
                  ),
              },
            ]}
          />
        </Card>
      )}

      <Row gutter={[16, 16]}>
        {/* TABLA */}
        <Col span={24}>
          <Card>
            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: 24,
                }}
              >
                <Spin />
              </div>
            ) : (
              <Table
                rowKey="personal_Id"
                columns={columns}
                dataSource={data}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50", "100"],
                }}
              />
            )}
          </Card>
        </Col>

        {/* “GRÁFICA” (sin recharts) */}
        <Col span={24}>
          <Card title="Llamadas promedio por día (ranking)">
            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: 24,
                }}
              >
                <Spin />
              </div>
            ) : dataGrafico.length === 0 ? (
              <Text type="secondary">No hay datos para graficar.</Text>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {dataGrafico.slice(0, 15).map((d) => {
                  const pct =
                    Math.max(0, (d.llamadasPorDia ?? 0) / maxLlamadas) * 100;
                  const cat = getCategoria(d);

                  return (
                    <div
                      key={d.personal_Id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "220px 1fr 80px",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Tag color={cat.color} style={{ marginRight: 8 }}>
                          {cat.label}
                        </Tag>
                        <span title={d.personal_Nombre}>
                          {d.personal_Nombre}
                        </span>
                      </div>

                      <div
                        style={{
                          background: "#f0f0f0",
                          borderRadius: 6,
                          height: 12,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: "#1677ff",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {Number(d.llamadasPorDia ?? 0).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
                {dataGrafico.length > 15 && (
                  <Text type="secondary">
                    Mostrando 15 de {dataGrafico.length} asesores.
                  </Text>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
}
