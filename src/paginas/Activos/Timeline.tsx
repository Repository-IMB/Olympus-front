import { ClockCircleOutlined } from "@ant-design/icons";
import styles from "./Timeline.module.css";
import type { Evento } from "./TipoActivos";

interface TimelineProps {
  eventos: Evento[];
}

const colorByTipo: Record<Evento["tipo"], string> = {
  create: "green",
  update: "orange",
  assignment: "blue",
};


const getEventoIcon = (tipo: Evento["tipo"]) => {
  const colorMap: Record<string, string> = {
    blue: "#1677ff",
    green: "#52c41a",
    orange: "#faad14",
    red: "#ff4d4f",
    default: "#8c8c8c",
  };

  const iconColor = colorMap[colorByTipo[tipo]] ?? colorMap.default;

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
              {getEventoIcon(evento.tipo)}
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
