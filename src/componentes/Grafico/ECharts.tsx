import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, PieChart } from "echarts/charts";
import {
  TooltipComponent,
  LegendComponent,
  GridComponent,
  TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from "echarts/renderers";
import { GraphicComponent } from 'echarts/components';

// Registrar los componentes necesarios
echarts.use([
  BarChart,
  PieChart,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  TitleComponent,
  CanvasRenderer,
  GraphicComponent,
]);

interface EChartsProps {
  option: any;
  style?: React.CSSProperties;
  className?: string;
  onChartReady?: (chart: echarts.ECharts) => void;
}

const ECharts: React.FC<EChartsProps> = ({ option, style = {}, className = '', onChartReady }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current);
      if (onChartReady) {
        onChartReady(chartInstance.current);
      }
    }

    // Limpiar al desmontar
    return () => {
      chartInstance.current?.dispose();
    };
  }, []);

  // Actualizar opciones cuando cambien
  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.setOption(option, true);
    }
  }, [option]);

  // Manejar redimensionamiento
  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div ref={chartRef} style={{ width: '100%', height: '100%', ...style }} className={className} />;
};

export default ECharts;