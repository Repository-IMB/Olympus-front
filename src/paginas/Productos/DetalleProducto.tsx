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
  List,
  Popconfirm,
  Typography
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  CalendarOutlined,
  EyeOutlined,
  CloseOutlined
} from "@ant-design/icons";
import moment from "moment"; // Nota: quitamos { type Moment } si da error, o lo dejamos si usas TS estricto
import styles from "./DetalleProducto.module.css";
import { obtenerProductoPorId, obtenerTiposEstadoProducto, actualizarProducto } from "../../servicios/ProductoService";
import type { Producto, TipoEstadoProducto } from "../../interfaces/IProducto";
import { obtenerDepartamentos } from "../../servicios/DepartamentosService";
import ModalProducto from "./ModalProducto";
import { obtenerModulosPorProducto, obtenerModulos } from "../../servicios/ModuloService";
import type { IModulo as Modulo } from "../../interfaces/IModulo";
import { asignarModuloAProducto, desasignarModuloDeProducto } from "../../servicios/EstructuraCurricularModuloService";

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
  
  // Inicializamos como array vacío para evitar errores
  const [modulosDisponibles, setModulosDisponibles] = useState<any[]>([]);

  /* =========================================================
     1. ZONA DE FUNCIONES AUXILIARES (LÓGICA MATEMÁTICA Y FECHAS)
     ========================================================= */

  const parsearDiasClase = (diasStr: string | undefined | null): number[] => {
    if (!diasStr) return [];
    return diasStr.split(',').map(d => parseInt(d.trim()));
  };

  const obtenerCantidadSesiones = (sesiones: any): number => {
    if (typeof sesiones === 'number') return sesiones;
    if (Array.isArray(sesiones)) return sesiones.length;
    return 0;
  };

  const obtenerLimiteSesiones = (modulo: any): number => {
    // Prioridad: Usar el contador de sincrónicas (nuevo campo SQL)
    if (typeof modulo.sesionesSincronicas === 'number' && modulo.sesionesSincronicas > 0) {
        return modulo.sesionesSincronicas;
    }
    // Fallback al total
    if (typeof modulo.sesiones === 'number') return modulo.sesiones;
    return 0;
  };

  // 🟢 LÓGICA DE CALENDARIO SEGURA (TIMEZONE SAFE)
  const calcularCronograma = (modulo: Modulo) => {
    if (!modulo || !modulo.fechaInicio || !modulo.diasClase) return { fechas: [], fechaFin: null };

    // 1. TRUCO DE FECHA SEGURA:
    // Convertimos la fecha a String "YYYY-MM-DD" puro, ignorando la hora que venga de la BD.
    const fechaString = moment(modulo.fechaInicio).utc().format('YYYY-MM-DD');
    
    // 2. Creamos la fecha local a las 12:00 del mediodía.
    // Al ser mediodía, aunque Argentina reste 3 horas, caerá a las 9:00 AM del MISMO día.
    // Nunca retrocederá al día anterior.
    const fechaInicio = moment(`${fechaString}T12:00:00`);

    const diasPermitidos = parsearDiasClase(modulo.diasClase);
    const limiteSesiones = obtenerLimiteSesiones(modulo); 

    if (diasPermitidos.length === 0 || limiteSesiones === 0) return { fechas: [], fechaFin: null };

    const listaFechas: { fecha: string; nroSesion: number }[] = [];
    let sesionesContadas = 0;
    const fechaActual = fechaInicio.clone();
    let seguridad = 0;

    while (sesionesContadas < limiteSesiones && seguridad < 365) {
      const diaSemana = fechaActual.day(); // 0=Dom, 1=Lun...

      // 🟢 DOBLE FILTRO:
      // 1. Debe estar en la lista de días permitidos.
      // 2. NO puede ser Domingo (0), por si acaso la BD tenga basura.
      if (diasPermitidos.includes(diaSemana) && diaSemana !== 0) {
        sesionesContadas++;
        listaFechas.push({
            fecha: fechaActual.format("YYYY-MM-DD"),
            nroSesion: sesionesContadas
        });
      }

      // Si aún no terminamos, avanzamos al día siguiente.
      if (sesionesContadas < limiteSesiones) {
          fechaActual.add(1, 'days');
      }
      seguridad++;
    }

    return { 
        fechas: listaFechas, 
        fechaFin: listaFechas.length > 0 ? moment(listaFechas[listaFechas.length - 1].fecha) : null 
    };
  };

  /* =========================
      CARGAR DATOS
  ========================= */
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const deptData = await obtenerDepartamentos();
        const deptFormateados = deptData.map((d: any) => ({ id: d.id, nombre: d.nombre }));
        setDepartamentos(deptFormateados);

        const tiposData = await obtenerTiposEstadoProducto();
        setTiposEstadoProducto(tiposData);

        const responseModulos: any = await obtenerModulos("", 1, 1000);
        if (responseModulos && Array.isArray(responseModulos.modulos)) {
            setModulosDisponibles(responseModulos.modulos);
        } else if (Array.isArray(responseModulos)) {
            setModulosDisponibles(responseModulos);
        } else {
            setModulosDisponibles([]);
        }

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

  /* =========================
      HANDLERS
  ========================= */
  const handleAsignarModulo = async () => {
    if (!moduloBuscado || !producto?.id) {
      message.error("Debe seleccionar un módulo");
      return;
    }

    try {
      setLoading(true);
      const response = await asignarModuloAProducto(producto.id, moduloBuscado);

      if (response.codigo === "SIN_ERROR") {
        message.success("Módulo asignado correctamente");
        setModalAsignarVisible(false);
        setModuloBuscado(null);
        
        const modulosData = await obtenerModulosPorProducto(producto.id);
        setModulos(modulosData);
      } else {
        message.error(response.mensaje || "Error al asignar el módulo");
      }
    } catch (error: any) {
      console.error("Error al asignar módulo:", error);
      message.error(
        error?.response?.data?.mensaje || "Error al asignar el módulo"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDesasignarModulo = async (record: Modulo) => {
    if (!record.estructuraCurricularModuloId) {
      message.error("No se puede desasignar este módulo (Falta ID)");
      return;
    }
  
    try {
      setLoading(true);
      const response = await desasignarModuloDeProducto(
        record.estructuraCurricularModuloId
      );
  
      if (response.codigo === "SIN ERROR" || response.codigo === "SIN_ERROR") {
        message.success("Módulo desasignado correctamente");
        
        if (producto?.id) {
          const modulosData = await obtenerModulosPorProducto(producto.id);
          setModulos(modulosData);
        }

      } else {
        message.error(response.mensaje || "Error al desasignar el módulo");
      }
    } catch (error: any) {
      console.error("Error al desasignar módulo:", error);
      message.error(
        error?.response?.data?.mensaje || "Error al desasignar el módulo"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditarProducto = () => {
    setModalEditarVisible(true);
  };

  const handleGuardarProducto = async (productoData: Partial<Producto>) => {
    try {
      if (producto?.id) {
        await actualizarProducto(producto.id, productoData, producto);
        message.success("Producto actualizado exitosamente");
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


  /* =========================
      DEFINICIÓN DE COLUMNAS
  ========================= */
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
          return new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime();
        },
        render: (fecha: string) => {
            // Renderizamos también con formato seguro para que coincida visualmente
            if (!fecha) return '-';
            const f = moment(fecha).utc(); // Leemos como UTC para evitar resta de horas
            return f.format('DD/MM/YYYY');
        }
    },
    {
      title: 'Fecha de Fin',
      key: 'fechaFinCalculada', 
      render: (_: any, record: Modulo) => {
        const { fechaFin } = calcularCronograma(record);

        if (fechaFin) {
            return <Tag color="blue">{fechaFin.format('DD/MM/YYYY')}</Tag>;
        }

        return record.fechaFinPorSesiones 
            ? moment(record.fechaFinPorSesiones).format('DD/MM/YYYY') 
            : '-';
      }
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
      width: 120,
      align: 'center' as const,
      render: (_: unknown, record: Modulo) => (
        <Space>
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

          <Popconfirm
            title={`¿Estás seguro de quitar "${record.moduloNombre}"?`}
            onConfirm={(e) => {
                e?.stopPropagation(); 
                handleDesasignarModulo(record);
            }}
            onCancel={(e) => e?.stopPropagation()}
            okText="Sí"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Desasignar del producto">
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={(e) => e.stopPropagation()} 
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* =========================
      PREPARACIÓN DATOS CALENDARIO
  ========================= */
  const diasClasesPorFecha: Record<
    string,
    { moduloId: number; nombre: string; color: string; nroSesion: number; totalSesiones: number }[]
  > = {};

  modulos.forEach((modulo, index) => {
    if (!modulo.moduloId || typeof modulo.moduloId !== 'number') return;

    const color = coloresModulos[index % coloresModulos.length];
    
    // Calculamos los días
    const { fechas } = calcularCronograma(modulo);

    // Obtenemos el total real (sincrónicas) para la etiqueta
    const totalReal = obtenerLimiteSesiones(modulo);

    fechas.forEach((info) => {
      const fecha = info.fecha;
      
      if (!diasClasesPorFecha[fecha]) {
        diasClasesPorFecha[fecha] = [];
      }

      diasClasesPorFecha[fecha].push({
        moduloId: modulo.moduloId!,
        nombre: modulo.moduloNombre || 'Sin nombre',
        color,
        nroSesion: info.nroSesion,
        totalSesiones: totalReal 
      });
    });
  });


  /* =========================
      RENDER
  ========================= */
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

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" />
        </div>
      ) : producto ? (
        <>
          {/* DETALLE DEL PRODUCTO */}
          <Card className={styles.productCard} style={{ marginBottom: 16 }}>
            <h3 className={styles.title}>{producto.nombre}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* COLUMNA IZQUIERDA */}
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

              {/* COLUMNA DERECHA */}
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

          {/* TABLA DE MÓDULOS */}
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

          {/* VISTA CALENDARIO */}
          <Card>
            <h4 className={styles.title}>Vista calendario de módulos del producto</h4>

            {/* INFO DEL MODULO SELECCIONADO */}
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
                  <span style={{ color: '#8c8c8c' }}>Sesiones Asincrónicas:</span>{" "}
                  <span style={{ color: '#262626', fontWeight: 500 }}>
                    {typeof moduloSeleccionado.sesiones === 'number' ? moduloSeleccionado.numeroSesionesAsincronicas : "-"}
                  </span>
                </div>
                {moduloSeleccionado.sesionesSincronicas && (
                    <div style={{ marginBottom: 8 }}>
                    <span style={{ color: '#8c8c8c' }}>Sesiones Sincrónicas:</span>{" "}
                    <span style={{ color: '#262626', fontWeight: 500 }}>
                        {moduloSeleccionado.sesionesSincronicas}
                    </span>
                    </div>
                )}

                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#8c8c8c' }}>Fecha de Inicio:</span>{" "}
                  <span style={{ color: '#262626', fontWeight: 500 }}>
                    {moduloSeleccionado.fechaInicio ? moment(moduloSeleccionado.fechaInicio).utc().format('DD/MM/YYYY') : '-'}
                  </span>
                  <span style={{ color: '#8c8c8c', marginLeft: 24 }}>Fecha Final:</span>{" "}
                  <span style={{ color: '#262626', fontWeight: 500 }}>
                    {/* También calculamos aquí la fecha fin visual para info */}
                    {(() => {
                        const { fechaFin } = calcularCronograma(moduloSeleccionado);
                        return fechaFin ? fechaFin.format('DD/MM/YYYY') : '-';
                    })()}
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

            {/* CALENDARIO */}
            <Calendar
              dateCellRender={(date) => {
                const dateStr = date.format("YYYY-MM-DD");
                const sesiones = diasClasesPorFecha[dateStr];

                if (!sesiones) return null;

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {sesiones.map((s, idx) => {
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
                          <div style={{ fontWeight: 600 }}>
                            {s.nombre}
                          </div>

                          <div>
                            Sesión {s.nroSesion} / {s.totalSesiones}
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
                const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

                return (
                  <div style={{ padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>
                      {months[month]} {year}
                    </span>
                    <Space>
                      <Select
                        value={year}
                        onChange={(newYear) => onChange(value.clone().year(newYear))}
                        style={{ width: 100 }}
                        size="small"
                      >
                        {years.map(y => <Select.Option key={y} value={y}>{y}</Select.Option>)}
                      </Select>
                      <Select
                        value={month}
                        onChange={(newMonth) => onChange(value.clone().month(newMonth))}
                        style={{ width: 120 }}
                        size="small"
                      >
                        {months.map((m, idx) => <Select.Option key={idx} value={idx}>{m}</Select.Option>)}
                      </Select>
                      <Button size="small" onClick={() => onChange(value.clone().subtract(1, 'month'))}>&lt;</Button>
                      <Button size="small" onClick={() => onChange(moment())}>Hoy</Button>
                      <Button size="small" onClick={() => onChange(value.clone().add(1, 'month'))}>&gt;</Button>
                    </Space>
                  </div>
                );
              }}
            />
          </Card>

          {/* MODAL GESTIONAR */}
          <Modal
            title="Gestionar módulos del producto"
            open={modalAsignarVisible}
            onCancel={() => {
              setModalAsignarVisible(false);
              setModuloBuscado(null);
            }}
            footer={[
              <Button key="cerrar" onClick={() => setModalAsignarVisible(false)}>
                Cerrar
              </Button>,
              <Button
                key="asignar"
                type="primary"
                onClick={handleAsignarModulo}
                disabled={!moduloBuscado}
              >
                Asignar módulo seleccionado
              </Button>
            ]}
            width={600}
          >
            <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #f0f0f0' }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Agregar nuevo módulo <span style={{ color: 'red' }}>*</span>
              </label>
              <Select
                showSearch
                placeholder="Buscar módulo por nombre"
                style={{ width: '100%' }}
                value={moduloBuscado || undefined}
                onChange={(value) => setModuloBuscado(value)}
                filterOption={(input, option) => {
                  const mod = (Array.isArray(modulosDisponibles) ? modulosDisponibles : []).find(m => m.id === option?.value);
                  if (!mod) return false;
                  return mod.nombre.toLowerCase().includes(input.toLowerCase());
                }}
              >
                {(Array.isArray(modulosDisponibles) ? modulosDisponibles : [])
                  .filter(mod => mod && mod.estado)
                  .map(mod => (
                    <Select.Option key={mod.id} value={mod.id}>
                      {mod.nombre}
                    </Select.Option>
                  ))}
              </Select>
            </div>
            
             <div>
                <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Módulos actualmente asignados:
                </Typography.Text>
                
                <List
                  size="small"
                  bordered
                  dataSource={modulos} 
                  locale={{ emptyText: 'No hay módulos asignados aún' }}
                  renderItem={(item: Modulo) => (
                    <List.Item
                      actions={[
                        <Popconfirm
                          key="delete"
                          title={`¿Estás seguro de quitar "${item.moduloNombre}"?`}
                          onConfirm={() => handleDesasignarModulo(item)} 
                          okText="Sí, desasignar"
                          cancelText="Cancelar"
                          okButtonProps={{ danger: true }}
                        >
                          <Tooltip title="Desasignar Módulo">
                            <Button 
                              type="text" 
                              danger 
                              icon={<CloseOutlined />} 
                              shape="circle"
                            />
                          </Tooltip>
                        </Popconfirm>
                      ]}
                    >
                      <List.Item.Meta
                        title={item.moduloNombre}
                      />
                    </List.Item>
                  )}
                  style={{ maxHeight: '250px', overflowY: 'auto' }}
                />
              </div>
          </Modal>

          {/* MODAL EDITAR PRODUCTO */}
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