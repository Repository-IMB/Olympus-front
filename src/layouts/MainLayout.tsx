import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { Layout, Dropdown, Button, Drawer, notification, Spin } from "antd";
import { useRecordatoriosGlobales } from "../hooks/useRecordatoriosGlobales";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { usePermisosMenu } from "../hooks/usePermisosMenu";
import Sidebar from "../componentes/Sidebar/Sidebar";
import styles from "./MainLayout.module.css";
import { UserContext } from "../context/UserContext";

const { Sider, Header, Content } = Layout;

// 🔹 Interfaz para el JWT decodificado
interface JwtPayload {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role": string;
  IdRol: string;
  NombreRol: string;
  CodigoArea: string;
  AccesoTotal: string;
  IdPersonal?: string;
}

// 🔹 Interfaz para el contexto del usuario
export interface UserContextType {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  idRol: number;
  areaCodigo: string;
  accesoTotal: boolean;
  idPersonal: number | null;
}

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [userName, setUserName] = useState("Usuario");
  const [openMenu, setOpenMenu] = useState<string | null>("Leads");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [apiNotification, contextHolder] = notification.useNotification();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [idUsuario, setIdUsuario] = useState<number>(0);
  const [userContext, setUserContext] = useState<UserContextType | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);

  /* ========= Leer y decodificar token JWT ========= */
  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      setLoadingContext(false);
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);

      const nombre = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ?? "Usuario";
      const id = parseInt(decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]);
      
      setUserName(nombre);
      setIdUsuario(id);

      // 🔹 Crear contexto desde el JWT (SIN llamada al backend)
      const context: UserContextType = {
        id: id,
        nombre: nombre,
        correo: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ?? "",
        rol: decoded.NombreRol ?? "",
        idRol: parseInt(decoded.IdRol ?? "0"),
        areaCodigo: decoded.CodigoArea ?? "",
        accesoTotal: decoded.AccesoTotal === "True",
        idPersonal: decoded.IdPersonal ? parseInt(decoded.IdPersonal) : null,
      };

      setUserContext(context);
      setLoadingContext(false);
    } catch (error) {
      console.error("Error al decodificar token:", error);
      setLoadingContext(false);
      // Opcional: redirigir al login si el token es inválido
      // navigate("/login");
    }
  }, []);

  const permisos = usePermisosMenu(userContext);

  useRecordatoriosGlobales(idUsuario, apiNotification, navigate);

  useEffect(() => {
    if (isDesktop) setIsCollapsed(false);
    else if (isTablet) setIsCollapsed(true);
  }, [isDesktop, isTablet]);

  const handleLogout = () => {
    Cookies.remove("token");
    navigate("/login");
  };

  const handleNavigate = (path: string) => {
    navigate(path);

    // 📱 Mobile → cerrar Drawer
    if (isMobile) {
      setIsDrawerOpen(false);
    }

    // 🖥 Desktop / Tablet → colapsar sidebar
    if (!isMobile) {
      setIsCollapsed(true);
    }

    // cerrar submenús
    setOpenMenu(null);
  };

  if (loadingContext) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ userContext }}>
      <Layout className={styles.layout}>
        {contextHolder}

        {!isMobile && (
          <Sider collapsed={isCollapsed} collapsedWidth={0} width={220}>
            <Sidebar
              permisos={permisos}
              onNavigate={handleNavigate}
              currentPath={location.pathname}
              openMenu={openMenu}
              onToggleMenu={setOpenMenu}
            />
          </Sider>
        )}

        {isMobile && (
          <Drawer
            open={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            placement="left"
            width={220}
          >
            <Sidebar
              permisos={permisos}
              onNavigate={handleNavigate}
              currentPath={location.pathname}
              openMenu={openMenu}
              onToggleMenu={setOpenMenu}
            />
          </Drawer>
        )}

        <Layout>
          <Header className={styles.header}>
            <Button
              type="text"
              onClick={() => {
                if (isMobile) {
                  setIsDrawerOpen(!isDrawerOpen);
                } else {
                  setIsCollapsed(!isCollapsed);
                }
              }}
              icon={isCollapsed || !isDrawerOpen ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            />

            <Dropdown
              menu={{
                items: [
                  {
                    key: "info",
                    label: <strong>{userName}</strong>,
                    disabled: true,
                  },
                  { type: "divider" },
                  {
                    key: "logout",
                    label: (
                      <span onClick={handleLogout} style={{ color: "red" }}>
                        <LogoutOutlined /> Cerrar sesión
                      </span>
                    ),
                  },
                ],
              }}
            >
              <UserOutlined />
            </Dropdown>
          </Header>

          <Content className={styles.content}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </UserContext.Provider>
  );
}