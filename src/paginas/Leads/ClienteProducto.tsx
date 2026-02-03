import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Modal,
  Button,
  Spin,
  Alert,
} from "antd";
import { LinkedinOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import InformacionProducto from "./InformacionProducto";
import { getCookie } from "../../utils/cookies";
import api from "../../servicios/api";

const { Text, Title } = Typography;

interface PotencialData {
  id?: number;
  idPersona?: number;
  desuscrito?: boolean;
  estado?: boolean;
  persona?: {
    id?: number;
    idPais?: number;
    pais?: string;
    nombres?: string;
    apellidos?: string;
    celular?: string;
    prefijoPaisCelular?: string;
    correo?: string;
    areaTrabajo?: string;
    industria?: string;
  };
}

const ProductoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isLinkedInOpen, setIsLinkedInOpen] = useState(false);
  const [potencialData, setPotencialData] = useState<PotencialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getCookie("token");

    if (!id) {
      // // console.warn("⚠️ No hay ID de oportunidad disponible");
      setLoading(false);
      return;
    }

    let mounted = true;
    const fetchPotencial = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/api/VTAModVentaOportunidad/ObtenerPotencialPorOportunidad/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!mounted) return;

        setPotencialData(res.data);
      } catch (err: any) {
        if (!mounted) return;
        // console.error("ClienteProducto - Error al obtener potencial:", err);
        setError(err?.response?.data?.message ?? err.message ?? "Error al obtener los datos del cliente");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetchPotencial();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: 40,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: "100%", padding: 16 }}>
        <Alert message="Error" description={error} type="error" showIcon />
      </div>
    );
  }

  const persona = potencialData?.persona;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <Title level={5} style={{ margin: 0, color: "#252C35" }}>
        Información del Cliente
      </Title>

      {/* === CONTENEDOR ESTILO VALIDACIONFASE === */}
      <Card
        style={{
          width: "100%",
          background: "#F0F0F0",
          borderRadius: 8,
          border: "1px solid #DCDCDC",
          boxShadow: "inset 1px 1px 4px rgba(0,0,0,0.25)", // ⬅ sombra interna gris
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
        bodyStyle={{ padding: 0 }}
      >
        {/* === CONTENIDO INTERNO (blanco con borde) === */}
        <Card
          style={{
            width: "100%",
            background: "#FFFFFF",
            borderRadius: 8,
            border: "1px solid #DCDCDC",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            padding: 12,
          }}
          bodyStyle={{ padding: 0 }}
        >
          {persona && (() => {
            const prefix = persona.prefijoPaisCelular ? String(persona.prefijoPaisCelular).replace(/\s+/g, "") : "";
            const phone = persona.celular ? String(persona.celular).replace(/\s+/g, "") : "";
            const telefonoConcatenado = prefix || phone ? `${prefix}${phone}` : "-";

            const campos: [string, string][] = [
              ["Nombre", persona.nombres || "-"],
              ["Apellidos", persona.apellidos || "-"],
              ["Teléfono", telefonoConcatenado],
              ["País", persona.pais || "-"],
              ["Correo", persona.correo || "-"],
            ];

            if (persona.areaTrabajo) {
              campos.push(["Área de trabajo", persona.areaTrabajo]);
            }

            campos.push(["Desuscrito", potencialData?.desuscrito ? "Sí" : "No"]);

            if (persona.industria) {
              campos.push(["Industria", persona.industria]);
            }

            return campos.map(([label, value], i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  padding: "4px 0",
                }}
              >
                <div style={{ color: "#676767", fontSize: 12 }}>{label}:</div>
                <div style={{ color: "rgba(0,0,0,0.85)", fontSize: 13 }}>
                  {value}
                </div>
              </div>
            ));
          })()}
        </Card>

        {/* === BOTONES === */}
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          {/* <div
            style={{
              flex: 1,
              padding: "4px 8px",
              background: "#252C35",
              borderRadius: 5,
              color: "#FFF",
              display: "flex",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            Editar
          </div> */}

          <div
            style={{
              flex: 2,
              padding: "4px 8px",
              background: "#252C35",
              borderRadius: 5,
              color: "#FFF",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              fontSize: 11,
            }}
            onClick={() => setIsLinkedInOpen(true)}
          >
            <LinkedinOutlined style={{ fontSize: 11 }} />
            Información de LinkedIn
          </div>
        </div>
      </Card>

      {/* Modal con preview */}
      <Modal
        title="Información de LinkedIn"
        open={isLinkedInOpen}
        onCancel={() => setIsLinkedInOpen(false)}
        footer={null}
        width="90%"
        style={{ maxWidth: 700 }}
      >
        <div style={{ padding: 16, fontFamily: "Arial, sans-serif" }}>
          {persona ? (
            <>
              {/* INPUT con el nombre dinámico */}
              <div style={{ marginBottom: 16 }}>
                <input
                  value={`${persona.nombres ?? ""} ${
                    persona.apellidos ?? ""
                  } LinkedIn`}
                  readOnly
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 24,
                    border: "1px solid #ccc",
                    fontSize: 14,
                  }}
                />
              </div>

              {/* LISTA DE RESULTADOS SIMILAR A GOOGLE */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div>
                  <a
                    href="https://www.linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 16,
                      color: "#1a0dab",
                      textDecoration: "none",
                    }}
                  >
                    {persona.nombres} {persona.apellidos} | LinkedIn
                  </a>

                  <div style={{ fontSize: 14, color: "#006621" }}>
                    linkedin.com/in/
                  </div>

                  <div style={{ fontSize: 13, color: "#4d5156" }}>
                    Resultados de LinkedIn relacionados con {persona.nombres}{" "}
                    {persona.apellidos}.
                  </div>
                </div>

                <div>
                  <a
                    href="https://www.linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 16,
                      color: "#1a0dab",
                      textDecoration: "none",
                    }}
                  >
                    Más resultados de LinkedIn
                  </a>
                </div>

                {/* BUSQUEDA COMPLETA EN GOOGLE */}
                <Button
                  style={{ alignSelf: "center", marginTop: 12 }}
                  onClick={() =>
                    window.open(
                      `https://www.google.com/search?q=${encodeURIComponent(
                        `${persona.nombres} ${persona.apellidos} LinkedIn`
                      )}`,
                      "_blank"
                    )
                  }
                >
                  Ver búsqueda completa en Google
                </Button>
              </div>
            </>
          ) : (
            <Text>No se encontró información del cliente.</Text>
          )}
        </div>
      </Modal>

      <InformacionProducto oportunidadId={id} />
    </div>
  );
};

export default ProductoDetalle;
