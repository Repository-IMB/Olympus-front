import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Modal,
  message,
  Select,
  Spin,
} from "antd";
import { useNavigate } from "react-router-dom";
import { CloseOutlined } from "@ant-design/icons";
import {
  insertarClientePotencial,
  obtenerPaises,
  type Pais,
} from "../../config/rutasApi";
import "./CreateClient.css";
import { getCookie } from "../../utils/cookies";

const CreateClient: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingPaises, setLoadingPaises] = useState(true);
  const [paises, setPaises] = useState<Pais[]>([]);
  const [indicativo, setIndicativo] = useState("+51"); // Perú por defecto
  const [paisSeleccionado, setPaisSeleccionado] = useState<Pais | null>(null);

  interface AreaTrabajo {
    id: number;
    nombre: string;
  }

  const [areasTrabajo, setAreasTrabajo] = useState<AreaTrabajo[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);

  const cargarAreasTrabajo = async () => {
    try {
      setLoadingAreas(true);

      const token = getCookie("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/CFGModUsuarios/ObtenerAreaTrabajo`,
        {
          method: "GET",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        message.error("No se pudieron cargar las áreas de trabajo");
        return;
      }

      const data = await res.json();

      const lista = Array.isArray(data.areaTrabajo)
        ? data.areaTrabajo.filter((a: any) => a.estado)
        : [];

      setAreasTrabajo(lista);
    } catch (error) {
      console.error(error);
      message.error("Error al cargar áreas de trabajo");
    } finally {
      setLoadingAreas(false);
    }
  };

  useEffect(() => {
    cargarAreasTrabajo();
    const cargarPaises = async () => {
      try {
        setLoadingPaises(true);
        const paisesData = await obtenerPaises();
        // Filtrar solo países activos
        const paisesActivos = paisesData.filter((p) => p.estado);
        setPaises(paisesActivos);

        // Buscar Perú y establecerlo como país por defecto
        const peru = paisesActivos.find((p) => p.nombre === "Perú");
        if (peru) {
          setPaisSeleccionado(peru);
          setIndicativo(`+${peru.prefijoCelularPais}`);
          form.setFieldsValue({ pais: peru.nombre });
        }
      } catch (error) {
        console.error("Error al cargar países:", error);
        message.error("Error al cargar la lista de países");
      } finally {
        setLoadingPaises(false);
      }
    };

    cargarPaises();
  }, [form]);

  const handlePaisChange = (paisNombre: string) => {
    const pais = paises.find((p) => p.nombre === paisNombre);
    if (pais) {
      setPaisSeleccionado(pais);
      setIndicativo(`+${pais.prefijoCelularPais}`);
    }
  };

  const detectarYSeleccionarPais = (
    numeroCompleto: string
  ): { numeroLocal: string; paisEncontrado: Pais | null } => {
    // Eliminar espacios y el símbolo +
    const numero = numeroCompleto.replace(/\s/g, "").replace(/^\+/, "");

    // Solo intentar detectar si el número es suficientemente largo
    if (numero.length < 8) {
      // Número muy corto, probablemente no tiene indicativo
      return { numeroLocal: numero, paisEncontrado: null };
    }

    // Intentar detectar el prefijo (de 1 a 4 dígitos)
    // Empezar desde el más largo para evitar conflictos (ej: 595 vs 59)
    for (let longitudPrefijo = 4; longitudPrefijo >= 1; longitudPrefijo--) {
      const posiblePrefijo = numero.substring(0, longitudPrefijo);
      const prefijoNumerico = parseInt(posiblePrefijo);

      // Buscar país con ese prefijo
      const paisEncontrado = paises.find(
        (p) => p.prefijoCelularPais === prefijoNumerico
      );

      if (paisEncontrado) {
        const numeroLocal = numero.substring(longitudPrefijo);

        // Verificar que el número local resultante tenga una longitud razonable
        // para ese país (evitar falsos positivos)
        if (
          numeroLocal.length >= paisEncontrado.digitoMinimo &&
          numeroLocal.length <= paisEncontrado.digitoMaximo
        ) {
          // Seleccionar el país automáticamente
          setPaisSeleccionado(paisEncontrado);
          setIndicativo(`+${paisEncontrado.prefijoCelularPais}`);
          form.setFieldsValue({ pais: paisEncontrado.nombre });

          return { numeroLocal, paisEncontrado };
        }
      }
    }

    // Si no se encontró prefijo válido, retornar el número sin espacios
    // y mantener el país actual seleccionado (selección manual)
    return { numeroLocal: numero, paisEncontrado: null };
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const clienteData = {
        idPais: paisSeleccionado?.id || 0,
        pais: values.pais || "",
        nombres: values.nombres || "",
        apellidos: values.apellidos || "",
        celular: values.celular || "",
        prefijoPaisCelular: indicativo.replace("+", ""),
        correo: values.correo || "",
        areasTrabajo: values.nombreAreaTrabajo || "",
        industria: values.industria || "",
      };

      await insertarClientePotencial(clienteData);
      message.success("Cliente creado exitosamente");
      form.resetFields();

      // Resetear al país por defecto (Perú)
      const peru = paises.find((p) => p.nombre === "Perú");
      if (peru) {
        setPaisSeleccionado(peru);
        setIndicativo(`+${peru.prefijoCelularPais}`);
        form.setFieldsValue({ pais: peru.nombre });
      }

      navigate("/leads/SelectClient");
    } catch (error: any) {
      console.error("Error al crear cliente:", error);
      if (error?.response?.data?.message) {
        message.error(error.response.data.message);
      } else if (error?.message) {
        message.error("Error en validación: " + error.message);
      } else {
        message.error("Error al crear el cliente");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate(-1); // Volver a la página anterior
  };

  return (
    <div className="create-client-page">
      <Modal
        open={true}
        onCancel={handleClose}
        footer={null}
        width={650}
        centered
        closeIcon={<CloseOutlined />}
        className="create-client-modal"
      >
        <div className="create-client-header">
          <h2 className="create-client-title">Crear Cliente</h2>
        </div>

        <Form
          form={form}
          layout="vertical"
          className="create-client-form"
          requiredMark={false}
        >
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    Nombres<span style={{ color: "#ff4d4f" }}>*</span>
                  </span>
                }
                name="nombres"
                rules={[
                  { required: true, message: "Los nombres son requeridos" },
                ]}
              >
                <Input placeholder="" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Apellidos" name="apellidos">
                <Input placeholder="" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={8}>
            <Col span={10}>
              <Form.Item
                label={
                  <span>
                    País<span style={{ color: "#ff4d4f" }}>*</span>
                  </span>
                }
                name="pais"
                rules={[{ required: true, message: "El país es requerido" }]}
              >
                <Select
                  placeholder="Seleccionar país"
                  onChange={handlePaisChange}
                  showSearch
                  loading={loadingPaises}
                  disabled={loadingPaises}
                  virtual={false}
                  autoClearSearchValue={false}
                  filterOption={(input, option) =>
                    (option?.children?.toString() || "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  notFoundContent={
                    loadingPaises ? (
                      <Spin size="small" />
                    ) : (
                      "No hay países disponibles"
                    )
                  }
                >
                  {paises.map((pais) => (
                    <Select.Option key={pais.id} value={pais.nombre}>
                      {pais.nombre}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={2}>
              <Form.Item label={<span style={{ fontSize: "12px" }}>Ind.</span>}>
                <Input
                  value={indicativo}
                  disabled
                  style={{
                    textAlign: "center",
                    fontSize: "13px",
                    padding: "4px",
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    Teléfono<span style={{ color: "#ff4d4f" }}>*</span>
                  </span>
                }
                name="celular"
                rules={[
                  { required: true, message: "El teléfono es requerido" },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();

                      // Limpiar espacios antes de validar (por si acaso)
                      const valorLimpio = value.replace(/\s/g, "");

                      // Validar que solo contenga números (después de limpiar espacios)
                      if (!/^\d+$/.test(valorLimpio)) {
                        return Promise.reject(
                          "El teléfono debe contener solo números"
                        );
                      }

                      // Validar longitud basada en el país seleccionado
                      if (paisSeleccionado) {
                        const longitud = valorLimpio.length;
                        const { digitoMinimo, digitoMaximo } = paisSeleccionado;

                        if (
                          longitud < digitoMinimo ||
                          longitud > digitoMaximo
                        ) {
                          return Promise.reject(
                            `El teléfono debe tener entre ${digitoMinimo} y ${digitoMaximo} dígitos para ${paisSeleccionado.nombre}`
                          );
                        }
                      }

                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  placeholder={
                    paisSeleccionado
                      ? `${paisSeleccionado.digitoMinimo}-${paisSeleccionado.digitoMaximo} dígitos`
                      : ""
                  }
                  onChange={(e) => {
                    // Detectar país por indicativo y obtener número local
                    const resultado = detectarYSeleccionarPais(e.target.value);

                    // Usar el país detectado si existe, sino el país seleccionado actual
                    const paisParaLimite =
                      resultado.paisEncontrado || paisSeleccionado;

                    // Aplicar el límite de longitud del país correspondiente
                    const valorFinal = paisParaLimite?.digitoMaximo
                      ? resultado.numeroLocal.slice(
                          0,
                          paisParaLimite.digitoMaximo
                        )
                      : resultado.numeroLocal;

                    form.setFieldValue("celular", valorFinal);
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const textoCopiado = e.clipboardData.getData("text");

                    // Detectar país por indicativo y obtener número local
                    const resultado = detectarYSeleccionarPais(textoCopiado);

                    // Usar el país detectado si existe, sino el país seleccionado actual
                    const paisParaLimite =
                      resultado.paisEncontrado || paisSeleccionado;

                    // Aplicar el límite de longitud del país correspondiente
                    const valorFinal = paisParaLimite?.digitoMaximo
                      ? resultado.numeroLocal.slice(
                          0,
                          paisParaLimite.digitoMaximo
                        )
                      : resultado.numeroLocal;

                    form.setFieldValue("celular", valorFinal);
                    form.validateFields(["celular"]);
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row>
            <Col span={24}>
              <Form.Item
                label="Correo"
                name="correo"
                rules={[
                  { type: "email", message: "El correo debe ser válido" },
                ]}
              >
                <Input placeholder="" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="Área de trabajo"
                name="idAreaTrabajo"
                rules={[
                  { required: true, message: "Seleccione un área de trabajo" },
                ]}
              >
                <Select
                  placeholder="Seleccionar área de trabajo"
                  loading={loadingAreas}
                  disabled={loadingAreas}
                  allowClear
                  showSearch
                  virtual={false}
                  filterOption={(input, option) =>
                    (option?.children?.toString() || "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  notFoundContent={
                    loadingAreas ? (
                      <Spin size="small" />
                    ) : (
                      "No hay áreas disponibles"
                    )
                  }
                >
                  {areasTrabajo.map((a) => (
                    <Select.Option key={a.id} value={a.id}>
                      {a.nombre}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Industria" name="industria">
                <Input placeholder="" />
              </Form.Item>
            </Col>
          </Row>

          <Button
            type="primary"
            block
            onClick={handleSubmit}
            loading={loading}
            className="create-client-button"
            icon={!loading ? <span className="plus-icon">+</span> : undefined}
          >
            {loading ? "Creando cliente..." : "Crear nuevo cliente"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default CreateClient;
