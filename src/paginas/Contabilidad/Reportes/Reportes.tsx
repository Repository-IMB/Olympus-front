import React, { useEffect, useState } from "react";
import { Row, Col, Card, Table, Tag } from "antd";
import ECharts from "../../../componentes/Grafico/ECharts";
import * as echarts from 'echarts/core';
import styles from "./Reportes.module.css";
import contabilidadService from '../../../servicios/contabilidadService';

const Reportes: React.FC = () => {
  const columnasIngresosEgresos = [
    { title: "Mes", dataIndex: "mes" },
    { 
      title: "Ingresos", 
      dataIndex: "ingresos",
      align: "right" as const,
    },
    { 
      title: "Egresos", 
      dataIndex: "egresos",
      align: "right" as const,
    },
    { 
      title: "Resultado", 
      dataIndex: "resultado",
      align: "right" as const,
    },
  ];

  const dataIngresosEgresos = [
    {
      key: 1,
      mes: "Enero 2026",
      ingresos: "S/. 85,420",
      egresos: "S/. 48,900",
      resultado: "S/. 36,520",
    },
    {
      key: 2,
      mes: "Diciembre 2025",
      ingresos: "S/. 72,300",
      egresos: "S/. 44,100",
      resultado: "S/. 28,200",
    },
  ];

  const [dataIngresosEgresosState, setDataIngresosEgresosState] = useState<any[]>(dataIngresosEgresos);
  const [areasConGastos, setAreasConGastos] = useState<any[]>([]);
  const [gastosRecientes, setGastosRecientes] = useState<any[]>([]);
  const [top10Personal, setTop10Personal] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(()=>{
    const load = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const mes = today.getMonth() + 1;
        const anio = today.getFullYear();

        const [reportRes, areasRes, resumenRes, top10Res] = await Promise.all([
          contabilidadService.reporteIngresosEgresos(12),
          contabilidadService.obtenerAreasConGastos(mes, anio),
          contabilidadService.obtenerResumenFinanciero(mes, anio),
          contabilidadService.obtenerIngresosPersonalMesActual()
        ]);

        const reportData = reportRes?.data ?? reportRes ?? [];
        const filas = reportData?.filas || reportData?.rows || reportData || [];
        if (Array.isArray(filas) && filas.length) {
          const mapped = filas.map((f:any,i:number)=>({
            key: f.mes || f.Mes || f.mes || i+1,
            mes: f.mes || f.Mes || f.nombreMes || f.nombre || `Mes ${i+1}`,
            ingresos: f.ingresos ?? f.Ingresos ?? 0,
            egresos: f.egresos ?? f.Egresos ?? 0,
            resultado: f.resultado ?? f.Resultado ?? 0,
          }));
          setDataIngresosEgresosState(mapped.map((r:any)=>({ ...r, ingresos: `S/. ${Number(r.ingresos).toFixed(2)}`, egresos: `S/. ${Number(r.egresos).toFixed(2)}`, resultado: `S/. ${Number(r.resultado).toFixed(2)}`})));
        }

        const areasData = areasRes?.data ?? areasRes ?? [];
        if (Array.isArray(areasData)) {
          setAreasConGastos(areasData.map((a:any)=>({ id: a.Id ?? a.id, area: (a.AreaTrabajo ?? a.areaTrabajo ?? a.Area) || a.AreaTrabajo, total: a.TotalGastos ?? a.totalGastos ?? a.TotalGastos ?? 0 })));
        }

        const top10Data = top10Res?.data ?? top10Res ?? [];
        if (Array.isArray(top10Data)) {
          setTop10Personal(top10Data);
        }

        // Resumen financiero - usar gastosRecientes para gráfico de gastos generales (mes actual)
        const resumenData = resumenRes?.data ?? resumenRes ?? {};
        const gastos = Array.isArray(resumenData.gastosRecientes) ? resumenData.gastosRecientes : (resumenData.gastosRecientes || []);
        // Asegurar que solo sean del mes/anio actual
        const gastosFiltrados = (gastos || []).filter((g:any)=>{
          try {
            const d = new Date(g.fechaGasto || g.FechaGasto || g.fecha || g.fecha);
            return d.getMonth() + 1 === mes && d.getFullYear() === anio;
          } catch(e){ return false; }
        });
        setGastosRecientes(gastosFiltrados);
      } catch(e) {
        console.warn('No se pudo cargar reportes contabilidad', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  },[])

  const opcionesBarrasGastos = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        return `${params[0].name}<br/>${params[0].marker} ${params[0].seriesName}: S/. ${params[0].value}`;
      }
    },
    grid: { left: '5%', right: '5%', top: '10%', bottom: '20%' },
    xAxis: {
      type: 'category',
      data: gastosRecientes && gastosRecientes.length ? (() => {
        // agrupar por tipoGasto o area
        const agrup: any = {};
        gastosRecientes.forEach((g:any) => {
          const key = g.tipoGasto || g.tipo || g.tipoGastoDescripcion || g.area || 'Otros';
          agrup[key] = (agrup[key] || 0) + (Number(g.monto || g.Monto || g.montoTotal || 0) || 0);
        });
        return Object.keys(agrup);
      })() : ['Sin datos'],
      axisLabel: { rotate: 45, interval: 0 }
    },
    yAxis: { type: 'value', axisLabel: { show: false } },
    series: [{
      name: 'Monto',
      type: 'bar',
      data: gastosRecientes && gastosRecientes.length ? (() => {
        const agrup: any = {};
        gastosRecientes.forEach((g:any) => {
          const key = g.tipoGasto || g.tipo || g.tipoGastoDescripcion || g.area || 'Otros';
          agrup[key] = (agrup[key] || 0) + (Number(g.monto || g.Monto || g.montoTotal || 0) || 0);
        });
        return Object.keys(agrup).map(k => Number(agrup[k]));
      })() : [0],
      itemStyle: { 
        color: (params: any) => {
          const colorList = ['#1890ff', '#52c41a', '#faad14', '#f5222d'];
          return colorList[params.dataIndex];
        },
        borderRadius: [5, 5, 0, 0]
      }
    }]
  };
  // Gráfico de dona para gastos por área (usa AreaTrabajo y TotalGastos)
  const opcionesDonaAreas = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const val = params.value ?? 0;
        return `${params.seriesName} <br/>${params.name}: S/. ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${params.percent}%)`;
      }
    },
    grid: { left: '0%', right: '0%', top: '0%', bottom: '0%', containLabel: true },
    legend: { orient: 'vertical', right: '10%', top: 'middle', data: areasConGastos.map(a=>a.area), textStyle: { fontSize: 8 }, itemGap: 2 },
    series: [{
      name: 'Gastos por Área',
      type: 'pie',
      radius: ['30%', '55%'],
      center: ['20%', '50%'],
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: '12', fontWeight: 'bold' }
      },
      data: areasConGastos && areasConGastos.length ? areasConGastos.map((a:any)=>({ value: Number(a.total) || 0, name: a.area || a.AreaTrabajo || 'Sin área' })) : []
    }]
  };
  // Gráfico de barras para gastos por personal
  const opcionesBarrasPersonal = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const index = params[0].dataIndex;
        // Invertir el índice para acceder al dato correcto
        const reversedIndex = top10Personal.length - 1 - index;
        const personal = top10Personal[reversedIndex];
        if (!personal) return `${params[0].name}<br/>Ingresos: S/. ${params[0].value}`;
        
        return `
          <strong>${personal.nombreCompleto || params[0].name}</strong><br/>
          Facturas: ${personal.cantidadFacturas || 0}<br/>
          Ingresos: S/. ${Number(params[0].value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        `;
      }
    },
    yAxis: {
      type: 'category',
      data: top10Personal && top10Personal.length 
        ? [...top10Personal].reverse().map((p:any) => p.nombreCompleto || `${p.nombres || ''} ${p.apellidos || ''}`.trim() || 'Sin nombre')
        : ['Sin datos'],
      axisLabel: { show: true, fontSize: 12, width: 100, overflow: 'truncate' }
    },
    xAxis: { type: 'value', axisLabel: { show: false } },
    grid: { left: '5%', right: '5%', bottom: '5%', top: '5%', containLabel: true },
    series: [{
      name: 'Ingresos',
      type: 'bar',
      data: top10Personal && top10Personal.length
        ? [...top10Personal].reverse().map((p:any) => Number(p.totalIngresos || 0))
        : [0],
      itemStyle: {
        color: (params: any) => {
          // Gradiente de colores - invertir también el índice para los colores
          const colorList = ['#1890ff', '#36cfc9', '#73d13d', '#ffc53d', '#ff7a45', '#ff4d4f', '#9254de', '#722ed1', '#eb2f96', '#faad14'];
          const reversedIndex = (top10Personal.length - 1 - params.dataIndex) % colorList.length;
          return new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: colorList[reversedIndex] || '#1890ff' },
            { offset: 1, color: `${colorList[reversedIndex] || '#1890ff'}80` }
          ]);
        },
        borderRadius: [0, 5, 5, 0]
      }
    }]
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Reportes de ingresos y egresos</h1>

      <Row gutter={[16, 16]} className={styles.metricsContainer}>
        <Col xs={24} md={8}>
          <Card 
            title="Gastos generales" 
            className={styles.card}
            headStyle={{ fontSize: '15px' }}
            bodyStyle={{ height: '350px' }}  
          >
            <div className={styles.chartPlaceholder}>
              <ECharts option={opcionesBarrasGastos} />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card 
            title="Gastos por área" 
            className={styles.card}
            headStyle={{ fontSize: '15px' }}
          >
            <div className={styles.chartPlaceholder}>
              <ECharts option={opcionesDonaAreas} />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card 
            title="Ingresos por personal" 
            className={styles.card}
            headStyle={{ fontSize: '15px' }}
            extra={top10Personal.length > 0 && <Tag color="blue">Top {top10Personal.length}</Tag>}
          >
            <div className={styles.chartPlaceholder}>
              <ECharts option={opcionesBarrasPersonal} />
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        title="Ingresos vs egresos por mes"
        extra={<Tag color="blue">Últimos 12 meses</Tag>}
        className={styles.ingresosEgresosTable}
      >
        <Table
          size="small"
          columns={columnasIngresosEgresos}
          dataSource={dataIngresosEgresosState}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default Reportes;