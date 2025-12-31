import {
  PhoneOutlined,
  UserOutlined,
  HeartFilled,
  CaretDownOutlined,
  CaretUpOutlined,
  AppstoreOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  userName: string;
  userRole: string;
  onNavigate: (path: string) => void;
  currentPath: string;
  openMenu: string | null;
  onToggleMenu: (menu: string) => void;
}

export default function Sidebar({
  userRole,
  onNavigate,
  currentPath,
  openMenu,
  onToggleMenu,
}: SidebarProps) {
  const isActive = (path: string) => currentPath === path;

  const isActiveMultiple = (...paths: string[]) =>
    paths.some((path) => currentPath === path);

  return (
    <div className={styles.container}>
      {/* === LOGO === */}
      <div className={styles.logoSection}>
        <img src="/logo.png" alt="Olympus" className={styles.logo} />
        <div className={styles.logoText}>Olympus</div>
      </div>

      {/* === MENÚ PRINCIPAL === */}
      <div className={styles.menuContainer}>
        {/* SECCIÓN: LEADS */}
        <div className={styles.menuSection}>
          <div
            className={styles.menuHeader}
            onClick={() => onToggleMenu("Leads")}
          >
            <span className={styles.menuHeaderContent}>
              <PhoneOutlined /> Leads
            </span>
            {openMenu === "Leads" ? <CaretUpOutlined /> : <CaretDownOutlined />}
          </div>
          {openMenu === "Leads" && (
            <div className={styles.menuItems}>
              <div
                className={`${styles.menuItem} ${
                  isActiveMultiple("/leads/Opportunities", "/leads/SalesProcess")
                    ? styles.menuItemActive
                    : ""
                }`}
                onClick={() => onNavigate("/leads/SalesProcess")}
              >
                <AppstoreOutlined /> Oportunidades
              </div>
              {userRole !== "Asesor" && (
                <div
                  className={`${styles.menuItem} ${
                    isActive("/leads/asignacion") ? styles.menuItemActive : ""
                  }`}
                  onClick={() => onNavigate("/leads/asignacion")}
                >
                  <DashboardOutlined /> Asignación
                </div>
              )}
              {/* <div
                className={`${styles.menuItem} ${
                  isActive("/leads/dashboard") ? styles.menuItemActive : ""
                }`}
                onClick={() => onNavigate("/leads/dashboard")}
              >
                <DashboardOutlined /> Dashboard
              </div> */}
            </div>
          )}
        </div>

        {/* SECCIÓN: USUARIOS */}
        <div className={styles.menuSection}>
          <div
            className={styles.menuHeader}
            onClick={() => onToggleMenu("Usuarios")}
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
              {userRole !== "Asesor" && (
                <div
                  className={`${styles.menuItem} ${
                    isActive("/usuarios/usuarios") ? styles.menuItemActive : ""
                  }`}
                  onClick={() => onNavigate("/usuarios/usuarios")}
                >
                  <DashboardOutlined /> Mantenimiento
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECCIÓN: Desarrollo de producto */}
        <div className={styles.menuSection}>
          <div
            className={styles.menuHeader}
            onClick={() => onToggleMenu("Desarrollo")}
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
        </div>
      </div>
    </div>
  );
}
