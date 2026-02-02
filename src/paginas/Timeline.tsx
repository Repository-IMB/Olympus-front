import { Timeline as AntTimeline, Tag } from "antd";
import {
  UserSwitchOutlined,
  EditOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import moment from "moment";
import styles from "./Timeline.module.css";

interface Evento {
  id: number;
  tipo: string;
  detalle: string;
  fechaHora: string;
  responsable?: string;
}

interface Props {
  eventos: Evento[];
}

const iconByType = {
  assignment: <UserSwitchOutlined />,
  update: <EditOutlined />,
  create: <PlusCircleOutlined />,
};

const colorByType = {
  assignment: "blue",
  update: "orange",
  create: "green",
};

export default function Timeline({ eventos }: Props) {
  if (!eventos.length) {
    return <div className={styles.empty}>Sin historial registrado</div>;
  }

  return (
    <AntTimeline
      mode="left"
      items={eventos.map((e) => ({
        dot: iconByType[e.tipo as keyof typeof iconByType],
        color: colorByType[e.tipo as keyof typeof colorByType],
        label: moment(e.fechaHora).format("DD/MM/YYYY HH:mm"),
        children: (
          <div className={styles.item}>
            <Tag color={colorByType[e.tipo as keyof typeof colorByType]}>
              {e.tipo === "assignment"
                ? "Asignación"
                : e.tipo === "update"
                ? "Actualización"
                : "Creación"}
            </Tag>

            <div className={styles.detalle}>{e.detalle}</div>

            {e.responsable && (
              <div className={styles.responsable}>
                Responsable: <b>{e.responsable}</b>
              </div>
            )}
          </div>
        ),
      }))}
    />
  );
}
