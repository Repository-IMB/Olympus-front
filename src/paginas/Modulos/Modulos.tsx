import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Select,
  DatePicker,
  Tooltip,
  message,
  Spin,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useState, useEffect, useCallback} from "react";
import moment, { type Moment } from "moment";
import estilos from "./Modulos.module.css";
import type { ColumnsType } from "antd/es/table";
import {
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import ModalModulo from "./ModalModulo";
import {
  obtenerModulos,
  crearModulo,
  actualizarModulo,
  obtenerModuloPorId,
  obtenerCodigosFiltroModulo,
  type IModulo,
} from "../../servicios/ModuloService";

const { Option } = Select;
const { RangePicker } = DatePicker;

const obtenerNombreCompletoDia = (numero: string): string => {
  const mapeo: Record<string, string> = {
    "1": "Lunes",
    "2": "Martes",
    "3": "Miércoles",
    "4": "Jueves",
    "5": "Viernes",
    "6": "Sábado",
    "7": "Domingo",
  };
  return mapeo[numero] || numero;
};

export default function Modulos() {
  // Estados de Filtros
  const [searchText, setSearchText] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Moment | null, Moment | null] | null>(null);

  // Estados de Modales
  const [modalVisible, setModalVisible] = useState(false);
  const [moduloEditando, setModuloEditando] = useState<IModulo | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estados de Paginación
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 🟢 ORDENAMIENTO POR DEFECTO: Fecha de Creación DESC
  const [sortField, setSortField] = useState<string>("FechaCreacion");
  const [sortOrder, setSortOrder] = useState<string>("DESC");

  // Datos
  const [codigosProducto, setCodigosProducto] = useState<string[]>([]);
  const [modulos, setModulos] = useState<IModulo[]>([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // 🔹 Función de Carga Principal
  const cargarModulos = useCallback(
    async (page: number, pageSize: number) => {
      setLoading(true);
      try {
        let fInicio = "";
        let fFin = "";

        // Formateo de fechas para el Backend
        if (dateRange && dateRange[0] && dateRange[1]) {
          fInicio = dateRange[0].format("YYYY-MM-DD");
          fFin = dateRange[1].format("YYYY-MM-DD");
        }

        // Conversión de orden (Antd 'ascend'/'descend' -> SQL 'ASC'/'DESC')
        // Si no hay orden visual, usamos el valor del estado (que por defecto será DESC)
        const ordenBackend =
          sortOrder === "ascend" ? "ASC" : "DESC";

        const data: any = await obtenerModulos(
          searchText.trim(),
          page,
          pageSize,
          productoSeleccionado || "",
          fInicio,
          fFin,
          sortField,
          ordenBackend
        );

        if (data && Array.isArray(data.modulos)) {
          setModulos(data.modulos);
          setPagination({
            current: page,
            pageSize: pageSize,
            total: data.total,
          });

          // Llenar combo de filtros (Acumulativo para no perder opciones al paginar)
          if (data.modulos.length > 0) {
            const nuevosCodigos = data.modulos
              .map((m: any) => m.productosCodigoLanzamiento)
              .filter((c: any) => c && c.trim() !== "");
            
            setCodigosProducto((prev) => 
               Array.from(new Set([...prev, ...nuevosCodigos]))
            );
          }
        } else {
          setModulos([]);
          setPagination((prev) => ({ ...prev, current: page, pageSize, total: 0 }));
        }
      } catch (error: any) {
        console.error("❌ Error al cargar módulos:", error);
        message.error(error?.response?.data?.message || "Error al cargar los módulos");
        setModulos([]);
      } finally {
        setLoading(false);
      }
    },
    // Dependencias: Si cambia el orden, la búsqueda o el filtro, se regenera la función
    [searchText, dateRange, productoSeleccionado, sortField, sortOrder]
  );

  // 🔹 Efecto 1: Cambios en Filtros (Input, Select, DatePicker) -> Reset a Página 1
  useEffect(() => {
    const timer = setTimeout(() => {
      cargarModulos(1, pagination.pageSize);
    }, 500); // Debounce
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, productoSeleccionado, dateRange]);

  // 🔹 Efecto 2: Cambios en Ordenamiento -> Mantener Página Actual
  useEffect(() => {
    cargarModulos(pagination.current, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, sortOrder]);

  useEffect(() => {
    const cargarFiltros = async () => {
      try {
        // Llamamos al endpoint que trae SOLO los usados (tus 2 códigos)
        const codigosReales = await obtenerCodigosFiltroModulo();
        setCodigosProducto(codigosReales);
      } catch (error) {
        console.error("Error cargando filtros:", error);
      }
    };
    cargarFiltros();
  }, []);


  // 🔹 Manejador de la Tabla (Cambio de Página u Orden)
  const handleTableChange = (newPagination: any, filters: any, sorter: any) => {
    
    // 1. Detectar cambio de Paginación
    if (newPagination.current !== pagination.current || newPagination.pageSize !== pagination.pageSize) {
       cargarModulos(newPagination.current, newPagination.pageSize);
       return; 
    }

    // 2. Detectar cambio de Ordenamiento
    // 🟢 Si sorter.order es undefined, el usuario reseteó el orden -> Volver a Default
    if (!sorter.order) {
        setSortField("FechaCreacion");
        setSortOrder("DESC");
    } else {
        // Mapeo: DataIndex (Front) -> Nombre Columna (Stored Procedure)
        const fieldMap: Record<string, string> = {
            'id': 'Id',
            'nombre': 'Nombre',
            'codigo': 'Codigo',
            'fechaInicio': 'FechaInicio',
            'estado': 'Estado',
            'productosCodigoLanzamiento': 'ProductosCodigoLanzamiento',
            'diasSemana': 'DiasSemana'
        };

        const nuevoCampo = fieldMap[sorter.field] || sorter.field;
        setSortField(nuevoCampo);
        setSortOrder(sorter.order);
    }
  };

  /* =========================
     MODALES Y CRUD
     ========================= */
  const abrirModalCrear = () => {
    setModoEdicion(false);
    setModuloEditando(null);
    setModalVisible(true);
  };

  const abrirModalEditar = async (modulo: IModulo) => {
    try {
      setLoading(true);
      const moduloCompleto = await obtenerModuloPorId(modulo.id!);
      setModoEdicion(true);
      setModuloEditando(moduloCompleto);
      setModalVisible(true);
    } catch (error: any) {
      message.error("Error al cargar el módulo");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitModal = async (values: any) => {
    try {
      if (modoEdicion && moduloEditando) {
        // Preservar sesiones si se requiere (lógica simplificada)
        const preserveSessions = values.preserveSessions === true;
        const payload = preserveSessions 
            ? { ...moduloEditando, ...values, id: moduloEditando.id, preserveSessions: true } 
            : values;

        await actualizarModulo(moduloEditando.id!, payload, preserveSessions);
        message.success("Módulo actualizado correctamente");
      } else {
        await crearModulo(values);
        message.success("Módulo creado correctamente");
      }
      setModalVisible(false);
      cargarModulos(1, pagination.pageSize); // Recargar
    } catch (error: any) {
        const errorMsg = error?.response?.data?.message || "Error al guardar";
        message.error(errorMsg);
    }
  };

  const handleCancelModal = () => {
    setModalVisible(false);
    setModuloEditando(null);
    setModoEdicion(false);
  };

  // 🔹 Columnas
  const columnas: ColumnsType<IModulo> = [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: true, // Backend support
    },
    {
      title: "Módulo",
      dataIndex: "nombre",
      key: "nombre",
      sorter: true, // Backend support
    },
    {
      title: "Código de Producto",
      dataIndex: "productosCodigoLanzamiento",
      key: "productosCodigoLanzamiento",
      sorter: true, // Backend support
      render: (codigo: string) => codigo || "-",
    },
    {
      title: "Código de Módulo",
      dataIndex: "codigo",
      key: "codigo",
      sorter: true, // Backend support
      render: (codigo: string, record: any) => record.codigo || record.moduloCodigo || "-",
    },
    {
      title: "Días de clase",
      dataIndex: "diasSemana",
      key: "diasSemana",
      sorter: true, // Backend support
      render: (dias: string) => {
        if (!dias) return "-";
        return dias.split(",").map((d) => obtenerNombreCompletoDia(d.trim())).join(" - ");
      },
    },
    {
      title: "Fecha de inicio",
      dataIndex: "fechaInicio",
      key: "fechaInicio",
      sorter: true, // Backend support
      render: (fecha: string) => (fecha ? moment(fecha).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      sorter: true, // Backend support
      render: (estado: boolean) =>
        estado ? <Tag color="green">Activo</Tag> : <Tag color="red">Inactivo</Tag>,
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record: IModulo) => (
        <Space size="middle">
          <Tooltip title="Editar">
            <span className={estilos.actionIcon} onClick={() => abrirModalEditar(record)}>
              <EditOutlined />
            </span>
          </Tooltip>
          <Tooltip title="Ver detalle">
            <span className={estilos.actionIcon} onClick={() => navigate(`/producto/modulos/detalle/${record.id}`)}>
              <EyeOutlined />
            </span>
          </Tooltip>
          <Tooltip title="Eliminar">
            <span className={estilos.actionIcon}>
              <DeleteOutlined />
            </span>
          </Tooltip>
          <Tooltip title="Imprimir PDF">
            <span className={estilos.actionIcon}>
              <CalendarOutlined />
            </span>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className={estilos.container}>
      <div className={estilos.contentWrapper}>
        <div className={estilos.header}>
          <h1 className={estilos.title}>Módulos</h1>
        </div>

        <div className={estilos.toolbar}>
          <Input
            placeholder=" Buscar por módulo, código de producto o código de módulo"
            prefix={<SearchOutlined />}
            className={estilos.searchInput}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Button type="primary" onClick={abrirModalCrear}>
            Nuevo módulo
          </Button>
        </div>

        <div className={estilos.toolbar}>
          <Select
            allowClear
            placeholder="Filtro por producto relacionado"
            style={{ width: 260 }}
            onChange={(value) => setProductoSeleccionado(value)}
            value={productoSeleccionado}
          >
            {codigosProducto.map((codigo) => (
              <Option key={codigo} value={codigo}>
                {codigo}
              </Option>
            ))}
          </Select>

          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [Moment | null, Moment | null] | null)}
            format="DD/MM/YYYY"
            placeholder={["Fecha inicio", "Fecha fin"]}
          />
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columnas}
            dataSource={modulos}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} módulos`,
            }}
            onChange={handleTableChange}
            locale={{ emptyText: "No se encontraron módulos" }}
          />
        </Spin>
      </div>

      <ModalModulo
        visible={modalVisible}
        onCancel={handleCancelModal}
        onSubmit={handleSubmitModal}
        moduloEditar={moduloEditando}
        modoEdicion={modoEdicion}
      />
    </div>
  );
}