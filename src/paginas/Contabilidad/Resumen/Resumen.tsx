import React, { useEffect, useState } from "react";
import { Row, Col, Card, Statistic, Table, Button, Tag, Modal, Form, Input, Select, DatePicker, InputNumber, message } from "antd";
import ECharts from "../../../componentes/Grafico/ECharts";
import estilos from "./Resumen.module.css";
import contabilidadService from '../../../servicios/contabilidadService';
import { getCookie } from '../../../utils/cookies';

const Resumen: React.FC = () => {
  const gastosRecientesColumns = [
    { title: "Concepto", dataIndex: "concepto" },
    { title: "Área", dataIndex: "area" },
    { title: "Responsable", dataIndex: "responsable" },
    { title: "Monto", dataIndex: "monto", align: "right" as const },
  ];

  const [kpis, setKpis] = useState({ ingresosMes: 0, egresosMes: 0, resultadoNeto: 0, pagosPendientes: 0, alumnosPendientes: 0 });
  const [ingresosPorTipo, setIngresosPorTipo] = useState<any[]>([]);
  const [gastosPorArea, setGastosPorArea] = useState<any[]>([]);
  const [gastosRecientesData, setGastosRecientesData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [showIngresoModal, setShowIngresoModal] = useState(false);
  const [areasTrabajoList, setAreasTrabajoList] = useState<any[]>([]);
  const [responsablesList, setResponsablesList] = useState<any[]>([]);

  const fetchResumen = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const mes = today.getMonth() + 1;
      const anio = today.getFullYear();
      const res = await contabilidadService.obtenerResumenFinanciero(mes, anio);
      const data = res?.data ?? res;

      const k = data?.kpis ?? {};
      setKpis({
        ingresosMes: k.ingresosMes ?? k.IngresosMes ?? 0,
        egresosMes: k.egresosMes ?? k.EgresosMes ?? 0,
        resultadoNeto: k.resultadoNeto ?? k.ResultadoNeto ?? 0,
        pagosPendientes: k.pagosPendientes ?? k.PagosPendientes ?? 0,
        alumnosPendientes: k.alumnosPendientes ?? k.AlumnosPendientes ?? 0,
      });

      const ingresos = data?.ingresosPorTipo || data?.IngresosPorTipo || [];
      setIngresosPorTipo(Array.isArray(ingresos) ? ingresos : []);

      const gastosArea = data?.gastosPorArea || data?.GastosPorArea || [];
      setGastosPorArea(Array.isArray(gastosArea) ? gastosArea : []);

      const gastosRec = data?.gastosRecientes || data?.GastosRecientes || [];
      if (Array.isArray(gastosRec)) {
        setGastosRecientesData(
          gastosRec.map((g: any, i: number) => ({
            key: g.id ?? i + 1,
            concepto: g.concepto || g.Concepto || g.descripcion || g.Descripcion || '-',
            area: g.area || g.Area || g.nombreArea || g.NombreArea || '-',
            responsable: g.responsable || g.Responsable || g.usuario || g.Usuario || '-',
            monto: typeof g.monto === 'number' ? g.monto : (g.monto ?? g.Monto ?? 0),
            fechaGasto: g.fechaGasto || g.FechaGasto || g.fecha || null,
            tipoGasto: g.tipoGasto || g.TipoGasto || g.tipo || null,
          }))
        );
      }
    } catch (e) {
      console.warn("No se pudo cargar resumen financiero:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ fetchResumen(); }, []);

  useEffect(()=>{
    const loadLookups = async () => {
      try {
        const token = getCookie('token');

        const areasRes = await fetch(`${import.meta.env.VITE_API_URL}/api/CFGModUsuarios/ObtenerAreaTrabajo`, { headers: { accept: '*/*', Authorization: `Bearer ${token}` } });
        if (areasRes.ok) {
          const data = await areasRes.json();
          const lista = Array.isArray(data.areaTrabajo) ? data.areaTrabajo.filter((a:any)=>a.estado) : [];
          setAreasTrabajoList(lista.map((a:any)=>({ id: a.id ?? a.Id, nombre: a.Nombre ?? a.nombre ?? a.areaTrabajo ?? a.AreaTrabajo })));
        }

        const usuariosRes = await fetch(`${import.meta.env.VITE_API_URL}/api/CFGModUsuarios/ListarConUsuario?page=1&pageSize=1000`, { headers: { accept: '*/*', Authorization: `Bearer ${token}` } });
        if (usuariosRes.ok) {
          const udata = await usuariosRes.json();
          const usuarios = Array.isArray(udata.usuarios) ? udata.usuarios : [];
          setResponsablesList(usuarios.map((u:any)=>({ id: u.idPersonall ?? u.idPersonal ?? u.id, nombre: `${u.nombres || ''} ${u.apellidos || ''}`.trim() })));
        }
      } catch(e){
        console.warn('Error loading lookup lists', e);
      }
    };
    loadLookups();
  },[]);

  const opcionesBarrasIngresos = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['Ventas Cursos', 'Certificados', 'Otros Servicios'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'] },
    yAxis: { type: 'value' },
    series: [] as any[],
  };

  const opcionesDonaGastos = {
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: S/. {c} ({d}%)' },
    legend: { orient: 'vertical', right: '10%', top: 'center', itemGap: 2, textStyle: { fontSize: 10 }, width: '80%' },
    series: [
      {
        name: 'Gastos por Área',
        type: 'pie',
        center: ['25%', '50%'],
        radius: ['50%', '30%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: '16', fontWeight: 'bold' } },
        labelLine: { show: false },
        data: [] as any[],
      }
    ]
  };

  const ingresosOption = (() => {
    if (!ingresosPorTipo || ingresosPorTipo.length === 0) return opcionesBarrasIngresos;
    const categories = ingresosPorTipo.map((r:any) => r.mesNombre || r.mesNombre || (r.mes ? `M.${r.mes}` : ''));
    const ventas = ingresosPorTipo.map((r:any) => r.ventasCursos ?? r.VentasCursos ?? r.ventas ?? 0);
    const certs = ingresosPorTipo.map((r:any) => r.certificados ?? r.Certificados ?? r.certificados ?? 0);
    const otros = ingresosPorTipo.map((r:any) => r.otrosServicios ?? r.OtrosServicios ?? r.otros ?? 0);
    return {
      ...opcionesBarrasIngresos,
      xAxis: { type: 'category', data: categories },
      series: [
        { name: 'Ventas Cursos', type: 'bar', data: ventas, itemStyle: { color: '#1890ff' } },
        { name: 'Certificados', type: 'bar', data: certs, itemStyle: { color: '#52c41a' } },
        { name: 'Otros Servicios', type: 'bar', data: otros, itemStyle: { color: '#faad14' } },
      ]
    } as any;
  })();

  const donaOption = (() => {
    const data = gastosPorArea && gastosPorArea.length ? gastosPorArea.map((g:any) => ({ value: g.montoTotal ?? g.monto ?? g.valor ?? g.total ?? 0, name: g.area ?? g.nombre ?? g.Name })) : opcionesDonaGastos.series[0].data;
    return { ...opcionesDonaGastos, series: [{ ...(opcionesDonaGastos.series[0]), data }] };
  })();

  return (<>
    <div className={estilos.container}>
      <div className={estilos.contentWrapper}>
        <h1 className={estilos.title}>Resumen financiero general</h1>

        {/* KPIs */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className={estilos.metricCard}>
              <Statistic title="Ingresos del mes (ventas cursos)" value={kpis.ingresosMes} precision={2} prefix="S/." />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className={estilos.metricCard}>
              <Statistic title="Egresos del mes (gastos)" value={kpis.egresosMes} precision={2} prefix="S/." />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className={estilos.metricCard}>
              <Statistic title="Resultado neto" value={kpis.resultadoNeto} precision={2} prefix="S/." />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className={estilos.metricCard}>
              <Statistic title="Pagos pendientes" value={kpis.pagosPendientes} precision={2} prefix="S/." />
            </Card>
          </Col>
        </Row>

        {/* Ingresos vs gastos por tipo / área */}
        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col xs={24} md={16}>
            <Card className={estilos.chartCard} title="Ingresos generales por tipo" extra={<Tag color="blue">Cursos · Certificados · Otros</Tag>}>
              <div style={{ height: '300px' }}>
                <ECharts option={ingresosOption} />
              </div>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card className={estilos.chartCard} title="Gastos por área" extra={<Tag color="blue">Académico · Marketing · Administración</Tag>}>
              <div className={estilos.chartPlaceholder}>
                <ECharts option={donaOption} />
              </div>
            </Card>
          </Col>
        </Row>

        {/* Gastos recientes + acciones rápidas */}
        <Row gutter={[16, 16]} className={estilos.section}>
          <Col xs={24} md={16}>
            <Card title="Gastos generales recientes" className={estilos.expensesTable}>
              <Table
                size="small"
                columns={gastosRecientesColumns}
                dataSource={gastosRecientesData.map((r:any)=>({ ...r, monto: `S/. ${Number(r.monto).toFixed(2)}`, fechaGasto: r.fechaGasto }))}
                pagination={false}
                rowKey={(r:any)=>r.key}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card title="Control rápido" className={estilos.quickControl}>
              <p className={estilos.quickControlText}>Desde aquí puedes añadir o eliminar gastos o ingresos manuales del mes para ajustar la contabilidad.</p>
              <Button type="primary" className={estilos.actionButton} onClick={()=>setShowGastoModal(true)}>Añadir gasto general</Button>
              <Button className={estilos.actionButton} onClick={()=>setShowIngresoModal(true)}>Añadir ingreso manual</Button>
            </Card>
          </Col>
        </Row>
      </div>
    </div>

    {/* Modales para agregar gasto/ingreso */}
    <Modal title="Añadir gasto general" visible={showGastoModal} onCancel={()=>setShowGastoModal(false)} footer={null}>
      <Form layout="vertical" onFinish={async (values)=>{
        try {
          const payload = {
            Concepto: values.concepto,
            Descripcion: values.descripcion || null,
            TipoGasto: values.tipoGasto,
            IdAreaTrabajo: values.idAreaTrabajo || null,
            IdResponsable: values.idResponsable || null,
            Monto: Number(values.monto) || 0,
            Moneda: values.moneda || 'PEN',
            FechaGasto: values.fechaGasto?.format ? values.fechaGasto.format('YYYY-MM-DD') : values.fechaGasto,
            RutaComprobante: null,
            NumeroComprobante: values.numeroComprobante || null,
            UsuarioCreacion: values.usuarioCreacion || 'ANGEL'
          };
          await contabilidadService.crearGasto(payload);
          message.success('Gasto creado correctamente');
          setShowGastoModal(false);
          fetchResumen();
        } catch(e){
          console.error(e);
          message.error('Error al crear gasto');
        }
      }}>
        <Form.Item name="concepto" label="Concepto" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="descripcion" label="Descripción">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="tipoGasto" label="Tipo gasto" rules={[{ required: true }]}>
          <Select>
            <Select.Option value="Sueldos">Sueldos</Select.Option>
            <Select.Option value="Publicidad">Publicidad</Select.Option>
            <Select.Option value="Plataformas">Plataformas</Select.Option>
            <Select.Option value="Otros">Otros</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="idAreaTrabajo" label="Área (opcional)">
          <Select allowClear placeholder="Selecciona un área">
            {areasTrabajoList.map(a=> (<Select.Option key={a.id} value={a.id}>{a.nombre}</Select.Option>))}
          </Select>
        </Form.Item>
        <Form.Item name="idResponsable" label="Responsable (opcional)">
          <Select allowClear placeholder="Selecciona responsable">
            {responsablesList.map(r=> (<Select.Option key={r.id} value={r.id}>{r.nombre || `Id ${r.id}`}</Select.Option>))}
          </Select>
        </Form.Item>
        <Form.Item name="monto" label="Monto" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item name="moneda" label="Moneda">
          <Select defaultValue="PEN">
            <Select.Option value="PEN">PEN</Select.Option>
            <Select.Option value="USD">USD</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="fechaGasto" label="Fecha" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="numeroComprobante" label="Número comprobante">
          <Input />
        </Form.Item>
        <Form.Item name="usuarioCreacion" label="Usuario" initialValue={'ANGEL'}>
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Guardar gasto</Button>
        </Form.Item>
      </Form>
    </Modal>

    <Modal title="Añadir ingreso manual" visible={showIngresoModal} onCancel={()=>setShowIngresoModal(false)} footer={null}>
      <Form layout="vertical" onFinish={async (values)=>{
        try {
          const tipoIngresoNormalizado = values.tipoIngreso === "Ventas Cursos" ? "Ventas Cursos" : values.tipoIngreso;

          const payload = {
            Concepto: values.concepto,
            Descripcion: values.descripcion || null,
            TipoIngreso: tipoIngresoNormalizado,
            Monto: Number(values.monto) || 0,
            Moneda: values.moneda || 'PEN',
            FechaIngreso: values.fechaIngreso?.format ? values.fechaIngreso.format('YYYY-MM-DD') : values.fechaIngreso,
            UsuarioCreacion: values.usuarioCreacion || 'SYSTEM'
          };
          await contabilidadService.crearIngreso(payload);
          message.success('Ingreso creado correctamente');
          setShowIngresoModal(false);
          await fetchResumen();
        } catch(e){
          console.error(e);
          message.error('Error al crear ingreso');
        }
      }}>
        <Form.Item name="concepto" label="Concepto" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="descripcion" label="Descripción">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="tipoIngreso" label="Tipo ingreso" rules={[{ required: true }]}>
          <Select>
            <Select.Option value="Ventas Cursos">Ventas Cursos</Select.Option>
            <Select.Option value="Certificados">Certificados</Select.Option>
            <Select.Option value="Otros Servicios">Otros Servicios</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="monto" label="Monto" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item name="moneda" label="Moneda">
          <Select defaultValue="PEN">
            <Select.Option value="PEN">PEN</Select.Option>
            <Select.Option value="USD">USD</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="fechaIngreso" label="Fecha" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="usuarioCreacion" label="Usuario" initialValue={'ANGEL'}>
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Guardar ingreso</Button>
        </Form.Item>
      </Form>
    </Modal>
  </>);
};

export default Resumen;