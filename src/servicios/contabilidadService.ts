import api from "./api";

export type ResumenFinancieroDTO = any;
const basePath = "/api/CTBModContabilidad";

/* =========================
	RESUMEN FINANCIERO
	========================= */
export const obtenerResumenFinanciero = async (
	mes?: number,
	anio?: number,
	idUsuario?: number
): Promise<ResumenFinancieroDTO> => {
	try {
		// Endpoint actual: /api/CTBModContabilidad/ResumenFinanciero?mes=1&anio=2026
		const response = await api.get(`${basePath}/ResumenFinanciero`, {
			params: { mes, anio, idUsuario },
		});
		return response.data ?? response;
	} catch (error) {
		console.error("ContabilidadService.obtenerResumenFinanciero error:", error);
		throw error;
	}
};

/* =========================
	 FACTURACION
	 ========================= */
export const listarFacturas = async (params: any = {}) => {
	try {
		// Prefer GET with query params (backend example: ?page=1&pageSize=10)
		const response = await api.get(`${basePath}/ListarFacturas`, { params });
		return response.data ?? response;
	} catch (error) {
		console.warn("GET ListarFacturas falló, intentando POST...", error);
		try {
			const response = await api.post(`${basePath}/ListarFacturas`, params);
			return response.data ?? response;
		} catch (err) {
			console.error("ContabilidadService.listarFacturas error:", err);
			throw err;
		}
	}
};

export const crearFactura = async (payload: any) => {
	try {
		const response = await api.post(`${basePath}/CrearFactura`, payload);
		return response.data ?? response;
	} catch (error) {
		console.error("ContabilidadService.crearFactura error:", error);
		throw error;
	}
};

export const actualizarEstadoFactura = async (payload: any) => {
	try {
		const response = await api.post(`${basePath}/ActualizarEstadoFactura`, payload);
		return response.data ?? response;
	} catch (error) {
		console.error("ContabilidadService.actualizarEstadoFactura error:", error);
		throw error;
	}
};

/* =========================
	 REPORTES
	 ========================= */
export const reporteIngresosEgresos = async (cantidadMeses = 6, anio?: number) => {
	try {
		const response = await api.get(`${basePath}/ReporteIngresosEgresos`, {
			params: { CantidadMeses: cantidadMeses, Anio: anio },
		});
		return response.data ?? response;
	} catch (error) {
		console.error("ContabilidadService.reporteIngresosEgresos error:", error);
		throw error;
	}
};

export const obtenerAreasConGastos = async (mes?: number, anio?: number) => {
	try {
		const response = await api.get(`${basePath}/AreasConGastos`, { params: { mes, anio } });
		return response.data ?? response;
	} catch (error) {
		console.error("ContabilidadService.obtenerAreasConGastos error:", error);
		throw error;
	}
};

/* =========================
	 MOVIMIENTOS (GASTOS / INGRESOS)
	 ========================= */
export const crearGastoGeneral = async (payload: any) => {
	try {
		const response = await api.post(`${basePath}/CrearGastoGeneral`, payload);
		return response.data ?? response;
	} catch (error) {
		console.error("ContabilidadService.crearGastoGeneral error:", error);
		throw error;
	}
};

export const crearIngresoManual = async (payload: any) => {
	try {
		const response = await api.post(`${basePath}/CrearIngresoManual`, payload);
		return response.data ?? response;
	} catch (error) {
		console.error("ContabilidadService.crearIngresoManual error:", error);
		throw error;
	}
};

// Backwards-compatible wrappers for endpoints named CrearGasto / CrearIngreso
export const crearGasto = async (payload: any) => {
  try {
    const response = await api.post(`${basePath}/CrearGasto`, payload);
    return response.data ?? response;
  } catch (error) {
    console.warn('CrearGasto failed, falling back to CrearGastoGeneral', error);
    return crearGastoGeneral(payload);
  }
};

export const crearIngreso = async (payload: any) => {
  try {
    const response = await api.post(`${basePath}/CrearIngreso`, payload);
    return response.data ?? response;
  } catch (error) {
    console.warn('CrearIngreso failed, falling back to CrearIngresoManual', error);
    return crearIngresoManual(payload);
  }
};

export default {
	obtenerResumenFinanciero,
	listarFacturas,
	crearFactura,
	actualizarEstadoFactura,
	reporteIngresosEgresos,
    obtenerAreasConGastos,
	crearGastoGeneral,
	crearIngresoManual,
    crearGasto,
    crearIngreso,
};
