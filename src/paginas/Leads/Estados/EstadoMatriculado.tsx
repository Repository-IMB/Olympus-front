import React, { useState, useEffect } from "react";
import {
  Typography,
  Row,
  Popconfirm,
  Input,
  Button,
  Space,
  Table,
  Select,
  DatePicker,
  message,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { getCookie } from "../../../utils/cookies";
import dayjs from "dayjs";
import { crearHistorialConOcurrencia } from "../../../config/rutasApi";
import api from "../../../servicios/api";

const { Text } = Typography;

type CuotaRow = {
  key: number;
  id: number;
  numero: number;
  fechaVencimiento: string;
  monto: number;
  abonado: number | null;
  pendiente: number;
  fechaPago: string;
  deshabilitado: boolean;
};

// BOTONES PREMIUM
const buttonStyle = (
  baseColor: string,
  hoverColor: string,
  disabled = false
): React.CSSProperties => ({
  background: disabled ? "#F0F0F0" : baseColor,
  color: "#0D0C11",
  border: "none",
  borderRadius: 6,
  padding: "6px 12px",
  fontSize: 13,
  fontWeight: 600,
  cursor: disabled ? "not-allowed" : "pointer",
  boxShadow: "0 1.5px 4px rgba(0,0,0,0.12)",
  transition: "all 0.14s ease",
  userSelect: "none",
  minWidth: 105,
  textAlign: "center",
  display: "inline-block",
  opacity: disabled ? 0.7 : 1,
});

const EstadoMatriculado: React.FC<{
  oportunidadId: number;
  onCreado: () => void;
  origenOcurrenciaId?: number | null;
  activo: boolean;
}> = ({ oportunidadId, onCreado, origenOcurrenciaId = null, activo }) => {
  const origenOcurrenciaIdNorm =
    origenOcurrenciaId == null ? null : Number(origenOcurrenciaId);

  const cameFromCobranza = origenOcurrenciaIdNorm === 5;
  const cameFromConvertido = origenOcurrenciaIdNorm === 6;

  const [tabActivo, setTabActivo] = useState<"cobranza" | "convertido">(() =>
    cameFromConvertido ? "convertido" : "cobranza"
  );

  const [numCuotas, setNumCuotas] = useState<string>("");
  const [bloquearSelect, setBloquearSelect] = useState<boolean>(false);
  const [idPlan, setIdPlan] = useState<number | null>(null);
  const [cuotas, setCuotas] = useState<CuotaRow[]>([]);
  // nuevo estado para las cadenas que el usuario escribe en cada fila
  const [inputAbonado, setInputAbonado] = useState<Record<number, string>>({});
  const [metodoPorFila, setMetodoPorFila] = useState<
    Record<number, number | "">
  >({});
  const [puedeConvertir, setPuedeConvertir] = useState<boolean>(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  // Nuevo flag: si llegamos a Convertido DESDE Cobranza (para ocultar método y bloquear confirmar)
  const [arrivedFromCobranza, setArrivedFromCobranza] =
    useState<boolean>(false);
  const arrivedViaCobranza = cameFromCobranza || arrivedFromCobranza;
  const [creatingId, setCreatingId] = useState<number | null>(null);
  console.log(
    "origenOcurrenciaId (raw):",
    origenOcurrenciaId,
    "normalized:",
    origenOcurrenciaIdNorm,
    "cameFromConvertido:",
    cameFromConvertido,
    "cameFromCobranza:",
    cameFromCobranza
  );

  // 🔴 ERROR
  const [errorValidacion, setErrorValidacion] = useState<string>("");

  // 🟢 ÉXITO
  const [exitoMensaje, setExitoMensaje] = useState<string>("");

  const enteredCobranza = Boolean(idPlan) || bloquearSelect;
  const convertRequiresFullPayment = cameFromCobranza || enteredCobranza;
  const canSelectConvertido =
    activo && (!convertRequiresFullPayment || puedeConvertir);

  // ======================================================
  const validarSiPuedeConvertir = (lista: CuotaRow[]) => {
    const todasPagadas = lista.every((c) => c.pendiente <= 0);
    setPuedeConvertir(todasPagadas);
  };

  const obtenerPlanPorOportunidad = async (idOportunidad: number) => {
    try {
      const token = getCookie("token");
      const res = await api.get(
        `/api/Cobranza/Plan/PorOportunidad/${idOportunidad}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = res.data;
      if (!data || !data.plan || !data.plan.plan) return null;

      return {
        ...data.plan.plan,
        cuotas: data.plan.cuotas ?? [],
      };
    } catch (err) {
      console.debug("obtenerPlanPorOportunidad error", err);
      return null;
    }
  };

  // Función original para Cobranza (NO MODIFICAR)
  const crearPlanCobranza = async (numCuotas: number) => {
    try {
      const token = getCookie("token");
      const costoOfrecido = await obtenerCostoOfrecido(oportunidadId);
      const totalToSend = costoOfrecido;

      const body = {
        IdOportunidad: oportunidadId,
        Total: totalToSend,
        NumCuotas: numCuotas,
        FechaInicio: dayjs().format("YYYY-MM-DD"),
        FrecuenciaDias: 30,
        Usuario: "SYSTEM",
      };

      const res = await api.post("/api/Cobranza/Plan", body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return res.data?.newPlanId ?? null;
    } catch (err) {
      console.debug("crearPlanCobranza error", err);
      return null;
    }
  };

  // Nueva función: crear plan específicamente para el caso "Convertido" (NumCuotas = 1)
  const crearPlanCobranzaConvertido = async () => {
    try {
      const token = getCookie("token");
      const costoOfrecido = await obtenerCostoOfrecido(oportunidadId);
      const totalToSend = costoOfrecido;

      const body = {
        IdOportunidad: oportunidadId,
        Total: totalToSend,
        NumCuotas: 1,
        FechaInicio: dayjs().format("YYYY-MM-DD"),
        FrecuenciaDias: 30,
        Usuario: "SYSTEM",
      };

      const res = await api.post("/api/Cobranza/Plan", body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return res.data?.newPlanId ?? null;
    } catch (err) {
      console.debug("crearPlanCobranzaConvertido error", err);
      return null;
    }
  };

  const obtenerCuotasPlan = async (planId: number) => {
    try {
      const token = getCookie("token");
      const res = await api.get(`/api/Cobranza/Plan/${planId}/Cuotas`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      return data?.cuotas ?? [];
    } catch (err) {
      console.debug("obtenerCuotasPlan error", err);
      return [];
    }
  };

  // Helper: obtiene el costoOfrecido desde el endpoint de producto (retorna number | null)
  const obtenerCostoOfrecido = async (
    idOportunidad: number
  ): Promise<number | null> => {
    try {
      const token = getCookie("token");
      const res = await api.get(
        `/api/VTAModVentaProducto/DetallePorOportunidad/${idOportunidad}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = res.data;
      const inversiones = data?.inversiones;
      if (!inversiones || inversiones.length === 0) return null;
      const inv = inversiones[0];
      const costo = Number(inv.costoOfrecido ?? NaN);
      return Number.isFinite(costo) ? costo : null;
    } catch (err) {
      console.debug("obtenerCostoOfrecido error", err);
      return null;
    }
  };

  const mapearCuotas = (listaBackend: any[]): CuotaRow[] => {
    const hoy = dayjs().startOf("day");

    const base = listaBackend.map((c: any) => {
      const fechaV = (c.fechaVencimiento ?? "").split("T")[0];
      const fechaVenc = dayjs(fechaV);
      const monto = Math.round(Number(c.montoProgramado ?? 0) * 100) / 100;
      const pagado = Math.round(Number(c.montoPagado ?? 0) * 100) / 100;
      const pendiente = Math.round((monto - pagado) * 100) / 100;

      return {
        key: c.id,
        id: c.id,
        numero: c.numero,
        fechaVencimiento: fechaVenc.format("YYYY-MM-DD"),
        monto,
        abonado: pagado > 0 ? pagado : null,
        pendiente,
        fechaPago: c.fechaPago
          ? c.fechaPago.split("T")[0]
          : hoy.format("YYYY-MM-DD"),
        deshabilitado: false,
      } as CuotaRow;
    });

    const ordenadas = [...base].sort((a, b) => a.numero - b.numero);

    let todasPreviasPagadas = true;

    return ordenadas.map((c) => {
      const vencida = hoy.isAfter(dayjs(c.fechaVencimiento));
      const pagada = c.pendiente <= 0;

      const deshabilitado = vencida || pagada || !todasPreviasPagadas;

      if (!pagada && !vencida && todasPreviasPagadas) {
        todasPreviasPagadas = false;
      }

      return { ...c, deshabilitado };
    });
  };

  const cargarPlanExistente = async (plan: any) => {
    setIdPlan(plan.id);
    setNumCuotas(String(plan.numCuotas));
    setBloquearSelect(true);

    const cuotasNormalizadas = mapearCuotas(plan.cuotas);
    setCuotas(cuotasNormalizadas);
    validarSiPuedeConvertir(cuotasNormalizadas);

    const metInit: Record<number, number | ""> = {};
    const inputInit: Record<number, string> = {};
    cuotasNormalizadas.forEach((f) => {
      metInit[f.id] = "";
      inputInit[f.id] = f.abonado != null ? String(f.abonado) : "";
    });
    setMetodoPorFila(metInit);
    setInputAbonado(inputInit);
  };

  useEffect(() => {
    const handler = async (e: any) => {
      try {
        const detail = e?.detail;
        if (!detail) return;
        if (String(detail.oportunidadId) !== String(oportunidadId)) return;
        const plan = await obtenerPlanPorOportunidad(oportunidadId);
        if (plan) {
          await cargarPlanExistente(plan);
        }
      } catch (err) {
        console.debug(
          "Error recargando plan tras evento de costoOfrecido:",
          err
        );
      }
    };

    window.addEventListener(
      "costoOfrecidoActualizado",
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        "costoOfrecidoActualizado",
        handler as EventListener
      );
  }, [oportunidadId]);

  useEffect(() => {
    const cargar = async () => {
      setErrorValidacion("");
      setExitoMensaje("");

      const plan = await obtenerPlanPorOportunidad(oportunidadId);
      if (plan) {
        await cargarPlanExistente(plan);
      } else if (cameFromConvertido) {
        // Si venimos de Convertido y no existe plan, crear plan específico para Convertido
        const nuevoPlanId = await crearPlanCobranzaConvertido();
        if (nuevoPlanId) {
          setIdPlan(nuevoPlanId);
          setNumCuotas("1");
          setBloquearSelect(true);

          const cuotasBack = await obtenerCuotasPlan(nuevoPlanId);
          const normalizadas = mapearCuotas(cuotasBack);
          setCuotas(normalizadas);
          validarSiPuedeConvertir(normalizadas);

          const metInit: Record<number, number | ""> = {};
          const inputInit: Record<number, string> = {};
          normalizadas.forEach((f) => {
            metInit[f.id] = "";
            inputInit[f.id] = f.abonado != null ? String(f.abonado) : "";
          });
          setMetodoPorFila(metInit);
          setInputAbonado(inputInit);
        } else {
          message.error(
            "No se pudo crear el plan de cobranza para Convertido."
          );
        }
      }
    };
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oportunidadId]);

  // Sincroniza las cadenas de inputAbonado con la lista de cuotas y devuelve la lista sincronizada
  const syncInputAbonadoToCuotas = (currentCuotas: CuotaRow[]) => {
    const synced = currentCuotas.map((c) => {
      const s = inputAbonado[c.id];
      if (s === undefined) return c;
      if (s === "") return { ...c, abonado: null };
      // si termina con punto, no quitarlo aquí: convertir "0." -> 0 al confirmar es razonable,
      const normalized = s.endsWith(".") ? s.slice(0, -1) : s;
      const num = Number(normalized);
      if (Number.isNaN(num)) return c;
      return { ...c, abonado: num };
    });
    return synced;
  };

  // ===========================
  // handleMontoChange actualizado:
  // - Guardamos la cadena en inputAbonado para permitir escribir "0." o "0.0"
  // - Solo si la cadena es un número completo (no termina en '.') actualizamos el valor numérico en cuotas
  // ===========================
  const handleMontoChange = (id: number, value: string) => {
    if (!activo) return;

    // update string state
    setInputAbonado((prev) => ({ ...prev, [id]: value }));

    // Si vacio -> limpiar abonado (en cuotas) y no mostrar error aún
    if (value === "") {
      setCuotas((prev) =>
        prev.map((c) => (c.id === id ? { ...c, abonado: null } : c))
      );
      // no setear error aquí; dejar que la validación ocurra en el confirm
      return;
    }

    // si termina en '.' permitir edición (no forzar parse)
    if (value.endsWith(".")) {
      setErrorValidacion("");
      setExitoMensaje("");
      return;
    }

    const num = Number(value);
    if (Number.isNaN(num)) return;

    // CASO: ingresó desde Convertido directamente (sin pasar por Cobranza)
    if (cameFromConvertido && !arrivedFromCobranza) {
      // sólo actualizar el estado, no validar aquí
      setCuotas((prev) =>
        prev.map((c) => (c.id === id ? { ...c, abonado: num } : c))
      );
      // limpiar mensajes de validación mientras escribe
      setErrorValidacion("");
      setExitoMensaje("");
      return;
    }

    // EN LOS DEMÁS CASOS: mantener validaciones inmediatas como antes
    setErrorValidacion("");
    setExitoMensaje("");

    setCuotas((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;

        if (num < 0) {
          setErrorValidacion(
            `El monto abonado de la cuota N° ${c.numero} no puede ser negativo.`
          );
          return c;
        }

        if (num > Math.round(c.pendiente * 100) / 100) {
          setErrorValidacion(
            `El monto abonado de la cuota N° ${c.numero} no puede ser mayor al pendiente (${c.pendiente}).`
          );
          return c;
        }

        return { ...c, abonado: num };
      })
    );
  };

  const handleMetodoChangeFila = (id: number, val: number | "") => {
    if (!activo) return;
    setErrorValidacion("");
    setExitoMensaje("");
    setMetodoPorFila((prev) => ({ ...prev, [id]: val }));
  };

  const handleFechaPagoChange = (id: number, date: any) => {
    if (!activo) return;
    if (!date) return;
    setErrorValidacion("");
    setExitoMensaje("");

    const nuevas = cuotas.map((c) =>
      c.id === id ? { ...c, fechaPago: date.format("YYYY-MM-DD") } : c
    );

    setCuotas(nuevas);
  };

  const pagarCuotaAPI = async ({
    idPlan,
    idCuota,
    monto,
    metodo,
    fechaPago,
  }: {
    idPlan: number;
    idCuota: number;
    monto: number;
    metodo: number;
    fechaPago: string;
  }) => {
    try {
      const token = getCookie("token");

      const body = {
        IdCobranzaPlan: idPlan,
        IdCuotaInicial: idCuota,
        MontoPago: monto,
        IdMetodoPago: metodo,
        FechaPago: fechaPago,
        Usuario: "SYSTEM",
      };

      const res = await api.post("/api/Cobranza/Pago?acumulada=false", body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // si necesitas comprobar estructura, puedes revisar res.data
      return { ok: true };
    } catch (err) {
      console.debug("pagarCuotaAPI error", err);
      return { ok: false };
    }
  };

  // Confirmar pagos en Cobranza (sin tocar lógica existente) — ahora al terminar,
  // si todas las cuotas quedan pagadas, se genera la ocurrencia Convertido automáticamente
  const handleConfirmarPagos = async () => {
    console.log("handleConfirmarPagos - idPlan:", idPlan, "cuotas:", cuotas);

    if (!activo) return;
    if (!idPlan) return;

    setErrorValidacion("");
    setExitoMensaje("");

    // sincronizar inputs con cuotas y usar esa lista para validar
    const synced = syncInputAbonadoToCuotas(cuotas);
    setErrorValidacion("");
    setExitoMensaje("El pago de la cuota se registró correctamente.");
    setCuotas(synced);

    const filas = synced.filter(
      (c) => (c.abonado ?? 0) > 0 && !c.deshabilitado
    );

    if (filas.length === 0) {
      setErrorValidacion("No hay cuotas abonadas para confirmar.");
      return;
    }

    for (const fila of filas) {
      if (fila.abonado === null || fila.abonado === 0) {
        setErrorValidacion(
          `El monto abonado de la cuota N° ${fila.numero} debe ser mayor a 0.`
        );
        return;
      }
      if (fila.abonado < 0) {
        setErrorValidacion(
          `El monto abonado de la cuota N° ${fila.numero} no puede ser negativo.`
        );
        return;
      }
      if (fila.abonado > fila.pendiente) {
        setErrorValidacion(
          `El monto abonado de la cuota N° ${fila.numero} no puede ser mayor al pendiente (${fila.pendiente}).`
        );
        return;
      }
    }

    for (const fila of filas) {
      if (!metodoPorFila[fila.id]) {
        setErrorValidacion(
          `Selecciona método de pago para la cuota N° ${fila.numero}.`
        );
        return;
      }
    }

    for (const f of filas) {
      const resp = await pagarCuotaAPI({
        idPlan,
        idCuota: f.id,
        monto: f.abonado as number,
        metodo: metodoPorFila[f.id] as number,
        fechaPago: dayjs(f.fechaPago).toISOString(),
      });

      if (!resp.ok) {
        message.error(
          `Ocurrió un error al registrar el pago de la cuota N° ${f.numero}.`
        );
        return;
      }
    }

    const nuevas = await obtenerCuotasPlan(idPlan);
    const normalizadas = mapearCuotas(nuevas);
    setCuotas(normalizadas);
    validarSiPuedeConvertir(normalizadas);

    // re-inicializar inputAbonado tras refrescar cuotas
    const newInputs: Record<number, string> = {};
    normalizadas.forEach(
      (f) => (newInputs[f.id] = f.abonado != null ? String(f.abonado) : "")
    );
    setInputAbonado(newInputs);
  };

  // Confirmar desde Convertido:
  const handleConfirmarConvertido = async () => {
    console.log(
      "handleConfirmarConvertido - arrivedFromCobranza:",
      arrivedFromCobranza,
      "cameFromCobranza:",
      cameFromCobranza,
      "arrivedViaCobranza:",
      arrivedViaCobranza,
      "idPlan:",
      idPlan
    );

    if (!activo) return;
    if (!idPlan) return;

    setErrorValidacion("");
    setExitoMensaje("");

    if (arrivedViaCobranza) {
      // evita reintentos si ya estamos creando
      if (creatingId) return;
      const OC_CONVERTIDO = 6;
      setCreatingId(OC_CONVERTIDO);

      try {
        // llamar al helper que usa axios y envía { ocurrenciaId, usuario } en el body
        await crearHistorialConOcurrencia(
          oportunidadId,
          OC_CONVERTIDO,
          "SYSTEM"
        );

        setArrivedFromCobranza(true);
        setTabActivo("convertido");
        if (onCreado) onCreado();
        setErrorValidacion("");
        setExitoMensaje("La oportunidad pasó a Convertido.");
      } catch (err: any) {
        console.error(
          "crearHistorialConOcurrencia error",
          err?.response?.status,
          err?.response?.data ?? err
        );
        // mostrar feedback amigable
        setErrorValidacion("");
        setExitoMensaje(
          "Operación completada (no fue posible registrar la ocurrencia)."
        );
        // opcional: si el backend devuelve message en err.response.data, podrías usar message.error(...)
      } finally {
        setCreatingId(null);
      }
      return;
    }

    const synced = syncInputAbonadoToCuotas(cuotas);
    setCuotas(synced);

    const filas = synced.filter((c) => !c.deshabilitado);

    if (filas.length === 0) {
      setErrorValidacion("No hay cuotas para procesar.");
      return;
    }

    // Validaciones: cuando vino originalmente desde Convertido, exigir que monto >= pendiente
    for (const fila of filas) {
      if (fila.abonado === null || fila.abonado === 0) {
        setErrorValidacion(
          `El monto abonado de la cuota N° ${fila.numero} debe ser mayor a 0.`
        );
        return;
      }
      if (fila.abonado < 0) {
        setErrorValidacion(
          `El monto abonado de la cuota N° ${fila.numero} no puede ser negativo.`
        );
        return;
      }
      if (fila.abonado > fila.pendiente) {
        setErrorValidacion(
          `El monto abonado de la cuota N° ${fila.numero} no puede ser mayor al pendiente (${fila.pendiente}).`
        );
        return;
      }
      if (
        cameFromConvertido &&
        !arrivedFromCobranza &&
        fila.abonado < fila.pendiente
      ) {
        setErrorValidacion(
          `En Convertido el monto abonado de la cuota N° ${fila.numero} debe ser al menos el monto pendiente (${fila.pendiente}).`
        );
        return;
      }
    }

    // Si entró desde Convertido originalmente, mostramos selector de método y lo exigimos
    if (cameFromConvertido && !arrivedFromCobranza) {
      for (const fila of filas) {
        if (!metodoPorFila[fila.id]) {
          setErrorValidacion(
            `Selecciona método de pago para la cuota N° ${fila.numero}.`
          );
          return;
        }
      }
    } else {
      for (const f of filas) {
        if (!metodoPorFila[f.id]) {
          setMetodoPorFila((prev) => ({ ...prev, [f.id]: 3 }));
        }
      }
    }

    // Registrar pagos como antes
    for (const f of filas) {
      const resp = await pagarCuotaAPI({
        idPlan,
        idCuota: f.id,
        monto: f.abonado as number,
        metodo: (metodoPorFila[f.id] as number) || 3,
        fechaPago: dayjs(f.fechaPago).toISOString(),
      });

      if (!resp.ok) {
        message.error(
          `Ocurrió un error al registrar el pago de la cuota N° ${f.numero}.`
        );
        return;
      }
    }

    // Refrescar cuotas y estado local como antes
    const nuevas = await obtenerCuotasPlan(idPlan);
    const normalizadas = mapearCuotas(nuevas);
    setCuotas(normalizadas);
    validarSiPuedeConvertir(normalizadas);

    const newInputs: Record<number, string> = {};
    normalizadas.forEach(
      (f) => (newInputs[f.id] = f.abonado != null ? String(f.abonado) : "")
    );
    setInputAbonado(newInputs);

    setErrorValidacion("");
    setExitoMensaje("Pagos registrados correctamente.");
  };

  const columnsCobranza = [
    { title: "N°", dataIndex: "numero", width: 55 },
    { title: "Vence", dataIndex: "fechaVencimiento", width: 95 },
    {
      title: "Monto",
      dataIndex: "monto",
      width: 80,
      render: (v: any) => `$ ${Number(v).toFixed(2)}`,
    },
    {
      title: "Abonado",
      width: 110,
      render: (_: any, row: CuotaRow) => (
        <Input
          type="text"
          value={inputAbonado[row.id] ?? row.abonado ?? ""}
          disabled={!activo || row.deshabilitado}
          onChange={(e) => handleMontoChange(row.id, e.target.value)}
          style={{ fontSize: 10, height: 24 }}
        />
      ),
    },
    {
      title: "Pend.",
      width: 80,
      render: (_: any, row: CuotaRow) =>
        `$ ${Number(row.pendiente).toFixed(2)}`,
    },
    {
      title: "Método",
      width: 120,
      render: (_: any, row: CuotaRow) => (
        <Select
          value={metodoPorFila[row.id]}
          onChange={(v) => handleMetodoChangeFila(row.id, v)}
          disabled={!activo || row.deshabilitado}
          style={{ width: "100%" }}
          size="small"
        >
          <Select.Option value="">Seleccionar</Select.Option>
          <Select.Option value={1}>Yape</Select.Option>
          <Select.Option value={2}>Plin</Select.Option>
          <Select.Option value={3}>Efectivo</Select.Option>
          <Select.Option value={4}>Transf.</Select.Option>
        </Select>
      ),
    },
    {
      title: "Pago",
      width: 130,
      render: (_: any, row: CuotaRow) => (
        <DatePicker
          size="small"
          value={dayjs(row.fechaPago)}
          onChange={(d) => d && handleFechaPagoChange(row.id, d)}
          disabled={!activo || row.deshabilitado}
          format="YYYY-MM-DD"
        />
      ),
    },
  ];

  const showMetodoInConvertido = cameFromConvertido && !arrivedFromCobranza;
  const columnsConvertidoBase = [
    {
      title: "Monto a abonar",
      dataIndex: "monto",
      width: 120,
      render: (v: any) => `$ ${Number(v).toFixed(2)}`,
    },
    {
      title: "Monto abonado",
      width: 120,
      render: (_: any, row: CuotaRow) => (
        <Input
          type="text"
          value={inputAbonado[row.id] ?? row.abonado ?? ""}
          disabled={!activo || row.deshabilitado}
          onChange={(e) => handleMontoChange(row.id, e.target.value)}
          style={{ fontSize: 10, height: 24 }}
        />
      ),
    },
    {
      title: "Pend.",
      dataIndex: "pendiente",
      width: 120,
      render: (_: any, row: CuotaRow) =>
        `$ ${Number(row.pendiente).toFixed(2)}`,
    },
    {
      title: "Fecha de pago",
      dataIndex: "fechaPago",
      width: 160,
      render: (_: any, row: CuotaRow) => (
        <DatePicker
          size="small"
          value={dayjs(row.fechaPago)}
          onChange={(d) => d && handleFechaPagoChange(row.id, d)}
          disabled={!activo}
          format="YYYY-MM-DD"
        />
      ),
    },
  ];

  const columnsConvertido = showMetodoInConvertido
    ? [
        ...columnsConvertidoBase.slice(0, 2),
        {
          title: "Método",
          width: 120,
          render: (_: any, row: CuotaRow) => (
            <Select
              value={metodoPorFila[row.id]}
              onChange={(v) => handleMetodoChangeFila(row.id, v)}
              disabled={!activo || row.deshabilitado}
              style={{ width: "100%" }}
              size="small"
            >
              <Select.Option value="">Seleccionar</Select.Option>
              <Select.Option value={1}>Yape</Select.Option>
              <Select.Option value={2}>Plin</Select.Option>
              <Select.Option value={3}>Efectivo</Select.Option>
              <Select.Option value={4}>Transf.</Select.Option>
            </Select>
          ),
        },
        ...columnsConvertidoBase.slice(2),
      ]
    : columnsConvertidoBase;

  const TabButton: React.FC<{
    selected: boolean;
    disabled?: boolean;
    onClick?: () => void;
    children?: React.ReactNode;
  }> = ({ selected, disabled = false, onClick, children }) => {
    const [hover, setHover] = useState(false);
    const base = selected ? "#B8F3B8" : "#D1D1D1";
    const hoverColor = "#A7E8A7";
    const computedBg = disabled ? "#F0F0F0" : hover ? hoverColor : base;

    return (
      <div
        style={{ ...buttonStyle(computedBg, hoverColor, disabled) }}
        onMouseEnter={() => !disabled && setHover(true)}
        onMouseLeave={() => !disabled && setHover(false)}
        onClick={() => {
          if (disabled) return;
          if (onClick) onClick();
        }}
        role="button"
        aria-disabled={disabled}
      >
        {children}
      </div>
    );
  };

  // ======================================================
  // RENDER
  // ======================================================
  return (
    <div
      style={{
        background: "#F0F0F0",
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* TABS */}
      <Row justify="space-between" align="middle">
        <Text style={{ fontSize: 12 }}>Ocurrencia:</Text>

        <Space>
          {/* COBRANZA */}
          <TabButton
            selected={tabActivo === "cobranza"}
            // bloqueamos el botón de Cobranza si venimos desde Convertido
            disabled={!activo || cameFromConvertido}
            onClick={() => {
              if (!activo) return;
              setErrorValidacion("");
              setExitoMensaje("");
              setTabActivo("cobranza");
            }}
          >
            Cobranza
          </TabButton>

          {/* CONVERTIDO */}
          <Popconfirm
            title="Confirmación"
            description="¿Estás seguro de pasar a estado convertido?"
            okText="Sí"
            cancelText="No"
            onConfirm={() => {
              setErrorValidacion("");
              setExitoMensaje("");
              setTabActivo("convertido");
            }}
          >
            <div>
              <TabButton
                selected={tabActivo === "convertido"}
                disabled={!activo || !puedeConvertir}
              >
                Convertido
              </TabButton>
            </div>
          </Popconfirm>
        </Space>
      </Row>

      <div
        style={{
          background: "#ECECEC",
          borderRadius: 10,
          padding: "6px 8px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <InfoCircleOutlined style={{ fontSize: 12 }} />
        <Text style={{ fontSize: 9 }}>
          Para pasar a Convertido el cliente debe completar sus pagos.
        </Text>
      </div>

      {tabActivo === "cobranza" ? (
        <div style={{ background: "#FFF", borderRadius: 12, padding: 16 }}>
          <Text strong>Cobranza</Text>
          <Space direction="vertical" style={{ marginTop: 10, width: "100%" }}>
            <Select
              value={numCuotas}
              options={[
                { value: "", label: "Seleccionar" },
                ...Array.from({ length: 12 }, (_, i) => ({
                  value: (i + 1).toString(),
                  label: `${i + 1}`,
                })),
              ]}
              onChange={(v) => activo && setNumCuotas(v)}
              disabled={!activo || bloquearSelect}
              style={{ width: "100%" }}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {errorModal && (
                <div
                  style={{ color: "#ff4d4f", marginBottom: 8, fontSize: 11 }}
                >
                  {errorModal}
                </div>
              )}

              <Popconfirm
                title="¿Está seguro de crear el plan de cuotas?"
                okText="Sí"
                cancelText="No"
                onConfirm={async () => {
                  setErrorModal(null);
                  setErrorValidacion("");
                  setExitoMensaje("");

                  // ✅ VALIDACIÓN QUE FALTABA
                  if (!numCuotas) {
                    setErrorModal("Selecciona el número de cuotas.");
                    return;
                  }

                  const nuevoPlan = await crearPlanCobranza(Number(numCuotas));
                  if (!nuevoPlan) {
                    setErrorModal("No se pudo crear el plan de cuotas.");
                    return;
                  }

                  setIdPlan(nuevoPlan);

                  const cuotasBack = await obtenerCuotasPlan(nuevoPlan);
                  const normalizadas = mapearCuotas(cuotasBack);
                  setCuotas(normalizadas);
                  validarSiPuedeConvertir(normalizadas);

                  const metInit: Record<number, number | ""> = {};
                  const inputInit: Record<number, string> = {};
                  normalizadas.forEach((f) => {
                    metInit[f.id] = "";
                    inputInit[f.id] =
                      f.abonado != null ? String(f.abonado) : "";
                  });

                  setMetodoPorFila(metInit);
                  setInputAbonado(inputInit);
                  setBloquearSelect(true);
                }}
              >
                <Button type="primary" disabled={!activo || bloquearSelect}>
                  Generar plan de cuotas
                </Button>
              </Popconfirm>
            </div>
          </Space>

          <Table
            columns={columnsCobranza}
            dataSource={cuotas}
            pagination={false}
            size="small"
            rowKey="id"
            style={{ marginTop: 12 }}
            scroll={{ x: 650 }}
          />

          {/* MENSAJE DE ERROR */}
          {errorValidacion && (
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <Text style={{ color: "#ff4d4f", fontSize: 11 }}>
                {errorValidacion}
              </Text>
            </div>
          )}

          {/* MENSAJE DE ÉXITO */}
          {exitoMensaje && (
            <div style={{ textAlign: "center", marginTop: 6 }}>
              <Text style={{ color: "#0F6B32", fontSize: 11, fontWeight: 600 }}>
                {exitoMensaje}
              </Text>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 8 }}>
            <Popconfirm
              title="Confirmar pago"
              description="¿Está seguro de confirmar pago de cuota?"
              okText="Sí"
              cancelText="No"
              onConfirm={handleConfirmarPagos}
            >
              <Button
                type="primary"
                disabled={!activo}
                style={{ fontSize: 10 }}
              >
                Confirmar pago de cuotas
              </Button>
            </Popconfirm>
          </div>
        </div>
      ) : (
        // VISTA CONVERTIDO
        <div style={{ background: "#FFF", borderRadius: 12, padding: 16 }}>
          <Text strong>Convertido</Text>

          {exitoMensaje && (
            <div style={{ textAlign: "center", marginTop: 6 }}>
              <Text style={{ color: "#0F6B32", fontSize: 11, fontWeight: 600 }}>
                {exitoMensaje}
              </Text>
            </div>
          )}

          {errorValidacion && (
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <Text style={{ color: "#ff4d4f", fontSize: 11 }}>
                {errorValidacion}
              </Text>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <Table
              columns={columnsConvertido}
              dataSource={cuotas ?? []}
              pagination={false}
              size="small"
              rowKey="id"
              scroll={{ x: 650 }}
            />
          </div>

          <Popconfirm
            title="Confirmar cambio de estado"
            description="¿Estás seguro de confirmar estado convertido?"
            okText="Sí"
            cancelText="No"
            onConfirm={handleConfirmarConvertido}
          >
            <Button
              type="primary"
              block
              disabled={!activo}
              style={{ marginTop: 12 }}
            >
              Confirmar estado convertido
            </Button>
          </Popconfirm>
        </div>
      )}
    </div>
  );
};

export default EstadoMatriculado;
