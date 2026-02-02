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
  CloseOutlined,
  GoogleOutlined,
} from "@ant-design/icons";
import moment from "moment";
import styles from "./DetalleProducto.module.css";
// Asegúrate de que las rutas a tus servicios sean correctas
import { obtenerProductoPorId, obtenerTiposEstadoProducto, actualizarProducto, sincronizarCalendarioProducto } from "../../servicios/ProductoService";
import type { Producto, TipoEstadoProducto } from "../../interfaces/IProducto";
import { obtenerDepartamentos } from "../../servicios/DepartamentosService";
import ModalProducto from "./ModalProducto";
import { obtenerModulos } from "../../servicios/ModuloService";
import type { IModulo as Modulo } from "../../interfaces/IModulo";
import { asignarModuloAProducto, desasignarModuloDeProducto } from "../../servicios/EstructuraCurricularModuloService";

const coloresModulos = [
  '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
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
  const [syncLoading, setSyncLoading] = useState(false);
  
  const [modulosDisponibles, setModulosDisponibles] = useState<any[]>([]);

  // 🟢 FUNCIÓN MAESTRA DE RECARGA
  const recargarTodo = async () => {
      if (!id) return;
      try {
          const prodData = await obtenerProductoPorId(Number(id));
          setProducto(prodData);
          
          if (prodData.modulos && prodData.modulos.length > 0) {
              setModulos(prodData.modulos);
          } else {
              setModulos([]);
          }
      } catch (error) {
          console.error("Error recargando datos:", error);
      }
  };

  /* =========================================================
     1. LÓGICA DE CALENDARIO (Visualización)
     ========================================================= */

  const parsearDiasClase = (diasStr: string | undefined | null): number[] => {
    if (!diasStr) return [];
    return diasStr.split(',').map(d => parseInt(d.trim()));
  };

  const obtenerLimiteSesiones = (modulo: any): number => {
    return modulo.sesiones || modulo.numeroSesiones || 0;
  };

  // 🆕 Función para obtener sesiones asincrónicas
  const obtenerSesionesAsincronicas = (modulo: any): number => {
    // 🎯 Tu backend devuelve: "numeroSesionesAsincronicas" (camelCase desde C#)
    
    // Intentar directamente con el nombre que viene del backend
    if (typeof modulo.numeroSesionesAsincronicas === 'number') {
      return modulo.numeroSesionesAsincronicas;
    }
    
    // Fallback: PascalCase (por si no hay serialización camelCase)
    if (typeof modulo.NumeroSesionesAsincronicas === 'number') {
      return modulo.NumeroSesionesAsincronicas;
    }
    
    // Fallback: nombre alternativo
    if (typeof modulo.sesionesAsincronicas === 'number') {
      return modulo.sesionesAsincronicas;
    }
    
    // Si tiene sesionesDetalle, contar las asincrónicas
    if (Array.isArray(modulo.sesionesDetalle) && modulo.sesionesDetalle.length > 0) {
      const asincronicas = modulo.sesionesDetalle.filter((s: any) => {
        const tipo = (s.tipoSesion || s.tipo || s.tipoSesionNombre || '').toLowerCase();
        return tipo.includes('asincr') || tipo.includes('asínc') || tipo.includes('async');
      });
      if (asincronicas.length > 0) {
        return asincronicas.length;
      }
    }
    
    // Si no encuentra nada, mostrar advertencia
    console.warn(`⚠️ No se encontró numeroSesionesAsincronicas para: ${modulo.moduloNombre}`);
    return 0;
  };

  // 🆕 Función para obtener sesiones sincrónicas
  const obtenerSesionesSincronicas = (modulo: any): number => {
    // 🎯 Tu backend devuelve: "sesionesSincronicas" (camelCase desde C#)
    
    // Intentar directamente con el nombre que viene del backend
    if (typeof modulo.sesionesSincronicas === 'number' && modulo.sesionesSincronicas > 0) {
      return modulo.sesionesSincronicas;
    }
    
    // Fallback: PascalCase (por si no hay serialización camelCase)
    if (typeof modulo.SesionesSincronicas === 'number' && modulo.SesionesSincronicas > 0) {
      return modulo.SesionesSincronicas;
    }
    
    // Fallback: otros nombres posibles
    if (typeof modulo.numeroSesiones === 'number' && modulo.numeroSesiones > 0) {
      return modulo.numeroSesiones;
    }
    
    // Si tiene sesionesDetalle, contar las sincrónicas
    if (Array.isArray(modulo.sesionesDetalle) && modulo.sesionesDetalle.length > 0) {
      const sincronicas = modulo.sesionesDetalle.filter((s: any) => {
        const tipo = (s.tipoSesion || s.tipo || s.tipoSesionNombre || '').toLowerCase();
        return tipo.includes('sincr') || tipo.includes('síncr') || tipo.includes('sync');
      });
      if (sincronicas.length > 0) {
        return sincronicas.length;
      }
    }
    
    // Último recurso: contar bloques en detalleHorarios
    if (modulo.detalleHorarios) {
      try {
        const bloques = modulo.detalleHorarios.split('|');
        return bloques.length;
      } catch (e) {
        return 0;
      }
    }
    
    return 0;
  };

  const calcularCronograma = (modulo: Modulo) => {
    // 1. Validaciones básicas de existencia
    if (!modulo || !modulo.fechaInicio) return { fechas: [], fechaFin: null };

    // ---------------------------------------------------------
    // 🔍 DIAGNÓSTICO COMPLETO DEL MÓDULO
    // ---------------------------------------------------------
    console.group(`🔍 CÁLCULO CRONOGRAMA: ${modulo.moduloNombre || 'Sin nombre'}`);
    console.log('📦 OBJETO COMPLETO:', JSON.stringify(modulo, null, 2));
    console.log('🔑 TODAS LAS CLAVES:', Object.keys(modulo));

    // ---------------------------------------------------------
    // 2. BÚSQUEDA EXHAUSTIVA DE SESIONES SINCRÓNICAS
    // ---------------------------------------------------------
    let limiteSesiones = obtenerSesionesSincronicas(modulo);

    // Si después de todo esto es 0, no hay nada que calcular
    if (limiteSesiones <= 0) {
      console.error(`❌ NO SE ENCONTRARON SESIONES SINCRÓNICAS para "${modulo.moduloNombre}"`);
      console.error('📋 Revisar el objeto completo arriba para identificar el campo correcto');
      console.groupEnd();
      return { fechas: [], fechaFin: null };
    }

    console.log(`📊 SESIONES SINCRÓNICAS para cálculo: ${limiteSesiones}`);

    // ---------------------------------------------------------
    // 3. OBTENCIÓN DE DÍAS PERMITIDOS (Con Fallback)
    // ---------------------------------------------------------
    let diasPermitidos = parsearDiasClase(modulo.diasClase);

    // PLAN B: Si diasClase está vacío, intentamos leer 'detalleHorarios'
    if (diasPermitidos.length === 0 && (modulo as any).detalleHorarios) {
      try {
        const partes = (modulo as any).detalleHorarios.split('|');
        const diasExtraidos = partes.map((p: string) => {
          const [diaStr] = p.split('@'); 
          return parseInt(diaStr); 
        }).filter((d: number) => !isNaN(d));
        
        // Eliminamos duplicados
        diasPermitidos = [...new Set(diasExtraidos)] as number[];
        console.log('✅ Días extraídos de detalleHorarios:', diasPermitidos);
      } catch (e) {
        console.error("Error parseando detalleHorarios fallback", e);
      }
    }

    // Si aún así no tenemos días, no podemos proyectar fechas
    if (diasPermitidos.length === 0) {
      console.warn('⚠️ No hay días permitidos para calcular cronograma');
      console.groupEnd();
      return { fechas: [], fechaFin: null };
    }

    // ---------------------------------------------------------
    // 4. ALGORITMO DE CÁLCULO (Iteración calendario)
    // ---------------------------------------------------------
    const fechaActual = moment(modulo.fechaInicio).utc().startOf('day');
    const listaFechas: { fecha: string; nroSesion: number }[] = [];
    let sesionesContadas = 0;
    let seguridad = 0;

    while (sesionesContadas < limiteSesiones && seguridad < 365) {
      const diaSemana = fechaActual.day();

      if (diasPermitidos.includes(diaSemana)) {
        sesionesContadas++;
        
        listaFechas.push({
            fecha: fechaActual.format("YYYY-MM-DD"),
            nroSesion: sesionesContadas
        });
      }

      if (sesionesContadas >= limiteSesiones) {
        break;
      }

      fechaActual.add(1, 'days');
      seguridad++;
    }

    console.log(`✅ Cronograma calculado:`, {
      totalSesiones: limiteSesiones,
      fechasGeneradas: listaFechas.length,
      primeraFecha: listaFechas[0]?.fecha,
      ultimaFecha: listaFechas[listaFechas.length - 1]?.fecha
    });
    console.groupEnd();

    return { 
        fechas: listaFechas, 
        fechaFin: listaFechas.length > 0 ? moment(listaFechas[listaFechas.length - 1].fecha) : null 
    };
  };

  const handleSincronizar = async () => {
    if (!producto || !producto.id) return;
    const emailResponsable = producto.personalEmail || producto.usuarioCreacion;

    if (!emailResponsable || !emailResponsable.includes('@')) {
        message.warning("El responsable no tiene un email válido registrado.");
        return;
    }

    try {
        setSyncLoading(true); 
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const res: any = await sincronizarCalendarioProducto(producto.id, emailResponsable, tz);
        
        message.success(res.mensaje || "Sincronizado correctamente", 5);
    } catch (error: any) {
        console.error(error);
        message.error(error.message || "Error al sincronizar");
    } finally {
        setSyncLoading(false);
    }
  };

  /* =========================
     CARGAR DATOS INICIALES
  ========================= */
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const deptData = await obtenerDepartamentos();
        setDepartamentos(deptData.map((d: any) => ({ id: d.id, nombre: d.nombre })));

        const tiposData = await obtenerTiposEstadoProducto();
        setTiposEstadoProducto(tiposData);

        const responseModulos: any = await obtenerModulos("", 1, 1000);
        setModulosDisponibles(Array.isArray(responseModulos.modulos) ? responseModulos.modulos : []);

        if (id) {
            await recargarTodo();
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

      if (response.codigo === "SIN ERROR" || response.codigo === "SIN_ERROR") {
        message.success("Módulo asignado correctamente");
        setModalAsignarVisible(false);
        setModuloBuscado(null);
        await recargarTodo();
      } else {
        message.error(response.mensaje || "Error al asignar el módulo");
      }
    } catch (error: any) {
      console.error("Error al asignar módulo:", error);
      message.error(error?.response?.data?.mensaje || "Error al asignar");
    } finally {
      setLoading(false);
    }
  };

  const handleDesasignarModulo = async (record: Modulo) => {
    const idRelacion = record.id || (record as any).estructuraCurricularModuloId;

    if (!idRelacion) {
      message.error("No se puede desasignar: ID no encontrado en el registro");
      return;
    }
  
    try {
      setLoading(true);
      const response = await desasignarModuloDeProducto(idRelacion);
  
      if (response.codigo === "SIN ERROR" || response.codigo === "SIN_ERROR") {
        message.success("Módulo desasignado correctamente");
        await recargarTodo();
        if (moduloSeleccionado?.id === record.id) {
            setModuloSeleccionado(null);
        }
      } else {
        message.error(response.mensaje || "Error al desasignar");
      }
    } catch (error: any) {
      console.error("Error al desasignar:", error);
      message.error(error?.response?.data?.mensaje || "Error al desasignar");
    } finally {
      setLoading(false);
    }
  };

  const handleEditarProducto = () => setModalEditarVisible(true);

  const handleGuardarProducto = async (productoData: Partial<Producto>) => {
    try {
      if (producto?.id) {
        await actualizarProducto(producto.id, productoData, producto);
        message.success("Producto actualizado exitosamente");
        await recargarTodo();
      }
      setModalEditarVisible(false);
    } catch (error) {
      const mensajeError = (error as any)?.response?.data?.message || "Error al actualizar";
      message.error(mensajeError);
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
      title: 'Código',
      dataIndex: 'moduloCodigo',
      key: 'moduloCodigo',
      render: (text: string) => text || '-'
    },
    {
      title: 'Docente',
      dataIndex: 'docenteNombre',
      key: 'docenteNombre',
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
            if (!fecha) return '-';
            return moment(fecha).utc().format('DD/MM/YYYY');
        }
    },
    {
      title: 'Fecha de Fin',
      key: 'fechaFin', 
      render: (_: any, record: Modulo) => {
        if (record.fechaFin) {
            return <Tag color="blue">{moment(record.fechaFin).utc().format('DD/MM/YYYY')}</Tag>;
        }
        const { fechaFin } = calcularCronograma(record);
        if (fechaFin) {
            return <Tag color="orange">{fechaFin.format('DD/MM/YYYY')}</Tag>;
        }
        return '-';
      }
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
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
                const idRealModulo = record.idModulo || (record as any).moduloId;
                if (idRealModulo) {
                    navigate(`/producto/modulos/detalle/${idRealModulo}`);
                } else {
                    message.error("ID de módulo no encontrado para navegar");
                }
              }}
              style={{ backgroundColor: '#1f1f1f', borderColor: '#1f1f1f' }}
            />
          </Tooltip>

          <Popconfirm
            title={`¿Quitar "${record.moduloNombre}"?`}
            onConfirm={(e) => {
                e?.stopPropagation(); 
                handleDesasignarModulo(record);
            }}
            onCancel={(e) => e?.stopPropagation()}
            okText="Sí"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Desasignar">
              <Button danger icon={<CloseOutlined />} onClick={(e) => e.stopPropagation()} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* =========================
     PREPARACIÓN DATOS CALENDARIO
     ========================= */
  const limpiarHora = (h: any): string => {
    if (!h) return '';
    const str = h.toString();
    if (str.includes('T')) return moment(str).format('HH:mm');
    return str.substring(0, 5);
  };

  const parsearDetalleHorarios = (cadena: string | undefined | null) => {
      const mapa: Record<number, { inicio: string; fin: string }> = {};
      if (!cadena) return mapa;
      const partes = cadena.split('|');
      partes.forEach(parte => {
          const [diaStr, inicio, fin] = parte.split('@');
          const dia = parseInt(diaStr);
          if (!isNaN(dia)) mapa[dia] = { inicio, fin };
      });
      return mapa;
  };

  const diasClasesPorFecha: Record<string, any[]> = {};

  modulos.forEach((modulo, index) => {
    const modId = modulo.idModulo || modulo.id || 0;
    const modNombre = modulo.moduloNombre || modulo.nombre || 'Sin nombre';
    const color = coloresModulos[index % coloresModulos.length];
    
    const { fechas } = calcularCronograma(modulo);
    const totalReal = obtenerSesionesSincronicas(modulo);
    const mapaHorarios = parsearDetalleHorarios((modulo as any).detalleHorarios);

    fechas.forEach((info) => {
      const fechaStr = info.fecha;
      const diaSemana = moment(fechaStr).day();
      let hInicio = '';
      let hFin = '';

      if (mapaHorarios[diaSemana]) {
          hInicio = mapaHorarios[diaSemana].inicio;
          hFin = mapaHorarios[diaSemana].fin;
      } else {
          hInicio = limpiarHora(modulo.horaInicioSync);
          hFin = limpiarHora(modulo.horaFinSync);
      }

      const textoHorario = (hInicio && hFin) ? `${hInicio} - ${hFin}` : '';

      if (!diasClasesPorFecha[fechaStr]) {
        diasClasesPorFecha[fechaStr] = [];
      }
      diasClasesPorFecha[fechaStr].push({
        moduloId: modId,
        nombre: modNombre,
        color,
        nroSesion: info.nroSesion,
        totalSesiones: totalReal,
        horario: textoHorario
      });
    });
  });

  return (
    <div className={styles.container}>
      <Button icon={<ArrowLeftOutlined />} style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>
        Volver
      </Button>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', minHeight: '400px', alignItems:'center' }}>
          <Spin size="large" />
        </div>
      ) : producto ? (
        <>
          {/* INFO PRODUCTO */}
          <Card className={styles.productCard} style={{ marginBottom: 16 }}>
            <h3 className={styles.title}>{producto.nombre}</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* COLUMNA IZQUIERDA */}
                <div>
                <div className={styles.infoList}>
                    <Item label="Departamento" value={producto.departamentoNombre || "-"} />
                    <Item label="Código del producto" value={producto.codigoLanzamiento} />
                    <Item label="Descripción" value={producto.datosImportantes || "-"} />
                    <Item label="Costo base" value={`USD ${producto.costoBase}`} />
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
                    <div style={{ marginBottom: 24 }}>
                        <h4 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Estadísticas</h4>
                        {producto.estadisticas && producto.estadisticas.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {producto.estadisticas.map((stat: any, index: number) => (
                                    <div key={index} style={{ padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: 4, fontSize: 13 }}>
                                        {stat.texto || '-'}
                                    </div>
                                ))}
                            </div>
                        ) : <div style={{ color: '#8c8c8c', fontSize: 13 }}>Sin estadísticas</div>}
                    </div>

                    <div>
                        <h4 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Objetivos</h4>
                        {producto.objetivos && producto.objetivos.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {producto.objetivos.map((obj: any, index: number) => (
                                    <div key={index} style={{ padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: 4, fontSize: 13 }}>
                                        {obj.texto || '-'}
                                    </div>
                                ))}
                            </div>
                        ) : <div style={{ color: '#8c8c8c', fontSize: 13 }}>Sin objetivos</div>}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <Button icon={<EditOutlined />} size="large" onClick={handleEditarProducto} style={{backgroundColor:'#1f1f1f', color:'white'}}>
                Editar
              </Button>
              <Button icon={<GoogleOutlined />} size="large" loading={syncLoading} onClick={handleSincronizar}>
                Sincronizar con Google Calendar
              </Button>
            </div>
          </Card>

          {/* TABLA MÓDULOS */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h4 className={styles.title} style={{ margin: 0 }}>Módulos del producto</h4>
              <Button type="primary" onClick={() => setModalAsignarVisible(true)} style={{backgroundColor:'#1f1f1f'}}>
                Asignar nuevo módulo
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

          {/* CALENDARIO - DETALLE MODULO MEJORADO */}
          <Card>
            <h4 className={styles.title}>Vista calendario de módulos del producto</h4>
            
            {moduloSeleccionado ? (
                <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 4, marginBottom: 16, fontSize: 13 }}>
                     <div style={{ marginBottom: 8 }}>
                        <span style={{ color: '#8c8c8c' }}>Nombre del Módulo:</span>{" "}
                        <span style={{ color: '#262626', fontWeight: 500 }}>{moduloSeleccionado.moduloNombre}</span>
                     </div>
                     <div style={{ marginBottom: 8 }}>
                        <span style={{ color: '#8c8c8c' }}>Código del módulo:</span>{" "}
                        <span style={{ color: '#262626', fontWeight: 500 }}>{moduloSeleccionado.moduloCodigo || '-'}</span>
                     </div>
                     {/* ✅ Mostrar sesiones asincrónicas */}
                     <div style={{ marginBottom: 8 }}>
                        <span style={{ color: '#8c8c8c' }}>Sesiones Asincrónicas:</span>{" "}
                        <span style={{ color: '#262626', fontWeight: 500 }}>
                          {obtenerSesionesAsincronicas(moduloSeleccionado)}
                        </span>
                     </div>
                     {/* ✅ Mostrar sesiones sincrónicas */}
                     <div style={{ marginBottom: 8 }}>
                        <span style={{ color: '#8c8c8c' }}>Sesiones Sincrónicas:</span>{" "}
                        <span style={{ color: '#262626', fontWeight: 500 }}>
                          {obtenerSesionesSincronicas(moduloSeleccionado)}
                        </span>
                     </div>
                     <div style={{ marginBottom: 8 }}>
                        <span style={{ color: '#8c8c8c' }}>Fecha de Inicio:</span>{" "}
                        <span style={{ color: '#262626', fontWeight: 500 }}>{moduloSeleccionado.fechaInicio ? moment(moduloSeleccionado.fechaInicio).utc().format('DD/MM/YYYY') : '-'}</span>
                        <span style={{ color: '#8c8c8c', marginLeft: 24 }}>Fecha Final:</span>{" "}
                        <span style={{ color: '#262626', fontWeight: 500 }}>
                            {(() => {
                                const { fechaFin } = calcularCronograma(moduloSeleccionado);
                                return fechaFin ? fechaFin.format('DD/MM/YYYY') : '-';
                            })()}
                        </span>
                     </div>
                     <div style={{ marginBottom: 8 }}>
                        <span style={{ color: '#8c8c8c' }}>Duración:</span>{" "}
                        <span style={{ color: '#262626', fontWeight: 500 }}>
                          {(() => {
                             // 1. Obtenemos las fechas exactas del cronograma calculado
                             const { fechas } = calcularCronograma(moduloSeleccionado);
                             if (!fechas || fechas.length === 0) return '0';

                             // 2. Obtenemos el mapa de horarios por día (para detectar si el sábado es distinto)
                             // (Usamos la función parsearDetalleHorarios que ya tienes en el componente)
                             const detalleStr = (moduloSeleccionado as any).detalleHorarios || "";
                             const mapaHorarios = parsearDetalleHorarios(detalleStr);

                             // 3. Definimos horas por defecto (buscando en todas las propiedades posibles)
                             const defInicio = moduloSeleccionado.horaInicioSync 
                                            || (moduloSeleccionado as any).horaInicio 
                                            || (moduloSeleccionado as any).HoraInicio
                                            || "00:00:00";
                                            
                             const defFin = moduloSeleccionado.horaFinSync 
                                         || (moduloSeleccionado as any).horaFin 
                                         || (moduloSeleccionado as any).HoraFin
                                         || "00:00:00";

                             let minutosTotales = 0;

                             // 4. Sumamos sesión por sesión
                             fechas.forEach(f => {
                                 const diaSemana = moment(f.fecha).day(); // 0=Dom, 6=Sab
                                 
                                 let hIniStr = defInicio;
                                 let hFinStr = defFin;

                                 // Si hay un horario específico configurado para este día (ej: Sábado), lo usamos
                                 if (mapaHorarios[diaSemana]) {
                                     hIniStr = mapaHorarios[diaSemana].inicio;
                                     hFinStr = mapaHorarios[diaSemana].fin;
                                 }

                                 // Parseamos con moment (acepta varios formatos por seguridad)
                                 const mIni = moment(hIniStr, ["HH:mm:ss", "HH:mm", "YYYY-MM-DDTHH:mm:ss"]);
                                 const mFin = moment(hFinStr, ["HH:mm:ss", "HH:mm", "YYYY-MM-DDTHH:mm:ss"]);
                                 
                                 if (mIni.isValid() && mFin.isValid()) {
                                     const diff = mFin.diff(mIni, 'minutes');
                                     minutosTotales += Math.max(0, diff);
                                 }
                             });

                             // 5. Convertimos a horas y mostramos
                             const horas = minutosTotales / 60;
                             return horas > 0 ? Number(horas.toFixed(2)) : '-';
                          })()} horas
                        </span>
                      </div>
                     <div>
                        <span style={{ color: '#8c8c8c' }}>Docente:</span>{" "}
                        <span style={{ color: '#262626', fontWeight: 500 }}>{moduloSeleccionado.docenteNombre || '-'}</span>
                     </div>
                </div>
            ) : <div style={{textAlign:'center', color:'#8c8c8c', padding: 16}}>Selecciona un módulo para ver su información detallada</div>}
            
            <Calendar
              dateCellRender={(date) => {
                const dateStr = date.format("YYYY-MM-DD");
                const sesiones = diasClasesPorFecha[dateStr];
                if (!sesiones) return null;
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {sesiones.map((s, idx) => (
                        <div key={idx} style={{ background: "#f5f5f5", borderLeft: `4px solid ${s.color}`, padding: "4px", borderRadius: 4, fontSize: 11 }}>
                            <strong>{s.nombre}</strong>
                            <div>Sesión {s.nroSesion}/{s.totalSesiones}</div>
                            {s.horario && <div>{s.horario}</div>}
                        </div>
                    ))}
                  </div>
                );
              }}
            />
          </Card>
          
          {/* MODAL GESTIONAR */}
          <Modal
            title="Gestionar módulos"
            open={modalAsignarVisible}
            onCancel={() => setModalAsignarVisible(false)}
            footer={[
                <Button key="close" onClick={() => setModalAsignarVisible(false)}>Cerrar</Button>,
                <Button key="save" type="primary" onClick={handleAsignarModulo} disabled={!moduloBuscado}>Asignar</Button>
            ]}
          >
             <Select 
                showSearch 
                style={{width:'100%'}} 
                placeholder="Buscar módulo por nombre" 
                onChange={setModuloBuscado}
                filterOption={(input, option) => (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())}
             >
                {modulosDisponibles.map(m => <Select.Option key={m.id} value={m.id}>{m.nombre}</Select.Option>)}
             </Select>
          </Modal>

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
        <div style={{ textAlign: 'center', padding: '40px' }}>Producto no encontrado</div>
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.infoItem}>
      <span className={styles.label}>{label}:</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}