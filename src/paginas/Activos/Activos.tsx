import { useState, useEffect } from "react";
import {
  Layout,
  Table,
  Button,
  Tag,
  Spin,
  Alert,
  Input,
  DatePicker,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import moment, { type Moment } from "moment";
import api from "../../servicios/api";
import styles from "./Activos.module.css";
import type { ColumnsType } from "antd/es/table";
import ModalActivo from "./ModalActivo";

const { RangePicker } = DatePicker;
const { Content } = Layout;

/* =========================
   INTERFACE REAL (BACKEND)
========================= */
interface Activo {
  idActivo: number;
  nombre: string;

  idTipoActivo: number;
  nombreTipo: string;

  idFabricante: number;
  nombreFabricante: string;

  idPais: number;
  nombrePais: string;

  idPersonal: number | null;
  nombreResponsable?: string;

  ip?: string;
  numeroSerie?: string;
  imei?: string;
  modelo?: string;

  uniqueKey: string;
  estado: string;
  fechaActualizacion: string;
}

/* =========================
   HELPERS
========================= */
const getEstadoColor = (estado: string): string => {
  switch (estado) {
    case "Disponible":
      return "green";
    case "Dado de baja":
      return "red";
    default:
      return "default";
  }
};

/* =========================
   COMPONENT
========================= */
export default function Activos() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState<Activo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const [filterFecha, setFilterFecha] = useState<
    [Moment | null, Moment | null] | null
  >(null);

  /* =========================
     QUERY PARAMS
  ========================= */
  useEffect(() => {
    setSearchParams({
      page: currentPage.toString(),
      pageSize: pageSize.toString(),
      search: searchText || "",
    });
  }, [currentPage, pageSize, searchText, setSearchParams]);

  /* =========================
     FETCH DATA
  ========================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get("/api/VTAModActivos/ObtenerPaginado", {
          params: {
            page: currentPage,
            pageSize,
            search: searchText || null,
            fechaInicio: filterFecha?.[0]?.format("YYYY-MM-DD") ?? null,
            fechaFin: filterFecha?.[1]?.format("YYYY-MM-DD") ?? null,
          },
        });

        setData(res.data.data || []);
        setTotal(res.data.total || 0);
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
  }, [currentPage, pageSize, searchText, filterFecha]);

  /* =========================
     COLUMNS (CORRECTAS)
  ========================= */
  const columns: ColumnsType<Activo> = [
    { title: "ID", dataIndex: "idActivo" },
    { title: "Nombre", dataIndex: "nombre" },
    { title: "Tipo", dataIndex: "nombreTipo" },
    { title: "Fabricante", dataIndex: "nombreFabricante" },
    { title: "IP", dataIndex: "ip", render: (v) => v || "-" },
    {
      title: "Serie",
      dataIndex: "numeroSerie",
      render: (v) => v || "-",
    },
    {
      title: "IMEI",
      dataIndex: "imei",
      render: (v) => v || "-",
    },
    { title: "Modelo", dataIndex: "modelo", render: (v) => v || "-" },
    { title: "País", dataIndex: "nombrePais" },
    {
      title: "Estado",
      dataIndex: "estado",
      render: (estado) => (
        <Tag color={getEstadoColor(estado)}>{estado}</Tag>
      ),
    },
    {
      title: "Última actualización",
      dataIndex: "fechaActualizacion",
      render: (f) => moment(f).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Acciones",
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() =>
            navigate(`/logistica/activos/${record.idActivo}`)
          }
        />
      ),
    },
  ];

  /* =========================
     RENDER
  ========================= */
  return (
    <Content style={{ padding: "20px", background: "#f5f5f5" }}>
      <div className={styles.card}>
        <h1 className={styles.title}>Activos</h1>

        <div className={styles.searchAndActionsContainer}>
          <Input
            placeholder="Buscar por nombre, modelo, IP o serie"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setCurrentPage(1);
            }}
            allowClear
          />

          <div className={styles.actionButtons}>
            <Button type="primary" onClick={() => setModalVisible(true)}>
              Nuevo activo
            </Button>

            <Button icon={<DownloadOutlined />} disabled>
              Descargar
            </Button>
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
            columns={columns}
            dataSource={data}
            rowKey="idActivo"
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
            }}
          />
        )}
      </div>

      <ModalActivo
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSubmit={() => {
          setModalVisible(false);
          setCurrentPage(1);
        }}
      />
    </Content>
  );
}
