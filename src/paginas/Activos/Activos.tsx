import { useState, useEffect } from "react";
import { Input, Select, Button, Table, Tag, Spin, message } from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  PlusOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import api from "../../servicios/api";
import styles from "./Activos.module.css";
import axios from "axios";
import { getCookie } from "../../utils/cookies";

const { Option } = Select;

  const SELECT_PROPS = {
  showSearch: true,
  virtual: false,
  listHeight: 240,
  optionFilterProp: "children",
  getPopupContainer: () => document.body,
};


/* =========================
   INTERFACES
========================= */
interface Activo {
  idActivo: number;
  nombre: string;
  nombreTipo: string;
  ip?: string;
  numeroSerie?: string;
  imei?: string;
  nombreFabricante: string;
  modelo?: string;
  nombrePais: string;
  estado: string;
  nombreResponsable?: string;
  fechaActualizacion: string;
}

interface Pais {
  id: number;
  nombre: string;
}

interface Combo {
  id: number;
  nombre: string;
}

interface Asesor {
  idUsuario: number;
  idPersonal: number;
  nombre: string;
  idRol: number;
}

/* =========================
   COMPONENT
========================= */
export default function Activos() {
  const navigate = useNavigate();

  const [data, setData] = useState<Activo[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [search, setSearch] = useState("");
  const [idTipo, setIdTipo] = useState<number | null>(null);
  const [idFabricante, setIdFabricante] = useState<number | null>(null);
  const [idPais, setIdPais] = useState<number | null>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [idPersonal, setIdPersonal] = useState<number | null>(null);
  const [fabricantes, setFabricantes] = useState<Combo[]>([]);
  const [loadingFabricantes, setLoadingFabricantes] = useState(false);
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [tiposActivos, setTiposActivos] = useState<Combo[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [loadingAsesores, setLoadingAsesores] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // combos
  const [paises, setPaises] = useState<Pais[]>([]);
  const [loadingPaises, setLoadingPaises] = useState(false);

  // selección
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const token = getCookie("token");

  /* =========================
     DATA
  ========================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await api.get("/api/VTAModActivos/ObtenerPaginado", {
          params: {
            page: 1,
            pageSize: 10,
            search: search || null,
            idTipoActivo: idTipo,
            idFabricante,
            idPais,
            idPersonal,
            estado,
          },
        });

        setData(res.data.data ?? []);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, idTipo, idFabricante, idPais, idPersonal, estado]);

  /* =========================
     CARGAR PAÍSES (SEDES)
  ========================= */
  useEffect(() => {
    const cargarPaises = async () => {
      try {
        setLoadingPaises(true);
        const res = await api.get(
          "/api/VTAModVentaPais/ObtenerPaisesConPersonal",
        );
        setPaises(res.data.pais ?? []);
      } finally {
        setLoadingPaises(false);
      }
    };

    cargarPaises();
  }, []);

  const cargarTiposActivos = async () => {
    try {
      setLoadingTipos(true);
      const res = await api.get("/api/VTAModActivos/tipos");
      setTiposActivos(res.data.lista ?? []);
    } catch (e) {
      console.error("Error cargando tipos de activo", e);
    } finally {
      setLoadingTipos(false);
    }
  };

  const cargarFabricantes = async () => {
    try {
      setLoadingFabricantes(true);
      const res = await api.get("/api/VTAModActivos/fabricantes");
      setFabricantes(res.data.lista ?? []);
    } catch (e) {
      console.error("Error cargando fabricantes", e);
    } finally {
      setLoadingFabricantes(false);
    }
  };

  const obtenerAsesores = async () => {
    try {
      setLoadingAsesores(true);
      if (!token) throw new Error("No se encontró el token de autenticación");

      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:7020"
        }/api/CFGModUsuarios/ObtenerUsuariosPorRol/1`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const data = response.data;
      if (data?.usuarios && Array.isArray(data.usuarios)) {
        const listaAsesores = data.usuarios.map((u: any) => ({
          idUsuario: u.id,
          idPersonal: u.idPersonal,
          nombre: u.nombre,
          idRol: u.idRol,
        }));
        setAsesores(listaAsesores);
      } else {
        setAsesores([]);
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.mensaje ||
        err?.message ||
        "Error al cargar asesores";
      setError(errorMessage);
      message.error(errorMessage);
      setAsesores([]);
    } finally {
      setLoadingAsesores(false);
    }
  };

  useEffect(() => {
    cargarTiposActivos();
    cargarFabricantes();
    obtenerAsesores();
  }, []);

  /* =========================
     TABLE
  ========================= */
  const columns: ColumnsType<Activo> = [
    { title: "IdActivo", dataIndex: "idActivo" },
    { title: "Nombre", dataIndex: "nombre" },
    { title: "Tipo", dataIndex: "nombreTipo" },
    { title: "IP", dataIndex: "ip", render: (v) => v || "-" },
    {
      title: "Número de serie",
      dataIndex: "numeroSerie",
      render: (v) => v || "-",
    },
    { title: "IMEI", dataIndex: "imei", render: (v) => v || "-" },
    { title: "Fabricante", dataIndex: "nombreFabricante" },
    { title: "Modelo", dataIndex: "modelo", render: (v) => v || "-" },
    { title: "Sede", dataIndex: "nombrePais" },
    {
      title: "Estado",
      dataIndex: "estado",
      render: (e: string) => {
        let color = "default";
        if (e === "Disponible") color = "green";
        if (e === "Dado de baja") color = "red";

        return (
          <Tag className={styles.estadoTag} color={color}>
            {e}
          </Tag>
        );
      },
    },
    {
      title: "Responsable",
      dataIndex: "nombreResponsable",
      render: (v) => v || "-",
    },
    {
      title: "Fecha de Actualización",
      dataIndex: "fechaActualizacion",
      render: (f) => moment(f).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Acciones",
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          shape="circle"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/logistica/activos/${record.idActivo}`);
          }}
        />
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Activos</h2>

      {/* BUSCADOR */}
      <div className={styles.searchRow}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Buscar por nombre, IMEI o número de serie"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Button
          className={styles.btnGhost}
          onClick={() => {
            setSearch("");
            setIdTipo(null);
            setIdFabricante(null);
            setIdPais(null);
            setEstado(null);
            setIdPersonal(null);
          }}
        >
          Limpiar filtros
        </Button>

        <Button
          className={styles.btnPrimary}
          icon={<PlusOutlined />}
          onClick={() => navigate("/logistica/activos/nuevo")}
        >
          Nuevo activo
        </Button>
      </div>

      {/* FILTROS */}
      <div className={styles.filtersRow}>
        <Select
          {...SELECT_PROPS}
          placeholder="Tipo"
          allowClear
          loading={loadingTipos}
          value={idTipo}
          onChange={(v) => setIdTipo(v ?? null)}
        >
          {tiposActivos.map((t) => (
            <Option key={t.id} value={t.id}>
              {t.nombre}
            </Option>
          ))}
        </Select>
        <Select
          {...SELECT_PROPS}
          placeholder="Fabricante"
          allowClear
          loading={loadingFabricantes}
          value={idFabricante}
          onChange={(v) => setIdFabricante(v ?? null)}
        >
          {fabricantes.map((f) => (
            <Option key={f.id} value={f.id}>
              {f.nombre}
            </Option>
          ))}
        </Select>

        {/* 🔹 FILTRO SEDE (PAÍS) */}
        <Select
          {...SELECT_PROPS}
          placeholder="Sede"
          allowClear
          loading={loadingPaises}
          value={idPais}
          onChange={(v) => setIdPais(v ?? null)}
        >
          {paises.map((p) => (
            <Option key={p.id} value={p.id}>
              {p.nombre}
            </Option>
          ))}
        </Select>

        <Select
          {...SELECT_PROPS}
          placeholder="Estado"
          allowClear
          onChange={(v) => setEstado(v ?? null)}
        >
          <Option value="A">Disponible</Option>
          <Option value="I">Dado de baja</Option>
        </Select>

        <Select
          {...SELECT_PROPS}
          placeholder="Responsable"
          allowClear
          loading={loadingAsesores}
          value={idPersonal}
          onChange={(v) => setIdPersonal(v ?? null)}
          showSearch
          optionFilterProp="children"
        >
          {asesores.map((a) => (
            <Option key={a.idPersonal} value={a.idPersonal}>
              {a.nombre}
            </Option>
          ))}
        </Select>

        <Button
          className={styles.btnDownload}
          icon={<DownloadOutlined />}
          disabled={selectedRowKeys.length === 0}
        >
          Descargar códigos
        </Button>
      </div>

      {/* TABLA */}
      <div className={styles.tableWrapper}>
        {loading ? (
          <Spin />
        ) : (
          <Table
            rowKey="idActivo"
            columns={columns}
            dataSource={data}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{ pageSize: 10 }}
            onRow={(record) => ({
              onClick: (event) => {
                const target = event.target as HTMLElement;

                if (
                  target.closest(".ant-checkbox") ||
                  target.closest("button")
                ) {
                  return;
                }

                navigate(`/logistica/activos/${record.idActivo}`);
              },
            })}
          />
        )}
      </div>
    </div>
  );
}
