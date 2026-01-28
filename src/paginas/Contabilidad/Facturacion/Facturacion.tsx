import React, { useEffect, useState } from "react";
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
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import estilos from "./Facturacion.module.css";
import contabilidadService from '../../../servicios/contabilidadService';
import { getCookie } from '../../../utils/cookies';
import * as ProductoService from '../../../servicios/ProductoService';
import { message } from 'antd';

const { Option } = Select;

const Facturacion: React.FC = () => {
  const [form] = Form.useForm();

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
      render: () => (
        <>
          <Button size="small" className={estilos.actionButton}>
            Ver
          </Button>
          <Button size="small" className={estilos.actionButton}>
            PDF
          </Button>
          <Button size="small">⋮</Button>
        </>
      ),
    },
  ];

  const [dataFacturas, setDataFacturas] = useState<any[]>([]);
  const [personalList, setPersonalList] = useState<any[]>([]);
  const [contactosList, setContactosList] = useState<any[]>([]);
  const [productosList, setProductosList] = useState<any[]>([]);
  const [metodosPagoList, setMetodosPagoList] = useState<any[]>([
    { id: 1, nombre: 'Tarjeta de crédito' },
    { id: 2, nombre: 'Pago efectivo' },
  ]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await contabilidadService.listarFacturas({ page: 1, pageSize: 10 });
        const data = res?.data ?? res;
        const filas = data?.facturas || data?.filas || data?.rows || data?.list || [];
        // Map to UI shape
        const mapped = (filas || []).map((f: any, i: number) => ({
          key: f.id ?? i + 1,
          factura: f.numeroFactura || f.factura || `#F-${f.id}`,
          contacto: f.contacto || f.nombreContacto || f.cliente || "-",
          curso: f.curso || f.codigoCurso || "-",
          montoNeto: f.montoNeto ? `S/. ${f.montoNeto}` : (f.monto ? `S/. ${f.monto}` : "S/. 0"),
          estado: f.estado || f.estadoFactura || "Pendiente",
        }));
        setDataFacturas(mapped);
      } catch (e) {
        console.warn('No se pudieron listar facturas', e);
      }
    };

    const loadLookups = async () => {
      try {
        const token = getCookie('token');

        // Personal / contactos (usar ListarConUsuario)
        const usuariosRes = await fetch(`${import.meta.env.VITE_API_URL}/api/CFGModUsuarios/ListarConUsuario?page=1&pageSize=1000`, { headers: { accept: '*/*', Authorization: `Bearer ${token}` } });
        if (usuariosRes.ok) {
          const udata = await usuariosRes.json();
          const usuarios = Array.isArray(udata.usuarios) ? udata.usuarios : [];
          setPersonalList(usuarios.map((u:any)=>({ id: u.idPersonall ?? u.idPersonal ?? u.id, nombre: `${u.nombres || ''} ${u.apellidos || ''}`.trim() })));
          setContactosList(usuarios.map((u:any)=>({ id: u.idPersonall ?? u.idPersonal ?? u.id, nombre: `${u.nombres || ''} ${u.apellidos || ''}`.trim() })));
        }

        // Productos (código / nombre)
        try {
          const productos = await ProductoService.obtenerProductos();
          setProductosList(productos.map((p:any)=>({ id: p.id, codigo: p.codigoLanzamiento ?? p.CodigoLanzamiento ?? p.codigo ?? p.Codigo ?? p.codigoLanzamiento, nombre: p.nombre || p.Nombre })));
        } catch (err) {
          console.warn('No se pudieron cargar productos', err);
        }

        // No llamar al backend para métodos de pago; usar solo las dos opciones fijas.
        setMetodosPagoList([
          { id: 1, nombre: 'Tarjeta de crédito' },
          { id: 2, nombre: 'Pago efectivo' },
        ]);
      } catch (e) {
        console.warn('Error cargando lookups', e);
      }
    };

    load();
    loadLookups();
  }, []);

  const handleSubmit = (values: any) => {
    const payload = {
      IdAsesor: isNaN(Number(values.asesor)) ? null : Number(values.asesor),
      Sede: values.sede || null,
      CodigoCurso: values.codigoCurso || null,
      IdContacto: isNaN(Number(values.contacto)) ? null : Number(values.contacto),
      Pais: values.pais || null,
      CorreoCliente: values.correo || null,
      WhatsAppCliente: values.whatsapp || null,
      FichaInscripcionCompleta: values.fichaInscripcion === 'Si' || values.fichaInscripcion === true,
      SesionesExtra: values.sesionesExtra || null,
      CondicionPago: values.condicionPago || null,
      MontoTotal: Number(values.montoPagado) || Number(values.montoTotal) || 0,
      MontoNeto: Number(values.montoNeto) || 0,
      NumeroCuota: Number(values.numeroCuota) || 1,
      IdMetodoPago: isNaN(Number(values.modoPago)) ? null : Number(values.modoPago),
      RutaComprobante: null,
      Notas: values.notas || null,
      UsuarioCreacion: 'WEBUSER',
      FechaModificacion: new Date().toISOString(),
      UsuarioModificacion: 'WEBUSER'
    };

    contabilidadService.crearFactura(payload).then((resp:any)=>{
      message.success('Factura creada correctamente');
      // refrescar lista
      contabilidadService.listarFacturas({ page:1, pageSize:10 }).then((r:any)=>{
        const data = r?.data ?? r;
        const filas = data?.facturas || data?.filas || data?.rows || [];
        const mapped = (filas || []).map((f: any, i: number) => ({
          key: f.id ?? i + 1,
          factura: f.numeroFactura || f.factura || `#F-${f.id}`,
          contacto: f.contacto || f.nombreContacto || f.cliente || "-",
          curso: f.curso || f.codigoCurso || "-",
          montoNeto: f.montoNeto ? `S/. ${f.montoNeto}` : (f.monto ? `S/. ${f.monto}` : "S/. 0"),
          estado: f.estado || f.estadoFactura || "Pendiente",
        }));
        setDataFacturas(mapped);
      }).catch(()=>{});
    }).catch((err:any)=>{
      console.error('Error crear factura', err);
      message.error('No se pudo crear la factura');
    });
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
                name="modoPago"
                className={estilos.formItem}
              >
                <Select placeholder="Selecciona método de pago" allowClear>
                  {metodosPagoList.map(m=> (<Option key={m.id} value={m.id}>{m.nombre}</Option>))}
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
        //</div>extra={
          //<>
            //<Button className={estilos.actionButton}>Exportar</Button>
            //</><Button>Enviar recordatorios</Button>
          //</>
        //}
        className={estilos.facturasTable}
      >
        <Table
          size="small"
          columns={columnasFacturas}
          dataSource={dataFacturas}
          pagination={false}
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
                <Select placeholder="Selecciona asesor" allowClear>
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
              <Form.Item
                label="Código del taller/curso"
                name="codigoCurso"
                className={estilos.formItem}
                rules={[{ required: true, message: 'El código del curso es requerido' }]}
              >
                <Input placeholder="Ingresa código del curso" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Nombres y apellidos del contacto"
                name="contacto"
                className={estilos.formItem}
              >
                <Select placeholder="Selecciona contacto" showSearch optionFilterProp="children" allowClear>
                  {contactosList.map(c=> (<Option key={c.id} value={c.id}>{c.nombre || `Id ${c.id}`}</Option>))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Correo del cliente"
                name="correo"
                className={estilos.formItem}
                rules={[{ required: true, message: 'El correo es requerido' }, { type: 'email', message: 'Ingrese un correo válido' }]}
              >
                <Input placeholder="correo@cliente.com" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="WhatsApp del cliente"
                name="whatsapp"
                className={estilos.formItem}
                rules={[{ required: true, message: 'El WhatsApp es requerido' }]}
              >
                <Input placeholder="+51 9xxxxxxxx" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="País"
                name="pais"
                initialValue="Perú"
                className={estilos.formItem}
              >
                <Select showSearch optionFilterProp="children">
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
                label="Ficha de inscripción completada"
                name="fichaInscripcion"
                initialValue="Si"
                className={estilos.formItem}
              >
                <Select>
                  <Option value="Si">Sí</Option>
                  <Option value="No">No</Option>
                </Select>
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
                  <Option value="Nivelación Power BI">
                    Nivelación Power BI
                  </Option>
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
                initialValue="Completo"
                className={estilos.formItem}
              >
                <Select>
                  <Option value="Completo">
                    Completo (precio regular)
                  </Option>
                  <Option value="5">5% dscto</Option>
                  <Option value="10">10% dscto</Option>
                  <Option value="15">15% dscto</Option>
                  <Option value="20">20% dscto</Option>
                  <Option value="25">25% dscto</Option>
                  <Option value="30">30% dscto</Option>
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
                initialValue={650}
                className={estilos.formItem}
              >
                <InputNumber<number>
                  className={estilos.amountInput}
                  min={0}
                  step={0.01}
                  formatter={(value) => `S/. ${value}`}
                  parser={(value) => {
                    const parsedValue = (value || "").replace(/[^\d.]/g, "");
                    return parsedValue ? parseFloat(parsedValue) : 0;
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Monto neto (sin comisiones)"
                name="montoNeto"
                initialValue={630}
                className={estilos.formItem}
              >
                <InputNumber<number>
                  className={estilos.amountInput}
                  min={0}
                  step={0.01}
                  formatter={(value) => `S/. ${value}`}
                  parser={(value) => {
                    const parsedValue = (value || "").replace(/[^\d.]/g, "");
                    return parsedValue ? parseFloat(parsedValue) : 0;
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="# de cuota"
                name="numeroCuota"
                initialValue={1}
                className={estilos.formItem}
              >
                <InputNumber min={1} className={estilos.amountInput} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Modo de pago"
                name="modoPago"
                className={estilos.formItem}
              >
                <Select placeholder="Selecciona método de pago" allowClear>
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
                valuePropName="fileList"
                getValueFromEvent={(e) =>
                  Array.isArray(e) ? e : e && e.fileList
                }
                className={estilos.formItem}
              >
                <Upload
                  beforeUpload={() => false}
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
                  <Button>Cancelar</Button>
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
    </div>
  );
};

export default Facturacion;
