import { Timeline as AntTimeline, Tag } from "antd";
import {
  UserSwitchOutlined,
  EditOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import moment from "moment";
import type { ReactNode } from "react";

/* =========================
   TIPOS
========================= */

export type EventoTimeline = {
  id: number;
  tipo: "create" | "update" | "assignment";
  detalle: string;
  fechaHora: string;
  responsable?: string;
};

interface AntdTimelineWrapperProps {
  eventos: EventoTimeline[];
}

/* =========================
   UI MAPS
========================= */

const iconByType: Record<EventoTimeline["tipo"], ReactNode> = {
  assignment: <UserSwitchOutlined />,
  update: <EditOutlined />,
  create: <PlusCircleOutlined />,
};

const colorByType: Record<EventoTimeline["tipo"], string> = {
  assignment: "blue",
  update: "orange",
  create: "green",
};

/* =========================
   COMPONENT
========================= */

export default function AntdTimelineWrapper({
  eventos,
}: AntdTimelineWrapperProps) {
  if (!eventos || eventos.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#999" }}>
        Sin historial registrado
      </div>
    );
  }

  return (
    <AntTimeline mode="left">
      {eventos.map((e) => (
        <AntTimeline.Item
          key={e.id}
          dot={iconByType[e.tipo]}
          color={colorByType[e.tipo]}
          label={moment(e.fechaHora).format("DD/MM/YYYY HH:mm")}
        >
          <div>
            <Tag color={colorByType[e.tipo]}>
              {e.tipo === "assignment"
                ? "Asignación"
                : e.tipo === "update"
                ? "Actualización"
                : "Creación"}
            </Tag>

            <div style={{ marginTop: 4 }}>{e.detalle}</div>

            {e.responsable && (
              <div style={{ marginTop: 4, fontSize: 12, color: "#666" }}>
                Responsable: <b>{e.responsable}</b>
              </div>
            )}
          </div>
        </AntTimeline.Item>
      ))}
    </AntTimeline>
  );
}
