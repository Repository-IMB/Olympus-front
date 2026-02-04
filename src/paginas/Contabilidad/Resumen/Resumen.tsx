import React, { useEffect, useState, useMemo } from "react";
import { Row, Col, Card, Statistic, Table, Button, Tag, Modal, Form, Input, Select, DatePicker, InputNumber, message, Space } from "antd";
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
  const [cursosData, setCursosData] = useState<any[]>([]);
  const [tipoCursoSeleccionado, setTipoCursoSeleccionado] = useState<number>(20);
  const [metricaSeleccionada, setMetricaSeleccionada] = useState<'ingresos' | 'ventas'>('ingresos');
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [buscadorCurso, setBuscadorCurso] = useState<string>('');
  const [cursoEspecificoData, setCursoEspecificoData] = useState<any>(null);
  const [modoCursoEspecifico, setModoCursoEspecifico] = useState<boolean>(false);
  const [loadingCursoEspecifico, setLoadingCursoEspecifico] = useState(false);

  useEffect(()=>{ 
    fetchResumen(); 
  }, []);

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

  useEffect(() => {
    if (!modoCursoEspecifico) {
      fetchCursos();
    }
  }, [tipoCursoSeleccionado, metricaSeleccionada, modoCursoEspecifico]);

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

  const fetchCursos = async () => {
    setLoadingCursos(true);
    try {
        const response = await contabilidadService.obtenerEstadisticasCursos(tipoCursoSeleccionado);
        const data = response?.data ?? response;
        setCursosData(data?.cursos || data?.Cursos || []);
    } catch (error) {
        console.error('Error cargando estadísticas de cursos:', error);
        message.error('No se pudieron cargar los cursos');
        setCursosData([]);
    } finally {
        setLoadingCursos(false);
    }
  };

  const fetchCursoEspecifico = async () => {
    if (!buscadorCurso.trim()) {
      setModoCursoEspecifico(false);
      setCursoEspecificoData(null);
      return;
    }

    setLoadingCursoEspecifico(true);
    try {
      // Cambiar nombre del método si es necesario
      const response = await contabilidadService.obtenerEstadisticasCursoEspecifico(
        buscadorCurso.trim(), 
        tipoCursoSeleccionado
      );
      const data = response?.data ?? response;
      
      if (data.exito && data.resumen?.length > 0 && data.ventasDiarias?.length > 0) {
        setCursoEspecificoData(data);
        setModoCursoEspecifico(true);
        
        // Calcular ranking
        const todosCursosResponse = await contabilidadService.obtenerEstadisticasCursos(tipoCursoSeleccionado);
        const cursos = todosCursosResponse?.data?.cursos || todosCursosResponse?.cursos || [];
        const cursoEncontrado = data.resumen[0];
        
        const rankingIngresos = cursos
          .sort((a: any, b: any) => (b.ingresos || b.Ingresos || 0) - (a.ingresos || a.Ingresos || 0))
          .findIndex((c: any) => (c.nombre || c.Nombre) === cursoEncontrado.nombre) + 1;
          
        const rankingVentas = cursos
          .sort((a: any, b: any) => (b.ventas || b.Ventas || 0) - (a.ventas || a.Ventas || 0))
          .findIndex((c: any) => (c.nombre || c.Nombre) === cursoEncontrado.nombre) + 1;
        
        message.success(`#${rankingIngresos} Ingresos | #${rankingVentas} Ventas`);
        console.log(`📊 ${cursoEncontrado.nombre}: #${rankingIngresos} Ingresos | #${rankingVentas} Ventas`);
      } else {
        message.warning('Curso no encontrado');
        setModoCursoEspecifico(false);
      }
    } catch (error) {
      console.error('Error buscando curso específico:', error);
      message.error('Error al buscar curso');
      setModoCursoEspecifico(false);
    } finally {
      setLoadingCursoEspecifico(false);
    }
  };

  // Graficos
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

  const cursosBarOption = (() => {
    if (!cursosData || cursosData.length === 0) {
      return {
        title: { text: 'Ingresos generales por tipo', left: 'center' },
        xAxis: { type: 'value'},
        yAxis: { type: 'category', data: [] },
        series: [{ type: 'bar', data: [], label: { show: true, position: 'right' } }]
      };
    }

    // Top 10 cursos con más ingresos
    const top10 = cursosData
      .sort((a: any, b: any) => {
        const valorA = metricaSeleccionada === 'ingresos' 
          ? (a.ingresos || a.Ingresos || 0)
          : (a.ventas || a.Ventas || 0);
        const valorB = metricaSeleccionada === 'ingresos' 
          ? (b.ingresos || b.Ingresos || 0)
          : (b.ventas || b.Ventas || 0);
        return valorB - valorA;
      })
      .slice(0, 10);
    const nombres = top10.map((c: any) => c.nombre || c.Nombre || 'Sin nombre');
    const valores = top10.map((c: any) => 
      metricaSeleccionada === 'ingresos' 
        ? (c.ingresos || c.Ingresos || 0)
        : (c.ventas || c.Ventas || 0)
    );
    const unidad = metricaSeleccionada === 'ingresos' ? '$/.' : '';

    return {
      tooltip: { 
        trigger: 'item', 
        formatter: (params: any) => {
          const valor = metricaSeleccionada === 'ingresos' ? `$/. ${params.value?.toLocaleString('es-PE')}` : params.value;
          return `${params.name}<br/>${metricaSeleccionada === 'ingresos' ? 'Ingresos' : 'Ventas'}: ${valor}`;
        }
      },
      grid: { left: '2%', top: '15%', right: '15%', bottom: '15%', containLabel: true },
      xAxis: { 
        type: 'value', 
        axisLabel: { 
          show: false,
          formatter: (value: number) => value.toLocaleString('es-PE')
        }
      },
      yAxis: { 
        type: 'category',
        data: nombres,
        inverse: true,
        axisLabel: {
        fontSize: 11,
        rotate: 0,
        width: 300,
        overflow: 'truncate',
        interval: 0
      }
      },
      series: [{
        name: metricaSeleccionada.toUpperCase(),
        type: 'bar',
        data: valores,
        itemStyle: { 
          color: '#1890ff'
        },
        label: { 
          show: true, 
          position: 'right',
          formatter: (params: any) => {
            const valor = metricaSeleccionada === 'ingresos' 
              ? `$/. ${params.value?.toLocaleString('es-PE')}`
              : params.value;
            return valor;
          },
          fontSize: 10,
          color: '#1f2937'
        }
      }]
    };
  })();

  const cursoAreaOption = useMemo(() => {
    if (!cursoEspecificoData?.ventasDiarias?.length) {
      return {
        title: { text: 'Evolución del curso', left: 'left' },
        tooltip: { trigger: 'axis' },
        grid: { left: '10%', right: '10%', bottom: '15%', top: '15%' },
        xAxis: { type: 'category', data: [] },
        yAxis: { type: 'value' },
        series: []
      };
    }

    const ventasDiarias = cursoEspecificoData.ventasDiarias;
    const nombreCurso = cursoEspecificoData.resumen?.[0]?.nombre || 'Curso';

    const fechas = ventasDiarias.map((v: any) => v.fechaFormateada);
    const ingresos = ventasDiarias.map((v: any) => parseFloat(v.ingresoVenta) || 0);

    return {
      title: { 
        text: `${nombreCurso} - Evolución (${ventasDiarias.length} ventas)`, 
        left: 'left',
        textStyle: { fontSize: 14, fontWeight: 'bold' }
      },
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          const idx = params[0]?.dataIndex;
          const venta = ventasDiarias[idx];
          if (!venta) return 'Sin datos';
          const ingresoFormateado = parseFloat(venta.ingresoVenta).toLocaleString('es-PE', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          });
          return `
            <strong>${venta.fechaFormateada}</strong><br/>
            ${venta.diaSemana}<br/>
            <strong>$/. ${ingresoFormateado}</strong><br/>
            Venta ID: ${venta.ventaId}
          `;
        },
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: '#1890ff',
        borderWidth: 1,
        textStyle: { fontSize: 12 }
      },
      grid: { left: '10%', right: '10%', bottom: '20%', top: '20%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: fechas,
        axisLabel: { rotate: -45, fontSize: 10, interval: 0, color: '#666' },
        axisLine: {
          lineStyle: { color: '#ddd' }
        }
      },
      yAxis: { 
        type: 'value',
        nameLocation: 'middle',
        nameGap: 45,
        nameTextStyle: { fontSize: 12, fontWeight: 'bold', color: '#333' },
        axisLabel: {
          formatter: (value: number) => `S/. ${value.toFixed(0)}`,
          fontSize: 11,
          color: '#666'
        },
        axisLine: {
          lineStyle: { color: '#ddd' }
        },
        splitLine: {
          lineStyle: { type: 'dashed', color: '#f0f0f0' }
        }
      },
      series: [{
        name: 'Ingresos diarios',
        type: 'line',
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#1890ff',
          borderColor: '#fff',
          borderWidth: 2
        },
        areaStyle: { 
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.6)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
            ]
          }
        },
        lineStyle: { 
          color: '#1890ff', 
          width: 3 ,
          shadowColor: 'rgba(24, 144, 255, 0.3)',
          shadowBlur: 10
        },
        data: ingresos,
        smooth: 0.3,
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(24, 144, 255, 0.5)'
          }
        }
      }]
    };
  },[cursoEspecificoData]);


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
          <Col xs={16}>
            <Card 
              className={estilos.chartCard} 
              title={
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span>Ingresos generales por tipo</span>
                  <Input.Search
                    placeholder="Buscar curso específico (ej: Power BI)..." 
                    value={buscadorCurso} 
                    onChange={(e) => setBuscadorCurso(e.target.value)} 
                    onSearch={fetchCursoEspecifico} 
                    enterButton={
                      <Space> 
                        Buscar 
                        {modoCursoEspecifico && ( 
                          <Button 
                          size="small" 
                          type="text" 
                          onClick={() => { 
                            setBuscadorCurso(''); 
                            setModoCursoEspecifico(false); 
                            setCursoEspecificoData(null); 
                          }} 
                          /> 
                        )} 
                      </Space>
                    }
                    loading={loadingCursoEspecifico} 
                    allowClear 
                    style={{ width: '100%' }}
                  />

                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Button 
                      size="small" 
                      type={tipoCursoSeleccionado === 20 ? 'primary' : 'default'}
                      onClick={() => setTipoCursoSeleccionado(20)}
                    >
                      En venta
                    </Button>
                    <Button 
                      size="small" 
                      type={tipoCursoSeleccionado === 19 ? 'primary' : 'default'}
                      onClick={() => setTipoCursoSeleccionado(19)}
                    >
                      Preventa
                    </Button>
                    <Button 
                      size="small" 
                      type={tipoCursoSeleccionado === 17 ? 'primary' : 'default'}
                      onClick={() => setTipoCursoSeleccionado(17)}
                    >
                      Piloto
                    </Button>
                  </div>

                  <div style={{ display: 'flex', gap: 4 }}>
                    <Button 
                      size="small" 
                      type={metricaSeleccionada === 'ingresos' ? 'primary' : 'default'}
                      onClick={() => setMetricaSeleccionada('ingresos')}
                    >
                      Ingresos
                    </Button>
                    <Button 
                      size="small" 
                      type={metricaSeleccionada === 'ventas' ? 'primary' : 'default'}
                      onClick={() => setMetricaSeleccionada('ventas')}
                    >
                      Ventas
                    </Button>
                  </div>
                </div>
              }
              loading={loadingCursos || loadingCursoEspecifico}
            >
              <div style={{ height: '400px' }}>
                {modoCursoEspecifico ? (
                  <ECharts
                    key={`curso-${cursoEspecificoData?.resumen?.[0]?.nombre || 'default'}`}
                    option={cursoAreaOption}
                    style={{ height: '100%', width: '100%' }}
                  />
                ) : (
                  <ECharts 
                    key="cursos-general"
                    option={cursosBarOption} 
                    style={{ height: '100%', width: '100%' }}
                  />
                )}
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