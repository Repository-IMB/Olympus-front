import { Table, Button, Input, Space, Tag, Form, Tooltip, message, Modal } from "antd";
import { SearchOutlined, ExclamationCircleOutlined } from "@ant-design/icons"; // 🟢 Agregado ExclamationCircleOutlined
import { useMemo, useState, useEffect } from "react";
import estilos from "./Docentes.module.css";
import type { ColumnsType } from "antd/es/table";
import {
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { obtenerPaises, obtenerPersonaPorId, type Pais } from "../../config/rutasApi";
import ModalDocente from "./ModalDocente";
import { 
    obtenerDocentes, 
    obtenerDocentePorId, 
    crearDocente, 
    actualizarDocente, 
    eliminarDocente // 🟢 Asegúrate de que esté importado
} from "../../servicios/DocenteService";
import type { Docente } from "../../interfaces/IDocente";

export default function Docentes() {
  const [searchText, setSearchText] = useState("");
  
  // Estados para Modal Crear/Editar
  const [modalVisible, setModalVisible] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [modoModal, setModoModal] = useState<"crear" | "editar">("crear");
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<any | null>(null);

  // Estados para Modal Eliminar 🟢
  const [modalEliminarVisible, setModalEliminarVisible] = useState(false);
  const [docenteAEliminar, setDocenteAEliminar] = useState<number | null>(null);

  const [form] = Form.useForm();
  const [paises, setPaises] = useState<Pais[]>([]);
  const [loadingPaises, setLoadingPaises] = useState(true);
  const [paisSeleccionado, setPaisSeleccionado] = useState<Pais | null>(null);
  const [indicativo, setIndicativo] = useState<string>("");

  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loadingDocentes, setLoadingDocentes] = useState(false);

  // --- LÓGICA DE GUARDADO (Crear/Editar) ---
  const guardarDocente = async () => {
    try {
      const values = await form.validateFields();

      const docente = {
        idPersona: docenteSeleccionado?.idPersona || 0,
        nombres: values.nombres,
        apellidos: values.apellidos,
        celular: values.telefono,
        correo: values.correo,
        prefijoDocente: values.prefijo || "",
        tituloProfesional: values.tituloProfesional || "",
        especialidad: values.especialidad || "",
        logros: values.logros || "",
        areaTrabajo: values.areaTrabajo || "",
        industria: values.industria || "",
        idPais: paisSeleccionado?.id || 0,
        prefijoPaisCelular: indicativo || "",
        estado: true,
      };

      if (modoModal === "crear") {
        await crearDocente(docente);
        message.success("Docente creado exitosamente");
      } else {
        if (docenteSeleccionado?.id) {
          await actualizarDocente(docenteSeleccionado.id, docente, docenteSeleccionado);
          message.success("Docente actualizado exitosamente");
        }
      }

      // Recargar tabla
      const data = await obtenerDocentes();
      setDocentes(data);

      form.resetFields();
      setModalVisible(false);
      setErrorModal(null);
    } catch (error: any) {
      if (error?.errorFields) return;

      setErrorModal(
        error?.response?.data?.message ||
          error?.message ||
          "Ocurrió un error al guardar el docente"
      );
    }
  };

  // --- LÓGICA DE ELIMINACIÓN (Baja Lógica) 🟢 ---
  const handleEliminar = (id: number) => {
    setDocenteAEliminar(id);
    setModalEliminarVisible(true);
  };

  const confirmarEliminacion = async () => {
    if (!docenteAEliminar) return;

    try {
        await eliminarDocente(docenteAEliminar);
        message.success("Docente eliminado correctamente");
        
        // Recargar tabla
        const data = await obtenerDocentes();
        setDocentes(data);
    } catch (error: any) {
        console.error("Error al eliminar:", error);
        message.error(error.message || "Error al eliminar el docente");
    } finally {
        setModalEliminarVisible(false);
        setDocenteAEliminar(null);
    }
  };

  const cancelarEliminacion = () => {
    setModalEliminarVisible(false);
    setDocenteAEliminar(null);
  };

  // --- EFECTOS Y CARGA DE DATOS ---
  useEffect(() => {
    const cargarPaises = async () => {
      try {
        setLoadingPaises(true);
        const paisesData = await obtenerPaises();
        const paisesActivos = paisesData.filter(p => p.estado);
        setPaises(paisesActivos);

        // País por defecto: Perú
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
        console.error("Error al cargar países:", error);
        message.error("Error al cargar la lista de países");
      } finally {
        setLoadingPaises(false);
      }
    };

    cargarPaises();
  }, [form]);

  const handlePaisChange = (paisNombre: string) => {
    const pais = paises.find(p => p.nombre === paisNombre);
    if (!pais || pais.id === paisSeleccionado?.id) return;

    setPaisSeleccionado(pais);
    setIndicativo(`+${pais.prefijoCelularPais}`);

    form.setFieldsValue({
      ind: `+${pais.prefijoCelularPais}`,
    });
  };

  const docentesFiltrados = useMemo(() => {
    if (!searchText.trim()) return docentes;
    const busqueda = searchText.toLowerCase();
    return docentes.filter(
      (d) =>
        d.nombres.toLowerCase().includes(busqueda) ||
        d.apellidos.toLowerCase().includes(busqueda)
    );
  }, [searchText, docentes]);

  const filterPais = useMemo(
    () => (input: string, option?: any) =>
      (option?.children?.toString() || "")
        .toLowerCase()
        .includes(input.toLowerCase()),
    []
  );

  useEffect(() => {
    const cargarDocentes = async () => {
      try {
        setLoadingDocentes(true);
        const data = await obtenerDocentes();
        setDocentes(data);
      } catch (error) {
        console.error("Error al cargar docentes:", error);
        message.error("Error al cargar docentes");
      } finally {
        setLoadingDocentes(false);
      }
    };

    cargarDocentes();
  }, []);

  const abrirModalCrear = () => {
    setModoModal("crear");
    setDocenteSeleccionado(null);
    setErrorModal(null);
    form.resetFields();

    const peru = paises.find(p => p.nombre === "Perú");
    if (peru) {
      setPaisSeleccionado(peru);
      setIndicativo(`+${peru.prefijoCelularPais}`);
      form.setFieldsValue({
        pais: peru.nombre,
        ind: `+${peru.prefijoCelularPais}`,
      });
    }

    setModalVisible(true);
  };

  const abrirModalEditar = async (docente: Docente) => {
    try {
      setModoModal("editar");
      setErrorModal(null);

      const docenteCompleto = await obtenerDocentePorId(docente.id);
      
      let idPaisReal = docenteCompleto.idPais;
      if (idPaisReal === 0 || idPaisReal === null) {
        try {
          const persona = await obtenerPersonaPorId(docenteCompleto.idPersona);
          idPaisReal = persona.idPais || 0;
        } catch (error) {
          console.error("Error al obtener la persona:", error);
        }
      }

      let pais = paises.find(p => p.id === idPaisReal);
      if (!pais && paises.length > 0) {
        pais = paises[0];
        idPaisReal = pais.id;
      }
      
      if (pais) {
        setPaisSeleccionado(pais);
        setIndicativo(docenteCompleto.prefijoPaisCelular || `+${pais.prefijoCelularPais}`);
      } else {
        setIndicativo(docenteCompleto.prefijoPaisCelular || "");
      }

      docenteCompleto.idPais = idPaisReal;
      setDocenteSeleccionado(docenteCompleto);

      setModalVisible(true);
    } catch (error) {
      message.error("No se pudo cargar los datos del docente");
      console.error(error);
    }
  };

  const columnas: ColumnsType<Docente> = [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Nombre",
      dataIndex: "nombres",
      key: "nombres",
      sorter: (a, b) => a.nombres.localeCompare(b.nombres),
    },
    {
      title: "Apellido",
      dataIndex: "apellidos",
      key: "apellidos",
      sorter: (a, b) => a.apellidos.localeCompare(b.apellidos),
    },
    {
      title: "Correo",
      dataIndex: "correo",
      key: "correo",
      sorter: (a, b) => a.correo.localeCompare(b.correo),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      sorter: (a, b) => (a.estado === b.estado ? 0 : a.estado ? -1 : 1),
      render: (estado: boolean) =>
        estado ? <Tag color="green">Activo</Tag> : <Tag color="red">Inactivo</Tag>,
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, docente) => (
        <Space size="middle">
          <Tooltip title="Editar">
            <span
              className={estilos.actionIcon}
              onClick={() => abrirModalEditar(docente)}
              style={{ cursor: "pointer" }}
            >
              <EditOutlined />
            </span>
          </Tooltip>

          <Tooltip title="Eliminar">
            <span 
                className={estilos.actionIcon}
                onClick={() => handleEliminar(docente.id)} // 🟢 Evento conectado
                style={{ cursor: "pointer" }}
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
          <h1 className={estilos.title}>Docentes</h1>
        </div>

        {/* TOOLBAR */}
        <div className={estilos.toolbar}>
          <div className={estilos.searchBar}>
            <Input
              placeholder="Buscar por nombre o apellido"
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
              Nuevo docente
            </Button>
          </div>
        </div>

        {/* TABLA */}
        <div className={estilos.tableWrapper}>
          <Table
            columns={columnas}
            dataSource={docentesFiltrados}
            rowKey="id"
            loading={loadingDocentes}
            pagination={{ pageSize: 10 }}
          />
        </div>
      </div>

      <ModalDocente
        open={modalVisible}
        modo={modoModal}
        docenteCompleto={docenteSeleccionado}
        form={form}
        paises={paises}
        loadingPaises={loadingPaises}
        paisSeleccionado={paisSeleccionado}
        indicativo={indicativo}
        onPaisChange={handlePaisChange}
        filterPais={filterPais}
        onCancel={() => {
          setModalVisible(false);
          setErrorModal(null);
          form.resetFields();
          setPaisSeleccionado(null);
          setIndicativo("");
        }}
        onSave={guardarDocente}
        errorModal={errorModal}
      />

      {/* 🟢 MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <Modal
        title={<span><ExclamationCircleOutlined style={{ color: "#ff4d4f", marginRight: 8 }} />Confirmar eliminación</span>}
        open={modalEliminarVisible}
        onOk={confirmarEliminacion}
        onCancel={cancelarEliminacion}
        okText="Sí, eliminar"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <p>¿Estás seguro de que deseas eliminar este docente?</p>
        <p style={{ color: "#ff4d4f", marginTop: 8 }}><strong>Esta acción es una baja lógica (el docente pasará a estado Inactivo).</strong></p>
      </Modal>

    </div>
  );
}