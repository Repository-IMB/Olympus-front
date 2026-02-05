import React, { useState, useEffect } from "react";
import { Card, Typography, Spin, Input, Button, message } from "antd";
import { EditOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";
import HistorialEstados from "./HistorialEstados";
import {
  obtenerIdPersonal,
  obtenerSpeechPorAsesorYProducto,
  crearSpeech,
  actualizarSpeech,
} from "../../servicios/SpeechServicio";
import type { SpeechDTO } from "../../modelos/Speech";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ValidacionFaseProps {
  oportunidadId?: string;
}


const ValidacionFase: React.FC<ValidacionFaseProps> = ({ oportunidadId }) => {
  const [mostrarBrochure, setMostrarBrochure] = useState(false);
  const [brochureUrl, setBrochureUrl] = useState<string | null>(null);

  // Estados para Speech
  const [mostrarSpeech, setMostrarSpeech] = useState(false);
  const [productoId, setProductoId] = useState<number | null>(null);
  const [IdPersonal, setIdPersonal] = useState<number | null>(null);
  const [speechData, setSpeechData] = useState<SpeechDTO | null>(null);
  const [speechTexto, setSpeechTexto] = useState<string>("");
  const [speechEditando, setSpeechEditando] = useState<boolean>(false);
  const [speechCargando, setSpeechCargando] = useState<boolean>(false);
  const [speechGuardando, setSpeechGuardando] = useState<boolean>(false);

  // Obtener IdPersonal al cargar el componente
  useEffect(() => {
    const cargarIdPersonal = async () => {
      try {
        const id = await obtenerIdPersonal();
        setIdPersonal(id);

      } catch (error: any) {
        console.error("Error al obtener IdPersonal:", error);
        const mensajeError = error?.response?.data?.mensaje || error?.message || "Error al obtener el asesor";
        message.error(mensajeError);
        setIdPersonal(null);
      }
    };
    cargarIdPersonal();
  }, []);

  // Cargar speech cuando cambia el productoId o el IdPersonal
  const cargarSpeech = async () => {
    if (!productoId || !IdPersonal) {
      if (!IdPersonal) {
        setSpeechData(null);
        setSpeechTexto("");
      }
      return;
    }

    setSpeechCargando(true);
    try {
      const speech = await obtenerSpeechPorAsesorYProducto(IdPersonal, productoId);
      setSpeechData(speech);
      setSpeechTexto(speech?.texto || "");
    } catch (error) {
      console.error("Error al cargar speech:", error);
      setSpeechData(null);
      setSpeechTexto("");
    } finally {
      setSpeechCargando(false);
    }
  };

  // Efecto para cargar speech cuando se tiene el productoId y el IdPersonal
  useEffect(() => {
    if (productoId && IdPersonal) {
      cargarSpeech();
    }
  }, [productoId, IdPersonal]);

  // Guardar o crear speech
  const handleGuardarSpeech = async () => {
    if (!productoId) {
      message.error("No se puede guardar: falta información del producto");
      return;
    }

    if (!IdPersonal) {
      message.error("No se puede guardar: no se pudo obtener el asesor asociado");
      return;
    }

    if (!speechTexto.trim()) {
      message.warning("El texto del speech no puede estar vacío");
      return;
    }

    setSpeechGuardando(true);
    try {
      if (speechData?.id) {
        // Actualizar speech existente
        await actualizarSpeech({
          id: speechData.id,
          idProducto: productoId,
          texto: speechTexto,
        });
        message.success("Speech actualizado correctamente");
      } else {
        // Crear nuevo speech
        await crearSpeech({
          idPersonal: IdPersonal,
          idProducto: productoId,
          texto: speechTexto,
        });
        message.success("Speech creado correctamente");
      }

      // Recargar el speech
      await cargarSpeech();
      setSpeechEditando(false);
    } catch (error: any) {
      console.error("Error al guardar speech:", error);
      const mensajeError = error?.response?.data?.mensaje || error?.message || "Error al guardar el speech";
      message.error(mensajeError);
    } finally {
      setSpeechGuardando(false);
    }
  };

  // Cancelar edición
  const handleCancelarEdicion = () => {
    setSpeechTexto(speechData?.texto || "");
    setSpeechEditando(false);
  };

  useEffect(() => {
    const handleMostrarBrochure = (event: CustomEvent) => {
      setMostrarBrochure(true);
      setBrochureUrl(event.detail.brochureUrl);
      // Ocultar speech cuando se muestra brochure
      setMostrarSpeech(false);
    };

    const handleOcultarBrochure = () => {
      setMostrarBrochure(false);
      setBrochureUrl(null);
    };

    const handleMostrarSpeech = (event: CustomEvent) => {
      setMostrarSpeech(true);
      setProductoId(event.detail.productoId);
      // Ocultar brochure cuando se muestra speech
      setMostrarBrochure(false);
      setBrochureUrl(null);
    };

    const handleOcultarSpeech = () => {
      setMostrarSpeech(false);
      setProductoId(null);
      setSpeechData(null);
      setSpeechTexto("");
      setSpeechEditando(false);
    };

    window.addEventListener("mostrarBrochure", handleMostrarBrochure as EventListener);
    window.addEventListener("ocultarBrochure", handleOcultarBrochure as EventListener);
    window.addEventListener("mostrarSpeech", handleMostrarSpeech as EventListener);
    window.addEventListener("ocultarSpeech", handleOcultarSpeech as EventListener);

    return () => {
      window.removeEventListener("mostrarBrochure", handleMostrarBrochure as EventListener);
      window.removeEventListener("ocultarBrochure", handleOcultarBrochure as EventListener);
      window.removeEventListener("mostrarSpeech", handleMostrarSpeech as EventListener);
      window.removeEventListener("ocultarSpeech", handleOcultarSpeech as EventListener);
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

      {/* === Speech del Producto === */}
      {mostrarSpeech && productoId && (
        <>
          <Title level={5} style={{ margin: "16px 0 0 0", color: "#252C35" }}>
            Tu Speech para este producto
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
            {IdPersonal === null ? (
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 6,
                  padding: 20,
                  textAlign: "center",
                }}
              >
                <Text type="secondary" style={{ fontSize: 14 }}>
                  No eres un asesor asociado o tu asesor está inactivo.
                  No puedes crear o editar un speech para este producto.
                </Text>
              </div>
            ) : speechCargando ? (
              <div style={{ textAlign: "center", padding: 20 }}>
                <Spin />
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text strong>Tu Speech para este producto</Text>
                  {!speechEditando && (
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => setSpeechEditando(true)}
                      size="small"
                    >
                      Editar
                    </Button>
                  )}
                </div>

                {speechEditando ? (
                  <div>
                    <TextArea
                      value={speechTexto}
                      onChange={(e) => setSpeechTexto(e.target.value)}
                      placeholder="Escribe tu speech personalizado para este producto..."
                      autoSize={{ minRows: 4, maxRows: 12 }}
                      style={{ marginBottom: 12 }}
                    />
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <Button
                        icon={<CloseOutlined />}
                        onClick={handleCancelarEdicion}
                        disabled={speechGuardando}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleGuardarSpeech}
                        loading={speechGuardando}
                      >
                        Guardar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 6,
                      padding: 12,
                      minHeight: 100,
                    }}
                  >
                    {speechData?.texto ? (
                      <Text style={{ whiteSpace: "pre-wrap" }}>{speechData.texto}</Text>
                    ) : (
                      <Text type="secondary" italic>
                        No tienes un speech configurado para este producto.
                        Haz clic en "Editar" para crear uno.
                      </Text>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        </>
      )}

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
