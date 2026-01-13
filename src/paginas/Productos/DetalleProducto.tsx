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
import moment, { type Moment } from "moment";
import styles from "./DetalleProducto.module.css";
import { obtenerProductoPorId, obtenerTiposEstadoProducto, actualizarProducto } from "../../servicios/ProductoService";
import type { Producto, TipoEstadoProducto } from "../../interfaces/IProducto";
import { obtenerDepartamentos } from "../../servicios/DepartamentosService";
import ModalProducto from "./ModalProducto";
import { obtenerModulosPorProducto, obtenerModulos } from "../../servicios/ModuloService";
import type { IModulo as Modulo } from "../../interfaces/IModulo";

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
  const [moduloBuscado, setModuloBuscado] = useState<number | null>(null);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [modulosDisponibles, setModulosDisponibles] = useState<any[]>([]);


  /* =========================
     CARGAR PRODUCTO POR ID
  ========================= */
  useEffect(() => {
    console.log("🔵 DetalleProducto - useParams completo:", { id });
    console.log("🔵 DetalleProducto - ID del parámetro:", id);
    console.log("🔵 DetalleProducto - Tipo de ID:", typeof id);
    console.log("🔵 DetalleProducto - ID convertido a número:", Number(id));
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

        // Cargar todos los módulos disponibles
        const todosLosModulos = await obtenerModulos();
        setModulosDisponibles(todosLosModulos);

        // Cargar producto
        if (id) {
          const productoData = await obtenerProductoPorId(Number(id));
          setProducto(productoData);

          const modulosData = await obtenerModulosPorProducto(Number(id));
          setModulos(modulosData);
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

  const handleAsignarModulo = () => {
    // Aquí iría la lógica para asignar el módulo seleccionado
    console.log("Asignando módulo:", moduloBuscado);
    setModalAsignarVisible(false);
    setModuloBuscado(null);
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
    if (!modulo || !modulo.fechaInicio || !modulo.fechaFinPorSesiones) return [];

    const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const fechaInicio = moment(modulo.fechaInicio);
    const fechaFin = moment(modulo.fechaFinPorSesiones);
    const diasConClase: string[] = [];

    let fechaActual = fechaInicio;
    while (fechaActual.isBefore(fechaFin) || fechaActual.isSame(fechaFin, 'day')) {
      const diaSemana = diasSemana[fechaActual.day()];
      if (modulo.diasClase?.includes(diaSemana)) {
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
      sorter: (a: Modulo, b: Modulo) => (a.orden || 0) - (b.orden || 0),
    },
    {
      title: 'Nombre del módulo',
      dataIndex: 'moduloNombre',
      key: 'moduloNombre',
      sorter: (a: Modulo, b: Modulo) => (a.moduloNombre || '').localeCompare(b.moduloNombre || ''),
      render: (text: string) => text || '-'
    },
    {
      title: 'Código del módulo',
      dataIndex: 'moduloCodigo',
      key: 'moduloCodigo',
      sorter: (a: Modulo, b: Modulo) => (a.moduloCodigo || '').localeCompare(b.moduloCodigo || ''),
      render: (text: string) => text || '-'
    },
    {
      title: 'Docente',
      dataIndex: 'docenteNombre',
      key: 'docenteNombre',
      sorter: (a: Modulo, b: Modulo) =>
        (a.docenteNombre ?? "").localeCompare(b.docenteNombre ?? ""),
      render: (text: string) => text || '-'
    },
    {
      title: 'Fecha de Inicio',
      dataIndex: 'fechaInicio',
      key: 'fechaInicio',
      sorter: (a: Modulo, b: Modulo) => {
        if (!a.fechaInicio || !b.fechaInicio) return 0;
        const dateA = new Date(a.fechaInicio).getTime();
        const dateB = new Date(b.fechaInicio).getTime();
        return dateA - dateB;
      },
      render: (fecha: string) => fecha ? moment(fecha).format('DD/MM/YYYY') : '-'
    },
    {
      title: 'Fecha de Fin',
      dataIndex: 'fechaFinPorSesiones',
      key: 'fechaFinPorSesiones',
      sorter: (a: Modulo, b: Modulo) => {
        if (!a.fechaFinPorSesiones || !b.fechaFinPorSesiones) return 0;
        const dateA = new Date(a.fechaFinPorSesiones).getTime();
        const dateB = new Date(b.fechaFinPorSesiones).getTime();
        return dateA - dateB;
      },
      render: (fecha: string) => fecha ? moment(fecha).format('DD/MM/YYYY') : '-'
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      sorter: (a: Modulo, b: Modulo) => {
        const estadoA = a.estado ? 'Activo' : 'Inactivo';
        const estadoB = b.estado ? 'Activo' : 'Inactivo';
        return estadoA.localeCompare(estadoB);
      },
      render: (estado: boolean) => (
        <Tag color={estado ? 'green' : 'red'}>{estado ? 'Activo' : 'Inactivo'}</Tag>
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
              e.stopPropagation();
              if (!record.moduloId) return;
              navigate(`/producto/modulos/detalle/${record.moduloId}`);
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

  const diasClasesPorFecha: Record<
    string,
    { moduloId: number; nombre: string; color: string }[]
  > = {};

  modulos.forEach((modulo, index) => {
    if (!modulo.moduloId || typeof modulo.moduloId !== 'number') return;

    const color = coloresModulos[index % coloresModulos.length];
    const dias = obtenerDiasConClase(modulo);

    dias.forEach((fecha) => {
      if (!diasClasesPorFecha[fecha]) {
        diasClasesPorFecha[fecha] = [];
      }

      diasClasesPorFecha[fecha].push({
        moduloId: modulo.moduloId!,
        nombre: modulo.moduloNombre || 'Sin nombre',
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* COLUMNA IZQUIERDA - Información del producto */}
              <div>
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
              </div>

              {/* COLUMNA DERECHA - Estadísticas y Objetivos */}
              <div>
                {/* Estadísticas */}
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Estadísticas</h4>
                  {producto.estadisticas && producto.estadisticas.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {producto.estadisticas.map((stat: any, index: number) => (
                        <div
                          key={index}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#f5f5f5',
                            borderRadius: 4,
                            fontSize: 13
                          }}
                        >
                          {stat.texto || '-'}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#8c8c8c', fontSize: 13 }}>Sin estadísticas</div>
                  )}
                </div>

                {/* Objetivos */}
                <div>
                  <h4 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Objetivos</h4>
                  {producto.objetivos && producto.objetivos.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {producto.objetivos.map((obj: any, index: number) => (
                        <div
                          key={index}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#f5f5f5',
                            borderRadius: 4,
                            fontSize: 13
                          }}
                        >
                          {obj.texto || '-'}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#8c8c8c', fontSize: 13 }}>Sin objetivos</div>
                  )}
                </div>
              </div>
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
              rowKey="estructuraCurricularModuloId"
              pagination={{ pageSize: 10 }}
              size="small"
              onRow={(record) => ({
                onClick: () => setModuloSeleccionado(record),
                style: { cursor: 'pointer' },
              })}
              rowClassName={(record) =>
                moduloSeleccionado?.estructuraCurricularModuloId === record.estructuraCurricularModuloId ? styles.selectedRow : ''
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
                    {moduloSeleccionado.moduloNombre}
                  </span>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#8c8c8c' }}>Código del módulo:</span>{" "}
                  <span style={{ color: '#262626', fontWeight: 500 }}>
                    {moduloSeleccionado.moduloCodigo || '-'}
                  </span>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#8c8c8c' }}>Sesiones:</span>{" "}
                  <span style={{ color: '#262626', fontWeight: 500 }}>
                    {typeof moduloSeleccionado.sesiones === 'number' ? moduloSeleccionado.sesiones : "-"}
                  </span>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#8c8c8c' }}>Fecha de Inicio:</span>{" "}
                  <span style={{ color: '#262626', fontWeight: 500 }}>
                    {moduloSeleccionado.fechaInicio ? moment(moduloSeleccionado.fechaInicio).format('DD/MM/YYYY') : '-'}
                  </span>
                  <span style={{ color: '#8c8c8c', marginLeft: 24 }}>Fecha Final:</span>{" "}
                  <span style={{ color: '#262626', fontWeight: 500 }}>
                    {moduloSeleccionado.fechaFinPorSesiones ? moment(moduloSeleccionado.fechaFinPorSesiones).format('DD/MM/YYYY') : '-'}
                  </span>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#8c8c8c' }}>Duración:</span>{" "}
                  <span style={{ color: '#262626', fontWeight: 500 }}>
                    {moduloSeleccionado.duracionHoras ?? '-'} horas
                  </span>
                </div>

                <div>
                  <span style={{ color: '#8c8c8c' }}>Docente:</span>{" "}
                  <span style={{ color: '#262626', fontWeight: 500 }}>
                    {moduloSeleccionado.docenteNombre || '-'}
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
                      const modulo = modulos.find(m => m.moduloId === s.moduloId);
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
                            {modulo.moduloNombre || 'Sin nombre'}
                          </div>

                          <div>
                            {typeof modulo.sesiones === 'number' ? `Sesión ${modulo.sesiones}` : 'Sin sesión'}
                          </div>

                          {/* Horas */}
                          <div style={{ fontSize: 11, color: "#8c8c8c" }}>
                            {modulo.duracionHoras ?? '-'} hs totales
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
                          const newValue = moment();
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
              setModuloBuscado(null);
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
                placeholder="Buscar módulo por nombre"
                style={{ width: '100%' }}
                value={moduloBuscado || undefined}
                onChange={(value) => setModuloBuscado(value)}
                filterOption={(input, option) => {
                  const modulo = modulosDisponibles.find(m => m.id === option?.value);
                  if (!modulo) return false;
                  const searchText = input.toLowerCase();
                  return modulo.nombre.toLowerCase().includes(searchText);
                }}
              >
                {modulosDisponibles.filter(mod => mod.estado).map(mod => (
                  <Select.Option key={mod.id} value={mod.id}>
                    {mod.nombre}
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