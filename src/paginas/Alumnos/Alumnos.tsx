import {
  Table,
  Button,
  Input,
  Space,
  Checkbox,
  Select,
  DatePicker,
  Form,
  Tooltip,
  message,
  Spin,
  Popconfirm
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useCallback, useState, useEffect } from "react";
import moment, { type Moment } from "moment";
import estilos from "./Alumnos.module.css";
import type { ColumnsType } from "antd/es/table";
import {
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { obtenerPaises, type Pais } from "../../config/rutasApi";
import { useNavigate } from "react-router-dom";
import ModalAlumno from "./ModalAlumno";
import { obtenerAlumnosPaginados, eliminarAlumno, type IAlumno } from "../../servicios/AlumnoService";
import { fetchProductOptions } from "../../servicios/ProductoService";
import { obtenerModulos } from "../../servicios/ModuloService";

const { Option } = Select;

// Interfaz local para mantener compatibilidad con el modal
interface AlumnoLocal {
  id: number;
  nombre: string;
  apellido: string;
  pais: string;
  documento: string;
  cargo: string;
  correo: string;
  curso: string;
  modulo: string;
  departamento: string;
  fechaCreacion: string;
  pago: boolean;
  formulario: boolean;
}

// Mapea IAlumno (API) a AlumnoLocal (UI)
const mapAlumnoToLocal = (alumno: IAlumno): AlumnoLocal => {
  const [nombre = "", apellido = ""] = alumno.nombreCompleto.split(" ", 2);
  return {
    id: alumno.idAlumno,
    nombre,
    apellido: apellido || alumno.nombreCompleto.split(" ").slice(1).join(" "),
    pais: alumno.pais,
    documento: alumno.dni,
    cargo: alumno.cargo,
    correo: alumno.correo,
    curso: alumno.productos.join(", ") || "-",
    modulo: alumno.modulos.join(", ") || "-",
    departamento: "-",
    fechaCreacion: moment().format("DD/MM/YYYY"),
    pago: alumno.pagoEstado,
    formulario: alumno.formularioEstado,
  };
};

interface ProductoOption {
  id: number;
  nombre: string;
}

interface ModuloOption {
  id: number;
  nombre: string;
}

export default function Alumnos() {
  const [searchText, setSearchText] = useState("");
  const [productoId, setProductoId] = useState<number | undefined>();
  const [moduloId, setModuloId] = useState<number | undefined>();
  const [paisId, setPaisId] = useState<number | undefined>();
  const [fechaInicio, setFechaInicio] = useState<Moment | null>(null);

  const [form] = Form.useForm();
  const [paises, setPaises] = useState<Pais[]>([]);
  const [loadingPaises, setLoadingPaises] = useState(true);
  const [paisSeleccionado, setPaisSeleccionado] = useState<Pais | null>(null);
  const [indicativo, setIndicativo] = useState<string>("");
  const navigate = useNavigate();
  const [alumnoEditando, setAlumnoEditando] = useState<AlumnoLocal | null>(null);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [modalCrearVisible, setModalCrearVisible] = useState(false);

  // API data state
  const [alumnos, setAlumnos] = useState<AlumnoLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter options
  const [productos, setProductos] = useState<ProductoOption[]>([]);
  const [modulos, setModulos] = useState<ModuloOption[]>([]);

  // Fetch students from API
  const fetchAlumnos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await obtenerAlumnosPaginados({
        page: currentPage,
        pageSize,
        search: searchText,
        idProducto: productoId,
        idModulo: moduloId,
        idPais: paisId,
        fechaInicio: fechaInicio ? fechaInicio.toISOString() : null,
      });

      if (response.codigo === "SIN ERROR") {
        const alumnosLocales = response.alumnos.map(mapAlumnoToLocal);
        setAlumnos(alumnosLocales);
        setTotalRegistros(response.totalRegistros);
      } else {
        message.error(response.mensaje || "Error al cargar alumnos");
      }
    } catch (error) {
      console.error("Error fetching alumnos:", error);
      message.error("Error al cargar alumnos");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, productoId, moduloId, paisId, fechaInicio]);

  // Load students when filters change
  useEffect(() => {
    fetchAlumnos();
  }, [fetchAlumnos]);

  // Load countries
  useEffect(() => {
    const cargarPaises = async () => {
      try {
        setLoadingPaises(true);
        const paisesData = await obtenerPaises();
        const paisesActivos = paisesData.filter(p => p.estado);
        setPaises(paisesActivos);

        const peru = paisesActivos.find(p => p.nombre === "Perú");
        if (peru) {
          setPaisSeleccionado(peru);
          setIndicativo(`+${peru.prefijoCelularPais}`);
          form.setFieldsValue({
            pais: peru.nombre,
            ind: `+${peru.prefijoCelularPais}`,
          });
        }
      } catch (error) {
        console.error(error);
        message.error("Error al cargar países");
      } finally {
        setLoadingPaises(false);
      }
    };

    cargarPaises();
  }, [form]);

  // Load products for filter
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const response = await fetchProductOptions();
        const productosData = response?.productos || [];
        setProductos(productosData.map((p) => ({ id: p.idProducto, nombre: p.nombre })));
      } catch (error) {
        console.error("Error al cargar productos:", error);
      }
    };
    cargarProductos();
  }, []);

  // Load modules for filter
  useEffect(() => {
    const cargarModulos = async () => {
      try {
        const response = await obtenerModulos();
        const modulosData = response?.modulos || [];
        setModulos(modulosData.map((m: any) => ({ id: m.id, nombre: m.nombre || m.codigo })));
      } catch (error) {
        console.error("Error al cargar módulos:", error);
      }
    };
    cargarModulos();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const handleDelete = async (id: number) => {
    try {
      await eliminarAlumno(id);
      message.success("Alumno eliminado correctamente");
      fetchAlumnos(); // Refresh the list
    } catch (error) {
      console.error("Error al eliminar alumno:", error);
      message.error("Error al eliminar el alumno");
    }
  };

  const columnas: ColumnsType<AlumnoLocal> = [
    {
      title: "Nombre y Apellido",
      render: (_, a) => `${a.nombre} ${a.apellido}`,
    },
    { title: "País", dataIndex: "pais" },
    { title: "Documento", dataIndex: "documento" },
    { title: "Cargo", dataIndex: "cargo" },
    { title: "Correo", dataIndex: "correo" },
    { title: "Curso", dataIndex: "curso" },
    {
      title: "Pago",
      render: (_, a) => (
        <Checkbox checked={a.pago} disabled />
      ),
    },
    {
      title: "Formulario",
      render: (_, a) => (
        <Checkbox checked={a.formulario} disabled />
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, alumno) => (
        <Space size="middle">
          <Tooltip title="Editar">
            <span className={estilos.actionIcon}
              onClick={() => {
                setAlumnoEditando(alumno);
                setModalEditarVisible(true);
              }}>
              <EditOutlined />
            </span>
          </Tooltip>

          <Tooltip title="Ver detalle">
            <span className={estilos.actionIcon}
              onClick={() => navigate(`/producto/alumnos/detalle/${alumno.id}`)}>
              <EyeOutlined />
            </span>
          </Tooltip>

          <Popconfirm
            title={`¿Estás seguro de eliminar a ${alumno.nombre} ${alumno.apellido}?`}
            onConfirm={() => handleDelete(alumno.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Eliminar">
              <span className={estilos.actionIcon}>
                <DeleteOutlined />
              </span>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={estilos.container}>
      <div className={estilos.contentWrapper}>
        <div className={estilos.header}>
          <h1 className={estilos.title}>Alumnos</h1>
        </div>

        <div className={estilos.toolbar}>
          <div className={estilos.searchBar}>
            <Input
              placeholder="Buscar por nombre, DNI o correo"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className={estilos.actions}>
            <Button
              type="primary"
              onClick={() => setModalCrearVisible(true)}
              style={{ backgroundColor: "#1f1f1f", borderColor: "#1f1f1f" }}
            >
              Nuevo alumno
            </Button>

          </div>
        </div>

        <div className={`${estilos.toolbar} ${estilos.filtersRow}`}>
          <Select
            allowClear
            placeholder="Producto"
            style={{ minWidth: 150 }}
            onChange={(value) => {
              setProductoId(value);
              setCurrentPage(1);
            }}
            loading={productos.length === 0}
          >
            {productos.map(p => (
              <Option key={p.id} value={p.id}>{p.nombre}</Option>
            ))}
          </Select>

          <Select
            allowClear
            placeholder="Módulo"
            style={{ minWidth: 150 }}
            onChange={(value) => {
              setModuloId(value);
              setCurrentPage(1);
            }}
            loading={modulos.length === 0}
          >
            {modulos.map(m => (
              <Option key={m.id} value={m.id}>{m.nombre}</Option>
            ))}
          </Select>

          <Select
            allowClear
            placeholder="País"
            style={{ minWidth: 150 }}
            onChange={(value) => {
              setPaisId(value);
              setCurrentPage(1);
            }}
            loading={loadingPaises}
          >
            {paises.map(p => (
              <Option key={p.id} value={p.id}>{p.nombre}</Option>
            ))}
          </Select>

          <DatePicker
            value={fechaInicio}
            onChange={(date) => {
              setFechaInicio(date);
              setCurrentPage(1);
            }}
            format="DD/MM/YYYY"
            placeholder="Fecha inicio"
          />
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columnas}
            dataSource={alumnos}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalRegistros,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} alumnos`,
            }}
            onChange={handleTableChange}
          />
        </Spin>
      </div>
      <ModalAlumno
        open={modalCrearVisible}
        onCancel={() => setModalCrearVisible(false)}
        modo="crear"
        onSave={(nuevoAlumno) => {
          // After creating, refetch from API
          fetchAlumnos();
          setModalCrearVisible(false);
        }}
      />
      <ModalAlumno
        open={modalEditarVisible}
        alumno={alumnoEditando}
        modo="editar"
        onCancel={() => {
          setModalEditarVisible(false);
          setAlumnoEditando(null);
        }}
        onSave={(alumnoEditado) => {
          // After editing, refetch from API
          fetchAlumnos();
          setModalEditarVisible(false);
          setAlumnoEditando(null);
        }}
      />
    </div>
  );
}
