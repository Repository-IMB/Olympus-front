import {
  Table,
  Input,
  Select,
  DatePicker,
  Button,
  Checkbox,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import moment, { type Moment } from "moment";
import estilos from "./Asistencia.module.css";
import type { ColumnsType } from "antd/es/table";
import type { AsistenciaPersonal, TipoVista } from "../../interfaces/IAsistencia";

moment.locale("es");

const { Option } = Select;
const { RangePicker } = DatePicker;

// Mock data - reemplazar con API real
const asistenciaMock: AsistenciaPersonal[] = [
  {
    id: 1,
    pais: "Panamá",
    dni: "88391694",
    apellidos: "Singh Alvarado",
    nombres: "Abdiel",
    tipoJornada: "",
    correo: "abdielsingh8@gmail.com",
    sede: "imtpaegermtto08252",
    area: "imtpaegermtto08252",
    asistencia: {
      "2026-01-12": 8,
      "2026-01-13": null,
      "2026-01-14": 8,
      "2026-01-15": 8,
      "2026-01-16": 8,
      "2026-01-17": null,
      "2026-01-18": null,
      "2026-01-19": 8,
      "2026-01-20": 8,
    },
  },
  {
    id: 2,
    pais: "Panamá",
    dni: "881796",
    apellidos: "Tejeira Romaña",
    nombres: "Abdiel",
    tipoJornada: "",
    correo: "abdieltejeira@gmail.com",
    sede: "imbcepconfin06251",
    area: "imbcepconfin06251",
    asistencia: {
      "2026-01-12": null,
      "2026-01-13": null,
      "2026-01-14": 8,
      "2026-01-15": 8,
      "2026-01-16": 8,
      "2026-01-17": null,
      "2026-01-18": null,
      "2026-01-19": 8,
      "2026-01-20": 8,
    },
  },
  {
    id: 3,
    pais: "República Dominicana",
    dni: "03105360873",
    apellidos: "Jiménez",
    nombres: "Adalberto",
    tipoJornada: "",
    correo: "dalbert490@gmail.com",
    sede: "imbcepconfin06251",
    area: "imbcepconfin06251",
    asistencia: {
      "2026-01-12": 8,
      "2026-01-13": null,
      "2026-01-14": 8,
      "2026-01-15": 8,
      "2026-01-16": 8,
      "2026-01-17": null,
      "2026-01-18": null,
      "2026-01-19": 8,
      "2026-01-20": 8,
    },
  },
];

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

  const [personal] = useState<AsistenciaPersonal[]>(asistenciaMock);

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
      fixed: "right",
      width: 180,
      align: "center" as const,
      sorter: (a, b) =>
        calcularTotalHoras(a.asistencia, fechasAMostrar) - calcularTotalHoras(b.asistencia, fechasAMostrar),
      render: (_: unknown, record: AsistenciaPersonal) => {
        const total = calcularTotalHoras(record.asistencia, fechasAMostrar);
        return <span style={{ fontWeight: 600 }}>{total}</span>;
      },
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

        <Table
          columns={columnas}
          dataSource={personalFiltrado}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: anchoScroll }}
          bordered
          size="middle"
        />
      </div>
    </div>
  );
}
