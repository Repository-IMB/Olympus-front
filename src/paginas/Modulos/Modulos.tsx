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
  Spin
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useMemo, useState, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
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
  type IModulo 
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
  const [searchText, setSearchText] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>();
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [moduloEditando, setModuloEditando] = useState<IModulo | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  const [modulos, setModulos] = useState<IModulo[]>([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Cargar módulos al montar el componente
  useEffect(() => {
    cargarModulos();
  }, []);

  const cargarModulos = async () => {
    setLoading(true);
    try {
      const data = await obtenerModulos();
      setModulos(data);
    } catch (error) {
      message.error("Error al cargar los módulos");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const modulosFiltrados = useMemo(() => {
    return modulos.filter((m) => {
      const busqueda = searchText.toLowerCase();

      const coincideBusqueda =
        !busqueda ||
        m.nombre.toLowerCase().includes(busqueda) ||
        (m.productosCodigoLanzamiento && 
         m.productosCodigoLanzamiento.toLowerCase().includes(busqueda));

      const coincideProducto =
        !productoSeleccionado ||
        m.productosCodigoLanzamiento === productoSeleccionado;

      const coincideFecha = (() => {
        if (!dateRange) return true;

        const [inicio, fin] = dateRange;
        if (!inicio || !fin) return true;

        const fechaModulo = dayjs(m.fechaCreacion);

        return (
          (fechaModulo.isAfter(inicio.startOf("day")) ||
            fechaModulo.isSame(inicio.startOf("day"))) &&
          (fechaModulo.isBefore(fin.endOf("day")) ||
            fechaModulo.isSame(fin.endOf("day")))
        );
      })();

      return coincideBusqueda && coincideProducto && coincideFecha;
    });
  }, [searchText, productoSeleccionado, dateRange, modulos]);

  // Obtener códigos de producto únicos para el filtro
  const codigosProducto = useMemo(() => {
    const codigos = modulos
      .map(m => m.productosCodigoLanzamiento)
      .filter(c => c && c.trim() !== "");
    return [...new Set(codigos)];
  }, [modulos]);

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setModuloEditando(null);
    setModalVisible(true);
  };

  const abrirModalEditar = async (modulo: IModulo) => {
    try {
      setLoading(true);
      // Obtener el módulo completo con todos sus campos
      const moduloCompleto = await obtenerModuloPorId(modulo.id!);
      console.log('Módulo completo:', JSON.stringify(moduloCompleto, null, 2));
      
      setModoEdicion(true);
      setModuloEditando(moduloCompleto); // ⬅️ Usar el módulo completo
      setModalVisible(true);
    } catch (error) {
      message.error("Error al cargar el módulo");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  

  const handleSubmitModal = async (values: any) => {
    try {
      if (modoEdicion && moduloEditando) {
        const preserveSessions = values.preserveSessions === true;
        const payloadFinal = preserveSessions 
          ? {
              ...moduloEditando, 
              ...values,          
              id: moduloEditando.id,
              preserveSessions: true
            }
          : values;

        await actualizarModulo(
          moduloEditando.id!,
          payloadFinal,
          preserveSessions
        );

        message.success("Módulo actualizado correctamente");
      } else {
        await crearModulo(values);
        message.success("Módulo creado correctamente");
      }
      setModalVisible(false);
      await cargarModulos();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Error al guardar el módulo";
      message.error(errorMsg);
      console.error("Error:", error);
    }
  };

  const handleCancelModal = () => {
    setModalVisible(false);
    setModuloEditando(null);
    setModoEdicion(false);
  };

  const columnas: ColumnsType<IModulo> = [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => (a.id || 0) - (b.id || 0),
    },
    {
      title: "Módulo",
      dataIndex: "nombre",
      key: "nombre",
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
    },
    {
      title: "Código de Producto Relacionado",
      dataIndex: "productosCodigoLanzamiento",
      key: "productosCodigoLanzamiento",
      render: (codigo: string) => codigo || "-",
    },
    {
      title: "Días de clase",
      dataIndex: "diasSemana",
      key: "diasSemana",
      render: (dias: string) => {
        if (!dias || dias.trim() === "") return "-";
        return dias
          .split(",")
          .map((d) => obtenerNombreCompletoDia(d.trim()))
          .join(" - ");
      },
    },
    {
      title: "Fecha de creación",
      dataIndex: "fechaCreacion",
      key: "fechaCreacion",
      render: (fecha: string) => dayjs(fecha).format("DD/MM/YYYY"),
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
      render: (_, record: IModulo) => (
        <Space size="middle">
          <Tooltip title="Editar">
            <span
              className={estilos.actionIcon}
              onClick={() => abrirModalEditar(record)}
            >
              <EditOutlined />
            </span>
          </Tooltip>

          <Tooltip title="Ver detalle">
            <span
              className={estilos.actionIcon}
              onClick={() => navigate(`/producto/modulos/detalle/${record.id}`)}
            >
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
        {/* HEADER */}
        <div className={estilos.header}>
          <h1 className={estilos.title}>Módulos</h1>
        </div>

        {/* TOOLBAR */}
        <div className={estilos.toolbar}>
          <Input
            placeholder="Buscar por módulo o código de producto"
            prefix={<SearchOutlined />}
            className={estilos.searchInput}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <Button type="primary" onClick={abrirModalCrear}>
            Nuevo módulo
          </Button>
        </div>

        {/* FILTROS */}
        <div className={estilos.toolbar}>
          <Select
            allowClear
            placeholder="Filtro por producto relacionado"
            style={{ width: 260 }}
            onChange={(value) => setProductoSeleccionado(value)}
          >
            {codigosProducto.map((codigo) => (
              <Option key={codigo} value={codigo}>
                {codigo}
              </Option>
            ))}
          </Select>

          <RangePicker
            value={dateRange}
            onChange={(dates) =>
              setDateRange(dates as [Dayjs | null, Dayjs | null] | null)
            }
            format="DD/MM/YYYY"
            placeholder={["Fecha inicio", "Fecha fin"]}
          />
        </div>

        {/* TABLA */}
        <Spin spinning={loading}>
          <Table
            columns={columnas}
            dataSource={modulosFiltrados}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Spin>
      </div>

      {/* MODAL REUTILIZABLE */}
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