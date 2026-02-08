import React, { useEffect, useState, useCallback, useRef } from "react";
import { debounce } from 'lodash';
import {
  Row,
  Col,
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Form,
  InputNumber,
  Upload,
  Modal,
  Dropdown,
  Menu,
  message,
  Divider,
  Spin,
  Checkbox,
} from "antd";
import { UploadOutlined, MoreOutlined } from "@ant-design/icons";
import type { UploadFile } from 'antd/es/upload/interface';
import estilos from "./Facturacion.module.css";
import contabilidadService from '../../../servicios/contabilidadService';
import { getCookie } from '../../../utils/cookies';
import * as ProductoService from '../../../servicios/ProductoService';

const { Option } = Select;

const Facturacion: React.FC = () => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const [dataFacturas, setDataFacturas] = useState<any[]>([]);
  const [dataFacturasOriginal, setDataFacturasOriginal] = useState<any[]>([]);
  const [personalList, setPersonalList] = useState<any[]>([]);
  const [contactosList, setContactosList] = useState<any[]>([]);
  const [productosList, setProductosList] = useState<any[]>([]);
  const [metodosPagoList, setMetodosPagoList] = useState<any[]>([]);
 
  // Estados para el modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<any>(null);
 
  // Estado para el filtro
  const [filtroMetodoPago, setFiltroMetodoPago] = useState<string | null>(null);

  // Estados para manejo de archivos
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [datosEstudiante, setDatosEstudiante] = useState<any>(null);
  const [cargandoEstudiante, setCargandoEstudiante] = useState(false);
  const [autoFillCompleto, setAutoFillCompleto] = useState(false);
  const [camposLlenos, setCamposLlenos] = useState<Record<string, boolean>>({});
  const [precioBase, setPrecioBase] = useState(0);
  const [haPagado, setHaPagado] = useState(false);

  const columnasFacturas = [
    { title: "Factura", dataIndex: "factura" },
    { title: "Alumno / Contacto", dataIndex: "contacto" },
    { title: "Curso", dataIndex: "curso" },
    {
      title: "Monto neto",
      dataIndex: "montoNeto",
      align: "right" as const,
    },
    {
      title: "Estado",
      dataIndex: "estado",
      render: (estado: string) => {
        const color =
          estado === "Pagado"
            ? "green"
            : estado === "Pendiente"
            ? "orange"
            : "red";
        return <Tag color={color}>{estado}</Tag>;
      },
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (record: any) => (
        <>
          <Button
            size="small"
            className={estilos.actionButton}
            onClick={() => handleVerFactura(record)}
          >
            Ver
          </Button>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key="editar" onClick={() => handleEditarFactura(record)}>
                  Editar
                </Menu.Item>
              </Menu>
            }
            trigger={['click']}
          >
            <Button size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </>
      ),
    },
  ];

  const handleVerFactura = (record: any) => {
    message.info(`Ver factura ${record.factura}`);
  };

  const handleEditarFactura = (record: any) => {
    setFacturaSeleccionada(record);
    const montoInicial = parseInt(
      record.montoPagado ||
      record.montoNetoOriginal ||
      (record.montoNeto?.replace('S/. ', '') || '0')
    ) || 0;
    editForm.setFieldsValue({
      estadoFactura: record.estadoOriginal || record.estado,
      montoPagado: parseFloat(record.montoPagado || record.montoNetoOriginal || record.montoNeto?.replace('S/. ', '') || 0),
    });
    setShowEditModal(true);
  };

  const handleActualizarFactura = async (values: any) => {
    if (!facturaSeleccionada) return;

    const estadoFactura = values.estadoFactura?.trim();
    const montoPagado = Number(values.montoPagado);

    if (!estadoFactura) {
      message.error('Selecciona un estado válido');
      return;
    }
    if (isNaN(montoPagado) || montoPagado < 0) {
      message.error('Ingresa un monto válido');
      return;
    }

    try {
      const resultado = await contabilidadService.actualizarEstadoFactura({
        IdFactura: facturaSeleccionada.id,
        EstadoFactura: estadoFactura,
        MontoPagado: montoPagado,
        UsuarioModificacion: 'SYSTEM',
      });

      if (resultado.exito || resultado.Exito) {
        message.success('Factura actualizada correctamente');
        setShowEditModal(false);
        cargarFacturas(filtroMetodoPago);
      } else {
        message.error(resultado.mensaje || resultado.Mensaje || 'Error al actualizar');
      }
    } catch (error) {
      console.error('Error al actualizar factura:', error);
      message.error('No se pudo actualizar la factura');
    }
  };

  const cargarFacturas = async (metodoPagoFiltro?: string | null) => {
    try {
      const params: any = { page: 1, pageSize: 100 };
      if (metodoPagoFiltro) {
        params.idMetodoPago = metodoPagoFiltro;
      }

      const res = await contabilidadService.listarFacturas(params);
      const data = res?.data ?? res;
      const filas = data?.facturas || data?.filas || data?.rows || data?.list || [];
     
      const mapped = (filas || []).map((f: any, i: number) => ({
        key: f.id ?? i + 1,
        id: f.id,
        factura: f.numeroFactura || f.factura || `#F-${f.id}`,
        contacto: f.contacto || f.nombreContacto || f.cliente || "-",
        curso: f.curso || f.codigoCurso || "-",
        montoNeto: f.montoNeto ? `S/. ${f.montoNeto}` : (f.monto ? `$/. ${f.monto}` : "$/. 0"),
        montoNetoOriginal: f.montoNeto || f.monto || 0,
        estado: f.estado || f.estadoFactura || "Pendiente",
        estadoOriginal: f.estadoFactura || f.estado || "Pendiente",
        metodoPago: f.metodoPago || '',
        idMetodoPago: f.idMetodoPago,
        montoPagado: f.montoPagado || 0,
        montoTotal: f.montoTotal || 0,
        montoRestante: f.montoRestante || 0,
      }));
     
      setDataFacturasOriginal(mapped);
      setDataFacturas(mapped);
    } catch (e) {
      console.warn('No se pudieron listar facturas', e);
    }
  };

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const token = getCookie('token');

        const usuariosRes = await fetch(`${import.meta.env.VITE_API_URL}/api/CFGModUsuarios/ListarConUsuario?page=1&pageSize=1000`, { headers: { accept: '*/*', Authorization: `Bearer ${token}` } });
        if (usuariosRes.ok) {
          const udata = await usuariosRes.json();
          const usuarios = Array.isArray(udata.usuarios) ? udata.usuarios : [];
          setPersonalList(usuarios.map((u:any)=>({ id: u.idPersonall ?? u.idPersonal ?? u.id, nombre: `${u.nombres || ''} ${u.apellidos || ''}`.trim() })));
          setContactosList(usuarios.map((u:any)=>({ id: u.idPersonall ?? u.idPersonal ?? u.id, nombre: `${u.nombres || ''} ${u.apellidos || ''}`.trim() })));
        }

        try {
          const productos = await ProductoService.obtenerProductos();
          setProductosList(productos.map((p:any)=>({ id: p.id, codigo: p.codigoLanzamiento ?? p.CodigoLanzamiento ?? p.codigo ?? p.Codigo ?? p.codigoLanzamiento, nombre: p.nombre || p.Nombre })));
        } catch (err) {
          console.warn('No se pudieron cargar productos', err);
        }

        try {
          const metodosRes = await contabilidadService.obtenerMetodosPagoActivos();
          setMetodosPagoList(metodosRes.metodoPagos || []);
        } catch (err) {
          console.warn('No se pudieron cargar métodos de pago', err);
          message.warning('Métodos de pago no disponibles');
        }

      } catch (e) {
        console.warn('Error cargando lookups', e);
      }
    };

    cargarFacturas();
    loadLookups();
  }, []);

  const handleFiltrarPorMetodoPago = (metodoPago: string | null) => {
    setFiltroMetodoPago(metodoPago);
    if (!metodoPago) {
      setDataFacturas(dataFacturasOriginal);
    } else {
      const filtradas = dataFacturasOriginal.filter(f => f.metodoPago === metodoPago);
      setDataFacturas(filtradas);
    }
  };

  // Función para convertir archivo a Base64
  const convertirArchivoABase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      let rutaComprobante = null;
      let nombreArchivo = null;
      let archivoBase64 = null;

      if (fileList.length > 0 && fileList[0].originFileObj) {
        const archivo = fileList[0].originFileObj;
        nombreArchivo = archivo.name;
        archivoBase64 = await convertirArchivoABase64(archivo);
        rutaComprobante = `/comprobantes/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${nombreArchivo}`;
      }

      const payload = {
        IdAsesor: values.asesor && !isNaN(Number(values.asesor)) ? Number(values.asesor) : null,
        Sede: values.sede || null,
        CodigoCurso: values.codigoCurso || null,
        IdPersona: datosEstudiante?.idPersona  || null,
        Pais: values.pais || null,
        CorreoCliente: values.correo || null,
        WhatsAppCliente: values.whatsapp || null,
        FichaInscripcionCompleta: !!values.fichaInscripcion,
        SesionesExtra: values.sesionesExtra || null,
        CondicionPago: values.condicionPago || null,
        MontoTotal: Number(values.montoPagado) || Number(values.montoTotal) || 0,
        MontoNeto: Number(values.montoNeto) || 0,
        NumeroCuota: Number(values.numeroCuota) || 1,
        IdMetodoPago: Number(values.idMetodoPago) || null,
        RutaComprobante: rutaComprobante, // Ruta del archivo
        NombreComprobante: nombreArchivo, // Nombre del archivo
        ComprobanteBase64: archivoBase64, // Archivo en base64
        Notas: values.notas || null,
        UsuarioCreacion: 'WEBUSER',
        FechaModificacion: new Date().toISOString(),
        UsuarioModificacion: 'WEBUSER'
      };

      const resp = await contabilidadService.crearFactura(payload);
      message.success('Factura creada correctamente');

      form.resetFields();
      setFileList([]);
      cargarFacturas(filtroMetodoPago);
     
    } catch (err: any) {
      console.error('Error crear factura', err);
      message.error('No se pudo crear la factura');
    }
  };

  const fetchEstudiantesDebounce = useCallback(
    debounce(async (search: string) => {
      if (search.length < 2) {
        setEstudiantes([]);
        return;
      }
      try {
        const result = await contabilidadService.listarEstudiantesFormulario(search, 20);
        setEstudiantes(result.estudiantes || []);
      } catch (error) {
        message.error('Error buscando estudiantes');
        setEstudiantes([]);
      }
    }, 500),
    []
  );

  const calcularMontoNeto = useCallback((descuentoPorcentaje: number) => {
    if (precioBase <= 0) return;
   
    const descuentoDecimal = descuentoPorcentaje / 100;
    const montoNetoCalculado = Math.round(precioBase * (1 - descuentoDecimal));
   
    form.setFieldsValue({ montoNeto: montoNetoCalculado });
  }, [precioBase, form]);


  const cargarDatosEstudiante = useCallback(async (idPersona: number) => {
    if (!idPersona) return;
    setCargandoEstudiante(true);
    try {
      const result = await contabilidadService.obtenerDatosFormularioEstudiante(idPersona);
      if (result.exito) {
        setDatosEstudiante(result);

        const montoPagado = result.montoPagado || 0;
        setHaPagado(montoPagado > 0);

        const precioBaseCalculado = Math.round((result.montoNeto * 100) / (100 - result.descuentoPorcentaje));
        setPrecioBase(precioBaseCalculado);

        const valores = {
          codigoCurso: result.codigoCurso || '',
          nombreCurso: result.nombreCurso || '',
          correo: result.correoEstudiante || '',
          whatsapp: result.prefijoWhatsApp && result.numeroWhatsApp? `+${result.prefijoWhatsApp} ${result.numeroWhatsApp}`: '',
          pais: result.pais || 'Perú',
          fichaInscripcion: result.fichaInscripcionCompletada === true,
          condicionPago: result.descuentoPorcentaje > 0 ? `${result.descuentoPorcentaje}% dscto`: 'Completo',
          montoPagado: result.montoPagado || 0,
          montoNeto: result.montoNeto || 0,
          numeroCuota: result.numeroCuotas || 1,
          idMetodoPago: result.idMetodoPago || undefined,
        };

        form.setFieldsValue(valores);

        const descuentoOriginal = result.descuentoPorcentaje || 0;
        setTimeout(() => calcularMontoNeto(descuentoOriginal), 100);

        const nuevosLlenos: Record<string, boolean> = {};
        nuevosLlenos.codigoCurso = isDatoReal(result.codigoCurso, 'codigoCurso');
        nuevosLlenos.nombreCurso = isDatoReal(result.nombreCurso, 'nombreCurso');
        nuevosLlenos.correo = isDatoReal(result.correoEstudiante, 'correo');
        nuevosLlenos.whatsapp = !!result.prefijoWhatsApp && !!result.numeroWhatsApp;
        nuevosLlenos.pais = isDatoReal(result.pais, 'pais');
        nuevosLlenos.montoNeto = isDatoReal(result.montoNeto, 'montoNeto');
        nuevosLlenos.montoPagado = isDatoReal(result.montoPagado, 'montoPagado');
        nuevosLlenos.idMetodoPago = !!result.idMetodoPago && result.idMetodoPago > 0;
       
        setCamposLlenos(nuevosLlenos);
      } else {
        message.warning(result.mensaje || 'Estudiante no encontrado. Llena manualmente.');
        setDatosEstudiante(null);
        setHaPagado(false);
        setPrecioBase(0);
      }
    } catch (error) {
      message.error('Error cargando datos del estudiante');
      setDatosEstudiante(null);
      setHaPagado(false);
    } finally {
      setCargandoEstudiante(false);
    }
  }, [form, calcularMontoNeto]);


  const onSelectEstudiante = (value: number, option: any) => {

    if (value) {
      // Resetear campos del formulario
      form.resetFields([
        'codigoCurso',
        'correo', 
        'whatsapp', 
        'pais', 
        'fichaInscripcion', 
        'condicionPago', 
        'montoPagado', 
        'montoNeto', 
        'numeroCuota', 
        'idMetodoPago'
      ]);
      
      // Resetear estados internos
      setCamposLlenos({});
      setHaPagado(false);
      setPrecioBase(0);
      setAutoFillCompleto(false);
    }
    cargarDatosEstudiante(value);
  };

  const onClearEstudiante = () => {
    setDatosEstudiante(null);
    setAutoFillCompleto(false);
    setEstudiantes([]);
    setHaPagado(false);
    setPrecioBase(0);
    setCamposLlenos({});
    
    form.resetFields([
      'codigoCurso',
      'correo', 
      'whatsapp', 
      'pais', 
      'fichaInscripcion', 
      'condicionPago', 
      'montoPagado', 
      'montoNeto', 
      'numeroCuota', 
      'idMetodoPago'
    ]);
  };

  const isDatoReal = (campo: any, nombreCampo: string): boolean => {
    if (!campo || campo === '' || campo === 0 || campo === '0') return false;
   
    // Defaults conocidos
    const defaults = {
      pais: 'Perú',
      numeroCuota: 1,
      condicionPago: 'Completo',
      fichaInscripcion: false
    };
   
    return campo !== defaults[nombreCampo as keyof typeof defaults];
  };

  const handleCondicionPagoChange = useCallback((valor: string) => {
    let descuentoPorcentaje = 0;
   
    if (valor === 'Completo') {
      descuentoPorcentaje = 0;
    } else if (valor.includes('%')) {
      descuentoPorcentaje = parseFloat(valor); // "5" → 5
    } else if (valor.includes('cuotas')) {
      descuentoPorcentaje = 0; // O el descuento que corresponda
    }
   
    calcularMontoNeto(descuentoPorcentaje);
  }, [calcularMontoNeto]);

  const handleMontoPagadoChange = useCallback((valor: number | null) => {
    if (valor !== null && valor > 0 && !datosEstudiante) {
      setHaPagado(true);
    } else if(valor === 0 || valor === null) {
      setHaPagado(false);
    }
  }, [datosEstudiante]);

  useEffect(() => {
    return () => {
      fetchEstudiantesDebounce.cancel();
    };
  }, [fetchEstudiantesDebounce]);

  const handleSearchEstudiantes = (search: string) => {
    fetchEstudiantesDebounce(search);
  };

  return (
    <div className={estilos.container}>
      <div className={estilos.header}>
        <h1 className={estilos.title}>Facturación y registro de ventas</h1>
      </div>

      {/* Filtros + tabla de facturas */}
      <Row
        justify="space-between"
        align="middle"
        className={estilos.filtersContainer}
      >
        <Col flex="1 1 auto">
          <Row gutter={[8, 8]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Modo de pago"
                className={estilos.formItem}
              >
                <Select
                  placeholder="Selecciona método de pago"
                  allowClear
                  virtual={true}
                  listHeight={256}
                  onChange={(value) => handleFiltrarPorMetodoPago(value as string || null)}
                  loading={!metodosPagoList.length}
                >
                  {metodosPagoList.map(m=> (
                    <Option key={m.id} value={m.nombre}>{m.nombre}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={() =>
              document
                .getElementById("registro-venta-anchor")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Registrar nueva venta
          </Button>
        </Col>
      </Row>

      <Card
        title="Listado de facturas"
        className={estilos.facturasTable}
      >
        <Table
          size="small"
          columns={columnasFacturas}
          dataSource={dataFacturas}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* FORMULARIO REGISTRA TU VENTA */}
      <div id="registro-venta-anchor" />

      <Card
        title="Registra tu venta - Revisión Académico IMB"
        className={estilos.registrationCard}
      >
        <p className={estilos.sectionSubtitle}>
          Coloca los datos de tu venta efectuada. Debes tener captura de pago y
          ficha de inscripción completa.
        </p>

        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          {/* PARTE 1 */}
          <div className={estilos.sectionTitle}>
            Parte 1 · Datos comerciales (autollenados pero editables)
          </div>

          <Row
            justify="space-between"
            align="middle"
            className={estilos.formSection}
          >
            <Col>
              <span className={estilos.sectionSubtitle}>
                Estos datos se traen automáticamente del sistema (asesor, sede,
                curso, contacto), pero pueden corregirse antes de guardar.
              </span>
            </Col>
            <Col>
              <a
                href="https://imbinstitute.com/ficha-de-matricula/"
                target="_blank"
                rel="noreferrer"
                className={estilos.sectionSubtitle}
              >
                Ver ficha de inscripción
              </a>
            </Col>
          </Row>

          <Row gutter={[16, 8]}>
            {/* ----- Parte 1 campos ----- */}
            <Col xs={24} md={12}>
              <Form.Item
                label="Asesor comercial"
                name="asesor"
                className={estilos.formItem}
              >
                <Select 
                  placeholder="Selecciona asesor" 
                  allowClear
                  virtual={true}
                  listHeight={256}
                >
                  {personalList.map(p=> (<Option key={p.id} value={p.id}>{p.nombre || `Id ${p.id}`}</Option>))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Sede IMB"
                name="sede"
                initialValue="Umacollo"
                className={estilos.formItem}
              >
                <Select>
                  <Option value="Umacollo">Umacollo (PER)</Option>
                  <Option value="JLByR">JLByR (PER)</Option>
                  <Option value="Santa Cruz">Santa Cruz (BOB)</Option>
                  <Option value="Cordoba">Córdoba (ARG)</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Nombres y apellidos del alumno">
                <div>
                  <Select
                    showSearch
                    allowClear
                    placeholder="Escribe para buscar alumnos"
                    filterOption={false}
                    onSearch={handleSearchEstudiantes}
                    onChange={onSelectEstudiante}
                    onClear={onClearEstudiante}
                    loading={cargandoEstudiante}
                    notFoundContent={cargandoEstudiante ? <Spin size="small" /> : 'Escribe para buscar...'}
                    virtual={true}
                    listHeight={256}
                    style={{ width: '100%' }}

                  >
                    {estudiantes.map((est) => (
                      <Option key={est.idPersona} value={est.idPersona}>
                        {est.nombreCompleto} ({est.correo})
                      </Option>
                    ))}
                  </Select>
                </div>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Nombre/código del curso"
                required
              >
                {datosEstudiante?.nombreCurso && (
                <Input value={`${datosEstudiante.nombreCurso} / ${datosEstudiante.codigoCurso}`} disabled style={{ background: '#f6ffed', color: '#389e0d', cursor: 'not-allowed', marginBottom: 8 }} />
                )}
                <Form.Item
                  name="codigoCurso"
                  rules={[{ required: true, message: 'El código del curso es requerido' }]}
                  noStyle
                >
                  <Input
                    placeholder="Nombre/código del curso"
                    disabled={camposLlenos.codigoCurso}
                    style={!datosEstudiante?.nombreCurso ? {} : { display: 'none' }}
                  />
                </Form.Item>
                </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Correo alumno"
                name="correo"
                rules={[{ required: true, type: 'email' }]}
              >
                <Input placeholder="correo@cliente.com" disabled={camposLlenos.correo} style={camposLlenos.correo ? { background: '#f6ffed', color: '#389e0d', cursor: 'not-allowed' } : {}}/>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="WhatsApp alumno"
                name="whatsapp"
                rules={[{ required: true }]}
              >
                <Input placeholder="+51 900000000" disabled={camposLlenos.whatsapp} style={camposLlenos.whatsapp ? { background: '#f6ffed', color: '#389e0d', cursor: 'not-allowed' } : {}} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="País"
                name="pais"
                className={estilos.formItem}
              >
                <Select
                  showSearch
                  optionFilterProp="children"
                  placeholder="Seleccione un país"
                  disabled={camposLlenos.pais}
                  virtual={true}
                  listHeight={256}
                  style={camposLlenos.pais ? { background: '#f6ffed', color: '#389e0d', cursor: 'not-allowed' } : {}}
                  allowClear
                >
                  <Option value="Angola">Angola</Option>
                  <Option value="Argentina">Argentina</Option>
                  <Option value="Aruba">Aruba</Option>
                  <Option value="Belice">Belice</Option>
                  <Option value="Bolivia">Bolivia</Option>
                  <Option value="Brasil">Brasil</Option>
                  <Option value="Canada">Canada</Option>
                  <Option value="Chile">Chile</Option>
                  <Option value="Colombia">Colombia</Option>
                  <Option value="Costa Rica">Costa Rica</Option>
                  <Option value="Cuba">Cuba</Option>
                  <Option value="Ecuador">Ecuador</Option>
                  <Option value="El Salvador">El Salvador</Option>
                  <Option value="España">España</Option>
                  <Option value="Estados Unidos">Estados Unidos</Option>
                  <Option value="Guatemala">Guatemala</Option>
                  <Option value="Guyana">Guyana</Option>
                  <Option value="Haití">Haití</Option>
                  <Option value="Honduras">Honduras</Option>
                  <Option value="Italia">Italia</Option>
                  <Option value="Kuwait">Kuwait</Option>
                  <Option value="México">México</Option>
                  <Option value="Nicaragua">Nicaragua</Option>
                  <Option value="Panamá">Panamá</Option>
                  <Option value="Paraguay">Paraguay</Option>
                  <Option value="Perú">Perú</Option>
                  <Option value="Puerto Rico">Puerto Rico</Option>
                  <Option value="República Dominicana">República Dominicana</Option>
                  <Option value="Trinidad y Tobago">Trinidad y Tobago</Option>
                  <Option value="United States">United States</Option>
                  <Option value="Uruguay">Uruguay</Option>
                  <Option value="Venezuela">Venezuela</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Ficha de inscripción"
                name="fichaInscripcion"
                valuePropName="checked"
              >
                <Checkbox
                  disabled={!!datosEstudiante}
                  style={datosEstudiante? { color: '#389e0d' } : {}}
                >
                  Ficha completada
                </Checkbox>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Sesiones extra"
                name="sesionesExtra"
                initialValue="Ninguno"
                className={estilos.formItem}
              >
                <Select>
                  <Option value="Ninguno">Ninguno</Option>
                  <Option value="Nivelación Power BI">Nivelación Power BI</Option>
                  <Option value="Inglés">Inglés</Option>
                  <Option value="Express">Express</Option>
                  <Option value="Python">Python</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Sobre el pago"
                name="condicionPago"
                className={estilos.formItem}
              >
                <Select
                  placeholder="Selecciona condición de pago"
                  disabled={haPagado && !!datosEstudiante?.montoPagado}
                  onChange={handleCondicionPagoChange}
                  style={haPagado && !!datosEstudiante?.montoPagado ? { background: '#f6ffed', color: '#389e0d', cursor: 'not-allowed' } : {}}
                >
                  <Option value="Completo">Completo (precio regular)</Option>
                  <Option value="5%">5% dscto</Option>
                  <Option value="10%">10% dscto</Option>
                  <Option value="15%">15% dscto</Option>
                  <Option value="20%">20% dscto</Option>
                  <Option value="25%">25% dscto</Option>
                  <Option value="30%">30% dscto</Option>
                  <Option value="2cuotas">Fraccionado 2 cuotas</Option>
                  <Option value="3cuotas">Fraccionado 3 cuotas</Option>
                  <Option value="4cuotas">Fraccionado 4 cuotas</Option>
                  <Option value="5cuotas">Fraccionado 5 cuotas</Option>
                </Select>
              </Form.Item>
            </Col>

            {/* ----- Separador Parte 2 ----- */}
            <Col span={24}>
              <hr className={estilos.sectionDivider} />
              <div className={estilos.sectionTitle}>
                Parte 2 · Datos de pago (precargados desde el comprobante,
                editables)
              </div>
              <p className={estilos.sectionSubtitle}>
                Estos campos se llenan al subir el comprobante o desde el
                sistema de pagos, pero se pueden ajustar antes de confirmar.
              </p>
            </Col>

            {/* ----- Parte 2 campos ----- */}
            <Col xs={24} md={12}>
              <Form.Item
                label="Monto pagado (moneda original)"
                name="montoPagado"
                className={estilos.formItem}
              >
                <InputNumber<number>
                  className={estilos.amountInput}
                  min={0}
                  step={1}
                  precision={0}
                  formatter={(value) => value ? `$/. ${value.toLocaleString()}` : '$/. 0'}
                  parser={(displayValue) => {
                    if (!displayValue) return 0;
                    const cleaned = displayValue.replace(/[^\d]/g, '');
                    return cleaned ? parseInt(cleaned, 10) || 0 : 0;
                  }}
                  onChange={handleMontoPagadoChange}
                  disabled={haPagado && !!datosEstudiante?.montoPagado}
                  style={haPagado && !!datosEstudiante?.montoPagado ? { background: '#f6ffed', color: '#389e0d', cursor: 'not-allowed' } : {}}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Monto neto (sin comisiones)"
                name="montoNeto"
              >
                <InputNumber<number>
                  className={estilos.amountInput}
                  min={0}
                  step={1}
                  precision={0}
                  disabled={true}
                  style={{
                    background: '#f6ffed',
                    color: '#389e0d',
                    cursor: 'not-allowed'
                  }}
                  formatter={(value) => value ? `$/. ${value.toLocaleString()}` : '$/. 0'}
                  parser={(displayValue) => {
                    if (!displayValue) return 0;
                    const cleaned = displayValue.replace(/[^\d]/g, '');
                    return cleaned ? parseInt(cleaned, 10) || 0 : 0;
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="# de cuotas"
                name="numeroCuota"
                className={estilos.formItem}
              >
                <InputNumber
                  min={1}
                  className={estilos.amountInput}
                  style={autoFillCompleto && datosEstudiante?.numeroCuotas ? { background: '#f6ffed', color: '#389e0d' } : {}}
                  disabled={autoFillCompleto && !!datosEstudiante?.numeroCuotas}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Método de pago"
                name="idMetodoPago"
                required
              >
                <Select
                  placeholder="Selecciona método de pago"
                  loading={!metodosPagoList.length}
                  disabled={autoFillCompleto && !!datosEstudiante?.idMetodoPago}
                  style={camposLlenos.modoPago ? { background: '#f6ffed', color: '#389e0d' } : {}}
                  allowClear
                >
                  {metodosPagoList.map((m: any) => (
                    <Option key={m.id} value={m.id}>{m.nombre}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Sube tu captura (PDF o imagen)"
                name="comprobante"
                className={estilos.formItem}
              >
                <Upload
                  beforeUpload={(file) => {
                    setFileList([file]);
                    return false;
                  }}
                  onRemove={() => {
                    setFileList([]);
                  }}
                  fileList={fileList}
                  maxCount={1}
                  accept=".pdf,image/*"
                >
                  <Button
                    icon={<UploadOutlined />}
                    className={estilos.uploadButton}
                  >
                    Seleccionar archivo
                  </Button>
                </Upload>
                {fileList.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#52c41a' }}>
                    ✓ Archivo seleccionado: {fileList[0].name}
                  </div>
                )}
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Notas internas"
                name="notas"
                className={estilos.formItem}
              >
                <Input placeholder="Observaciones para área académica / contabilidad" />
              </Form.Item>
            </Col>

            {/* Botones */}
            <Col xs={24}>
              <Row justify="end" gutter={8} style={{ marginTop: 16 }}>
                <Col>
                  <Button onClick={() => {
                    form.resetFields();
                    setFileList([]);
                  }}>
                    Cancelar
                  </Button>
                </Col>
                <Col>
                  <Button type="primary" htmlType="submit">
                    Guardar venta y generar factura
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Modal para editar factura */}
      <Modal
        title={`Editar Factura ${facturaSeleccionada?.factura || ''}`}
        visible={showEditModal}
        onCancel={() => setShowEditModal(false)}
        footer={null}
        width={500}
      >
        <Form
          layout="vertical"
          form={editForm}
          onFinish={handleActualizarFactura}
        >
          <Form.Item
            label="Estado de la factura"
            name="estadoFactura"
            rules={[{ required: true, message: 'Selecciona un estado' }]}
          >
            <Select>
              <Option value="Pagado">Pagado</Option>
              <Option value="Pendiente">Pendiente</Option>
              <Option value="Parcial">Parcial</Option>
              <Option value="Vencido">Vencido</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Monto pagado"
            name="montoPagado"
            rules={[{ required: true, message: 'Ingresa el monto pagado' }]}
          >
            <InputNumber<number>
              style={{ width: '100%' }}
              min={0}
              step={1}
              precision={0}
              formatter={(value) => value ? `S/. ${value.toLocaleString()}` : 'S/. 0'}
              parser={(displayValue) => {
                if (!displayValue) return 0;
                const cleaned = displayValue.replace(/[^\d]/g, '');
                return cleaned ? parseInt(cleaned, 10) || 0 : 0;
              }}
            />
          </Form.Item>

          <Form.Item>
            <Row gutter={8} justify="end">
              <Col>
                <Button onClick={() => setShowEditModal(false)}>
                  Cancelar
                </Button>
              </Col>
              <Col>
                <Button type="primary" htmlType="submit">
                  Actualizar factura
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Facturacion;