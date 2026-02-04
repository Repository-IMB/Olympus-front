import { Table, Button, Input, Space, Tag, Tooltip, message, Modal, Spin, Select } from "antd";
import moment from "moment";
import { SearchOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import estilos from "./Productos.module.css";
import type { ColumnsType } from "antd/es/table";
import { 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  FilePdfOutlined
} from "@ant-design/icons";
import ModalProducto from "./ModalProducto";
import {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  obtenerProductoPorId,
  obtenerTiposEstadoProducto,
  obtenerPersonalDesarrollo,
  descargarPDFProducto,
  eliminarProducto
} from "../../servicios/ProductoService";
import type { PersonalCombo } from "../../servicios/ProductoService";
import type { Producto, TipoEstadoProducto } from "../../interfaces/IProducto";
import { obtenerDepartamentos } from "../../servicios/DepartamentosService";

const { Option } = Select;

export default function Productos() {
  const [searchText, setSearchText] = useState("");
  const [filterEstadoProducto, setFilterEstadoProducto] = useState<number | null>(null);
  const searchInputRef = useRef<any>(null);
  const [sortField, setSortField] = useState<string>("Nombre");
  const [sortOrder, setSortOrder] = useState<string>("ascend");
  const lastRequestRef = useRef<number>(0);
  const [filterDepartamento, setFilterDepartamento] = useState<number | null>(null);
  const [filterResponsable, setFilterResponsable] = useState<number | null>(null);
  const [personalList, setPersonalList] = useState<PersonalCombo[]>([]);
  
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
  const [filterEstadoActivo, setFilterEstadoActivo] = useState<boolean | null>(true);
  
  const navigate = useNavigate();

  // ... (Funciones de carga iguales)
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

  const cargarProductos = useCallback(async (page: number, pageSize: number) => {
    // 1. Generamos un ID único para esta petición
    const currentRequestId = Date.now();
    lastRequestRef.current = currentRequestId;

    setLoading(true);
    try {
      const ordenBackend = sortOrder === 'ascend' ? 'ASC' : sortOrder === 'descend' ? 'DESC' : sortOrder;
      
      const data: any = await obtenerProductos(
        searchText, 
        page, 
        pageSize, 
        filterEstadoProducto,
        filterDepartamento,
        filterResponsable,
        filterEstadoActivo,
        sortField,
        ordenBackend
      );
      
      if (lastRequestRef.current !== currentRequestId) {
          return; 
      }
      
      if (data && Array.isArray(data.productos)) {
         setProductos(data.productos);
         setPagination({
           current: page,
           pageSize: pageSize,
           total: data.total
         });
      } else {
         setProductos([]);
         setPagination(prev => ({ ...prev, current: page, pageSize: pageSize, total: 0 }));
      }
    } catch (error) {
      // También verificamos aquí para no mostrar errores de peticiones canceladas
      if (lastRequestRef.current === currentRequestId) {
        console.error("Error cargando productos:", error);
        message.error("Error al cargar los productos");
        setProductos([]);
      }
    } finally {
      // Solo quitamos el loading si es la última petición
      if (lastRequestRef.current === currentRequestId) {
        setLoading(false);
      }
    }
  }, [searchText, filterEstadoProducto, filterDepartamento,
      filterResponsable, filterEstadoActivo, sortField, sortOrder]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      cargarProductos(1, pagination.pageSize);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchText, filterEstadoProducto, filterDepartamento, filterResponsable, filterEstadoActivo,]);

  useEffect(() => {
    cargarProductos(pagination.current, pagination.pageSize);
  }, [sortField, sortOrder]);

  const handleTableChange = (newPagination: any, filters: any, sorter: any) => {
    if (newPagination.current !== pagination.current || newPagination.pageSize !== pagination.pageSize) {
       cargarProductos(newPagination.current, newPagination.pageSize);
       return; 
    }

    if (!sorter.order) {
        setSortField("FechaCreacion");
        setSortOrder("DESC");
    } else {
        const fieldMap: Record<string, string> = {
            'nombre': 'Nombre',
            'id': 'Id',
            'codigoLanzamiento': 'CodigoLanzamiento',
            'departamentoNombre': 'DepartamentoNombre',
            'personalNombre': 'PersonalNombre',
            'fechaPresentacion': 'FechaPresentacion',
            'horasSincronicas': 'HorasSincronicas',
            'estadoProductoTipoNombre': 'EstadoProductoTipoNombre'
        };
        
        const nuevoCampo = fieldMap[sorter.field] || sorter.field;
        setSortField(nuevoCampo);
        setSortOrder(sorter.order === 'ascend' ? 'ASC' : 'DESC');
    }
  };

  useEffect(() => {
    if (!loading && searchText && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [loading, searchText]);

  useEffect(() => {
    const cargarInicial = async () => {
      await cargarDepartamentos();
      await cargarTiposEstadoProducto();
      const personalData = await obtenerPersonalDesarrollo();
      setPersonalList(personalData)
      await cargarProductos(1, pagination.pageSize);
    };
    cargarInicial();
  }, []);

  // ... (Funciones de guardar y modales iguales)
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
      cargarProductos(pagination.current, pagination.pageSize);
    } catch (error: any) {
      const mensajeError = error?.response?.data?.message || "Error al guardar";
      setErrorModal(mensajeError);
      message.error(mensajeError);
    }
  };

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

  const handleEliminar = (id: number) => {
    setProductoAEliminar(id);
    setModalEliminarVisible(true);
  };

  const confirmarEliminacion = async () => {
    if (!productoAEliminar) return;
    
    try {
      message.loading({ content: 'Eliminando producto...', key: 'eliminar', duration: 0 });
      
      await eliminarProducto(productoAEliminar);
      
      message.success({ content: 'Producto eliminado exitosamente', key: 'eliminar', duration: 3 });
      
      setModalEliminarVisible(false);
      setProductoAEliminar(null);
      
      // Recargar la tabla para que desaparezca el producto
      cargarProductos(pagination.current, pagination.pageSize);
      
    } catch (error: any) {
      console.error("Error al eliminar:", error);
      message.error({ 
        content: error?.response?.data?.mensaje || error?.response?.data?.Mensaje || "Error al eliminar el producto", 
        key: 'eliminar', 
        duration: 3 
      });
      setModalEliminarVisible(false);
      setProductoAEliminar(null);
    }
  };

  const cancelarEliminacion = () => {
    setModalEliminarVisible(false);
    setProductoAEliminar(null);
  };

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

  // 🟢 NUEVA FUNCIÓN: DESCARGAR PDF
  const handleDescargarPDF = async (idProducto: number) => {
    try {
        message.loading({ content: 'Generando PDF...', key: 'pdfGen', duration: 0 });
        await descargarPDFProducto(idProducto);
        message.success({ content: 'PDF descargado correctamente', key: 'pdfGen', duration: 3 });
    } catch (error: any) {
        message.error({ content: error.message || 'Error al descargar PDF', key: 'pdfGen', duration: 3 });
    }
  };

  const columnas: ColumnsType<Producto> = [
    { 
      title: "Id", 
      dataIndex: "id", 
      key: "id", 
      width: 80, 
      sorter: true 
    },
    { 
      title: "Producto", 
      dataIndex: "nombre", 
      key: "nombre", 
      sorter: true 
    },
    { 
      title: "Código", 
      dataIndex: "codigoLanzamiento", 
      key: "codigoLanzamiento",
      sorter: true
    },
    { 
      title: "Departamento", 
      dataIndex: "departamentoNombre", 
      key: "departamentoNombre",
      sorter: true
    },
    { 
      title: "Responsable", 
      dataIndex: "personalNombre",
      key: "personalNombre", 
      sorter: true,
      render: (v: string | undefined) => v ?? "-" 
    },
    { 
      title: "Fecha presentación", 
      dataIndex: "fechaPresentacion", 
      key: "fechaPresentacion", 
      sorter: true,
      render: (fecha: string | undefined) => {
        if (!fecha) return "-";
        return moment(fecha).format("DD/MM/YYYY");
      }
    },
    { 
      title: "Horas en vivo", 
      dataIndex: "horasSincronicas", // Este campo ya viene calculado del SP
      key: "horasSincronicas",
      align: "center",
      sorter: true,
      render: (v: number | undefined) => v ? Number(v).toFixed(2) : "-" 
    },
    {
      title: "Estado de producto",
      dataIndex: "estadoProductoTipoNombre",
      key: "estadoProductoTipoNombre",
      sorter: true,
      render: (estadoNombre: string | undefined) => {
        if (!estadoNombre) return <Tag>-</Tag>;
        return <Tag color={obtenerColorEstado(estadoNombre)}>{estadoNombre}</Tag>;
      },
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 180,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Ver detalle">
            <span className={estilos.actionIcon} onClick={() => navigate(`/producto/productos/detalle/${record.id}`)}>
              <EyeOutlined />
            </span>
          </Tooltip>
          
          {/* 🟢 BOTÓN PDF ACTUALIZADO */}
          <Tooltip title="Imprimir PDF">
            <span 
                className={estilos.actionIcon} 
                onClick={() => handleDescargarPDF(record.id)}
            >
                <FilePdfOutlined />
            </span>
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

        <div className={estilos.toolbar} style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
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
          {/* 2. Filtro Departamento (Nuevo) */}
          <Select
            value={filterDepartamento}
            onChange={setFilterDepartamento}
            style={{ width: 220 }}
            placeholder="Departamento"
            allowClear
            showSearch
            optionFilterProp="label" // Importante para que busque por el texto visible
            filterOption={(input, option) =>
                ((option?.label as string) ?? "").toLowerCase().includes(input.toLowerCase())
            }
          >
            <Option value={null} label="Todos los departamentos">Todos los departamentos</Option>
            {departamentos.map((d) => (
               <Option key={d.id} value={d.id} label={d.nombre}>{d.nombre}</Option>
            ))}
          </Select>
          {/* 3. Filtro Responsable (Nuevo) */}
          <Select
            value={filterResponsable}
            onChange={setFilterResponsable}
            style={{ width: 220 }}
            placeholder="Responsable"
            allowClear
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
                ((option?.label as string) ?? "").toLowerCase().includes(input.toLowerCase())
            }
          >
            <Option value={null} label="Todos los responsables">Todos los responsables</Option>
            {personalList.map((p) => {
               const nombreCompleto = `${p.nombres} ${p.apellidos}`;
               return (
                   <Option key={p.id} value={p.id} label={nombreCompleto}>
                       {nombreCompleto}
                   </Option>
               );
            })}
          </Select>
         {/* <Select
            value={filterEstadoActivo}
            onChange={setFilterEstadoActivo}
            style={{ width: 180 }}
            placeholder="Estado"
          >
            <Option value={true}>Activos</Option>
            <Option value={false}>Inactivos</Option>
            <Option value={null}>Todos</Option>
          </Select> */}
        </div>

        <div className={estilos.tableWrapper}>
          <Spin spinning={loading}>
            <Table
              columns={columnas}
              dataSource={productos}
              rowKey="id"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} productos`
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