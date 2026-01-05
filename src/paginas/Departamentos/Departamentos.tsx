import { Table, Button, Input, Space, Tag, Tooltip, message, Modal } from "antd";
import { SearchOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useMemo, useState, useEffect } from "react";
import estilos from "./Departamentos.module.css";
import type { ColumnsType } from "antd/es/table";
import {
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import ModalDepartamento from "./ModalDepartamento";
import { 
  obtenerDepartamentos, 
  crearDepartamento, 
  actualizarDepartamento,
  eliminarDepartamento,
  obtenerDepartamentoPorId,
  type Departamento 
} from "../../servicios/DepartamentosService";

export default function Departamentos() {
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [modoModal, setModoModal] = useState<'crear' | 'editar'>('crear');
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<Departamento | null>(null);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalEliminarVisible, setModalEliminarVisible] = useState(false);
  const [departamentoAEliminar, setDepartamentoAEliminar] = useState<number | null>(null);

  // Cargar departamentos al montar el componente
  useEffect(() => {
    cargarDepartamentos();
  }, []);

  const cargarDepartamentos = async () => {
    setLoading(true);
    try {
      const data = await obtenerDepartamentos();
      setDepartamentos(data);
    } catch (error: any) {
      message.error('Error al cargar los departamentos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const guardarDepartamento = async (departamento: any) => {
    try {
      if (modoModal === 'crear') {
        await crearDepartamento(departamento);
        message.success('Departamento creado exitosamente');
      } else {
        if (departamentoSeleccionado?.id) {
          // Pasamos el departamento original completo
          await actualizarDepartamento(
            departamentoSeleccionado.id, 
            departamento, 
            departamentoSeleccionado
          );
          message.success('Departamento actualizado exitosamente');
        }
      }
      
      setModalVisible(false);
      setErrorModal(null);
      setDepartamentoSeleccionado(null);
      
      // Recargar lista
      await cargarDepartamentos();
    } catch (error: any) {
      const mensajeError = error?.response?.data?.message ||
        `Ocurrió un error al ${modoModal === 'crear' ? 'crear' : 'editar'} el departamento`;
      setErrorModal(mensajeError);
      message.error(mensajeError);
    }
  };

  const abrirModalCrear = () => {
    setModoModal('crear');
    setDepartamentoSeleccionado(null);
    setErrorModal(null);
    setModalVisible(true);
  };

  const abrirModalEditar = async (departamento: Departamento) => {
    try {
      setModoModal("editar");
      setErrorModal(null);

      const departamentoCompleto = await obtenerDepartamentoPorId(departamento.id);

      setDepartamentoSeleccionado(departamentoCompleto);
      setModalVisible(true);
    } catch {
      message.error("No se pudo cargar el departamento para editar");
    }
  };



  const handleEliminar = (id: number) => {
    setDepartamentoAEliminar(id);
    setModalEliminarVisible(true);
  };

  const confirmarEliminacion = async () => {
    if (!departamentoAEliminar) return;

    try {
      await eliminarDepartamento(departamentoAEliminar);
      message.success("Departamento eliminado correctamente");
      setDepartamentos(prev => prev.filter(d => d.id !== departamentoAEliminar));
      setModalEliminarVisible(false);
      setDepartamentoAEliminar(null);
    } catch (error: any) {
      const mensajeError = error?.response?.data?.message || "Error al eliminar el departamento";
      message.error(mensajeError);
      console.error(error);
    }
  };

  const cancelarEliminacion = () => {
    setModalEliminarVisible(false);
    setDepartamentoAEliminar(null);
  };

  const departamentosFiltrados = useMemo(() => {
    if (!Array.isArray(departamentos)) return [];

    if (!searchText.trim()) return departamentos;

    return departamentos.filter(d =>
      d.nombre.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [departamentos, searchText]);

  const columnas: ColumnsType<Departamento> = [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Departamento",
      dataIndex: "nombre",
      key: "nombre",
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
    },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion",
      sorter: (a, b) => (a.descripcion || "").localeCompare(b.descripcion || ""),
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
      render: (_, record) => (
        <Space size="middle">
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
          <h1 className={estilos.title}>Departamentos</h1>
        </div>

        {/* TOOLBAR */}
        <div className={estilos.toolbar}>
          <div className={estilos.searchBar}>
            <Input
              placeholder="Buscar por nombre de departamento"
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
              Nuevo departamento
            </Button>
          </div>
        </div>

        {/* TABLA */}
        <div className={estilos.tableWrapper}>
          <Table
            columns={columnas}
            dataSource={departamentosFiltrados ?? []}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            loading={loading}
          />
        </div>
      </div>

      {/* MODAL PARA CREAR/EDITAR */}
      <ModalDepartamento
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setErrorModal(null);
          setDepartamentoSeleccionado(null);
        }}
        onSave={guardarDepartamento}
        departamento={departamentoSeleccionado}
        modo={modoModal}
        errorModal={errorModal}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <Modal
        title={
          <span>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
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
        <p>¿Estás seguro de que deseas eliminar este departamento?</p>
        <p style={{ color: '#ff4d4f', marginTop: '8px' }}>
          <strong>Esta acción no se puede deshacer.</strong>
        </p>
      </Modal>
    </div>
  );
}