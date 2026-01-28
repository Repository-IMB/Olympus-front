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
  DollarOutlined,
  FileTextOutlined,
  FileSearchOutlined,
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

  return (
    <div className={styles.container}>
      {/* LOGO */}
      <div className={styles.logoSection}>
        <img src="/logo.png" alt="Olympus" className={styles.logo} />
        <div className={styles.logoText}>Olympus</div>
      </div>

      <div className={styles.menuContainer}>
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
              {openMenu === "Leads" ? <CaretUpOutlined /> : <CaretDownOutlined />}
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
                    onClick={() => onNavigate("/leads/SalesProcess")}
                  >
                    <AppstoreOutlined /> Oportunidades
                  </div>
                )}

                {permisos.asignacion && (
                  <div
                    className={`${styles.menuItem} ${
                      isActive("/leads/asignacion")
                        ? styles.menuItemActive
                        : ""
                    }`}
                    onClick={() => onNavigate("/leads/asignacion")}
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
                onToggleMenu(openMenu === "Desarrollo" ? null : "Desarrollo")
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
                  className={styles.menuItem}
                  onClick={() => onNavigate("/producto/departamentos")}
                >
                  <ContainerOutlined /> Departamentos
                </div>
                <div
                  className={styles.menuItem}
                  onClick={() => onNavigate("/producto/docentes")}
                >
                  <BookOutlined /> Docentes
                </div>
                <div
                  className={styles.menuItem}
                  onClick={() => onNavigate("/producto/productos")}
                >
                  <ReadOutlined /> Productos
                </div>
                <div
                  className={styles.menuItem}
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
              onClick={() => onNavigate("/logistica/activos")}
            >
              <span className={styles.menuHeaderContent}>
                <ContainerOutlined /> Gestión de activos
              </span>
            </div>
          </div>
        )}

        {/* ================= USUARIOS ================= */}
        {permisos.usuarios && (
          <div className={styles.menuSection}>
            <div
              className={styles.menuHeader}
              onClick={() =>
                onToggleMenu(openMenu === "Usuarios" ? null : "Usuarios")
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
                    isActive("/usuarios/usuarios")
                      ? styles.menuItemActive
                      : ""
                  }`}
                  onClick={() => onNavigate("/usuarios/usuarios")}
                >
                  <DashboardOutlined /> Mantenimiento
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= Sistema contable ================= */}
        {permisos.contabilidad && (
          <div className={styles.menuSection}>
            <div
              className={styles.menuHeader}
              onClick={() => 
                onToggleMenu(openMenu === "Contabilidad" ? null : "Contabilidad")
              }
            >
              <span className={styles.menuHeaderContent}>
                <DollarOutlined /> Contabilidad
              </span>
              {openMenu === "Contabilidad" ? <CaretUpOutlined /> : <CaretDownOutlined />}
            </div>
            {openMenu === "Contabilidad" && (
              <div className={styles.menuItems}>
                {permisos.contabilidad_resumen && (
                  <div
                    className={`${styles.menuItem} ${
                      isActive("/contabilidad/resumen") ? styles.menuItemActive : ""
                    }`}
                    onClick={() => onNavigate("/contabilidad/resumen")}
                  >
                    <DashboardOutlined /> Resumen
                  </div>
                )}
                {permisos.contabilidad_facturacion && (
                  <div
                    className={`${styles.menuItem} ${
                      isActive("/contabilidad/facturacion") ? styles.menuItemActive : ""
                    }`}
                    onClick={() => onNavigate("/contabilidad/facturacion")}
                  >
                    <FileSearchOutlined /> Facturación
                  </div>
                )}
                {permisos.contabilidad_reportes && (
                  <div
                    className={`${styles.menuItem} ${
                      isActive("/contabilidad/reportes") ? styles.menuItemActive : ""
                    }`}
                    onClick={() => onNavigate("/contabilidad/reportes")}
                  >
                    <FileTextOutlined /> Reportes
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
