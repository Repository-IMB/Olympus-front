import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Select,
  DatePicker,
  Tooltip
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
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

const { Option } = Select;
const { RangePicker } = DatePicker;

interface Modulo {
  id: number;
  modulo: string;
  codigosProducto: string[];
  diasClase: string[];
  fechaCreacion: string; // DD/MM/YYYY
  activo: boolean;
}

const obtenerNombreCompletoDia = (letra: string): string => {
  const mapeo: Record<string, string> = {
    D: "Domingo",
    L: "Lunes",
    M: "Martes",
    X: "Miércoles",
    J: "Jueves",
    V: "Viernes",
    S: "Sábado",
  };
  return mapeo[letra] || letra;
};

export default function Modulos() {
  const [searchText, setSearchText] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>();
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [moduloEditando, setModuloEditando] = useState<Modulo | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  const navigate = useNavigate();

  // Datos mock
  const modulos: Modulo[] = [
    {
      id: 1,
      modulo: "Introducción a Programación",
      codigosProducto: ["PROG-101"],
      diasClase: ["L", "X"],
      fechaCreacion: "12/03/2024",
      activo: true,
    },
    {
      id: 2,
      modulo: "SQL Avanzado",
      codigosProducto: ["BD-201", "PROG-101"],
      diasClase: ["M", "J"],
      fechaCreacion: "25/04/2024",
      activo: true,
    },
    {
      id: 3,
      modulo: "Marketing Digital Básico",
      codigosProducto: ["MKT-301"],
      diasClase: ["V"],
      fechaCreacion: "10/02/2024",
      activo: false,
    },
  ];

  const modulosFiltrados = useMemo(() => {
    return modulos.filter((m) => {
      const busqueda = searchText.toLowerCase();

      const coincideBusqueda =
        !busqueda ||
        m.modulo.toLowerCase().includes(busqueda) ||
        m.codigosProducto.some((c) => c.toLowerCase().includes(busqueda));

      const coincideProducto =
        !productoSeleccionado ||
        m.codigosProducto.includes(productoSeleccionado);

      const coincideFecha = (() => {
        if (!dateRange) return true;

        const [inicio, fin] = dateRange;
        if (!inicio || !fin) return true;

        const fechaModulo = dayjs(m.fechaCreacion, "DD/MM/YYYY");

        return (
          (fechaModulo.isAfter(inicio.startOf("day")) ||
            fechaModulo.isSame(inicio.startOf("day"))) &&
          (fechaModulo.isBefore(fin.endOf("day")) ||
            fechaModulo.isSame(fin.endOf("day")))
        );
      })();

      return coincideBusqueda && coincideProducto && coincideFecha;
    });
  }, [searchText, productoSeleccionado, dateRange]);

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setModuloEditando(null);
    setModalVisible(true);
  };

  const abrirModalEditar = (modulo: Modulo) => {
    setModoEdicion(true);
    setModuloEditando(modulo);
    setModalVisible(true);
  };

  const handleSubmitModal = (values: any) => {
    if (modoEdicion) {
      console.log("Módulo editado:", values);
      // Aquí iría la lógica para actualizar en el backend
    } else {
      console.log("Módulo creado:", values);
      // Aquí iría la lógica para crear en el backend
    }
    setModalVisible(false);
  };

  const handleCancelModal = () => {
    setModalVisible(false);
    setModuloEditando(null);
    setModoEdicion(false);
  };

  const columnas: ColumnsType<Modulo> = [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Módulo",
      dataIndex: "modulo",
      key: "modulo",
      sorter: (a, b) => a.modulo.localeCompare(b.modulo),
    },
    {
      title: "Código de Producto Relacionado",
      dataIndex: "codigosProducto",
      key: "codigosProducto",
      render: (codigos: string[]) => codigos.join(" - "),
    },
    {
      title: "Días de clase",
      dataIndex: "diasClase",
      key: "diasClase",
      render: (dias: string[]) =>
        dias.map((d) => obtenerNombreCompletoDia(d)).join(" - "),
    },
    {
      title: "Fecha de creación",
      dataIndex: "fechaCreacion",
      key: "fechaCreacion",
    },
    {
      title: "Estado",
      dataIndex: "activo",
      key: "activo",
      render: (activo: boolean) =>
        activo ? (
          <Tag color="green">Activo</Tag>
        ) : (
          <Tag color="red">Inactivo</Tag>
        ),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record: Modulo) => (
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
            <Option value="PROG-101">Programación</Option>
            <Option value="BD-201">Base de datos</Option>
            <Option value="MKT-301">Marketing Digital</Option>
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
        <Table
          columns={columnas}
          dataSource={modulosFiltrados}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
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