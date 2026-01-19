import {
  Table,
  Button,
  Input,
  Space,
  Select,
  DatePicker,
  Tooltip,
} from "antd";
import { SearchOutlined, EditOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import moment, { type Moment } from "moment";
import estilos from "./Contratos.module.css";
import type { ColumnsType } from "antd/es/table";
import type { Contrato } from "../../interfaces/IContrato";

const { Option } = Select;
const { RangePicker } = DatePicker;

// Mock data - reemplazar con API real
const contratosMock: Contrato[] = [
  {
    id: 1,
    pais: "Panamá",
    dni: "88391694",
    apellidos: "Singh Alvarado",
    nombres: "Abdiel",
    celular: "",
    tipoContrato: "",
    tipoJornada: "",
    turnoTrabajo: "",
    area: "",
    sede: "",
    fechaIngreso: "",
    inicioContrato: "",
    finContrato: "",
    tiempoServicio: "",
    mesesTrabajados: 0,
    fechaSalida: "",
    motivoSalida: "",
    correo: "abdielsingh8@gmail.com",
    carrera: "",
    estado: true,
  },
  {
    id: 2,
    pais: "Panamá",
    dni: "881796",
    apellidos: "Tejeira Romaña",
    nombres: "Abdiel",
    celular: "",
    tipoContrato: "",
    tipoJornada: "",
    turnoTrabajo: "",
    area: "",
    sede: "",
    fechaIngreso: "",
    inicioContrato: "",
    finContrato: "",
    tiempoServicio: "",
    mesesTrabajados: 0,
    fechaSalida: "",
    motivoSalida: "",
    correo: "abdieltejeira@gmail.com",
    carrera: "",
    estado: true,
  },
  {
    id: 3,
    pais: "República Dominicana",
    dni: "03185360873",
    apellidos: "Jiménez",
    nombres: "Adalberto",
    celular: "",
    tipoContrato: "",
    tipoJornada: "",
    turnoTrabajo: "",
    area: "",
    sede: "",
    fechaIngreso: "",
    inicioContrato: "",
    finContrato: "",
    tiempoServicio: "",
    mesesTrabajados: 0,
    fechaSalida: "",
    motivoSalida: "",
    correo: "dalbert490@gmail.com",
    carrera: "",
    estado: true,
  },
];

export default function Contratos() {
  const [searchText, setSearchText] = useState("");
  const [filtroPais, setFiltroPais] = useState<string>();
  const [filtroDni, setFiltroDni] = useState<string>();
  const [filtroSede, setFiltroSede] = useState<string>();
  const [filtroCarrera, setFiltroCarrera] = useState<string>();
  const [filtroTipoContrato, setFiltroTipoContrato] = useState<string>();
  const [filtroTipoJornada, setFiltroTipoJornada] = useState<string>();
  const [filtroArea, setFiltroArea] = useState<string>();
  const [dateRange, setDateRange] = useState<[Moment | null, Moment | null] | null>(null);

  const [contratos] = useState<Contrato[]>(contratosMock);

  const limpiarFiltros = () => {
    setSearchText("");
    setFiltroPais(undefined);
    setFiltroDni(undefined);
    setFiltroSede(undefined);
    setFiltroCarrera(undefined);
    setFiltroTipoContrato(undefined);
    setFiltroTipoJornada(undefined);
    setFiltroArea(undefined);
    setDateRange(null);
  };

  const contratosFiltrados = useMemo(() => {
    const busqueda = searchText.toLowerCase();

    return contratos.filter((c) => {
      const coincideBusqueda =
        !busqueda ||
        c.nombres.toLowerCase().includes(busqueda) ||
        c.apellidos.toLowerCase().includes(busqueda) ||
        c.dni.includes(busqueda) ||
        c.correo.toLowerCase().includes(busqueda);

      const coincidePais = !filtroPais || c.pais === filtroPais;
      const coincideDni = !filtroDni || c.dni.includes(filtroDni);
      const coincideSede = !filtroSede || c.sede === filtroSede;
      const coincideCarrera = !filtroCarrera || c.carrera === filtroCarrera;
      const coincideTipoContrato = !filtroTipoContrato || c.tipoContrato === filtroTipoContrato;
      const coincideTipoJornada = !filtroTipoJornada || c.tipoJornada === filtroTipoJornada;
      const coincideArea = !filtroArea || c.area === filtroArea;

      const coincideFecha =
        !dateRange ||
        !dateRange[0] ||
        !dateRange[1] ||
        (() => {
          if (!c.fechaIngreso) return true;
          const [inicio, fin] = dateRange;
          const fechaContrato = moment(c.fechaIngreso, "DD/MM/YYYY");
          return (
            (fechaContrato.isAfter(inicio.startOf("day")) &&
              fechaContrato.isBefore(fin.endOf("day"))) ||
            fechaContrato.isSame(inicio, "day") ||
            fechaContrato.isSame(fin, "day")
          );
        })();

      return (
        coincideBusqueda &&
        coincidePais &&
        coincideDni &&
        coincideSede &&
        coincideCarrera &&
        coincideTipoContrato &&
        coincideTipoJornada &&
        coincideArea &&
        coincideFecha
      );
    });
  }, [contratos, searchText, filtroPais, filtroDni, filtroSede, filtroCarrera, filtroTipoContrato, filtroTipoJornada, filtroArea, dateRange]);

  const columnas: ColumnsType<Contrato> = [
    {
      title: "País",
      dataIndex: "pais",
      key: "pais",
      fixed: "left",
      width: 120,
      sorter: (a, b) => a.pais.localeCompare(b.pais),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar país"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
              Filtrar
            </Button>
            <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
              Limpiar
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.pais.toLowerCase().includes((value as string).toLowerCase()),
    },
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
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
              Filtrar
            </Button>
            <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
              Limpiar
            </Button>
          </Space>
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
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
              Filtrar
            </Button>
            <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
              Limpiar
            </Button>
          </Space>
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
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
              Filtrar
            </Button>
            <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
              Limpiar
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.nombres.toLowerCase().includes((value as string).toLowerCase()),
    },
    {
      title: "Celular",
      dataIndex: "celular",
      key: "celular",
      sorter: (a, b) => a.celular.localeCompare(b.celular),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar celular"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
              Filtrar
            </Button>
            <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
              Limpiar
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.celular.includes(value as string),
    },
    {
      title: "Tipo de contrato",
      dataIndex: "tipoContrato",
      key: "tipoContrato",
      sorter: (a, b) => a.tipoContrato.localeCompare(b.tipoContrato),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar tipo"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
              Filtrar
            </Button>
            <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
              Limpiar
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.tipoContrato.toLowerCase().includes((value as string).toLowerCase()),
    },
    {
      title: "Tipo de jornada",
      dataIndex: "tipoJornada",
      key: "tipoJornada",
      sorter: (a, b) => a.tipoJornada.localeCompare(b.tipoJornada),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar jornada"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
              Filtrar
            </Button>
            <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
              Limpiar
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.tipoJornada.toLowerCase().includes((value as string).toLowerCase()),
    },
    {
      title: "Turno de trabajo",
      dataIndex: "turnoTrabajo",
      key: "turnoTrabajo",
      sorter: (a, b) => a.turnoTrabajo.localeCompare(b.turnoTrabajo),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar turno"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
              Filtrar
            </Button>
            <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
              Limpiar
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.turnoTrabajo.toLowerCase().includes((value as string).toLowerCase()),
    },
    {
      title: "Área",
      dataIndex: "area",
      key: "area",
      sorter: (a, b) => a.area.localeCompare(b.area),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar área"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
              Filtrar
            </Button>
            <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
              Limpiar
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.area.toLowerCase().includes((value as string).toLowerCase()),
    },
    {
      title: "Sede",
      dataIndex: "sede",
      key: "sede",
      sorter: (a, b) => a.sede.localeCompare(b.sede),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar sede"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
              Filtrar
            </Button>
            <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
              Limpiar
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.sede.toLowerCase().includes((value as string).toLowerCase()),
    },
    {
      title: "Fecha de ingreso",
      dataIndex: "fechaIngreso",
      key: "fechaIngreso",
      sorter: (a, b) => {
        if (!a.fechaIngreso || !b.fechaIngreso) return 0;
        return moment(a.fechaIngreso, "DD/MM/YYYY").diff(moment(b.fechaIngreso, "DD/MM/YYYY"));
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar fecha"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
              Filtrar
            </Button>
            <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
              Limpiar
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.fechaIngreso.includes(value as string),
    },
    {
      title: "Inicio de contrato",
      dataIndex: "inicioContrato",
      key: "inicioContrato",
      sorter: (a, b) => {
        if (!a.inicioContrato || !b.inicioContrato) return 0;
        return moment(a.inicioContrato, "DD/MM/YYYY").diff(moment(b.inicioContrato, "DD/MM/YYYY"));
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar fecha"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
              Filtrar
            </Button>
            <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
              Limpiar
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.inicioContrato.includes(value as string),
    },
    {
      title: "Fin de contrato",
      dataIndex: "finContrato",
      key: "finContrato",
      sorter: (a, b) => {
        if (!a.finContrato || !b.finContrato) return 0;
        return moment(a.finContrato, "DD/MM/YYYY").diff(moment(b.finContrato, "DD/MM/YYYY"));
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar fecha"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
              Filtrar
            </Button>
            <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
              Limpiar
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.finContrato.includes(value as string),
    },
    {
      title: "Tiempo de servicio",
      dataIndex: "tiempoServicio",
      key: "tiempoServicio",
      sorter: (a, b) => a.tiempoServicio.localeCompare(b.tiempoServicio),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar tiempo"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
              Filtrar
            </Button>
            <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
              Limpiar
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.tiempoServicio.toLowerCase().includes((value as string).toLowerCase()),
    },
    {
      title: "Meses trabajados",
      dataIndex: "mesesTrabajados",
      key: "mesesTrabajados",
      sorter: (a, b) => a.mesesTrabajados - b.mesesTrabajados,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar meses"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
              Filtrar
            </Button>
            <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
              Limpiar
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.mesesTrabajados.toString().includes(value as string),
    },
    {
      title: "Fecha de salida",
      dataIndex: "fechaSalida",
      key: "fechaSalida",
      sorter: (a, b) => {
        if (!a.fechaSalida || !b.fechaSalida) return 0;
        return moment(a.fechaSalida, "DD/MM/YYYY").diff(moment(b.fechaSalida, "DD/MM/YYYY"));
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar fecha"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
              Filtrar
            </Button>
            <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
              Limpiar
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.fechaSalida.includes(value as string),
    },
    {
      title: "Motivo de salida",
      dataIndex: "motivoSalida",
      key: "motivoSalida",
      sorter: (a, b) => a.motivoSalida.localeCompare(b.motivoSalida),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar motivo"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90 }}>
              Filtrar
            </Button>
            <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
              Limpiar
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.motivoSalida.toLowerCase().includes((value as string).toLowerCase()),
    },
    {
      title: "Acción",
      key: "accion",
      fixed: "right",
      width: 80,
      align: "center",
      render: () => (
        <Space size="middle">
          <Tooltip title="Editar">
            <span className={estilos.actionIcon}>
              <EditOutlined />
            </span>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Obtener valores únicos para los filtros
  const paisesUnicos = [...new Set(contratos.map((c) => c.pais))].filter(Boolean);
  const sedesUnicas = [...new Set(contratos.map((c) => c.sede))].filter(Boolean);
  const carrerasUnicas = [...new Set(contratos.map((c) => c.carrera))].filter(Boolean);
  const tiposContratoUnicos = [...new Set(contratos.map((c) => c.tipoContrato))].filter(Boolean);
  const tiposJornadaUnicos = [...new Set(contratos.map((c) => c.tipoJornada))].filter(Boolean);
  const areasUnicas = [...new Set(contratos.map((c) => c.area))].filter(Boolean);

  return (
    <div className={estilos.container}>
      <div className={estilos.contentWrapper}>
        <div className={estilos.header}>
          <h1 className={estilos.title}>Contratos</h1>
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
            <Button type="primary" style={{ backgroundColor: "#1f1f1f", borderColor: "#1f1f1f" }}>
              Nuevo registro
            </Button>
          </div>
        </div>

        <div className={`${estilos.toolbar} ${estilos.filtersRow}`}>
          <Select
            allowClear
            placeholder="Filtro por pais"
            value={filtroPais}
            onChange={setFiltroPais}
            className={estilos.filterSelect}
            style={{ minWidth: 150 }}
          >
            {paisesUnicos.map((pais) => (
              <Option key={pais} value={pais}>
                {pais}
              </Option>
            ))}
          </Select>

          <Input
            allowClear
            placeholder="Filtro por dni"
            value={filtroDni}
            onChange={(e) => setFiltroDni(e.target.value)}
            style={{ minWidth: 150, maxWidth: 180 }}
          />

          <Select
            allowClear
            placeholder="Filtro por sede"
            value={filtroSede}
            onChange={setFiltroSede}
            className={estilos.filterSelect}
            style={{ minWidth: 150 }}
          >
            {sedesUnicas.map((sede) => (
              <Option key={sede} value={sede}>
                {sede}
              </Option>
            ))}
          </Select>

          <Select
            allowClear
            placeholder="Filtro por carrera"
            value={filtroCarrera}
            onChange={setFiltroCarrera}
            className={estilos.filterSelect}
            style={{ minWidth: 150 }}
          >
            {carrerasUnicas.map((carrera) => (
              <Option key={carrera} value={carrera}>
                {carrera}
              </Option>
            ))}
          </Select>

          <Select
            allowClear
            placeholder="Filtro por tipo de contrato"
            value={filtroTipoContrato}
            onChange={setFiltroTipoContrato}
            className={estilos.filterSelect}
            style={{ minWidth: 180 }}
          >
            {tiposContratoUnicos.map((tipo) => (
              <Option key={tipo} value={tipo}>
                {tipo}
              </Option>
            ))}
          </Select>

          <Select
            allowClear
            placeholder="Filtro por tipo de jornada"
            value={filtroTipoJornada}
            onChange={setFiltroTipoJornada}
            className={estilos.filterSelect}
            style={{ minWidth: 180 }}
          >
            {tiposJornadaUnicos.map((tipo) => (
              <Option key={tipo} value={tipo}>
                {tipo}
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
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [Moment | null, Moment | null] | null)}
            format="DD/MM/YYYY"
            placeholder={["Filtro fecha por fecha de nacimien", ""]}
            style={{ minWidth: 280 }}
          />
        </div>

        <Table
          columns={columnas}
          dataSource={contratosFiltrados}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 2500 }}
        />
      </div>
    </div>
  );
}
