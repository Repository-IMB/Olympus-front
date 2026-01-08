import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Table,
  Button,
  Tag,
  Spin,
  Alert,
  Tooltip,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import SelectClient from "../SelectClient/SelectClient";
import { getCookie } from "../../utils/cookies";
import { jwtDecode } from "jwt-decode";
import api from "../../servicios/api";
import styles from "./Opportunities.module.css";
import type { ColumnsType } from "antd/es/table";

const { Content } = Layout;

interface TokenData {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
}

/** ⬇️ SOLO SE AGREGA recordatorios */
interface Opportunity {
  id: number;
  personaNombre: string;
  nombreEstado: string;
  productoNombre: string;
  fechaCreacion: string;
  personaCorreo: string;
  asesorNombre: string;
  totalMarcaciones?: number;
  recordatorios: string[];
}

const getReminderColor = (fechaRecordatorio: string): string => {
  const now = new Date();
  const reminderDate = new Date(fechaRecordatorio);

  const diffMs = reminderDate.getTime() - now.getTime();
  const hoursRemaining = diffMs / (1000 * 60 * 60);

  if (hoursRemaining <= 0) return "#bfbfbf"; // pasado
  if (hoursRemaining <= 5) return "#ff4d4f"; // rojo
  if (hoursRemaining < 24) return "#ffd666"; // amarillo
  return "#1677ff"; // azul
};

export default function OpportunitiesInterface() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSelectClientModalVisible, setIsSelectClientModalVisible] =
    useState(false);

  const navigate = useNavigate();

  const token = getCookie("token");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { idUsuario, idRol } = useMemo(() => {
    let idU = 0;
    let rNombre = "";
    let idR = 0;

    if (!token) return { idUsuario: 0, rolNombre: "", idRol: 0 };

    try {
      const decoded = jwtDecode<TokenData>(token);
      idU = parseInt(
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ] || "0"
      );
      rNombre =
        decoded[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ] || "";

      const rolesMap: Record<string, number> = {
        Asesor: 1,
        Supervisor: 2,
        Gerente: 3,
        Administrador: 4,
        Desarrollador: 5,
      };
      idR = rolesMap[rNombre] ?? 0;
    } catch (e) {
      console.error("Error al decodificar token (useMemo)", e);
    }

    return { idUsuario: idU, rolNombre: rNombre, idRol: idR };
  }, [token]);

  useEffect(() => {
    if (!idUsuario || !idRol) {
      setOpportunities([]);
      setLoading(false);
      return;
    }

    const fetchOpportunities = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(
          "/api/VTAModVentaOportunidad/ObtenerTodasConRecordatorio",
          {
            params: {
              idUsuario,
              idRol,
              pageNumber: currentPage,
              pageSize: pageSize
            }
          }
        );

        // Actualizar información de paginación desde el backend
        setTotalRecords(res.data?.totalRecords ?? 0);
        setTotalPages(res.data?.totalPages ?? 0);

        const raw: any[] = res.data?.oportunidad ?? [];

        // ✅ OPTIMIZACIÓN: Usar Map para agrupación O(n) en lugar de filter repetido O(n²)
        const map = new Map<number, Opportunity>();

        // ✅ Un solo loop para procesar todo
        for (let i = 0; i < raw.length; i++) {
          const op = raw[i];
          const id = op.id;

          let opportunity = map.get(id);

          // Si no existe, crear la oportunidad
          if (!opportunity) {
            opportunity = {
              id: id,
              personaNombre: op.personaNombre,
              nombreEstado: op.nombreEstado,
              productoNombre: op.productoNombre,
              fechaCreacion: op.fechaCreacion,
              personaCorreo: op.personaCorreo,
              asesorNombre: op.asesorNombre,
              totalMarcaciones: Number(op.totalMarcaciones ?? 0),
              recordatorios: [],
            };
            map.set(id, opportunity);
          }

          // Agregar recordatorio si existe
          if (op.fechaRecordatorio) {
            opportunity.recordatorios.push(op.fechaRecordatorio);
          }
        }

        // ✅ OPTIMIZACIÓN: Ordenar recordatorios una sola vez aquí, no en cada render
        const agrupadas = Array.from(map.values());
        for (let i = 0; i < agrupadas.length; i++) {
          if (agrupadas[i].recordatorios.length > 1) {
            agrupadas[i].recordatorios.sort((a, b) =>
              new Date(a).getTime() - new Date(b).getTime()
            );
          }
        }

        setOpportunities(agrupadas);
      } catch (e: any) {
        console.error("Error al obtener oportunidades", e);
        setError(
          e?.response?.data?.message ??
            e.message ??
            "Error al obtener oportunidades"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, [idUsuario, idRol, currentPage, pageSize]);

  // ✅ OPTIMIZACIÓN: Memoizar para evitar re-crear en cada render
  const handleClick = useCallback((id: number) => {
    navigate(`/leads/oportunidades/${id}`);
  }, [navigate]);

  const columns: ColumnsType<Opportunity> = [
    {
      title: "Fecha y Hora",
      dataIndex: "fechaCreacion",
      key: "fechaCreacion",
      render: (fechaCreacion: string) => (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <CalendarOutlined style={{ color: "#8c8c8c", marginTop: "2px" }} />
          <div>
            <div style={{ color: "#000000", fontSize: "14px" }}>
              {new Date(fechaCreacion).toLocaleDateString()}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "#8c8c8c",
                fontSize: "13px",
              }}
            >
              <ClockCircleOutlined style={{ fontSize: "12px" }} />
              {new Date(fechaCreacion).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Nombre Completo",
      dataIndex: "personaNombre",
      key: "personaNombre",
    },
    {
      title: "Correo",
      dataIndex: "personaCorreo",
      key: "personaCorreo",
      render: (personaCorreo: string) => personaCorreo || "-",
    },
    {
      title: "Estado",
      dataIndex: "nombreEstado",
      key: "nombreEstado",
      render: (nombreEstado: string) => {
        let color = "green";

        if (nombreEstado === "Calificado") {
          color = "blue";
        } else if (nombreEstado === "Registrado") {
          color = "blue";
        } else if (nombreEstado === "Promesa") {
          color = "gold";
        } else if (nombreEstado === "No calificado") {
          color = "red";
        }

        return (
          <Tag
            color={color}
            style={{ borderRadius: "12px", padding: "2px 12px" }}
          >
            {nombreEstado}
          </Tag>
        );
      },
    },
    {
      title: "Programa",
      dataIndex: "productoNombre",
      key: "productoNombre",
    },
    {
      title: "Total Marcaciones",
      dataIndex: "totalMarcaciones",
      key: "totalMarcaciones",
      render: (totalMarcaciones: number) => (
        <span>
          {typeof totalMarcaciones === "number" ? totalMarcaciones : "-"}
        </span>
      ),
      align: "center",
      width: 140,
    },
    {
      title: "Recordatorio",
      key: "recordatorios",
      width: 240,
      render: (_: any, record: Opportunity) =>
        record.recordatorios.length === 0 ? (
          "-"
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {record.recordatorios
              .slice(0, 3)
              .map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: getReminderColor(r),
                    color: "#ffffff",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  <FileTextOutlined style={{ fontSize: "12px" }} />
                  {new Date(r).toLocaleDateString("es-ES")}{" "}
                  {new Date(r).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </div>
              ))}
          </div>
        ),
    },
    {
      title: "Asesor",
      dataIndex: "asesorNombre",
      key: "asesorNombre",
      render: (asesorNombre: string) => asesorNombre || "-",
    },
    {
      title: "Acciones",
      key: "actions",
      align: "center",
      render: (_: any, record: Opportunity) => (
        <Tooltip title="Ver Detalle">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            style={{ backgroundColor: "#1f1f1f", borderColor: "#1f1f1f" }}
            onClick={() => handleClick(record.id)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Content style={{ padding: "20px", background: "#f5f5f5" }}>
      {/* Action Buttons */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
        }}
      >
        {idRol !== 1 && (
          <Button
            style={{ borderRadius: "6px" }}
            onClick={() => setIsSelectClientModalVisible(true)}
          >
            Agregar Oportunidad
          </Button>
        )}
        <Button
          style={{ borderRadius: "6px" }}
          onClick={() => navigate("/leads/SalesProcess")}
        >
          Vista de Proceso
        </Button>
        <Button
          type="primary"
          style={{
            background: "#1f1f1f",
            borderColor: "#1f1f1f",
            borderRadius: "6px",
          }}
        >
          Vista de Tabla
        </Button>
      </div>

      <SelectClient
        visible={isSelectClientModalVisible}
        onClose={() => setIsSelectClientModalVisible(false)}
      />

      <div className={styles.card}>
        <h1 className={styles.title}>Oportunidades</h1>

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50vh",
            }}
          >
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert message="Error" description={error} type="error" showIcon />
        ) : (
        <Table
          columns={columns}
          dataSource={opportunities}
          rowKey="id"
          className={styles.table}
          scroll={{ x: isMobile ? 800 : undefined }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalRecords, // Total de registros desde el backend
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            onChange: (page: number, newPageSize?: number) => {
              setCurrentPage(page);
              if (typeof newPageSize === "number" && newPageSize !== pageSize) {
                setPageSize(newPageSize);
                setCurrentPage(1); // Resetear a página 1 cuando cambia el tamaño
              }
            },
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total}`,
            hideOnSinglePage: false
          }}
        />
        )}
      </div>
    </Content>
  );
}
