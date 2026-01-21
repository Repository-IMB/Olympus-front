import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  message,
  Spin,
  Popconfirm,
  Row,
  Col,
  Tooltip,
} from "antd";
import { useEffect, useState, useMemo, useRef } from "react";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { obtenerPaises } from "../../config/rutasApi";
import { getCookie } from "../../utils/cookies";
import { validarAccesoRuta } from "../../componentes/ValidarAccesoRuta";
import { useNavigate } from "react-router-dom";
import estilos from "./Usuarios.module.css";
import type { ColumnsType } from "antd/es/table";

const { Option } = Select;

interface Pais {
  id: number;
  nombre: string;
  prefijoCelularPais: number;
  digitoMinimo: number;
  digitoMaximo: number;
  estado?: boolean;
}

interface Rol {
  id: number;
  nombreRol: string;
  estado: boolean;
}

interface Usuario {
  id: number;
  idPersonal: number;
  nombreUsuario: string;
  nombres: string;
  apellidos: string;
  correo: string;
  idPais: number | null;
  celular: string;
  industria: string | null;
  idAreaTrabajo: number | null;
  areaTrabajo: string | null;
  idRol: number | null;
  rol: string;
  activo: boolean;
}

const INDUSTRIAS = [
  "Tecnología",
  "Minería",
  "Educación",
  "Salud",
  "Construcción",
  "Retail",
  "Servicios",
];
interface AreaTrabajo {
  id: number;
  nombre: string;
  estado: boolean;
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [paises, setPaises] = useState<Pais[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPaises, setLoadingPaises] = useState(false);
  const [paisSeleccionado, setPaisSeleccionado] = useState<Pais | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [filterRol, setFilterRol] = useState<number | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>("Todos");
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [areasTrabajo, setAreasTrabajo] = useState<AreaTrabajo[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const [accesoDenegado, setAccesoDenegado] = useState(false);
  const searchInputRef = useRef<any>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filterRol, filterEstado]);

  // Efecto con debounce para el searchText
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      cargarUsuarios();
    }, 500); // Espera 500ms después de que el usuario deje de escribir

    return () => clearTimeout(delayDebounceFn);
  }, [searchText]);

  // Mantener el foco en el input de búsqueda después de cargar
  useEffect(() => {
    if (!loading && searchText && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [loading]);

  useEffect(() => {
    cargarUsuarios();
  }, [currentPage, pageSize, filterRol, filterEstado]);

  useEffect(() => {
    const acceso = validarAccesoRuta("/usuarios/usuarios", navigate);

    if (!acceso.permitido) {
      setAccesoDenegado(true);
      setLoading(false);
      setLoadingPaises(false);
      message.error(acceso.error);
      return;
    }

    cargarPaises();
    cargarRoles();
    cargarAreasTrabajo();
    cargarUsuarios();
  }, []);

  const cargarPaises = async () => {
    try {
      setLoadingPaises(true);
      const paisesData = await obtenerPaises();
      const paisesActivos = paisesData.filter((p: Pais) => p.estado);
      setPaises(paisesActivos);

      const peru = paisesActivos.find((p) => p.nombre === "Perú");
      if (peru) {
        setPaisSeleccionado(peru);
        form.setFieldsValue({ idPais: peru.id });
      }
    } catch {
      message.error("Error al cargar países");
    } finally {
      setLoadingPaises(false);
    }
  };

  const cargarAreasTrabajo = async () => {
    try {
      setLoadingAreas(true);
      const token = getCookie("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/CFGModUsuarios/ObtenerAreaTrabajo`,
        {
          method: "GET",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        message.error("No se pudieron cargar las áreas de trabajo");
        return;
      }

      const data = await res.json();

      const lista = Array.isArray(data.areaTrabajo)
        ? data.areaTrabajo.filter((a: AreaTrabajo) => a.estado)
        : [];

      setAreasTrabajo(lista);
    } catch (error) {
      console.error(error);
      message.error("Error al cargar áreas de trabajo");
    } finally {
      setLoadingAreas(false);
    }
  };

  const cargarRoles = async () => {
    try {
      const token = getCookie("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/CFGModUsuarios/ListarRoles`,
        {
          method: "GET",
          headers: { accept: "*/*", Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) return message.error("No se pudieron obtener los roles");
      const data = await res.json();
      setRoles(Array.isArray(data.rol) ? data.rol : []);
    } catch {
      message.error("Error al cargar roles");
    }
  };

  const cargarUsuarios = async () => {
    try {
      setLoading(true);

      const token = getCookie("token");

      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      // AGREGAR EL PARÁMETRO DE BÚSQUEDA
      if (searchText && searchText.trim() !== "") {
        params.append("search", searchText.trim());
      }

      if (filterRol !== null) {
        params.append("idRol", filterRol.toString());
      }

      if (filterEstado !== "Todos") {
        params.append("activo", filterEstado === "Activo" ? "true" : "false");
      }

      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/CFGModUsuarios/ListarConUsuario?${params}`,
        {
          method: "GET",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        message.error("No se pudo obtener usuarios");
        return;
      }

      const data = await res.json();

      setUsuarios(
        (data.usuarios || []).map((u: any) => ({
          id: u.idUsuario,
          idPersonal: u.idPersonall,
          nombreUsuario: u.nombreUsuario,
          nombres: u.nombres,
          apellidos: u.apellidos,
          correo: u.correo,
          idPais: u.idPais,
          celular: u.celular,
          industria: "",
          idAreaTrabajo: u.idAreaTrabajo,
          areaTrabajo: u.areaTrabajo,
          idRol: u.idRol,
          rol: u.rol,
          activo: u.activo,
        }))
      );

      setTotal(data.total ?? 0);
    } catch (err) {
      console.error(err);
      message.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const abrirModalNuevo = () => {
    setEditando(null);
    form.resetFields();

    const peru = paises.find((p) => p.nombre === "Perú");
    if (peru) {
      setPaisSeleccionado(peru);
      form.setFieldsValue({ idPais: peru.id });
    }

    setModalVisible(true);
  };

  const abrirModalEditar = (usuario: Usuario) => {
    setEditando(usuario);

    form.setFieldsValue({
      nombreUsuario: usuario.nombreUsuario,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correoUsuario: usuario.correo,
      idRol: usuario.idRol,
      idPais: usuario.idPais,
      celular: usuario.celular,
      industria: usuario.industria,
      idAreaTrabajo: usuario.idAreaTrabajo
        ? Number(usuario.idAreaTrabajo)
        : null,
    });

    setModalVisible(true);
  };

  const guardarUsuario = async () => {
    try {
      const values = await form.validateFields();
      const token = getCookie("token");

      let url = `${
        import.meta.env.VITE_API_URL
      }/api/CFGModUsuarios/RegistrarUsuarioYPersonal`;
      let method: "POST" | "PUT" = "POST";

      if (editando) {
        url = `${
          import.meta.env.VITE_API_URL
        }/api/CFGModUsuarios/EditarUsuarioYPersonal/${editando.id}`;
        method = "PUT";
      }

      // Si password está vacío en edición, no enviarlo
      if (editando && !values.password) delete values.password;

      const res = await fetch(url, {
        method,
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (data.codigo !== "SIN ERROR") {
        setErrorModal(data.mensaje || "Error al registrar/editar usuario");
        return;
      }

      message.success(
        editando
          ? "Usuario editado correctamente"
          : "Usuario registrado correctamente"
      );

      setModalVisible(false);
      setErrorModal(null);
      form.resetFields();
      await cargarUsuarios();
    } catch (err) {
      console.error(err);
      setErrorModal("Error inesperado al guardar usuario");
    }
  };

  const eliminarUsuario = async (idUsuario: number) => {
    try {
      setLoading(true);
      const token = getCookie("token");
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/CFGModUsuarios/EliminarUsuarioYPersonal/${idUsuario}`,
        {
          method: "DELETE",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (data.codigo !== "SIN ERROR") {
        message.error(data.mensaje || "Error al eliminar usuario");
        return;
      }

      message.success("Usuario eliminado correctamente");

      await cargarUsuarios();
    } catch (err) {
      console.error(err);
      message.error("Error al eliminar usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiarFiltros = () => {
    setSearchText("");
    setFilterRol(null);
    setFilterEstado("Todos");
  };

  const columnas: ColumnsType<Usuario> = useMemo(
    () => [
      {
        title: "Nombres",
        dataIndex: "nombres",
        key: "nombres",
        sorter: (a, b) => (a.nombres || "").localeCompare(b.nombres || ""),
      },
      {
        title: "Apellidos",
        dataIndex: "apellidos",
        key: "apellidos",
        sorter: (a, b) => (a.apellidos || "").localeCompare(b.apellidos || ""),
      },
      {
        title: "Correo",
        dataIndex: "correo",
        key: "correo",
        sorter: (a, b) => (a.correo || "").localeCompare(b.correo || ""),
      },
      {
        title: "Rol",
        dataIndex: "rol",
        key: "rol",
        sorter: (a, b) => (a.rol || "").localeCompare(b.rol || ""),
      },
      {
        title: "Estado",
        dataIndex: "activo",
        key: "activo",
        sorter: (a, b) => (a.activo === b.activo ? 0 : a.activo ? 1 : -1),
        render: (a: boolean) =>
          a ? <Tag color="green">Activo</Tag> : <Tag color="red">Inactivo</Tag>,
      },
      {
        title: "Acciones",
        key: "acciones",
        render: (_: any, record: Usuario) => (
          <Space size="middle">
            {/* EDITAR */}
            <Tooltip title="Editar">
              <span
                className={estilos.actionIcon}
                onClick={() => abrirModalEditar(record)}
                style={{ cursor: "pointer" }}
              >
                <EditOutlined />
              </span>
            </Tooltip>

            {/* ELIMINAR */}
            <Popconfirm
              title="¿Está seguro de eliminar este usuario?"
              okText="Sí"
              cancelText="No"
              onConfirm={() => eliminarUsuario(record.id)}
            >
              <Tooltip title="Eliminar">
                <span
                  className={estilos.actionIcon}
                  style={{ cursor: "pointer" }}
                >
                  <DeleteOutlined />
                </span>
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    []
  );

  if (accesoDenegado) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2 style={{ color: "red" }}>
          🚫 No tienes permiso para ver esta sección
        </h2>
        <p>Consulta con un administrador si crees que se trata de un error.</p>
      </div>
    );
  }

  if (loading || loadingPaises) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={estilos.container}>
      <div className={estilos.contentWrapper}>
        <div className={estilos.header}>
          <h1 className={estilos.title}>Usuarios</h1>
        </div>

        {/* Barra de búsqueda y botones - Arriba */}
        <div className={estilos.toolbar}>
          <div className={estilos.searchBar}>
            <Input
              ref={searchInputRef}
              placeholder="Buscar por nombre, apellido, correo o usuario"
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
              onClick={abrirModalNuevo}
            >
              Nuevo usuario
            </Button>
            <Button
              className={estilos.btnLimpiar}
              onClick={handleLimpiarFiltros}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>

        {/* Filtros - Abajo */}
        <div className={estilos.filtersRow}>
          <Select
            value={filterRol}
            onChange={(value) => setFilterRol(value)}
            className={estilos.filterSelect}
            placeholder="Seleccionar rol"
            allowClear
          >
            <Option value={null}>Todos los roles</Option>

            {roles
              .filter((r) => r.estado)
              .map((r) => (
                <Option key={r.id} value={r.id}>
                  {r.nombreRol}
                </Option>
              ))}
          </Select>

          <Select
            value={filterEstado}
            onChange={setFilterEstado}
            className={estilos.filterSelect}
            placeholder="Seleccionar estado"
          >
            <Option value="Todos">Todos los estados</Option>
            <Option value="Activo">Activo</Option>
            <Option value="Inactivo">Inactivo</Option>
          </Select>
        </div>

        <div className={estilos.tableWrapper}>
          <Table
            columns={columnas}
            dataSource={usuarios}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize,
              total,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size ?? 10);
              },
            }}
          />
        </div>
      </div>

      <Modal
        open={modalVisible}
        title={editando ? "Editar usuario" : "Nuevo usuario"}
        onCancel={() => {
          setModalVisible(false);
          setErrorModal(null);
          form.resetFields();
          setPaisSeleccionado(null);
        }}
        width={800}
        style={{ margin: "auto" }}
        footer={[
          <div key="footer" style={{ width: "100%" }}>
            {/* MENSAJE DE ERROR - ARRIBA */}
            {errorModal && (
              <div
                style={{
                  color: "#ff4d4f",
                  marginBottom: 12,
                  textAlign: "left",
                }}
              >
                {errorModal}
              </div>
            )}

            {/* BOTONES - ABAJO */}
            <div style={{ textAlign: "right" }}>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setErrorModal(null);
                }}
                style={{ marginRight: 8 }}
              >
                Cancelar
              </Button>

              <Popconfirm
                title={
                  editando
                    ? "¿Está seguro de editar este usuario?"
                    : "¿Está seguro de crear este usuario?"
                }
                okText="Sí"
                cancelText="No"
                onConfirm={guardarUsuario}
              >
                <Button type="primary">OK</Button>
              </Popconfirm>
            </div>
          </div>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={editando ? 24 : 12}>
              <Form.Item
                label="Nombre de usuario"
                name="nombreUsuario"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            {!editando && (
              <Col span={12}>
                <Form.Item
                  label="Contraseña"
                  name="password"
                  rules={[{ required: true }]}
                >
                  <Input.Password />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Nombres"
                name="nombres"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Apellidos"
                name="apellidos"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Correo"
                name="correoUsuario"
                rules={[
                  { required: true, message: "Ingresa un correo" },
                  { type: "email", message: "Correo inválido" },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Rol" name="idRol" rules={[{ required: true }]}>
                <Select
                  placeholder="Seleccione rol"
                  getPopupContainer={() => document.body}
                  placement="bottomLeft"
                >
                  {roles.map((r) => (
                    <Option key={r.id} value={r.id}>
                      {r.nombreRol}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="País" name="idPais">
                <Select
                  allowClear
                  showSearch
                  placeholder="Seleccione país"
                  loading={loadingPaises}
                  disabled={loadingPaises}
                  virtual={false}
                  autoClearSearchValue={false}
                  getPopupContainer={(trigger) => trigger.parentElement!}
                  filterOption={(input, option) =>
                    (option?.children?.toString() || "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  notFoundContent={
                    loadingPaises ? (
                      <Spin size="small" />
                    ) : (
                      "No hay países disponibles"
                    )
                  }
                >
                  {paises.map((p) => (
                    <Option key={p.id} value={p.id}>
                      {p.nombre} (+{p.prefijoCelularPais})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Celular" name="celular">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Industria" name="industria">
                <Select allowClear placeholder="Seleccione">
                  {INDUSTRIAS.map((x) => (
                    <Option key={x} value={x}>
                      {x}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Área de trabajo"
                name="idAreaTrabajo"
                rules={[
                  { required: true, message: "Seleccione un área de trabajo" },
                ]}
              >
                <Select
                  allowClear
                  placeholder="Seleccione área de trabajo"
                  loading={loadingAreas}
                  disabled={loadingAreas}
                  getPopupContainer={(trigger) => trigger.parentElement!}
                >
                  {areasTrabajo.map((a) => (
                    <Option key={a.id} value={a.id}>
                      {a.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}