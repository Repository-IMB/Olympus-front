import { Table, Button, Input, Space, Tag, Tooltip, message, Modal, Spin, Select } from "antd";
import { SearchOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import estilos from "./Productos.module.css";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, DeleteOutlined, EyeOutlined, CalendarOutlined } from "@ant-design/icons";
import ModalProducto from "./ModalProducto";
import {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  // eliminarProducto,
  obtenerProductoPorId,
  obtenerTiposEstadoProducto,
} from "../../servicios/ProductoService";
import type { Producto, TipoEstadoProducto } from "../../interfaces/IProducto";
import { obtenerDepartamentos } from "../../servicios/DepartamentosService";

const { Option } = Select;

export default function Productos() {
  const [searchText, setSearchText] = useState("");
  const [filterEstadoProducto, setFilterEstadoProducto] = useState<number | null>(null);
  const searchInputRef = useRef<any>(null);
  
  // Estado para la paginación del servidor
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0 
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [modoModal, setModoModal] = useState<"crear" | "editar">("crear");
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalEliminarVisible, setModalEliminarVisible] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState<number | null>(null);
  const [departamentos, setDepartamentos] = useState<{ id: number; nombre: string }[]>([]);
  const [tiposEstadoProducto, setTiposEstadoProducto] = useState<TipoEstadoProducto[]>([]);
  
  const navigate = useNavigate();

  /* =========================================================
      EFECTO DE BÚSQUEDA EN TIEMPO REAL (DEBOUNCE)
     ========================================================= */
  useEffect(() => {
    // Cuando el usuario escribe, esperamos 500ms antes de llamar a la API
    const delayDebounceFn = setTimeout(() => {
      // Siempre que se busca, volvemos a la página 1
      cargarProductos(1, pagination.pageSize);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText]); // Se ejecuta cada vez que cambia el texto

  // Efecto para filtro de estado
  useEffect(() => {
    cargarProductos(1, pagination.pageSize);
  }, [filterEstadoProducto]);

  // Mantener el foco en el input de búsqueda después de cargar
  useEffect(() => {
    if (!loading && searchText && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [loading]);

  // Carga de combos auxiliares solo al inicio
  useEffect(() => {
    const cargarAuxiliares = async () => {
      await cargarDepartamentos();
      await cargarTiposEstadoProducto();
    };
    cargarAuxiliares();
  }, []);

  const cargarDepartamentos = async () => {
    try {
      const data = await obtenerDepartamentos();
      const deptFormateados = data.map((d: any) => ({ id: d.id, nombre: d.nombre }));
      setDepartamentos(deptFormateados);
    } catch (error) {
      console.error("Error al cargar departamentos:", error);
    }
  };

  const cargarTiposEstadoProducto = async () => {
    try {
      const data = await obtenerTiposEstadoProducto();
      setTiposEstadoProducto(data);
    } catch (error) {
      console.error("Error al cargar tipos de estado:", error);
    }
  };

  /* =========================================================
      LÓGICA DE CARGA DE PRODUCTOS (PAGINADA)
     ========================================================= */
  const cargarProductos = async (page: number, pageSize: number) => {
    setLoading(true);
    try {
      // Llamamos al servicio pasando búsqueda, página, tamaño y filtro de estado
      const data: any = await obtenerProductos(
        searchText, 
        page, 
        pageSize, 
        filterEstadoProducto
      );
      
      // Verificamos si viene en formato paginado { total, productos }
      if (data && Array.isArray(data.productos)) {
         setProductos(data.productos);
         setPagination({
            current: page,
            pageSize: pageSize,
            total: data.total // Total real desde BD
         });
      } else if (Array.isArray(data)) {
         // Fallback por si la API devolviera array plano
         setProductos(data);
         setPagination({ ...pagination, total: data.length });
      } else {
         setProductos([]);
      }
    } catch (error) {
      console.error("Error cargando productos:", error);
      message.error("Error al cargar los productos");
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination: any) => {
    // Al cambiar de página, mantenemos el texto de búsqueda actual
    cargarProductos(newPagination.current, newPagination.pageSize);
  };

  /* =========================
      GUARDAR (CREAR / EDITAR)
     ========================= */
  const guardarProducto = async (producto: any) => {
    try {
      if (modoModal === "crear") {
        await crearProducto(producto);
        message.success("Producto creado exitosamente");
      } else {
        if (productoSeleccionado?.id) {
          await actualizarProducto(
            productoSeleccionado.id,
            producto,
            productoSeleccionado
          );
          message.success("Producto actualizado exitosamente");
        }
      }
      setModalVisible(false);
      setErrorModal(null);
      setProductoSeleccionado(null);
      // Recargar manteniendo búsqueda y página actual
      cargarProductos(pagination.current, pagination.pageSize);
    } catch (error: any) {
      const mensajeError = error?.response?.data?.message || "Error al guardar";
      setErrorModal(mensajeError);
      message.error(mensajeError);
    }
  };

  /* =========================
      MODALES
     ========================= */
  const abrirModalCrear = () => {
    setModoModal("crear");
    setProductoSeleccionado(null);
    setErrorModal(null);
    setModalVisible(true);
  };

  const abrirModalEditar = async (producto: Producto) => {
    try {
      setModoModal("editar");
      setErrorModal(null);
      const productoCompleto = await obtenerProductoPorId(producto.id);
      setProductoSeleccionado(productoCompleto);
      setModalVisible(true);
    } catch {
      message.error("No se pudo cargar el producto");
    }
  };

  /* =========================
      ELIMINAR
     ========================= */
  const handleEliminar = (id: number) => {
    setProductoAEliminar(id);
    setModalEliminarVisible(true);
  };

  const confirmarEliminacion = async () => {
    /* if (!productoAEliminar) return;
    try {
      await eliminarProducto(productoAEliminar);
      message.success("Producto eliminado");
      cargarProductos(pagination.current, pagination.pageSize);
      setModalEliminarVisible(false);
      setProductoAEliminar(null);
    } catch (error: any) {
      message.error("Error al eliminar");
    } 
    */
    setModalEliminarVisible(false);
    message.info("Eliminación pendiente de habilitar en servicio");
  };

  const cancelarEliminacion = () => {
    setModalEliminarVisible(false);
    setProductoAEliminar(null);
  };

  // Filtrar productos en el frontend después de cargar
  const productosFiltrados = productos;

  // Función para obtener el color del tag según el estado
  const obtenerColorEstado = (estadoNombre: string | undefined): string => {
    if (!estadoNombre) return "default";
    
    const estadoLower = estadoNombre.toLowerCase();
    
    if (estadoLower === "en curso") return "blue";
    if (estadoLower === "en venta") return "green";
    if (estadoLower === "finalizado") return "red";
    if (estadoLower === "grupo completo") return "orange";
    if (estadoLower === "piloto") return "purple";
    if (estadoLower === "postergado") return "volcano";
    if (estadoLower === "cancelado") return "default";
    if (estadoLower === "no llamar nuevos") return "magenta";
    
    return "default";
  };

  /* =========================
      COLUMNAS
     ========================= */
  const columnas: ColumnsType<Producto> = [
    { title: "Id", dataIndex: "id", key: "id", width: 80, sorter: (a, b) => a.id - b.id },
    { title: "Producto", dataIndex: "nombre", key: "nombre", sorter: (a, b) => a.nombre.localeCompare(b.nombre) },
    { title: "Código", dataIndex: "codigoLanzamiento", key: "codigoLanzamiento" },
    { title: "Departamento", dataIndex: "departamentoNombre", key: "departamentoNombre" },
    { 
      title: "Horas en vivo", 
      dataIndex: "horasSincronicas", 
      align: "center", 
      render: (v: number | undefined) => v ?? "-" 
    },
    { 
      title: "Horas asincrónicas", 
      dataIndex: "horasAsincronicas", 
      align: "center", 
      render: (v: number | undefined) => v ?? "-" 
    },
    {
      title: "Estado de producto",
      dataIndex: "estadoProductoTipoNombre",
      key: "estadoProductoTipoNombre",
      render: (estadoNombre: string | undefined) => {
        if (!estadoNombre) return <Tag>-</Tag>;
        return <Tag color={obtenerColorEstado(estadoNombre)}>{estadoNombre}</Tag>;
      },
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Ver detalle">
            <span className={estilos.actionIcon} onClick={() => navigate(`/producto/productos/detalle/${record.id}`)}>
              <EyeOutlined />
            </span>
          </Tooltip>
          <Tooltip title="Imprimir PDF">
            <span className={estilos.actionIcon}><CalendarOutlined /></span>
          </Tooltip>
          <Tooltip title="Editar">
            <span className={estilos.actionIcon} onClick={() => abrirModalEditar(record)}>
              <EditOutlined />
            </span>
          </Tooltip>
          <Tooltip title="Eliminar">
            <span className={estilos.actionIcon} onClick={() => handleEliminar(record.id)}>
              <DeleteOutlined />
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
          <h1 className={estilos.title}>Productos</h1>
        </div>

        <div className={estilos.toolbar}>
          <div className={estilos.searchBar}>
            {/* Input de búsqueda automática */}
            <Input
              ref={searchInputRef}
              placeholder="Buscar producto, código o departamento"
              prefix={<SearchOutlined />}
              className={estilos.searchInput}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className={estilos.actions}>
            <Button type="primary" className={estilos.btnNuevo} onClick={abrirModalCrear}>
              Nuevo producto
            </Button>
          </div>
        </div>

        {/* Filtro de estado de producto */}
        <div className={estilos.toolbar} style={{ marginTop: '16px' }}>
          <Select
            value={filterEstadoProducto}
            onChange={(value) => setFilterEstadoProducto(value)}
            style={{ width: 260 }}
            placeholder="Seleccionar estado de producto"
            allowClear
          >
            <Option value={null}>Todos los estados</Option>
            {tiposEstadoProducto
              .filter((estado) => estado.estado)
              .map((estado) => (
                <Option key={estado.id} value={estado.id}>
                  {estado.nombre}
                </Option>
              ))}
          </Select>
        </div>

        <div className={estilos.tableWrapper}>
          <Spin spinning={loading}>
            <Table
              columns={columnas}
              dataSource={productosFiltrados}
              rowKey="id"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true
              }}
              loading={loading}
              onChange={handleTableChange}
            />
          </Spin>
        </div>
      </div>

      <ModalProducto
        visible={modalVisible}
        modo={modoModal}
        producto={productoSeleccionado}
        onCancel={() => {
          setModalVisible(false);
          setErrorModal(null);
          setProductoSeleccionado(null);
        }}
        onSave={guardarProducto}
        departamentos={departamentos}
        tiposEstadoProducto={tiposEstadoProducto}
      />

      <Modal
        title={<span><ExclamationCircleOutlined style={{ color: "#ff4d4f", marginRight: 8 }} />Confirmar eliminación</span>}
        open={modalEliminarVisible}
        onOk={confirmarEliminacion}
        onCancel={cancelarEliminacion}
        okText="Sí, eliminar"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <p>¿Estás seguro de que deseas eliminar este producto?</p>
        <p style={{ color: "#ff4d4f", marginTop: 8 }}><strong>Esta acción no se puede deshacer.</strong></p>
      </Modal>
    </div>
  );
}