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
import { Layout, Dropdown, Button, Drawer, type MenuProps, notification } from "antd";
import { useRecordatoriosGlobales } from "../hooks/useRecordatoriosGlobales";
import { useBreakpoint } from "../hooks/useBreakpoint";
import Sidebar from "../componentes/Sidebar/Sidebar";
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

  const [userName, setUserName] = useState("Usuario");
  const [userRole, setUserRole] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>("Leads");
  const [isCollapsed, setIsCollapsed] = useState(false); // Sider (desktop/tablet)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Drawer (mobile)
  const [previousPath, setPreviousPath] = useState<string>("");
  const [apiNotification, contextHolder] = notification.useNotification();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  // Detectar si estamos en una ruta de detalle (oportunidades/:id)
  const isDetailRoute = location.pathname.match(
    /^\/leads\/oportunidad(es)?\/\d+$/
  );
  const [idUsuario, setIdUsuario] = useState<number>(0);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      try {
        const decoded: TokenData = jwtDecode(token);

        setUserName(
          decoded[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
          ] || "Usuario"
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

        if (id) {
          setIdUsuario(Number(id));
        }
      } catch (error) {
        console.error("Error al decodificar token:", error);
      }
    }
  }, []);

  useRecordatoriosGlobales(idUsuario, apiNotification, navigate);

  // Inicializar estado según breakpoint
  useEffect(() => {
    if (isDesktop) {
      setIsCollapsed(false); // Expandido en desktop
    } else if (isTablet) {
      setIsCollapsed(true); // Colapsado en tablet
    }
  }, [isDesktop, isTablet]);

  // Colapsar sidebar/drawer automáticamente cuando ENTRAMOS a una ruta de detalle
  useEffect(() => {
    const wasDetailRoute = previousPath.match(/^\/leads\/oportunidad(es)?\/\d+$/);

    if (isDetailRoute && !wasDetailRoute) {
      if (isMobile) {
        setIsDrawerOpen(false); // Cerrar drawer en mobile
      } else {
        setIsCollapsed(true); // Colapsar sidebar en tablet/desktop
      }
    }

    setPreviousPath(location.pathname);
  }, [location.pathname, isDetailRoute, isMobile, previousPath]);

  const handleLogout = () => {
    Cookies.remove("token");
    navigate("/login");
  };

  const handleToggle = () => {
    if (isMobile) {
      setIsDrawerOpen(!isDrawerOpen); // Abre/cierra drawer
    } else {
      setIsCollapsed(!isCollapsed); // Colapsa/expande sider
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      setIsDrawerOpen(false); // Cerrar drawer después de navegar
    }
  };

  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

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

  const sidebarProps = {
    userName,
    userRole,
    onNavigate: handleNavigate,
    currentPath: location.pathname,
    openMenu,
    onToggleMenu: toggleMenu,
  };

  return (
    <Layout className={styles.layout}>
      {contextHolder} 
      {/* Desktop/Tablet: Sider */}
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

      {/* Mobile: Drawer */}
      {isMobile && (
        <Drawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          placement="left"
          width={200}
          styles={{
            body: { padding: 0 },
          }}
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
              isMobile ? (
                <MenuUnfoldOutlined />
              ) : isCollapsed ? (
                <MenuUnfoldOutlined />
              ) : (
                <MenuFoldOutlined />
              )
            }
            aria-label={isMobile ? "Abrir menú" : "Colapsar sidebar"}
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
