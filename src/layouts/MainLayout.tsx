import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SunOutlined,
  MoonOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { Layout, Dropdown, Button, Drawer, notification, Spin } from "antd";
import { useRecordatoriosGlobales } from "../hooks/useRecordatoriosGlobales";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { usePermisosMenu } from "../hooks/usePermisosMenu";
import Sidebar from "../componentes/Sidebar/Sidebar";
import api from "../servicios/api";
import styles from "./MainLayout.module.css";
import { UserContext } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

const { Sider, Header, Content } = Layout;

interface TokenData {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"?: string;
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
  const [userContext, setUserContext] = useState<any>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const { theme, toggleTheme } = useTheme();

  /* ========= Leer token ========= */
  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) return;

    const decoded: TokenData = jwtDecode(token);

    setUserName(
      decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ??
        "Usuario"
    );

    const id =
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ];
    if (id) setIdUsuario(Number(id));
  }, []);

  /* ========= Contexto real ========= */
  useEffect(() => {
    if (!idUsuario) return;

    const fetchContext = async () => {
      try {
        const res = await api.get(`/api/CFGModPermisos/contexto/${idUsuario}`);
        setUserContext(res.data);
      } catch (e) {
        console.error("Error contexto", e);
        setUserContext(null);
      } finally {
        setLoadingContext(false);
      }
    };

    fetchContext();
  }, [idUsuario]);

  const permisos = usePermisosMenu(userContext);

  
  useRecordatoriosGlobales(idUsuario, apiNotification, navigate);

  useEffect(() => {
    if (isDesktop) setIsCollapsed(false);
    else if (isTablet) setIsCollapsed(true);
  }, [isDesktop, isTablet]);

  /* ========= Cerrar menú al entrar en una oportunidad ========= */
  useEffect(() => {
    if (location.pathname.startsWith("/leads/oportunidades/")) {
      setIsCollapsed(true);
      setIsDrawerOpen(false);
      setOpenMenu(null);
    }
  }, [location.pathname]);

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
          <div style={{ display: "flex", alignItems: "center" }}>
            <Button
              type="text"
              className={styles.hamburgerBtn}
              onClick={() => {
                if (isMobile) {
                  setIsDrawerOpen(!isDrawerOpen);
                } else {
                  setIsCollapsed(!isCollapsed);
                }
              }}
              icon={
                (isMobile ? !isDrawerOpen : isCollapsed)
                  ? <MenuUnfoldOutlined />
                  : <MenuFoldOutlined />
              }
            />
            {location.pathname.startsWith("/leads/oportunidades/") && (
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#595959",
                }}
              >
                Volver
              </Button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Button
              type="text"
              onClick={toggleTheme}
              icon={theme === "light" ? <MoonOutlined /> : <SunOutlined />}
              style={{ fontSize: 18 }}
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
                    icon: <LogoutOutlined />,
                    label: "Cerrar sesión",
                    danger: true,
                    onClick: handleLogout,
                  },
                ],
              }}
            >
              <UserOutlined style={{ fontSize: 18, cursor: "pointer" }} />
            </Dropdown>
          </div>
        </Header>

        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  </UserContext.Provider>
);

}
