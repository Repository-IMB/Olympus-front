import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Space,
  Tag,
  Table,
  Form,
  Modal,
  Select,
  Tooltip,
  Spin,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  PrinterOutlined,
  StopOutlined
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import styles from "./DetalleModulo.module.css";
import { useState, useEffect } from "react";
import ModalEditarProducto from "../Productos/ModalProducto";
import ModalModulo from "./ModalModulo";
import { obtenerModuloPorId, actualizarModulo, type IModulo } from "../../servicios/ModuloService";

const departamentos = [
  { id: 1, nombre: "Ventas" },
  { id: 2, nombre: "Marketing" },
  { id: 3, nombre: "Administración" },
];

const modalidad = [
  { id: 1, nombre: "Sincrónica" },
  { id: 2, nombre: "Asincrónica" },
  { id: 3, nombre: "Híbrida" },
];

const estados = [
  { id: 1, nombre: "En curso" },
  { id: 2, nombre: "Cancelado" },
  { id: 3, nombre: "Postergado" },
  { id: 4, nombre: "Finalizado" },
  { id: 5, nombre: "No llamar nuevos" },
  { id: 6, nombre: "Piloto" },
  { id: 7, nombre: "En curso" },
  { id: 8, nombre: "Preventa" },
  { id: 9, nombre: "En venta" },
  { id: 10, nombre: "Grupo completo" },
];

// Datos mock temporales para productos, docentes y sesiones
const productosAsociados = [
  {
    id: 1,
    nombre: "Auditoría Financiera",
    codigoEdicion: "IMP02052G1",
    edicionSesion: "Setiembre G1",
    estadoProducto: "Activo",
    idProducto: 1,
    orden: 1,
  },
];

const docentesAsociados = [
  {
    id: 1,
    nombre: "Ana Pérez",
    apellido: "Sánchez",
    correo: "ana.perez@email.com",
    pais: "México",
    alias: "Ana P.",
    areaTematica: "Finanzas",
    estado: "Activo",
  },
];

const sesionesVivo = [
  {
    id: 1,
    evento: "Presentación",
    fecha: "lunes, 27 de octubre",
    horaInicio: "9:00 AM",
    horaFin: "10:30 AM",
    tipo: "Teórica",
  },
];

const obtenerLetraDia = (nombreCompleto: string): string => {
  const mapeo: Record<string, string> = {
    "Domingo": "D",
    "Lunes": "L",
    "Martes": "M",
    "Miércoles": "X",
    "Jueves": "J",
    "Viernes": "V",
    "Sábado": "S",
  };
  return mapeo[nombreCompleto] || nombreCompleto;
};

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

export default function DetalleModulo() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [modulo, setModulo] = useState<IModulo | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [modalAsociarProductoVisible, setModalAsociarProductoVisible] = useState(false);
  const [formAsociarProducto] = Form.useForm();
  const [modalAsignarDocenteVisible, setModalAsignarDocenteVisible] = useState(false);
  const [formAsignarDocente] = Form.useForm();
  const [modalEditarProductoVisible, setModalEditarProductoVisible] = useState(false);
  const [productoEditando, setProductoEditando] = useState<any | null>(null);

  // Cargar datos del módulo
  useEffect(() => {
    if (id) {
      cargarModulo();
    }
  }, [id]);

  const cargarModulo = async () => {
    try {
      setLoading(true);
      const data = await obtenerModuloPorId(Number(id));
      setModulo(data);
    } catch (error) {
      message.error("Error al cargar el módulo");
      console.error("Error:", error);
      navigate(-1); // Volver si hay error
    } finally {
      setLoading(false);
    }
  };

  const abrirModalEditar = () => {
    setModalEditarVisible(true);
  };

  const handleSubmitModalEditar = async (values: any) => {
    try {
      if (modulo) {
        await actualizarModulo(modulo.id!, values, modulo);
        message.success("Módulo actualizado correctamente");
        await cargarModulo(); // Recargar datos
      }
      setModalEditarVisible(false);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Error al actualizar el módulo";
      message.error(errorMsg);
      console.error("Error:", error);
    }
  };

  const handleCancelModalEditar = () => {
    setModalEditarVisible(false);
  };

  const abrirModalAsociarProducto = () => {
    formAsociarProducto.resetFields();
    setModalAsociarProductoVisible(true);
  };

  const asignarProductoAlModulo = () => {
    formAsociarProducto
      .validateFields()
      .then((values) => {
        console.log("Producto asignado al módulo:", values);
        // Acá iría el POST al backend
        setModalAsociarProductoVisible(false);
      });
  };

  const abrirModalAsignarDocente = () => {
    formAsignarDocente.resetFields();
    setModalAsignarDocenteVisible(true);
  };

  const asignarDocenteAlModulo = () => {
    formAsignarDocente
      .validateFields()
      .then((values) => {
        console.log("Docente asignado al módulo:", values);
        // POST / PUT al backend
        setModalAsignarDocenteVisible(false);
      });
  };

  // Columnas para productos asociados
  const columnasProductos: ColumnsType<any> = [
    {
      title: 'Nombre del producto',
      dataIndex: 'nombre',
      key: 'nombre',
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
    },
    {
      title: 'Código del producto',
      dataIndex: 'codigoEdicion',
      key: 'codigoEdicion',
      sorter: (a, b) => a.codigoEdicion.localeCompare(b.codigoEdicion),
    },
    {
      title: 'Orden del módulo en el producto',
      dataIndex: 'orden',
      key: 'orden',
      sorter: (a, b) => a.orden - b.orden,
    },
    {
      title: 'Estado del producto',
      dataIndex: 'estadoProducto',
      key: 'estadoProducto',
      sorter: (a, b) => a.estadoProducto.localeCompare(b.estadoProducto),
      render: (estado: string) => (
        <Tag color={estado === 'Activo' ? 'green' : 'red'}>{estado}</Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver detalle">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                navigate(`/producto/productos/detalle/${record.idProducto}`);
              }}
              style={{
                backgroundColor: '#1f1f1f',
                borderColor: '#1f1f1f',
                color: 'white'
              }}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setProductoEditando(record);
                setModalEditarProductoVisible(true);
              }}
              style={{
                backgroundColor: '#1f1f1f',
                borderColor: '#1f1f1f',
                color: 'white'
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Columnas para docentes asociados
  const columnasDocentes: ColumnsType<any> = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
    },
    {
      title: 'Apellido',
      dataIndex: 'apellido',
      key: 'apellido',
      sorter: (a, b) => a.apellido.localeCompare(b.apellido),
    },
    {
      title: 'Correo',
      dataIndex: 'correo',
      key: 'correo',
      sorter: (a, b) => a.correo.localeCompare(b.correo),
    },
    {
      title: 'País',
      dataIndex: 'pais',
      key: 'pais',
      sorter: (a, b) => a.pais.localeCompare(b.pais),
    },
    {
      title: 'Alias',
      dataIndex: 'alias',
      key: 'alias',
      sorter: (a, b) => a.alias.localeCompare(b.alias),
    },
    {
      title: 'Área temática',
      dataIndex: 'areaTematica',
      key: 'areaTematica',
      sorter: (a, b) => a.areaTematica.localeCompare(b.areaTematica),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      sorter: (a, b) => a.estado.localeCompare(b.estado),
      render: (estado: string) => (
        <Tag color={estado === 'Activo' ? 'green' : 'red'}>{estado}</Tag>
      ),
    },
  ];

  // Columnas para sesiones en vivo
  const columnasSesiones: ColumnsType<any> = [
    {
      title: 'Evento',
      dataIndex: 'evento',
      key: 'evento',
      sorter: (a, b) => a.evento.localeCompare(b.evento),
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      sorter: (a, b) => a.fecha.localeCompare(b.fecha),
    },
    {
      title: 'Hora Inicio',
      dataIndex: 'horaInicio',
      key: 'horaInicio',
      sorter: (a, b) => a.horaInicio.localeCompare(b.horaInicio),
    },
    {
      title: 'Hora Fin',
      dataIndex: 'horaFin',
      key: 'horaFin',
      sorter: (a, b) => a.horaFin.localeCompare(b.horaFin),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      sorter: (a, b) => a.tipo.localeCompare(b.tipo),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'center',
      render: () => (
        <Space size="small">
          <Tooltip title="Ver detalle">
            <Button
              size="small"
              icon={<EyeOutlined />}
              style={{
                backgroundColor: '#1f1f1f',
                borderColor: '#1f1f1f',
                color: 'white'
              }}
            />
          </Tooltip>
          <Tooltip title="Cancelar">
            <Button
              size="small"
              icon={<StopOutlined />}
              style={{
                backgroundColor: '#1f1f1f',
                borderColor: '#1f1f1f',
                color: 'white'
              }}
            />
          </Tooltip>
          <Tooltip title="Eliminar">
            <Button
              size="small"
              icon={<DeleteOutlined />}
              style={{
                backgroundColor: '#1f1f1f',
                borderColor: '#1f1f1f',
                color: 'white'
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!modulo) {
    return (
      <div className={styles.container}>
        <Button
          icon={<ArrowLeftOutlined />}
          style={{ marginBottom: 16 }}
          onClick={() => navigate(-1)}
        >
          Volver
        </Button>
        <Card>
          <p>No se encontró el módulo</p>
        </Card>
      </div>
    );
  }

  // Convertir días de semana de números a nombres
  const diasClaseNombres = modulo.diasSemana
    ? modulo.diasSemana.split(',').map(d => obtenerNombreCompletoDia(d.trim())).join(', ')
    : '-';

  // Preparar el módulo para editar
  const moduloParaEditar = {
    ...modulo,
    modulo: modulo.nombre,
    diasClase: modulo.diasSemana ? modulo.diasSemana.split(',').map(d => d.trim()) : []
  };

  return (
    <div className={styles.container}>
      {/* HEADER / VOLVER */}
      <Button
        icon={<ArrowLeftOutlined />}
        style={{ marginBottom: 16 }}
        onClick={() => navigate(-1)}
      >
        Volver
      </Button>

      {/* DETALLE DEL MÓDULO */}
      <Card className={styles.productCard} style={{ marginBottom: 16 }}>
        <h3 className={styles.title}>{modulo.nombre}</h3>

        <div className={styles.infoList}>
          <Item label="ID" value={modulo.id} />
          <Item label="Código del módulo" value={modulo.codigoModulo || '-'} />
          <Item label="Título del certificado" value={modulo.tituloCertificado || '-'} />
          <Item label="Descripción" value={modulo.descripcion || '-'} />
          <Item label="Fecha de presentación" value={modulo.fechaPresentacion || '-'} />
          <Item label="Fecha final" value={modulo.fechaFinal || '-'} />
          <Item label="Horas sincrónicas" value={modulo.horasVivo || 0} />
          <Item label="Horas asincrónicas" value={modulo.horasAsincronicas || 0} />
          <Item label="Días de clase" value={diasClaseNombres} />
          <Item label="Código de producto relacionado" value={modulo.productosCodigoLanzamiento || '-'} />
          <Item 
            label="Estado" 
            value={<Tag color={modulo.estado ? 'green' : 'red'}>
              {modulo.estado ? 'Activo' : 'Inactivo'}
            </Tag>} 
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          <Button 
            icon={<EditOutlined />}
            size="large"
            style={{ 
              backgroundColor: '#1f1f1f',
              borderColor: '#1f1f1f',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={abrirModalEditar}
          >
            Editar
          </Button>
          <Button 
            icon={<PrinterOutlined />}
            size="large"
            style={{ 
              backgroundColor: '#1f1f1f',
              borderColor: '#1f1f1f',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Imprimir cronograma de clases
          </Button>
        </div>
      </Card>

      {/* PRODUCTOS ASOCIADOS AL MÓDULO */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16 
        }}>
          <h4 className={styles.title} style={{ margin: 0 }}>
            Productos asociados al módulo ({productosAsociados.length})
          </h4>
          <Button 
            type="primary"
            style={{ 
              backgroundColor: '#1f1f1f',
              borderColor: '#1f1f1f',
              color: 'white'
            }}
            onClick={abrirModalAsociarProducto}
          >
            Asociar nuevo producto al módulo
          </Button>
        </div>

        <Table
          dataSource={productosAsociados}
          columns={columnasProductos}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* DOCENTES ASOCIADOS AL MÓDULO */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16 
        }}>
          <h4 className={styles.title} style={{ margin: 0 }}>
            Docentes asociados al módulo
          </h4>
          <Button 
            type="primary"
            style={{ 
              backgroundColor: '#1f1f1f',
              borderColor: '#1f1f1f',
              color: 'white'
            }}
            onClick={abrirModalAsignarDocente}
          >
            Cambiar docente asignado al módulo
          </Button>
        </div>

        <Table
          dataSource={docentesAsociados}
          columns={columnasDocentes}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* CRONOGRAMA DE SESIONES EN VIVO */}
      <Card>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16 
        }}>
          <h4 className={styles.title} style={{ margin: 0 }}>
            Cronograma de sesiones ({sesionesVivo.length})
          </h4>
          <Space>
            <Button 
              type="primary"
              style={{ 
                backgroundColor: '#1f1f1f',
                borderColor: '#1f1f1f',
                color: 'white'
              }}
            >
              Imprimir cronograma de clases
            </Button>
            <Button 
              style={{ 
                backgroundColor: '#1f1f1f',
                borderColor: '#1f1f1f',
                color: 'white'
              }}
            >
              Nueva sesión
            </Button>
          </Space>
        </div>

        <Table
          dataSource={sesionesVivo}
          columns={columnasSesiones}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* MODAL EDITAR MÓDULO - REUTILIZABLE */}
      <ModalModulo
        visible={modalEditarVisible}
        onCancel={handleCancelModalEditar}
        onSubmit={handleSubmitModalEditar}
        moduloEditar={moduloParaEditar}
        modoEdicion={true}
      />

      {/* MODAL ASOCIAR PRODUCTO */}
      <Modal
        open={modalAsociarProductoVisible}
        title="Asignar producto al módulo"
        onCancel={() => setModalAsociarProductoVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={formAsociarProducto}
          layout="vertical"
          onFinish={asignarProductoAlModulo}
        >
          <Form.Item
            label="Producto"
            name="productoId"
            rules={[{ required: true, message: "Seleccione un producto" }]}
          >
            <Select
              placeholder="Seleccione un producto"
              showSearch
              optionFilterProp="label"
            >
              <Select.Option value={1} label="Auditoría Financiera">
                Auditoría Financiera
              </Select.Option>
              <Select.Option value={2} label="PET Contabilidad Financiera">
                PET Contabilidad Financiera
              </Select.Option>
              <Select.Option value={3} label="PET Auditoría">
                PET Auditoría
              </Select.Option>
            </Select>
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            style={{
              backgroundColor: "#1677ff",
              borderColor: "#1677ff",
            }}
          >
            Asignar módulo
          </Button>
        </Form>
      </Modal>

      {/* MODAL ASIGNAR DOCENTE */}
      <Modal
        open={modalAsignarDocenteVisible}
        title="Asignar Docente al módulo"
        onCancel={() => setModalAsignarDocenteVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={formAsignarDocente}
          layout="vertical"
          onFinish={asignarDocenteAlModulo}
        >
          <Form.Item
            label="Docente"
            name="docenteId"
            rules={[{ required: true, message: "Seleccione un docente" }]}
          >
            <Select
              placeholder="Seleccione un docente"
              showSearch
              optionFilterProp="label"
            >
              <Select.Option value={1} label="Ana Pérez">
                Ana Pérez
              </Select.Option>
              <Select.Option value={2} label="Juan Gómez">
                Juan Gómez
              </Select.Option>
              <Select.Option value={3} label="Brookelyn Price">
                Brookelyn Price
              </Select.Option>
            </Select>
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            style={{
              backgroundColor: "#1677ff",
              borderColor: "#1677ff",
            }}
          >
            Asignar docente
          </Button>
        </Form>
      </Modal>

      {/* MODAL EDITAR PRODUCTO */}
      <ModalEditarProducto
        visible={modalEditarProductoVisible}
        producto={productoEditando}
        departamentos={departamentos}
        modalidades={modalidad}
        estados={estados}
        onCancel={() => {
          setModalEditarProductoVisible(false);
          setProductoEditando(null);
        }}
        onSave={async (productoEditado) => {
          console.log("Producto editado:", productoEditado);
          // await ProductoService.editarProducto(productoEditado);
          setModalEditarProductoVisible(false);
          setProductoEditando(null);
        }}
      />
    </div>
  );
}

/* COMPONENTE AUXILIAR */
function Item({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className={styles.infoItem}>
      <span className={styles.label}>{label}:</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}