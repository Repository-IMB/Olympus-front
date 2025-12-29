import { Table, Button, Input, Space, Tag, Tooltip, message, Modal } from "antd";
import { SearchOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import estilos from "./Productos.module.css";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, DeleteOutlined, EyeOutlined, CalendarOutlined } from "@ant-design/icons";
import ModalProducto from "./ModalProducto";
import {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerProductoPorId,
  obtenerTiposEstadoProducto,
} from "../../servicios/ProductoService";
import type { Producto, TipoEstadoProducto } from "../../interfaces/IProducto";
import { obtenerDepartamentos } from "../../servicios/DepartamentosService";

export default function Productos() {
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [modoModal, setModoModal] = useState<"crear" | "editar">("crear");
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalEliminarVisible, setModalEliminarVisible] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState<number | null>(
    null
  );
  const [departamentos, setDepartamentos] = useState<
  { id: number; nombre: string }[]
>([]);
  const [tiposEstadoProducto, setTiposEstadoProducto] = useState<TipoEstadoProducto[]>([]);
const navigate = useNavigate();

  /* =========================
     CARGA INICIAL
  ========================= */
  useEffect(() => {
    const cargarDatos = async () => {
      await cargarDepartamentos();
      await cargarTiposEstadoProducto();
      await cargarProductos();
    };
    cargarDatos();
  }, []);

  const cargarDepartamentos = async () => {
    try {
      const data = await obtenerDepartamentos();
      console.log("Departamentos cargados:", data);
      const deptFormateados = data.map(d => ({ id: d.id, nombre: d.nombre }));
      console.log("Departamentos formateados:", deptFormateados);
      setDepartamentos(deptFormateados);
    } catch (error) {
      console.error("Error al cargar departamentos:", error);
    }
  };

  const cargarTiposEstadoProducto = async () => {
    try {
      const data = await obtenerTiposEstadoProducto();
      console.log("Tipos de estado producto cargados:", data);
      setTiposEstadoProducto(data);
    } catch (error) {
      console.error("Error al cargar tipos de estado producto:", error);
    }
  };

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const data = await obtenerProductos();
      setProductos(data);
    } catch (error) {
      message.error("Error al cargar los productos");
      console.error(error);
    } finally {
      setLoading(false);
    }
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
      await cargarProductos();
    } catch (error: any) {
      const mensajeError =
        error?.response?.data?.message ||
        `Ocurrió un error al ${
          modoModal === "crear" ? "crear" : "editar"
        } el producto`;

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
      message.error("No se pudo cargar el producto para editar");
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
    if (!productoAEliminar) return;

    try {
      await eliminarProducto(productoAEliminar);
      message.success("Producto eliminado correctamente");
      setProductos((prev) =>
        prev.filter((p) => p.id !== productoAEliminar)
      );
      setModalEliminarVisible(false);
      setProductoAEliminar(null);
    } catch (error: any) {
      const mensajeError =
        error?.response?.data?.message ||
        "Error al eliminar el producto";
      message.error(mensajeError);
      console.error(error);
    }
  };

  const cancelarEliminacion = () => {
    setModalEliminarVisible(false);
    setProductoAEliminar(null);
  };

  /* =========================
     FILTRO
  ========================= */
  const productosFiltrados = useMemo(() => {
    if (!searchText.trim()) return productos;

    const busqueda = searchText.toLowerCase();
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(busqueda) ||
        p.codigoLanzamiento.toLowerCase().includes(busqueda) ||
        (p.departamentoNombre || "").toLowerCase().includes(busqueda)
    );
  }, [productos, searchText]);

  /* =========================
     COLUMNAS
  ========================= */
  const columnas: ColumnsType<Producto> = [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Producto",
      dataIndex: "nombre",
      key: "nombre",
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
    },
    {
      title: "Código",
      dataIndex: "codigoLanzamiento",
      key: "codigoLanzamiento",
    },
    {
      title: "Departamento",
      dataIndex: "departamentoNombre",
      key: "departamentoNombre",
    },
    {
    title: "Horas en vivo",
    dataIndex: "horasSincronicas",
    key: "horasSincronicas",
    align: "center",
    render: (v: number | undefined) => v ?? "-",
  },
  {
    title: "Horas asincrónicas",
    dataIndex: "horasAsincronicas",
    key: "horasAsincronicas",
    align: "center",
    render: (v: number | undefined) => v ?? "-",
  },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (estado: boolean) =>
        estado ? (
          <Tag color="green">Activo</Tag>
        ) : (
          <Tag color="red">Inactivo</Tag>
        ),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <Space size="middle">
         <Tooltip title="Ver detalle">
          <span
            className={estilos.actionIcon}
            onClick={() => navigate(`/producto/productos/detalle/${record.id}`)}
          >
            <EyeOutlined />
          </span>
        </Tooltip>

        <Tooltip title="Imprimir PDF">
          <span className={estilos.actionIcon}>
            <CalendarOutlined />
          </span>
        </Tooltip>
          <Tooltip title="Editar">
            <span
              className={estilos.actionIcon}
              onClick={() => abrirModalEditar(record)}
            >
              <EditOutlined />
            </span>
          </Tooltip>

          <Tooltip title="Eliminar">
            <span
              className={estilos.actionIcon}
              onClick={() => handleEliminar(record.id)}
            >
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
        {/* HEADER */}
        <div className={estilos.header}>
          <h1 className={estilos.title}>Productos</h1>
        </div>

        {/* TOOLBAR */}
        <div className={estilos.toolbar}>
          <div className={estilos.searchBar}>
            <Input
              placeholder="Buscar producto, código o departamento"
              prefix={<SearchOutlined />}
              className={estilos.searchInput}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className={estilos.actions}>
            <Button
              type="primary"
              className={estilos.btnNuevo}
              onClick={abrirModalCrear}
            >
              Nuevo producto
            </Button>
          </div>
        </div>

        {/* TABLA */}
        <div className={estilos.tableWrapper}>
          <Table
            columns={columnas}
            dataSource={productosFiltrados}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            loading={loading}
          />
        </div>
      </div>

      {/* MODAL CREAR / EDITAR */}
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

      {/* MODAL ELIMINAR */}
      <Modal
        title={
          <span>
            <ExclamationCircleOutlined
              style={{ color: "#ff4d4f", marginRight: 8 }}
            />
            Confirmar eliminación
          </span>
        }
        open={modalEliminarVisible}
        onOk={confirmarEliminacion}
        onCancel={cancelarEliminacion}
        okText="Sí, eliminar"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <p>¿Estás seguro de que deseas eliminar este producto?</p>
        <p style={{ color: "#ff4d4f", marginTop: 8 }}>
          <strong>Esta acción no se puede deshacer.</strong>
        </p>
      </Modal>
    </div>
  );
}
