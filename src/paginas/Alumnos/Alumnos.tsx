import {
  Table,
  Button,
  Input,
  Space,
  Checkbox,
  Select,
  DatePicker,
  Form,
  Tooltip
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import moment, { type Moment } from "moment";
import estilos from "./Alumnos.module.css";
import type { ColumnsType } from "antd/es/table";
import {
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { obtenerPaises, type Pais } from "../../config/rutasApi";
import { useEffect } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import ModalAlumno from "./ModalAlumno";



const { Option } = Select;
const { RangePicker } = DatePicker;

interface Alumno {
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

export default function Alumnos() {
  const [searchText, setSearchText] = useState("");
  const [curso, setCurso] = useState<string>();
  const [modulo, setModulo] = useState<string>();
  const [departamento, setDepartamento] = useState<string>();
  const [dateRange, setDateRange] = useState<
    [Moment | null, Moment | null] | null
  >(null);

  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [paises, setPaises] = useState<Pais[]>([]);
  const [loadingPaises, setLoadingPaises] = useState(true);
  const [paisSeleccionado, setPaisSeleccionado] = useState<Pais | null>(null);
  const [indicativo, setIndicativo] = useState<string>("");
  const navigate = useNavigate();
  const [alumnoEditando, setAlumnoEditando] = useState<Alumno | null>(null);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [modalCrearVisible, setModalCrearVisible] = useState(false);




  const [alumnos, setAlumnos] = useState<Alumno[]>([
    {
      id: 1,
      nombre: "Juan",
      apellido: "Pérez",
      pais: "Argentina",
      documento: "30123456",
      cargo: "Analista",
      correo: "juan.perez@mail.com",
      curso: "PROG-101",
      modulo: "Introducción",
      departamento: "Sistemas",
      fechaCreacion: "12/03/2024",
      pago: true,
      formulario: true,
    },
    {
      id: 2,
      nombre: "María",
      apellido: "Gómez",
      pais: "Chile",
      documento: "28999888",
      cargo: "Diseñadora",
      correo: "maria.gomez@mail.com",
      curso: "MKT-301",
      modulo: "Marketing Básico",
      departamento: "Marketing",
      fechaCreacion: "20/04/2024",
      pago: false,
      formulario: true,
    },
    {
      id: 3,
      nombre: "Lucas",
      apellido: "Fernández",
      pais: "Uruguay",
      documento: "33444555",
      cargo: "Developer",
      correo: "lucas.f@mail.com",
      curso: "PROG-101",
      modulo: "SQL Avanzado",
      departamento: "Sistemas",
      fechaCreacion: "05/02/2024",
      pago: true,
      formulario: false,
    },
  ]);

  const guardarAlumno = async () => {
    try {
      await form.validateFields();
      form.resetFields();
      setModalVisible(false);
      setErrorModal(null);
    } catch (error: any) {
      if (error?.errorFields) return;
      setErrorModal("Ocurrió un error al crear el alumno");
    }
  };

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

  const alumnosFiltrados = useMemo(() => {
    const busqueda = searchText.toLowerCase();

    return alumnos.filter((a) => {
      const coincideBusqueda =
        !busqueda ||
        a.nombre.toLowerCase().includes(busqueda) ||
        a.apellido.toLowerCase().includes(busqueda) ||
        a.documento.includes(busqueda) ||
        a.correo.toLowerCase().includes(busqueda);

      const coincideCurso = !curso || a.curso === curso;
      const coincideModulo = !modulo || a.modulo === modulo;
      const coincideDepartamento =
        !departamento || a.departamento === departamento;

      const coincideFecha =
        !dateRange ||
        !dateRange[0] ||
        !dateRange[1] ||
        (() => {
          const [inicio, fin] = dateRange;
          const fechaAlumno = moment(a.fechaCreacion, "DD/MM/YYYY");

          return (
            (fechaAlumno.isAfter(inicio.startOf("day")) &&
              fechaAlumno.isBefore(fin.endOf("day"))) ||
            fechaAlumno.isSame(inicio, "day") ||
            fechaAlumno.isSame(fin, "day")
          );
        })();

      return (
        coincideBusqueda &&
        coincideCurso &&
        coincideModulo &&
        coincideDepartamento &&
        coincideFecha
      );
    });
  }, [alumnos, searchText, curso, modulo, departamento, dateRange]);

  const columnas: ColumnsType<Alumno> = [
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

          <Tooltip title="Eliminar">
            <span className={estilos.actionIcon}>
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
            >
              Nuevo alumno
            </Button>

          </div>
        </div>

        <div className={`${estilos.toolbar} ${estilos.filtersRow}`}>
          <Select allowClear placeholder="Curso" onChange={setCurso}>
            <Option value="PROG-101">Programación</Option>
            <Option value="MKT-301">Marketing</Option>
          </Select>

          <Select allowClear placeholder="Módulo" onChange={setModulo}>
            <Option value="Introducción">Introducción</Option>
            <Option value="SQL Avanzado">SQL Avanzado</Option>
          </Select>

          <Select allowClear placeholder="Departamento" onChange={setDepartamento}>
            <Option value="Sistemas">Sistemas</Option>
            <Option value="Marketing">Marketing</Option>
          </Select>

          <RangePicker
            value={dateRange}
            onChange={(dates) =>
              setDateRange(dates as [Moment | null, Moment | null] | null)
            }
            format="DD/MM/YYYY"
            placeholder={["Fecha inicio", "Fecha fin"]}
          />
        </div>

        <Table
          columns={columnas}
          dataSource={alumnosFiltrados}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>
      <ModalAlumno
        open={modalCrearVisible}
        onCancel={() => setModalCrearVisible(false)}
        modo="crear"
        onSave={(nuevoAlumno) => {
          setAlumnos(prev => [
            ...prev,
            {
              id: Date.now(),
              ...nuevoAlumno,
              fechaCreacion: moment().format("DD/MM/YYYY"),
              pago: false,
              formulario: false,
            },
          ]);
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
          setAlumnos(prev =>
            prev.map(a =>
              a.id === alumnoEditado.id ? { ...a, ...alumnoEditado } : a
            )
          );
        }}
      />
    </div>
  );
}
