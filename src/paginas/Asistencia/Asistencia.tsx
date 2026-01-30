import {
  Table,
  Input,
  Select,
  DatePicker,
  Button,
  Checkbox,
  Spin,
  message,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import moment, { type Moment } from "moment";
import estilos from "./Asistencia.module.css";
import type { ColumnsType } from "antd/es/table";
import type { AsistenciaPersonal, TipoVista } from "../../interfaces/IAsistencia";
import { obtenerAsistenciaPaginado } from "../../servicios/AsistenciaService";

moment.locale("es");

const { Option } = Select;
const { RangePicker } = DatePicker;

// Función para obtener las fechas de una semana dado un día de referencia
const obtenerFechasSemana = (fecha: Moment): Moment[] => {
  const inicioSemana = fecha.clone().startOf("isoWeek");
  const fechas: Moment[] = [];
  for (let i = 0; i < 7; i++) {
    fechas.push(inicioSemana.clone().add(i, "days"));
  }
  return fechas;
};

// Función para obtener las fechas de un mes
const obtenerFechasMes = (fecha: Moment): Moment[] => {
  const inicioMes = fecha.clone().startOf("month");
  const finMes = fecha.clone().endOf("month");
  const fechas: Moment[] = [];
  const actual = inicioMes.clone();
  while (actual.isSameOrBefore(finMes, "day")) {
    fechas.push(actual.clone());
    actual.add(1, "day");
  }
  return fechas;
};

// Función para obtener fechas en un rango
const obtenerFechasRango = (inicio: Moment, fin: Moment): Moment[] => {
  const fechas: Moment[] = [];
  const actual = inicio.clone();
  while (actual.isSameOrBefore(fin, "day")) {
    fechas.push(actual.clone());
    actual.add(1, "day");
  }
  return fechas;
};

// Formatear nombre del día
const formatearDiaColumna = (fecha: Moment): string => {
  const diaSemana = fecha.format("dddd");
  const diaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
  return `${diaCapitalizado} ${fecha.format("DD/MM/YYYY")}`;
};

export default function Asistencia() {
  const [searchText, setSearchText] = useState("");
  const [tipoVista, setTipoVista] = useState<TipoVista>("semana");
  const [mesSeleccionado, setMesSeleccionado] = useState<Moment | null>(moment());
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<Moment | null>(moment());
  const [rangoFechas, setRangoFechas] = useState<[Moment | null, Moment | null] | null>(null);
  const [filtroDni, setFiltroDni] = useState<string>();
  const [filtroArea, setFiltroArea] = useState<string>();
  const [filtroFechaNacimiento, setFiltroFechaNacimiento] = useState<[Moment | null, Moment | null] | null>(null);

  // API Data State
  const [personal, setPersonal] = useState<AsistenciaPersonal[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });

  // Calculate date range based on view type
  const fechaRango = useMemo((): { inicio: string; fin: string } => {
    switch (tipoVista) {
      case "mes":
        if (mesSeleccionado) {
          return {
            inicio: mesSeleccionado.clone().startOf("month").format("YYYY-MM-DD"),
            fin: mesSeleccionado.clone().endOf("month").format("YYYY-MM-DD"),
          };
        }
        break;
      case "semana":
        if (semanaSeleccionada) {
          return {
            inicio: semanaSeleccionada.clone().startOf("isoWeek").format("YYYY-MM-DD"),
            fin: semanaSeleccionada.clone().endOf("isoWeek").format("YYYY-MM-DD"),
          };
        }
        break;
      case "rango":
        if (rangoFechas && rangoFechas[0] && rangoFechas[1]) {
          return {
            inicio: rangoFechas[0].clone().startOf("month").format("YYYY-MM-DD"),
            fin: rangoFechas[1].clone().endOf("month").format("YYYY-MM-DD"),
          };
        }
        break;
      case "historico":
        return {
          inicio: moment().startOf("year").format("YYYY-MM-DD"),
          fin: moment().endOf("year").format("YYYY-MM-DD"),
        };
    }
    // Default: current week
    return {
      inicio: moment().startOf("isoWeek").format("YYYY-MM-DD"),
      fin: moment().endOf("isoWeek").format("YYYY-MM-DD"),
    };
  }, [tipoVista, mesSeleccionado, semanaSeleccionada, rangoFechas]);

  // Fetch data from API
  const fetchAsistencia = useCallback(async () => {
    setLoading(true);
    try {
      const response = await obtenerAsistenciaPaginado({
        search: searchText || undefined,
        fechaInicio: fechaRango.inicio,
        fechaFin: fechaRango.fin,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });

      if (response.codigo === "SIN ERROR") {
        setPersonal(response.personal);
        setTotal(response.total);
      } else {
        message.error(response.mensaje || "Error al cargar asistencia");
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      message.error("Error al cargar asistencia");
    } finally {
      setLoading(false);
    }
  }, [searchText, fechaRango, pagination]);

  // Fetch data when filters change
  useEffect(() => {
    fetchAsistencia();
  }, [fetchAsistencia]);

  const limpiarFiltros = () => {
    setSearchText("");
    setFiltroDni(undefined);
    setFiltroArea(undefined);
    setFiltroFechaNacimiento(null);
  };

  // Obtener las fechas a mostrar según el tipo de vista
  const fechasAMostrar = useMemo((): Moment[] => {
    switch (tipoVista) {
      case "mes":
        return mesSeleccionado ? obtenerFechasMes(mesSeleccionado) : [];
      case "semana":
        return semanaSeleccionada ? obtenerFechasSemana(semanaSeleccionada) : [];
      case "rango":
        return rangoFechas && rangoFechas[0] && rangoFechas[1]
          ? obtenerFechasRango(rangoFechas[0], rangoFechas[1])
          : [];
      case "historico":
        // Para histórico, mostrar todo el año actual
        const inicioAnio = moment().startOf("year");
        const finAnio = moment().endOf("year");
        return obtenerFechasRango(inicioAnio, finAnio);
      default:
        return [];
    }
  }, [tipoVista, mesSeleccionado, semanaSeleccionada, rangoFechas]);

  // Filtrar personal
  const personalFiltrado = useMemo(() => {
    const busqueda = searchText.toLowerCase();

    return personal.filter((p) => {
      const coincideBusqueda =
        !busqueda ||
        p.nombres.toLowerCase().includes(busqueda) ||
        p.apellidos.toLowerCase().includes(busqueda) ||
        p.dni.includes(busqueda) ||
        p.correo.toLowerCase().includes(busqueda);

      const coincideDni = !filtroDni || p.dni.includes(filtroDni);
      const coincideArea = !filtroArea || p.area === filtroArea;

      const coincideFechaNacimiento =
        !filtroFechaNacimiento ||
        !filtroFechaNacimiento[0] ||
        !filtroFechaNacimiento[1] ||
        (() => {
          if (!p.fechaNacimiento) return true;
          const [inicio, fin] = filtroFechaNacimiento;
          const fechaNac = moment(p.fechaNacimiento, "DD/MM/YYYY");
          return fechaNac.isBetween(inicio, fin, "day", "[]");
        })();

      return coincideBusqueda && coincideDni && coincideArea && coincideFechaNacimiento;
    });
  }, [personal, searchText, filtroDni, filtroArea, filtroFechaNacimiento]);

  // Calcular total de horas trabajadas
  const calcularTotalHoras = (asistencia: Record<string, number | null>, fechas: Moment[]): number => {
    return fechas.reduce((total, fecha) => {
      const fechaStr = fecha.format("YYYY-MM-DD");
      const horas = asistencia[fechaStr];
      return total + (horas || 0);
    }, 0);
  };

  // Generar columnas dinámicas para las fechas
  const columnasBase: ColumnsType<AsistenciaPersonal> = [
    {
      title: "DNI",
      dataIndex: "dni",
      key: "dni",
      fixed: "left",
      width: 120,
      sorter: (a, b) => a.dni.localeCompare(b.dni),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar DNI"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90, marginRight: 8 }}>
            Filtrar
          </Button>
          <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
            Limpiar
          </Button>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.dni.includes(value as string),
    },
    {
      title: "Apellidos",
      dataIndex: "apellidos",
      key: "apellidos",
      fixed: "left",
      width: 150,
      sorter: (a, b) => a.apellidos.localeCompare(b.apellidos),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar apellidos"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90, marginRight: 8 }}>
            Filtrar
          </Button>
          <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
            Limpiar
          </Button>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.apellidos.toLowerCase().includes((value as string).toLowerCase()),
    },
    {
      title: "Nombres",
      dataIndex: "nombres",
      key: "nombres",
      fixed: "left",
      width: 150,
      sorter: (a, b) => a.nombres.localeCompare(b.nombres),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar nombres"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90, marginRight: 8 }}>
            Filtrar
          </Button>
          <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
            Limpiar
          </Button>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.nombres.toLowerCase().includes((value as string).toLowerCase()),
    },
    {
      title: "Tipo de jornada",
      dataIndex: "tipoJornada",
      key: "tipoJornada",
      width: 140,
      sorter: (a, b) => a.tipoJornada.localeCompare(b.tipoJornada),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar tipo jornada"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90, marginRight: 8 }}>
            Filtrar
          </Button>
          <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
            Limpiar
          </Button>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.tipoJornada.toLowerCase().includes((value as string).toLowerCase()),
    },
  ];

  // Columnas dinámicas para las fechas
  const columnasFechas: ColumnsType<AsistenciaPersonal> = fechasAMostrar.map((fecha) => {
    const fechaStr = fecha.format("YYYY-MM-DD");
    return {
      title: formatearDiaColumna(fecha),
      dataIndex: ["asistencia", fechaStr],
      key: fechaStr,
      width: 150,
      align: "center" as const,
      render: (_: unknown, record: AsistenciaPersonal) => {
        const asistio = record.asistencia[fechaStr] !== null && record.asistencia[fechaStr] !== undefined;
        return (
          <Checkbox
            checked={asistio}
            disabled
          />
        );
      },
    };
  });

  // Columna de total de horas trabajadas
  const columnaTotal: ColumnsType<AsistenciaPersonal> = [
    {
      title: "Total de horas trabajadas",
      key: "totalHoras",
      dataIndex: "totalHoras",
      fixed: "right",
      width: 180,
      align: "center" as const,
      sorter: (a, b) => a.totalHoras - b.totalHoras,
      render: (value: number) => <span style={{ fontWeight: 600 }}>{value}</span>,
    },
  ];

  const columnas = [...columnasBase, ...columnasFechas, ...columnaTotal];

  // Obtener valores únicos para los filtros
  const dnisUnicos = [...new Set(personal.map((p) => p.dni))].filter(Boolean);
  const areasUnicas = [...new Set(personal.map((p) => p.area))].filter(Boolean);

  // Calcular el ancho total de la tabla
  const anchoScroll = 120 + 150 + 150 + 140 + (fechasAMostrar.length * 150) + 180;

  return (
    <div className={estilos.container}>
      <div className={estilos.contentWrapper}>
        <div className={estilos.header}>
          <h1 className={estilos.title}>Asistencia del personal</h1>
        </div>

        <div className={estilos.toolbar}>
          <div className={estilos.searchBar}>
            <Input
              placeholder="Buscar por nombre, DNI, correo"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </div>

          <div className={estilos.actions}>
            <Button className={estilos.btnLimpiar} onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          </div>
        </div>

        <div className={`${estilos.toolbar} ${estilos.filtersRow}`}>
          <Select
            value={tipoVista}
            onChange={(value) => setTipoVista(value)}
            className={estilos.filterSelect}
            style={{ minWidth: 220 }}
          >
            <Option value="mes">Vista por mes (seleccionar el mes)</Option>
            <Option value="semana">Vista semanal (SELECTOR DE SEMANA)</Option>
            <Option value="rango">Rango por mes (DE MES A MES)</Option>
            <Option value="historico">Vista historico</Option>
          </Select>

          {tipoVista === "mes" && (
            <DatePicker
              picker="month"
              value={mesSeleccionado}
              onChange={(date) => setMesSeleccionado(date)}
              placeholder="Seleccionar mes"
              format="MMMM YYYY"
              style={{ minWidth: 180 }}
            />
          )}

          {tipoVista === "semana" && (
            <DatePicker
              picker="week"
              value={semanaSeleccionada}
              onChange={(date) => setSemanaSeleccionada(date)}
              placeholder="Seleccionar semana"
              style={{ minWidth: 180 }}
            />
          )}

          {tipoVista === "rango" && (
            <RangePicker
              picker="month"
              value={rangoFechas}
              onChange={(dates) => setRangoFechas(dates as [Moment | null, Moment | null] | null)}
              placeholder={["Mes inicio", "Mes fin"]}
              format="MMMM YYYY"
              style={{ minWidth: 280 }}
            />
          )}

          <Select
            allowClear
            placeholder="Filtro por dni"
            value={filtroDni}
            onChange={setFiltroDni}
            className={estilos.filterSelect}
            style={{ minWidth: 150 }}
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {dnisUnicos.map((dni) => (
              <Option key={dni} value={dni}>
                {dni}
              </Option>
            ))}
          </Select>

          <Select
            allowClear
            placeholder="Filtro por area"
            value={filtroArea}
            onChange={setFiltroArea}
            className={estilos.filterSelect}
            style={{ minWidth: 150 }}
          >
            {areasUnicas.map((area) => (
              <Option key={area} value={area}>
                {area}
              </Option>
            ))}
          </Select>

          <RangePicker
            value={filtroFechaNacimiento}
            onChange={(dates) => setFiltroFechaNacimiento(dates as [Moment | null, Moment | null] | null)}
            format="DD/MM/YYYY"
            placeholder={["Filtro fecha por fecha de nacimiento", ""]}
            style={{ minWidth: 320 }}
          />
        </div>

        <div className={estilos.vistaLabel}>
          {tipoVista === "mes" && mesSeleccionado && `Vista por mes`}
          {tipoVista === "semana" && semanaSeleccionada && `Vista por semana`}
          {tipoVista === "rango" && rangoFechas && rangoFechas[0] && rangoFechas[1] && `Vista por rango`}
          {tipoVista === "historico" && `Vista histórico`}
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columnas}
            dataSource={personalFiltrado}
            rowKey="id"
            pagination={{
              current: pagination.page,
              pageSize: pagination.pageSize,
              total: total,
              onChange: (page, pageSize) => setPagination({ page, pageSize }),
              showSizeChanger: true,
              showTotal: (t) => `Total: ${t} registros`,
            }}
            scroll={{ x: anchoScroll }}
            bordered
            size="middle"
          />
        </Spin>
      </div>
    </div>
  );
}


