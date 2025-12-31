import React, { useEffect, useState } from "react";
import { Card, Row, Col, Tag, Typography, Divider, Spin, Alert } from "antd";
import { DownOutlined, UpOutlined } from "@ant-design/icons";

import EstadoRegistrado from "./Estados/EstadoRegistrado";
import EstadoCalificado from "./Estados/EstadoCalificado";
import EstadoPotencial from "./Estados/EstadoPotencial";
import EstadoPromesa from "./Estados/EstadoPromesa";
import EstadoNoCalificado from "./Estados/EstadoNoCalificado";
import EstadoMatriculado from "./Estados/EstadoMatriculado";

import api from "../../servicios/api";
import styles from "./HistorialEstados.module.css";

const { Text } = Typography;

const estadoMap: Record<number, string> = {
  1: "Registrado",
  2: "No Calificado",
  3: "Matriculado",
  4: "Calificado",
  5: "Potencial",
  6: "Promesa",
  7: "Perdido",
};

type HistorialItem = {
  Id?: number;
  id?: number;
  IdEstado?: number | null;
  IdOcurrencia?: number | null;
  Observaciones?: string;
  CantidadLlamadasContestadas?: number;
  CantidadLlamadasNoContestadas?: number;
  FechaCreacion?: string;
  UsuarioCreacion?: string;
  EstadoNombre?: string;
};

type Props = {
  oportunidadId: number;
};

const HistorialEstados: React.FC<Props> = ({ oportunidadId }) => {
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [abiertoId, setAbiertoId] = useState<number | null>(null);
  const [latestId, setLatestId] = useState<number | null>(null);

  const fetchHistorial = async () => {
    if (!oportunidadId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.get(
        `/api/VTAModVentaOportunidad/HistorialEstado/PorOportunidad/${oportunidadId}`
      );
      const json = res.data;

      const rawList: any[] =
        json?.historialEstados ??
        json?.historialEstado ??
        json?.HistorialEstado ??
        json?.Historiales ??
        json?.data ??
        json?.historial ??
        [];

      const list = rawList.map((h: any) => ({
        Id: h.Id ?? h.id,
        IdEstado: h.IdEstado ?? h.idEstado,
        IdOcurrencia: h.IdOcurrencia ?? h.idOcurrencia,
        Observaciones: h.Observaciones ?? "",
        FechaCreacion: h.FechaCreacion ?? h.fechaCreacion ?? h.fecha ?? null,
        UsuarioCreacion: h.UsuarioCreacion ?? h.usuarioCreacion ?? "",
        EstadoNombre:
          h.EstadoReferencia?.Nombre ??
          h.estadoReferencia?.nombre ??
          h.EstadoNombre ??
          h.estadoNombre ??
          "",
        CantidadLlamadasContestadas:
          h.CantidadLlamadasContestadas ?? h.cantidadLlamadasContestadas ?? 0,
        CantidadLlamadasNoContestadas:
          h.CantidadLlamadasNoContestadas ??
          h.cantidadLlamadasNoContestadas ??
          0,
      }));

      setHistorial(list);

      if (list.length > 0) {
        const sortedById = [...list].sort(
          (a, b) => Number(b.Id) - Number(a.Id)
        );

        const lastItem = sortedById[0];
        const lastId = Number(lastItem.Id);

        setLatestId(lastId);
        setAbiertoId(lastId);
      } else {
        setLatestId(null);
        setAbiertoId(null);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, [oportunidadId]);

  const toggleRegistro = (id: number) => {
    setAbiertoId(prev => (prev === id ? null : id));
  };

  const renderContenido = (
    estadoNombre: string,
    item: HistorialItem,
    isLatest: boolean
  ) => {
    const props = {
      oportunidadId,
      onCreado: fetchHistorial,
      activo: isLatest,
      cantidadContestadas: item.CantidadLlamadasContestadas ?? 0,
      cantidadNoContestadas: item.CantidadLlamadasNoContestadas ?? 0,
      origenOcurrenciaId: item.IdOcurrencia != null ? Number(item.IdOcurrencia) : null,
    };

    switch (estadoNombre.toLowerCase()) {
      case "registrado":
        return <EstadoRegistrado {...props} />;
      case "calificado":
        return <EstadoCalificado {...props} />;
      case "potencial":
        return <EstadoPotencial {...props} />;
      case "promesa":
        return <EstadoPromesa {...props} />;
      case "matriculado":
        return <EstadoMatriculado {...props} />;
      case "no calificado":
        return <EstadoNoCalificado {...props} />;
      default:
        return null;
    }
  };

  const getColorEstado = (estadoNombre?: string, estadoId?: number) => {
    const e = (estadoNombre ?? estadoMap[estadoId ?? 0] ?? "").toLowerCase();
    switch (e) {
      case "registrado":
      case "calificado":
      case "potencial":
      case "promesa":
        return "#9CBDFD";
      case "matriculado":
        return "#B8F3B8";
      case "no calificado":
        return "#F7B1B1";
      default:
        return "#D1D1D1";
    }
  };

  if (loading) return <Spin />;

  return (
    <div className={styles.container}>
      {error && (
        <Alert
          type="error"
          message="Error al cargar historial"
          description={error}
        />
      )}

      <div className={styles.scrollContainer}>
        {/* ENCABEZADO */}
        <div className={styles.tableHeader}>
          <div className={styles.headerIdCol}>Id</div>
          <div className={styles.headerCol}>Fecha creación</div>
          <div className={styles.headerCol}>Estado</div>
          <div className={styles.headerCol}>Marcaciones</div>
          <div className={styles.headerCol}>Asesor</div>
          <div className={styles.headerIconCol}></div>
        </div>

        {/* REGISTROS */}
        {historial.map(h => {
          const id = Number(h.Id ?? h.id);
          const abierto = abiertoId === id;
          const estado = h.EstadoNombre ?? estadoMap[h.IdEstado ?? 0] ?? "—";
          const fecha = h.FechaCreacion
            ? new Date(h.FechaCreacion).toLocaleDateString()
            : "—";

          return (
            <Card
              key={id}
              className={styles.registroCard}
              bodyStyle={{ padding: 12 }}
            >
              <Row
                align="middle"
                className={styles.registroRow}
                onClick={() => toggleRegistro(id)}
              >
                <Col flex="52px">
                  <div className={styles.idColumn}>
                    {id}
                  </div>
                </Col>

                <Col flex="1">
                  <Text>{fecha}</Text>
                </Col>

                <Col flex="1">
                  <Tag
                    color={getColorEstado(estado, h.IdEstado ?? 0)}
                    className={styles.estadoTag}
                  >
                    {estado}
                  </Tag>
                </Col>

                <Col flex="1">
                  <div className={styles.marcacionesBox}>
                    <Text>{h.CantidadLlamadasNoContestadas ?? 0}</Text>
                  </div>
                </Col>

                <Col flex="1">
                  <Text>{h.UsuarioCreacion}</Text>
                </Col>

                <Col flex="24px">
                  {abierto ? <UpOutlined /> : <DownOutlined />}
                </Col>
              </Row>

              {abierto && (
                <>
                  <Divider style={{ margin: "8px 0" }} />
                  {renderContenido(estado, h, id === latestId)}
                </>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default HistorialEstados;
