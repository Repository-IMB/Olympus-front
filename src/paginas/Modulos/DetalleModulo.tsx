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
import { 
  obtenerModuloPorId, 
  actualizarModulo, 
  asignarDocenteAModulo, 
  obtenerProductosPorModulo, 
  obtenerSesionesPorModulo,
  type IModulo, 
  type ProductoAsociadoModulo,
  type ISesion
} from "../../servicios/ModuloService";
import { obtenerDocentes, type Docente } from "../../servicios/DocenteService";
import { obtenerProductos, type Producto } from "../../servicios/ProductoService";
import api from "../../servicios/api";

// --- DATOS MOCKEADOS O CONSTANTES ---
const departamentos = [
  { id: 1, nombre: "Ventas" },
  { id: 2, nombre: "Marketing" },
  { id: 3, nombre: "Administración" },
];

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

// --- COMPONENTE PRINCIPAL ---
export default function DetalleModulo() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Estados de datos
  const [modulo, setModulo] = useState<IModulo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAsignacion, setLoadingAsignacion] = useState(false);

  // Estados de listas auxiliares
  const [listaDocentes, setListaDocentes] = useState<Docente[]>([]);
  const [loadingDocentes, setLoadingDocentes] = useState(false);
  const [productosData, setProductosData] = useState<ProductoAsociadoModulo[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [listaProductosDisponibles, setListaProductosDisponibles] = useState<Producto[]>([]);
  const [loadingProductosSelect, setLoadingProductosSelect] = useState(false);
  const [sesionesData, setSessionesData] = useState<ISesion[]>([]);
  const [loadingSesiones, setLoadingSesiones] = useState(false);


  // Estados de Modales
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [modalAsociarProductoVisible, setModalAsociarProductoVisible] = useState(false);
  const [formAsociarProducto] = Form.useForm();
  
  const [modalAsignarDocenteVisible, setModalAsignarDocenteVisible] = useState(false);
  const [formAsignarDocente] = Form.useForm();
  
  const [modalEditarProductoVisible, setModalEditarProductoVisible] = useState(false);
  const [productoEditando, setProductoEditando] = useState<any | null>(null);

  // --- EFECTOS ---

  // 1. Cargar módulo al iniciar
  useEffect(() => {
    if (id) {
      cargarModulo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 2. Si el módulo tiene docente, asegurarnos de tener la lista para mostrar detalles
  useEffect(() => {
    if (modulo?.idDocente && listaDocentes.length === 0) {
       cargarListaDocentes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulo]);

  // --- FUNCIONES DE CARGA ---

  const cargarListaDocentes = async () => {
    try {
      setLoadingDocentes(true);
      const docentesData = await obtenerDocentes();
      setListaDocentes(docentesData);
    } catch (error) {
      console.error("Error cargando docentes", error);
      // No mostramos error al usuario para no interrumpir la experiencia visual si falla algo secundario
    } finally {
      setLoadingDocentes(false);
    }
  };

  const cargarModulo = async () => {
    try {
      setLoading(true); 
      
      const data = await obtenerModuloPorId(Number(id));
      setModulo(data);

      // Cargar productos asociados si el módulo existe
      if (data.id) {
        try {
            setLoadingProductos(true); 
            const prods = await obtenerProductosPorModulo(data.id);
            setProductosData(prods);
        } catch (errorProductos) {
            console.error("Error al cargar productos asociados:", errorProductos);
            message.warning("No se pudieron cargar los productos asociados");
        } finally {
            setLoadingProductos(false);
        }

        // Cargar sesiones asociadas
        try {
            setLoadingSesiones(true);
            const sesiones = await obtenerSesionesPorModulo(data.id);
            setSessionesData(sesiones);
        } catch (errorSesiones) {
            console.error("Error al cargar sesiones:", errorSesiones);
            message.warning("No se pudieron cargar las sesiones del módulo");
        } finally {
            setLoadingSesiones(false);
        }
      }

    } catch (error) {
      message.error("Error al cargar el módulo");
      console.error("Error:", error);
      navigate(-1); 
    } finally {
      setLoading(false); 
    }
  };

  // --- HANDLERS DE MODALES ---

  const abrirModalEditar = () => {
    setModalEditarVisible(true);
  };

  const handleSubmitModalEditar = async (values: any) => {
    try {
      if (modulo) {
        const preserveSessions = values.preserveSessions === true;
        await actualizarModulo(modulo.id!, values, preserveSessions);
        message.success("Módulo actualizado correctamente");
        await cargarModulo(); 
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

  // Después de las otras funciones de handlers (por ejemplo después de asignarDocenteAlModulo)

  const descargarPDFModulo = async () => {
    try {
      if (!modulo?.id) {
        message.error("No se puede generar el PDF sin un módulo válido");
        return;
      }

      message.loading({ content: 'Generando PDF...', key: 'pdf' });

      const response = await api.get(`/api/VTAModVentaModulo/GenerarPDF/${modulo.id}`, {
        responseType: 'blob',
      });

      // Crear un blob con el PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Crear URL temporal
      const url = window.URL.createObjectURL(blob);
      
      // Crear elemento <a> temporal para descarga
      const link = document.createElement('a');
      link.href = url;
      
      // Nombre del archivo
      const fileName = `Modulo_${modulo.codigo || modulo.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.download = fileName;
      
      // Trigger descarga
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success({ content: 'PDF descargado correctamente', key: 'pdf' });
      
    } catch (error: any) {
      console.error('Error al descargar PDF:', error);
      message.error({ 
        content: error?.response?.data?.message || 'Error al generar el PDF del módulo',
        key: 'pdf'
      });
    }
  };

  const abrirModalAsociarProducto = async () => {
    formAsociarProducto.resetFields();
    setModalAsociarProductoVisible(true);

    if (listaProductosDisponibles.length === 0) {
      try {
        setLoadingProductosSelect(true);
        const data = await obtenerProductos("", 1, 1000); 
        if (data && data.productos) {
            setListaProductosDisponibles(data.productos);
        }
      } catch (error) {
        console.error("Error al cargar productos para el select:", error);
        message.error("No se pudieron cargar los productos disponibles");
      } finally {
        setLoadingProductosSelect(false);
      }
    }
  };

  const asignarProductoAlModulo = () => {
    formAsociarProducto
      .validateFields()
      .then(async (values) => {
        try {
            setLoading(true); 
            await api.post('/api/VTAModVentaModulo/VincularModuloAProducto', {
                idProducto: values.productoId,
                idModulo: Number(id)
            });

            message.success("Producto asignado correctamente");
            setModalAsociarProductoVisible(false);
            cargarModulo();

        } catch (error) {
            console.error(error);
            message.error("Error al asignar producto");
        } finally {
            setLoading(false);
        }
      });
  };

  const abrirModalAsignarDocente = async () => {
    formAsignarDocente.resetFields();
    setModalAsignarDocenteVisible(true);
    
    // Si la lista está vacía, cargarla ahora
    if (listaDocentes.length === 0) {
        await cargarListaDocentes();
    }
    
    // Pre-seleccionar valor
    if (modulo?.idDocente) {
        formAsignarDocente.setFieldsValue({ docenteId: modulo.idDocente });
    }
  };

  const asignarDocenteAlModulo = () => {
    formAsignarDocente
      .validateFields()
      .then(async (values) => {
        try {
            const idModulo = modulo?.id;
            if (!idModulo) return;

            setLoadingAsignacion(true); // Bloqueamos solo el botón
            
            const resp = await asignarDocenteAModulo(idModulo, values.docenteId);
            
            // Validación robusta
            const codigoStr = String(resp.codigo).toUpperCase();
            const mensajeStr = String(resp.mensaje || "").toLowerCase();
            
            const esExito = 
                codigoStr === "0" || 
                codigoStr === "SIN_ERROR" || 
                codigoStr === "200" || 
                codigoStr === "OK" ||
                mensajeStr.includes("correctamente");

            if (esExito) {
                message.success("Docente asignado correctamente");
                setModalAsignarDocenteVisible(false);
                
                // 🟢 CORRECCIÓN: Solo recargamos el módulo (silenciosamente)
                // NO borramos la lista de docentes (setListaDocentes([]) <- BORRADO)
                await cargarModulo(); 
                
            } else {
                message.error(resp.mensaje || "Error al asignar");
            }

        } catch (error: any) {
            console.error(error);
            const msgError = error?.response?.data?.mensaje || "";
            if (msgError.toLowerCase().includes("correctamente")) {
                 message.success("Docente asignado correctamente");
                 setModalAsignarDocenteVisible(false);
                 await cargarModulo();
            } else {
                 message.error(msgError || "Error de conexión");
            }
        } finally {
            setLoadingAsignacion(false); // Desbloqueamos botón
        }
      });
  };
  const obtenerColorEstado = (estadoNombre: string | undefined): string => {
    if (!estadoNombre) return "default";
    const estadoLower = estadoNombre.toLowerCase();
    
    if (estadoLower === "en curso") return "blue";
    if (estadoLower === "en venta") return "green";
    if (estadoLower === "finalizado") return "red";
    if (estadoLower === "grupo completo") return "orange";
    if (estadoLower === "piloto") return "purple";
    if (estadoLower === "postergado") return "volcano";
    if (estadoLower === "cancelado") return "default";
    if (estadoLower === "no llamar nuevos") return "magenta";
    
    return "default";
  };

  // --- COLUMNAS DE TABLAS ---

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
      title: 'Estado de producto',
      dataIndex: 'estadoProducto',
      key: 'estadoProducto',
      sorter: (a, b) => a.estadoProducto.localeCompare(b.estadoProducto),
      render: (estadoNombre: string | undefined) => {
        if (!estadoNombre) return <Tag>-</Tag>;
        return <Tag color={obtenerColorEstado(estadoNombre)}>{estadoNombre}</Tag>;
      },
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

  // 🟢 LOGICA DE DATOS DOCENTE (CORREGIDA Y SIN ERRORES)
  // Usamos un tipo genérico para evitar el error de "Unexpected any"
  let datosDocenteTabla: Record<string, any>[] = []; 
  
  if (modulo?.idDocente) {
      // 1. Buscamos al docente en la lista (para tener email, etc.)
      const docenteCompleto = listaDocentes.find(d => d.id === modulo.idDocente);
      
      // Truco: Casteamos a 'any' para que TypeScript no se queje si faltan campos en la interfaz
      const docenteAny = docenteCompleto as any;
      const moduloAny = modulo as any;

      if (docenteCompleto) {
          datosDocenteTabla = [{
              id: docenteCompleto.id,
              nombre: docenteCompleto.nombres,
              apellido: docenteCompleto.apellidos,
              correo: docenteCompleto.correo,
              pais: docenteAny.pais || moduloAny.docentePais || '-',
              
              alias: docenteAny.alias || '-',
              areaTematica: docenteAny.areaTematica || '-',
              estado: 'Asignado'
          }];
      } else {
          // 2. FALLBACK: Usamos puramente los datos del módulo
          datosDocenteTabla = [{
              id: modulo.idDocente,
              nombre: modulo.docenteNombre || 'Cargando...',
              apellido: moduloAny.docenteApellido || '-', 
              correo: '-', 
              pais: moduloAny.docentePais || '-', // <--- Aquí mostramos el país del SP
              alias: '-',
              areaTematica: '-',
              estado: 'Asignado'
          }];
      }
  }

  const columnasDocentes: ColumnsType<any> = [
    {
      title: 'DocenteAsignado',
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
        <Tag color={estado === 'Asignado' ? 'green' : 'red'}>{estado}</Tag>
      ),
    },
  ];

  const columnasSesiones: ColumnsType<any> = [
    {
      title: 'Sesión',
      dataIndex: 'nombreSesion',
      key: 'nombreSesion',
      sorter: (a, b) => a.nombreSesion.localeCompare(b.nombreSesion),
    },
    {
      title: 'Día de la semana',
      dataIndex: 'nombreDiaSemana',
      key: 'nombreDiaSemana',
      sorter: (a, b) => (a.nombreDiaSemana || '').localeCompare(b.nombreDiaSemana || ''),
    },
    {
      title: 'Hora Inicio',
      dataIndex: 'horaInicio',
      key: 'horaInicio',
      render: (horaInicio: string | null | undefined) => horaInicio || '-',
      sorter: (a, b) => (a.horaInicio || '').localeCompare(b.horaInicio || ''),
    },
    {
      title: 'Hora Fin',
      dataIndex: 'horaFin',
      key: 'horaFin',
      render: (horaFin: string | null | undefined) => horaFin || '-',
      sorter: (a, b) => (a.horaFin || '').localeCompare(b.horaFin || ''),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoSesion',
      key: 'tipoSesion',
      render: (tipoSesion: string) => tipoSesion || '-',
      sorter: (a, b) => (a.tipoSesion || '').localeCompare(b.tipoSesion || ''),
    },
    {
      title: 'Modalidad',
      dataIndex: 'esAsincronica',
      key: 'esAsincronica',
      render: (esAsincronica: boolean) => (
        <Tag color={esAsincronica ? 'blue' : 'green'}>
          {esAsincronica ? 'Asincrónica' : 'Sincrónica'}
        </Tag>
      ),
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

  const moduloParaEditar = {
    ...modulo,
    modulo: modulo.nombre,
  };

  // Función para formatear fechas de forma amigable (Ej: Lunes, 25 de octubre de 2025)
const formatearFechaAmigable = (fecha: string | Date | undefined) => {
  if (!fecha) return '-';
  
  const fechaObj = new Date(fecha);
  // Validar que sea una fecha válida
  if (isNaN(fechaObj.getTime())) return '-';

  // Opciones de formato
  const opciones: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'UTC' // Importante para que no reste un día por la zona horaria si viene solo fecha
  };

  const fechaFormateada = new Intl.DateTimeFormat('es-ES', opciones).format(fechaObj);
  
  // Capitalizar la primera letra (Lunes... en vez de lunes...)
  return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
};

  const rawDias = modulo.diasSemana || (modulo as any).diasClase || '';
  
  const diasClaseNombres = rawDias
    ? rawDias.toString().split(',').map((d: string) => obtenerNombreCompletoDia(d.trim())).join(', ')
    : '-';

  // --- RENDERIZADO PRINCIPAL ---
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
          <Item label="Código del módulo" value={modulo.codigo || '-'} />
          <Item label="Título del certificado" value={modulo.tituloCertificado || '-'} />
          <Item label="Descripción" value={modulo.descripcion || '-'} />
          <Item 
            label="Fecha de inicio" 
            value={formatearFechaAmigable(modulo.fechaInicio)} 
          />
          <Item 
             label="Fecha final (estimada)" 
             value={formatearFechaAmigable(modulo.fechaFinPorSesiones || (modulo as any).fechaFin)} 
          />
          <Item label="Horas sincrónicas" value={modulo.horasSincronicas || 0} />
          <Item label="Días de clase" value={diasClaseNombres} />
          <Item 
            label="Código de producto relacionado" 
            value={modulo.productosCodigoLanzamiento || (modulo as any).codigoProducto || '-'} 
          />
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
            onClick={descargarPDFModulo}
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
            Productos asociados al módulo ({productosData.length})
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
          dataSource={productosData}
          columns={columnasProductos}
          rowKey="id"
          pagination={false}
          size="small"
          loading={loadingProductos}
          locale={{ emptyText: "Este módulo no está asociado a ningún producto aún." }}
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
            Docente responsable
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
            {modulo?.idDocente ? "Cambiar docente" : "Asignar docente"}
          </Button>
        </div>

        <Table
          dataSource={datosDocenteTabla}
          columns={columnasDocentes}
          rowKey="id"
          pagination={false}
          size="small"
          loading={loadingDocentes}
          locale={{ emptyText: "No hay docente asignado a este módulo" }}
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
            Cronograma de sesiones ({sesionesData.length})
          </h4>
          <Space>
            <Button
              type="primary"
              style={{
                backgroundColor: '#1f1f1f',
                borderColor: '#1f1f1f',
                color: 'white'
              }}
              onClick={descargarPDFModulo}
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
          dataSource={sesionesData}
          columns={columnasSesiones}
          rowKey="id"
          pagination={false}
          size="small"
          loading={loadingSesiones}
          locale={{ emptyText: "Este módulo no tiene sesiones programadas aún." }}
        />
      </Card>

      {/* --- MODALES --- */}

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
              placeholder="Busque y seleccione un producto"
              showSearch
              loading={loadingProductosSelect}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={listaProductosDisponibles.map(prod => ({
                value: prod.id,
                label: `${prod.nombre} ${prod.codigoLanzamiento ? `(${prod.codigoLanzamiento})` : ''}` 
              }))}
            />
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
              placeholder="Busque y seleccione un docente"
              showSearch
              loading={loadingDocentes}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={listaDocentes.map(doc => ({
                value: doc.id,
                label: `${doc.nombres} ${doc.apellidos} ${doc.tituloProfesional ? `(${doc.tituloProfesional})` : ''}`
              }))}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            style={{
              backgroundColor: "#1677ff",
              borderColor: "#1677ff",
            }}
          >
            Confirmar Asignación
          </Button>
        </Form>
      </Modal>

      {/* MODAL EDITAR PRODUCTO */}
      <ModalEditarProducto
        visible={modalEditarProductoVisible}
        producto={productoEditando}
        departamentos={departamentos}
        tiposEstadoProducto={[]}
        modo="editar"
        onCancel={() => {
          setModalEditarProductoVisible(false);
          setProductoEditando(null);
        }}
        onSave={async (productoEditado) => {
          console.log("Producto editado:", productoEditado);
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