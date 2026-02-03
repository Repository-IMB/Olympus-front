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
import estilos from "./Permisos.module.css";
import type { ColumnsType } from "antd/es/table";
import type { Permiso } from "../../interfaces/IPermiso";
import NuevoPermisoModal, { type NuevoPermisoFormValues } from "./NuevoPermisoModal";

const { Option } = Select;
const { RangePicker } = DatePicker;

// Mock data - reemplazar con API real
const permisosMock: Permiso[] = [
  {
    id: 1,
    pais: "Panamá",
    dni: "88391694",
    apellidos: "Singh Alvarado",
    nombres: "Abdiel",
    celular: "",
    cantidadPermisos: 0,
    diasAcumulados: 0,
    horasAcumuladas: 0,
    horasAcumuladasRecuperadas: 0,
    correo: "abdielsingh8@gmail.com",
    sede: "imtpaegermtto08252",
    carrera: "",
    tipoContrato: "",
    tipoJornada: "",
    area: "imtpaegermtto08252",
    estado: true,
  },
  {
    id: 2,
    pais: "Panamá",
    dni: "881796",
    apellidos: "Tejeira Romaña",
    nombres: "Abdiel",
    celular: "",
    cantidadPermisos: 0,
    diasAcumulados: 0,
    horasAcumuladas: 0,
    horasAcumuladasRecuperadas: 0,
    correo: "abdieltejeira@gmail.com",
    sede: "imbcepconfin06251",
    carrera: "",
    tipoContrato: "",
    tipoJornada: "",
    area: "imbcepconfin06251",
    estado: true,
  },
  {
    id: 3,
    pais: "República Dominicana",
    dni: "03185360873",
    apellidos: "Jiménez",
    nombres: "Adalberto",
    celular: "",
    cantidadPermisos: 0,
    diasAcumulados: 0,
    horasAcumuladas: 0,
    horasAcumuladasRecuperadas: 0,
    correo: "dalbert490@gmail.com",
    sede: "imbcepconfin06251",
    carrera: "",
    tipoContrato: "",
    tipoJornada: "",
    area: "imbcepconfin06251",
    estado: true,
  },
];

export default function Permisos() {
  const [searchText, setSearchText] = useState("");
  const [filtroPais, setFiltroPais] = useState<string>();
  const [filtroSede, setFiltroSede] = useState<string>();
  const [filtroCarrera, setFiltroCarrera] = useState<string>();
  const [filtroTipoContrato, setFiltroTipoContrato] = useState<string>();
  const [filtroTipoJornada, setFiltroTipoJornada] = useState<string>();
  const [filtroArea, setFiltroArea] = useState<string>();
  const [dateRange, setDateRange] = useState<[Moment | null, Moment | null] | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [permisos] = useState<Permiso[]>(permisosMock);

  const handleNuevoRegistro = () => {
    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
  };

  const handleModalOk = (values: NuevoPermisoFormValues) => {
    console.log("Nuevo permiso:", values);
    // Aquí se enviará a la API
    setModalVisible(false);
  };

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

  const permisosFiltrados = useMemo(() => {
    const busqueda = searchText.toLowerCase();

    return permisos.filter((p) => {
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
          const fechaPermiso = moment(p.fechaNacimiento, "DD/MM/YYYY");
          return (
            (fechaPermiso.isAfter(inicio.startOf("day")) &&
              fechaPermiso.isBefore(fin.endOf("day"))) ||
            fechaPermiso.isSame(inicio, "day") ||
            fechaPermiso.isSame(fin, "day")
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
  }, [permisos, searchText, filtroPais, filtroSede, filtroCarrera, filtroTipoContrato, filtroTipoJornada, filtroArea, dateRange]);

  const columnas: ColumnsType<Permiso> = [
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
      title: "Cantidad de permisos",
      dataIndex: "cantidadPermisos",
      key: "cantidadPermisos",
      sorter: (a, b) => a.cantidadPermisos - b.cantidadPermisos,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar cantidad"
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
      onFilter: (value, record) => record.cantidadPermisos.toString().includes(value as string),
    },
    {
      title: "Días acumulados",
      dataIndex: "diasAcumulados",
      key: "diasAcumulados",
      sorter: (a, b) => a.diasAcumulados - b.diasAcumulados,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar días"
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
      onFilter: (value, record) => record.diasAcumulados.toString().includes(value as string),
    },
    {
      title: "Horas acumuladas",
      dataIndex: "horasAcumuladas",
      key: "horasAcumuladas",
      sorter: (a, b) => a.horasAcumuladas - b.horasAcumuladas,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar horas"
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
      onFilter: (value, record) => record.horasAcumuladas.toString().includes(value as string),
    },
    {
      title: "Horas acumuladas recuperadas",
      dataIndex: "horasAcumuladasRecuperadas",
      key: "horasAcumuladasRecuperadas",
      sorter: (a, b) => a.horasAcumuladasRecuperadas - b.horasAcumuladasRecuperadas,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar horas"
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
      onFilter: (value, record) => record.horasAcumuladasRecuperadas.toString().includes(value as string),
    },
    {
      title: "Accion",
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
  const paisesUnicos = [...new Set(permisos.map((p) => p.pais))].filter(Boolean);
  const sedesUnicas = [...new Set(permisos.map((p) => p.sede))].filter(Boolean);
  const carrerasUnicas = [...new Set(permisos.map((p) => p.carrera))].filter(Boolean);
  const tiposContratoUnicos = [...new Set(permisos.map((p) => p.tipoContrato))].filter(Boolean);
  const tiposJornadaUnicos = [...new Set(permisos.map((p) => p.tipoJornada))].filter(Boolean);
  const areasUnicas = [...new Set(permisos.map((p) => p.area))].filter(Boolean);

  return (
    <div className={estilos.container}>
      <div className={estilos.contentWrapper}>
        <div className={estilos.header}>
          <h1 className={estilos.title}>Permisos</h1>
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
            <Button type="primary" className={estilos.btnNuevo} onClick={handleNuevoRegistro}>
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
          dataSource={permisosFiltrados}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1500 }}
        />
      </div>

      <NuevoPermisoModal
        open={modalVisible}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      />
    </div>
  );
}
