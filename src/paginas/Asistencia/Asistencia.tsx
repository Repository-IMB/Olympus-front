import {
  Table,
  Input,
  Select,
  DatePicker,
  Button,
  Checkbox,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import moment, { type Moment } from "moment";
import estilos from "./Asistencia.module.css";
import type { ColumnsType } from "antd/es/table";
import type { AsistenciaPersonal, TipoVista } from "../../interfaces/IAsistencia";

moment.locale("es");

const { Option } = Select;
const { RangePicker } = DatePicker;

// Mock data - reemplazar con API real
const asistenciaMock: AsistenciaPersonal[] = [
  {
    id: 1,
    pais: "Panamá",
    dni: "88391694",
    apellidos: "Singh Alvarado",
    nombres: "Abdiel",
    tipoJornada: "",
    correo: "abdielsingh8@gmail.com",
    sede: "imtpaegermtto08252",
    area: "imtpaegermtto08252",
    asistencia: {
      "2026-01-12": 8,
      "2026-01-13": null,
      "2026-01-14": 8,
      "2026-01-15": 8,
      "2026-01-16": 8,
      "2026-01-17": null,
      "2026-01-18": null,
      "2026-01-19": 8,
      "2026-01-20": 8,
    },
  },
  {
    id: 2,
    pais: "Panamá",
    dni: "881796",
    apellidos: "Tejeira Romaña",
    nombres: "Abdiel",
    tipoJornada: "",
    correo: "abdieltejeira@gmail.com",
    sede: "imbcepconfin06251",
    area: "imbcepconfin06251",
    asistencia: {
      "2026-01-12": null,
      "2026-01-13": null,
      "2026-01-14": 8,
      "2026-01-15": 8,
      "2026-01-16": 8,
      "2026-01-17": null,
      "2026-01-18": null,
      "2026-01-19": 8,
      "2026-01-20": 8,
    },
  },
  {
    id: 3,
    pais: "República Dominicana",
    dni: "03105360873",
    apellidos: "Jiménez",
    nombres: "Adalberto",
    tipoJornada: "",
    correo: "dalbert490@gmail.com",
    sede: "imbcepconfin06251",
    area: "imbcepconfin06251",
    asistencia: {
      "2026-01-12": 8,
      "2026-01-13": null,
      "2026-01-14": 8,
      "2026-01-15": 8,
      "2026-01-16": 8,
      "2026-01-17": null,
      "2026-01-18": null,
      "2026-01-19": 8,
      "2026-01-20": 8,
    },
  },
];

// Función para obtener las fechas de una semana dado un día de referencia
const obtenerFechasSemana = (fecha: Moment): Moment[] => {
  const inicioSemana = fecha.clone().startOf("isoWeek");
  const fechas: Moment[] = [];
  for (let i = 0; i < 7; i++) {
    fechas.push(inicioSemana.clone().add(i, "days"));
  }
  return fechas;
};

// Función para obtener las fechas de un mes
const obtenerFechasMes = (fecha: Moment): Moment[] => {
  const inicioMes = fecha.clone().startOf("month");
  const finMes = fecha.clone().endOf("month");
  const fechas: Moment[] = [];
  const actual = inicioMes.clone();
  while (actual.isSameOrBefore(finMes, "day")) {
    fechas.push(actual.clone());
    actual.add(1, "day");
  }
  return fechas;
};

// Función para obtener fechas en un rango
const obtenerFechasRango = (inicio: Moment, fin: Moment): Moment[] => {
  const fechas: Moment[] = [];
  const actual = inicio.clone();
  while (actual.isSameOrBefore(fin, "day")) {
    fechas.push(actual.clone());
    actual.add(1, "day");
  }
  return fechas;
};

// Formatear nombre del día
const formatearDiaColumna = (fecha: Moment): string => {
  const diaSemana = fecha.format("dddd");
  const diaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
  return `${diaCapitalizado} ${fecha.format("DD/MM/YYYY")}`;
};

export default function Asistencia() {
  const [searchText, setSearchText] = useState("");
  const [tipoVista, setTipoVista] = useState<TipoVista>("semana");
  const [mesSeleccionado, setMesSeleccionado] = useState<Moment | null>(moment());
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<Moment | null>(moment());
  const [rangoFechas, setRangoFechas] = useState<[Moment | null, Moment | null] | null>(null);
  const [filtroDni, setFiltroDni] = useState<string>();
  const [filtroArea, setFiltroArea] = useState<string>();
  const [filtroFechaNacimiento, setFiltroFechaNacimiento] = useState<[Moment | null, Moment | null] | null>(null);

  const [personal] = useState<AsistenciaPersonal[]>(asistenciaMock);

  const limpiarFiltros = () => {
    setSearchText("");
    setFiltroDni(undefined);
    setFiltroArea(undefined);
    setFiltroFechaNacimiento(null);
  };

  // Obtener las fechas a mostrar según el tipo de vista
  const fechasAMostrar = useMemo((): Moment[] => {
    switch (tipoVista) {
      case "mes":
        return mesSeleccionado ? obtenerFechasMes(mesSeleccionado) : [];
      case "semana":
        return semanaSeleccionada ? obtenerFechasSemana(semanaSeleccionada) : [];
      case "rango":
        return rangoFechas && rangoFechas[0] && rangoFechas[1]
          ? obtenerFechasRango(rangoFechas[0], rangoFechas[1])
          : [];
      case "historico":
        // Para histórico, mostrar todo el año actual
        const inicioAnio = moment().startOf("year");
        const finAnio = moment().endOf("year");
        return obtenerFechasRango(inicioAnio, finAnio);
      default:
        return [];
    }
  }, [tipoVista, mesSeleccionado, semanaSeleccionada, rangoFechas]);

  // Filtrar personal
  const personalFiltrado = useMemo(() => {
    const busqueda = searchText.toLowerCase();

    return personal.filter((p) => {
      const coincideBusqueda =
        !busqueda ||
        p.nombres.toLowerCase().includes(busqueda) ||
        p.apellidos.toLowerCase().includes(busqueda) ||
        p.dni.includes(busqueda) ||
        p.correo.toLowerCase().includes(busqueda);

      const coincideDni = !filtroDni || p.dni.includes(filtroDni);
      const coincideArea = !filtroArea || p.area === filtroArea;

      const coincideFechaNacimiento =
        !filtroFechaNacimiento ||
        !filtroFechaNacimiento[0] ||
        !filtroFechaNacimiento[1] ||
        (() => {
          if (!p.fechaNacimiento) return true;
          const [inicio, fin] = filtroFechaNacimiento;
          const fechaNac = moment(p.fechaNacimiento, "DD/MM/YYYY");
          return fechaNac.isBetween(inicio, fin, "day", "[]");
        })();

      return coincideBusqueda && coincideDni && coincideArea && coincideFechaNacimiento;
    });
  }, [personal, searchText, filtroDni, filtroArea, filtroFechaNacimiento]);

  // Calcular total de horas trabajadas
  const calcularTotalHoras = (asistencia: Record<string, number | null>, fechas: Moment[]): number => {
    return fechas.reduce((total, fecha) => {
      const fechaStr = fecha.format("YYYY-MM-DD");
      const horas = asistencia[fechaStr];
      return total + (horas || 0);
    }, 0);
  };

  // Generar columnas dinámicas para las fechas
  const columnasBase: ColumnsType<AsistenciaPersonal> = [
    {
      title: "DNI",
      dataIndex: "dni",
      key: "dni",
      fixed: "left",
      width: 120,
      sorter: (a, b) => a.dni.localeCompare(b.dni),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar DNI"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90, marginRight: 8 }}>
            Filtrar
          </Button>
          <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
            Limpiar
          </Button>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.dni.includes(value as string),
    },
    {
      title: "Apellidos",
      dataIndex: "apellidos",
      key: "apellidos",
      fixed: "left",
      width: 150,
      sorter: (a, b) => a.apellidos.localeCompare(b.apellidos),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar apellidos"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90, marginRight: 8 }}>
            Filtrar
          </Button>
          <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
            Limpiar
          </Button>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.apellidos.toLowerCase().includes((value as string).toLowerCase()),
    },
    {
      title: "Nombres",
      dataIndex: "nombres",
      key: "nombres",
      fixed: "left",
      width: 150,
      sorter: (a, b) => a.nombres.localeCompare(b.nombres),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar nombres"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90, marginRight: 8 }}>
            Filtrar
          </Button>
          <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
            Limpiar
          </Button>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.nombres.toLowerCase().includes((value as string).toLowerCase()),
    },
    {
      title: "Tipo de jornada",
      dataIndex: "tipoJornada",
      key: "tipoJornada",
      width: 140,
      sorter: (a, b) => a.tipoJornada.localeCompare(b.tipoJornada),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Filtrar tipo jornada"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Button type="primary" onClick={() => confirm()} size="small" style={{ width: 90, marginRight: 8 }}>
            Filtrar
          </Button>
          <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
            Limpiar
          </Button>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
      onFilter: (value, record) => record.tipoJornada.toLowerCase().includes((value as string).toLowerCase()),
    },
  ];

  // Columnas dinámicas para las fechas
  const columnasFechas: ColumnsType<AsistenciaPersonal> = fechasAMostrar.map((fecha) => {
    const fechaStr = fecha.format("YYYY-MM-DD");
    return {
      title: formatearDiaColumna(fecha),
      dataIndex: ["asistencia", fechaStr],
      key: fechaStr,
      width: 150,
      align: "center" as const,
      render: (_: unknown, record: AsistenciaPersonal) => {
        const asistio = record.asistencia[fechaStr] !== null && record.asistencia[fechaStr] !== undefined;
        return (
          <Checkbox
            checked={asistio}
            disabled
          />
        );
      },
    };
  });

  // Columna de total de horas trabajadas
  const columnaTotal: ColumnsType<AsistenciaPersonal> = [
    {
      title: "Total de horas trabajadas",
      key: "totalHoras",
      fixed: "right",
      width: 180,
      align: "center" as const,
      sorter: (a, b) =>
        calcularTotalHoras(a.asistencia, fechasAMostrar) - calcularTotalHoras(b.asistencia, fechasAMostrar),
      render: (_: unknown, record: AsistenciaPersonal) => {
        const total = calcularTotalHoras(record.asistencia, fechasAMostrar);
        return <span style={{ fontWeight: 600 }}>{total}</span>;
      },
    },
  ];

  const columnas = [...columnasBase, ...columnasFechas, ...columnaTotal];

  // Obtener valores únicos para los filtros
  const dnisUnicos = [...new Set(personal.map((p) => p.dni))].filter(Boolean);
  const areasUnicas = [...new Set(personal.map((p) => p.area))].filter(Boolean);

  // Calcular el ancho total de la tabla
  const anchoScroll = 120 + 150 + 150 + 140 + (fechasAMostrar.length * 150) + 180;

  return (
    <div className={estilos.container}>
      <div className={estilos.contentWrapper}>
        <div className={estilos.header}>
          <h1 className={estilos.title}>Asistencia del personal</h1>
        </div>

        <div className={estilos.toolbar}>
          <div className={estilos.searchBar}>
            <Input
              placeholder="Buscar por nombre, DNI, correo"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </div>

          <div className={estilos.actions}>
            <Button className={estilos.btnLimpiar} onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          </div>
        </div>

        <div className={`${estilos.toolbar} ${estilos.filtersRow}`}>
          <Select
            value={tipoVista}
            onChange={(value) => setTipoVista(value)}
            className={estilos.filterSelect}
            style={{ minWidth: 220 }}
          >
            <Option value="mes">Vista por mes (seleccionar el mes)</Option>
            <Option value="semana">Vista semanal (SELECTOR DE SEMANA)</Option>
            <Option value="rango">Rango por mes (DE MES A MES)</Option>
            <Option value="historico">Vista historico</Option>
          </Select>

          {tipoVista === "mes" && (
            <DatePicker
              picker="month"
              value={mesSeleccionado}
              onChange={(date) => setMesSeleccionado(date)}
              placeholder="Seleccionar mes"
              format="MMMM YYYY"
              style={{ minWidth: 180 }}
            />
          )}

          {tipoVista === "semana" && (
            <DatePicker
              picker="week"
              value={semanaSeleccionada}
              onChange={(date) => setSemanaSeleccionada(date)}
              placeholder="Seleccionar semana"
              style={{ minWidth: 180 }}
            />
          )}

          {tipoVista === "rango" && (
            <RangePicker
              picker="month"
              value={rangoFechas}
              onChange={(dates) => setRangoFechas(dates as [Moment | null, Moment | null] | null)}
              placeholder={["Mes inicio", "Mes fin"]}
              format="MMMM YYYY"
              style={{ minWidth: 280 }}
            />
          )}

          <Select
            allowClear
            placeholder="Filtro por dni"
            value={filtroDni}
            onChange={setFiltroDni}
            className={estilos.filterSelect}
            style={{ minWidth: 150 }}
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {dnisUnicos.map((dni) => (
              <Option key={dni} value={dni}>
                {dni}
              </Option>
            ))}
          </Select>

          <Select
            allowClear
            placeholder="Filtro por area"
            value={filtroArea}
            onChange={setFiltroArea}
            className={estilos.filterSelect}
            style={{ minWidth: 150 }}
          >
            {areasUnicas.map((area) => (
              <Option key={area} value={area}>
                {area}
              </Option>
            ))}
          </Select>

          <RangePicker
            value={filtroFechaNacimiento}
            onChange={(dates) => setFiltroFechaNacimiento(dates as [Moment | null, Moment | null] | null)}
            format="DD/MM/YYYY"
            placeholder={["Filtro fecha por fecha de nacimiento", ""]}
            style={{ minWidth: 320 }}
          />
        </div>

        <div className={estilos.vistaLabel}>
          {tipoVista === "mes" && mesSeleccionado && `Vista por mes`}
          {tipoVista === "semana" && semanaSeleccionada && `Vista por semana`}
          {tipoVista === "rango" && rangoFechas && rangoFechas[0] && rangoFechas[1] && `Vista por rango`}
          {tipoVista === "historico" && `Vista histórico`}
        </div>

        <Table
          columns={columnas}
          dataSource={personalFiltrado}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: anchoScroll }}
          bordered
          size="middle"
        />
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import estilos from './Asistencia.module.css';

type TipoAsistencia = 'entrada' | 'inicioAlmuerzo' | 'finAlmuerzo' | 'salida';

interface ErroresValidacion {
  dni?: string;
}

function AsistenciaPage() {
  const [dni, setDni] = useState('');
  const [tipoAsistencia, setTipoAsistencia] = useState<TipoAsistencia>('entrada');
  const [hora, setHora] = useState('');
  const [fecha, setFecha] = useState('');
  const [erroresValidacion, setErroresValidacion] = useState<ErroresValidacion>({});
  const [cargando, setCargando] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  // Actualizar hora y fecha en tiempo real
  useEffect(() => {
    const actualizarTiempo = () => {
      const ahora = new Date();
      const opcionesHora: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      const opcionesFecha: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      };

      setHora(ahora.toLocaleTimeString('es-ES', opcionesHora));
      setFecha(ahora.toLocaleDateString('es-ES', opcionesFecha));
    };

    actualizarTiempo();
    const interval = setInterval(actualizarTiempo, 1000);

    return () => clearInterval(interval);
  }, []);

  // Carrusel de imágenes hardcodeadas
  const slides = [
    {
      title: "Control de asistencia",
      description: "Marca tu asistencia de forma rápida y sencilla. Registra tus entradas, salidas y tiempos de almuerzo con un solo clic.",
      image: (
        <svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#ffffff" opacity="0.1" />
          <rect x="50" y="50" width="300" height="200" rx="8" fill="#ffffff" opacity="0.2" />
          <circle cx="200" cy="120" r="40" fill="#ffffff" opacity="0.2" />
          <rect x="120" y="180" width="160" height="12" rx="4" fill="#ffffff" opacity="0.3" />
          <rect x="120" y="210" width="120" height="12" rx="4" fill="#ffffff" opacity="0.3" />
        </svg>
      )
    },
    {
      title: "Registro preciso",
      description: "Sistema de registro de asistencia con precisión de segundos. Mantén un control detallado de tus horarios laborales.",
      image: (
        <svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#ffffff" opacity="0.1" />
          <rect x="50" y="50" width="300" height="200" rx="8" fill="#ffffff" opacity="0.2" />
          <circle cx="200" cy="120" r="50" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.4" />
          <line x1="200" y1="120" x2="200" y2="80" stroke="#ffffff" strokeWidth="3" opacity="0.4" />
          <line x1="200" y1="120" x2="230" y2="130" stroke="#ffffff" strokeWidth="3" opacity="0.4" />
        </svg>
      )
    },
    {
      title: "Fácil de usar",
      description: "Interfaz intuitiva diseñada para que cualquier empleado pueda marcar su asistencia sin complicaciones.",
      image: (
        <svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#ffffff" opacity="0.1" />
          <rect x="50" y="50" width="300" height="200" rx="8" fill="#ffffff" opacity="0.2" />
          <rect x="100" y="100" width="200" height="40" rx="6" fill="#ffffff" opacity="0.3" />
          <rect x="100" y="160" width="200" height="40" rx="6" fill="#ffffff" opacity="0.3" />
          <rect x="100" y="220" width="200" height="40" rx="6" fill="#ffffff" opacity="0.3" />
        </svg>
      )
    }
  ];

  // Auto-avanzar el carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Validar DNI
  const validarDNI = (valor: string): boolean => {
    // DNI debe tener entre 8 y 12 caracteres numéricos
    const dniRegex = /^\d{8,12}$/;
    return dniRegex.test(valor);
  };

  const handleDNIChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, ''); // Solo números
    setDni(valor);
    if (erroresValidacion.dni) {
      if (!valor.trim()) {
        setErroresValidacion({ dni: 'El DNI es requerido' });
      } else if (!validarDNI(valor)) {
        setErroresValidacion({ dni: 'El DNI debe tener entre 8 y 12 dígitos' });
      } else {
        setErroresValidacion({});
      }
    }
  };

  const handleDNIBlur = () => {
    if (!dni.trim()) {
      setErroresValidacion({ dni: 'El DNI es requerido' });
    } else if (!validarDNI(dni)) {
      setErroresValidacion({ dni: 'El DNI debe tener entre 8 y 12 dígitos' });
    } else {
      setErroresValidacion({});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar DNI
    if (!dni.trim()) {
      setErroresValidacion({ dni: 'El DNI es requerido' });
      return;
    }

    if (!validarDNI(dni)) {
      setErroresValidacion({ dni: 'El DNI debe tener entre 8 y 12 dígitos' });
      return;
    }

    setErroresValidacion({});
    setCargando(true);

    // Simular envío (aquí iría la llamada a la API)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mostrar mensaje de éxito
      setMostrarExito(true);
      setDni('');

      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setMostrarExito(false);
      }, 3000);
    } catch (error) {
      console.error('Error al marcar asistencia:', error);
    } finally {
      setCargando(false);
    }
  };

  const tiposAsistencia = [
    { id: 'entrada' as TipoAsistencia, label: 'Entrada', icon: Clock },
    { id: 'inicioAlmuerzo' as TipoAsistencia, label: 'Inicio Almuerzo', icon: Clock },
    { id: 'finAlmuerzo' as TipoAsistencia, label: 'Fin Almuerzo', icon: Clock },
    { id: 'salida' as TipoAsistencia, label: 'Salida', icon: Clock },
  ];

  return (
    <div className={estilos.contenedorAsistencia}>
      <div className={estilos.asistenciaWrapper}>
        {/* Formulario a la izquierda */}
        <div className={estilos.formularioContainer}>
          <div className={estilos.logoContainer}>
            <div className={estilos.logo}>
              <img src="/logo.png" alt="Olympus" className={estilos.logoImage} />
            </div>
          </div>

          {/* Hora y Fecha */}
          <div className={estilos.tiempoContainer}>
            <div className={estilos.hora}>{hora}</div>
            <div className={estilos.fecha}>{fecha}</div>
          </div>

          <form className={estilos.formulario} onSubmit={handleSubmit}>
            <div className={`${estilos.inputGroup} ${estilos.animateGroup}`} style={{ animationDelay: '0.1s' }}>
              <label className={estilos.label}>Ingresa tu DNI:</label>
              <input
                className={`${estilos.input} ${erroresValidacion.dni ? estilos.inputError : ''}`}
                type="text"
                placeholder="DNI"
                value={dni}
                onChange={handleDNIChange}
                onBlur={handleDNIBlur}
                maxLength={12}
              />
              {erroresValidacion.dni && (
                <span className={estilos.errorMensaje}>{erroresValidacion.dni}</span>
              )}
            </div>

            {/* Botones de tipo de asistencia */}
            <div className={`${estilos.tiposContainer} ${estilos.animateGroup}`} style={{ animationDelay: '0.2s' }}>
              {tiposAsistencia.map((tipo, index) => {
                const Icon = tipo.icon;
                return (
                  <button
                    key={tipo.id}
                    type="button"
                    className={`${estilos.tipoButton} ${tipoAsistencia === tipo.id ? estilos.tipoButtonActive : ''}`}
                    onClick={() => setTipoAsistencia(tipo.id)}
                    style={{ animationDelay: `${0.25 + index * 0.05}s` }}
                  >
                    <Icon size={18} />
                    <span>{tipo.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mensaje de éxito */}
            {mostrarExito && (
              <div className={estilos.mensajeExito}>
                <CheckCircle size={20} />
                <span>Asistencia marcada exitosamente</span>
              </div>
            )}

            <button
              className={`${estilos.boton} ${cargando ? estilos.botonCargando : ''} ${estilos.animateGroup}`}
              style={{ animationDelay: '0.4s' }}
              type="submit"
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <span className={estilos.spinner}></span>
                  <span>Marcando...</span>
                </>
              ) : (
                <>
                  <Clock size={20} />
                  <span>Marcar Asistencia</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Carrusel a la derecha */}
        <div className={estilos.carruselContainer}>
          <div className={estilos.carruselContent}>
            <div className={estilos.carruselSlides} style={{ transform: `translateX(-${slideIndex * 100}%)` }}>
              {slides.map((slide, index) => (
                <div key={index} className={estilos.slide}>
                  <div className={estilos.slideImage}>{slide.image}</div>
                  <h2 className={estilos.slideTitle}>{slide.title}</h2>
                  <p className={estilos.slideDescription}>{slide.description}</p>
                </div>
              ))}
            </div>
            <div className={estilos.pagination}>
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`${estilos.paginationDot} ${index === slideIndex ? estilos.active : ''}`}
                  onClick={() => setSlideIndex(index)}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AsistenciaPage;
