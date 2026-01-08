import { useParams } from "react-router-dom";
import { Button, Card, Row, Col, Space } from "antd";
import { useState } from "react";
import TablaEstadosReducida from "./TablaEstados";
import ModalEditarCliente from "./CompCliente";
import OportunidadActual from "./OportunidadActual";
import ControlOportunidades from "./Control";


export default function Oportunidad() {
  const { id } = useParams<{ id: string }>();
  const [celularCliente, setCelularCliente] = useState<string>("");

  return (
    <Row gutter={[16, 16]} style={{ padding: 16 }}>
      {/* === Columna izquierda === */}
      <Col xs={24} md={6}>
        <ModalEditarCliente
          id={id}
          onUpdated={() => window.location.reload()}
          onCelularObtenido={(celularConPrefijo) => setCelularCliente(celularConPrefijo)}
        />
      </Col>

      {/* === Columna derecha === */}
      <Col
        xs={24}
        md={18}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        {/* Card de botones */}
        <Card
          style={{
            backgroundColor: "#f1f5f998",
            margin: "0 auto",
            borderRadius: 12,
          }}
          bodyStyle={{ padding: 16 }}
        >
          <Space
            size={16}
            style={{
              justifyContent: "center",
              flexWrap: "wrap",
              width: "100%",
            }}
          >
            <Button
              type="primary"
              style={{ backgroundColor: "#000", borderColor: "#000" }}
            >
              Oportunidad actual
            </Button>
            <Button
              style={{
                backgroundColor: "#fff",
                borderColor: "#000",
                color: "#000",
              }}
            >
              Historial oportunidades{" "}
              <span style={{ color: "#3b82f6" }}>(5)</span>
            </Button>
          </Space>
        </Card>

        {/* Card de Oportunidad Actual */}
        <Card style={{ flex: 1 }}>
          <OportunidadActual id={id} />
          <ControlOportunidades idOportunidad={id} />
          {/* Historial dividido en 2 columnas */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginTop: 16,
            }}
          >
            <Row gutter={[16, 16]}>
              {/* Columna izquierda - Historial de Estados */}
            
                  <TablaEstadosReducida idOportunidad={id}/>

            </Row>
          </div>
        </Card>
      </Col>
    </Row>
  );
}
