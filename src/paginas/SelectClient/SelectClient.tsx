import React, { useState, useEffect } from "react";
import { Modal, AutoComplete, Button, Card } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  obtenerClientesPotenciales,
  type ClientePotencial,
} from "../../config/rutasApi";
import "./SelectClient.css";

interface SelectClientProps {
  visible?: boolean;
  onClose?: () => void;
  onSelectClient?: (client: ClientePotencial) => void;
  onCreateNewClient?: () => void;
}

const SelectClient: React.FC<SelectClientProps> = ({
  visible = true,
  onClose,
  onSelectClient,
  onCreateNewClient,
}) => {
  const [searchText, setSearchText] = useState("");
  const [clientes, setClientes] = useState<ClientePotencial[]>([]);
  const [loading, setLoading] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<ClientePotencial | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarClientes = async () => {
      try {
        setLoading(true);
        const data = await obtenerClientesPotenciales();
        const clientesOrdenados = data.sort((a, b) => b.id - a.id);
        setClientes(clientesOrdenados);
      } catch (error) {
        // console.error("Error al cargar clientes:", error);
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      cargarClientes();
    }
  }, [visible]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const handleSelectClient = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id.toString() === clienteId);
    if (cliente) {
      setClienteSeleccionado(cliente);
      setSearchText("");
    }
  };

  const handleConfirmClient = () => {
    if (clienteSeleccionado) {
      if (onSelectClient) {
        onSelectClient(clienteSeleccionado);
      } else {
        navigate("/leads/CreateOpportunity", {
          state: { client: clienteSeleccionado },
        });
      }
    }
  };

  const handleCreateNewClient = () => {
    if (onCreateNewClient) {
      onCreateNewClient();
    } else {
      navigate("/leads/CreateClient");
    }
  };

  // Filtrar clientes basado en el texto de búsqueda
  const filteredClientes =
    searchText.trim() === ""
      ? clientes
      : clientes.filter((cliente) => {
          const nombreCompleto =
            `${cliente.persona.nombres} ${cliente.persona.apellidos}`.toLowerCase();
          const searchLower = searchText.toLowerCase();
          return (
            nombreCompleto.includes(searchLower) ||
            cliente.persona.correo.toLowerCase().includes(searchLower) ||
            cliente.persona.celular.includes(searchText)
          );
        });

  const options = filteredClientes.map((cliente) => ({
    value: cliente.id.toString(),
    label: (
      <div
        style={{ display: "flex", flexDirection: "column", padding: "8px 0" }}
      >
        <div style={{ fontWeight: 500, fontSize: "14px" }}>
          {cliente.persona.nombres} {cliente.persona.apellidos}
        </div>
        <div style={{ fontSize: "12px", color: "#666" }}>
          {cliente.persona.prefijoPaisCelular} {cliente.persona.celular}
        </div>
        <div style={{ fontSize: "12px", color: "#666" }}>
          {cliente.persona.correo}
        </div>
      </div>
    ),
  }));

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      footer={null}
      closeIcon={<CloseOutlined />}
      className="select-client-modal"
      width={600}
    >
      <div className="select-client-container">
        <h2 className="select-client-title">Seleccionar Cliente</h2>

        <AutoComplete
          style={{ width: "100%" }}
          options={options}
          onSelect={handleSelectClient}
          onSearch={setSearchText}
          value={searchText}
          placeholder="Buscar cliente por nombre completo, correo o celular..."
          notFoundContent={
            loading ? "Cargando..." : "No se encontraron clientes"
          }
          filterOption={false}
          defaultActiveFirstOption={false}
          popupMatchSelectWidth
          listHeight={400}
          virtual={false}
          placement="bottomLeft"
          dropdownAlign={{
            points: ["tl", "bl"],
            overflow: {
              adjustX: false,
              adjustY: false,
            },
          }}
          classNames={{
            popup: {
              root: "clientes-ac-popup",
            },
          }}
          getPopupContainer={() =>
            document.querySelector(
              ".select-client-modal .ant-modal-body"
            ) as HTMLElement
          }
        >
          <input
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "14px",
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
              outline: "none",
            }}
          />
        </AutoComplete>

        {clienteSeleccionado && (
          <Card
            className="selected-client-card"
            hoverable
            onClick={() => handleConfirmClient()}
            style={{ cursor: "pointer" }}
          >
            <div className="selected-client-header">
              <div style={{ flex: 1 }}>
                <h3 className="selected-client-name">
                  {clienteSeleccionado.persona.nombres}{" "}
                  {clienteSeleccionado.persona.apellidos}
                </h3>
              </div>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  setClienteSeleccionado(null);
                }}
                style={{
                  color: "#8c8c8c",
                  padding: "0",
                  minWidth: "20px",
                  height: "20px",
                }}
              />
            </div>
            <div className="selected-client-details">
              <p className="selected-client-detail">
                <strong>Celular:</strong>
                {clienteSeleccionado.persona.prefijoPaisCelular}{" "}
                {clienteSeleccionado.persona.celular}
              </p>
              <p className="selected-client-detail">
                <strong>Correo:</strong>
                {clienteSeleccionado.persona.correo}
              </p>
              <p className="selected-client-detail">
                <strong>Área de trabajo:</strong>
                {clienteSeleccionado.persona.areaTrabajo}
              </p>
              <p className="selected-client-detail">
                <strong>Industria:</strong>
                {clienteSeleccionado.persona.industria}
              </p>
              {clienteSeleccionado.persona.pais && (
                <p className="selected-client-detail">
                  <strong>País:</strong>
                  {clienteSeleccionado.persona.pais}
                </p>
              )}
            </div>
          </Card>
        )}

        <Button
          type="primary"
          block
          icon={<span className="plus-icon">+</span>}
          onClick={handleCreateNewClient}
          className="create-new-client-button"
          style={{ marginTop: "20px" }}
        >
          Crear nuevo cliente
        </Button>
      </div>
    </Modal>
  );
};

export default SelectClient;
