import {
  PhoneOutlined,
  UserOutlined,
  HeartFilled,
  CaretDownOutlined,
  CaretUpOutlined,
  AppstoreOutlined,
  DashboardOutlined,
  ContainerOutlined,
  BookOutlined,
  ReadOutlined,
  IdcardOutlined,
  DesktopOutlined,
  TeamOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import styles from "./Sidebar.module.css";
import type { PermisosMenu } from "../../hooks/usePermisosMenu";

interface SidebarProps {
  permisos: PermisosMenu;
  onNavigate: (path: string) => void;
  currentPath: string;
  openMenu: string | null;
  onToggleMenu: (menu: string | null) => void;
}

export default function Sidebar({
  permisos,
  onNavigate,
  currentPath,
  openMenu,
  onToggleMenu,
}: SidebarProps) {
  const isActive = (path: string) =>
    currentPath === path || currentPath.startsWith(path + "/");

  const puedeVerLeads = permisos.leads || permisos.asignacion;

  // ✅ Navega y CIERRA el menú lateral
  const navigateAndClose = (path: string) => {
    onNavigate(path);
    onToggleMenu(null);
  };

  return (
    <div className={styles.container}>
      {/* LOGO */}
      <div className={styles.logoSection}>
        <img src="/logo.png" alt="Olympus" className={styles.logo} />
        <div className={styles.logoText}>Olympus</div>
      </div>

      <div className={styles.menuContainer}>
        {/* ================= DASHBOARD ================= */}
        <div
          className={`${styles.menuItem} ${
            isActive("/") || isActive("/dashboard")
              ? styles.menuItemActive
              : ""
          }`}
          onClick={() => navigateAndClose("/")}
        >
          <DashboardOutlined /> Dashboard
        </div>

        {/* ================= LEADS ================= */}
        {puedeVerLeads && (
          <div className={styles.menuSection}>
            <div
              className={styles.menuHeader}
              onClick={() =>
                onToggleMenu(openMenu === "Leads" ? null : "Leads")
              }
            >
              <span className={styles.menuHeaderContent}>
                <PhoneOutlined /> Leads
              </span>
              {openMenu === "Leads" ? (
                <CaretUpOutlined />
              ) : (
                <CaretDownOutlined />
              )}
            </div>

            {openMenu === "Leads" && (
              <div className={styles.menuItems}>
                {permisos.leads && (
                  <div
                    className={`${styles.menuItem} ${
                      isActive("/leads/SalesProcess")
                        ? styles.menuItemActive
                        : ""
                    }`}
                    onClick={() =>
                      navigateAndClose("/leads/SalesProcess")
                    }
                  >
                    <AppstoreOutlined /> Oportunidades
                  </div>
                )}

                {permisos.asignacion && (
                  <div
                    className={`${styles.menuItem} ${
                      isActive("/leads/asignacion") ? styles.menuItemActive : ""
                    }`}
                    onClick={() =>
                      navigateAndClose("/leads/asignacion")
                    }
                  >
                    <DashboardOutlined /> Asignación
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============ DESARROLLO DE PRODUCTO ============ */}
        {permisos.desarrollo && (
          <div className={styles.menuSection}>
            <div
              className={styles.menuHeader}
              onClick={() =>
                onToggleMenu(
                  openMenu === "Desarrollo" ? null : "Desarrollo"
                )
              }
            >
              <span className={styles.menuHeaderContent}>
                <HeartFilled /> Desarrollo de producto
              </span>
              {openMenu === "Desarrollo" ? (
                <CaretUpOutlined />
              ) : (
                <CaretDownOutlined />
              )}
            </div>

            {openMenu === "Desarrollo" && (
              <div className={styles.menuItems}>
                <div
                  className={`${styles.menuItem} ${
                    isActive("/producto/departamentos")
                      ? styles.menuItemActive
                      : ""
                  }`}
                  onClick={() => onNavigate("/producto/departamentos")}
                >
                  <ContainerOutlined /> Departamentos
                </div>

                <div
                  className={`${styles.menuItem} ${
                    isActive("/producto/docentes")
                      ? styles.menuItemActive
                      : ""
                  }`}
                  onClick={() => onNavigate("/producto/docentes")}
                >
                  <BookOutlined /> Docentes
                </div>

                <div
                  className={`${styles.menuItem} ${
                    isActive("/producto/modulos")
                      ? styles.menuItemActive
                      : ""
                  }`}
                  onClick={() => onNavigate("/producto/modulos")}
                >
                  <BlockOutlined /> Módulos
                </div>
                <div
                  className={`${styles.menuItem} ${
                    isActive("/producto/productos")
                      ? styles.menuItemActive
                      : ""
                  }`}
                  onClick={() => onNavigate("/producto/productos")}
                >
                  <ReadOutlined /> Productos
                </div>

                <div
                  className={`${styles.menuItem} ${
                    isActive("/producto/alumnos")
                      ? styles.menuItemActive
                      : ""
                  }`}
                  onClick={() => onNavigate("/producto/alumnos")}
                >
                  <IdcardOutlined /> Alumnos
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= LOGÍSTICA ================= */}
        {permisos.logistica && (
          <div className={styles.menuSection}>
            <div
              className={styles.menuHeader}
              onClick={() =>
                navigateAndClose("/logistica/activos")
              }
            >
              <span className={styles.menuHeaderContent}>
                <ContainerOutlined /> Gestión de activos
              </span>
              {openMenu === "Logistica" ? (
                <CaretUpOutlined />
              ) : (
                <CaretDownOutlined />
              )}
            </div>

            {openMenu === "Logistica" && (
              <div className={styles.menuItems}>
                <div
                  className={`${styles.menuItem} ${
                    isActive("/logistica/activos")
                      ? styles.menuItemActive
                      : ""
                  }`}
                  onClick={() => onNavigate("/logistica/activos")}
                >
                  <DesktopOutlined /> Activos
                </div>
                <div
                  className={`${styles.menuItem} ${
                    isActive("/logistica/personal")
                      ? styles.menuItemActive
                      : ""
                  }`}
                  onClick={() => onNavigate("/logistica/personal")}
                >
                  <TeamOutlined /> Personal
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= RECURSOS HUMANOS ================= */}
        {permisos.recursosHumanos && (
          <div className={styles.menuSection}>
            <div
              className={styles.menuHeader}
              onClick={() =>
                onToggleMenu(openMenu === "RRHH" ? null : "RRHH")
              }
            >
              <span className={styles.menuHeaderContent}>
                <TeamOutlined /> Recursos humanos
              </span>
              {openMenu === "RRHH" ? (
                <CaretUpOutlined />
              ) : (
                <CaretDownOutlined />
              )}
            </div>

            {openMenu === "RRHH" && (
              <div className={styles.menuItems}>
                <div
                  className={`${styles.menuItem} ${
                    isActive("/rrhh/personal")
                      ? styles.menuItemActive
                      : ""
                  }`}
                  onClick={() => onNavigate("/rrhh/personal")}
                >
                  <UserOutlined /> Personal
                </div>
                <div
                  className={`${styles.menuItem} ${
                    isActive("/rrhh/contratos")
                      ? styles.menuItemActive
                      : ""
                  }`}
                  onClick={() => onNavigate("/rrhh/contratos")}
                >
                  <FileTextOutlined /> Contratos
                </div>
                <div
                  className={`${styles.menuItem} ${
                    isActive("/rrhh/permisos")
                      ? styles.menuItemActive
                      : ""
                  }`}
                  onClick={() => onNavigate("/rrhh/permisos")}
                >
                  <SafetyCertificateOutlined /> Permisos
                </div>
                <div
                  className={`${styles.menuItem} ${
                    isActive("/rrhh/vacaciones")
                      ? styles.menuItemActive
                      : ""
                  }`}
                  onClick={() => onNavigate("/rrhh/vacaciones")}
                >
                  <CalendarOutlined /> Vacaciones
                </div>
                <div
                  className={`${styles.menuItem} ${
                    isActive("/rrhh/asistencia")
                      ? styles.menuItemActive
                      : ""
                  }`}
                  onClick={() => onNavigate("/rrhh/asistencia")}
                >
                  <ClockCircleOutlined /> Asistencia
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= RECURSOS HUMANOS ================= */}
        {permisos.recursosHumanos && (
          <div className={styles.menuSection}>
            <div
              className={styles.menuHeader}
              onClick={() =>
                onToggleMenu(openMenu === "RRHH" ? null : "RRHH")
              }
            >
              <span className={styles.menuHeaderContent}>
                <TeamOutlined /> Recursos humanos
              </span>
              {openMenu === "RRHH" ? (
                <CaretUpOutlined />
              ) : (
                <CaretDownOutlined />
              )}
            </div>

            {openMenu === "RRHH" && (
              <div className={styles.menuItems}>
                <div
                  className={`${styles.menuItem} ${
                    isActive("/rrhh/personal")
                      ? styles.menuItemActive
                      : ""
                  }`}
                  onClick={() => onNavigate("/rrhh/personal")}
                >
                  <UserOutlined /> Personal
                </div>
                <div
                  className={`${styles.menuItem} ${
                    isActive("/rrhh/contratos")
                      ? styles.menuItemActive
                      : ""
                  }`}
                  onClick={() => onNavigate("/rrhh/contratos")}
                >
                  <FileTextOutlined /> Contratos
                </div>
                <div
                  className={`${styles.menuItem} ${
                    isActive("/rrhh/permisos")
                      ? styles.menuItemActive
                      : ""
                  }`}
                  onClick={() => onNavigate("/rrhh/permisos")}
                >
                  <SafetyCertificateOutlined /> Permisos
                </div>
                <div
                  className={`${styles.menuItem} ${
                    isActive("/rrhh/vacaciones")
                      ? styles.menuItemActive
                      : ""
                  }`}
                  onClick={() => onNavigate("/rrhh/vacaciones")}
                >
                  <CalendarOutlined /> Vacaciones
                </div>
                <div
                  className={`${styles.menuItem} ${
                    isActive("/rrhh/asistencia")
                      ? styles.menuItemActive
                      : ""
                  }`}
                  onClick={() => onNavigate("/rrhh/asistencia")}
                >
                  <ClockCircleOutlined /> Asistencia
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= USUARIOS ================= */}
        {permisos.usuarios && (
          <div className={styles.menuSection}>
            <div
              className={styles.menuHeader}
              onClick={() =>
                onToggleMenu(
                  openMenu === "Usuarios" ? null : "Usuarios"
                )
              }
            >
              <span className={styles.menuHeaderContent}>
                <UserOutlined /> Usuarios
              </span>
              {openMenu === "Usuarios" ? (
                <CaretUpOutlined />
              ) : (
                <CaretDownOutlined />
              )}
            </div>

            {openMenu === "Usuarios" && (
              <div className={styles.menuItems}>
                <div
                  className={`${styles.menuItem} ${
                    isActive("/usuarios/usuarios") ? styles.menuItemActive : ""
                  }`}
                  onClick={() =>
                    navigateAndClose("/usuarios/usuarios")
                  }
                >
                  <DashboardOutlined /> Mantenimiento
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}