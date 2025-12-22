import React, { useState, useEffect } from "react";
import { Card, Typography } from "antd";
import { RightOutlined } from "@ant-design/icons";
import HistorialEstados from "./HistorialEstados";

const { Title, Text } = Typography;

interface ValidacionFaseProps {
  oportunidadId?: string;
}

const ValidacionFase: React.FC<ValidacionFaseProps> = ({ oportunidadId }) => {
  const [mostrarBrochure, setMostrarBrochure] = useState(false);
  const [brochureUrl, setBrochureUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleMostrarBrochure = (event: CustomEvent) => {
      setMostrarBrochure(true);
      setBrochureUrl(event.detail.brochureUrl);
    };

    const handleOcultarBrochure = () => {
      setMostrarBrochure(false);
      setBrochureUrl(null);
    };

    window.addEventListener("mostrarBrochure", handleMostrarBrochure as EventListener);
    window.addEventListener("ocultarBrochure", handleOcultarBrochure as EventListener);

    return () => {
      window.removeEventListener("mostrarBrochure", handleMostrarBrochure as EventListener);
      window.removeEventListener("ocultarBrochure", handleOcultarBrochure as EventListener);
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* <Title level={5} style={{ margin: 0, color: "#252C35" }}>
        Validación de fase
      </Title> */}

      {/* === Contenedor gris con sombra que abarca todo === */}
      {/* <Card
        style={{
          width: "100%",
          background: "#F0F0F0",
          borderRadius: 8,
          border: "1px solid #DCDCDC",
          boxShadow: "inset 1px 1px 4px rgba(0,0,0,0.25)",
        }}
        bodyStyle={{
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {["Debes Validar", "Preguntas de fase", "Personalidad del cliente"].map(
          (texto) => (
            <div
              key={texto}
              style={{
                background: "#FFFFFF",
                border: "1px solid #DCDCDC",
                borderRadius: 8,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <Text
                style={{
                  color: "rgba(0, 0, 0, 0.85)",
                  fontSize: 14,
                  fontWeight: 400,
                }}
              >
                {texto}
              </Text>
              <RightOutlined
                style={{ color: "rgba(194,194,194,0.85)", fontSize: 12 }}
              />
            </div>
          )
        )}
      </Card> */}

      {/* === Título: Historial de estados === */}
      <Title level={5} style={{ margin: 0, color: "#252C35" }}>
        Historial de estados
      </Title>

      {/* === Contenedor gris con sombra: Historial de estados === */}
      <Card
        style={{
          width: "100%",
          background: "#F0F0F0",
          borderRadius: 8,
          border: "1px solid #DCDCDC",
          boxShadow: "inset 1px 1px 3px rgba(0, 0, 0, 0.25)",
        }}
        bodyStyle={{ padding: 12 }}
      >
        {oportunidadId && <HistorialEstados oportunidadId={Number(oportunidadId)} />}
      </Card>

      {/* === Visor de PDF del Brochure === */}
      {mostrarBrochure && brochureUrl && (
        <>
          <Title level={5} style={{ margin: "16px 0 0 0", color: "#252C35" }}>
            Brochure del Producto
          </Title>
          <Card
            style={{
              width: "100%",
              background: "#F0F0F0",
              borderRadius: 8,
              border: "1px solid #DCDCDC",
              boxShadow: "inset 1px 1px 3px rgba(0, 0, 0, 0.25)",
            }}
            bodyStyle={{ padding: 12 }}
          >
            <div
              style={{
                width: "100%",
                height: "600px",
                background: "#FFFFFF",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <iframe
                src={brochureUrl}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                title="Brochure del Producto"
              />
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default ValidacionFase;
