import { useState, useEffect, useMemo } from "react";
import {
  Layout,
  Table,
  Button,
  Tag,
  Spin,
  Alert,
  Input,
  Select,
  DatePicker,
  message,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import moment, { type Moment } from "moment";
import { getCookie } from "../../utils/cookies";
import api from "../../servicios/api";
import styles from "./Activos.module.css";
import type { ColumnsType } from "antd/es/table";
import { useSearchParams } from "react-router-dom";
import ModalActivo from "./ModalActivo";
import * as QRCode from "qrcode";
import jsPDF from "jspdf";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Content } = Layout;

interface TokenData {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
}

interface Activo {
  idActivo: number;
  nombre: string;
  tipo: string;
  ip: string;
  numeroSerie: string;
  imei: string;
  fabricante: string;
  modelo: string;
  ubicacionSede: string;
  estacion: number;
  estado: string;
  responsable: string;
  fechaActualizacion: string;
}

const getEstadoColor = (estado: string): string => {
  const estadoColors: Record<string, string> = {
    "Asignado": "blue",
    "Disponible": "green",
    "Dado de baja": "red",
    "En mantenimiento": "orange",
  };
  return estadoColors[estado] || "default";
};

export default function Activos() {
  const navigate = useNavigate();
  const token = getCookie("token");

  const [data, setData] = useState<Activo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );
  const [pageSize, setPageSize] = useState(
    Number(searchParams.get("pageSize")) || 10
  );
  const [searchText, setSearchText] = useState(
    searchParams.get("search") || ""
  );
  const [filterTipo, setFilterTipo] = useState(
    searchParams.get("tipo") || "Todos"
  );
  const [filterFabricante, setFilterFabricante] = useState(
    searchParams.get("fabricante") || "Todos"
  );
  const [filterSede, setFilterSede] = useState(
    searchParams.get("sede") || "Todos"
  );
  const [filterEstado, setFilterEstado] = useState(
    searchParams.get("estado") || "Todos"
  );
  const [filterResponsable, setFilterResponsable] = useState(
    searchParams.get("responsable") || "Todos"
  );
  const [filterFecha, setFilterFecha] = useState<
    [Moment | null, Moment | null] | null
  >(null);

  useEffect(() => {
    setSearchParams({
      page: currentPage.toString(),
      pageSize: pageSize.toString(),
      search: searchText || "",
      tipo: filterTipo !== "Todos" ? filterTipo : "",
      fabricante: filterFabricante !== "Todos" ? filterFabricante : "",
      sede: filterSede !== "Todos" ? filterSede : "",
      estado: filterEstado !== "Todos" ? filterEstado : "",
      responsable: filterResponsable !== "Todos" ? filterResponsable : "",
    });
  }, [
    currentPage,
    pageSize,
    searchText,
    filterTipo,
    filterFabricante,
    filterSede,
    filterEstado,
    filterResponsable,
  ]);

  // Datos de ejemplo - reemplazar con llamada a API real
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // TODO: Reemplazar con llamada real a la API
        // const res = await api.get("/api/Activos/ObtenerActivosPaginados", {
        //   params: {
        //     page: currentPage,
        //     pageSize,
        //     search: searchText || null,
        //     tipo: filterTipo !== "Todos" ? filterTipo : null,
        //     fabricante: filterFabricante !== "Todos" ? filterFabricante : null,
        //     sede: filterSede !== "Todos" ? filterSede : null,
        //     estado: filterEstado !== "Todos" ? filterEstado : null,
        //     responsable: filterResponsable !== "Todos" ? filterResponsable : null,
        //     fechaInicio: filterFecha?.[0]?.format("YYYY-MM-DD") ?? null,
        //     fechaFin: filterFecha?.[1]?.format("YYYY-MM-DD") ?? null,
        //   },
        // });

        // Datos de ejemplo para desarrollo
        // Agregamos un índice único a cada activo para evitar problemas con selección
        const exampleData: (Activo & { uniqueKey: string })[] = [
          {
            idActivo: 9675345,
            nombre: "MacBookPro",
            tipo: "Laptop",
            ip: "162.248.143.12",
            numeroSerie: "162.248.143.12",
            imei: "",
            fabricante: "Apple",
            modelo: "MacBookPro17",
            ubicacionSede: "Perú",
            estacion: 1,
            estado: "Asignado",
            responsable: "Rafael Corzo",
            fechaActualizacion: "2025-09-24T23:00:00",
            uniqueKey: "9675345-Perú-1",
          },
          {
            idActivo: 9675345,
            nombre: "MacBookPro",
            tipo: "Laptop",
            ip: "162.248.143.12",
            numeroSerie: "162.248.143.12",
            imei: "",
            fabricante: "Apple",
            modelo: "MacBookPro17",
            ubicacionSede: "Bolivia",
            estacion: 3,
            estado: "Disponible",
            responsable: "",
            fechaActualizacion: "2025-09-24T23:00:00",
            uniqueKey: "9675345-Bolivia-3",
          },
          {
            idActivo: 9675345,
            nombre: "MacBookPro",
            tipo: "Laptop",
            ip: "162.248.143.12",
            numeroSerie: "162.248.143.12",
            imei: "",
            fabricante: "Apple",
            modelo: "MacBookPro17",
            ubicacionSede: "Perú",
            estacion: 2,
            estado: "Dado de baja",
            responsable: "",
            fechaActualizacion: "2025-09-24T23:00:00",
            uniqueKey: "9675345-Perú-2",
          },
          {
            idActivo: 9675342,
            nombre: "Lenovo",
            tipo: "Laptop",
            ip: "162.248.143.12",
            numeroSerie: "162.248.143.12",
            imei: "",
            fabricante: "Lenovo",
            modelo: "LenovoPro10",
            ubicacionSede: "Argentina",
            estacion: 4,
            estado: "En mantenimiento",
            responsable: "",
            fechaActualizacion: "2025-09-24T23:00:00",
            uniqueKey: "9675342-Argentina-4",
          },
          {
            idActivo: 9675342,
            nombre: "Motorola",
            tipo: "Celular",
            ip: "162.248.143.12",
            numeroSerie: "",
            imei: "1234567809",
            fabricante: "Lenovo",
            modelo: "LenovoPro10",
            ubicacionSede: "Argentina",
            estacion: 1,
            estado: "En mantenimiento",
            responsable: "",
            fechaActualizacion: "2025-09-24T23:00:00",
            uniqueKey: "9675342-Argentina-1",
          },
        ];

        // Filtrar datos según búsqueda y filtros
        let filtered = exampleData as any[];
        if (searchText) {
          const searchLower = searchText.toLowerCase();
          filtered = filtered.filter(
            (a) =>
              a.nombre.toLowerCase().includes(searchLower) ||
              a.tipo.toLowerCase().includes(searchLower) ||
              a.ip.includes(searchLower) ||
              a.fabricante.toLowerCase().includes(searchLower) ||
              a.modelo.toLowerCase().includes(searchLower) ||
              a.ubicacionSede.toLowerCase().includes(searchLower) ||
              a.estado.toLowerCase().includes(searchLower) ||
              a.responsable.toLowerCase().includes(searchLower)
          );
        }
        if (filterTipo !== "Todos") {
          filtered = filtered.filter((a) => a.tipo === filterTipo);
        }
        if (filterFabricante !== "Todos") {
          filtered = filtered.filter((a) => a.fabricante === filterFabricante);
        }
        if (filterSede !== "Todos") {
          filtered = filtered.filter((a) => a.ubicacionSede === filterSede);
        }
        if (filterEstado !== "Todos") {
          filtered = filtered.filter((a) => a.estado === filterEstado);
        }
        if (filterResponsable !== "Todos") {
          filtered = filtered.filter((a) => a.responsable === filterResponsable);
        }

        setData(filtered);
        setTotal(filtered.length);
      } catch (e: any) {
        setError(
          e?.response?.data?.mensaje ??
            e?.message ??
            "Error al obtener activos"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    currentPage,
    pageSize,
    searchText,
    filterTipo,
    filterFabricante,
    filterSede,
    filterEstado,
    filterResponsable,
    filterFecha,
  ]);

  const handleLimpiarFiltros = () => {
    setSearchText("");
    setFilterTipo("Todos");
    setFilterFabricante("Todos");
    setFilterSede("Todos");
    setFilterEstado("Todos");
    setFilterResponsable("Todos");
    setFilterFecha(null);
  };

  const handleDescargarCodigos = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Seleccione al menos un activo");
      return;
    }

    try {
      message.loading({ content: "Generando códigos QR...", key: "qr" });

      // Obtener los activos seleccionados
      const activosSeleccionados = data.filter((activo) =>
        selectedRowKeys.includes((activo as any).uniqueKey || activo.idActivo)
      );

      // Crear PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const qrSize = 60;
      const spacing = 20;

      let yPosition = margin;
      let xPosition = margin;
      let itemsPerRow = 0;
      const maxItemsPerRow = 3;

      for (let i = 0; i < activosSeleccionados.length; i++) {
        const activo = activosSeleccionados[i];
        const uniqueId = (activo as any).uniqueKey || `${activo.idActivo}-${activo.ubicacionSede}-${activo.estacion}`;
        
        // URL pública para el QR
        const publicUrl = `${window.location.origin}/activos/public/${uniqueId}`;

        // Generar QR usando la librería qrcode
        const qrDataUrl = await QRCode.default.toDataURL(publicUrl, {
          width: qrSize * 4,
          margin: 1,
        });

        // Agregar QR al PDF
        if (xPosition + qrSize + margin > pageWidth) {
          xPosition = margin;
          yPosition += qrSize + spacing + 30;
          itemsPerRow = 0;
        }

        // Verificar si necesitamos una nueva página
        if (yPosition + qrSize + 40 > pageHeight) {
          pdf.addPage();
          yPosition = margin;
          xPosition = margin;
          itemsPerRow = 0;
        }

        // Agregar imagen QR
        pdf.addImage(qrDataUrl, "PNG", xPosition, yPosition, qrSize, qrSize);

        // Agregar información del activo debajo del QR
        pdf.setFontSize(10);
        pdf.text(activo.nombre, xPosition, yPosition + qrSize + 5);
        pdf.setFontSize(8);
        pdf.text(`ID: ${activo.idActivo}`, xPosition, yPosition + qrSize + 10);
        pdf.text(`${activo.ubicacionSede} - Estación ${activo.estacion}`, xPosition, yPosition + qrSize + 15);

        // Mover posición para el siguiente QR
        xPosition += qrSize + spacing;
        itemsPerRow++;

        if (itemsPerRow >= maxItemsPerRow) {
          xPosition = margin;
          yPosition += qrSize + spacing + 30;
          itemsPerRow = 0;
        }
      }

      // Guardar PDF
      pdf.save(`codigos-activos-${new Date().getTime()}.pdf`);
      message.success({ content: "Códigos QR generados exitosamente", key: "qr" });
    } catch (error: any) {
      console.error("Error generando códigos QR:", error);
      message.error({ content: "Error al generar los códigos QR", key: "qr" });
    }
  };

  const tiposUnicos = useMemo(() => {
    const set = new Set<string>();
    data.forEach((a) => {
      if (a.tipo) set.add(a.tipo);
    });
    return Array.from(set).sort();
  }, [data]);

  const fabricantesUnicos = useMemo(() => {
    const set = new Set<string>();
    data.forEach((a) => {
      if (a.fabricante) set.add(a.fabricante);
    });
    return Array.from(set).sort();
  }, [data]);

  const sedesUnicas = useMemo(() => {
    const set = new Set<string>();
    data.forEach((a) => {
      if (a.ubicacionSede) set.add(a.ubicacionSede);
    });
    return Array.from(set).sort();
  }, [data]);

  const estadosUnicos = useMemo(() => {
    return ["Asignado", "Disponible", "Dado de baja", "En mantenimiento"];
  }, []);

  const responsablesUnicos = useMemo(() => {
    const set = new Set<string>();
    data.forEach((a) => {
      if (a.responsable) set.add(a.responsable);
    });
    return Array.from(set).sort();
  }, [data]);

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

  const columns: ColumnsType<Activo> = [
    {
      title: "IdActivo",
      dataIndex: "idActivo",
      key: "idActivo",
      sorter: (a: Activo, b: Activo) => a.idActivo - b.idActivo,
    },
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
      sorter: (a: Activo, b: Activo) => a.nombre.localeCompare(b.nombre),
    },
    {
      title: "Tipo",
      dataIndex: "tipo",
      key: "tipo",
      sorter: (a: Activo, b: Activo) => a.tipo.localeCompare(b.tipo),
    },
    {
      title: "IP",
      dataIndex: "ip",
      key: "ip",
      sorter: (a: Activo, b: Activo) => a.ip.localeCompare(b.ip),
    },
    {
      title: "Número de serie",
      dataIndex: "numeroSerie",
      key: "numeroSerie",
      sorter: (a: Activo, b: Activo) =>
        (a.numeroSerie || "").localeCompare(b.numeroSerie || ""),
      render: (numeroSerie: string) => numeroSerie || "-",
    },
    {
      title: "IMEI",
      dataIndex: "imei",
      key: "imei",
      sorter: (a: Activo, b: Activo) =>
        (a.imei || "").localeCompare(b.imei || ""),
      render: (imei: string) => imei || "-",
    },
    {
      title: "Fabricante",
      dataIndex: "fabricante",
      key: "fabricante",
      sorter: (a: Activo, b: Activo) => a.fabricante.localeCompare(b.fabricante),
    },
    {
      title: "Modelo",
      dataIndex: "modelo",
      key: "modelo",
      sorter: (a: Activo, b: Activo) => a.modelo.localeCompare(b.modelo),
    },
    {
      title: "Ubicación / sede",
      dataIndex: "ubicacionSede",
      key: "ubicacionSede",
      sorter: (a: Activo, b: Activo) =>
        a.ubicacionSede.localeCompare(b.ubicacionSede),
    },
    {
      title: "Estación",
      dataIndex: "estacion",
      key: "estacion",
      sorter: (a: Activo, b: Activo) => a.estacion - b.estacion,
      align: "center",
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      sorter: (a: Activo, b: Activo) => a.estado.localeCompare(b.estado),
      render: (estado: string) => {
        const color = getEstadoColor(estado);
        return (
          <Tag
            color={color}
            style={{ borderRadius: "12px", padding: "2px 12px" }}
          >
            {estado}
          </Tag>
        );
      },
    },
    {
      title: "Responsable",
      dataIndex: "responsable",
      key: "responsable",
      sorter: (a: Activo, b: Activo) =>
        (a.responsable || "").localeCompare(b.responsable || ""),
      render: (responsable: string) => responsable || "-",
    },
    {
      title: "Fecha de Actualización",
      dataIndex: "fechaActualizacion",
      key: "fechaActualizacion",
      sorter: (a: Activo, b: Activo) =>
        new Date(a.fechaActualizacion).getTime() -
        new Date(b.fechaActualizacion).getTime(),
      render: (fechaActualizacion: string) => {
        const fecha = new Date(fechaActualizacion);
        return (
          <div>
            <div>{fecha.toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</div>
            <div style={{ color: "#8c8c8c", fontSize: "12px" }}>
              {fecha.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        );
      },
    },
    {
      title: "Acciones",
      key: "actions",
      align: "center",
      width: 100,
      render: (_: any, record: Activo) => {
        // Usar uniqueKey si existe, sino usar idActivo con índice para garantizar unicidad
        const uniqueId = (record as any).uniqueKey || `${record.idActivo}-${record.ubicacionSede}-${record.estacion}`;
        return (
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            style={{ backgroundColor: "#1f1f1f", borderColor: "#1f1f1f" }}
            onClick={() => navigate(`/logistica/activos/${uniqueId}`)}
          />
        );
      },
    },
  ];

  return (
    <Content style={{ padding: "20px", background: "#f5f5f5" }}>
      <div className={styles.card}>
        <h1 className={styles.title}>Activos</h1>

        {/* Barra de búsqueda y botones en la misma fila */}
        <div className={styles.searchAndActionsContainer}>
          <Input
            placeholder="Buscar por nombre, tipo, IP, Fabricante, Modelo, Sede, estados y responsables"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={styles.searchInput}
            allowClear
          />
          <div className={styles.actionButtons}>
            <Button
              onClick={handleLimpiarFiltros}
              className={styles.clearButton}
            >
              Limpiar filtros
            </Button>
            <Button
              type="primary"
              className={styles.primaryButton}
              onClick={() => setModalVisible(true)}
            >
              Nuevo activo
            </Button>
            <Button
              type="primary"
              className={styles.primaryButton}
              onClick={() => {
                // TODO: Implementar asignación masiva
                console.log("Asignar masivo");
              }}
            >
              Asignar masivo nuevo responsable
            </Button>
            <Button
              className={styles.secondaryButton}
              icon={<DownloadOutlined />}
              disabled={selectedRowKeys.length === 0}
              onClick={handleDescargarCodigos}
            >
              Descargar códigos de activos
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Filtro por tipo</label>
            <Select
              value={filterTipo}
              onChange={setFilterTipo}
              placeholder="Seleccionar tipo"
              className={styles.filterSelect}
              showSearch
              virtual={false}
              listHeight={220}
              optionFilterProp="children"
            >
              <Option value="Todos">Todos</Option>
              {tiposUnicos.map((tipo) => (
                <Option key={tipo} value={tipo}>
                  {tipo}
                </Option>
              ))}
            </Select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Filtro por fabricante</label>
            <Select
              value={filterFabricante}
              onChange={setFilterFabricante}
              placeholder="Seleccionar fabricante"
              className={styles.filterSelect}
              showSearch
              virtual={false}
              listHeight={220}
              optionFilterProp="children"
            >
              <Option value="Todos">Todos</Option>
              {fabricantesUnicos.map((fabricante) => (
                <Option key={fabricante} value={fabricante}>
                  {fabricante}
                </Option>
              ))}
            </Select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Filtro por sede</label>
            <Select
              value={filterSede}
              onChange={setFilterSede}
              placeholder="Seleccionar sede"
              className={styles.filterSelect}
              showSearch
              virtual={false}
              listHeight={220}
              optionFilterProp="children"
            >
              <Option value="Todos">Todos</Option>
              {sedesUnicas.map((sede) => (
                <Option key={sede} value={sede}>
                  {sede}
                </Option>
              ))}
            </Select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Filtro por estado</label>
            <Select
              value={filterEstado}
              onChange={setFilterEstado}
              placeholder="Seleccionar estado"
              className={styles.filterSelect}
              showSearch
              virtual={false}
              listHeight={220}
              optionFilterProp="children"
            >
              <Option value="Todos">Todos</Option>
              {estadosUnicos.map((estado) => (
                <Option key={estado} value={estado}>
                  {estado}
                </Option>
              ))}
            </Select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Filtro por responsable</label>
            <Select
              value={filterResponsable}
              onChange={setFilterResponsable}
              placeholder="Seleccionar responsable"
              className={styles.filterSelect}
              showSearch
              virtual={false}
              listHeight={220}
              optionFilterProp="children"
            >
              <Option value="Todos">Todos</Option>
              <Option value="SIN RESPONSABLE">SIN RESPONSABLE</Option>
              {responsablesUnicos.map((responsable) => (
                <Option key={responsable} value={responsable}>
                  {responsable}
                </Option>
              ))}
            </Select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              Filtro fecha de actualización
            </label>
            <RangePicker
              value={filterFecha}
              onChange={(dates) =>
                setFilterFecha(dates as [Moment | null, Moment | null] | null)
              }
              format="DD/MM/YYYY"
              placeholder={["Fecha inicio", "Fecha fin"]}
              className={styles.rangePicker}
            />
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert message="Error" description={error} type="error" showIcon />
        ) : (
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={data}
            rowKey={(record) => (record as any).uniqueKey || record.idActivo}
            loading={loading}
            className={styles.table}
            pagination={{
              current: currentPage,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              onChange: (page, size) => {
                setCurrentPage(page);
                if (size) setPageSize(size);
              },
              showTotal: (total, range) => (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span>
                    Página {currentPage} de {Math.ceil(total / pageSize)}
                  </span>
                  {selectedRowKeys.length > 0 && (
                    <span style={{ fontWeight: 600 }}>
                      {selectedRowKeys.length} Activos seleccionados
                    </span>
                  )}
                </div>
              ),
            }}
          />
        )}
      </div>

      <ModalActivo
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSubmit={() => {
          // Recargar datos después de crear un activo
          // Esto se manejará cuando se conecte la API real
          setModalVisible(false);
        }}
      />
    </Content>
  );
}
