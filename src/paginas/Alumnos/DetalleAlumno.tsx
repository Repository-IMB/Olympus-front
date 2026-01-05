import { Button, Card, Row, Space, Table, Tag, Col, Checkbox, Tooltip } from "antd";
import { ArrowLeftOutlined, EyeOutlined, EditOutlined, WhatsAppOutlined, MailOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./DetalleAlumno.module.css";
import ModalEditarAlumno from "./ModalAlumno";
import { useState } from "react";



/* =========================
   MOCK ALUMNO
   ========================= */
const alumno = {
  nombre: "Juan",
  apellido: "Pérez",
  correo: "alumno@mail.com",
  telefono: "+54 11 1234 5678",
  pais: "Argentina",
  documento: "30123456",
  codigoCurso: "PROG-101",
  areaTrabajo: "IT",
  industria: "Tecnología",
  cargo: "Developer",
  accesoMoodle: "usuario.moodle",
  passwordMoodle: "********",
};


/* =========================
   MOCK CERTIFICACIONES
   ========================= */
const certificaciones = [
  {
    id: 1,
    modulo: "Introducción",
    nivel: "I",
    codigo: "CERT001",
    enviado: true,
    estado: "Activo",
  },
  {
    id: 2,
    modulo: "SQL Avanzado",
    nivel: "II",
    codigo: "CERT002",
    enviado: false,
    estado: "Pendiente",
  },
];

export default function DetalleAlumno() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [modalEditarOpen, setModalEditarOpen] = useState(false);

  const columns = [
    {
        title: "Módulo",
        dataIndex: "modulo",
        key: "modulo",
        sorter: (a: any, b: any) => a.modulo.localeCompare(b.modulo),
    },
    {
        title: "Nivel",
        dataIndex: "nivel",
        key: "nivel",
        sorter: (a: any, b: any) => a.nivel.localeCompare(b.nivel),
    },
    {
        title: "Código",
        dataIndex: "codigo",
        key: "codigo",
        sorter: (a: any, b: any) => a.codigo.localeCompare(b.codigo),
    },
    {
        title: "Emisión",
        dataIndex: "emision",
        key: "emision",
        align: "center",
        sorter: (a: any, b: any) => Number(a.emision) - Number(b.emision),
        render: (value: boolean) => (
        <Checkbox checked={value} disabled />
        ),
    },
    {
        title: "Envío",
        dataIndex: "envio",
        key: "envio",
        align: "center",
        sorter: (a: any, b: any) => Number(a.envio) - Number(b.envio),
        render: (value: boolean) => (
        <Checkbox checked={value} disabled />
        ),
    },
    {
        title: "Acciones",
        key: "acciones",
        align: "center",
        render: (_: any, record: any) => (
        <Space size="middle">
            <Tooltip title="Editar">
                <Button
                icon={<EditOutlined />}
                className={styles.iconDarkButton}
                onClick={() => onEditarCertificacion(record)}
                />
            </Tooltip>
            <Tooltip title="Eliminar">
                <Button
                icon={<DeleteOutlined />}
                className={styles.iconDarkButton}
                onClick={() => onEliminarCertificacion(record)}
                />
            </Tooltip>
        </Space>
        ),
    },
    ];


  return (
    <div className={styles.container}>
      {/* VOLVER */}
      <Button
        icon={<ArrowLeftOutlined />}
        style={{ marginBottom: 16 }}
        onClick={() => navigate(-1)}
      >
        Volver
      </Button>

      {/* DATOS DEL ALUMNO */}
      <Card style={{ marginBottom: 16 }}>
        <h3 className={styles.title}>{alumno.nombre + " " + alumno.apellido}</h3>

        <div className={styles.infoList}>
        <div className={styles.infoItem}>
            <span className={styles.label}>Correo:</span>
            <span className={styles.value}>{alumno.correo}</span>
        </div>

        <div className={styles.infoItem}>
            <span className={styles.label}>Teléfono:</span>
            <span className={styles.value}>{alumno.telefono}</span>
        </div>

        <div className={styles.infoItem}>
            <span className={styles.label}>País:</span>
            <span className={styles.value}>{alumno.pais}</span>
        </div>

        <div className={styles.infoItem}>
            <span className={styles.label}>Documento de identidad:</span>
            <span className={styles.value}>{alumno.documento}</span>
        </div>

        <div className={styles.infoItem}>
            <span className={styles.label}>Código del curso:</span>
            <span className={styles.value}>{alumno.codigoCurso}</span>
        </div>

        <div className={styles.infoItem}>
            <span className={styles.label}>Área de trabajo:</span>
            <span className={styles.value}>
            {alumno.areaTrabajo} · {alumno.industria} · {alumno.cargo}
            </span>
        </div>

        <div className={styles.infoItem}>
            <span className={styles.label}>Acceso Moodle:</span>
            <span className={styles.value}>{alumno.accesoMoodle}</span>
        </div>

        <div className={styles.infoItem}>
            <span className={styles.label}>Contraseña Moodle:</span>
            <span className={styles.value}>{alumno.passwordMoodle}</span>
        </div>
        </div>

        <Row gutter={16} style={{ marginTop: 24 }}>
            <Col span={8}>
                <Button
                block
                icon={<EditOutlined />}
                size="large"
                style={{ 
                backgroundColor: '#1f1f1f',
                borderColor: '#1f1f1f',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
                }}
                onClick={() => setModalEditarOpen(true)}
                >
                Editar
                </Button>
            </Col>

            <Col span={8}>
                <Button
                block
                icon={<MailOutlined />}
                size="large"
                style={{ 
                backgroundColor: '#1f1f1f',
                borderColor: '#1f1f1f',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
                }}
                >
                Enviar correo
                </Button>
            </Col>

            <Col span={8}>
                <Button
                block
                icon={<WhatsAppOutlined />}
                size="large"
                style={{ 
                backgroundColor: '#1f1f1f',
                borderColor: '#1f1f1f',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
                }}
                >
                Enviar WhatsApp
                </Button>
            </Col>
        </Row>
      </Card>

      {/* CERTIFICACIONES */}
      <Card style={{ marginBottom: 16 }}>
        <div
            style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            }}
        >
            <h4 className={styles.title} style={{ margin: 0 }}>
            Certificaciones del alumno
            </h4>

            <Button
            type="primary"
            className={styles.darkButton}
            onClick={() => setModalCertificacionOpen(true)}
            >
            Agregar certificación
            </Button>
        </div>

        <Table
            dataSource={certificaciones}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
        />
        </Card>
        <ModalEditarAlumno
          open={modalEditarOpen}
          alumno={alumno}
          onCancel={() => setModalEditarOpen(false)}
          onSave={(alumnoEditado) => {
            console.log("Alumno editado:", alumnoEditado);
            setModalEditarOpen(false);
          }}
        />
    </div>
    
  );
}

/* =========================
   ITEM AUXILIAR
   ========================= */
function Item({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <strong>{label}:</strong> {value}
    </div>
  );
}
