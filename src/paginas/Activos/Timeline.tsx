import { ClockCircleOutlined } from "@ant-design/icons";
import styles from "./Timeline.module.css";

interface Evento {
  id: number;
  tipo: string;
  detalle: string;
  fechaHora: string;
  color: string;
}

interface TimelineProps {
  eventos: Evento[];
}

const getEventoIcon = (tipo: string, color: string) => {
  const colorMap: Record<string, string> = {
    blue: "#1677ff",
    green: "#52c41a",
    red: "#ff4d4f",
    orange: "#faad14",
    default: "#8c8c8c",
  };

  const iconColor = colorMap[color] || colorMap.default;

  if (tipo === "description" || tipo === "testing") {
    return (
      <div className={styles.iconContainer} style={{ color: iconColor }}>
        <ClockCircleOutlined />
      </div>
    );
  }

  return (
    <div
      className={styles.circleIcon}
      style={{ backgroundColor: iconColor }}
    />
  );
};

export default function Timeline({ eventos }: TimelineProps) {
  if (eventos.length === 0) {
    return (
      <div className={styles.emptyTimeline}>
        No hay eventos registrados
      </div>
    );
  }

  return (
    <div className={styles.timelineContainer}>
      {eventos.map((evento, index) => {
        const fecha = new Date(evento.fechaHora);
        const fechaFormateada = fecha.toLocaleDateString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });

        return (
          <div key={evento.id} className={styles.timelineItem}>
            <div className={styles.timelineLine}>
              {getEventoIcon(evento.tipo, evento.color)}
              {index < eventos.length - 1 && (
                <div className={styles.timelineConnector} />
              )}
            </div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineDate}>{fechaFormateada}</div>
              <div className={styles.timelineDetail}>{evento.detalle}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
