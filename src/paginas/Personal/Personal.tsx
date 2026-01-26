import {
  Table,
  Button,
  Input,
  Space,
  Select,
  DatePicker,
  Tooltip,
  message,
} from "antd";
import { SearchOutlined, EditOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import moment, { type Moment } from "moment";
import estilos from "./Personal.module.css";
import type { ColumnsType } from "antd/es/table";
import type { Personal } from "../../interfaces/IPersonal";
import { obtenerPaises, type Pais } from "../../config/rutasApi";

import { obtenerPersonalPaginado } from "../../servicios/PersonalService";

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function Personal() {
  const [searchText, setSearchText] = useState("");
  const [filtroPais, setFiltroPais] = useState<string>();
  const [filtroSede, setFiltroSede] = useState<string>();
  const [filtroCarrera, setFiltroCarrera] = useState<string>();
  const [filtroTipoContrato, setFiltroTipoContrato] = useState<string>();
  const [filtroTipoJornada, setFiltroTipoJornada] = useState<string>();
  const [filtroArea, setFiltroArea] = useState<string>();
  const [dateRange, setDateRange] = useState<[Moment | null, Moment | null] | null>(null);

  // API State
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // State for countries from API
  const [paises, setPaises] = useState<Pais[]>([]);
  const [loadingPaises, setLoadingPaises] = useState(true);

  const fetchPersonal = async () => {
    try {
      setLoading(true);
      const response = await obtenerPersonalPaginado({
        page: currentPage,
        pageSize,
        search: searchText,
        pais: filtroPais,
        sede: filtroSede,
        carrera: filtroCarrera,
        fechaInicio: dateRange?.[0]?.toISOString(),
        fechaFin: dateRange?.[1]?.toISOString(),
      });

      if (response.codigo === "SIN ERROR") {
        setPersonal(response.personal);
        setTotalRegistros(response.totalRegistros);
      } else {
        message.error(response.mensaje || "Error al cargar personal");
      }
    } catch (error) {
      console.error("Error fetching personal:", error);
      message.error("Error al cargar datos del personal");
    } finally {
      setLoading(false);
    }
  };

  // Load countries from API
  useEffect(() => {
    const cargarPaises = async () => {
      try {
        setLoadingPaises(true);
        const paisesData = await obtenerPaises();
        const paisesActivos = paisesData.filter(p => p.estado);
        setPaises(paisesActivos);
      } catch (error) {
        console.error(error);
        message.error("Error al cargar países");
      } finally {
        setLoadingPaises(false);
      }
    };
    cargarPaises();
  }, []);

  // Fetch data on filter change
  useEffect(() => {
    fetchPersonal();
  }, [currentPage, pageSize, searchText, filtroPais, filtroSede, filtroCarrera, dateRange]);

  const limpiarFiltros = () => {
    setSearchText("");
    setFiltroPais(undefined);
    setFiltroSede(undefined);
    setFiltroCarrera(undefined);
    setFiltroTipoContrato(undefined);
    setFiltroTipoJornada(undefined);
    setFiltroArea(undefined);
    setDateRange(null);
    setCurrentPage(1);
  };

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
      dataIndex: "nombreSede",
      key: "nombreSede",
      sorter: (a, b) => a.nombreSede.localeCompare(b.nombreSede),
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

  // Derive unique values for filters not from API (if possible, otherwise remove or mock)
  // For now we will keep them empty or mocked as we don't have endpoints for them
  const sedesUnicas: string[] = []; // Should come from API or be removed
  const carrerasUnicas: string[] = [];
  const tiposContratoUnicos: string[] = [];
  const tiposJornadaUnicos: string[] = [];
  const areasUnicas: string[] = [];

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
            <Button type="primary" style={{ backgroundColor: "#1f1f1f", borderColor: "#1f1f1f" }}>Nuevo alumno</Button>
          </div>
        </div>

        <div className={`${estilos.toolbar} ${estilos.filtersRow}`}>
          <Select
            allowClear
            placeholder="Filtro por país"
            value={filtroPais}
            onChange={setFiltroPais}
            className={estilos.filterSelect}
            style={{ minWidth: 150 }}
            loading={loadingPaises}
          >
            {paises.map((pais) => (
              <Option key={pais.id} value={pais.nombre}>
                {pais.nombre}
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
          dataSource={personal}
          rowKey="idPersonal"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalRegistros,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }
          }}
          loading={loading}
          scroll={{ x: 1500 }}
        />
      </div>
    </div>
  );
}
