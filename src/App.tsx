import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import { useEffect, useRef } from "react";
import { getCookie } from "./utils/cookies";

// Públicas
import LoginPage from "./paginas/Login/Login";
import ForgotPasswordPage from "./paginas/ForgotPassword/ForgotPasswordPage";
import ResetPasswordPage from "./paginas/ResetPassword/ResetPasswordPage";
import Forbidden from "./paginas/Forbidden";
import AsistenciaPage from "./paginas/Asistencia/AsistenciaPage";
import EnrollmentForm from "./paginas/Form/EnrollmentForm";
import OnboardingForm from "./paginas/Form/OnboardingForm";

// Layout / guards
import MainLayout from "./layouts/MainLayout";
import { PrivateRoute } from "./componentes/PrivateRoute";
import ProtectedContent from "./routes/ProtectedContent";

// Leads (todo lo que cuelga de oportunidades)
import OpportunitiesInterface from "./paginas/Opportunities/Opportunities";
import CRMSalesProcess from "./paginas/SalesProcess/SalesProcess";
import Leads from "./paginas/Leads/Leads";
import Oportunidad from "./paginas/Leads/Oportunidad";
import Asignacion from "./paginas/Leads/Asignacion";
import CreateClient from "./paginas/CreateClient/CreateClient";
import CreateOpportunity from "./paginas/CreateOpportunity/CreateOpportunity";
import SelectClient from "./paginas/SelectClient/SelectClient";

// Usuarios
import Usuarios from "./paginas/Usuarios/Usuarios";

// Producto
import Departamentos from "./paginas/Departamentos/Departamentos";
import Docentes from "./paginas/Docentes/Docentes";
import Modulos from "./paginas/Modulos/Modulos";
import Alumnos from "./paginas/Alumnos/Alumnos";
import Productos from "./paginas/Productos/Productos";
import DetalleProducto from "./paginas/Productos/DetalleProducto";
import DetalleModulo from "./paginas/Modulos/DetalleModulo";
import DetalleAlumno from "./paginas/Alumnos/DetalleAlumno";
import Dashboard from "./paginas/Dashboard/Dashboard";

// RRHH
import Personal from "./paginas/Personal/Personal";
import Contratos from "./paginas/Contratos/Contratos";
import Permisos from "./paginas/Permisos/Permisos";
import Vacaciones from "./paginas/Vacaciones/Vacaciones";
import Asistencia from "./paginas/Asistencia/Asistencia";

// Logística
import Activos from "./paginas/Activos/Activos";
import DetalleActivo from "./paginas/Activos/DetalleActivo";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ================= TOKEN ================= */
  useEffect(() => {
    interface JwtPayload {
      exp?: number;
      email?: string;
      correo?: string;
      [key: string]: any;
    }

    const parseJwt = (token: string): JwtPayload | null => {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        return JSON.parse(jsonPayload);
      } catch {
        return null;
      }
    };

    const publicRoutes = ["/login", "/forgot-password", "/reset-password", "/enrollment", "/onboarding", "/activos/public"];

    const logout = () => {
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      navigate("/login");
    };

    const checkToken = () => {
      const token = getCookie("token");
      const isPublic = publicRoutes.some((r) =>
        location.pathname.startsWith(r)
      );

      if (!token) {
        if (!isPublic) logout();
        return;
      }

      const payload = parseJwt(token);
      if (!payload?.exp) {
        logout();
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        logout();
        return;
      }
      // 👇 KIOSK MODE: username "AsistenciaImb"
      // El token NO trae el email, así que usamos el claim de name
      // "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": "AsistenciaImb"
      const userName = payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || payload?.name;

      const isKioskUser = userName === "AsistenciaImb";

      if (isKioskUser) {
        if (location.pathname !== "/asistencia") {
          navigate("/asistencia", { replace: true });
          return;
        }
      } else {
        // Bloquear acceso a /asistencia para usuarios normales
        if (location.pathname === "/asistencia") {
          navigate("/", { replace: true });
          return;
        }
      }

      // 👇 LOGIN → DASHBOARD (Solo si NO es Kiosk user, o si la ruta no es asistencia)
      // Ajuste: Si es Kiosk user, ya lo manejamos arriba.
      if (isPublic && !isKioskUser) {
        sessionStorage.setItem("forceDashboard", "1");
        navigate("/", { replace: true });
        return;
      }

      // 👇 FORZAR DASHBOARD SOLO 1 VEZ
      const forceDashboard = sessionStorage.getItem("forceDashboard");
      if (forceDashboard && location.pathname !== "/") {
        sessionStorage.removeItem("forceDashboard");
        navigate("/", { replace: true });
        return;
      }
    };

    checkToken();
    const interval = setInterval(checkToken, 2000);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location, navigate]);

  /* ================= ROUTES ================= */
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/403" element={<Forbidden />} />
      <Route path="/enrollment" element={<EnrollmentForm />} />
      <Route path="/onboarding" element={<OnboardingForm />} />

      {/* Ruta pública para QR de activos (sin autenticación ni layout) */}
      <Route
        path="/activos/public/:id"
        element={<DetalleActivo />}
      />

      {/* Privadas */}
      <Route element={<PrivateRoute />}>
        {/* KIOSK MODE ROUTE */}
        <Route path="/asistencia" element={<AsistenciaPage />} />

        <Route element={<MainLayout />}>
          {/* Home privado: por defecto manda a Leads (si no tiene, ProtectedContent se encarga) */}
          <Route path="/" element={<Dashboard />} />

          {/* ======================= LEADS (BLOQUE COMPLETO) ======================= */}
          <Route
            path="/leads/*"
            element={
              <ProtectedContent permiso="leads">
                <Outlet />
              </ProtectedContent>
            }
          >
            <Route path="SalesProcess" element={<CRMSalesProcess />} />
            <Route path="Opportunities" element={<OpportunitiesInterface />} />

            <Route path="CreateClient" element={<CreateClient />} />
            <Route path="CreateOpportunity" element={<CreateOpportunity />} />
            <Route path="SelectClient" element={<SelectClient />} />

            <Route path="oportunidades/:id" element={<Leads />} />
            <Route path="oportunidad/:id" element={<Oportunidad />} />

            {/* Asignación: permiso aparte */}
            <Route
              path="asignacion"
              element={
                <ProtectedContent permiso="asignacion">
                  <Asignacion />
                </ProtectedContent>
              }
            />
          </Route>

          {/* ======================= PRODUCTO (BLOQUE) ======================= */}
          <Route
            path="/producto/*"
            element={
              <ProtectedContent permiso="desarrollo">
                <Outlet />
              </ProtectedContent>
            }
          >
            <Route path="departamentos" element={<Departamentos />} />
            <Route path="docentes" element={<Docentes />} />
            <Route path="modulos" element={<Modulos />} />
            <Route path="alumnos" element={<Alumnos />} />
            <Route path="productos" element={<Productos />} />
            <Route path="productos/detalle/:id" element={<DetalleProducto />} />
            <Route path="modulos/detalle/:id" element={<DetalleModulo />} />
            <Route path="alumnos/detalle/:id" element={<DetalleAlumno />} />
          </Route>

          {/* ======================= LOGÍSTICA ======================= */}
          <Route
            path="/logistica/activos"
            element={
              <ProtectedContent permiso="logistica">
                <Activos />
              </ProtectedContent>
            }
          />
          <Route
            path="/logistica/activos/:id"
            element={
              <ProtectedContent permiso="logistica">
                <DetalleActivo />
              </ProtectedContent>
            }
          />

          {/* ======================= USUARIOS ======================= */}
          <Route
            path="/usuarios/usuarios"
            element={
              <ProtectedContent permiso="usuarios">
                <Usuarios />
              </ProtectedContent>
            }
          />

          {/* ======================= RRHH (BLOQUE) ======================= */}
          <Route
            path="/rrhh/*"
            element={
              <ProtectedContent permiso="recursosHumanos">
                <Outlet />
              </ProtectedContent>
            }
          >
            <Route path="personal" element={<Personal />} />
            <Route path="contratos" element={<Contratos />} />
            <Route path="permisos" element={<Permisos />} />
            <Route path="vacaciones" element={<Vacaciones />} />
            <Route path="asistencia" element={<Asistencia />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/403" replace />} />
    </Routes>
  );
}

export default App;
