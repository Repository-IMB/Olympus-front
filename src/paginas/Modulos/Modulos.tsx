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
    [Moment | null, Moment | null] | null
  >(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [moduloEditando, setModuloEditando] = useState<IModulo | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const [codigosProducto, setCodigosProducto] = useState<string[]>([]);
  const [modulos, setModulos] = useState<IModulo[]>([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // 🔹 Debounce para búsqueda
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      cargarModulos(1, pagination.pageSize);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText, productoSeleccionado, dateRange]);

  // 🔹 Cargar al montar
  useEffect(() => {
    cargarModulos(1, 10);
  }, []);

  const cargarModulos = async (page: number, pageSize: number) => {
    setLoading(true);
    try {
      let fInicio = "";
      let fFin = "";
      if (dateRange && dateRange[0] && dateRange[1]) {
        fInicio = dateRange[0].format("YYYY-MM-DD");
        fFin = dateRange[1].format("YYYY-MM-DD");
      }

      console.log("🔍 Buscando con:", {
        searchText,
        productoSeleccionado,
        fInicio,
        fFin,
        page,
        pageSize
      });

      const data: any = await obtenerModulos(
        searchText.trim(), // ⬅️ Trim para evitar espacios
        page,
        pageSize,
        productoSeleccionado || "",
        fInicio,
        fFin
      );

      console.log("📦 Data recibida:", data);

      if (data && Array.isArray(data.modulos)) {
        setModulos(data.modulos);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: data.total
        });

        // Llenar combo de productos solo la primera vez
        if (data.modulos.length > 0 && codigosProducto.length === 0) {
          const codigosUnicos = [
            ...new Set(
              data.modulos
                .map((m: any) => m.productosCodigoLanzamiento)
                .filter((c: any) => c)
            ),
          ];
          setCodigosProducto(codigosUnicos as string[]);
        }
      } else {
        setModulos([]);
        setPagination({ ...pagination, total: 0 });
      }
    } catch (error: any) {
      console.error("❌ Error al cargar módulos:", error);
      message.error(
        error?.response?.data?.message || "Error al cargar los módulos"
      );
      setModulos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination: any) => {
    cargarModulos(newPagination.current, newPagination.pageSize);
  };

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setModuloEditando(null);
    setModalVisible(true);
  };

  const abrirModalEditar = async (modulo: IModulo) => {
    try {
      setLoading(true);
      const moduloCompleto = await obtenerModuloPorId(modulo.id!);
      console.log("📝 Módulo completo:", moduloCompleto);

      setModoEdicion(true);
      setModuloEditando(moduloCompleto);
      setModalVisible(true);
    } catch (error: any) {
      console.error("❌ Error al cargar módulo:", error);
      message.error(
        error?.response?.data?.message || "Error al cargar el módulo"
      );
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
              preserveSessions: true,
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
      await cargarModulos(1, 10);
    } catch (error: any) {
      console.error("❌ Error al guardar:", error?.response || error);
      const errorMsg =
        error?.response?.data?.message || "Error al guardar el módulo";
      message.error(errorMsg);
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
      title: "Código de Producto",
      dataIndex: "productosCodigoLanzamiento",
      key: "productosCodigoLanzamiento",
      render: (codigo: string) => codigo || "-",
    },
    {
      title: "Código de Módulo",
      dataIndex: "codigo",
      key: "codigo",
      render: (codigo: string, record: IModulo) => {
        // Intentar múltiples campos posibles
        const codigoFinal = 
          record.codigo || 
          record.moduloCodigo || 
          (record as any).codigoModulo || 
          "-";
        return codigoFinal;
      },
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
      title: "Fecha de inicio",
      dataIndex: "fechaInicio",
      key: "fechaInicio",
      render: (fecha: string, record: IModulo) => {
        // Intentar múltiples campos posibles
        const fechaFinal = 
          fecha || 
          (record as any).fechaInicioModulo || 
          (record as any).inicio;
        
        if (!fechaFinal) return "-";
        
        // Validar si es una fecha válida
        const fechaMoment = moment(fechaFinal);
        return fechaMoment.isValid() 
          ? fechaMoment.format("DD/MM/YYYY") 
          : "-";
      },
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

          <Button type="primary" className={estilos.btnNuevo} onClick={abrirModalCrear}>
            Nuevo módulo
          </Button>
        </div>

        <div className={estilos.toolbar}>
          <Select
            allowClear
            placeholder="Filtro por producto relacionado"
            style={{ width: 260 }}
            className={estilos.filterSelect}
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
            className={estilos.filterSelect}
            onChange={(dates) =>
              setDateRange(dates as [Moment | null, Moment | null] | null)
            }
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
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} de ${total} módulos`,
            }}
            onChange={handleTableChange}
            locale={{
              emptyText: "No se encontraron módulos",
            }}
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