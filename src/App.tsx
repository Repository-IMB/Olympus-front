import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react';
import { getCookie } from './utils/cookies';
import LoginPage from './paginas/Login/Login'
import ForgotPasswordPage from './paginas/ForgotPassword/ForgotPasswordPage'
import ResetPasswordPage from './paginas/ResetPassword/ResetPasswordPage'
import Dashboard from './paginas/Inicio/Dashboard' 
import { PrivateRoute } from './componentes/PrivateRoute' 
import OpportunitiesInterface from './paginas/Opportunities/Opportunities'
import CRMSalesProcess from './paginas/SalesProcess/SalesProcess'
import MainLayout from './layouts/MainLayout';
import Leads from './paginas/Leads/Leads';
import Oportunidad from './paginas/Leads/Oportunidad';
import Asignacion from './paginas/Leads/Asignacion';
import CreateClient from './paginas/CreateClient/CreateClient';
import CreateOpportunity from './paginas/CreateOpportunity/CreateOpportunity';
import SelectClient from './paginas/SelectClient/SelectClient';
import Usuarios from './paginas/Usuarios/Usuarios';
import EnrollmentForm from './paginas/Form/EnrollmentForm';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    interface JwtPayload {
      exp?: number;
      [key: string]: any;
    }

    function parseJwt(token: string): JwtPayload | null {
      try {
        const base64Url: string = token.split('.')[1];
        const base64: string = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload: string = decodeURIComponent(
          atob(base64)
            .split('')
            .map(function (c: string) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
        );
        return JSON.parse(jsonPayload) as JwtPayload;
      } catch (e) {
        return null;
      }
    }

    interface RemoveCookieOptions {
      path?: string;
      domain?: string;
    }

    function removeCookie(name: string, options?: RemoveCookieOptions): void {
      let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      if (options?.domain) {
        cookieString += ` domain=${options.domain};`;
      }
      if (options?.path) {
        cookieString += ` path=${options.path};`;
      }
      document.cookie = cookieString;
    }

    // Rutas públicas que no requieren token
    const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/enrollment-form'];

    function checkToken() {
      const token = getCookie('token');
      const isPublic = publicRoutes.some((r) => location.pathname.startsWith(r));

      if (!token) {
        if (!isPublic) navigate('/login');
        return;
      }

      const payload = parseJwt(token);
      if (!payload || !payload.exp) {
        removeCookie('token');
        if (!isPublic) navigate('/login');
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        removeCookie('token');
        if (!isPublic) navigate('/login');
        return;
      }

      // Si tienes un token y estás intentando acceder a una ruta pública, redirige al dashboard
      if (isPublic) {
        navigate('/leads/SalesProcess', { replace: true });
      }

      // Set timer to auto logout when token expires
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        removeCookie('token');
        if (!isPublic) navigate('/login');
      }, (payload.exp - now) * 1000);
    }

    checkToken();
    const interval = setInterval(checkToken, 2000);
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location, navigate]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/enrollment-form" element={<EnrollmentForm />} />

      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/leads/Opportunities" element={<OpportunitiesInterface />} />
          <Route path="/leads/SalesProcess" element={<CRMSalesProcess />} />
          <Route path="/leads/CreateClient" element={<CreateClient />} />
          <Route path="/leads/CreateOpportunity" element={<CreateOpportunity />} />
          <Route path="/leads/SelectClient" element={<SelectClient />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leads/oportunidades/:id" element={<Leads />} />
          <Route path="/leads/oportunidad/:id" element={<Oportunidad />} />
          <Route path="/leads/asignacion" element={<Asignacion />} />

          <Route path="usuarios/usuarios" element={<Usuarios />} />

        </Route>
      </Route>

      {/* Redirige la raíz a login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App