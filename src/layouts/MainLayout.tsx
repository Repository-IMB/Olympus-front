import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import {
  Layout,
  Dropdown,
  Button,
  Drawer,
  type MenuProps,
  notification,
  Spin,
} from "antd";
import { useRecordatoriosGlobales } from "../hooks/useRecordatoriosGlobales";
import { useBreakpoint } from "../hooks/useBreakpoint";
import Sidebar from "../componentes/Sidebar/Sidebar";
import api from "../servicios/api";
import styles from "./MainLayout.module.css";

const { Sider, Header, Content } = Layout;

interface TokenData {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
}

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // =========================
  // Estados existentes
  // =========================
  const [userName, setUserName] = useState("Usuario");
  const [userRole, setUserRole] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>("Leads");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [previousPath, setPreviousPath] = useState<string>("");
  const [apiNotification, contextHolder] = notification.useNotification();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [idUsuario, setIdUsuario] = useState<number>(0);

  // =========================
  // NUEVO: contexto real del usuario
  // =========================
  const [userContext, setUserContext] = useState<any>(null);
  const [loadingContext, setLoadingContext] = useState(true);

  // =========================
  // Detectar ruta de detalle
  // =========================
  const isDetailRoute = location.pathname.match(
    /^\/leads\/oportunidad(es)?\/\d+$/
  );

  // =========================
  // Leer info básica desde JWT (visual)
  // =========================
  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) return;

    try {
      const decoded: TokenData = jwtDecode(token);

      setUserName(
        decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
          "Usuario"
      );

      setUserRole(
        decoded[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ] || ""
      );

      const id =
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ];

      if (id) setIdUsuario(Number(id));
    } catch (error) {
      console.error("Error al decodificar token:", error);
    }
  }, []);

  // =========================
  // NUEVO: obtener contexto real (rol + área + permisos)
  // =========================
  useEffect(() => {
    if (!idUsuario) return;

    const fetchUserContext = async () => {
      try {
        const res = await api.get(`api/CFGModPermisos/contexto/${idUsuario}`);
        setUserContext(res.data);
      } catch (error) {
        console.error("Error al obtener contexto del usuario", error);
        setUserContext(null);
      } finally {
        setLoadingContext(false);
      }
    };

    fetchUserContext();
  }, [idUsuario]);

  // =========================
  // Recordatorios globales
  // =========================
  useRecordatoriosGlobales(idUsuario, apiNotification, navigate);

  // =========================
  // Inicializar estado según breakpoint
  // =========================
  useEffect(() => {
    if (isDesktop) setIsCollapsed(false);
    else if (isTablet) setIsCollapsed(true);
  }, [isDesktop, isTablet]);

  // =========================
  // Colapsar menú en rutas de detalle
  // =========================
  useEffect(() => {
    const wasDetailRoute = previousPath.match(
      /^\/leads\/oportunidad(es)?\/\d+$/
    );

    if (isDetailRoute && !wasDetailRoute) {
      if (isMobile) setIsDrawerOpen(false);
      else setIsCollapsed(true);
    }

    setPreviousPath(location.pathname);
  }, [location.pathname, isDetailRoute, isMobile, previousPath]);

  // =========================
  // Acciones
  // =========================
  const handleLogout = () => {
    Cookies.remove("token");
    navigate("/login");
  };

  const handleToggle = () => {
    if (isMobile) setIsDrawerOpen(!isDrawerOpen);
    else setIsCollapsed(!isCollapsed);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) setIsDrawerOpen(false);
  };

  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  // =========================
  // Menú usuario (header)
  // =========================
  const userMenuItems: MenuProps["items"] = [
    {
      key: "info",
      label: (
        <div style={{ padding: "6px 8px" }}>
          <div style={{ fontWeight: 600 }}>{userName}</div>
          <div style={{ fontSize: 13, color: "#666" }}>{userRole}</div>
        </div>
      ),
      disabled: true,
    },
    { type: "divider" },
    {
      key: "logout",
      label: (
        <div
          onClick={handleLogout}
          style={{
            color: "red",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <LogoutOutlined /> Cerrar sesión
        </div>
      ),
    },
  ];

  // =========================
  // Props para Sidebar
  // =========================
  const sidebarProps = {
    userName,
    userRole,
    userContext, // 👈 CLAVE PARA PERMISOS
    onNavigate: handleNavigate,
    currentPath: location.pathname,
    openMenu,
    onToggleMenu: toggleMenu,
  };

  // =========================
  // Loading inicial
  // =========================
  if (loadingContext) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  // =========================
  // Render
  // =========================
  return (
    <Layout className={styles.layout}>
      {contextHolder}

      {/* Desktop / Tablet */}
      {!isMobile && (
        <Sider
          className={styles.sider}
          collapsed={isCollapsed}
          collapsedWidth={0}
          width={200}
          trigger={null}
        >
          <div className={styles.siderContent}>
            <Sidebar {...sidebarProps} />
          </div>
        </Sider>
      )}

      {/* Mobile */}
      {isMobile && (
        <Drawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          placement="left"
          width={200}
          styles={{ body: { padding: 0 } }}
        >
          <div className={styles.siderContent}>
            <Sidebar {...sidebarProps} />
          </div>
        </Drawer>
      )}

      <Layout>
        {/* Header */}
        <Header className={styles.header}>
          <Button
            type="text"
            onClick={handleToggle}
            icon={
              isMobile || isCollapsed ? (
                <MenuUnfoldOutlined />
              ) : (
                <MenuFoldOutlined />
              )
            }
          />

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className={styles.userAvatar}>
              <UserOutlined />
            </div>
          </Dropdown>
        </Header>

        {/* Content */}
        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
