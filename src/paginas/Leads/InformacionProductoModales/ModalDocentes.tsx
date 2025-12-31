import React, { useState, useEffect } from "react";
import { Button, Checkbox, Typography, Modal } from "antd";
import { CloseOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface DocenteData {
  idDocente: number;
  idPersonaDocente: number;
  docenteNombre: string;
  moduloNombre?: string;
  docenteLogros?: string;
  modulo?: {
    nombre?: string;
    codigo?: string | null;
    descripcion?: string;
  } | null;
  [key: string]: any; // Permitir propiedades adicionales
}

interface Props {
  open: boolean;
  onClose: () => void;
  docentes: DocenteData[];
  onSave?: (docentesSeleccionados: DocenteData[]) => void;
}

const ModalDocentes: React.FC<Props> = ({ open, onClose, docentes, onSave }) => {
  const [docentesSeleccionados, setDocentesSeleccionados] = useState<number[]>([]);

  // Cargar los docentes inicialmente seleccionados (todos por defecto, máximo 3)
  useEffect(() => {
    const seleccionadosIniciales = docentes.slice(0, 3).map(d => d.idDocente);
    setDocentesSeleccionados(seleccionadosIniciales);
  }, [docentes]);

  const toggleDocente = (idDocente: number) => {
    setDocentesSeleccionados((prev) => {
      const estaSeleccionado = prev.includes(idDocente);

      if (estaSeleccionado) {
        // No permitir deseleccionar si es el único seleccionado
        if (prev.length === 1) {
          return prev;
        }
        // Deseleccionar
        return prev.filter(id => id !== idDocente);
      } else {
        // Seleccionar solo si no se ha alcanzado el límite de 3
        if (prev.length < 3) {
          return [...prev, idDocente];
        }
        return prev;
      }
    });
  };

  const handleGuardar = () => {
    if (onSave) {
      const seleccionados = docentes.filter(d => docentesSeleccionados.includes(d.idDocente));
      onSave(seleccionados);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      closeIcon={<CloseOutlined />}
      styles={{
        body: {
          padding: 20,
          fontSize: 14,
        }
      }}
    >
      <Title
        level={5}
        style={{
          textAlign: "left",
          marginBottom: 20,
          marginTop: -8,
          fontSize: 20,
          fontWeight: 600,
        }}
      >
        Docentes del producto
      </Title>

      {/* Tabla personalizada con el diseño de la imagen */}
      <div style={{ marginBottom: 16 }}>
        {/* Header de la tabla */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#2C3542",
            borderRadius: "8px 8px 0 0",
            padding: "12px 16px",
          }}
        >
          <div style={{ flex: "0 0 30%", paddingRight: 8 }}>
            <Text strong style={{ color: "#fff", fontSize: 14 }}>
              Nombre y Apellidos
            </Text>
          </div>
          <div style={{ flex: "0 0 25%", paddingRight: 8 }}>
            <Text strong style={{ color: "#fff", fontSize: 14 }}>
              Módulo
            </Text>
          </div>
          <div style={{ flex: "0 0 35%", paddingRight: 8 }}>
            <Text strong style={{ color: "#fff", fontSize: 14 }}>
              Logros
            </Text>
          </div>
          <div style={{ flex: "0 0 10%", textAlign: "center" }}>
            <Text strong style={{ color: "#fff", fontSize: 14 }}>
              Mostrar
            </Text>
          </div>
        </div>

        {/* Filas de la tabla */}
        {docentes.map((docente, index) => {
          const isChecked = docentesSeleccionados.includes(docente.idDocente);
          const backgroundColor = index % 2 === 0 ? "#F5F5F5" : "#FFFFFF";

          return (
            <div
              key={docente.idDocente}
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor,
                padding: "12px 16px",
                borderBottom: index === docentes.length - 1 ? "none" : "1px solid #E0E0E0",
                borderRadius: index === docentes.length - 1 ? "0 0 8px 8px" : "0",
              }}
            >
              <div style={{ flex: "0 0 30%", paddingRight: 8 }}>
                <Text style={{ fontSize: 13, color: "#333" }}>
                  {docente.docenteNombre}
                </Text>
              </div>
              <div style={{ flex: "0 0 25%", paddingRight: 8 }}>
                <Text style={{ fontSize: 13, color: "#333" }}>
                  {docente.moduloNombre || "-"}
                </Text>
              </div>
              <div style={{ flex: "0 0 35%", paddingRight: 8 }}>
                <Text style={{ fontSize: 13, color: "#666" }}>
                  {docente.docenteLogros || "-"}
                </Text>
              </div>
              <div style={{ flex: "0 0 10%", textAlign: "center" }}>
                <Checkbox
                  checked={isChecked}
                  onChange={() => toggleDocente(docente.idDocente)}
                  disabled={!isChecked && docentesSeleccionados.length >= 3}
                  style={{
                    cursor: (isChecked && docentesSeleccionados.length === 1)
                      ? 'not-allowed'
                      : 'pointer'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="primary"
        block
        size="large"
        style={{
          marginTop: 16,
          backgroundColor: "#1677ff",
          borderRadius: 8,
          height: 48,
          fontSize: 16,
          fontWeight: 500,
        }}
        onClick={handleGuardar}
      >
        Guardar
      </Button>
    </Modal>
  );
};

export default ModalDocentes;
