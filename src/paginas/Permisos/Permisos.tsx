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
import { useCallback, useEffect, useState } from "react";
import moment, { type Moment } from "moment";
import { obtenerPermisosPaginados, crearPermiso } from "../../servicios/PermisoService";
import estilos from "./Permisos.module.css";
import type { ColumnsType } from "antd/es/table";
import type { Permiso, CrearPermisoDTO } from "../../interfaces/IPermiso";
import NuevoPermisoModal, { type NuevoPermisoFormValues } from "./NuevoPermisoModal";

const { Option } = Select;
const { RangePicker } = DatePicker;

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

  // API State
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch from API
  const fetchPermisos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await obtenerPermisosPaginados({
        page: currentPage,
        pageSize,
        search: searchText,
        idPais: filtroPais ? parseInt(filtroPais) : undefined,
        // Dates:
        fechaNacimientoDesde: dateRange?.[0]?.isValid() ? dateRange[0].format("YYYY-MM-DD") : undefined,
        fechaNacimientoHasta: dateRange?.[1]?.isValid() ? dateRange[1].format("YYYY-MM-DD") : undefined,
      });

      if (response.codigo === "SIN ERROR") {
        setPermisos(response.data);
        setTotalRegistros(response.total);
      } else {
        console.error("Error API:", response.mensaje);
      }
    } catch (error) {
      console.error("Error fetching permisos:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, dateRange, filtroPais]);

  useEffect(() => {
    fetchPermisos();
  }, [fetchPermisos]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const handleNuevoRegistro = () => {
    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
  };

  const handleModalOk = async (values: NuevoPermisoFormValues) => {
    try {
      setLoading(true);

      const dto: CrearPermisoDTO = {
        idPersonal: values.idPersonal,
        idTipoPermiso: values.tipoPermiso,
        motivo: values.motivoDetallado,
        modalidadGestion: values.modalidadGestion,
        fechaPermiso: values.fechaPermiso.format("YYYY-MM-DD"),
        horaInicio: values.horasGestionInicio.format("HH:mm:ss"),
        horaFin: values.horasGestionFin.format("HH:mm:ss"),
        tratamientoHoras: values.tratamientoHoras,
        usuarioCreacion: "Sistema", // TODO: Get from auth context
        horarioRecuperacion: values.horarioRecuperacionTexto,
      };

      if (values.diasRecuperacionMultiple && values.diasRecuperacionMultiple[0] && values.diasRecuperacionMultiple[1]) {
        dto.fechaRecuperacionInicio = values.diasRecuperacionMultiple[0].format("YYYY-MM-DD");
        dto.fechaRecuperacionFin = values.diasRecuperacionMultiple[1].format("YYYY-MM-DD");
      }

      const respuesta = await crearPermiso(dto);

      if (respuesta.codigo === "SIN ERROR") {
        setModalVisible(false);
        fetchPermisos(); // Refresh table
      } else {
        console.error("Error creating permission:", respuesta.mensaje);
        // You might want to show a notification here
      }
    } catch (error) {
      console.error("Error creating permission:", error);
    } finally {
      setLoading(false);
    }
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
  // DROPDOWNS: Since we are paginating server-side, we can't derive unique values from the current page 'permisos'.
  // We need separate catalog API calls for these filters. 
  // For now, I will leave them empty or comment them out to prevent errors, 
  // as the user said "Don't remove any filter I will work on them later".
  // Keeping the logic safe against 'undefined' permisos.
  // DROPDOWNS: Since we are paginating server-side, we can't derive unique values from the current page 'permisos'.
  // We will leave them empty for now until catalogs are connected.
  const paisesUnicos: string[] = [];
  const sedesUnicas: string[] = [];
  const carrerasUnicas: string[] = [];
  const tiposContratoUnicos: string[] = [];
  const tiposJornadaUnicos: string[] = [];
  const areasUnicas: string[] = [];

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
            <Button type="primary" style={{ backgroundColor: "#1f1f1f", borderColor: "#1f1f1f" }} onClick={handleNuevoRegistro}>
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

        <div style={{ overflowX: 'auto' }}>
          <Table
            columns={columnas}
            dataSource={permisos}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalRegistros,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} registros`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1500 }}
          />
        </div>
      </div>

      <NuevoPermisoModal
        open={modalVisible}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      />
    </div>
  );
}
