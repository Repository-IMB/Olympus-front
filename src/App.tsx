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

// RRHH
import Personal from "./paginas/Personal/Personal";
import Contratos from "./paginas/Contratos/Contratos";
import Permisos from "./paginas/Permisos/Permisos";
import Vacaciones from "./paginas/Vacaciones/Vacaciones";
import Asistencia from "./paginas/Asistencia/Asistencia";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ================= TOKEN ================= */
  useEffect(() => {
    interface JwtPayload {
      exp?: number;
    }

    const parseJwt = (token: string): JwtPayload | null => {
      try {
        return JSON.parse(atob(token.split(".")[1]));
      } catch {
        return null;
      }
    };

    const publicRoutes = ["/login", "/forgot-password", "/reset-password", "/enrollment", "/onboarding"];

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

      // Si está logueado y entra a login -> manda al home privado
      if (isPublic) {
        navigate("/", { replace: true });
      }

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(logout, (payload.exp - now) * 1000);
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

      {/* Privadas */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          {/* Home privado: por defecto manda a Leads (si no tiene, ProtectedContent se encarga) */}
          <Route path="/" element={<Navigate to="/leads/SalesProcess" replace />} />

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
