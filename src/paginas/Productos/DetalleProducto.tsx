import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Space,
  Tag,
  Table,
  Calendar,
  Tooltip,
  Select,
  Modal,
  message,
  Spin,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  CalendarOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from 'dayjs';
import styles from "./DetalleProducto.module.css";
import { obtenerProductoPorId, obtenerTiposEstadoProducto, actualizarProducto } from "../../servicios/ProductoService";
import type { Producto, TipoEstadoProducto } from "../../interfaces/IProducto";
import { obtenerDepartamentos } from "../../servicios/DepartamentosService";
import ModalProducto from "./ModalProducto";

/* =========================
   TIPOS
   ========================= */
interface Modulo {
  id: number;
  orden: number;
  nombre: string;
  codigo: string;
  docente: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  sesion: string;
  horasSincronicas: number;
  horasAsincronicas: number;
  diasClase: string[];
}

const modulos = [
  {
    id: 1,
    orden: 1,
    nombre: "Auditor Laborales Del Presente",
    codigo: "IMP02052G1",
    docente: "María González",
    fechaInicio: "05/06/2025",
    fechaFin: "12/06/2025",
    estado: "Activo",
    // Datos adicionales para la vista de calendario
    sesion: "Sesión 1",
    horasSincronicas: 8,
    horasAsincronicas: 4,
    diasClase: ["Lunes", "Miércoles", "Viernes"], // Días de la semana que hay clase
  },
  {
    id: 2,
    orden: 2,
    nombre: "PET Contabilidad Financiera - Setiembre G1",
    codigo: "IMP02053G1",
    docente: "Carlos Rodríguez",
    fechaInicio: "02/07/2025",
    fechaFin: "09/07/2025",
    estado: "Activo",
    sesion: "Sesión 2",
    horasSincronicas: 10,
    horasAsincronicas: 5,
    diasClase: ["Martes", "Jueves"],
  },
  {
    id: 3,
    orden: 3,
    nombre: "CEP Actualización G - CAV",
    codigo: "IMP02054G1",
    docente: "Ana Martínez",
    fechaInicio: "20/06/2025",
    fechaFin: "27/06/2025",
    estado: "Inactivo",
    sesion: "Sesión 3",
    horasSincronicas: 6,
    horasAsincronicas: 3,
    diasClase: ["Lunes", "Miércoles"],
  },
];

const coloresModulos = [
  '#1890ff', // azul
  '#52c41a', // verde
  '#faad14', // amarillo
  '#f5222d', // rojo
  '#722ed1', // violeta
];


export default function DetalleProducto() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [departamentos, setDepartamentos] = useState<{ id: number; nombre: string }[]>([]);
  const [tiposEstadoProducto, setTiposEstadoProducto] = useState<TipoEstadoProducto[]>([]);
  const [moduloSeleccionado, setModuloSeleccionado] = useState<Modulo | null>(null);
  const [modalAsignarVisible, setModalAsignarVisible] = useState(false);
  const [moduloBuscado, setModuloBuscado] = useState<string>("");
  const [modalEditarVisible, setModalEditarVisible] = useState(false);

  /* =========================
     CARGAR PRODUCTO POR ID
  ========================= */
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        // Cargar departamentos
        const deptData = await obtenerDepartamentos();
        const deptFormateados = deptData.map((d: any) => ({ id: d.id, nombre: d.nombre }));
        setDepartamentos(deptFormateados);
        
        // Cargar tipos de estado
        const tiposData = await obtenerTiposEstadoProducto();
        setTiposEstadoProducto(tiposData);
        
        // Cargar producto
        if (id) {
          const productoData = await obtenerProductoPorId(Number(id));
          setProducto(productoData);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        message.error("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id]);



  // Mock de módulos disponibles para asignar (esto vendría del backend)
  const modulosDisponibles = [
    { id: 101, nombre: "Gestión de Proyectos Avanzada", codigo: "GPA2025" },
    { id: 102, nombre: "Marketing Digital Estratégico", codigo: "MDE2025" },
    { id: 103, nombre: "Finanzas Corporativas", codigo: "FNC2025" },
    { id: 104, nombre: "Recursos Humanos y Talento", codigo: "RHT2025" },
  ];

  const handleAsignarModulo = () => {
    // Aquí iría la lógica para asignar el módulo seleccionado
    console.log("Asignando módulo:", moduloBuscado);
    setModalAsignarVisible(false);
    setModuloBuscado("");
  };

  const handleEditarProducto = () => {
    setModalEditarVisible(true);
  };

  const handleGuardarProducto = async (productoData: Partial<Producto>) => {
    try {
      if (producto?.id) {
        await actualizarProducto(producto.id, productoData, producto);
        message.success("Producto actualizado exitosamente");
        // Recargar el producto
        const productoActualizado = await obtenerProductoPorId(producto.id);
        setProducto(productoActualizado);
      }
      setModalEditarVisible(false);
    } catch (error) {
      const mensajeError = (error as any)?.response?.data?.message || "Error al actualizar el producto";
      message.error(mensajeError);
      console.error(error);
    }
  };

  const handleCancelarModal = () => {
    setModalEditarVisible(false);
  };

  // Función para obtener los días que hay clase
  const obtenerDiasConClase = (modulo: Modulo) => {
    if (!modulo) return [];
    
    const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const fechaInicio = dayjs(modulo.fechaInicio, "DD/MM/YYYY");
    const fechaFin = dayjs(modulo.fechaFin, "DD/MM/YYYY");
    const diasConClase: string[] = [];
    
    let fechaActual = fechaInicio;
    while (fechaActual.isBefore(fechaFin) || fechaActual.isSame(fechaFin, 'day')) {
      const diaSemana = diasSemana[fechaActual.day()];
      if (modulo.diasClase.includes(diaSemana)) {
        diasConClase.push(fechaActual.format("YYYY-MM-DD"));
      }
      fechaActual = fechaActual.add(1, 'day');
    }
    
    return diasConClase;
  };

  // Columnas para la tabla de módulos
  const columns = [
    {
      title: 'Orden',
      dataIndex: 'orden',
      key: 'orden',
      width: 80,
      sorter: (a: Modulo, b: Modulo) => a.orden - b.orden,
    },
    {
      title: 'Nombre del módulo',
      dataIndex: 'nombre',
      key: 'nombre',
      sorter: (a: Modulo, b: Modulo) => a.nombre.localeCompare(b.nombre),
    },
    {
      title: 'Código del módulo',
      dataIndex: 'codigo',
      key: 'codigo',
      sorter: (a: Modulo, b: Modulo) => a.codigo.localeCompare(b.codigo),
    },
    {
      title: 'Docente',
      dataIndex: 'docente',
      key: 'docente',
      sorter: (a: Modulo, b: Modulo) => a.docente.localeCompare(b.docente),
    },
    {
      title: 'Fecha de Inicio',
      dataIndex: 'fechaInicio',
      key: 'fechaInicio',
      sorter: (a: Modulo, b: Modulo) => {
        const dateA = a.fechaInicio.split('/').reverse().join('');
        const dateB = b.fechaInicio.split('/').reverse().join('');
        return dateA.localeCompare(dateB);
      },
    },
    {
      title: 'Fecha de Fin',
      dataIndex: 'fechaFin',
      key: 'fechaFin',
      sorter: (a: Modulo, b: Modulo) => {
        const dateA = a.fechaFin.split('/').reverse().join('');
        const dateB = b.fechaFin.split('/').reverse().join('');
        return dateA.localeCompare(dateB);
      },
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      sorter: (a: Modulo, b: Modulo) => a.estado.localeCompare(b.estado),
      render: (estado: string) => (
        <Tag color={estado === 'Activo' ? 'green' : 'red'}>{estado}</Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 100,
      align: 'center' as const,
      render: (_: unknown, record: Modulo) => (
        <Tooltip title="Ver Detalle">
          <Button 
            type="primary"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation(); // MUY IMPORTANTE
              navigate(`/producto/modulos/detalle/${record.id}`);
            }}
            style={{ 
              backgroundColor: '#1f1f1f',
              borderColor: '#1f1f1f'
            }}
          />
        </Tooltip>
      ),
    },
  ];

  // const diasConClase = moduloSeleccionado ? obtenerDiasConClase(moduloSeleccionado) : [];

  const diasClasesPorFecha: Record<
    string,
    { moduloId: number; nombre: string; color: string }[]
  > = {};

  modulos.forEach((modulo, index) => {
    const color = coloresModulos[index % coloresModulos.length];
    const dias = obtenerDiasConClase(modulo);

    dias.forEach((fecha) => {
      if (!diasClasesPorFecha[fecha]) {
        diasClasesPorFecha[fecha] = [];
      }

      diasClasesPorFecha[fecha].push({
        moduloId: modulo.id,
        nombre: modulo.nombre,
        color,
      });
    });
  });


  return (
    <div className={styles.container}>
      {/* =========================
          HEADER / VOLVER
         ========================= */}
      <Button
        icon={<ArrowLeftOutlined />}
        style={{ marginBottom: 16 }}
        onClick={() => navigate(-1)}
      >
        Volver
      </Button>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" />
        </div>
      ) : producto ? (
        <>
          {/* =========================
              DETALLE DEL PRODUCTO
             ========================= */}
          <Card className={styles.productCard} style={{ marginBottom: 16 }}>
            <h3 className={styles.title}>{producto.nombre}</h3>

            <div className={styles.infoList}>
              <Item label="Departamento" value={producto.departamentoNombre || "-"} />
              <Item label="Código del producto" value={producto.codigoLanzamiento} />
              <Item label="Descripción" value={producto.datosImportantes || "-"} />
              <Item
                label="Costo base del producto"
                value={`USD ${producto.costoBase}`}
              />
              <Item label="Modalidad" value={producto.modalidad || "-"} />
              <Item
                label="Estado"
                value={<Tag color={producto.estado ? "green" : "red"}>{producto.estadoProductoTipoNombre || (producto.estado ? "Activo" : "Inactivo")}</Tag>}
              />
              <Item label="Link de brochure" value={producto.brochure || "-"} />
              <Item label="Link de Excel" value={producto.linkExcel || "-"} />
              <Item label="Link página web" value={producto.linkPagWeb || "-"} />
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
                onClick={handleEditarProducto}
              >
                Editar
              </Button>
              <Button 
                icon={<CalendarOutlined />}
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
                Ver calendario
              </Button>
            </div>
          </Card>

      {/* =========================
          TABLA DE MÓDULOS
         ========================= */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16 
        }}>
          <h4 className={styles.title} style={{ margin: 0 }}>
            Módulos del producto
          </h4>
          <Button 
            type="primary"
            style={{ 
              backgroundColor: '#1f1f1f',
              borderColor: '#1f1f1f',
              color: 'white'
            }}
            onClick={() => setModalAsignarVisible(true)}
          >
            Asignar nuevo módulo al producto
          </Button>
        </div>

        <Table
          dataSource={modulos}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
          onRow={(record) => ({
            onClick: () => setModuloSeleccionado(record),
            style: { cursor: 'pointer' },
          })}
          rowClassName={(record) =>
            moduloSeleccionado?.id === record.id ? styles.selectedRow : ''
          }
        />
      </Card>

      {/* =========================
          VISTA CALENDARIO
         ========================= */}
      <Card>
        <h4 className={styles.title}>Vista calendario de módulos del producto</h4>

        {/* =========================
            INFO DEL MODULO (OPCIONAL)
          ========================= */}
        {moduloSeleccionado && (
          <div style={{ 
            backgroundColor: '#f5f5f5', 
            padding: 16, 
            borderRadius: 4,
            marginBottom: 16,
            fontSize: 13
          }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#8c8c8c' }}>Nombre del Módulo:</span>{" "}
              <span style={{ color: '#262626', fontWeight: 500 }}>
                {moduloSeleccionado.nombre}
              </span>
            </div>

            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#8c8c8c' }}>Código del módulo:</span>{" "}
              <span style={{ color: '#262626', fontWeight: 500 }}>
                {moduloSeleccionado.codigo}
              </span>
            </div>

            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#8c8c8c' }}>Sesión:</span>{" "}
              <span style={{ color: '#262626', fontWeight: 500 }}>
                {moduloSeleccionado.sesion}
              </span>
            </div>

            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#8c8c8c' }}>Fecha de Presentación:</span>{" "}
              <span style={{ color: '#262626', fontWeight: 500 }}>
                {moduloSeleccionado.fechaInicio}
              </span>
              <span style={{ color: '#8c8c8c', marginLeft: 24 }}>Fecha Final:</span>{" "}
              <span style={{ color: '#262626', fontWeight: 500 }}>
                {moduloSeleccionado.fechaFin}
              </span>
            </div>

            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#8c8c8c' }}>Horas sincrónicas:</span>{" "}
              <span style={{ color: '#262626', fontWeight: 500 }}>
                {moduloSeleccionado.horasSincronicas}
              </span>
              <span style={{ color: '#8c8c8c', marginLeft: 24 }}>Horas asincrónicas:</span>{" "}
              <span style={{ color: '#262626', fontWeight: 500 }}>
                {moduloSeleccionado.horasAsincronicas}
              </span>
            </div>

            <div>
              <span style={{ color: '#8c8c8c' }}>Días de clase:</span>{" "}
              <span style={{ color: '#262626', fontWeight: 500 }}>
                {moduloSeleccionado.diasClase.join(", ")}
              </span>
            </div>
          </div>
        )}

        {!moduloSeleccionado && (
          <div style={{ 
            marginTop: 16,
            textAlign: 'center',
            color: '#8c8c8c',
            fontSize: 13
          }}>
            Selecciona un módulo para ver su información detallada
          </div>
        )}

        {/* =========================
            CALENDARIO (SIEMPRE)
          ========================= */}
        <Calendar
          dateCellRender={(date) => {
            const dateStr = date.format("YYYY-MM-DD");
            const sesiones = diasClasesPorFecha[dateStr];

            if (!sesiones) return null;

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {sesiones.map((s, idx) => {
                  const modulo = modulos.find(m => m.id === s.moduloId);
                  if (!modulo) return null;

                  return (
                    <div
                      key={idx}
                      style={{
                        background: "#f5f5f5",
                        borderLeft: `4px solid ${s.color}`,
                        padding: "6px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    >
                      {/* Nombre del módulo */}
                      <div style={{ fontWeight: 600 }}>
                        {modulo.nombre}
                      </div>

                      {/* Nombre de la sesión */}
                      <div>
                        {modulo.sesion}
                      </div>

                      {/* Horas */}
                      <div style={{ fontSize: 11, color: "#8c8c8c" }}>
                        {modulo.horasSincronicas} hs sincrónicas
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }}
          headerRender={({ value, onChange }) => {
                const year = value.year();
                const month = value.month();
                const months = [
                  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                ];

                // Generar lista de años (desde 2020 hasta 2030)
                const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

                return (
                  <div style={{ padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>
                      {months[month]} {year}
                    </span>
                    <Space>
                      <Select
                        value={year}
                        onChange={(newYear) => {
                          const newValue = value.clone().year(newYear);
                          onChange(newValue);
                        }}
                        style={{ width: 100 }}
                        size="small"
                      >
                        {years.map(y => (
                          <Select.Option key={y} value={y}>{y}</Select.Option>
                        ))}
                      </Select>
                      <Select
                        value={month}
                        onChange={(newMonth) => {
                          const newValue = value.clone().month(newMonth);
                          onChange(newValue);
                        }}
                        style={{ width: 120 }}
                        size="small"
                      >
                        {months.map((m, idx) => (
                          <Select.Option key={idx} value={idx}>{m}</Select.Option>
                        ))}
                      </Select>
                      <Button 
                        size="small"
                        onClick={() => {
                          const newValue = value.clone().subtract(1, 'month');
                          onChange(newValue);
                        }}
                      >
                        &lt;
                      </Button>
                      <Button 
                        size="small"
                        onClick={() => {
                          const newValue = dayjs();
                          onChange(newValue);
                        }}
                      >
                        Hoy
                      </Button>
                      <Button 
                        size="small"
                        onClick={() => {
                          const newValue = value.clone().add(1, 'month');
                          onChange(newValue);
                        }}
                      >
                        &gt;
                      </Button>
                    </Space>
                  </div>
                );
              }}
        />
      </Card>

      {/* =========================
          MODAL ASIGNAR MÓDULO
         ========================= */}
      <Modal
        title="Asignar módulo al producto"
        open={modalAsignarVisible}
        onCancel={() => {
          setModalAsignarVisible(false);
          setModuloBuscado("");
        }}
        footer={[
          <Button 
            key="asignar" 
            type="primary" 
            block
            onClick={handleAsignarModulo}
            disabled={!moduloBuscado}
          >
            Asignar módulo
          </Button>
        ]}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Módulo <span style={{ color: 'red' }}>*</span>
          </label>
          <Select
            showSearch
            placeholder="Buscar módulo por nombre o código"
            style={{ width: '100%' }}
            value={moduloBuscado || undefined}
            onChange={(value) => setModuloBuscado(value)}
            filterOption={(input, option) => {
              const modulo = modulosDisponibles.find(m => m.codigo === option?.value);
              if (!modulo) return false;
              const searchText = input.toLowerCase();
              return modulo.nombre.toLowerCase().includes(searchText) || 
                     modulo.codigo.toLowerCase().includes(searchText);
            }}
          >
            {modulosDisponibles.map(mod => (
              <Select.Option key={mod.id} value={mod.codigo}>
                {mod.nombre} - {mod.codigo}
              </Select.Option>
            ))}
          </Select>
        </div>
      </Modal>

      {/* =========================
          MODAL EDITAR PRODUCTO
         ========================= */}
      <ModalProducto
        visible={modalEditarVisible}
        modo="editar"
        producto={producto}
        onCancel={handleCancelarModal}
        onSave={handleGuardarProducto}
        departamentos={departamentos}
        tiposEstadoProducto={tiposEstadoProducto}
      />
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
          <p>No se encontró el producto</p>
        </div>
      )}
    </div>
  );
}

/* =========================
   COMPONENTE AUXILIAR
   ========================= */
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