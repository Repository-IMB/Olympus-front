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
import estilos from "./Personal.module.css";
import type { ColumnsType } from "antd/es/table";
import type { Personal } from "../../interfaces/IPersonal";

const { Option } = Select;
const { RangePicker } = DatePicker;

// Mock data - reemplazar con API real
const personalMock: Personal[] = [
  {
    id: 1,
    pais: "Panamá",
    dni: "86391694",
    apellidos: "Singh Alvarado",
    nombres: "Abdiel",
    fechaNacimiento: "",
    correo: "abdielsingh8@gmail.com",
    celular: "imtpaegermtto08252",
    direccion: "imtpaegermtto08252",
    distrito: "",
    carrera: "",
    sede: "",
    estado: true,
  },
  {
    id: 2,
    pais: "Panamá",
    dni: "881796",
    apellidos: "Tejeira Romaña",
    nombres: "Abdiel",
    fechaNacimiento: "",
    correo: "abdieltejeira@gmail.com",
    celular: "imbcepconfin06251",
    direccion: "imbcepconfin06251",
    distrito: "",
    carrera: "",
    sede: "",
    estado: true,
  },
  {
    id: 3,
    pais: "República Dominicana",
    dni: "03185360873",
    apellidos: "Jiménez",
    nombres: "Adalberto",
    fechaNacimiento: "",
    correo: "dalbert490@gmail.com",
    celular: "imbcepconfin06251",
    direccion: "imbcepconfin06251",
    distrito: "",
    carrera: "",
    sede: "",
    estado: true,
  },
];

export default function Personal() {
  const [searchText, setSearchText] = useState("");
  const [filtroPais, setFiltroPais] = useState<string>();
  const [filtroSede, setFiltroSede] = useState<string>();
  const [filtroCarrera, setFiltroCarrera] = useState<string>();
  const [filtroTipoContrato, setFiltroTipoContrato] = useState<string>();
  const [filtroTipoJornada, setFiltroTipoJornada] = useState<string>();
  const [filtroArea, setFiltroArea] = useState<string>();
  const [dateRange, setDateRange] = useState<[Moment | null, Moment | null] | null>(null);

  const [personal] = useState<Personal[]>(personalMock);

  const limpiarFiltros = () => {
    setSearchText("");
    setFiltroPais(undefined);
    setFiltroSede(undefined);
    setFiltroCarrera(undefined);
    setFiltroTipoContrato(undefined);
    setFiltroTipoJornada(undefined);
    setFiltroArea(undefined);
    setDateRange(null);
  };

  const personalFiltrado = useMemo(() => {
    const busqueda = searchText.toLowerCase();

    return personal.filter((p) => {
      const coincideBusqueda =
        !busqueda ||
        p.nombres.toLowerCase().includes(busqueda) ||
        p.apellidos.toLowerCase().includes(busqueda) ||
        p.dni.includes(busqueda) ||
        p.correo.toLowerCase().includes(busqueda);

      const coincidePais = !filtroPais || p.pais === filtroPais;
      const coincideSede = !filtroSede || p.sede === filtroSede;
      const coincideCarrera = !filtroCarrera || p.carrera === filtroCarrera;
      const coincideTipoContrato = !filtroTipoContrato || p.tipoContrato === filtroTipoContrato;
      const coincideTipoJornada = !filtroTipoJornada || p.tipoJornada === filtroTipoJornada;
      const coincideArea = !filtroArea || p.area === filtroArea;

      const coincideFecha =
        !dateRange ||
        !dateRange[0] ||
        !dateRange[1] ||
        (() => {
          if (!p.fechaNacimiento) return true;
          const [inicio, fin] = dateRange;
          const fechaPersonal = moment(p.fechaNacimiento, "DD/MM/YYYY");
          return (
            (fechaPersonal.isAfter(inicio.startOf("day")) &&
              fechaPersonal.isBefore(fin.endOf("day"))) ||
            fechaPersonal.isSame(inicio, "day") ||
            fechaPersonal.isSame(fin, "day")
          );
        })();

      return (
        coincideBusqueda &&
        coincidePais &&
        coincideSede &&
        coincideCarrera &&
        coincideTipoContrato &&
        coincideTipoJornada &&
        coincideArea &&
        coincideFecha
      );
    });
  }, [personal, searchText, filtroPais, filtroSede, filtroCarrera, filtroTipoContrato, filtroTipoJornada, filtroArea, dateRange]);

  const columnas: ColumnsType<Personal> = [
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
      title: "Fecha nacimiento",
      dataIndex: "fechaNacimiento",
      key: "fechaNacimiento",
      sorter: (a, b) => {
        if (!a.fechaNacimiento || !b.fechaNacimiento) return 0;
        return moment(a.fechaNacimiento, "DD/MM/YYYY").diff(moment(b.fechaNacimiento, "DD/MM/YYYY"));
      },
    },
    {
      title: "Correo",
      dataIndex: "correo",
      key: "correo",
      sorter: (a, b) => a.correo.localeCompare(b.correo),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar correo"
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
      onFilter: (value, record) => record.correo.toLowerCase().includes((value as string).toLowerCase()),
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
      title: "Dirección",
      dataIndex: "direccion",
      key: "direccion",
      sorter: (a, b) => a.direccion.localeCompare(b.direccion),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar dirección"
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
      onFilter: (value, record) => record.direccion.toLowerCase().includes((value as string).toLowerCase()),
    },
    {
      title: "Distrito",
      dataIndex: "distrito",
      key: "distrito",
      sorter: (a, b) => a.distrito.localeCompare(b.distrito),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar distrito"
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
      onFilter: (value, record) => record.distrito.toLowerCase().includes((value as string).toLowerCase()),
    },
    {
      title: "Carrera",
      dataIndex: "carrera",
      key: "carrera",
      sorter: (a, b) => a.carrera.localeCompare(b.carrera),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar carrera"
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
      onFilter: (value, record) => record.carrera.toLowerCase().includes((value as string).toLowerCase()),
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
  const paisesUnicos = [...new Set(personal.map((p) => p.pais))].filter(Boolean);
  const sedesUnicas = [...new Set(personal.map((p) => p.sede))].filter(Boolean);
  const carrerasUnicas = [...new Set(personal.map((p) => p.carrera))].filter(Boolean);
  const tiposContratoUnicos = [...new Set(personal.map((p) => p.tipoContrato))].filter(Boolean);
  const tiposJornadaUnicos = [...new Set(personal.map((p) => p.tipoJornada))].filter(Boolean);
  const areasUnicas = [...new Set(personal.map((p) => p.area))].filter(Boolean);

  return (
    <div className={estilos.container}>
      <div className={estilos.contentWrapper}>
        <div className={estilos.header}>
          <h1 className={estilos.title}>Personal</h1>
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
            <Button type="primary" className={estilos.btnNuevo}>Nuevo personal</Button>
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
            placeholder={["Filtro fecha por fecha de nacimiento", ""]}
            style={{ minWidth: 280 }}
          />
        </div>

        <Table
          columns={columnas}
          dataSource={personalFiltrado}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1500 }}
        />
      </div>
    </div>
  );
}
